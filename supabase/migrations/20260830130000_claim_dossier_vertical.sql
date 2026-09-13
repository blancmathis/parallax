-- Claim dossier vertical: authenticated capture -> structured submission ->
-- reasoned review -> exact draft diff -> separately reviewed publication.
--
-- This migration deliberately does not reuse merge_contribution(): that legacy
-- RPC approves and publishes in the same call. Dossier preparation below stops
-- at an unreviewed draft. Research roles (support/counter) describe coverage,
-- never truth. Retrieval failure is never persisted as contradictory evidence.

begin;

create schema if not exists private;

-- 1. Shared persistent and atomic account quota. ---------------------------

insert into private.account_quota_settings (
  action, window_seconds, max_requests
) values
  ('dossier_capture', 3600, 12),
  ('dossier_submit', 86400, 8)
on conflict (action) do nothing;

comment on table private.account_quota_settings is
  'Migration-configurable fixed-window quotas. Claim dossier defaults: 12 authenticated captures/hour and 8 submissions/day per account.';

create table private.source_capture_reservations (
  actor_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key uuid not null,
  requested_url text not null check (public.is_safe_public_url(requested_url)),
  state text not null default 'reserved' check (state in ('reserved', 'complete')),
  created_at timestamptz not null default now(),
  primary key (actor_id, idempotency_key)
);

revoke all on table private.source_capture_reservations
from public, anon, authenticated, service_role;

create or replace function public.get_claim_dossier_limits()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, private
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('action', action, 'window_seconds', window_seconds, 'max_requests', max_requests) order by action),
    '[]'::jsonb
  )
  from private.account_quota_settings
  where action in ('dossier_capture', 'dossier_submit')
$$;

-- 2. Private byte artefacts and public canonical provenance columns. --------

create table private.source_artifacts (
  id uuid primary key default extensions.gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  idempotency_key uuid not null,
  requested_url text not null check (public.is_safe_public_url(requested_url)),
  final_url text not null check (public.is_safe_public_url(final_url)),
  http_status integer check (http_status between 100 and 599),
  content_type text not null,
  retrieval_status text not null check (
    retrieval_status in (
      'found', 'partial', 'blocked', 'failed', 'missing', 'oversize', 'unsupported'
    )
  ),
  failure_code text,
  raw_content bytea,
  byte_length integer not null default 0 check (byte_length between 0 and 128000),
  raw_sha256 text check (
    raw_sha256 is null or raw_sha256 ~ '^sha256:[0-9a-f]{64}$'
  ),
  normalized_text text,
  normalized_sha256 text check (
    normalized_sha256 is null
    or normalized_sha256 ~ '^sha256:[0-9a-f]{64}$'
  ),
  title text not null,
  publisher text not null,
  parser_version text not null,
  is_truncated boolean not null default false,
  source_type text not null check (
    source_type in ('article', 'paper', 'report', 'law', 'dataset', 'video', 'other')
  ),
  capture_metadata jsonb not null default '{}'::jsonb check (
    octet_length(capture_metadata::text) <= 4096
  ),
  captured_at timestamptz not null default now(),
  unique (created_by, idempotency_key),
  constraint source_artifacts_success_shape check (
    (
      retrieval_status in ('found', 'partial')
      and failure_code is null
      and raw_content is not null
      and byte_length = octet_length(raw_content)
      and raw_sha256 is not null
      and normalized_text is not null
      and normalized_sha256 is not null
      and btrim(parser_version) <> ''
      and (retrieval_status = 'partial') = is_truncated
    )
    or (
      retrieval_status in ('blocked', 'failed', 'missing', 'oversize', 'unsupported')
      and failure_code is not null
      and raw_content is null
      and byte_length = 0
      and raw_sha256 is null
      and normalized_text is null
      and normalized_sha256 is null
      and is_truncated is false
    )
  )
);

comment on table private.source_artifacts is
  'Immutable authenticated HTTP(S) captures. Raw bytes and normalized full text never enter public projections.';

revoke all on table private.source_artifacts
from public, anon, authenticated, service_role;

alter table private.source_capture_reservations
  add column artifact_id uuid unique references private.source_artifacts(id) on delete restrict;
alter table private.source_capture_reservations
  add constraint source_capture_reservations_state_shape_ck check (
    (state = 'reserved' and artifact_id is null)
    or (state = 'complete' and artifact_id is not null)
  );

create or replace function private.reject_source_artifact_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  raise exception using errcode = '55000',
    message = 'source artifacts are immutable';
end;
$$;

create trigger source_artifacts_immutable
before update or delete on private.source_artifacts
for each row execute function private.reject_source_artifact_mutation();

revoke execute on function private.reject_source_artifact_mutation()
from public, anon, authenticated, service_role;

create or replace function public.store_source_artifact(
  p_actor_id uuid,
  p_idempotency_key uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
as $$
declare
  v_existing private.source_artifacts%rowtype;
  v_artifact private.source_artifacts%rowtype;
  v_raw bytea;
  v_raw_hash text;
  v_normalized_hash text;
  v_status text := coalesce(p_payload->>'retrieval_status', '');
  v_mime text := lower(split_part(coalesce(p_payload->>'content_type', ''), ';', 1));
begin
  if coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
              nullif(current_setting('role', true), '')) <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  if p_actor_id is null or p_idempotency_key is null
     or jsonb_typeof(p_payload) <> 'object' then
    raise exception using errcode = '22023',
      message = 'actor, idempotency key and artifact payload are required';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_actor_id::text || ':capture:' || p_idempotency_key::text, 0
    )
  );
  if not exists (
    select 1
    from private.source_capture_reservations
    where actor_id = p_actor_id
      and idempotency_key = p_idempotency_key
      and requested_url = p_payload->>'requested_url'
  ) then
    raise exception using errcode = '42501',
      message = 'capture quota must be reserved after authentication';
  end if;

  select * into v_existing
  from private.source_artifacts
  where created_by = p_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.requested_url <> coalesce(p_payload->>'requested_url', '')
       or v_existing.final_url <> coalesce(p_payload->>'final_url', '')
       or v_existing.retrieval_status <> v_status
       or v_existing.http_status is distinct from nullif(p_payload->>'http_status', '')::integer
       or v_existing.content_type <> coalesce(
         nullif(p_payload->>'content_type', ''), 'application/octet-stream'
       )
       or coalesce(v_existing.failure_code, '') <>
          coalesce(p_payload->>'failure_code', '')
       or coalesce(v_existing.raw_sha256, '') <>
          coalesce(p_payload->>'raw_sha256', '')
       or coalesce(v_existing.normalized_sha256, '') <>
          coalesce(p_payload->>'normalized_sha256', '')
       or v_existing.title <> btrim(coalesce(p_payload->>'title', ''))
       or v_existing.publisher <> btrim(coalesce(p_payload->>'publisher', ''))
       or v_existing.source_type <> coalesce(
         nullif(p_payload->>'source_type', ''), 'other'
       )
       or v_existing.parser_version <> coalesce(
         nullif(p_payload->>'parser_version', ''), 'text-v1'
       )
       or v_existing.is_truncated is distinct from
          coalesce((p_payload->>'is_truncated')::boolean, false)
       or v_existing.capture_metadata <>
          coalesce(p_payload->'capture_metadata', '{}'::jsonb) then
      raise exception using errcode = '22023',
        message = 'idempotency key was already used for a different artifact';
    end if;
    return jsonb_build_object(
      'ok', true,
      'artifact_id', v_existing.id,
      'requested_url', v_existing.requested_url,
      'final_url', v_existing.final_url,
      'status', v_existing.retrieval_status,
      'content_type', v_existing.content_type,
      'byte_length', v_existing.byte_length,
      'raw_hash', v_existing.raw_sha256,
      'normalized_hash', v_existing.normalized_sha256,
      'normalized_text', v_existing.normalized_text,
      'title', v_existing.title,
      'publisher', v_existing.publisher,
      'source_type', v_existing.source_type,
      'parser_version', v_existing.parser_version,
      'is_truncated', v_existing.is_truncated,
      'captured_at', v_existing.captured_at,
      'reused', true
    );
  end if;

  if not public.is_safe_public_url(p_payload->>'requested_url')
     or not public.is_safe_public_url(p_payload->>'final_url') then
    raise exception using errcode = '22023',
      message = 'source URL must be public HTTP(S) without credentials, sensitive query parameters or non-standard ports';
  end if;
  if btrim(coalesce(p_payload->>'title', '')) = ''
     or btrim(coalesce(p_payload->>'publisher', '')) = '' then
    raise exception using errcode = '22023',
      message = 'source title and publisher are required';
  end if;

  if v_status in ('found', 'partial') then
    if v_mime not in (
      'text/plain', 'text/html', 'application/xhtml+xml', 'application/json'
    ) then
      raise exception using errcode = '22023',
        message = 'unsupported source content type';
    end if;
    begin
      v_raw := decode(coalesce(p_payload->>'raw_content_base64', ''), 'base64');
    exception when others then
      raise exception using errcode = '22023',
        message = 'raw source content is not valid base64';
    end;
    if octet_length(v_raw) = 0 or octet_length(v_raw) > 128000 then
      raise exception using errcode = '22023',
        message = 'source body must contain between 1 and 128000 bytes';
    end if;
    if nullif(p_payload->>'byte_length', '') is null
       or (p_payload->>'byte_length')::integer <> octet_length(v_raw) then
      raise exception using errcode = '22023',
        message = 'source byte length mismatch';
    end if;
    if coalesce(p_payload->>'normalized_text', '') = '' then
      raise exception using errcode = '22023',
        message = 'normalized source text is required';
    end if;
    v_raw_hash := 'sha256:' || encode(extensions.digest(v_raw, 'sha256'), 'hex');
    v_normalized_hash := 'sha256:' || encode(
      extensions.digest(
        convert_to(p_payload->>'normalized_text', 'UTF8'), 'sha256'
      ),
      'hex'
    );
    if v_raw_hash <> coalesce(p_payload->>'raw_sha256', '')
       or v_normalized_hash <> coalesce(p_payload->>'normalized_sha256', '') then
      raise exception using errcode = '22023',
        message = 'source content hash mismatch';
    end if;
  elsif v_status in ('blocked', 'failed', 'missing', 'oversize', 'unsupported') then
    if nullif(p_payload->>'failure_code', '') is null then
      raise exception using errcode = '22023',
        message = 'failed capture requires a failure code';
    end if;
    v_raw := null;
    v_raw_hash := null;
    v_normalized_hash := null;
  else
    raise exception using errcode = '22023',
      message = 'invalid retrieval status';
  end if;
  if jsonb_typeof(coalesce(p_payload->'capture_metadata', '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023',
      message = 'capture metadata must be a JSON object';
  end if;

  insert into private.source_artifacts (
    created_by, idempotency_key, requested_url, final_url, http_status,
    content_type, retrieval_status, failure_code, raw_content, byte_length,
    raw_sha256, normalized_text, normalized_sha256, title, publisher,
    parser_version, is_truncated, source_type, capture_metadata
  ) values (
    p_actor_id,
    p_idempotency_key,
    p_payload->>'requested_url',
    p_payload->>'final_url',
    nullif(p_payload->>'http_status', '')::integer,
    coalesce(nullif(p_payload->>'content_type', ''), 'application/octet-stream'),
    v_status,
    nullif(p_payload->>'failure_code', ''),
    v_raw,
    coalesce(octet_length(v_raw), 0),
    v_raw_hash,
    case when v_raw is null then null else p_payload->>'normalized_text' end,
    v_normalized_hash,
    btrim(p_payload->>'title'),
    btrim(p_payload->>'publisher'),
    coalesce(nullif(p_payload->>'parser_version', ''), 'text-v1'),
    coalesce((p_payload->>'is_truncated')::boolean, false),
    coalesce(nullif(p_payload->>'source_type', ''), 'other'),
    coalesce(p_payload->'capture_metadata', '{}'::jsonb)
  )
  returning * into v_artifact;

  update private.source_capture_reservations
  set state = 'complete', artifact_id = v_artifact.id
  where actor_id = p_actor_id
    and idempotency_key = p_idempotency_key;

  return jsonb_build_object(
    'ok', true,
    'artifact_id', v_artifact.id,
    'requested_url', v_artifact.requested_url,
    'final_url', v_artifact.final_url,
    'status', v_artifact.retrieval_status,
    'content_type', v_artifact.content_type,
    'byte_length', v_artifact.byte_length,
    'raw_hash', v_artifact.raw_sha256,
    'normalized_hash', v_artifact.normalized_sha256,
    'normalized_text', v_artifact.normalized_text,
    'title', v_artifact.title,
    'publisher', v_artifact.publisher,
    'source_type', v_artifact.source_type,
    'parser_version', v_artifact.parser_version,
    'is_truncated', v_artifact.is_truncated,
    'captured_at', v_artifact.captured_at,
    'reused', false
  );
end;
$$;

-- The reservation response is a stable Edge contract. Replays never fetch
-- again: a pending reservation reports in_progress, while a completed one
-- projects the already stored immutable artifact.
create or replace function public.reserve_source_capture(
  p_actor_id uuid,
  p_idempotency_key uuid,
  p_requested_url text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_existing private.source_capture_reservations%rowtype;
  v_artifact private.source_artifacts%rowtype;
  v_quota jsonb;
begin
  if coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
              nullif(current_setting('role', true), '')) <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  if p_actor_id is null or p_idempotency_key is null then
    raise exception using errcode = '22023',
      message = 'actor and idempotency key are required';
  end if;
  if not public.is_safe_public_url(p_requested_url) then
    raise exception using errcode = '22023', message = 'unsafe public source URL';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_actor_id::text || ':capture:' || p_idempotency_key::text, 0
    )
  );
  select * into v_existing
  from private.source_capture_reservations
  where actor_id = p_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.requested_url <> p_requested_url then
      raise exception using errcode = '22023',
        message = 'idempotency key was already used for another URL';
    end if;
    if v_existing.state = 'reserved' then
      return jsonb_build_object(
        'ok', true,
        'state', 'in_progress',
        'idempotent', true,
        'retry_after_seconds', 2
      );
    end if;

    select * into strict v_artifact
    from private.source_artifacts where id = v_existing.artifact_id;
    return jsonb_build_object(
      'ok', true,
      'state', 'completed',
      'idempotent', true,
      'artifact_id', v_artifact.id,
      'requested_url', v_artifact.requested_url,
      'final_url', v_artifact.final_url,
      'status', v_artifact.retrieval_status,
      'content_type', v_artifact.content_type,
      'byte_length', v_artifact.byte_length,
      'raw_hash', v_artifact.raw_sha256,
      'normalized_hash', v_artifact.normalized_sha256,
      'normalized_text', v_artifact.normalized_text,
      'title', v_artifact.title,
      'publisher', v_artifact.publisher,
      'source_type', v_artifact.source_type,
      'parser_version', v_artifact.parser_version,
      'is_truncated', v_artifact.is_truncated,
      'captured_at', v_artifact.captured_at,
      'reused', true
    );
  end if;

  v_quota := private.reserve_account_quota(p_actor_id, 'dossier_capture');
  if coalesce((v_quota->>'ok')::boolean, false) is not true then
    return v_quota || jsonb_build_object(
      'state', 'quota_exceeded',
      'idempotent', false
    );
  end if;

  insert into private.source_capture_reservations (
    actor_id, idempotency_key, requested_url
  ) values (
    p_actor_id, p_idempotency_key, p_requested_url
  );
  return v_quota || jsonb_build_object(
    'state', 'reserved',
    'idempotent', false
  );
end;
$$;

-- 3. Immutable claim-dossier submissions and exact evidence uses. -----------

create table private.claim_dossier_profiles (
  topic_id text primary key,
  profile_name text not null check (profile_name = 'factual_descriptive_v1'),
  allowed_language text not null default 'en',
  challenges_enabled boolean not null default true,
  public_limit_note text not null,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into private.claim_dossier_profiles (
  topic_id, profile_name, allowed_language, challenges_enabled,
  public_limit_note, enabled
) values (
  'topic_congestion_pricing',
  'factual_descriptive_v1',
  'en',
  true,
  'Pilot scope: factual descriptive claims about the congestion-pricing topic only. Normative, causal, predictive and high-harm claims are excluded.',
  true
)
on conflict (topic_id) do nothing;

revoke all on table private.claim_dossier_profiles
from public, anon, authenticated, service_role;

-- The generic contributions guard consumes this short-lived, unforgeable
-- intent before accepting a claim_dossier row. It lets the dedicated RPC keep
-- its own stricter validation/quota without reopening direct table inserts.
create table private.claim_dossier_submission_intents (
  contribution_id uuid primary key,
  actor_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  base_revision_id text not null references public.debate_revisions(id) on delete cascade,
  body_hash text not null check (body_hash ~ '^sha256:[0-9a-f]{64}$'),
  title_hash text not null check (title_hash ~ '^sha256:[0-9a-f]{64}$'),
  target_object_id text not null,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default clock_timestamp() + interval '5 minutes',
  check (expires_at > created_at)
);

revoke all on table private.claim_dossier_submission_intents
from public, anon, authenticated, service_role;

-- Keep the hardened legacy guard unchanged for every existing contribution
-- type. Only the dedicated claim_dossier trigger below can consume a private
-- intent; direct inserts therefore remain fail-closed.
drop trigger if exists contributions_submission_guard on public.contributions;
create trigger contributions_submission_guard
before insert on public.contributions
for each row when (new.type <> 'claim_dossier')
execute function private.guard_contribution_submission();

create or replace function private.guard_claim_dossier_contribution_insert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_published_revision_id text;
  v_intent_id uuid;
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if new.created_by is not null and new.created_by <> v_actor then
    raise exception using errcode = '42501',
      message = 'contribution actor must match the authenticated account';
  end if;
  if new.id is null
     or new.status <> 'submitted'
     or new.merged_revision_id is not null
     or new.merged_at is not null then
    raise exception using errcode = '22023',
      message = 'new claim dossiers must begin as identified, unmerged submissions';
  end if;
  if char_length(btrim(coalesce(new.body, ''))) not between 20 and 600 then
    raise exception using errcode = '22023',
      message = 'claim dossier body must contain 20 to 600 characters';
  end if;
  if char_length(btrim(coalesce(new.title, ''))) not between 20 and 300 then
    raise exception using errcode = '22023',
      message = 'claim dossier title preview must contain 20 to 300 characters';
  end if;
  if new.url is not null or new.proposed_label is not null
     or char_length(btrim(coalesce(new.target_object_id, ''))) not between 1 and 200 then
    raise exception using errcode = '22023',
      message = 'claim dossier contribution fields are invalid';
  end if;

  select published_revision_id into v_published_revision_id
  from public.topics
  where id = new.topic_id and status = 'published'
  for share;
  if v_published_revision_id is null then
    raise exception using errcode = '22023',
      message = 'claim dossiers require a published topic revision';
  end if;

  delete from private.claim_dossier_submission_intents i
  where i.contribution_id = new.id
    and i.actor_id = v_actor
    and i.topic_id = new.topic_id
    and i.base_revision_id = v_published_revision_id
    and i.target_object_id = btrim(new.target_object_id)
    and i.body_hash = 'sha256:' || encode(
      extensions.digest(convert_to(btrim(new.body), 'UTF8'), 'sha256'), 'hex'
    )
    and i.title_hash = 'sha256:' || encode(
      extensions.digest(convert_to(btrim(new.title), 'UTF8'), 'sha256'), 'hex'
    )
    and i.expires_at > clock_timestamp()
  returning i.contribution_id into v_intent_id;
  if v_intent_id is null then
    raise exception using errcode = '42501',
      message = 'claim dossier requires a valid one-time submission intent';
  end if;

  new.created_by := v_actor;
  new.created_at := clock_timestamp();
  new.body := btrim(new.body);
  new.title := btrim(new.title);
  new.target_object_id := btrim(new.target_object_id);
  return new;
end;
$$;

create trigger contributions_claim_dossier_submission_guard
before insert on public.contributions
for each row when (new.type = 'claim_dossier')
execute function private.guard_claim_dossier_contribution_insert();

revoke execute on function private.guard_claim_dossier_contribution_insert()
from public, anon, authenticated, service_role;

create or replace function private.claim_text_is_bounded_descriptive(p_text text)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select coalesce(
    char_length(btrim(p_text)) between 20 and 600
    and p_text !~* '\m(should|must|ought|cause|causes|caused|causing|because|therefore|predict|predicts|predicted|will|would|lead|leads|led|reduce|reduces|reduced|increase|increases|increased)\M'
    and p_text !~* '\mresults?[[:space:]]+in\M'
    and p_text !~* '\mdue[[:space:]]+to\M',
    false
  )
$$;

revoke execute on function private.claim_text_is_bounded_descriptive(text)
from public, anon, authenticated, service_role;

alter table public.contributions
  drop constraint contributions_type_check;
alter table public.contributions
  add constraint contributions_type_check check (type in (
    'new_claim', 'new_source', 'new_position', 'challenge_evidence_label',
    'challenge_steelman', 'value_tradeoff_correction', 'claim_dossier'
  ));
alter table public.contributions
  drop constraint contributions_status_check;
alter table public.contributions
  add constraint contributions_status_check check (status in (
    'submitted', 'changes_requested', 'accepted', 'rejected'
  ));
alter table public.contributions
  add constraint contributions_id_topic_uq unique (id, topic_id);

alter table public.audit_events
  drop constraint audit_events_actor_type_check;
alter table public.audit_events
  add constraint audit_events_actor_type_check check (
    actor_type in ('user', 'reviewer', 'admin', 'ai', 'system')
  );

create table private.claim_dossier_submissions (
  id uuid primary key references public.contributions(id) on delete restrict,
  topic_id text not null references public.topics(id) on delete restrict,
  base_revision_id text not null references public.debate_revisions(id) on delete restrict,
  submission_kind text not null check (
    submission_kind in ('new_claim', 'challenge')
  ),
  target_position_id text not null references public.positions(id) on delete restrict,
  target_evidence_link_id text references public.evidence_links(id) on delete restrict,
  claim_profile text not null default 'factual_descriptive_v1' check (
    claim_profile = 'factual_descriptive_v1'
  ),
  claim_text text not null check (char_length(btrim(claim_text)) between 20 and 600),
  argument_summary text not null check (
    char_length(btrim(argument_summary)) between 20 and 1200
  ),
  argument_direction text not null check (
    argument_direction in ('supports', 'opposes', 'qualifies')
  ),
  scope_note text not null check (char_length(btrim(scope_note)) between 8 and 800),
  language text not null default 'en' check (language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  submitted_by uuid not null references auth.users(id) on delete restrict,
  idempotency_key uuid not null,
  payload_hash text not null check (payload_hash ~ '^sha256:[0-9a-f]{64}$'),
  supersedes_submission_id uuid unique references private.claim_dossier_submissions(id) on delete restrict,
  prepared_revision_id text unique references public.debate_revisions(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (submitted_by, idempotency_key),
  unique (id, topic_id),
  foreign key (id, topic_id)
    references public.contributions(id, topic_id) on delete restrict,
  foreign key (base_revision_id, topic_id)
    references public.debate_revisions(id, topic_id) on delete restrict,
  foreign key (target_position_id, base_revision_id)
    references public.positions(id, revision_id) on delete restrict,
  foreign key (supersedes_submission_id, topic_id)
    references private.claim_dossier_submissions(id, topic_id) on delete restrict,
  constraint claim_dossier_target_shape check (
    (submission_kind = 'new_claim' and target_evidence_link_id is null)
    or (submission_kind = 'challenge' and target_evidence_link_id is not null)
  )
);

create table private.claim_dossier_evidence (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_id uuid not null references private.claim_dossier_submissions(id) on delete restrict,
  source_artifact_id uuid not null references private.source_artifacts(id) on delete restrict,
  research_role text not null check (research_role in ('support', 'counter')),
  offset_unit text not null default 'utf8_bytes_v1' check (
    offset_unit = 'utf8_bytes_v1'
  ),
  start_offset integer not null check (start_offset >= 0),
  end_offset integer not null check (end_offset > start_offset),
  exact_excerpt text not null check (
    btrim(exact_excerpt) <> ''
    and char_length(exact_excerpt) <= 2000
    and octet_length(exact_excerpt) <= 8192
  ),
  excerpt_hash text not null check (excerpt_hash ~ '^sha256:[0-9a-f]{64}$'),
  locator text not null check (btrim(locator) <> ''),
  label text not null check (label in (
    'supports_claim', 'partially_supports_claim', 'contradicts_claim',
    'does_not_support_claim', 'unclear'
  )),
  rationale text not null check (
    char_length(btrim(rationale)) between 8 and 2000
  ),
  created_at timestamptz not null default now(),
  unique (submission_id, research_role)
);

create table private.revision_change_sets (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_id uuid not null unique references private.claim_dossier_submissions(id) on delete restrict,
  topic_id text not null references public.topics(id) on delete restrict,
  base_revision_id text not null references public.debate_revisions(id) on delete restrict,
  prepared_revision_id text not null unique references public.debate_revisions(id) on delete restrict,
  dossier_review_id uuid not null references public.reviews(id) on delete restrict,
  base_snapshot_hash text not null check (
    base_snapshot_hash ~ '^sha256:[0-9a-f]{64}$'
  ),
  prepared_snapshot_hash text not null check (
    prepared_snapshot_hash ~ '^sha256:[0-9a-f]{64}$'
  ),
  change_set jsonb not null,
  change_hash text not null check (change_hash ~ '^sha256:[0-9a-f]{64}$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

revoke all on table
  private.claim_dossier_submissions,
  private.claim_dossier_evidence,
  private.revision_change_sets
from public, anon, authenticated, service_role;

alter table public.sources
  add column source_artifact_id uuid references private.source_artifacts(id) on delete restrict,
  add column origin_dossier_submission_id uuid references private.claim_dossier_submissions(id) on delete restrict,
  add column artifact_content_type text,
  add column artifact_byte_length integer check (
    artifact_byte_length is null or artifact_byte_length between 0 and 128000
  ),
  add column artifact_normalized_hash text check (
    artifact_normalized_hash is null
    or artifact_normalized_hash ~ '^sha256:[0-9a-f]{64}$'
  ),
  add column artifact_parser_version text,
  add column artifact_is_truncated boolean,
  add column retrieval_error_code text;
alter table public.source_excerpts
  add column start_offset integer,
  add column end_offset integer,
  add column offset_unit text,
  add column excerpt_hash text,
  add column origin_dossier_submission_id uuid references private.claim_dossier_submissions(id) on delete restrict,
  add constraint source_excerpts_offsets_ck check (
    (start_offset is null and end_offset is null and excerpt_hash is null)
    or (
      start_offset >= 0
      and end_offset > start_offset
      and offset_unit = 'utf8_bytes_v1'
      and excerpt_hash ~ '^sha256:[0-9a-f]{64}$'
    )
  );
alter table public.evidence_links
  add column research_role text check (
    research_role is null or research_role in ('support', 'counter')
  ),
  add column origin_dossier_submission_id uuid references private.claim_dossier_submissions(id) on delete restrict;
alter table public.claims
  add column origin_dossier_submission_id uuid references private.claim_dossier_submissions(id) on delete restrict;
alter table public.debate_arguments
  add column origin_dossier_submission_id uuid references private.claim_dossier_submissions(id) on delete restrict;

create index claim_dossier_submissions_topic_status_idx
  on private.claim_dossier_submissions (topic_id, created_at desc);
create index claim_dossier_evidence_submission_idx
  on private.claim_dossier_evidence (submission_id, research_role);
create index revision_change_sets_revision_idx
  on private.revision_change_sets (prepared_revision_id);
create index sources_artifact_idx
  on public.sources (source_artifact_id)
  where source_artifact_id is not null;
create unique index claims_dossier_origin_revision_uq
  on public.claims (revision_id, origin_dossier_submission_id)
  where origin_dossier_submission_id is not null;
create unique index arguments_dossier_origin_revision_uq
  on public.debate_arguments (revision_id, origin_dossier_submission_id)
  where origin_dossier_submission_id is not null;
create unique index evidence_dossier_origin_role_revision_uq
  on public.evidence_links (
    revision_id, origin_dossier_submission_id, research_role
  )
  where origin_dossier_submission_id is not null;

create or replace function private.project_source_artifact_metadata()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_artifact private.source_artifacts%rowtype;
begin
  if new.source_artifact_id is null then
    return new;
  end if;
  select * into strict v_artifact
  from private.source_artifacts
  where id = new.source_artifact_id;
  if v_artifact.retrieval_status not in ('found', 'partial') then
    raise exception using errcode = '22023',
      message = 'unavailable captures cannot become canonical evidence sources';
  end if;
  new.url := v_artifact.final_url;
  new.title := v_artifact.title;
  new.publisher := v_artifact.publisher;
  new.source_type := v_artifact.source_type;
  new.retrieval_status := v_artifact.retrieval_status;
  new.retrieved_at := v_artifact.captured_at;
  new.content_hash := v_artifact.raw_sha256;
  new.artifact_content_type := v_artifact.content_type;
  new.artifact_byte_length := v_artifact.byte_length;
  new.artifact_normalized_hash := v_artifact.normalized_sha256;
  new.artifact_parser_version := v_artifact.parser_version;
  new.artifact_is_truncated := v_artifact.is_truncated;
  new.retrieval_error_code := v_artifact.failure_code;
  return new;
end;
$$;

create trigger sources_project_artifact_metadata
before insert or update of source_artifact_id on public.sources
for each row execute function private.project_source_artifact_metadata();

revoke execute on function private.project_source_artifact_metadata()
from public, anon, authenticated, service_role;

create or replace function private.guard_dossier_excerpt_exact()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
as $$
declare
  v_artifact private.source_artifacts%rowtype;
  v_source public.sources%rowtype;
  v_exact text;
  v_hash text;
begin
  if new.origin_dossier_submission_id is null then
    return new;
  end if;
  if new.start_offset is null or new.end_offset is null
     or new.offset_unit <> 'utf8_bytes_v1'
     or char_length(new.text) > 2000
     or octet_length(new.text) > 8192 then
    raise exception using errcode = '22023',
      message = 'dossier excerpts require bounded UTF-8 byte offsets';
  end if;
  select * into strict v_source
  from public.sources
  where id = new.source_id and revision_id = new.revision_id;
  if v_source.origin_dossier_submission_id <> new.origin_dossier_submission_id
     or v_source.source_artifact_id is null then
    raise exception using errcode = '22023',
      message = 'dossier excerpt must use its dossier artifact source';
  end if;
  select * into strict v_artifact
  from private.source_artifacts where id = v_source.source_artifact_id;
  if new.start_offset < 0
     or new.end_offset <= new.start_offset
     or new.end_offset > octet_length(convert_to(v_artifact.normalized_text, 'UTF8')) then
    raise exception using errcode = '22023',
      message = 'dossier excerpt offsets are outside normalized source text';
  end if;
  begin
    v_exact := private.exact_utf8_slice(
      v_artifact.normalized_text, new.start_offset, new.end_offset
    );
  exception when character_not_in_repertoire or untranslatable_character then
    raise exception using errcode = '22023',
      message = 'dossier excerpt offsets split a UTF-8 character';
  end;
  v_hash := 'sha256:' || encode(
    extensions.digest(convert_to(v_exact, 'UTF8'), 'sha256'), 'hex'
  );
  if new.text <> v_exact or new.excerpt_hash <> v_hash then
    raise exception using errcode = '22023',
      message = 'dossier excerpt does not match captured normalized bytes';
  end if;
  return new;
end;
$$;

-- Created after private.exact_utf8_slice below; the trigger is installed there
-- so the helper exists before its first invocation.

-- Dossier rows are immutable except for the prepared draft pointer, which only
-- prepare_claim_dossier_revision sets after locking the accepted submission.
create or replace function private.guard_claim_dossier_submission()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '55000', message = 'claim dossiers are immutable';
  end if;
  if (to_jsonb(new) - 'prepared_revision_id') <>
     (to_jsonb(old) - 'prepared_revision_id')
     or old.prepared_revision_id is not null
     or new.prepared_revision_id is null then
    raise exception using errcode = '55000', message = 'claim dossiers are immutable';
  end if;
  return new;
end;
$$;

create trigger claim_dossier_submissions_immutable
before update or delete on private.claim_dossier_submissions
for each row execute function private.guard_claim_dossier_submission();

create or replace function private.reject_claim_dossier_child_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  raise exception using errcode = '55000', message = 'claim dossier records are immutable';
end;
$$;

create trigger claim_dossier_evidence_immutable
before update or delete on private.claim_dossier_evidence
for each row execute function private.reject_claim_dossier_child_mutation();
create trigger revision_change_sets_immutable
before update or delete on private.revision_change_sets
for each row execute function private.reject_claim_dossier_child_mutation();

revoke execute on function
  private.guard_claim_dossier_submission(),
  private.reject_claim_dossier_child_mutation()
from public, anon, authenticated, service_role;

-- 4. Authenticated, atomic dossier submission and reasoned review. ----------

create or replace function private.exact_utf8_slice(
  p_text text,
  p_start integer,
  p_end integer
)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select convert_from(
    substring(
      convert_to(p_text, 'UTF8')
      from p_start + 1
      for p_end - p_start
    ),
    'UTF8'
  )
$$;

revoke execute on function private.exact_utf8_slice(text, integer, integer)
from public, anon, authenticated, service_role;

create trigger source_excerpts_guard_dossier_exact
before insert or update of source_id, revision_id, text, locator,
  start_offset, end_offset, offset_unit, excerpt_hash,
  origin_dossier_submission_id
on public.source_excerpts
for each row execute function private.guard_dossier_excerpt_exact();

revoke execute on function private.guard_dossier_excerpt_exact()
from public, anon, authenticated, service_role;

create or replace function public.submit_claim_dossier(
  p_payload jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_topic_id text := nullif(p_payload->>'topic_id', '');
  v_base_revision_id text := nullif(p_payload->>'base_revision_id', '');
  v_kind text := nullif(p_payload->>'submission_kind', '');
  v_target_position_id text := nullif(p_payload->>'target_position_id', '');
  v_target_evidence_id text := nullif(p_payload->>'target_evidence_link_id', '');
  v_claim_text text := btrim(coalesce(p_payload->>'claim_text', ''));
  v_argument_summary text := btrim(coalesce(p_payload->>'argument_summary', ''));
  v_argument_direction text := nullif(p_payload->>'argument_direction', '');
  v_scope_note text := btrim(coalesce(p_payload->>'scope_note', ''));
  v_language text := nullif(p_payload->>'language', '');
  v_claim_profile text := nullif(p_payload->>'claim_profile', '');
  v_supersedes uuid;
  v_evidence jsonb := p_payload->'evidence';
  v_payload_hash text;
  v_existing private.claim_dossier_submissions%rowtype;
  v_profile private.claim_dossier_profiles%rowtype;
  v_artifact private.source_artifacts%rowtype;
  v_item jsonb;
  v_artifact_id uuid;
  v_first_artifact_id uuid;
  v_source_key text;
  v_first_source_key text;
  v_start integer;
  v_end integer;
  v_excerpt text;
  v_excerpt_hash text;
  v_submission_id uuid := extensions.gen_random_uuid();
  v_quota jsonb;
  v_key text;
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if p_idempotency_key is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception using errcode = '22023',
      message = 'dossier payload and idempotency key are required';
  end if;
  for v_key in select jsonb_object_keys(p_payload) loop
    if v_key <> all (array[
      'topic_id', 'base_revision_id', 'submission_kind',
      'target_position_id', 'target_evidence_link_id', 'claim_text',
      'claim_type', 'claim_profile', 'argument_summary',
      'argument_direction', 'scope_note', 'language', 'evidence',
      'supersedes_submission_id'
    ]::text[]) then
      raise exception using errcode = '22023',
        message = 'unknown dossier payload field: ' || v_key;
    end if;
  end loop;

  v_payload_hash := 'sha256:' || encode(
    extensions.digest(convert_to(p_payload::text, 'UTF8'), 'sha256'), 'hex'
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_actor::text || ':dossier:' || p_idempotency_key::text, 0
    )
  );
  select * into v_existing
  from private.claim_dossier_submissions
  where submitted_by = v_actor and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023',
        message = 'idempotency key was already used for another dossier';
    end if;
    return jsonb_build_object(
      'id', v_existing.id,
      'status', (
        select c.status from public.contributions c where c.id = v_existing.id
      ),
      'idempotent', true
    );
  end if;

  select * into v_profile
  from private.claim_dossier_profiles
  where topic_id = v_topic_id and enabled;
  if not found then
    raise exception using errcode = '22023',
      message = 'claim dossiers are not enabled for this topic';
  end if;
  if v_claim_profile <> v_profile.profile_name
     or coalesce(p_payload->>'claim_type', '') <> 'factual'
     or v_language <> v_profile.allowed_language then
    raise exception using errcode = '22023',
      message = 'this pilot accepts English factual descriptive claims only';
  end if;
  if not private.claim_text_is_bounded_descriptive(v_claim_text) then
    raise exception using errcode = '22023',
      message = 'claim must be bounded and descriptive, not normative, causal or predictive';
  end if;
  if char_length(v_argument_summary) not between 20 and 1200
     or v_argument_direction not in ('supports', 'opposes', 'qualifies')
     or char_length(v_scope_note) not between 8 and 800 then
    raise exception using errcode = '22023',
      message = 'structured argument and scope are required';
  end if;
  if v_kind not in ('new_claim', 'challenge') then
    raise exception using errcode = '22023', message = 'invalid dossier kind';
  end if;
  if v_kind = 'challenge' and not v_profile.challenges_enabled then
    raise exception using errcode = '22023',
      message = 'challenges are disabled for this pilot';
  end if;

  if not exists (
    select 1
    from public.topics t
    join public.debate_revisions r
      on r.id = t.published_revision_id and r.topic_id = t.id
    where t.id = v_topic_id
      and t.status = 'published'
      and r.status = 'published'
      and r.id = v_base_revision_id
  ) then
    raise exception using errcode = '55000',
      message = 'base revision is not the current published revision';
  end if;
  if not exists (
    select 1 from public.positions
    where id = v_target_position_id
      and revision_id = v_base_revision_id
      and topic_id = v_topic_id
  ) then
    raise exception using errcode = '22023',
      message = 'target position is outside the base revision';
  end if;
  if v_kind = 'new_claim' and v_target_evidence_id is not null then
    raise exception using errcode = '22023',
      message = 'new claim dossier cannot target an evidence link';
  elsif v_kind = 'challenge' and not exists (
    select 1
    from public.evidence_links e
    join public.claims c
      on c.id = e.claim_id and c.revision_id = e.revision_id
    join public.debate_arguments a
      on a.revision_id = e.revision_id
     and a.position_id = v_target_position_id
     and e.claim_id = any(a.claim_ids)
    where e.id = v_target_evidence_id
      and e.revision_id = v_base_revision_id
      and c.topic_id = v_topic_id
  ) then
    raise exception using errcode = '22023',
      message = 'challenge target is outside the base revision';
  end if;

  if nullif(p_payload->>'supersedes_submission_id', '') is not null then
    begin
      v_supersedes := (p_payload->>'supersedes_submission_id')::uuid;
    exception when invalid_text_representation then
      raise exception using errcode = '22023',
        message = 'invalid superseded dossier id';
    end;
    if not exists (
      select 1
      from private.claim_dossier_submissions d
      join public.contributions c on c.id = d.id
      where d.id = v_supersedes
        and d.submitted_by = v_actor
        and d.topic_id = v_topic_id
        and c.status = 'changes_requested'
        and d.prepared_revision_id is null
    ) then
      raise exception using errcode = '22023',
        message = 'only an owned changes-requested dossier may be superseded';
    end if;
  end if;

  if jsonb_typeof(v_evidence) <> 'array'
     or jsonb_array_length(v_evidence) <> 2
     or (select count(*)
         from jsonb_array_elements(v_evidence) as item(value)
         where value->>'research_role' = 'support') <> 1
     or (select count(*)
         from jsonb_array_elements(v_evidence) as item(value)
         where value->>'research_role' = 'counter') <> 1 then
    raise exception using errcode = '22023',
      message = 'exactly one support and one counter-source are required';
  end if;
  if not exists (
    select 1
    from jsonb_array_elements(v_evidence) as item(value)
    where value->>'label' in (
      'supports_claim', 'partially_supports_claim', 'contradicts_claim',
      'does_not_support_claim'
    )
  ) then
    raise exception using errcode = '22023',
      message = 'at least one evidence relation must be assessed beyond unclear';
  end if;

  for v_item in select value from jsonb_array_elements(v_evidence) loop
    for v_key in select jsonb_object_keys(v_item) loop
      if v_key <> all (array[
        'source_artifact_id', 'research_role', 'start_offset', 'end_offset',
        'exact_excerpt', 'excerpt_hash', 'locator', 'label', 'rationale'
      ]::text[]) then
        raise exception using errcode = '22023',
          message = 'unknown evidence field: ' || v_key;
      end if;
    end loop;
    begin
      v_artifact_id := (v_item->>'source_artifact_id')::uuid;
      v_start := (v_item->>'start_offset')::integer;
      v_end := (v_item->>'end_offset')::integer;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = '22023',
        message = 'invalid artifact id or excerpt offsets';
    end;
    select * into v_artifact
    from private.source_artifacts
    where id = v_artifact_id
      and created_by = v_actor
      and retrieval_status in ('found', 'partial');
    if not found then
      raise exception using errcode = '22023',
        message = 'evidence must use an owned, successfully captured artifact';
    end if;
    v_source_key := public.source_key(v_artifact.final_url);
    if nullif(v_source_key, '') is null then
      raise exception using errcode = '22023',
        message = 'captured source has no stable public identity';
    end if;
    if v_first_artifact_id is null then
      v_first_artifact_id := v_artifact_id;
      v_first_source_key := v_source_key;
    elsif v_first_artifact_id = v_artifact_id
       or v_first_source_key = v_source_key then
      raise exception using errcode = '22023',
        message = 'support and counter-source must have distinct public source identities';
    end if;
    if v_start < 0 or v_end <= v_start
       or v_end > octet_length(convert_to(v_artifact.normalized_text, 'UTF8')) then
      raise exception using errcode = '22023',
        message = 'excerpt byte offsets are outside normalized text';
    end if;
    begin
      v_excerpt := private.exact_utf8_slice(
        v_artifact.normalized_text, v_start, v_end
      );
    exception when character_not_in_repertoire or untranslatable_character then
      raise exception using errcode = '22023',
        message = 'excerpt offsets split a UTF-8 character';
    end;
    if v_excerpt <> coalesce(v_item->>'exact_excerpt', '') then
      raise exception using errcode = '22023',
        message = 'exact excerpt does not match normalized source bytes';
    end if;
    if char_length(v_excerpt) > 2000 or octet_length(v_excerpt) > 8192 then
      raise exception using errcode = '22023',
        message = 'exact excerpt exceeds the 2000 character or 8192 byte limit';
    end if;
    v_excerpt_hash := 'sha256:' || encode(
      extensions.digest(convert_to(v_excerpt, 'UTF8'), 'sha256'), 'hex'
    );
    if nullif(v_item->>'excerpt_hash', '') is not null
       and v_item->>'excerpt_hash' <> v_excerpt_hash then
      raise exception using errcode = '22023', message = 'excerpt hash mismatch';
    end if;
    if btrim(coalesce(v_item->>'locator', '')) = ''
       or char_length(v_item->>'locator') > 500
       or char_length(btrim(coalesce(v_item->>'rationale', ''))) not between 8 and 2000
       or coalesce(v_item->>'label', '') not in (
         'supports_claim', 'partially_supports_claim', 'contradicts_claim',
         'does_not_support_claim', 'unclear'
       ) then
      raise exception using errcode = '22023',
        message = 'evidence locator, relation and rationale are required';
    end if;
  end loop;

  v_quota := private.reserve_account_quota(v_actor, 'dossier_submit');
  if coalesce((v_quota->>'ok')::boolean, false) is not true then
    raise exception using errcode = 'P0001',
      message = 'claim dossier submission quota exceeded',
      detail = v_quota::text;
  end if;

  insert into private.claim_dossier_submission_intents (
    contribution_id, actor_id, topic_id, base_revision_id, body_hash, title_hash,
    target_object_id
  ) values (
    v_submission_id,
    v_actor,
    v_topic_id,
    v_base_revision_id,
    'sha256:' || encode(
      extensions.digest(convert_to(v_claim_text, 'UTF8'), 'sha256'), 'hex'
    ),
    'sha256:' || encode(
      extensions.digest(
        convert_to(btrim(left(v_argument_summary, 300)), 'UTF8'), 'sha256'
      ),
      'hex'
    ),
    case when v_kind = 'challenge'
      then v_target_evidence_id else v_target_position_id end
  );

  insert into public.contributions (
    id, topic_id, type, body, title, target_object_id, created_by
  ) values (
    v_submission_id, v_topic_id, 'claim_dossier', v_claim_text,
    btrim(left(v_argument_summary, 300)),
    case when v_kind = 'challenge'
      then v_target_evidence_id else v_target_position_id end,
    v_actor
  );

  insert into private.claim_dossier_submissions (
    id, topic_id, base_revision_id, submission_kind, target_position_id,
    target_evidence_link_id, claim_profile, claim_text, argument_summary,
    argument_direction, scope_note, language, submitted_by,
    idempotency_key, payload_hash, supersedes_submission_id
  ) values (
    v_submission_id, v_topic_id, v_base_revision_id, v_kind,
    v_target_position_id, v_target_evidence_id, v_claim_profile,
    v_claim_text, v_argument_summary, v_argument_direction, v_scope_note,
    v_language, v_actor, p_idempotency_key, v_payload_hash, v_supersedes
  );

  for v_item in select value from jsonb_array_elements(v_evidence) loop
    v_artifact_id := (v_item->>'source_artifact_id')::uuid;
    v_start := (v_item->>'start_offset')::integer;
    v_end := (v_item->>'end_offset')::integer;
    select normalized_text into strict v_excerpt
    from private.source_artifacts where id = v_artifact_id;
    v_excerpt := private.exact_utf8_slice(v_excerpt, v_start, v_end);
    v_excerpt_hash := 'sha256:' || encode(
      extensions.digest(convert_to(v_excerpt, 'UTF8'), 'sha256'), 'hex'
    );
    insert into private.claim_dossier_evidence (
      submission_id, source_artifact_id, research_role, start_offset,
      end_offset, exact_excerpt, excerpt_hash, locator, label, rationale
    ) values (
      v_submission_id, v_artifact_id, v_item->>'research_role', v_start,
      v_end, v_excerpt, v_excerpt_hash, btrim(v_item->>'locator'),
      v_item->>'label', btrim(v_item->>'rationale')
    );
  end loop;

  insert into public.audit_events (
    topic_id, actor_type, actor_id, event_type,
    input_object_ids, output_object_ids, summary
  ) values (
    v_topic_id, 'user', v_actor::text, 'claim_dossier_submitted',
    array[v_base_revision_id], array[v_submission_id::text],
    'A bounded factual claim dossier with support and counter-source was submitted.'
  );

  return jsonb_build_object(
    'id', v_submission_id,
    'status', 'submitted',
    'idempotent', false
  );
end;
$$;

create or replace function public.review_claim_dossier(
  p_submission_id uuid,
  p_decision text,
  p_rationale text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_type text;
  v_contribution public.contributions%rowtype;
  v_dossier private.claim_dossier_submissions%rowtype;
  v_review_id uuid;
begin
  if v_actor is null or not public.is_reviewer() then
    raise exception using errcode = '42501', message = 'reviewer role required';
  end if;
  select case when role = 'admin' then 'admin' else 'reviewer' end
  into v_actor_type
  from public.profiles where id = v_actor;
  if p_decision not in ('approve', 'reject', 'request_changes') then
    raise exception using errcode = '22023', message = 'invalid dossier review decision';
  end if;
  if char_length(btrim(coalesce(p_rationale, ''))) not between 8 and 2000 then
    raise exception using errcode = '22023',
      message = 'review rationale must contain between 8 and 2000 characters';
  end if;

  select * into v_contribution
  from public.contributions
  where id = p_submission_id and type = 'claim_dossier'
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'claim dossier not found';
  end if;
  select * into strict v_dossier
  from private.claim_dossier_submissions where id = p_submission_id;
  if v_contribution.status <> 'submitted' then
    raise exception using errcode = '55000',
      message = 'only submitted dossiers can be reviewed';
  end if;
  if v_contribution.created_by = v_actor then
    raise exception using errcode = '42501',
      message = 'a submitter cannot review their own dossier';
  end if;

  insert into public.reviews (
    target_object_id, target_object_type, decision, rationale, reviewed_by,
    content_hash, base_revision_id
  ) values (
    p_submission_id::text, 'contribution', p_decision,
    btrim(p_rationale), v_actor, v_dossier.payload_hash,
    v_dossier.base_revision_id
  ) returning id into v_review_id;

  update public.contributions
  set status = case p_decision
    when 'approve' then 'accepted'
    when 'request_changes' then 'changes_requested'
    else 'rejected'
  end
  where id = p_submission_id;

  insert into public.audit_events (
    topic_id, actor_type, actor_id, event_type,
    input_object_ids, output_object_ids, summary
  ) values (
    v_dossier.topic_id, v_actor_type, v_actor::text, 'claim_dossier_reviewed',
    array[p_submission_id::text], array[v_review_id::text],
    'Claim dossier review completed with decision: ' || p_decision || '.'
  );
  return v_review_id;
end;
$$;

create or replace function private.guard_claim_dossier_contribution_state()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_dossier private.claim_dossier_submissions%rowtype;
  v_expected_decision text;
begin
  if old.type <> 'claim_dossier' then
    return new;
  end if;
  if (to_jsonb(new) - 'status') <> (to_jsonb(old) - 'status') then
    raise exception using errcode = '55000',
      message = 'claim dossier contribution fields are immutable';
  end if;
  if new.status = old.status then
    return new;
  end if;
  if old.status <> 'submitted'
     or new.status not in ('accepted', 'rejected', 'changes_requested') then
    raise exception using errcode = '55000',
      message = 'invalid claim dossier status transition';
  end if;
  v_expected_decision := case new.status
    when 'accepted' then 'approve'
    when 'changes_requested' then 'request_changes'
    else 'reject'
  end;
  select * into strict v_dossier
  from private.claim_dossier_submissions where id = new.id;
  if not exists (
    select 1
    from public.reviews r
    where r.target_object_id = new.id::text
      and r.target_object_type = 'contribution'
      and r.decision = v_expected_decision
      and r.content_hash = v_dossier.payload_hash
      and r.base_revision_id = v_dossier.base_revision_id
      and r.reviewed_by <> new.created_by
      and char_length(btrim(r.rationale)) between 8 and 2000
  ) then
    raise exception using errcode = '55000',
      message = 'claim dossier status requires its dedicated reviewed payload';
  end if;
  return new;
end;
$$;

create trigger claim_dossier_contribution_state_guard
before update on public.contributions
for each row execute function private.guard_claim_dossier_contribution_state();

create or replace function private.assert_claim_dossier_extension_exists()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
begin
  if new.type = 'claim_dossier' and not exists (
    select 1 from private.claim_dossier_submissions where id = new.id
  ) then
    raise exception using errcode = '23514',
      message = 'claim_dossier contributions require an atomic dossier extension';
  end if;
  return null;
end;
$$;

create constraint trigger claim_dossier_contribution_extension_guard
after insert on public.contributions
deferrable initially deferred
for each row execute function private.assert_claim_dossier_extension_exists();

revoke execute on function
  private.guard_claim_dossier_contribution_state(),
  private.assert_claim_dossier_extension_exists()
from public, anon, authenticated, service_role;

-- 5. Purpose-built private/reviewer/public projections. --------------------

create or replace function public.get_my_claim_dossiers(
  p_topic_id text default null,
  p_limit integer default 25,
  p_before timestamptz default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', d.id,
      'topic_id', d.topic_id,
      'base_revision_id', d.base_revision_id,
      'submission_kind', d.submission_kind,
      'target_position_id', d.target_position_id,
      'target_evidence_link_id', d.target_evidence_link_id,
      'claim_profile', d.claim_profile,
      'claim_text', d.claim_text,
      'argument_summary', d.argument_summary,
      'argument_direction', d.argument_direction,
      'scope_note', d.scope_note,
      'language', d.language,
      'status', c.status,
      'supersedes_submission_id', d.supersedes_submission_id,
      'prepared_revision_id', d.prepared_revision_id,
      'created_at', d.created_at,
      'review', case when latest.id is null then null else jsonb_build_object(
        'decision', latest.decision,
        'rationale', latest.rationale,
        'reviewed_at', latest.reviewed_at
      ) end,
      'evidence', coalesce((
        select jsonb_agg(jsonb_build_object(
          'research_role', e.research_role,
          'source_artifact_id', e.source_artifact_id,
          'offset_unit', e.offset_unit,
          'start_offset', e.start_offset,
          'end_offset', e.end_offset,
          'exact_excerpt', e.exact_excerpt,
          'excerpt_hash', e.excerpt_hash,
          'locator', e.locator,
          'label', e.label,
          'rationale', e.rationale,
          'artifact', jsonb_build_object(
            'artifact_id', a.id,
            'requested_url', a.requested_url,
            'final_url', a.final_url,
            'status', a.retrieval_status,
            'content_type', a.content_type,
            'byte_length', a.byte_length,
            'raw_hash', a.raw_sha256,
            'normalized_hash', a.normalized_sha256,
            'title', a.title,
            'publisher', a.publisher,
            'source_type', a.source_type,
            'parser_version', a.parser_version,
            'is_truncated', a.is_truncated,
            'captured_at', a.captured_at
          )
        ) order by e.research_role desc)
        from private.claim_dossier_evidence e
        join private.source_artifacts a on a.id = e.source_artifact_id
        where e.submission_id = d.id
      ), '[]'::jsonb),
      'change_set', case when cs.id is null then null else jsonb_build_object(
        'id', cs.id,
        'prepared_revision_id', cs.prepared_revision_id,
        'change_set', cs.change_set,
        'change_hash', cs.change_hash,
        'base_snapshot_hash', cs.base_snapshot_hash,
        'prepared_snapshot_hash', cs.prepared_snapshot_hash,
        'created_at', cs.created_at
      ) end
    ) order by d.created_at desc, d.id desc)
    from (
      select d0.*
      from private.claim_dossier_submissions d0
      where d0.submitted_by = v_actor
        and (p_topic_id is null or d0.topic_id = p_topic_id)
        and (p_before is null or d0.created_at < p_before)
      order by d0.created_at desc, d0.id desc
      limit least(greatest(coalesce(p_limit, 25), 1), 50)
    ) d
    join public.contributions c on c.id = d.id
    left join lateral (
      select r.id, r.decision, r.rationale, r.reviewed_at
      from public.reviews r
      where r.target_object_id = d.id::text
        and r.target_object_type = 'contribution'
      order by r.reviewed_at desc, r.id desc
      limit 1
    ) latest on true
    left join private.revision_change_sets cs on cs.submission_id = d.id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.get_review_claim_dossiers(
  p_topic_id text default null,
  p_limit integer default 25,
  p_before timestamptz default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
as $$
begin
  if auth.uid() is null or not public.is_reviewer() then
    raise exception using errcode = '42501', message = 'reviewer role required';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', d.id,
      'topic_id', d.topic_id,
      'topic_title', t.title,
      'base_revision_id', d.base_revision_id,
      'current_revision_id', t.published_revision_id,
      'stale', t.published_revision_id <> d.base_revision_id
        and t.published_revision_id <> d.prepared_revision_id,
      'submission_kind', d.submission_kind,
      'target_position_id', d.target_position_id,
      'target_evidence_link_id', d.target_evidence_link_id,
      'claim_profile', d.claim_profile,
      'claim_text', d.claim_text,
      'argument_summary', d.argument_summary,
      'argument_direction', d.argument_direction,
      'scope_note', d.scope_note,
      'language', d.language,
      'status', c.status,
      'supersedes_submission_id', d.supersedes_submission_id,
      'prepared_revision_id', d.prepared_revision_id,
      'created_at', d.created_at,
      'review', case when latest.id is null then null else jsonb_build_object(
        'decision', latest.decision,
        'rationale', latest.rationale,
        'reviewed_at', latest.reviewed_at
      ) end,
      'evidence', coalesce((
        select jsonb_agg(jsonb_build_object(
          'research_role', e.research_role,
          'source_artifact_id', e.source_artifact_id,
          'offset_unit', e.offset_unit,
          'start_offset', e.start_offset,
          'end_offset', e.end_offset,
          'exact_excerpt', e.exact_excerpt,
          'excerpt_hash', e.excerpt_hash,
          'locator', e.locator,
          'label', e.label,
          'rationale', e.rationale,
          'artifact', jsonb_build_object(
            'artifact_id', a.id,
            'requested_url', a.requested_url,
            'final_url', a.final_url,
            'status', a.retrieval_status,
            'failure_code', a.failure_code,
            'http_status', a.http_status,
            'content_type', a.content_type,
            'byte_length', a.byte_length,
            'raw_hash', a.raw_sha256,
            'normalized_hash', a.normalized_sha256,
            'title', a.title,
            'publisher', a.publisher,
            'source_type', a.source_type,
            'parser_version', a.parser_version,
            'is_truncated', a.is_truncated,
            'captured_at', a.captured_at
          )
        ) order by e.research_role desc)
        from private.claim_dossier_evidence e
        join private.source_artifacts a on a.id = e.source_artifact_id
        where e.submission_id = d.id
      ), '[]'::jsonb),
      'change_set', coalesce(cs.change_set, jsonb_build_object(
        'schema_version', 1,
        'state', 'proposed',
        'adds', jsonb_build_object(
          'claims', 1, 'arguments', 1, 'sources', 2,
          'source_excerpts', 2, 'evidence_links', 2
        ),
        'modifies', '[]'::jsonb,
        'deletes', '[]'::jsonb
      )),
      'change_hash', cs.change_hash,
      'prepared_snapshot_hash', cs.prepared_snapshot_hash
    ) order by
      case c.status when 'submitted' then 0 when 'accepted' then 1 else 2 end,
      d.created_at desc, d.id desc)
    from (
      select d0.*
      from private.claim_dossier_submissions d0
      where (p_topic_id is null or d0.topic_id = p_topic_id)
        and (p_before is null or d0.created_at < p_before)
      order by d0.created_at desc, d0.id desc
      limit least(greatest(coalesce(p_limit, 25), 1), 50)
    ) d
    join public.contributions c on c.id = d.id
    join public.topics t on t.id = d.topic_id
    left join lateral (
      select r.id, r.decision, r.rationale, r.reviewed_at
      from public.reviews r
      where r.target_object_id = d.id::text
        and r.target_object_type = 'contribution'
      order by r.reviewed_at desc, r.id desc
      limit 1
    ) latest on true
    left join private.revision_change_sets cs on cs.submission_id = d.id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.get_claim_dossier_detail(
  p_submission_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_actor uuid := auth.uid();
  v_result jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if not exists (
    select 1
    from private.claim_dossier_submissions d
    where d.id = p_submission_id
      and (d.submitted_by = v_actor or public.is_reviewer())
  ) then
    raise exception using errcode = '42501',
      message = 'claim dossier detail is not available to this account';
  end if;

  select jsonb_build_object(
    'id', d.id,
    'topic_id', d.topic_id,
    'base_revision_id', d.base_revision_id,
    'submission_kind', d.submission_kind,
    'target_position_id', d.target_position_id,
    'target_evidence_link_id', d.target_evidence_link_id,
    'claim_profile', d.claim_profile,
    'claim_text', d.claim_text,
    'argument_summary', d.argument_summary,
    'argument_direction', d.argument_direction,
    'scope_note', d.scope_note,
    'language', d.language,
    'status', c.status,
    'supersedes_submission_id', d.supersedes_submission_id,
    'prepared_revision_id', d.prepared_revision_id,
    'created_at', d.created_at,
    'review', case when latest.id is null then null else jsonb_build_object(
      'decision', latest.decision,
      'rationale', latest.rationale,
      'reviewed_at', latest.reviewed_at
    ) end,
    'evidence', coalesce((
      select jsonb_agg(jsonb_build_object(
        'research_role', e.research_role,
        'source_artifact_id', e.source_artifact_id,
        'offset_unit', e.offset_unit,
        'start_offset', e.start_offset,
        'end_offset', e.end_offset,
        'exact_excerpt', e.exact_excerpt,
        'excerpt_hash', e.excerpt_hash,
        'locator', e.locator,
        'label', e.label,
        'rationale', e.rationale,
        'artifact', jsonb_build_object(
          'artifact_id', a.id,
          'requested_url', a.requested_url,
          'final_url', a.final_url,
          'status', a.retrieval_status,
          'failure_code', a.failure_code,
          'http_status', a.http_status,
          'content_type', a.content_type,
          'byte_length', a.byte_length,
          'raw_hash', a.raw_sha256,
          'normalized_hash', a.normalized_sha256,
          'normalized_text', a.normalized_text,
          'title', a.title,
          'publisher', a.publisher,
          'source_type', a.source_type,
          'parser_version', a.parser_version,
          'is_truncated', a.is_truncated,
          'captured_at', a.captured_at
        )
      ) order by e.research_role desc)
      from private.claim_dossier_evidence e
      join private.source_artifacts a on a.id = e.source_artifact_id
      where e.submission_id = d.id
    ), '[]'::jsonb),
    'change_set', case when cs.id is null then null else jsonb_build_object(
      'id', cs.id,
      'prepared_revision_id', cs.prepared_revision_id,
      'change_set', cs.change_set,
      'change_hash', cs.change_hash,
      'base_snapshot_hash', cs.base_snapshot_hash,
      'prepared_snapshot_hash', cs.prepared_snapshot_hash,
      'created_at', cs.created_at
    ) end
  ) into v_result
  from private.claim_dossier_submissions d
  join public.contributions c on c.id = d.id
  left join lateral (
    select r.id, r.decision, r.rationale, r.reviewed_at
    from public.reviews r
    where r.target_object_id = d.id::text
      and r.target_object_type = 'contribution'
    order by r.reviewed_at desc, r.id desc
    limit 1
  ) latest on true
  left join private.revision_change_sets cs on cs.submission_id = d.id
  where d.id = p_submission_id;

  return v_result;
end;
$$;

create or replace function public.get_public_claim_dossiers(p_topic_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_revision_id text;
begin
  select r.id into v_revision_id
  from public.topics t
  join public.debate_revisions r on r.id = t.published_revision_id
  where t.id = p_topic_id
    and t.status = 'published'
    and r.status = 'published';
  if v_revision_id is null then
    return '[]'::jsonb;
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', d.id,
      'topic_id', d.topic_id,
      'revision_id', v_revision_id,
      'prepared_revision_id', cs.prepared_revision_id,
      'base_revision_id', cs.base_revision_id,
      'submission_kind', d.submission_kind,
      'target_position_id', a_new.position_id,
      'target_evidence_link_id',
        coalesce(cs.change_set#>>'{target,current_evidence_link_id}', d.target_evidence_link_id),
      'claim_profile', d.claim_profile,
      'claim_id', c_new.id,
      'claim_text', c_new.text,
      'argument_id', a_new.id,
      'argument_summary', a_new.summary,
      'argument_direction', a_new.direction,
      'scope_note', d.scope_note,
      'language', d.language,
      'review_status', 'reviewed_and_published',
      'review', jsonb_build_object(
        'decision', dossier_review.decision,
        'rationale', dossier_review.rationale,
        'reviewed_at', dossier_review.reviewed_at
      ),
      'evidence', coalesce((
        select jsonb_agg(jsonb_build_object(
          'evidence_link_id', el.id,
          'research_role', el.research_role,
          'relation', el.label,
          'rationale', el.rationale,
          'exact_excerpt', x.text,
          'offset_unit', x.offset_unit,
          'start_offset', x.start_offset,
          'end_offset', x.end_offset,
          'excerpt_hash', x.excerpt_hash,
          'locator', x.locator,
          'source', jsonb_build_object(
            'id', s.id,
            'url', s.url,
            'title', s.title,
            'publisher', s.publisher,
            'source_type', s.source_type,
            'retrieval_status', s.retrieval_status,
            'retrieved_at', s.retrieved_at,
            'content_hash', s.content_hash,
            'normalized_hash', s.artifact_normalized_hash,
            'content_type', s.artifact_content_type,
            'byte_length', s.artifact_byte_length,
            'parser_version', s.artifact_parser_version,
            'is_truncated', s.artifact_is_truncated
          )
        ) order by el.research_role desc)
        from public.evidence_links el
        join public.sources s
          on s.id = el.source_id and s.revision_id = el.revision_id
        join public.source_excerpts x
          on x.id = el.source_excerpt_id
         and x.source_id = s.id
         and x.revision_id = s.revision_id
        where el.revision_id = v_revision_id
          and el.origin_dossier_submission_id = d.id
      ), '[]'::jsonb),
      'change_set', cs.change_set,
      'change_hash', cs.change_hash,
      'published_at', r.published_at,
      'pilot_limit', profile.public_limit_note,
      'disclaimer', 'This reviewed dossier shows how captured artifacts relate to one bounded claim. It does not certify truth or research completeness.'
    ) order by cs.created_at, d.id)
    from private.revision_change_sets cs
    join private.claim_dossier_submissions d on d.id = cs.submission_id
    join private.claim_dossier_profiles profile on profile.topic_id = d.topic_id
    join public.debate_revisions r on r.id = v_revision_id
    join public.claims c_new
      on c_new.revision_id = v_revision_id
     and c_new.origin_dossier_submission_id = d.id
    join public.debate_arguments a_new
      on a_new.revision_id = v_revision_id
     and a_new.origin_dossier_submission_id = d.id
    join public.reviews dossier_review on dossier_review.id = cs.dossier_review_id
    where cs.topic_id = p_topic_id
      and r.status = 'published'
  ), '[]'::jsonb);
end;
$$;

-- 6. Count-preserving canonical graph clone for dossier preparation. --------

create or replace function private.clone_revision_graph_for_dossier(
  p_base_revision_id text,
  p_new_revision_id text,
  p_topic_id text,
  p_prefix text,
  p_operation_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_old_count integer;
  v_new_count integer;
begin
  with src as (
    select p.*,
      'd_' || p_prefix || '_pos_' ||
        row_number() over (order by p.sort_order, p.id) as new_id
    from public.positions p where p.revision_id = p_base_revision_id
  ), inserted as (
    insert into public.positions (
      id, revision_id, topic_id, title, short_summary, steelman, status,
      generated_by, review_status, sort_order
    )
    select new_id, p_new_revision_id, topic_id, title, short_summary,
      steelman, 'draft', generated_by, review_status, sort_order
    from src returning 1
  )
  insert into private.merge_object_map (
    operation_id, object_kind, old_id, new_id
  ) select p_operation_id, 'position', id, new_id from src;

  with src as (
    select c.*,
      'd_' || p_prefix || '_clm_' ||
        row_number() over (order by c.sort_order, c.id) as new_id
    from public.claims c where c.revision_id = p_base_revision_id
  ), inserted as (
    insert into public.claims (
      id, revision_id, topic_id, text, claim_type, generated_by,
      review_status, sort_order, origin_dossier_submission_id
    )
    select new_id, p_new_revision_id, topic_id, text, claim_type,
      generated_by, review_status, sort_order, origin_dossier_submission_id
    from src returning 1
  )
  insert into private.merge_object_map (
    operation_id, object_kind, old_id, new_id
  ) select p_operation_id, 'claim', id, new_id from src;

  with src as (
    select s.*,
      'd_' || p_prefix || '_src_' ||
        row_number() over (order by s.sort_order, s.id) as new_id
    from public.sources s where s.revision_id = p_base_revision_id
  ), inserted as (
    insert into public.sources (
      id, revision_id, topic_id, url, title, publisher, source_type,
      retrieval_status, retrieved_at, quality_notes, content_hash,
      content_version, sort_order, source_artifact_id,
      origin_dossier_submission_id, artifact_content_type,
      artifact_byte_length, artifact_normalized_hash, artifact_parser_version,
      artifact_is_truncated, retrieval_error_code
    )
    select new_id, p_new_revision_id, topic_id, url, title, publisher,
      source_type, retrieval_status, retrieved_at, quality_notes, content_hash,
      content_version, sort_order, source_artifact_id,
      origin_dossier_submission_id, artifact_content_type,
      artifact_byte_length, artifact_normalized_hash, artifact_parser_version,
      artifact_is_truncated, retrieval_error_code
    from src returning 1
  )
  insert into private.merge_object_map (
    operation_id, object_kind, old_id, new_id
  ) select p_operation_id, 'source', id, new_id from src;

  with src as (
    select x.*,
      'd_' || p_prefix || '_exc_' ||
        row_number() over (order by x.source_id, x.id) as new_id
    from public.source_excerpts x where x.revision_id = p_base_revision_id
  ), inserted as (
    insert into public.source_excerpts (
      id, revision_id, source_id, text, locator, extracted_by, created_at,
      start_offset, end_offset, offset_unit, excerpt_hash,
      origin_dossier_submission_id
    )
    select src.new_id, p_new_revision_id, source_map.new_id, src.text,
      src.locator, src.extracted_by, src.created_at, src.start_offset,
      src.end_offset, src.offset_unit, src.excerpt_hash,
      src.origin_dossier_submission_id
    from src
    join private.merge_object_map source_map
      on source_map.operation_id = p_operation_id
     and source_map.object_kind = 'source'
     and source_map.old_id = src.source_id
    returning 1
  )
  insert into private.merge_object_map (
    operation_id, object_kind, old_id, new_id
  ) select p_operation_id, 'source_excerpt', id, new_id from src;

  with src as (
    select v.*,
      'd_' || p_prefix || '_val_' ||
        row_number() over (order by v.sort_order, v.id) as new_id
    from public.debate_values v where v.revision_id = p_base_revision_id
  ), inserted as (
    insert into public.debate_values (
      id, revision_id, topic_id, name, description, tension_with, sort_order
    )
    select new_id, p_new_revision_id, topic_id, name, description,
      tension_with, sort_order from src returning 1
  )
  insert into private.merge_object_map (
    operation_id, object_kind, old_id, new_id
  ) select p_operation_id, 'value', id, new_id from src;

  insert into public.debate_arguments (
    id, revision_id, position_id, direction, summary, claim_ids,
    generated_by, review_status, sort_order, origin_dossier_submission_id
  )
  select 'd_' || p_prefix || '_arg_' ||
      row_number() over (order by a.sort_order, a.id),
    p_new_revision_id, position_map.new_id, a.direction, a.summary,
    (
      select coalesce(array_agg(
        case when claim_map.new_id is null
          then public.raise_dangling(a.id, u.claim_id)
          else claim_map.new_id end
        order by u.ordinality
      ), '{}'::text[])
      from unnest(a.claim_ids) with ordinality as u(claim_id, ordinality)
      left join private.merge_object_map claim_map
        on claim_map.operation_id = p_operation_id
       and claim_map.object_kind = 'claim'
       and claim_map.old_id = u.claim_id
    ),
    a.generated_by, a.review_status, a.sort_order,
    a.origin_dossier_submission_id
  from public.debate_arguments a
  join private.merge_object_map position_map
    on position_map.operation_id = p_operation_id
   and position_map.object_kind = 'position'
   and position_map.old_id = a.position_id
  where a.revision_id = p_base_revision_id;

  with src as (
    select e.*,
      'd_' || p_prefix || '_ev_' ||
        row_number() over (order by e.sort_order, e.id) as new_id
    from public.evidence_links e where e.revision_id = p_base_revision_id
  ), inserted as (
    insert into public.evidence_links (
      id, revision_id, claim_id, source_id, source_excerpt_id, label,
      rationale, confidence, assessment_state, review_status, sort_order,
      research_role, origin_dossier_submission_id
    )
    select src.new_id, p_new_revision_id, claim_map.new_id,
      source_map.new_id, excerpt_map.new_id, src.label, src.rationale,
      src.confidence, src.assessment_state, src.review_status, src.sort_order,
      src.research_role, src.origin_dossier_submission_id
    from src
    join private.merge_object_map claim_map
      on claim_map.operation_id = p_operation_id
     and claim_map.object_kind = 'claim'
     and claim_map.old_id = src.claim_id
    join private.merge_object_map source_map
      on source_map.operation_id = p_operation_id
     and source_map.object_kind = 'source'
     and source_map.old_id = src.source_id
    left join private.merge_object_map excerpt_map
      on excerpt_map.operation_id = p_operation_id
     and excerpt_map.object_kind = 'source_excerpt'
     and excerpt_map.old_id = src.source_excerpt_id
    returning 1
  )
  insert into private.merge_object_map (
    operation_id, object_kind, old_id, new_id
  ) select p_operation_id, 'evidence_link', id, new_id from src;

  insert into public.value_positions (value_id, position_id, revision_id)
  select value_map.new_id, position_map.new_id, p_new_revision_id
  from public.value_positions vp
  join private.merge_object_map value_map
    on value_map.operation_id = p_operation_id
   and value_map.object_kind = 'value'
   and value_map.old_id = vp.value_id
  join private.merge_object_map position_map
    on position_map.operation_id = p_operation_id
   and position_map.object_kind = 'position'
   and position_map.old_id = vp.position_id
  where vp.revision_id = p_base_revision_id;

  insert into public.tradeoffs (
    id, revision_id, topic_id, position_id, gain, cost, risk, review_status
  )
  select 'd_' || p_prefix || '_to_' ||
      row_number() over (order by t.id),
    p_new_revision_id, p_topic_id, position_map.new_id,
    t.gain, t.cost, t.risk, t.review_status
  from public.tradeoffs t
  join private.merge_object_map position_map
    on position_map.operation_id = p_operation_id
   and position_map.object_kind = 'position'
   and position_map.old_id = t.position_id
  where t.revision_id = p_base_revision_id;

  -- The dossier path intentionally does not carry claim evaluations or bridge
  -- endorsements forward. A new evidence set cannot inherit a truth-state.
  select count(*) into v_old_count from public.positions where revision_id = p_base_revision_id;
    select count(*) into v_new_count from public.positions where revision_id = p_new_revision_id;
    if v_old_count <> v_new_count then raise exception 'position clone count mismatch'; end if;
    select count(*) into v_old_count from public.claims where revision_id = p_base_revision_id;
    select count(*) into v_new_count from public.claims where revision_id = p_new_revision_id;
    if v_old_count <> v_new_count then raise exception 'claim clone count mismatch'; end if;
    select count(*) into v_old_count from public.sources where revision_id = p_base_revision_id;
    select count(*) into v_new_count from public.sources where revision_id = p_new_revision_id;
    if v_old_count <> v_new_count then raise exception 'source clone count mismatch'; end if;
    select count(*) into v_old_count from public.source_excerpts where revision_id = p_base_revision_id;
    select count(*) into v_new_count from public.source_excerpts where revision_id = p_new_revision_id;
    if v_old_count <> v_new_count then raise exception 'excerpt clone count mismatch'; end if;
    select count(*) into v_old_count from public.debate_arguments where revision_id = p_base_revision_id;
    select count(*) into v_new_count from public.debate_arguments where revision_id = p_new_revision_id;
    if v_old_count <> v_new_count then raise exception 'argument clone count mismatch'; end if;
    select count(*) into v_old_count from public.evidence_links where revision_id = p_base_revision_id;
    select count(*) into v_new_count from public.evidence_links where revision_id = p_new_revision_id;
    if v_old_count <> v_new_count then raise exception 'evidence clone count mismatch'; end if;
    select count(*) into v_old_count from public.debate_values where revision_id = p_base_revision_id;
    select count(*) into v_new_count from public.debate_values where revision_id = p_new_revision_id;
    if v_old_count <> v_new_count then raise exception 'value clone count mismatch'; end if;
    select count(*) into v_old_count from public.value_positions where revision_id = p_base_revision_id;
    select count(*) into v_new_count from public.value_positions where revision_id = p_new_revision_id;
    if v_old_count <> v_new_count then raise exception 'value-position clone count mismatch'; end if;
    select count(*) into v_old_count from public.tradeoffs where revision_id = p_base_revision_id;
    select count(*) into v_new_count from public.tradeoffs where revision_id = p_new_revision_id;
  if v_old_count <> v_new_count then raise exception 'tradeoff clone count mismatch'; end if;
end;
$$;

revoke execute on function private.clone_revision_graph_for_dossier(
  text, text, text, text, uuid
)
from public, anon, authenticated, service_role;

-- Prepare is deliberately mechanical: it clones the current published graph,
-- applies one already-reviewed dossier, seals an exact diff/hash, and stops at
-- an unreviewed draft. It never calls review_revision() or publish_revision().
create or replace function public.prepare_claim_dossier_revision(
  p_submission_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_contribution public.contributions%rowtype;
  v_dossier private.claim_dossier_submissions%rowtype;
  v_topic public.topics%rowtype;
  v_review_id uuid;
  v_existing_change_set_id uuid;
  v_operation_id uuid := extensions.gen_random_uuid();
  v_prefix text;
  v_new_revision_id text;
  v_new_revision_number integer;
  v_current_position_id text;
  v_current_evidence_id text;
  v_claim_id text;
  v_argument_id text;
  v_source_id text;
  v_excerpt_id text;
  v_evidence_id text;
  v_source_ids text[] := '{}'::text[];
  v_excerpt_ids text[] := '{}'::text[];
  v_evidence_ids text[] := '{}'::text[];
  v_evidence private.claim_dossier_evidence%rowtype;
  v_artifact private.source_artifacts%rowtype;
  v_change_set jsonb;
  v_change_hash text;
  v_base_hash text;
  v_prepared_hash text;
  v_change_set_id uuid;
  v_sort integer;
begin
  if v_actor is null or not public.is_admin() then
    raise exception using errcode = '42501', message = 'admin role required';
  end if;
  if p_submission_id is null then
    raise exception using errcode = '22023', message = 'submission id is required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('prepare-dossier:' || p_submission_id::text, 0)
  );
  select * into v_contribution
  from public.contributions
  where id = p_submission_id and type = 'claim_dossier'
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'claim dossier not found';
  end if;
  select * into strict v_dossier
  from private.claim_dossier_submissions
  where id = p_submission_id
  for update;

  if v_dossier.prepared_revision_id is not null then
    select id into strict v_existing_change_set_id
    from private.revision_change_sets
    where submission_id = p_submission_id;
    return jsonb_build_object(
      'revision_id', v_dossier.prepared_revision_id,
      'change_set_id', v_existing_change_set_id,
      'idempotent', true
    );
  end if;
  if v_contribution.status <> 'accepted' then
    raise exception using errcode = '55000',
      message = 'only an accepted claim dossier can prepare a revision';
  end if;

  select * into v_topic
  from public.topics
  where id = v_dossier.topic_id
  for update;
  if not found or v_topic.status <> 'published'
     or v_topic.published_revision_id <> v_dossier.base_revision_id then
    raise exception using errcode = '40001',
      message = 'claim dossier base revision is stale';
  end if;
  if not exists (
    select 1 from private.claim_dossier_profiles p
    where p.topic_id = v_dossier.topic_id
      and p.profile_name = v_dossier.claim_profile
      and p.enabled
  ) then
    raise exception using errcode = '55000',
      message = 'claim dossier pilot profile is no longer enabled';
  end if;

  select r.id into v_review_id
  from public.reviews r
  where r.target_object_id = p_submission_id::text
    and r.target_object_type = 'contribution'
    and r.decision = 'approve'
    and r.content_hash = v_dossier.payload_hash
    and r.base_revision_id = v_dossier.base_revision_id
    and r.reviewed_by <> v_dossier.submitted_by
    and char_length(btrim(r.rationale)) between 8 and 2000
  order by r.reviewed_at desc, r.id desc
  limit 1;
  if v_review_id is null then
    raise exception using errcode = '55000',
      message = 'accepted dossier has no exact independent approval';
  end if;

  v_prefix := left(replace(v_operation_id::text, '-', ''), 16);
  v_new_revision_id := 'rev_' ||
    left(regexp_replace(v_dossier.topic_id, '[^a-zA-Z0-9]+', '_', 'g'), 40) ||
    '_d_' || v_prefix;
  select coalesce(max(revision_number), 0) + 1
  into v_new_revision_number
  from public.debate_revisions
  where topic_id = v_dossier.topic_id;

  insert into public.debate_revisions (
    id, topic_id, revision_number, status, review_status, generated_by,
    created_by, base_revision_id, change_set_hash
  ) values (
    v_new_revision_id, v_dossier.topic_id, v_new_revision_number,
    'draft', 'unreviewed', 'mixed', v_actor,
    v_dossier.base_revision_id, null
  );

  perform private.clone_revision_graph_for_dossier(
    v_dossier.base_revision_id,
    v_new_revision_id,
    v_dossier.topic_id,
    v_prefix,
    v_operation_id
  );

  select new_id into strict v_current_position_id
  from private.merge_object_map
  where operation_id = v_operation_id
    and object_kind = 'position'
    and old_id = v_dossier.target_position_id;
  if v_dossier.submission_kind = 'challenge' then
    select new_id into strict v_current_evidence_id
    from private.merge_object_map
    where operation_id = v_operation_id
      and object_kind = 'evidence_link'
      and old_id = v_dossier.target_evidence_link_id;
  end if;

  v_claim_id := 'd_' || v_prefix || '_claim';
  v_argument_id := 'd_' || v_prefix || '_argument';
  insert into public.claims (
    id, revision_id, topic_id, text, claim_type, generated_by,
    review_status, sort_order, origin_dossier_submission_id
  ) values (
    v_claim_id, v_new_revision_id, v_dossier.topic_id,
    v_dossier.claim_text, array['factual']::text[], 'human',
    'unreviewed',
    (select coalesce(max(sort_order), 0) + 1
     from public.claims where revision_id = v_new_revision_id),
    v_dossier.id
  );

  insert into public.debate_arguments (
    id, revision_id, position_id, direction, summary, claim_ids,
    generated_by, review_status, sort_order, origin_dossier_submission_id
  ) values (
    v_argument_id, v_new_revision_id, v_current_position_id,
    v_dossier.argument_direction, v_dossier.argument_summary,
    array[v_claim_id], 'human', 'unreviewed',
    (select coalesce(max(sort_order), 0) + 1
     from public.debate_arguments
     where revision_id = v_new_revision_id
       and position_id = v_current_position_id),
    v_dossier.id
  );

  for v_evidence in
    select e.*
    from private.claim_dossier_evidence e
    where e.submission_id = v_dossier.id
    order by case e.research_role when 'support' then 0 else 1 end
  loop
    select * into strict v_artifact
    from private.source_artifacts where id = v_evidence.source_artifact_id;
    v_source_id := 'd_' || v_prefix || '_source_' || v_evidence.research_role;
    v_excerpt_id := 'd_' || v_prefix || '_excerpt_' || v_evidence.research_role;
    v_evidence_id := 'd_' || v_prefix || '_evidence_' || v_evidence.research_role;

    select coalesce(max(sort_order), 0) + 1 into v_sort
    from public.sources where revision_id = v_new_revision_id;
    insert into public.sources (
      id, revision_id, topic_id, url, title, publisher, source_type,
      retrieval_status, retrieved_at, quality_notes, content_hash,
      content_version, sort_order, source_artifact_id,
      origin_dossier_submission_id
    ) values (
      v_source_id, v_new_revision_id, v_dossier.topic_id,
      v_artifact.final_url, v_artifact.title, v_artifact.publisher,
      v_artifact.source_type, v_artifact.retrieval_status,
      v_artifact.captured_at,
      'Authenticated bounded byte capture; research role is not a truth verdict.',
      v_artifact.raw_sha256, v_artifact.parser_version, v_sort,
      v_artifact.id, v_dossier.id
    );

    insert into public.source_excerpts (
      id, revision_id, source_id, text, locator, extracted_by,
      start_offset, end_offset, offset_unit, excerpt_hash,
      origin_dossier_submission_id
    ) values (
      v_excerpt_id, v_new_revision_id, v_source_id,
      v_evidence.exact_excerpt, v_evidence.locator, 'human',
      v_evidence.start_offset, v_evidence.end_offset,
      v_evidence.offset_unit, v_evidence.excerpt_hash, v_dossier.id
    );

    select coalesce(max(sort_order), 0) + 1 into v_sort
    from public.evidence_links where revision_id = v_new_revision_id;
    insert into public.evidence_links (
      id, revision_id, claim_id, source_id, source_excerpt_id, label,
      rationale, confidence, assessment_state, review_status, sort_order,
      research_role, origin_dossier_submission_id
    ) values (
      v_evidence_id, v_new_revision_id, v_claim_id, v_source_id,
      v_excerpt_id, v_evidence.label, v_evidence.rationale, 0.50,
      case when v_evidence.label = 'unclear'
        then 'inconclusive' else 'assessed' end,
      'approved', v_sort, v_evidence.research_role, v_dossier.id
    );

    v_source_ids := array_append(v_source_ids, v_source_id);
    v_excerpt_ids := array_append(v_excerpt_ids, v_excerpt_id);
    v_evidence_ids := array_append(v_evidence_ids, v_evidence_id);
  end loop;

  v_change_set := jsonb_build_object(
    'schema_version', 1,
    'state', 'prepared',
    'submission_id', v_dossier.id,
    'submission_kind', v_dossier.submission_kind,
    'claim_profile', v_dossier.claim_profile,
    'base_revision_id', v_dossier.base_revision_id,
    'prepared_revision_id', v_new_revision_id,
    'supersedes_submission_id', v_dossier.supersedes_submission_id,
    'target', jsonb_build_object(
      'base_position_id', v_dossier.target_position_id,
      'current_position_id', v_current_position_id,
      'base_evidence_link_id', v_dossier.target_evidence_link_id,
      'current_evidence_link_id', v_current_evidence_id
    ),
    'adds', jsonb_build_object(
      'claim_ids', to_jsonb(array[v_claim_id]),
      'argument_ids', to_jsonb(array[v_argument_id]),
      'source_ids', to_jsonb(v_source_ids),
      'source_excerpt_ids', to_jsonb(v_excerpt_ids),
      'evidence_link_ids', to_jsonb(v_evidence_ids)
    ),
    'modifies', '[]'::jsonb,
    'deletes', '[]'::jsonb,
    'verdict_carry_forward', false,
    'disclaimer', 'Research roles describe source coverage; they do not certify truth. Retrieval failure is not refutation.'
  );
  v_change_hash := 'sha256:' || encode(
    extensions.digest(convert_to(v_change_set::text, 'UTF8'), 'sha256'), 'hex'
  );

  update public.debate_revisions
  set change_set_hash = v_change_hash
  where id = v_new_revision_id;

  v_base_hash := public.revision_content_hash(v_dossier.base_revision_id);
  v_prepared_hash := public.revision_content_hash(v_new_revision_id);
  insert into private.revision_change_sets (
    submission_id, topic_id, base_revision_id, prepared_revision_id,
    dossier_review_id, base_snapshot_hash, prepared_snapshot_hash,
    change_set, change_hash, created_by
  ) values (
    v_dossier.id, v_dossier.topic_id, v_dossier.base_revision_id,
    v_new_revision_id, v_review_id, v_base_hash, v_prepared_hash,
    v_change_set, v_change_hash, v_actor
  ) returning id into v_change_set_id;

  update private.claim_dossier_submissions
  set prepared_revision_id = v_new_revision_id
  where id = v_dossier.id;

  insert into public.audit_events (
    topic_id, revision_id, actor_type, actor_id, event_type,
    input_object_ids, output_object_ids, summary
  ) values (
    v_dossier.topic_id, v_new_revision_id, 'admin', v_actor::text,
    'claim_dossier_revision_prepared',
    array[v_dossier.base_revision_id, v_dossier.id::text, v_review_id::text],
    array[v_new_revision_id, v_change_set_id::text],
    'Accepted dossier applied as a digest-pinned draft awaiting an independent revision review.'
  );

  delete from private.merge_object_map where operation_id = v_operation_id;
  return jsonb_build_object(
    'revision_id', v_new_revision_id,
    'change_set_id', v_change_set_id,
    'idempotent', false
  );
end;
$$;

-- 7. Explicit least-privilege API surface. ---------------------------------

-- The hardening migration grants whole-row contribution inserts for legacy
-- clients. Keep those legacy fields available, but prevent clients from
-- supplying server-owned id/status/merge fields. claim_dossier additionally
-- requires the private one-time intent consumed by the hardening trigger.
revoke insert on public.contributions from authenticated;
grant insert (
  topic_id, type, body, title, url, proposed_label, target_object_id
) on public.contributions to authenticated;

revoke execute on function
  public.reserve_source_capture(uuid, uuid, text),
  public.store_source_artifact(uuid, uuid, jsonb),
  public.get_claim_dossier_limits(),
  public.submit_claim_dossier(jsonb, uuid),
  public.review_claim_dossier(uuid, text, text),
  public.get_my_claim_dossiers(text, integer, timestamptz),
  public.get_review_claim_dossiers(text, integer, timestamptz),
  public.get_claim_dossier_detail(uuid),
  public.get_public_claim_dossiers(text),
  public.prepare_claim_dossier_revision(uuid)
from public, anon, authenticated, service_role;

grant execute on function
  public.reserve_source_capture(uuid, uuid, text),
  public.store_source_artifact(uuid, uuid, jsonb)
to service_role;

grant execute on function
  public.get_claim_dossier_limits(),
  public.get_public_claim_dossiers(text)
to anon, authenticated;

grant execute on function
  public.submit_claim_dossier(jsonb, uuid),
  public.review_claim_dossier(uuid, text, text),
  public.get_my_claim_dossiers(text, integer, timestamptz),
  public.get_review_claim_dossiers(text, integer, timestamptz),
  public.get_claim_dossier_detail(uuid),
  public.prepare_claim_dossier_revision(uuid)
to authenticated;

commit;
