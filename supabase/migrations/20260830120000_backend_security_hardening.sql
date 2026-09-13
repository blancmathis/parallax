begin;

-- ==========================================================================
-- Backend security hardening. This migration is intentionally additive: old
-- migrations remain an immutable record, while their exposed contracts are
-- narrowed or replaced here.
-- ==========================================================================

-- 1. Upgrade preflight ------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from public.topics t
    join public.debate_revisions r on r.id = t.published_revision_id
    where r.topic_id <> t.id
  ) then
    raise exception 'preflight: topic points to another topic''s revision';
  end if;

  if exists (
    select 1
    from public.positions p
    join public.debate_revisions r on r.id = p.revision_id
    where p.topic_id <> r.topic_id
  ) or exists (
    select 1
    from public.claims c
    join public.debate_revisions r on r.id = c.revision_id
    where c.topic_id <> r.topic_id
  ) or exists (
    select 1
    from public.sources s
    join public.debate_revisions r on r.id = s.revision_id
    where s.topic_id <> r.topic_id
  ) or exists (
    select 1
    from public.debate_values v
    join public.debate_revisions r on r.id = v.revision_id
    where v.topic_id <> r.topic_id
  ) or exists (
    select 1
    from public.tradeoffs t
    join public.debate_revisions r on r.id = t.revision_id
    where t.topic_id <> r.topic_id
  ) then
    raise exception 'preflight: child topic/revision mismatch';
  end if;

  if exists (
    select 1
    from public.debate_arguments a
    join public.positions p on p.id = a.position_id
    where a.revision_id <> p.revision_id
  ) or exists (
    select 1
    from public.source_excerpts x
    join public.sources s on s.id = x.source_id
    where x.revision_id <> s.revision_id
  ) or exists (
    select 1
    from public.tradeoffs t
    join public.positions p on p.id = t.position_id
    where t.revision_id <> p.revision_id
  ) then
    raise exception 'preflight: cross-revision child reference';
  end if;

  if exists (
    select 1
    from public.evidence_links e
    join public.claims c on c.id = e.claim_id
    join public.sources s on s.id = e.source_id
    left join public.source_excerpts x on x.id = e.source_excerpt_id
    where e.revision_id <> c.revision_id
       or e.revision_id <> s.revision_id
       or (x.id is not null and (
         x.revision_id <> e.revision_id or x.source_id <> e.source_id
       ))
  ) then
    raise exception 'preflight: cross-revision evidence link';
  end if;

  if exists (
    select 1
    from public.value_positions vp
    join public.debate_values v on v.id = vp.value_id
    join public.positions p on p.id = vp.position_id
    where v.revision_id <> p.revision_id
  ) then
    raise exception 'preflight: cross-revision value/position link';
  end if;

  if exists (
    select 1
    from public.debate_arguments a
    cross join lateral unnest(a.claim_ids) claim_id
    left join public.claims c
      on c.id = claim_id and c.revision_id = a.revision_id
    where c.id is null
  ) then
    raise exception 'preflight: dangling or cross-revision argument claim';
  end if;
end;
$$;

-- 2. Add the minimum provenance and state needed by the hardened contracts. --

alter table public.sources
  add column if not exists content_version text;

-- Keep retrieval provenance machine-verifiable. Historical bare SHA-256 values
-- are upgraded without changing their digest; unknown formats stop the
-- migration instead of being silently discarded or relabeled.
update public.sources
set content_hash = 'sha256:' || lower(content_hash)
where content_hash ~ '^[0-9A-Fa-f]{64}$';

update public.sources
set content_hash = lower(content_hash)
where content_hash ~* '^sha256:[0-9a-f]{64}$';

do $$
begin
  if exists (
    select 1
    from public.sources
    where content_hash is not null
      and content_hash !~ '^sha256:[0-9a-f]{64}$'
  ) then
    raise exception
      'source content_hash contains an unsupported value; manual provenance review required';
  end if;
end;
$$;

alter table public.sources
  add constraint sources_content_hash_sha256_ck
  check (content_hash is null or content_hash ~ '^sha256:[0-9a-f]{64}$')
  not valid;
alter table public.sources
  validate constraint sources_content_hash_sha256_ck;

alter table public.evidence_links
  add column if not exists assessment_state text;
update public.evidence_links
set assessment_state = 'legacy_unverified'
where assessment_state is null;
alter table public.evidence_links
  alter column assessment_state set default 'legacy_unverified',
  alter column assessment_state set not null;
alter table public.evidence_links
  add constraint evidence_links_assessment_state_ck
  check (assessment_state in (
    'legacy_unverified', 'not_assessed', 'pending_review',
    'assessed', 'inconclusive', 'error'
  )) not valid;
alter table public.evidence_links
  validate constraint evidence_links_assessment_state_ck;

alter table public.seed_packets
  add column if not exists error_code text,
  add column if not exists failure_recorded_at timestamptz;
alter table public.ai_jobs
  add column if not exists error_code text;

alter table public.debate_revisions
  add column if not exists base_revision_id text
    references public.debate_revisions(id) on delete restrict,
  add column if not exists change_set_hash text,
  add column if not exists reviewed_content_hash text,
  add column if not exists approved_by uuid
    references auth.users(id) on delete set null;
alter table public.debate_revisions
  add constraint debate_revisions_change_set_hash_ck
  check (
    change_set_hash is null
    or change_set_hash ~ '^sha256:[0-9a-f]{64}$'
  ) not valid,
  add constraint debate_revisions_reviewed_content_hash_ck
  check (
    reviewed_content_hash is null
    or reviewed_content_hash ~ '^sha256:[0-9a-f]{64}$'
  ) not valid;
alter table public.debate_revisions
  validate constraint debate_revisions_change_set_hash_ck;
alter table public.debate_revisions
  validate constraint debate_revisions_reviewed_content_hash_ck;

alter table public.reviews
  add column if not exists content_hash text,
  add column if not exists base_revision_id text,
  add column if not exists change_set_hash text;
alter table public.reviews
  add constraint reviews_content_hash_ck
  check (content_hash is null or content_hash ~ '^sha256:[0-9a-f]{64}$')
  not valid,
  add constraint reviews_change_set_hash_ck
  check (
    change_set_hash is null
    or change_set_hash ~ '^sha256:[0-9a-f]{64}$'
  ) not valid;
alter table public.reviews validate constraint reviews_content_hash_ck;
alter table public.reviews validate constraint reviews_change_set_hash_ck;

update public.reviews
set rationale = 'Legacy review migrated without a sufficiently detailed rationale.'
where char_length(btrim(coalesce(rationale, ''))) < 8;
do $$
begin
  if exists (
    select 1 from public.reviews
    where char_length(btrim(rationale)) > 2000
  ) then
    raise exception 'review rationale exceeds the 2000 character safety bound';
  end if;
end;
$$;
alter table public.reviews
  add constraint reviews_rationale_bounded_ck
  check (char_length(btrim(rationale)) between 8 and 2000) not valid;
alter table public.reviews
  validate constraint reviews_rationale_bounded_ck;

update public.claim_evaluations
set rationale = case
  when authored_by = 'bridge'
    then 'Derived from the recorded cross-camp bridge outcome.'
  else 'Legacy evaluation migrated without a recorded rationale.'
end
where char_length(btrim(coalesce(rationale, ''))) < 8;
do $$
begin
  if exists (
    select 1 from public.claim_evaluations
    where char_length(btrim(rationale)) > 2000
  ) then
    raise exception 'claim evaluation rationale exceeds the 2000 character safety bound';
  end if;
end;
$$;
alter table public.claim_evaluations
  add constraint claim_evaluations_rationale_bounded_ck
  check (char_length(btrim(rationale)) between 8 and 2000) not valid;
alter table public.claim_evaluations
  validate constraint claim_evaluations_rationale_bounded_ck;

alter table public.source_integrity
  add column if not exists legacy_source_key text,
  add column if not exists identity_version smallint not null default 2,
  add column if not exists assessment_state text not null default 'pending_review',
  add column if not exists assessment_rationale text,
  add column if not exists assessed_content_version text;

update public.source_integrity
set legacy_source_key = coalesce(legacy_source_key, source_key),
    identity_version = 1,
    assessment_state = 'legacy_unverified',
    assessment_rationale = coalesce(
      nullif(btrim(assessment_rationale), ''),
      'Legacy source assessment requires confirmation under exact URL identity.'
    );

alter table public.source_integrity
  alter column assessment_rationale set not null,
  alter column assessment_state set default 'pending_review';
alter table public.source_integrity
  add constraint source_integrity_assessment_state_ck
  check (assessment_state in (
    'legacy_unverified', 'pending_review', 'confirmed',
    'rejected', 'withdrawn', 'stale'
  )) not valid;
alter table public.source_integrity
  validate constraint source_integrity_assessment_state_ck;
alter table public.source_integrity
  add constraint source_integrity_rationale_bounded_ck
  check (
    char_length(btrim(assessment_rationale)) between 8 and 2000
  ) not valid;
alter table public.source_integrity
  validate constraint source_integrity_rationale_bounded_ck;
alter table public.source_integrity
  add constraint source_integrity_content_hash_ck
  check (
    content_hash is null or content_hash ~ '^sha256:[0-9a-f]{64}$'
  ) not valid,
  add constraint source_integrity_proof_ref_bounded_ck
  check (char_length(proof_ref) <= 2048) not valid;
alter table public.source_integrity
  validate constraint source_integrity_content_hash_ck;
alter table public.source_integrity
  validate constraint source_integrity_proof_ref_bounded_ck;

-- Preserve explicit uncertainty instead of coercing it to a reassuring value.
alter table public.source_integrity
  drop constraint if exists source_integrity_fabrication_record_check;
alter table public.source_integrity
  add constraint source_integrity_fabrication_record_check
  check (fabrication_record in (
    'unknown', 'none_known', 'corrected_history',
    'retraction_history', 'documented_fabrication'
  ));
alter table public.source_integrity
  drop constraint if exists source_integrity_sensitive_domain_check;
alter table public.source_integrity
  add constraint source_integrity_sensitive_domain_check
  check (sensitive_domain in (
    'unknown', 'none', 'health', 'law', 'finance', 'living_persons'
  ));

-- Conservative identity v2: trim; lowercase scheme + host only; preserve the
-- http/https distinction, path/query value/fragment case and trailing slash;
-- remove only tracking parameters without reordering the remaining query.
do $$
begin
  if exists (
    select 1
    from public.source_integrity
    group by coalesce(nullif(btrim(sample_url), ''), source_key)
    having count(*) > 1
  ) then
    raise exception 'source identity v2 collision: manual resolution required';
  end if;
end;
$$;

create or replace function public.source_key(p_url text)
returns text
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_input text := btrim(coalesce(p_url, ''));
  v_url_match text[];
  v_authority_match text[];
  v_scheme text;
  v_authority text;
  v_rest text;
  v_before_fragment text;
  v_fragment text := '';
  v_path text;
  v_query text;
  v_kept_query text := '';
  v_has_kept boolean := false;
  v_part text;
begin
  if v_input = '' then
    return '';
  end if;

  v_url_match := regexp_match(
    v_input,
    '^([A-Za-z][A-Za-z0-9+.-]*)://([^/?#]*)(.*)$'
  );
  if v_url_match is null then
    return v_input;
  end if;

  v_scheme := lower(v_url_match[1]);
  v_authority := v_url_match[2];
  v_rest := v_url_match[3];

  -- Preserve userinfo and port byte-for-byte; only the host is case-folded.
  v_authority_match := regexp_match(
    v_authority,
    '^(.*@)?(\[[^]]+\]|[^:]*)(:[0-9]+)?$'
  );
  if v_authority_match is not null then
    v_authority := coalesce(v_authority_match[1], '')
      || lower(v_authority_match[2])
      || coalesce(v_authority_match[3], '');
  else
    v_authority := lower(v_authority);
  end if;

  if position('#' in v_rest) > 0 then
    v_before_fragment := substring(v_rest from 1 for position('#' in v_rest) - 1);
    v_fragment := substring(v_rest from position('#' in v_rest));
  else
    v_before_fragment := v_rest;
  end if;

  if position('?' in v_before_fragment) > 0 then
    v_path := substring(
      v_before_fragment from 1 for position('?' in v_before_fragment) - 1
    );
    v_query := substring(
      v_before_fragment from position('?' in v_before_fragment) + 1
    );
    foreach v_part in array regexp_split_to_array(v_query, '&') loop
      if lower(split_part(v_part, '=', 1)) !~ '^(utm_.*|fbclid|gclid)$' then
        if v_has_kept then
          v_kept_query := v_kept_query || '&';
        end if;
        v_kept_query := v_kept_query || v_part;
        v_has_kept := true;
      end if;
    end loop;
    v_before_fragment := v_path;
    if v_has_kept then
      v_before_fragment := v_before_fragment || '?' || v_kept_query;
    end if;
  end if;

  return v_scheme || '://' || v_authority || v_before_fragment || v_fragment;
end;
$$;

-- Storage-safe public URL boundary. Legacy identities remain readable through
-- source_key(), while every new packet, contribution, source and retrieval must
-- be credential-free, parseable, and limited to ordinary web ports. Common
-- secret-bearing query keys are rejected rather than persisted or projected.
create or replace function public.is_safe_public_url(p_url text)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_url text := btrim(coalesce(p_url, ''));
  v_match text[];
  v_scheme text;
  v_authority text;
  v_tail text;
  v_query text;
  v_fragment text;
  v_part text;
  v_key text;
begin
  if v_url = '' or length(v_url) > 2048
     or v_url ~ '[[:cntrl:][:space:]]' then
    return false;
  end if;

  v_match := regexp_match(
    v_url,
    '^(https?)://([^/?#]+)(.*)$',
    'i'
  );
  if v_match is null then
    return false;
  end if;
  v_scheme := lower(v_match[1]);
  v_authority := v_match[2];
  v_tail := v_match[3];

  if position('@' in v_authority) > 0 then
    return false;
  end if;
  if left(v_authority, 1) = '[' then
    if v_authority !~ '^\[[0-9A-Fa-f:.]+\](:(80|443))?$' then
      return false;
    end if;
  elsif v_authority !~ '^[A-Za-z0-9.-]+(:(80|443))?$' then
    return false;
  end if;
  if (v_scheme = 'https' and v_authority ~ ':80$')
     or (v_scheme = 'http' and v_authority ~ ':443$') then
    return false;
  end if;

  if position('?' in v_tail) > 0 then
    v_query := substring(v_tail from position('?' in v_tail) + 1);
    if position('#' in v_query) > 0 then
      v_query := substring(v_query from 1 for position('#' in v_query) - 1);
    end if;
    foreach v_part in array regexp_split_to_array(v_query, '&') loop
      v_key := lower(split_part(v_part, '=', 1));
      -- Fail closed on encoded parameter names. Decoding only a subset makes
      -- filters bypassable (`%74oken`), while URL values may remain encoded.
      if position('%' in v_key) > 0 then
        return false;
      end if;
      if v_key ~ '(^|[_-])(access[_-]?token|token|secret|client[_-]?secret|password|passwd|api[_-]?key|apikey|authorization|credential|signature|session|jwt|key)($|[_-])'
         or v_key in ('fb_access_token', 'x-amz-signature', 'x-goog-signature') then
        return false;
      end if;
    end loop;
  end if;

  if position('#' in v_tail) > 0 then
    v_fragment := substring(v_tail from position('#' in v_tail) + 1);
    if v_fragment ~* '(^|[&;_./-])(access[_-]?token|token|secret|client[_-]?secret|password|passwd|api[_-]?key|apikey|authorization|credential|signature|session|jwt|key)([=&;_./-]|$)'
       or (position('=' in v_fragment) > 0 and position('%' in v_fragment) > 0) then
      return false;
    end if;
  end if;

  return true;
end;
$$;

alter table public.sources
  add constraint sources_new_url_safe_ck
  check (public.is_safe_public_url(url)) not valid;
alter table public.contributions
  add constraint contributions_new_url_safe_ck
  check (url is null or public.is_safe_public_url(url)) not valid;

do $$
begin
  if exists (
    select 1
    from public.source_integrity
    group by coalesce(nullif(public.source_key(sample_url), ''), source_key)
    having count(*) > 1
  ) then
    raise exception 'source identity v2 collision: manual resolution required';
  end if;
end;
$$;

update public.source_integrity
set source_key = coalesce(nullif(public.source_key(sample_url), ''), source_key),
    identity_version = 2;

-- 3. Make topic/revision ownership relationally enforceable. ---------------

alter table public.debate_revisions
  add constraint debate_revisions_id_topic_uq unique (id, topic_id);
alter table public.positions
  add constraint positions_id_revision_uq unique (id, revision_id);
alter table public.claims
  add constraint claims_id_revision_uq unique (id, revision_id);
alter table public.sources
  add constraint sources_id_revision_uq unique (id, revision_id);
alter table public.source_excerpts
  add constraint source_excerpts_id_source_revision_uq
  unique (id, source_id, revision_id);
alter table public.debate_values
  add constraint debate_values_id_revision_uq unique (id, revision_id);

alter table public.value_positions
  add column if not exists revision_id text;
update public.value_positions vp
set revision_id = v.revision_id
from public.debate_values v
where v.id = vp.value_id and vp.revision_id is null;
alter table public.value_positions
  alter column revision_id set not null;

alter table public.topics
  add constraint topics_published_revision_topic_fk
  foreign key (published_revision_id, id)
  references public.debate_revisions (id, topic_id) not valid;
alter table public.positions
  add constraint positions_revision_topic_fk
  foreign key (revision_id, topic_id)
  references public.debate_revisions (id, topic_id) not valid;
alter table public.claims
  add constraint claims_revision_topic_fk
  foreign key (revision_id, topic_id)
  references public.debate_revisions (id, topic_id) not valid;
alter table public.sources
  add constraint sources_revision_topic_fk
  foreign key (revision_id, topic_id)
  references public.debate_revisions (id, topic_id) not valid;
alter table public.debate_values
  add constraint debate_values_revision_topic_fk
  foreign key (revision_id, topic_id)
  references public.debate_revisions (id, topic_id) not valid;
alter table public.tradeoffs
  add constraint tradeoffs_revision_topic_fk
  foreign key (revision_id, topic_id)
  references public.debate_revisions (id, topic_id) not valid;
alter table public.debate_arguments
  add constraint debate_arguments_position_revision_fk
  foreign key (position_id, revision_id)
  references public.positions (id, revision_id) not valid;
alter table public.source_excerpts
  add constraint source_excerpts_source_revision_fk
  foreign key (source_id, revision_id)
  references public.sources (id, revision_id) not valid;
alter table public.evidence_links
  add constraint evidence_links_claim_revision_fk
  foreign key (claim_id, revision_id)
  references public.claims (id, revision_id) not valid;
alter table public.evidence_links
  add constraint evidence_links_source_revision_fk
  foreign key (source_id, revision_id)
  references public.sources (id, revision_id) not valid;
alter table public.evidence_links
  add constraint evidence_links_excerpt_source_revision_fk
  foreign key (source_excerpt_id, source_id, revision_id)
  references public.source_excerpts (id, source_id, revision_id) not valid;
alter table public.tradeoffs
  add constraint tradeoffs_position_revision_fk
  foreign key (position_id, revision_id)
  references public.positions (id, revision_id) not valid;
alter table public.value_positions
  add constraint value_positions_value_revision_fk
  foreign key (value_id, revision_id)
  references public.debate_values (id, revision_id) not valid;
alter table public.value_positions
  add constraint value_positions_position_revision_fk
  foreign key (position_id, revision_id)
  references public.positions (id, revision_id) not valid;

alter table public.topics validate constraint topics_published_revision_topic_fk;
alter table public.positions validate constraint positions_revision_topic_fk;
alter table public.claims validate constraint claims_revision_topic_fk;
alter table public.sources validate constraint sources_revision_topic_fk;
alter table public.debate_values validate constraint debate_values_revision_topic_fk;
alter table public.tradeoffs validate constraint tradeoffs_revision_topic_fk;
alter table public.debate_arguments validate constraint debate_arguments_position_revision_fk;
alter table public.source_excerpts validate constraint source_excerpts_source_revision_fk;
alter table public.evidence_links validate constraint evidence_links_claim_revision_fk;
alter table public.evidence_links validate constraint evidence_links_source_revision_fk;
alter table public.evidence_links validate constraint evidence_links_excerpt_source_revision_fk;
alter table public.tradeoffs validate constraint tradeoffs_position_revision_fk;
alter table public.value_positions validate constraint value_positions_value_revision_fk;
alter table public.value_positions validate constraint value_positions_position_revision_fk;

create unique index debate_revisions_one_published_per_topic
  on public.debate_revisions (topic_id)
  where status = 'published';

alter table public.topics
  add constraint topics_published_pointer_ck
  check (status <> 'published' or published_revision_id is not null) not valid;
alter table public.topics validate constraint topics_published_pointer_ck;

alter table public.debate_revisions
  add constraint debate_revisions_published_shape_ck
  check (
    status <> 'published'
    or published_at is not null
  ) not valid;
alter table public.debate_revisions
  validate constraint debate_revisions_published_shape_ck;

-- 4. Immutable published history and coherent draft writes. ----------------

create or replace function public.assert_revision_mutable()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_old_revision text;
  v_new_revision text;
  v_status text;
begin
  if tg_op <> 'INSERT' then
    v_old_revision := old.revision_id;
  end if;
  if tg_op <> 'DELETE' then
    v_new_revision := new.revision_id;
  end if;

  for v_status in
    select status
    from public.debate_revisions
    where id in (v_old_revision, v_new_revision)
    for update
  loop
    if v_status in ('published', 'superseded') then
      raise exception using
        errcode = '55000',
        message = 'published or superseded revisions are immutable';
    end if;
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists positions_immutable_published on public.positions;
drop trigger if exists debate_arguments_immutable_published on public.debate_arguments;
drop trigger if exists claims_immutable_published on public.claims;
drop trigger if exists sources_immutable_published on public.sources;
drop trigger if exists source_excerpts_immutable_published on public.source_excerpts;
drop trigger if exists evidence_links_immutable_published on public.evidence_links;
drop trigger if exists debate_values_immutable_published on public.debate_values;
drop trigger if exists tradeoffs_immutable_published on public.tradeoffs;

create trigger positions_immutable_published
before insert or update or delete on public.positions
for each row execute function public.assert_revision_mutable();
create trigger debate_arguments_immutable_published
before insert or update or delete on public.debate_arguments
for each row execute function public.assert_revision_mutable();
create trigger claims_immutable_published
before insert or update or delete on public.claims
for each row execute function public.assert_revision_mutable();
create trigger sources_immutable_published
before insert or update or delete on public.sources
for each row execute function public.assert_revision_mutable();
create trigger source_excerpts_immutable_published
before insert or update or delete on public.source_excerpts
for each row execute function public.assert_revision_mutable();
create trigger evidence_links_immutable_published
before insert or update or delete on public.evidence_links
for each row execute function public.assert_revision_mutable();
create trigger debate_values_immutable_published
before insert or update or delete on public.debate_values
for each row execute function public.assert_revision_mutable();
create trigger tradeoffs_immutable_published
before insert or update or delete on public.tradeoffs
for each row execute function public.assert_revision_mutable();

create or replace function public.guard_value_position()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_value_revision text;
  v_position_revision text;
  v_revision_status text;
begin
  if tg_op <> 'INSERT' then
    select status into v_revision_status
    from public.debate_revisions
    where id = old.revision_id
    for update;
    if v_revision_status in ('published', 'superseded') then
      raise exception using
        errcode = '55000',
        message = 'published or superseded revisions are immutable';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  select revision_id into strict v_value_revision
  from public.debate_values where id = new.value_id;
  select revision_id into strict v_position_revision
  from public.positions where id = new.position_id;

  if v_value_revision <> v_position_revision then
    raise exception using
      errcode = '23514',
      message = 'value and position must belong to the same revision';
  end if;

  select status into strict v_revision_status
  from public.debate_revisions
  where id = v_value_revision
  for update;
  if v_revision_status in ('published', 'superseded') then
    raise exception using
      errcode = '55000',
      message = 'published or superseded revisions are immutable';
  end if;

  new.revision_id := v_value_revision;
  if exists (
    select 1 from public.debate_revisions
    where id = new.revision_id and status in ('published', 'superseded')
  ) then
    raise exception using
      errcode = '55000',
      message = 'published or superseded revisions are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists value_positions_guard on public.value_positions;
create trigger value_positions_guard
before insert or update or delete on public.value_positions
for each row execute function public.guard_value_position();

create or replace function public.assert_argument_claim_refs()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1
    from unnest(new.claim_ids) claim_id
    left join public.claims c
      on c.id = claim_id and c.revision_id = new.revision_id
    where c.id is null
  ) then
    raise exception using
      errcode = '23514',
      message = 'argument claims must belong to the same revision';
  end if;
  return new;
end;
$$;

create trigger debate_arguments_claim_refs_guard
before insert or update of revision_id, claim_ids on public.debate_arguments
for each row execute function public.assert_argument_claim_refs();

create or replace function public.guard_evidence_unknown()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_retrieval_status text;
begin
  select retrieval_status into strict v_retrieval_status
  from public.sources
  where id = new.source_id and revision_id = new.revision_id;

  if v_retrieval_status in ('missing', 'blocked', 'failed') then
    new.label := 'unclear';
    new.assessment_state := 'error';
  elsif new.label = 'unclear' then
    new.assessment_state := 'inconclusive';
  elsif new.assessment_state in ('not_assessed', 'pending_review', 'error') then
    new.assessment_state := 'assessed';
  end if;
  return new;
end;
$$;

create trigger evidence_links_unknown_guard
before insert or update of source_id, revision_id, label, assessment_state
on public.evidence_links
for each row execute function public.guard_evidence_unknown();

create or replace function public.assert_revision_publishable(p_revision_id text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if (select count(*) from public.positions where revision_id = p_revision_id) < 2 then
    raise exception using errcode = '23514',
      message = 'publication requires at least two positions';
  end if;
  if not exists (select 1 from public.claims where revision_id = p_revision_id) then
    raise exception using errcode = '23514',
      message = 'publication requires at least one claim';
  end if;
  if exists (
    select 1
    from public.positions p
    where p.revision_id = p_revision_id
      and not exists (
        select 1 from public.debate_arguments a
        where a.revision_id = p_revision_id and a.position_id = p.id
      )
  ) then
    raise exception using errcode = '23514',
      message = 'every published position requires an argument';
  end if;
  if exists (
    select 1 from public.debate_arguments
    where revision_id = p_revision_id and cardinality(claim_ids) = 0
  ) then
    raise exception using errcode = '23514',
      message = 'every published argument requires at least one claim';
  end if;
  if exists (
    select 1 from public.positions
    where revision_id = p_revision_id
      and (status in ('contested', 'archived') or review_status in ('contested', 'rejected'))
  ) or exists (
    select 1 from public.debate_arguments
    where revision_id = p_revision_id and review_status in ('contested', 'rejected')
  ) or exists (
    select 1 from public.claims
    where revision_id = p_revision_id and review_status in ('contested', 'rejected')
  ) or exists (
    select 1 from public.evidence_links
    where revision_id = p_revision_id and review_status in ('contested', 'rejected')
  ) or exists (
    select 1 from public.tradeoffs
    where revision_id = p_revision_id and review_status in ('contested', 'rejected')
  ) then
    raise exception using errcode = '23514',
      message = 'contested or rejected children cannot be published';
  end if;
  if exists (
    select 1
    from public.claims c
    where c.revision_id = p_revision_id
      and c.claim_type && array['factual', 'causal', 'predictive']::text[]
      and not exists (
        select 1
        from public.evidence_links e
        join public.sources s
          on s.id = e.source_id and s.revision_id = e.revision_id
        join public.source_excerpts x
          on x.id = e.source_excerpt_id
         and x.source_id = e.source_id
         and x.revision_id = e.revision_id
        where e.revision_id = p_revision_id
          and e.claim_id = c.id
          and e.review_status = 'approved'
          and e.assessment_state = 'assessed'
          and s.retrieval_status in ('found', 'partial')
          and s.retrieved_at is not null
          and s.content_hash ~ '^sha256:[0-9a-f]{64}$'
          and e.label <> 'unclear'
          and char_length(btrim(e.rationale)) between 8 and 2000
          and btrim(x.text) <> ''
          and btrim(x.locator) <> ''
      )
  ) then
    raise exception using errcode = '23514',
      message = 'empirical claims require inspectable, assessed evidence';
  end if;
end;
$$;

create or replace function public.guard_revision_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception using errcode = '55000',
        message = 'revisions must be created as drafts';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception using errcode = '55000',
        message = 'published or superseded revisions cannot be deleted';
    end if;
    return old;
  end if;

  if new.id <> old.id
     or new.topic_id <> old.topic_id
     or new.revision_number <> old.revision_number
     or new.created_by is distinct from old.created_by
     or new.created_at <> old.created_at then
    raise exception using errcode = '55000',
      message = 'revision identity is immutable';
  end if;

  if old.status = 'superseded' then
    raise exception using errcode = '55000',
      message = 'superseded revisions are immutable';
  end if;

  if old.status = 'published' then
    if new.status <> 'superseded'
       or (to_jsonb(new) - 'status') <> (to_jsonb(old) - 'status') then
      raise exception using errcode = '55000',
        message = 'published revisions may only transition to superseded';
    end if;
    return new;
  end if;

  if new.status = 'published' then
    if new.published_at is null then
      raise exception using errcode = '23514',
        message = 'published revision requires a publication time';
    end if;
    -- Supabase's trusted seed phase runs as the database owner without an auth
    -- actor and loads explicitly unreviewed demo fixtures. Every application
    -- publication has a non-null auth.uid() and must pass the production gate;
    -- API roles have no direct table mutation privilege.
    if auth.uid() is not null then
      perform public.assert_revision_publishable(new.id);
    end if;
  elsif new.status <> 'draft' then
    raise exception using errcode = '55000',
      message = 'invalid revision lifecycle transition';
  end if;
  return new;
end;
$$;

create trigger debate_revisions_lifecycle_guard
before insert or update or delete on public.debate_revisions
for each row execute function public.guard_revision_lifecycle();

create or replace function public.guard_topic_publication()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.status = 'published' and not exists (
    select 1
    from public.debate_revisions r
    where r.id = new.published_revision_id
      and r.topic_id = new.id
      and r.status = 'published'
  ) then
    raise exception using errcode = '23514',
      message = 'published topic must point to its own published revision';
  end if;
  return new;
end;
$$;

create trigger topics_publication_guard
before insert or update of status, published_revision_id on public.topics
for each row execute function public.guard_topic_publication();

-- 5. Private, server-authoritative position ballots. ------------------------

create table public.position_signal_ballots (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  phase text not null check (phase in ('before', 'after')),
  position_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id, phase)
);

create index position_signal_ballots_aggregate_idx
  on public.position_signal_ballots (topic_id, phase, position_id);
alter table public.position_signal_ballots enable row level security;

create or replace function public.position_signal_bucket(
  p_topic_id text,
  p_position_id text
)
returns text
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_bucket text;
  v_sort_order integer;
begin
  if p_position_id is null or p_position_id = '__undecided__' then
    return '__undecided__';
  end if;

  if p_position_id ~ '^pos_[a-z]$' then
    v_sort_order := ascii(substring(p_position_id from 5 for 1)) - 96;
    if exists (
      select 1
      from public.topics t
      join public.positions p on p.revision_id = t.published_revision_id
      where t.id = p_topic_id and t.status = 'published'
        and p.sort_order = v_sort_order
    ) then
      return p_position_id;
    end if;
  else
    select 'pos_' || chr(96 + p.sort_order)
      into v_bucket
    from public.topics t
    join public.positions p on p.revision_id = t.published_revision_id
    where t.id = p_topic_id and t.status = 'published'
      and p.id = p_position_id and p.sort_order between 1 and 26;
    if v_bucket is not null then
      return v_bucket;
    end if;
  end if;

  raise exception using
    errcode = '22023',
    message = 'position does not belong to the published debate';
end;
$$;

create or replace function public.cast_position_signal(
  p_topic_id text,
  p_phase text,
  p_position_id text default null,
  p_from_position text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_target text;
  v_previous text;
begin
  if v_actor is null then
    raise exception using errcode = '28000',
      message = 'authentication required to register a position signal';
  end if;
  if p_phase not in ('before', 'after') then
    raise exception using errcode = '22023', message = 'invalid signal phase';
  end if;
  if not exists (
    select 1
    from public.topics t
    join public.debate_revisions r on r.id = t.published_revision_id
    where t.id = p_topic_id and t.status = 'published' and r.status = 'published'
  ) then
    raise exception using errcode = '22023',
      message = 'signals require a published debate';
  end if;

  v_target := public.position_signal_bucket(p_topic_id, p_position_id);
  -- Compatibility parameter only: the previous choice is server-authoritative.
  perform p_from_position;

  perform pg_advisory_xact_lock(
    hashtext(v_actor::text),
    hashtext(p_topic_id || ':' || p_phase)
  );

  select position_id into v_previous
  from public.position_signal_ballots
  where user_id = v_actor and topic_id = p_topic_id and phase = p_phase
  for update;

  if v_previous = v_target then
    return;
  end if;

  insert into public.position_signal_ballots (
    user_id, topic_id, phase, position_id
  ) values (
    v_actor, p_topic_id, p_phase, v_target
  )
  on conflict (user_id, topic_id, phase) do update
    set position_id = excluded.position_id,
        updated_at = now();

  insert into public.position_signal_pulse (topic_id, casts)
  values (p_topic_id, 1)
  on conflict (topic_id, minute) do update
    set casts = public.position_signal_pulse.casts + 1;
end;
$$;

create or replace function public.get_my_position_signal(p_topic_id text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select case
    when auth.uid() is null then '{}'::jsonb
    else jsonb_build_object(
      'topic_id', p_topic_id,
      'before', max(position_id) filter (where phase = 'before'),
      'after', max(position_id) filter (where phase = 'after')
    )
  end
  from public.position_signal_ballots
  where user_id = auth.uid() and topic_id = p_topic_id
$$;

create or replace function public.get_position_signal(p_topic_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_released boolean;
  v_min_total bigint;
begin
  if not exists (
    select 1
    from public.topics t
    join public.debate_revisions r on r.id = t.published_revision_id
    where t.id = p_topic_id and t.status = 'published' and r.status = 'published'
  ) then
    return jsonb_build_object(
      'topic_id', p_topic_id, 'is_demo', false, 'released', false,
      'totals', '{}'::jsonb, 'confidence', 'emerging',
      'distribution', '[]'::jsonb
    );
  end if;

  with totals as (
    select phase, count(*)::bigint total
    from public.position_signal_ballots
    where topic_id = p_topic_id
    group by phase
  )
  select count(*) = 2 and min(total) >= 20, min(total)
    into v_released, v_min_total
  from totals;

  if not coalesce(v_released, false) then
    return jsonb_build_object(
      'topic_id', p_topic_id, 'is_demo', false, 'released', false,
      'totals', '{}'::jsonb, 'confidence', 'emerging',
      'distribution', '[]'::jsonb
    );
  end if;

  return (
    with raw as (
      select phase, position_id, count(*)::bigint count
      from public.position_signal_ballots
      where topic_id = p_topic_id
      group by phase, position_id
    ),
    totals as (
      select phase, sum(count)::bigint total from raw group by phase
    ),
    buckets as (
      select phase, 'pos_' || chr(96 + p.sort_order) position_id
      from (values ('before'::text), ('after'::text)) phases(phase)
      cross join public.topics t
      join public.positions p on p.revision_id = t.published_revision_id
      where t.id = p_topic_id and p.sort_order between 1 and 26
      union all
      select phase, '__undecided__'
      from (values ('before'::text), ('after'::text)) phases(phase)
    ),
    shaped as (
      select b.phase, b.position_id, coalesce(r.count, 0) count, t.total
      from buckets b
      join totals t on t.phase = b.phase
      left join raw r on r.phase = b.phase and r.position_id = b.position_id
    )
    select jsonb_build_object(
      'topic_id', p_topic_id,
      'is_demo', false,
      'released', true,
      -- Approximate totals only; exact counts remain private.
      'totals', (
        select jsonb_object_agg(phase, floor(total / 20.0)::int * 20)
        from totals
      ),
      'confidence', case
        when v_min_total >= 500 then 'settled'
        when v_min_total >= 100 then 'forming'
        else 'emerging'
      end,
      'distribution', (
        select jsonb_agg(jsonb_build_object(
          'position_id', position_id,
          'phase', phase,
          'withheld', count < 5,
          'share_lo', case when count >= 5
            then floor((100.0 * count / nullif(total, 0)) / 5) * 5 end,
          'share_hi', case when count >= 5
            then floor((100.0 * count / nullif(total, 0)) / 5) * 5 + 5 end
        ) order by phase, position_id)
        from shaped
      )
    )
  );
end;
$$;

-- 6. Reviewer decisions require an inspectable rationale. ------------------

create or replace function public.evaluate_claim(
  p_topic_id text,
  p_claim_id text,
  p_state text,
  p_rationale text default ''
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.is_reviewer() then
    raise exception using errcode = '42501', message = 'reviewer role required';
  end if;
  -- A single reviewer may flag contestability or a values judgment, but only
  -- the cross-camp bridge may produce the stronger `established` state.
  if p_state not in ('contested', 'values') then
    raise exception using errcode = '22023',
      message = 'manual evaluations may only be contested or values';
  end if;
  if char_length(btrim(coalesce(p_rationale, ''))) not between 8 and 2000 then
    raise exception using errcode = '22023',
      message = 'claim evaluation rationale must contain 8 to 2000 characters';
  end if;
  if not exists (
    select 1
    from public.topics t
    join public.claims c on c.revision_id = t.published_revision_id
    where t.id = p_topic_id and t.status = 'published' and c.id = p_claim_id
  ) then
    raise exception using errcode = '22023',
      message = 'claim does not belong to the published debate';
  end if;

  insert into public.claim_evaluations (
    topic_id, claim_id, state, rationale, evaluated_by, authored_by
  ) values (
    p_topic_id, p_claim_id, p_state, btrim(p_rationale), v_actor, 'reviewer'
  )
  on conflict (topic_id, claim_id) do update
    set state = excluded.state,
        rationale = excluded.rationale,
        evaluated_by = excluded.evaluated_by,
        authored_by = 'reviewer',
        evaluated_at = now();

  insert into public.bridge_audit (
    topic_id, actor_id, event_type, claim_id, detail
  ) values (
    p_topic_id, v_actor, 'claim_evaluated', p_claim_id, 'evaluated ' || p_state
  );
end;
$$;

create or replace function public.claim_has_establishment_evidence(
  p_topic_id text,
  p_claim_id text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.topics t
    join public.claims c
      on c.revision_id = t.published_revision_id and c.id = p_claim_id
    join public.evidence_links e
      on e.revision_id = c.revision_id and e.claim_id = c.id
    join public.sources s
      on s.id = e.source_id and s.revision_id = e.revision_id
    join public.source_excerpts x
      on x.id = e.source_excerpt_id
     and x.source_id = e.source_id
     and x.revision_id = e.revision_id
    join public.source_integrity si
      on si.source_key = public.source_key(s.url)
     and si.assessment_state = 'confirmed'
     and si.content_hash = s.content_hash
    cross join lateral public.source_floor_verdict(
      si.content_genre,
      si.editorial_accountability,
      si.correction_policy,
      si.fabrication_record,
      si.independence,
      si.expertise_basis,
      si.identity_basis,
      si.sensitive_domain,
      false,
      c.claim_type,
      false
    ) floor
    where t.id = p_topic_id and t.status = 'published'
      and e.review_status = 'approved'
      and e.assessment_state = 'assessed'
      and e.label <> 'unclear'
      and char_length(btrim(e.rationale)) between 8 and 2000
      and s.retrieval_status in ('found', 'partial')
      and s.retrieved_at is not null
      and s.content_hash ~ '^sha256:[0-9a-f]{64}$'
      and public.is_safe_public_url(s.url)
      and btrim(x.text) <> ''
      and btrim(x.locator) <> ''
      and si.content_genre <> 'unknown'
      and si.editorial_accountability <> 'unknown'
      and si.correction_policy <> 'unknown'
      and si.fabrication_record <> 'unknown'
      and si.independence <> 'unknown'
      and si.expertise_basis <> 'unknown'
      and si.identity_basis <> 'unknown'
      and si.sensitive_domain <> 'unknown'
      and floor.verdict <> 'below_floor'
  )
$$;

create or replace function public.bridge_k()
returns integer
language sql
immutable
set search_path = pg_catalog
as $$ select 2 $$;

create or replace function public.bridge_min_cohort()
returns integer
language sql
immutable
set search_path = pg_catalog
as $$ select 5 $$;

create or replace function public.bridge_outcome(
  p_topic_id text,
  p_claim_id text
)
returns table (
  status text,
  winner_state text,
  camp_count integer,
  endorser_total integer
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with live as (
    select e.state, rc.camp_id, e.reviewer_id
    from public.claim_endorsements e
    join public.reviewer_camps rc
      on rc.topic_id = e.topic_id and rc.reviewer_id = e.reviewer_id
    join public.topics t
      on t.id = e.topic_id and t.status = 'published'
    join public.claims c
      on c.id = e.claim_id
     and c.topic_id = e.topic_id
     and c.revision_id = t.published_revision_id
    where e.topic_id = p_topic_id
      and e.claim_id = p_claim_id
      and rc.camp_id <> '__undecided__'
  ),
  per_state_camp as (
    select state, camp_id, count(distinct reviewer_id)::integer endorsers
    from live
    group by state, camp_id
  ),
  per_state as (
    select
      state,
      count(*) filter (
        where endorsers >= public.bridge_k()
      )::integer qualifying_camps,
      sum(endorsers)::integer endorser_total
    from per_state_camp
    group by state
  ),
  eligible as (
    select *
    from per_state
    where qualifying_camps >= public.bridge_min_camps()
      and endorser_total >= public.bridge_min_cohort()
      and (
        state <> 'established'
        or public.claim_has_establishment_evidence(p_topic_id, p_claim_id)
      )
  ),
  summary as (
    select
      (select count(*)::integer from eligible) eligible_states,
      coalesce((select max(qualifying_camps) from per_state), 0)::integer best_camps,
      coalesce((select max(endorser_total) from per_state), 0)::integer best_total
  )
  select
    case
      when s.eligible_states >= 2 then 'bridged_conflicting'
      when s.eligible_states = 1 and w.state = 'established'
        then 'bridged_established'
      when s.eligible_states = 1 and w.state = 'contested'
        then 'bridged_contested'
      when s.best_camps = 1 then 'pending_single_camp'
      else 'insufficient'
    end,
    case when s.eligible_states = 1 then w.state end,
    case
      when s.eligible_states = 1 then w.qualifying_camps
      when s.best_camps = 1 then 1
      else 0
    end,
    case
      when s.eligible_states = 1 then w.endorser_total
      else s.best_total
    end
  from summary s
  left join lateral (
    select * from eligible order by state limit 1
  ) w on true
$$;

create or replace function public.recompute_bridging(
  p_topic_id text,
  p_claim_id text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_winner text;
  v_camps integer;
  v_human boolean;
  v_rationale text;
begin
  if p_topic_id is null or p_claim_id is null then
    raise exception using errcode = '22023',
      message = 'topic and claim are required';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('parallax:bridge-topic:' || p_topic_id, 0)
  );

  select winner_state, camp_count
    into v_winner, v_camps
  from public.bridge_outcome(p_topic_id, p_claim_id);

  select exists (
    select 1 from public.claim_evaluations
    where topic_id = p_topic_id and claim_id = p_claim_id
      and authored_by = 'reviewer'
  ) into v_human;

  if v_winner is null then
    delete from public.claim_evaluations
    where topic_id = p_topic_id and claim_id = p_claim_id
      and authored_by = 'bridge';
    return;
  end if;
  if v_winner = 'established'
     and not public.claim_has_establishment_evidence(p_topic_id, p_claim_id) then
    delete from public.claim_evaluations
    where topic_id = p_topic_id and claim_id = p_claim_id
      and authored_by = 'bridge';
    return;
  end if;
  if v_human then
    return;
  end if;

  v_rationale := format(
    'Derived from a qualifying cross-camp bridge across %s camps.',
    v_camps
  );
  insert into public.claim_evaluations (
    topic_id, claim_id, state, rationale, evaluated_by, authored_by, is_demo
  ) values (
    p_topic_id, p_claim_id, v_winner, v_rationale, null, 'bridge', false
  )
  on conflict (topic_id, claim_id) do update
    set state = excluded.state,
        rationale = excluded.rationale,
        evaluated_by = null,
        authored_by = 'bridge',
        evaluated_at = now()
    where public.claim_evaluations.authored_by = 'bridge';

  insert into public.bridge_audit (
    topic_id, actor_id, event_type, claim_id, detail
  ) values (
    p_topic_id, null, 'claim_bridged', p_claim_id,
    'Bridged as ' || v_winner || ' across ' || v_camps || ' camps.'
  );
end;
$$;

create or replace function public.endorse_claim_state(
  p_topic_id text,
  p_claim_id text,
  p_state text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_camp text;
begin
  if v_actor is null or not public.is_reviewer() then
    raise exception using errcode = '42501', message = 'reviewer role required';
  end if;
  if p_state not in ('established', 'contested') then
    raise exception using errcode = '22023',
      message = 'invalid endorsement state';
  end if;
  if p_state = 'established'
     and not public.claim_has_establishment_evidence(p_topic_id, p_claim_id) then
    raise exception using errcode = '23514',
      message = 'established endorsements require independently reviewed inspectable evidence';
  end if;
  if not exists (
    select 1
    from public.topics t
    join public.claims c on c.revision_id = t.published_revision_id
    where t.id = p_topic_id and t.status = 'published' and c.id = p_claim_id
  ) then
    raise exception using errcode = '22023',
      message = 'claim does not belong to the published debate';
  end if;

  select camp_id into v_camp
  from public.reviewer_camps
  where topic_id = p_topic_id and reviewer_id = v_actor;
  if v_camp is null or v_camp = '__undecided__' then
    raise exception using errcode = '22023',
      message = 'declare a decided stance before endorsing';
  end if;

  insert into public.claim_endorsements (
    topic_id, claim_id, reviewer_id, state
  ) values (
    p_topic_id, p_claim_id, v_actor, p_state
  )
  on conflict (topic_id, claim_id, reviewer_id) do update
    set state = excluded.state, endorsed_at = now();

  insert into public.bridge_audit (
    topic_id, actor_id, event_type, claim_id, detail
  ) values (
    p_topic_id, v_actor, 'claim_endorsed', p_claim_id, 'endorsed ' || p_state
  );
  perform public.recompute_bridging(p_topic_id, p_claim_id);
end;
$$;

create or replace function public.withdraw_claim_endorsement(
  p_topic_id text,
  p_claim_id text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_deleted boolean;
begin
  if v_actor is null or not public.is_reviewer() then
    raise exception using errcode = '42501', message = 'reviewer role required';
  end if;
  if not exists (
    select 1
    from public.topics t
    join public.claims c on c.revision_id = t.published_revision_id
    where t.id = p_topic_id and t.status = 'published' and c.id = p_claim_id
  ) then
    raise exception using errcode = '22023',
      message = 'claim does not belong to the published debate';
  end if;

  delete from public.claim_endorsements
  where topic_id = p_topic_id
    and claim_id = p_claim_id
    and reviewer_id = v_actor
  returning true into v_deleted;

  if not coalesce(v_deleted, false) then
    return false;
  end if;
  insert into public.bridge_audit (
    topic_id, actor_id, event_type, claim_id, detail
  ) values (
    p_topic_id, v_actor, 'claim_endorsement_withdrawn', p_claim_id,
    'reviewer withdrew their endorsement'
  );
  perform public.recompute_bridging(p_topic_id, p_claim_id);
  return true;
end;
$$;

-- Re-evaluate any bridge materialized under the historical one-reviewer floor.
do $$
declare
  v_pair record;
begin
  for v_pair in
    select topic_id, claim_id from public.claim_endorsements
    union
    select topic_id, claim_id from public.claim_evaluations
    where authored_by = 'bridge'
    order by topic_id, claim_id
  loop
    perform public.recompute_bridging(v_pair.topic_id, v_pair.claim_id);
  end loop;
end;
$$;

create or replace function public.get_claim_bridging(p_topic_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_floor integer := 5;
begin
  if not public.can_read_topic(p_topic_id) then
    return '[]'::jsonb;
  end if;

  return coalesce((
    with published_claims as (
      select c.id claim_id
      from public.topics t
      join public.claims c on c.revision_id = t.published_revision_id
      where t.id = p_topic_id
    ), outcomes as (
      select c.claim_id, b.status, b.camp_count, b.endorser_total
      from published_claims c
      cross join lateral public.bridge_outcome(p_topic_id, c.claim_id) b
    )
    select jsonb_agg(jsonb_build_object(
      'claim_id', claim_id,
      'bridged', case when endorser_total >= v_floor
        then status in ('bridged_established', 'bridged_contested') else false end,
      'bridge_status', case when endorser_total >= v_floor
        then status else 'insufficient' end,
      'camp_count', case when endorser_total >= v_floor then camp_count else 0 end,
      'endorser_band', case
        when endorser_total >= 20 then '20plus'
        when endorser_total >= v_floor then '5to19'
        else 'withheld'
      end
    ) order by claim_id)
    from outcomes
  ), '[]'::jsonb);
end;
$$;

create or replace function public.get_claim_evaluations(p_topic_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_bridge jsonb;
begin
  if not public.can_read_topic(p_topic_id) then
    return '[]'::jsonb;
  end if;
  v_bridge := public.get_claim_bridging(p_topic_id);

  return coalesce((
    with ids as (
      select c.id claim_id
      from public.topics t
      join public.claims c on c.revision_id = t.published_revision_id
      where t.id = p_topic_id
    )
    select jsonb_agg(jsonb_build_object(
      'claim_id', i.claim_id,
      'state', case
        when ev.authored_by = 'bridge'
          and coalesce(b.value ->> 'endorser_band', 'withheld') = 'withheld'
          then null
        else ev.state
      end,
      'rationale', case
        when ev.authored_by = 'bridge'
          and coalesce(b.value ->> 'endorser_band', 'withheld') = 'withheld'
          then ''
        else coalesce(ev.rationale, '')
      end,
      'evaluated_at', case
        when ev.authored_by = 'bridge'
          and coalesce(b.value ->> 'endorser_band', 'withheld') = 'withheld'
          then null
        else ev.evaluated_at
      end,
      'is_demo', coalesce(ev.is_demo, false),
      'bridged', coalesce((b.value ->> 'bridged')::boolean, false),
      'bridge_status', coalesce(b.value ->> 'bridge_status', 'insufficient'),
      'camp_count', coalesce((b.value ->> 'camp_count')::int, 0),
      'endorser_band', coalesce(b.value ->> 'endorser_band', 'withheld')
    ) order by i.claim_id)
    from ids i
    left join public.claim_evaluations ev
      on ev.topic_id = p_topic_id and ev.claim_id = i.claim_id
    left join lateral (
      select item.value
      from jsonb_array_elements(v_bridge) item
      where item.value ->> 'claim_id' = i.claim_id
    ) b on true
  ), '[]'::jsonb);
end;
$$;

-- 7. Exact source identity and explicit unknown/confirmed assessment state. --

create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;

-- Versioned, append-only assessment payloads and review decisions preserve the
-- complete history when a URL later resolves to different content. The public
-- source_integrity row below is only the current projection.
create table private.source_floor_assessments (
  id uuid primary key default extensions.gen_random_uuid(),
  source_key text not null,
  topic_id text not null,
  revision_id text not null,
  source_id text not null,
  content_hash text check (
    content_hash is null or content_hash ~ '^sha256:[0-9a-f]{64}$'
  ),
  content_version text check (
    content_version is null or char_length(content_version) <= 500
  ),
  content_genre text not null check (content_genre in (
    'primary', 'reporting', 'analysis', 'opinion', 'sponsored',
    'ugc', 'ai_generated', 'unknown'
  )),
  editorial_accountability text not null check (editorial_accountability in (
    'named_masthead', 'named_author', 'org_only', 'anonymous', 'none', 'unknown'
  )),
  correction_policy text not null check (
    correction_policy in ('documented', 'informal', 'none', 'unknown')
  ),
  fabrication_record text not null check (fabrication_record in (
    'unknown', 'none_known', 'corrected_history',
    'retraction_history', 'documented_fabrication'
  )),
  independence text not null check (independence in (
    'independent', 'funded_disclosed', 'funded_undisclosed',
    'self_interested', 'unknown'
  )),
  expertise_basis text not null check (expertise_basis in (
    'peer_reviewed', 'domain_expert', 'journalistic', 'lay', 'none', 'unknown'
  )),
  identity_basis text not null check (identity_basis in (
    'verified', 'pseudonymous', 'unverified', 'unknown'
  )),
  sensitive_domain text not null check (sensitive_domain in (
    'unknown', 'none', 'health', 'law', 'finance', 'living_persons'
  )),
  proof_ref text not null default '' check (char_length(proof_ref) <= 2048),
  rationale text not null check (
    char_length(btrim(rationale)) between 8 and 2000
  ),
  proposal_hash text not null unique check (
    proposal_hash ~ '^sha256:[0-9a-f]{64}$'
  ),
  proposed_by uuid not null references auth.users(id) on delete restrict,
  state text not null default 'pending_review' check (
    state in ('pending_review', 'confirmed', 'rejected', 'withdrawn', 'stale')
  ),
  supersedes_assessment_id uuid
    references private.source_floor_assessments(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (source_id, revision_id)
    references public.sources(id, revision_id) on delete restrict,
  foreign key (revision_id, topic_id)
    references public.debate_revisions(id, topic_id) on delete restrict
);

create index source_floor_assessments_identity_version_idx
on private.source_floor_assessments (
  source_key, content_hash, content_version, created_at desc
);

create table private.source_floor_reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  assessment_id uuid not null
    references private.source_floor_assessments(id) on delete restrict,
  proposal_hash text not null check (
    proposal_hash ~ '^sha256:[0-9a-f]{64}$'
  ),
  decision text not null check (decision in ('approve', 'reject', 'withdraw')),
  rationale text not null check (
    char_length(btrim(rationale)) between 8 and 2000
  ),
  reviewed_by uuid not null references auth.users(id) on delete restrict,
  reviewed_at timestamptz not null default now(),
  unique (assessment_id, reviewed_by, decision, proposal_hash)
);

alter table public.source_integrity
  add column if not exists current_assessment_id uuid
    references private.source_floor_assessments(id) on delete restrict;

revoke all on
  private.source_floor_assessments,
  private.source_floor_reviews
from public, anon, authenticated, service_role;

drop function public.assess_source_floor(
  text, text, text, text, text, text,
  text, text, text, text, text, text
);

create function public.assess_source_floor(
  p_topic_id text,
  p_url text,
  p_content_genre text,
  p_editorial_accountability text,
  p_correction_policy text,
  p_fabrication_record text,
  p_independence text,
  p_expertise_basis text,
  p_identity_basis text,
  p_rationale text,
  p_sensitive_domain text default 'unknown',
  p_proof_ref text default '',
  p_content_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_key text := public.source_key(p_url);
  v_source public.sources%rowtype;
  v_assessment_id uuid;
  v_supersedes uuid;
  v_proposal_hash text;
begin
  if v_actor is null or not public.is_reviewer() then
    raise exception using errcode = '42501', message = 'reviewer role required';
  end if;
  if not public.can_read_topic(p_topic_id) then
    raise exception using errcode = '42501', message = 'topic not readable';
  end if;
  if v_key = '' then
    raise exception using errcode = '22023', message = 'source URL required';
  end if;
  if not public.is_safe_public_url(p_url) then
    raise exception using errcode = '22023',
      message = 'source URL cannot contain credentials, unsafe ports, or secret query keys';
  end if;
  if char_length(btrim(coalesce(p_rationale, ''))) not between 8 and 2000 then
    raise exception using errcode = '22023',
      message = 'source assessment rationale must contain 8 to 2000 characters';
  end if;
  if p_content_hash is not null
     and p_content_hash !~ '^sha256:[0-9a-f]{64}$' then
    raise exception using errcode = '22023',
      message = 'source assessment content hash must be SHA-256';
  end if;
  if char_length(coalesce(p_proof_ref, '')) > 2048 then
    raise exception using errcode = '22023',
      message = 'source assessment proof reference exceeds 2048 characters';
  end if;
  select s.* into v_source
    from public.topics t
    join public.sources s on s.revision_id = t.published_revision_id
    where t.id = p_topic_id and public.source_key(s.url) = v_key
    order by s.sort_order, s.id
    limit 1;
  if not found then
    raise exception using errcode = '22023',
      message = 'source does not belong to the published debate';
  end if;
  if p_content_hash is not null
     and p_content_hash is distinct from v_source.content_hash then
    raise exception using errcode = '40001',
      message = 'source assessment hash does not match the published artifact';
  end if;

  select current_assessment_id into v_supersedes
  from public.source_integrity
  where source_key = v_key;

  v_proposal_hash := 'sha256:' || encode(
    extensions.digest(
      convert_to(jsonb_build_object(
        'source_key', v_key,
        'topic_id', p_topic_id,
        'revision_id', v_source.revision_id,
        'source_id', v_source.id,
        'content_hash', v_source.content_hash,
        'content_version', v_source.content_version,
        'content_genre', coalesce(p_content_genre, 'unknown'),
        'editorial_accountability', coalesce(p_editorial_accountability, 'unknown'),
        'correction_policy', coalesce(p_correction_policy, 'unknown'),
        'fabrication_record', coalesce(p_fabrication_record, 'unknown'),
        'independence', coalesce(p_independence, 'unknown'),
        'expertise_basis', coalesce(p_expertise_basis, 'unknown'),
        'identity_basis', coalesce(p_identity_basis, 'unknown'),
        'sensitive_domain', coalesce(p_sensitive_domain, 'unknown'),
        'proof_ref', coalesce(p_proof_ref, ''),
        'rationale', btrim(p_rationale),
        'proposed_by', v_actor
      )::text, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  insert into private.source_floor_assessments (
    source_key, topic_id, revision_id, source_id,
    content_hash, content_version,
    content_genre, editorial_accountability, correction_policy,
    fabrication_record, independence, expertise_basis, identity_basis,
    sensitive_domain, proof_ref, rationale, proposal_hash, proposed_by,
    supersedes_assessment_id
  ) values (
    v_key, p_topic_id, v_source.revision_id, v_source.id,
    v_source.content_hash, v_source.content_version,
    coalesce(p_content_genre, 'unknown'),
    coalesce(p_editorial_accountability, 'unknown'),
    coalesce(p_correction_policy, 'unknown'),
    coalesce(p_fabrication_record, 'unknown'),
    coalesce(p_independence, 'unknown'),
    coalesce(p_expertise_basis, 'unknown'),
    coalesce(p_identity_basis, 'unknown'),
    coalesce(p_sensitive_domain, 'unknown'),
    coalesce(p_proof_ref, ''), btrim(p_rationale), v_proposal_hash, v_actor,
    v_supersedes
  )
  on conflict (proposal_hash) do nothing
  returning id into v_assessment_id;

  if v_assessment_id is null then
    select id into strict v_assessment_id
    from private.source_floor_assessments
    where proposal_hash = v_proposal_hash and proposed_by = v_actor;
  end if;

  insert into public.source_integrity (
    source_key, content_hash, sample_url,
    content_genre, editorial_accountability, correction_policy,
    fabrication_record, independence, expertise_basis, identity_basis,
    sensitive_domain, proof_ref, assessed_by, identity_version,
    assessment_state, assessment_rationale, assessed_content_version,
    current_assessment_id
  ) values (
    v_key, v_source.content_hash, btrim(p_url),
    coalesce(p_content_genre, 'unknown'),
    coalesce(p_editorial_accountability, 'unknown'),
    coalesce(p_correction_policy, 'unknown'),
    coalesce(p_fabrication_record, 'unknown'),
    coalesce(p_independence, 'unknown'),
    coalesce(p_expertise_basis, 'unknown'),
    coalesce(p_identity_basis, 'unknown'),
    coalesce(p_sensitive_domain, 'unknown'),
    coalesce(p_proof_ref, ''), v_actor, 2, 'pending_review', btrim(p_rationale),
    v_source.content_version, v_assessment_id
  )
  on conflict (source_key) do update set
    content_hash = excluded.content_hash,
    sample_url = excluded.sample_url,
    content_genre = excluded.content_genre,
    editorial_accountability = excluded.editorial_accountability,
    correction_policy = excluded.correction_policy,
    fabrication_record = excluded.fabrication_record,
    independence = excluded.independence,
    expertise_basis = excluded.expertise_basis,
    identity_basis = excluded.identity_basis,
    sensitive_domain = excluded.sensitive_domain,
    proof_ref = excluded.proof_ref,
    assessed_by = excluded.assessed_by,
    assessed_at = now(),
    identity_version = 2,
    assessment_state = 'pending_review',
    assessment_rationale = excluded.assessment_rationale,
    assessed_content_version = excluded.assessed_content_version,
    current_assessment_id = excluded.current_assessment_id;

  insert into public.bridge_audit (
    topic_id, actor_id, event_type, detail
  ) values (
    p_topic_id, v_actor, 'source_assessed', 'assessed ' || v_key
  );

  return jsonb_build_object(
    'source_key', v_key,
    'assessment_id', v_assessment_id,
    'proposal_hash', v_proposal_hash,
    'assessment_state', 'pending_review',
    'ok', true
  );
end;
$$;

create or replace function public.get_source_floor(p_topic_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_types text[];
  v_controversial boolean;
begin
  if not public.can_read_topic(p_topic_id) then
    return '[]'::jsonb;
  end if;

  select coalesce(array_agg(distinct ct.value), '{}'::text[])
    into v_types
  from public.claims c
  join public.topics t on t.published_revision_id = c.revision_id
  cross join lateral unnest(c.claim_type) as ct(value)
  where t.id = p_topic_id;

  select exists (
    select 1
    from public.claim_evaluations ev
    join public.topics t on t.id = ev.topic_id
    join public.claims c
      on c.id = ev.claim_id and c.revision_id = t.published_revision_id
    where ev.topic_id = p_topic_id
      and ev.authored_by = 'bridge'
      and ev.state = 'contested'
  ) into v_controversial;

  return coalesce((
    with topic_sources as (
      select distinct on (public.source_key(s.url))
        public.source_key(s.url) source_key,
        s.content_hash source_content_hash
      from public.topics t
      join public.sources s on s.revision_id = t.published_revision_id
      where t.id = p_topic_id and public.source_key(s.url) <> ''
      order by public.source_key(s.url), s.sort_order, s.id
    )
    select jsonb_agg(jsonb_build_object(
      'source_key', ts.source_key,
      'content_hash', coalesce(si.content_hash, ts.source_content_hash),
      'assessment_state', case
        when si.source_key is null then 'unassessed'
        when ts.source_content_hash is null
          or si.content_hash is distinct from ts.source_content_hash then 'stale'
        else si.assessment_state
      end,
      'floor_verdict', case
        when si.source_key is null or si.assessment_state <> 'confirmed'
          or ts.source_content_hash is null
          or si.content_hash is distinct from ts.source_content_hash
          then 'unknown'
        when si.content_genre = 'unknown'
          or si.editorial_accountability = 'unknown'
          or si.correction_policy = 'unknown'
          or si.fabrication_record = 'unknown'
          or si.independence = 'unknown'
          or si.expertise_basis = 'unknown'
          or si.identity_basis = 'unknown'
          or si.sensitive_domain = 'unknown'
          then 'unknown'
        when fv.verdict = 'below_floor' then 'unknown'
        else fv.verdict
      end,
      'rule_id', case
        when si.source_key is null or si.assessment_state <> 'confirmed'
          or ts.source_content_hash is null
          or si.content_hash is distinct from ts.source_content_hash
          then 'insufficient_information'
        when si.content_genre = 'unknown'
          or si.editorial_accountability = 'unknown'
          or si.correction_policy = 'unknown'
          or si.fabrication_record = 'unknown'
          or si.independence = 'unknown'
          or si.expertise_basis = 'unknown'
          or si.identity_basis = 'unknown'
          or si.sensitive_domain = 'unknown'
          then 'insufficient_information'
        when fv.verdict = 'below_floor' then 'independent_confirmation_required'
        else fv.rule_id
      end,
      'rationale', case when si.assessment_state = 'confirmed'
        and ts.source_content_hash is not null
        and si.content_hash = ts.source_content_hash
        then si.assessment_rationale else '' end,
      'is_demo', coalesce(si.is_demo, false),
      'attributes', jsonb_build_object(
        'content_genre', coalesce(si.content_genre, 'unknown'),
        'editorial_accountability', coalesce(si.editorial_accountability, 'unknown'),
        'correction_policy', coalesce(si.correction_policy, 'unknown'),
        'fabrication_record', coalesce(si.fabrication_record, 'unknown'),
        'independence', coalesce(si.independence, 'unknown'),
        'expertise_basis', coalesce(si.expertise_basis, 'unknown'),
        'identity_basis', coalesce(si.identity_basis, 'unknown'),
        'sensitive_domain', coalesce(si.sensitive_domain, 'unknown')
      )
    ) order by ts.source_key)
    from topic_sources ts
    left join public.source_integrity si on si.source_key = ts.source_key
    left join lateral public.source_floor_verdict(
      si.content_genre,
      si.editorial_accountability,
      si.correction_policy,
      si.fabrication_record,
      si.independence,
      si.expertise_basis,
      si.identity_basis,
      si.sensitive_domain,
      v_controversial,
      v_types,
      false
    ) fv on si.source_key is not null
  ), '[]'::jsonb);
end;
$$;

-- Generic fixed-window account quotas. Settings are deliberately private and
-- migration-configurable; API roles can only consume them through bounded RPCs.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;

create table private.account_quota_settings (
  action text primary key,
  window_seconds integer not null check (window_seconds between 60 and 86400),
  max_requests integer not null check (max_requests between 1 and 10000),
  updated_at timestamptz not null default now()
);

insert into private.account_quota_settings (
  action, window_seconds, max_requests
) values
  ('seed_create', 3600, 10),
  ('analysis_claim', 3600, 20),
  ('contribution_submit', 3600, 20)
on conflict (action) do nothing;

create table private.account_quota_windows (
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null references private.account_quota_settings(action),
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (actor_id, action, window_start)
);

revoke all on
  private.account_quota_settings,
  private.account_quota_windows
from public, anon, authenticated, service_role;

create function private.reserve_account_quota(
  p_actor_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  v_window_seconds integer;
  v_max_requests integer;
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_reset_at timestamptz;
  v_request_count integer;
  v_retry_after integer;
begin
  if p_actor_id is null then
    raise exception using errcode = '22023', message = 'quota actor is required';
  end if;

  select window_seconds, max_requests
    into v_window_seconds, v_max_requests
  from private.account_quota_settings
  where action = p_action
  for share;
  if not found then
    raise exception using errcode = '22023', message = 'unknown quota action';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / v_window_seconds) * v_window_seconds
  );
  v_reset_at := v_window_start + make_interval(secs => v_window_seconds);

  insert into private.account_quota_windows (
    actor_id, action, window_start, request_count
  ) values (
    p_actor_id, p_action, v_window_start, 1
  )
  on conflict (actor_id, action, window_start) do update
    set request_count = private.account_quota_windows.request_count + 1
    where private.account_quota_windows.request_count < v_max_requests
  returning request_count into v_request_count;

  if not found then
    v_retry_after := greatest(
      1,
      ceil(extract(epoch from v_reset_at - clock_timestamp()))::integer
    );
    return jsonb_build_object(
      'ok', false,
      'state', 'quota_exceeded',
      'retry_after_seconds', v_retry_after
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'state', 'reserved',
    'remaining', greatest(v_max_requests - v_request_count, 0),
    'reset_at', v_reset_at,
    'retry_after_seconds', 0
  );
end;
$$;

revoke all on function private.reserve_account_quota(uuid, text)
from public, anon, authenticated, service_role;

-- Direct PostgREST inserts remain convenient for the current client, but the
-- database is the authoritative submission boundary. The trigger derives the
-- actor, locks the published revision used to validate every target, rejects
-- fields that do not belong to the selected contribution type, and consumes a
-- persistent account quota only after all validation has succeeded.
alter table public.contributions
  add constraint contributions_body_bounded_ck
  check (char_length(btrim(body)) between 12 and 10000) not valid,
  add constraint contributions_title_bounded_ck
  check (
    title is null or char_length(btrim(title)) between 1 and 300
  ) not valid,
  add constraint contributions_url_bounded_ck
  check (url is null or char_length(url) <= 2048) not valid,
  add constraint contributions_target_bounded_ck
  check (
    target_object_id is null
    or char_length(btrim(target_object_id)) between 1 and 200
  ) not valid;
alter table public.contributions
  validate constraint contributions_body_bounded_ck;
alter table public.contributions
  validate constraint contributions_title_bounded_ck;
alter table public.contributions
  validate constraint contributions_url_bounded_ck;
alter table public.contributions
  validate constraint contributions_target_bounded_ck;

create or replace function private.guard_contribution_submission()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_published_revision_id text;
  v_quota jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if new.created_by is not null and new.created_by <> v_actor then
    raise exception using errcode = '42501',
      message = 'contribution actor must match the authenticated account';
  end if;
  if new.status <> 'submitted'
     or new.merged_revision_id is not null
     or new.merged_at is not null then
    raise exception using errcode = '22023',
      message = 'new contributions must begin as unmerged submissions';
  end if;
  if char_length(btrim(coalesce(new.body, ''))) not between 12 and 10000 then
    raise exception using errcode = '22023',
      message = 'contribution body must contain 12 to 10000 characters';
  end if;
  if new.title is not null
     and char_length(btrim(new.title)) not between 1 and 300 then
    raise exception using errcode = '22023',
      message = 'contribution title must contain 1 to 300 characters';
  end if;
  if new.url is not null and (
    char_length(new.url) > 2048 or not public.is_safe_public_url(new.url)
  ) then
    raise exception using errcode = '22023',
      message = 'contribution URL is unsafe or exceeds 2048 characters';
  end if;
  if new.target_object_id is not null
     and char_length(btrim(new.target_object_id)) not between 1 and 200 then
    raise exception using errcode = '22023',
      message = 'contribution target must contain 1 to 200 characters';
  end if;

  select published_revision_id into v_published_revision_id
  from public.topics
  where id = new.topic_id and status = 'published'
  for share;
  if v_published_revision_id is null then
    raise exception using errcode = '22023',
      message = 'contributions require a published topic revision';
  end if;

  if new.type = 'claim_dossier' then
    raise exception using errcode = '0A000',
      message = 'claim dossier submissions require the dedicated dossier migration';
  elsif new.type = 'new_claim' then
    if new.target_object_id is null or not exists (
      select 1 from public.positions
      where id = new.target_object_id
        and revision_id = v_published_revision_id
    ) then
      raise exception using errcode = '22023',
        message = 'new claims require a position in the current published revision';
    end if;
    if new.proposed_label is not null or new.title is not null then
      raise exception using errcode = '22023',
        message = 'new claims do not accept a title or proposed label';
    end if;
  elsif new.type = 'new_source' then
    if new.target_object_id is null or not exists (
      select 1 from public.claims
      where id = new.target_object_id
        and revision_id = v_published_revision_id
    ) then
      raise exception using errcode = '22023',
        message = 'new sources require a claim in the current published revision';
    end if;
    if new.url is null or not public.is_safe_public_url(new.url)
       or new.proposed_label is not null then
      raise exception using errcode = '22023',
        message = 'new sources require a safe URL and no proposed label';
    end if;
  elsif new.type = 'new_position' then
    if new.target_object_id is not null or new.url is not null
       or new.proposed_label is not null
       or char_length(btrim(coalesce(new.title, ''))) not between 4 and 300 then
      raise exception using errcode = '22023',
        message = 'new positions require a 4 to 300 character title and no target, URL, or label';
    end if;
  elsif new.type = 'challenge_evidence_label' then
    if new.target_object_id is null or not exists (
      select 1 from public.evidence_links
      where id = new.target_object_id
        and revision_id = v_published_revision_id
    ) then
      raise exception using errcode = '22023',
        message = 'label challenges require an evidence link in the current published revision';
    end if;
    if new.proposed_label is null or new.url is not null or new.title is not null then
      raise exception using errcode = '22023',
        message = 'label challenges require a proposed label and no URL or title';
    end if;
  elsif new.type = 'challenge_steelman' then
    if new.target_object_id is null or not exists (
      select 1 from public.positions
      where id = new.target_object_id
        and revision_id = v_published_revision_id
    ) then
      raise exception using errcode = '22023',
        message = 'steelman challenges require a position in the current published revision';
    end if;
    if new.url is not null or new.title is not null or new.proposed_label is not null then
      raise exception using errcode = '22023',
        message = 'steelman challenges do not accept URL, title, or label fields';
    end if;
  elsif new.type = 'value_tradeoff_correction' then
    if new.target_object_id is null or not (
      exists (
        select 1 from public.debate_values
        where id = new.target_object_id
          and revision_id = v_published_revision_id
      ) or exists (
        select 1 from public.tradeoffs
        where id = new.target_object_id
          and revision_id = v_published_revision_id
      )
    ) then
      raise exception using errcode = '22023',
        message = 'value corrections require a value or tradeoff in the current published revision';
    end if;
    if new.url is not null or new.title is not null or new.proposed_label is not null then
      raise exception using errcode = '22023',
        message = 'value corrections do not accept URL, title, or label fields';
    end if;
  else
    raise exception using errcode = '22023', message = 'unsupported contribution type';
  end if;

  if new.type <> 'claim_dossier' then
    v_quota := private.reserve_account_quota(v_actor, 'contribution_submit');
    if not coalesce((v_quota ->> 'ok')::boolean, false) then
      raise exception using
        errcode = 'P0001',
        message = 'contribution_submit_quota_exceeded',
        detail = 'retry_after_seconds=' || (v_quota ->> 'retry_after_seconds');
    end if;
  end if;

  new.created_by := v_actor;
  new.created_at := clock_timestamp();
  new.body := btrim(new.body);
  new.title := nullif(btrim(new.title), '');
  new.url := nullif(btrim(new.url), '');
  return new;
end;
$$;

create trigger contributions_submission_guard
before insert on public.contributions
for each row execute function private.guard_contribution_submission();

revoke all on function private.guard_contribution_submission()
from public, anon, authenticated, service_role;

create table private.revision_draft_actors (
  revision_id text not null
    references public.debate_revisions(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  first_recorded_at timestamptz not null default now(),
  last_recorded_at timestamptz not null default now(),
  primary key (revision_id, actor_id)
);

revoke all on table private.revision_draft_actors
from public, anon, authenticated, service_role;

insert into private.revision_draft_actors (
  revision_id, actor_id, action
)
select id, created_by, 'revision:legacy_creator'
from public.debate_revisions
where status = 'draft' and created_by is not null
on conflict (revision_id, actor_id) do nothing;

create or replace function public.revision_content_hash(p_revision_id text)
returns text
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select 'sha256:' || encode(
    extensions.digest(
      convert_to(jsonb_build_object(
        'revision', (
          select to_jsonb(r) - array[
            'status', 'review_status', 'reviewed_content_hash', 'approved_by',
            'published_at', 'published_by', 'change_set_hash'
          ]::text[]
          from public.debate_revisions r where r.id = p_revision_id
        ),
        'positions', coalesce((
          select jsonb_agg(to_jsonb(p) - 'status' order by p.sort_order, p.id)
          from public.positions p where p.revision_id = p_revision_id
        ), '[]'::jsonb),
        'arguments', coalesce((
          select jsonb_agg(to_jsonb(a) order by a.sort_order, a.id)
          from public.debate_arguments a where a.revision_id = p_revision_id
        ), '[]'::jsonb),
        'claims', coalesce((
          select jsonb_agg(to_jsonb(c) order by c.sort_order, c.id)
          from public.claims c where c.revision_id = p_revision_id
        ), '[]'::jsonb),
        'sources', coalesce((
          select jsonb_agg(to_jsonb(s) order by s.sort_order, s.id)
          from public.sources s where s.revision_id = p_revision_id
        ), '[]'::jsonb),
        'excerpts', coalesce((
          select jsonb_agg(to_jsonb(x) order by x.source_id, x.id)
          from public.source_excerpts x where x.revision_id = p_revision_id
        ), '[]'::jsonb),
        'evidence', coalesce((
          select jsonb_agg(to_jsonb(e) order by e.sort_order, e.id)
          from public.evidence_links e where e.revision_id = p_revision_id
        ), '[]'::jsonb),
        'values', coalesce((
          select jsonb_agg(to_jsonb(v) order by v.sort_order, v.id)
          from public.debate_values v where v.revision_id = p_revision_id
        ), '[]'::jsonb),
        'value_positions', coalesce((
          select jsonb_agg(to_jsonb(vp) order by vp.value_id, vp.position_id)
          from public.value_positions vp where vp.revision_id = p_revision_id
        ), '[]'::jsonb),
        'tradeoffs', coalesce((
          select jsonb_agg(to_jsonb(t) order by t.id)
          from public.tradeoffs t where t.revision_id = p_revision_id
        ), '[]'::jsonb)
      )::text, 'UTF8'),
      'sha256'
    ),
    'hex'
  )
$$;

create or replace function private.track_revision_draft_actor()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_revision_id text;
  v_actor uuid := auth.uid();
begin
  if tg_table_name = 'debate_revisions' then
    v_revision_id := new.id;
    if tg_op = 'INSERT' then
      v_actor := coalesce(v_actor, new.created_by);
    end if;
  else
    v_revision_id := case when tg_op = 'DELETE'
      then old.revision_id else new.revision_id end;
    if tg_table_name = 'positions' then
      if tg_op = 'UPDATE'
         and old.status = 'draft' and new.status = 'published'
         and (to_jsonb(old) - 'status') = (to_jsonb(new) - 'status') then
        return null;
      end if;
    end if;
  end if;

  if v_actor is not null then
    insert into private.revision_draft_actors (
      revision_id, actor_id, action
    ) values (
      v_revision_id, v_actor, tg_table_name || ':' || lower(tg_op)
    )
    on conflict (revision_id, actor_id) do update
      set action = excluded.action, last_recorded_at = now();
  end if;

  update public.debate_revisions
  set review_status = 'unreviewed',
      reviewed_content_hash = null,
      approved_by = null
  where id = v_revision_id and status = 'draft' and review_status = 'approved';
  return null;
end;
$$;

create trigger debate_revisions_track_creator
after insert on public.debate_revisions
for each row execute function private.track_revision_draft_actor();
create trigger debate_revisions_track_metadata_actor
after update of base_revision_id, change_set_hash on public.debate_revisions
for each row
when (
  old.base_revision_id is distinct from new.base_revision_id
  or old.change_set_hash is distinct from new.change_set_hash
)
execute function private.track_revision_draft_actor();

create trigger positions_track_draft_actor
after insert or update or delete on public.positions
for each row execute function private.track_revision_draft_actor();
create trigger arguments_track_draft_actor
after insert or update or delete on public.debate_arguments
for each row execute function private.track_revision_draft_actor();
create trigger claims_track_draft_actor
after insert or update or delete on public.claims
for each row execute function private.track_revision_draft_actor();
create trigger sources_track_draft_actor
after insert or update or delete on public.sources
for each row execute function private.track_revision_draft_actor();
create trigger excerpts_track_draft_actor
after insert or update or delete on public.source_excerpts
for each row execute function private.track_revision_draft_actor();
create trigger evidence_track_draft_actor
after insert or update or delete on public.evidence_links
for each row execute function private.track_revision_draft_actor();
create trigger values_track_draft_actor
after insert or update or delete on public.debate_values
for each row execute function private.track_revision_draft_actor();
create trigger value_positions_track_draft_actor
after insert or update or delete on public.value_positions
for each row execute function private.track_revision_draft_actor();
create trigger tradeoffs_track_draft_actor
after insert or update or delete on public.tradeoffs
for each row execute function private.track_revision_draft_actor();

-- A verdict is about an exact claim/evidence snapshot. Any draft mutation that
-- changes a claim, source, excerpt, or evidence link invalidates both the
-- materialized evaluation and its endorsements; a later review must rebuild
-- them from the new inspectable evidence instead of inheriting stale authority.
create or replace function private.invalidate_claim_verdicts()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_claim_ids text[] := '{}'::text[];
begin
  if tg_table_name = 'claims' then
    v_claim_ids := array_remove(array[
      case when tg_op <> 'INSERT' then old.id end,
      case when tg_op <> 'DELETE' then new.id end
    ], null);
  elsif tg_table_name = 'evidence_links' then
    v_claim_ids := array_remove(array[
      case when tg_op <> 'INSERT' then old.claim_id end,
      case when tg_op <> 'DELETE' then new.claim_id end
    ], null);
  elsif tg_table_name = 'sources' then
    select coalesce(array_agg(distinct e.claim_id), '{}'::text[])
      into v_claim_ids
    from public.evidence_links e
    where e.source_id in (
      case when tg_op <> 'INSERT' then old.id end,
      case when tg_op <> 'DELETE' then new.id end
    );
  elsif tg_table_name = 'source_excerpts' then
    select coalesce(array_agg(distinct e.claim_id), '{}'::text[])
      into v_claim_ids
    from public.evidence_links e
    where e.source_excerpt_id in (
      case when tg_op <> 'INSERT' then old.id end,
      case when tg_op <> 'DELETE' then new.id end
    );
  end if;

  if cardinality(v_claim_ids) > 0 then
    delete from public.claim_evaluations
    where claim_id = any(v_claim_ids);
    delete from public.claim_endorsements
    where claim_id = any(v_claim_ids);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger claims_invalidate_verdicts
before insert or update or delete on public.claims
for each row execute function private.invalidate_claim_verdicts();
create trigger sources_invalidate_verdicts
before insert or update or delete on public.sources
for each row execute function private.invalidate_claim_verdicts();
create trigger excerpts_invalidate_verdicts
before insert or update or delete on public.source_excerpts
for each row execute function private.invalidate_claim_verdicts();
create trigger evidence_invalidate_verdicts
before insert or update or delete on public.evidence_links
for each row execute function private.invalidate_claim_verdicts();

revoke all on function public.revision_content_hash(text)
from public, anon, authenticated, service_role;
revoke all on function private.track_revision_draft_actor()
from public, anon, authenticated, service_role;
revoke all on function private.invalidate_claim_verdicts()
from public, anon, authenticated, service_role;

-- Bound the durable analysis input at the same trust boundary as the Edge
-- parser. A direct RPC caller cannot create a packet that the worker will
-- permanently reject or expand into an unbounded completion transaction.
create or replace function public.create_seed_packet(
  p_question text,
  p_initial_position text,
  p_initial_arguments text[],
  p_sources jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_packet_id uuid := extensions.gen_random_uuid();
  v_quota jsonb;
  v_sources jsonb;
  v_slug_base text;
  v_slug text;
  v_topic_id text;
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if length(btrim(coalesce(p_question, ''))) < 12
     or length(btrim(p_question)) > 500
     or right(btrim(p_question), 1) <> '?' then
    raise exception using errcode = '22023',
      message = 'seed packet question must be a question of 12 to 500 characters';
  end if;
  if length(btrim(coalesce(p_initial_position, ''))) < 4
     or length(btrim(p_initial_position)) > 2000 then
    raise exception using errcode = '22023',
      message = 'initial position must contain 4 to 2000 characters';
  end if;
  if coalesce(cardinality(p_initial_arguments), 0) not between 1 and 8 then
    raise exception using errcode = '22023',
      message = 'one to eight initial arguments are required';
  end if;
  if exists (
    select 1
    from unnest(coalesce(p_initial_arguments, '{}'::text[])) argument
    where argument is null
      or length(btrim(argument)) < 4
      or length(btrim(argument)) > 2000
  ) then
    raise exception using errcode = '22023',
      message = 'initial arguments must contain 4 to 2000 characters';
  end if;

  if coalesce(jsonb_typeof(p_sources), '') <> 'array' then
    raise exception using errcode = '22023', message = 'sources must be a JSON array';
  end if;
  if jsonb_array_length(p_sources) > 8 or pg_column_size(p_sources) > 24576 then
    raise exception using errcode = '22023',
      message = 'sources exceed the count or storage limit';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_sources) source_input
    where jsonb_typeof(source_input) <> 'object'
      or jsonb_typeof(source_input -> 'url') <> 'string'
      or not public.is_safe_public_url(source_input ->> 'url')
      or (
        source_input ? 'note'
        and (
          jsonb_typeof(source_input -> 'note') <> 'string'
          or length(source_input ->> 'note') > 240
        )
      )
      or source_input - array['url', 'note']::text[] <> '{}'::jsonb
  ) then
    raise exception using errcode = '22023',
      message = 'each source requires only a valid HTTP(S) url and optional bounded note';
  end if;

  select coalesce(jsonb_agg(
    case
      when position('#' in source_input ->> 'url') > 0 then
        jsonb_set(
          source_input,
          '{url}',
          to_jsonb(split_part(source_input ->> 'url', '#', 1))
        )
      else source_input
    end
    order by ord
  ), '[]'::jsonb)
  into v_sources
  from jsonb_array_elements(p_sources) with ordinality as item(source_input, ord);

  v_quota := private.reserve_account_quota(v_actor, 'seed_create');
  if not coalesce((v_quota ->> 'ok')::boolean, false) then
    raise exception using
      errcode = 'P0001',
      message = 'seed_packet_quota_exceeded',
      detail = 'retry_after_seconds=' || (v_quota ->> 'retry_after_seconds');
  end if;

  v_slug_base := lower(regexp_replace(
    btrim(p_question), '[^a-zA-Z0-9]+', '-', 'g'
  ));
  v_slug_base := btrim(v_slug_base, '-');
  if v_slug_base = '' then
    v_slug_base := 'seed-topic';
  end if;
  v_slug := left(v_slug_base, 54) || '-' ||
    left(replace(v_packet_id::text, '-', ''), 8);
  v_topic_id := 'topic_' || replace(v_slug, '-', '_');

  insert into public.topics (
    id, slug, title, question, summary, status, created_by
  ) values (
    v_topic_id,
    v_slug,
    trim(trailing '?' from btrim(p_question)),
    btrim(p_question),
    'Draft topic created from a seed packet. It is not public until reviewed and published.',
    'draft',
    v_actor
  );

  insert into public.seed_packets (
    id, topic_id, topic_question, initial_position,
    initial_arguments, source_inputs, created_by
  ) values (
    v_packet_id, v_topic_id, btrim(p_question), btrim(p_initial_position),
    array(
      select btrim(argument)
      from unnest(p_initial_arguments) with ordinality as a(argument, ord)
      order by ord
    ),
    v_sources,
    v_actor
  );

  insert into public.audit_events (
    topic_id, actor_type, actor_id, event_type, output_object_ids, summary
  ) values (
    v_topic_id, 'user', v_actor::text, 'topic_created',
    array[v_packet_id::text],
    'Seed packet created a draft topic awaiting AI analysis.'
  );

  return v_packet_id;
end;
$$;

-- Review decisions are RPC-only. Approval pins the exact draft digest, base
-- revision and change-set hash, and requires a reviewer who never prepared or
-- modified the draft. Later child mutations clear the approval pins.
create or replace function public.review_revision(
  p_revision_id text,
  p_decision text,
  p_rationale text default ''
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_revision public.debate_revisions%rowtype;
  v_review_id uuid;
  v_status text;
  v_topic_id text;
  v_current_revision_id text;
  v_content_hash text;
  v_change_set_hash text;
begin
  if v_actor is null or not public.is_reviewer() then
    raise exception using errcode = '42501', message = 'reviewer role required';
  end if;
  if p_decision not in ('approve', 'reject', 'request_changes', 'mark_contested') then
    raise exception using errcode = '22023', message = 'invalid review decision';
  end if;
  if char_length(btrim(coalesce(p_rationale, ''))) not between 8 and 2000 then
    raise exception using errcode = '22023',
      message = 'review rationale must contain 8 to 2000 characters';
  end if;

  select topic_id into v_topic_id
  from public.debate_revisions
  where id = p_revision_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'revision not found';
  end if;
  select published_revision_id into v_current_revision_id
  from public.topics
  where id = v_topic_id
  for update;
  select * into v_revision
  from public.debate_revisions
  where id = p_revision_id
  for update;
  if v_revision.status <> 'draft' then
    raise exception using errcode = '55000',
      message = 'only draft revisions can be reviewed';
  end if;

  v_status := case
    when p_decision = 'approve' then 'approved'
    when p_decision = 'reject' then 'rejected'
    else 'contested'
  end;

  if p_decision = 'approve' then
    if v_revision.created_by = v_actor or exists (
      select 1
      from private.revision_draft_actors a
      where a.revision_id = p_revision_id and a.actor_id = v_actor
    ) then
      raise exception using errcode = '42501',
        message = 'draft preparers and modifiers cannot approve their own revision';
    end if;
    if v_revision.base_revision_id is distinct from v_current_revision_id then
      raise exception using errcode = '40001',
        message = 'draft base revision is stale';
    end if;
    if v_revision.change_set_hash is null then
      raise exception using errcode = '55000',
        message = 'draft change set must be pinned before approval';
    end if;
  end if;

  v_content_hash := public.revision_content_hash(p_revision_id);
  v_change_set_hash := v_revision.change_set_hash;

  insert into public.reviews (
    target_object_id, target_object_type, decision, rationale, reviewed_by,
    content_hash, base_revision_id, change_set_hash
  ) values (
    p_revision_id, 'revision', p_decision, btrim(p_rationale), v_actor,
    v_content_hash, v_revision.base_revision_id, v_change_set_hash
  ) returning id into v_review_id;

  update public.debate_revisions
  set review_status = v_status,
      reviewed_content_hash = case
        when p_decision = 'approve' then v_content_hash else null end,
      approved_by = case
        when p_decision = 'approve' then v_actor else null end
  where id = p_revision_id;

  insert into public.audit_events (
    topic_id, revision_id, actor_type, actor_id, event_type,
    input_object_ids, output_object_ids, summary
  ) values (
    v_revision.topic_id, p_revision_id, 'admin', v_actor::text,
    'review_completed', array[p_revision_id], array[v_review_id::text],
    'Revision review completed with decision: ' || p_decision || '.'
  );

  return v_review_id;
end;
$$;

create or replace function public.review_contribution(
  p_contribution_id uuid,
  p_decision text,
  p_rationale text default ''
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_contribution public.contributions%rowtype;
  v_review_id uuid;
begin
  if v_actor is null or not public.is_reviewer() then
    raise exception using errcode = '42501', message = 'reviewer role required';
  end if;
  if p_decision not in ('approve', 'reject') then
    raise exception using errcode = '22023', message = 'invalid contribution decision';
  end if;
  if char_length(btrim(coalesce(p_rationale, ''))) not between 8 and 2000 then
    raise exception using errcode = '22023',
      message = 'review rationale must contain 8 to 2000 characters';
  end if;

  select * into v_contribution
  from public.contributions
  where id = p_contribution_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'contribution not found';
  end if;
  if v_contribution.status <> 'submitted' then
    raise exception using errcode = '55000', message = 'contribution already reviewed';
  end if;
  if v_contribution.created_by = v_actor then
    raise exception using errcode = '42501',
      message = 'contributors cannot decide their own submission';
  end if;

  insert into public.reviews (
    target_object_id, target_object_type, decision, rationale, reviewed_by
  ) values (
    p_contribution_id::text, 'contribution', p_decision,
    btrim(p_rationale), v_actor
  ) returning id into v_review_id;

  update public.contributions
  set status = case when p_decision = 'approve' then 'accepted' else 'rejected' end
  where id = p_contribution_id;

  insert into public.audit_events (
    topic_id, actor_type, actor_id, event_type,
    input_object_ids, output_object_ids, summary
  ) values (
    v_contribution.topic_id, 'admin', v_actor::text, 'review_completed',
    array[p_contribution_id::text], array[v_review_id::text],
    'Contribution review completed with decision: ' || p_decision || '.'
  );

  return v_review_id;
end;
$$;

create or replace function public.publish_revision(p_revision_id text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
  v_revision public.debate_revisions%rowtype;
  v_topic_id text;
  v_previous text;
  v_slug text;
  v_content_hash text;
begin
  if v_actor is null or not public.is_admin() then
    raise exception using errcode = '42501', message = 'admin role required';
  end if;

  select topic_id into v_topic_id
  from public.debate_revisions
  where id = p_revision_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'revision not found';
  end if;
  select published_revision_id, slug into v_previous, v_slug
  from public.topics
  where id = v_topic_id
  for update;
  select * into v_revision
  from public.debate_revisions
  where id = p_revision_id
  for update;

  if v_revision.status <> 'draft' then
    raise exception using errcode = '55000',
      message = 'only draft revisions can be published';
  end if;
  if v_revision.review_status <> 'approved'
     or v_revision.reviewed_content_hash is null
     or v_revision.approved_by is null then
    raise exception using errcode = '55000',
      message = 'revision requires an exact approved review before publication';
  end if;
  if v_revision.approved_by = v_actor then
    raise exception using errcode = '42501',
      message = 'publisher must be independent from the approving reviewer';
  end if;
  if v_revision.base_revision_id is distinct from v_previous then
    raise exception using errcode = '40001',
      message = 'draft base revision is stale';
  end if;
  if v_revision.change_set_hash is null then
    raise exception using errcode = '55000',
      message = 'approved revision has no pinned change set';
  end if;

  v_content_hash := public.revision_content_hash(p_revision_id);
  if v_content_hash <> v_revision.reviewed_content_hash then
    raise exception using errcode = '40001',
      message = 'approved draft digest no longer matches current content';
  end if;
  if not exists (
    select 1
    from public.reviews r
    where r.target_object_type = 'revision'
      and r.target_object_id = p_revision_id
      and r.decision = 'approve'
      and r.reviewed_by = v_revision.approved_by
      and r.content_hash = v_content_hash
      and r.base_revision_id is not distinct from v_revision.base_revision_id
      and r.change_set_hash = v_revision.change_set_hash
  ) then
    raise exception using errcode = '55000',
      message = 'exact approval record is missing';
  end if;

  -- Run every structural and evidence gate before touching the old publication.
  perform public.assert_revision_publishable(p_revision_id);

  if v_previous is not null and v_previous <> p_revision_id then
    update public.debate_revisions
    set status = 'superseded'
    where id = v_previous and status = 'published';
  end if;

  update public.positions
  set status = 'published'
  where revision_id = p_revision_id and status = 'draft';

  update public.debate_revisions
  set status = 'published',
      published_at = now(),
      published_by = v_actor
  where id = p_revision_id;

  update public.topics
  set status = 'published',
      published_revision_id = p_revision_id
  where id = v_revision.topic_id;

  insert into public.audit_events (
    topic_id, revision_id, actor_type, actor_id, event_type,
    input_object_ids, output_object_ids, summary
  ) values (
    v_revision.topic_id, p_revision_id, 'admin', v_actor::text,
    'revision_published', array[p_revision_id], array[v_revision.topic_id],
    'Digest-pinned revision published through the protected RPC.'
  );

  return v_slug;
end;
$$;

-- 8. Trusted AI completion and durable failure recording. ------------------

create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;

alter function public.complete_mock_ai_job(uuid, uuid, jsonb, text)
  set schema private;
revoke all on function private.complete_mock_ai_job(uuid, uuid, jsonb, text)
  from public, anon, authenticated, service_role;

create table private.ai_analysis_attempts (
  lease_token uuid primary key,
  seed_packet_id uuid not null
    references public.seed_packets(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  state text not null check (
    state in ('running', 'completed', 'failed', 'superseded')
  ),
  lease_expires_at timestamptz not null,
  error_code text,
  claimed_at timestamptz not null default now(),
  finished_at timestamptz
);

create unique index ai_analysis_attempts_one_running
on private.ai_analysis_attempts (seed_packet_id)
where state = 'running';

revoke all on table private.ai_analysis_attempts
from public, anon, authenticated, service_role;

create function public.claim_ai_job(
  p_seed_packet_id uuid,
  p_actor_id uuid,
  p_claim_token uuid,
  p_lease_seconds integer default 60
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_seed public.seed_packets%rowtype;
  v_attempt private.ai_analysis_attempts%rowtype;
  v_actor_role text;
  v_lease_seconds integer := coalesce(p_lease_seconds, 60);
  v_new_lease timestamptz;
  v_quota jsonb;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception using errcode = '42501',
      message = 'trusted backend role required';
  end if;
  if p_actor_id is null or p_claim_token is null then
    raise exception using errcode = '22023',
      message = 'verified actor and random claim token are required';
  end if;
  if v_lease_seconds < 30 or v_lease_seconds > 600 then
    raise exception using errcode = '22023',
      message = 'analysis lease must be between 30 and 600 seconds';
  end if;

  select * into v_seed
  from public.seed_packets
  where id = p_seed_packet_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'seed packet not found';
  end if;

  select role into v_actor_role
  from public.profiles where id = p_actor_id;
  if p_actor_id <> v_seed.created_by
     and coalesce(v_actor_role, 'normal') not in ('reviewer', 'admin') then
    raise exception using errcode = '42501',
      message = 'verified actor cannot analyze this seed packet';
  end if;
  if v_seed.generated_revision_id is not null then
    return jsonb_build_object(
      'ok', true, 'state', 'completed',
      'revision_id', v_seed.generated_revision_id
    );
  end if;
  if v_seed.status = 'analyzed' then
    raise exception using errcode = '55000',
      message = 'analyzed seed packet has no generated revision';
  end if;

  select * into v_attempt
  from private.ai_analysis_attempts
  where lease_token = p_claim_token
  for update;
  if found then
    if v_attempt.seed_packet_id <> p_seed_packet_id then
      raise exception using errcode = '22023',
        message = 'claim token belongs to another seed packet';
    end if;
    if v_attempt.actor_id <> p_actor_id then
      raise exception using errcode = '42501',
        message = 'claim token belongs to another actor';
    end if;
    if v_attempt.state = 'running' then
      return jsonb_build_object(
        'ok', true, 'state', 'claimed', 'replayed', true,
        'claim_token', p_claim_token,
        'lease_expires_at', v_attempt.lease_expires_at
      );
    elsif v_attempt.state = 'completed' then
      return jsonb_build_object(
        'ok', true, 'state', 'completed',
        'revision_id', v_seed.generated_revision_id
      );
    elsif v_attempt.state = 'failed' then
      return jsonb_build_object(
        'ok', false, 'state', 'failed', 'error_code', v_attempt.error_code
      );
    end if;
    raise exception using errcode = '55000',
      message = 'claim token has been superseded';
  end if;

  select * into v_attempt
  from private.ai_analysis_attempts
  where seed_packet_id = p_seed_packet_id and state = 'running'
  for update;
  if found and v_attempt.lease_expires_at > now() then
    return jsonb_build_object(
      'ok', false, 'state', 'in_progress',
      'lease_expires_at', v_attempt.lease_expires_at
    );
  elsif found then
    update private.ai_analysis_attempts
    set state = 'superseded', finished_at = now()
    where lease_token = v_attempt.lease_token;
  elsif v_seed.status = 'running'
        and v_seed.updated_at + interval '60 seconds' > now() then
    -- Rolling-deploy compatibility for a pre-token worker.
    return jsonb_build_object(
      'ok', false, 'state', 'in_progress',
      'lease_expires_at', v_seed.updated_at + interval '60 seconds'
    );
  end if;

  v_quota := private.reserve_account_quota(p_actor_id, 'analysis_claim');
  if not coalesce((v_quota ->> 'ok')::boolean, false) then
    return jsonb_build_object(
      'ok', false,
      'state', 'quota_exceeded',
      'retry_after_seconds', (v_quota ->> 'retry_after_seconds')::integer
    );
  end if;

  v_new_lease := now() + make_interval(secs => v_lease_seconds);
  insert into private.ai_analysis_attempts (
    lease_token, seed_packet_id, actor_id, state, lease_expires_at
  ) values (
    p_claim_token, p_seed_packet_id, p_actor_id, 'running', v_new_lease
  );

  update public.seed_packets
  set status = 'running',
      error_code = null,
      error_message = null,
      failure_recorded_at = null
  where id = p_seed_packet_id;

  return jsonb_build_object(
    'ok', true, 'state', 'claimed', 'replayed', false,
    'claim_token', p_claim_token,
    'lease_expires_at', v_new_lease,
    'quota_remaining', v_quota -> 'remaining'
  );
end;
$$;

create function public.complete_mock_ai_job(
  p_seed_packet_id uuid,
  p_actor_id uuid,
  p_claim_token uuid,
  p_retrievals jsonb default '[]'::jsonb,
  p_provider text default 'mock'
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_seed public.seed_packets%rowtype;
  v_attempt private.ai_analysis_attempts%rowtype;
  v_actor_role text;
  v_previous_sub text := current_setting('request.jwt.claim.sub', true);
  v_revision_id text;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception using errcode = '42501',
      message = 'trusted backend role required';
  end if;
  if p_actor_id is null or p_claim_token is null then
    raise exception using errcode = '22023',
      message = 'verified actor and claim token are required';
  end if;
  if p_provider is distinct from 'mock' then
    raise exception using errcode = '22023',
      message = 'only the mock provider is currently supported';
  end if;
  if coalesce(jsonb_typeof(p_retrievals), '') <> 'array'
     or jsonb_array_length(p_retrievals) > 8
     or pg_column_size(p_retrievals) > 1048576 then
    raise exception using errcode = '22023',
      message = 'retrieval payload exceeds the supported shape or size';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_retrievals) retrieval
    where jsonb_typeof(retrieval) <> 'object'
      or jsonb_typeof(retrieval -> 'url') <> 'string'
      or not public.is_safe_public_url(retrieval ->> 'url')
      or coalesce(retrieval ->> 'status', '') not in (
        'found', 'partial', 'missing', 'blocked', 'failed'
      )
      or (
        retrieval ->> 'status' in ('found', 'partial')
        and (
          jsonb_typeof(retrieval -> 'hash') <> 'string'
          or (retrieval ->> 'hash') !~ '^sha256:[0-9a-f]{64}$'
        )
      )
      or (
        retrieval ->> 'status' in ('missing', 'blocked', 'failed')
        and retrieval ? 'hash'
        and jsonb_typeof(retrieval -> 'hash') <> 'null'
      )
      or length(coalesce(retrieval ->> 'title', '')) > 300
      or length(coalesce(retrieval ->> 'publisher', '')) > 200
      or length(coalesce(retrieval ->> 'excerpt', '')) > 128000
      or length(coalesce(retrieval ->> 'note', '')) > 240
      or length(coalesce(retrieval ->> 'locator', '')) > 500
  ) then
    raise exception using errcode = '22023',
      message = 'retrieval contains an unsafe URL, status, hash, or oversized field';
  end if;

  select * into v_seed
  from public.seed_packets
  where id = p_seed_packet_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'seed packet not found';
  end if;
  select role into v_actor_role
  from public.profiles where id = p_actor_id;
  if p_actor_id <> v_seed.created_by
     and coalesce(v_actor_role, 'normal') not in ('reviewer', 'admin') then
    raise exception using errcode = '42501',
      message = 'verified actor cannot analyze this seed packet';
  end if;

  select * into v_attempt
  from private.ai_analysis_attempts
  where lease_token = p_claim_token
  for update;
  if not found or v_attempt.seed_packet_id <> p_seed_packet_id then
    raise exception using errcode = '55000',
      message = 'valid analysis claim token required';
  end if;
  if v_attempt.actor_id <> p_actor_id then
    raise exception using errcode = '42501',
      message = 'claim token belongs to another actor';
  end if;
  if v_attempt.state = 'completed' and v_seed.generated_revision_id is not null then
    return v_seed.generated_revision_id;
  end if;
  if v_attempt.state <> 'running' or v_seed.status <> 'running' then
    raise exception using errcode = '55000',
      message = 'analysis claim is no longer active';
  end if;

  perform set_config('request.jwt.claim.sub', p_actor_id::text, true);
  begin
    v_revision_id := private.complete_mock_ai_job(
      p_seed_packet_id,
      p_actor_id,
      coalesce(p_retrievals, '[]'::jsonb),
      p_provider
    );
    update public.debate_revisions r
    set base_revision_id = t.published_revision_id
    from public.topics t
    where r.id = v_revision_id and t.id = r.topic_id;
    update public.debate_revisions
    set change_set_hash = public.revision_content_hash(v_revision_id)
    where id = v_revision_id;
  exception
    when others then
      perform set_config('request.jwt.claim.sub', coalesce(v_previous_sub, ''), true);
      raise;
  end;
  perform set_config('request.jwt.claim.sub', coalesce(v_previous_sub, ''), true);

  update private.ai_analysis_attempts
  set state = 'completed', finished_at = now()
  where lease_token = p_claim_token;
  return v_revision_id;
end;
$$;

create function public.record_ai_job_failure(
  p_seed_packet_id uuid,
  p_actor_id uuid,
  p_claim_token uuid,
  p_error_code text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_seed public.seed_packets%rowtype;
  v_attempt private.ai_analysis_attempts%rowtype;
  v_actor_role text;
  v_message text;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception using errcode = '42501',
      message = 'trusted backend role required';
  end if;
  if p_actor_id is null or p_claim_token is null then
    raise exception using errcode = '22023',
      message = 'verified actor and claim token are required';
  end if;
  if p_error_code not in (
    'openrouter_unavailable', 'source_retrieval_failed', 'analysis_failed',
    'invalid_analysis_result', 'timeout', 'interrupted', 'unknown'
  ) then
    raise exception using errcode = '22023', message = 'invalid AI failure code';
  end if;

  select * into v_seed
  from public.seed_packets
  where id = p_seed_packet_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'seed packet not found';
  end if;
  select role into v_actor_role from public.profiles where id = p_actor_id;
  if p_actor_id <> v_seed.created_by
     and coalesce(v_actor_role, 'normal') not in ('reviewer', 'admin') then
    raise exception using errcode = '42501',
      message = 'verified actor cannot fail this seed packet';
  end if;

  select * into v_attempt
  from private.ai_analysis_attempts
  where lease_token = p_claim_token
  for update;
  if not found or v_attempt.seed_packet_id <> p_seed_packet_id then
    raise exception using errcode = '55000',
      message = 'valid analysis claim token required';
  end if;
  if v_attempt.actor_id <> p_actor_id then
    raise exception using errcode = '42501',
      message = 'claim token belongs to another actor';
  end if;
  if v_attempt.state = 'failed' then
    return jsonb_build_object(
      'ok', true, 'status', 'failed',
      'error_code', v_attempt.error_code, 'already_recorded', true
    );
  end if;
  if v_attempt.state <> 'running' or v_seed.status <> 'running'
     or v_seed.generated_revision_id is not null then
    raise exception using errcode = '55000',
      message = 'analysis claim is no longer active';
  end if;

  v_message := case p_error_code
    when 'openrouter_unavailable' then 'The configured analysis provider is unavailable.'
    when 'source_retrieval_failed' then 'One or more source retrievals failed.'
    when 'analysis_failed' then 'The analysis could not be completed.'
    when 'invalid_analysis_result' then 'The analysis result failed validation.'
    when 'timeout' then 'The analysis timed out.'
    when 'interrupted' then 'The analysis was interrupted.'
    else 'The analysis outcome is unknown.'
  end;

  update private.ai_analysis_attempts
  set state = 'failed', error_code = p_error_code, finished_at = now()
  where lease_token = p_claim_token;

  update public.seed_packets
  set status = 'failed', error_code = p_error_code,
      error_message = v_message, failure_recorded_at = now()
  where id = p_seed_packet_id;

  update public.ai_jobs
  set status = 'failed', error_code = p_error_code,
      error_message = v_message, completed_at = now()
  where seed_packet_id = p_seed_packet_id
    and status in ('queued', 'running');

  insert into public.audit_events (
    topic_id, actor_type, actor_id, event_type, input_object_ids, summary
  ) values (
    v_seed.topic_id, 'system', 'analysis-orchestrator', 'ai_analysis_failed',
    array[p_seed_packet_id::text],
    'AI analysis failed with code: ' || p_error_code || '.'
  );

  return jsonb_build_object(
    'ok', true, 'status', 'failed',
    'error_code', p_error_code, 'already_recorded', false
  );
end;
$$;

-- A contributor can see the outcome and rationale of their own submissions,
-- but never the reviewer identity or the raw reviews table.
create function public.get_my_contribution_decisions(p_topic_id text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'contribution_id', c.id,
      'topic_id', c.topic_id,
      'status', c.status,
      'decision', latest.decision,
      'rationale', latest.rationale,
      'reviewed_at', latest.reviewed_at,
      'merged_revision_id', c.merged_revision_id,
      'merged_at', c.merged_at
    ) order by c.created_at desc)
    from public.contributions c
    left join lateral (
      select r.decision, r.rationale, r.reviewed_at
      from public.reviews r
      where r.target_object_type = 'contribution'
        and r.target_object_id = c.id::text
      order by r.reviewed_at desc, r.id desc
      limit 1
    ) latest on true
    where c.created_by = auth.uid()
      and (p_topic_id is null or c.topic_id = p_topic_id)
  ), '[]'::jsonb);
end;
$$;

-- 9. Safe public audit/provenance projection. -------------------------------

create function public.get_public_audit_events(
  p_topic_id text,
  p_revision_id text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1
    from public.topics t
    join public.debate_revisions r on r.id = t.published_revision_id
    where t.id = p_topic_id
      and r.id = p_revision_id
      and t.status = 'published'
      and r.status = 'published'
  ) then
    return '[]'::jsonb;
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', ae.id,
      'topic_id', ae.topic_id,
      'revision_id', coalesce(ae.revision_id, p_revision_id),
      'actor_type', ae.actor_type,
      'actor_id', case ae.actor_type
        when 'ai' then 'ai'
        when 'system' then 'system'
        else 'editorial'
      end,
      'event_type', ae.event_type,
      'summary', ae.summary,
      'created_at', ae.created_at
    ) order by ae.created_at, ae.id)
    from public.audit_events ae
    where ae.topic_id = p_topic_id
      and (ae.revision_id is null or ae.revision_id = p_revision_id)
      and ae.event_type in (
        'topic_created', 'source_added', 'source_retrieved',
        'claim_extracted', 'evidence_labeled', 'position_generated',
        'ai_analysis_started', 'ai_analysis_completed',
        'review_completed', 'revision_published', 'contribution_merged'
      )
  ), '[]'::jsonb);
end;
$$;

create or replace view public.published_debate_fixtures
with (security_invoker = true)
as
select
  t.id as topic_id,
  t.slug,
  jsonb_build_object(
    'topic', jsonb_build_object(
      'id', t.id,
      'title', t.title,
      'question', t.question,
      'summary', t.summary,
      'status', t.status,
      'current_revision_id', r.id,
      'created_at', t.created_at,
      'created_by', 'editorial'
    ),
    'revision', jsonb_build_object(
      'id', r.id,
      'topic_id', r.topic_id,
      'revision_number', r.revision_number,
      'status', r.status,
      'published_at', r.published_at,
      'published_by', 'editorial'
    ),
    'positions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'topic_id', p.topic_id,
        'title', p.title,
        'short_summary', p.short_summary,
        'steelman', p.steelman,
        'status', p.status,
        'argument_ids', coalesce((
          select jsonb_agg(a.id order by a.sort_order)
          from public.debate_arguments a
          where a.position_id = p.id
        ), '[]'::jsonb),
        'value_ids', coalesce((
          select jsonb_agg(vp.value_id order by vp.value_id)
          from public.value_positions vp
          where vp.position_id = p.id
        ), '[]'::jsonb),
        'tradeoff_ids', coalesce((
          select jsonb_agg(tr.id order by tr.id)
          from public.tradeoffs tr
          where tr.position_id = p.id
        ), '[]'::jsonb),
        'generated_by', p.generated_by,
        'review_status', p.review_status
      ) order by p.sort_order)
      from public.positions p
      where p.revision_id = r.id
    ), '[]'::jsonb),
    'arguments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'position_id', a.position_id,
        'direction', a.direction,
        'summary', a.summary,
        'claim_ids', to_jsonb(a.claim_ids),
        'generated_by', a.generated_by,
        'review_status', a.review_status
      ) order by a.sort_order)
      from public.debate_arguments a
      where a.revision_id = r.id
    ), '[]'::jsonb),
    'claims', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'text', c.text,
        'claim_type', to_jsonb(c.claim_type),
        'topic_id', c.topic_id,
        'evidence_link_ids', coalesce((
          select jsonb_agg(el.id order by el.sort_order)
          from public.evidence_links el
          where el.claim_id = c.id
        ), '[]'::jsonb),
        'generated_by', c.generated_by,
        'review_status', c.review_status
      ) order by c.sort_order)
      from public.claims c
      where c.revision_id = r.id
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'url', s.url,
        'source_key', public.source_key(s.url),
        'title', s.title,
        'publisher', s.publisher,
        'source_type', s.source_type,
        'retrieval_status', s.retrieval_status,
        'retrieved_at', s.retrieved_at,
        'content_hash', s.content_hash,
        'content_version', s.content_version
      ) order by s.sort_order)
      from public.sources s
      where s.revision_id = r.id
    ), '[]'::jsonb),
    'source_excerpts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', x.id,
        'source_id', x.source_id,
        'text', x.text,
        'locator', x.locator,
        'extracted_by', x.extracted_by,
        'created_at', x.created_at
      ) order by x.source_id, x.id)
      from public.source_excerpts x
      where x.revision_id = r.id
    ), '[]'::jsonb),
    'evidence_links', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', el.id,
        'claim_id', el.claim_id,
        'source_id', el.source_id,
        'source_excerpt_id', el.source_excerpt_id,
        'label', el.label,
        'rationale', el.rationale,
        'confidence', el.confidence,
        'assessment_state', el.assessment_state,
        'review_status', el.review_status
      ) order by el.sort_order)
      from public.evidence_links el
      where el.revision_id = r.id
    ), '[]'::jsonb),
    'values', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id,
        'topic_id', v.topic_id,
        'name', v.name,
        'description', v.description,
        'position_ids', coalesce((
          select jsonb_agg(vp.position_id order by vp.position_id)
          from public.value_positions vp
          where vp.value_id = v.id
        ), '[]'::jsonb),
        'tension_with', to_jsonb(v.tension_with)
      ) order by v.sort_order)
      from public.debate_values v
      where v.revision_id = r.id
    ), '[]'::jsonb),
    'tradeoffs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', tr.id,
        'topic_id', tr.topic_id,
        'position_id', tr.position_id,
        'gain', tr.gain,
        'cost', tr.cost,
        'risk', tr.risk,
        'review_status', tr.review_status
      ) order by tr.id)
      from public.tradeoffs tr
      where tr.revision_id = r.id
    ), '[]'::jsonb),
    'audit_events', public.get_public_audit_events(t.id, r.id)
  ) as debate
from public.topics t
join public.debate_revisions r on r.id = t.published_revision_id
where t.status = 'published' and r.status = 'published';

-- 9.5. Lint-safe canonical merge. -----------------------------------------
--
-- The historical implementation used transaction-local temporary tables for
-- its clone id maps. A permanent private map, scoped by a random operation id,
-- keeps the same count-preserving clone semantics while remaining visible to
-- static PL/pgSQL validation. Successful calls remove their rows explicitly;
-- failed calls roll them back with the enclosing statement/transaction.

create table if not exists private.merge_object_map (
  operation_id uuid not null,
  object_kind text not null check (object_kind in (
    'position', 'claim', 'source', 'source_excerpt', 'value', 'evidence_link'
  )),
  old_id text not null,
  new_id text not null,
  primary key (operation_id, object_kind, old_id),
  unique (operation_id, object_kind, new_id)
);

revoke all on table private.merge_object_map
from public, anon, authenticated, service_role;

create or replace function public.merge_contribution(p_contribution_id uuid)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_actor uuid := auth.uid();
  v_c public.contributions%rowtype;
  v_old_rev text;
  v_new_rev text;
  v_new_num integer;
  v_prefix text;
  v_target text;
  v_old_cnt integer;
  v_new_cnt integer;
  v_slug text;
  v_operation_id uuid := extensions.gen_random_uuid();
begin
  if v_actor is null or not public.is_admin() then
    raise exception 'admin role required';
  end if;

  select * into v_c
  from public.contributions
  where id = p_contribution_id
  for update;
  if not found then
    raise exception 'contribution not found';
  end if;
  if v_c.status <> 'accepted' then
    raise exception 'only accepted contributions can be merged (status=%)', v_c.status;
  end if;
  if v_c.merged_revision_id is not null then
    raise exception 'contribution already merged into revision %', v_c.merged_revision_id;
  end if;

  if v_c.type not in ('new_source', 'new_claim', 'challenge_evidence_label') then
    raise exception
      'contribution type % is accepted but not yet auto-mergeable (deferred in merge v1)', v_c.type
      using hint = 'Supported v1 types: new_source, new_claim, challenge_evidence_label.';
  end if;

  select published_revision_id into v_old_rev
  from public.topics
  where id = v_c.topic_id
  for update;
  if v_old_rev is null then
    raise exception 'topic % has no published revision to clone', v_c.topic_id;
  end if;

  if v_c.target_object_id is not null then
    if v_c.type = 'new_source' then
      if not exists (
        select 1 from public.claims
        where id = v_c.target_object_id and revision_id = v_old_rev
      ) then
        raise exception 'stale target: claim % not in current published revision', v_c.target_object_id;
      end if;
    elsif v_c.type = 'new_claim' then
      if not exists (
        select 1 from public.positions
        where id = v_c.target_object_id and revision_id = v_old_rev
      ) then
        raise exception 'stale target: position % not in current published revision', v_c.target_object_id;
      end if;
    elsif v_c.type = 'challenge_evidence_label' then
      if not exists (
        select 1 from public.evidence_links
        where id = v_c.target_object_id and revision_id = v_old_rev
      ) then
        raise exception 'stale target: evidence_link % not in current published revision', v_c.target_object_id;
      end if;
    end if;
  end if;
  if v_c.type = 'challenge_evidence_label' and v_c.proposed_label is null then
    raise exception 'challenge_evidence_label requires a proposed_label';
  end if;

  select coalesce(max(revision_number), 0) + 1 into v_new_num
  from public.debate_revisions
  where topic_id = v_c.topic_id;

  v_prefix := left(replace(extensions.gen_random_uuid()::text, '-', ''), 12);
  v_new_rev := 'rev_' || v_prefix || '_r' || v_new_num;

  insert into public.debate_revisions
    (id, topic_id, revision_number, status, review_status, generated_by, created_by)
  values
    (v_new_rev, v_c.topic_id, v_new_num, 'draft', 'unreviewed', 'mixed', v_actor);

  with src as (
    select p.*,
           'm_' || v_prefix || '_pos_' ||
             row_number() over (order by p.sort_order, p.id) as nid
    from public.positions p
    where p.revision_id = v_old_rev
  ), ins as (
    insert into public.positions
      (id, revision_id, topic_id, title, short_summary, steelman, status,
       generated_by, review_status, sort_order)
    select nid, v_new_rev, topic_id, title, short_summary, steelman,
           'draft', generated_by, 'unreviewed', sort_order
    from src
    returning 1
  )
  insert into private.merge_object_map
    (operation_id, object_kind, old_id, new_id)
  select v_operation_id, 'position', id, nid from src;

  with src as (
    select c.*,
           'm_' || v_prefix || '_clm_' ||
             row_number() over (order by c.sort_order, c.id) as nid
    from public.claims c
    where c.revision_id = v_old_rev
  ), ins as (
    insert into public.claims
      (id, revision_id, topic_id, text, claim_type, generated_by, review_status, sort_order)
    select nid, v_new_rev, topic_id, text, claim_type, generated_by,
           'unreviewed', sort_order
    from src
    returning 1
  )
  insert into private.merge_object_map
    (operation_id, object_kind, old_id, new_id)
  select v_operation_id, 'claim', id, nid from src;

  with src as (
    select s.*,
           'm_' || v_prefix || '_src_' ||
             row_number() over (order by s.sort_order, s.id) as nid
    from public.sources s
    where s.revision_id = v_old_rev
  ), ins as (
    insert into public.sources
      (id, revision_id, topic_id, url, title, publisher, source_type,
       retrieval_status, retrieved_at, quality_notes, content_hash,
       content_version, sort_order)
    select nid, v_new_rev, topic_id, url, title, publisher, source_type,
           retrieval_status, retrieved_at, quality_notes, content_hash,
           content_version, sort_order
    from src
    returning 1
  )
  insert into private.merge_object_map
    (operation_id, object_kind, old_id, new_id)
  select v_operation_id, 'source', id, nid from src;

  with src as (
    select e.*,
           'm_' || v_prefix || '_exc_' ||
             row_number() over (order by e.id) as nid
    from public.source_excerpts e
    where e.revision_id = v_old_rev
  ), ins as (
    insert into public.source_excerpts
      (id, revision_id, source_id, text, locator, extracted_by, created_at)
    select s.nid, v_new_rev, ms.new_id, s.text, s.locator,
           s.extracted_by, s.created_at
    from src s
    left join private.merge_object_map ms
      on ms.operation_id = v_operation_id
     and ms.object_kind = 'source'
     and ms.old_id = s.source_id
    where (s.source_id is null) = (ms.new_id is null)
    returning 1
  )
  insert into private.merge_object_map
    (operation_id, object_kind, old_id, new_id)
  select v_operation_id, 'source_excerpt', id, nid from src;

  select count(*) into v_old_cnt
  from public.source_excerpts
  where revision_id = v_old_rev;
  select count(*) into v_new_cnt
  from public.source_excerpts
  where revision_id = v_new_rev;
  if v_old_cnt <> v_new_cnt then
    raise exception 'excerpt clone lost rows (% -> %): unresolved source_id',
      v_old_cnt, v_new_cnt;
  end if;

  with src as (
    select v.*,
           'm_' || v_prefix || '_val_' ||
             row_number() over (order by v.sort_order, v.id) as nid
    from public.debate_values v
    where v.revision_id = v_old_rev
  ), ins as (
    insert into public.debate_values
      (id, revision_id, topic_id, name, description, tension_with, sort_order)
    select nid, v_new_rev, topic_id, name, description, tension_with, sort_order
    from src
    returning 1
  )
  insert into private.merge_object_map
    (operation_id, object_kind, old_id, new_id)
  select v_operation_id, 'value', id, nid from src;

  insert into public.debate_arguments
    (id, revision_id, position_id, direction, summary, claim_ids,
     generated_by, review_status, sort_order)
  select 'm_' || v_prefix || '_arg_' ||
           row_number() over (order by a.sort_order, a.id),
         v_new_rev, mp.new_id, a.direction, a.summary,
         (
           select coalesce(array_agg(
             case
               when mc.new_id is null then public.raise_dangling(a.id, u.cid)
               else mc.new_id
             end
             order by u.ord
           ), '{}'::text[])
           from unnest(a.claim_ids) with ordinality as u(cid, ord)
           left join private.merge_object_map mc
             on mc.operation_id = v_operation_id
            and mc.object_kind = 'claim'
            and mc.old_id = u.cid
         ),
         a.generated_by, 'unreviewed', a.sort_order
  from public.debate_arguments a
  join private.merge_object_map mp
    on mp.operation_id = v_operation_id
   and mp.object_kind = 'position'
   and mp.old_id = a.position_id
  where a.revision_id = v_old_rev;

  with src as (
    select el.*,
           'm_' || v_prefix || '_ev_' ||
             row_number() over (order by el.sort_order, el.id) as nid
    from public.evidence_links el
    where el.revision_id = v_old_rev
  ), ins as (
    insert into public.evidence_links
      (id, revision_id, claim_id, source_id, source_excerpt_id, label, rationale,
       confidence, assessment_state, review_status, sort_order)
    select s.nid, v_new_rev, mc.new_id, ms.new_id, mx.new_id, s.label,
           s.rationale, s.confidence, s.assessment_state, 'unreviewed', s.sort_order
    from src s
    join private.merge_object_map mc
      on mc.operation_id = v_operation_id
     and mc.object_kind = 'claim'
     and mc.old_id = s.claim_id
    join private.merge_object_map ms
      on ms.operation_id = v_operation_id
     and ms.object_kind = 'source'
     and ms.old_id = s.source_id
    left join private.merge_object_map mx
      on mx.operation_id = v_operation_id
     and mx.object_kind = 'source_excerpt'
     and mx.old_id = s.source_excerpt_id
    returning 1
  )
  insert into private.merge_object_map
    (operation_id, object_kind, old_id, new_id)
  select v_operation_id, 'evidence_link', id, nid from src;

  select count(*) into v_old_cnt
  from public.evidence_links
  where revision_id = v_old_rev;
  select count(*) into v_new_cnt
  from public.evidence_links
  where revision_id = v_new_rev;
  if v_old_cnt <> v_new_cnt then
    raise exception 'evidence_link clone lost rows (% -> %): unresolved claim/source ref',
      v_old_cnt, v_new_cnt;
  end if;
  if (
    select count(*)
    from public.evidence_links
    where revision_id = v_old_rev and source_excerpt_id is not null
  ) <> (
    select count(*)
    from public.evidence_links
    where revision_id = v_new_rev and source_excerpt_id is not null
  ) then
    raise exception 'evidence_link excerpt null-preservation broke';
  end if;

  insert into public.value_positions (value_id, position_id, revision_id)
  select mv.new_id, mp.new_id, v_new_rev
  from public.value_positions vp
  join public.debate_values dv
    on dv.id = vp.value_id and dv.revision_id = v_old_rev
  join public.positions pp
    on pp.id = vp.position_id and pp.revision_id = v_old_rev
  join private.merge_object_map mv
    on mv.operation_id = v_operation_id
   and mv.object_kind = 'value'
   and mv.old_id = vp.value_id
  join private.merge_object_map mp
    on mp.operation_id = v_operation_id
   and mp.object_kind = 'position'
   and mp.old_id = vp.position_id;

  select count(*) into v_old_cnt
  from public.value_positions vp
  join public.debate_values dv
    on dv.id = vp.value_id and dv.revision_id = v_old_rev
  join public.positions pp
    on pp.id = vp.position_id and pp.revision_id = v_old_rev;
  select count(*) into v_new_cnt
  from public.value_positions
  where revision_id = v_new_rev;
  if v_old_cnt <> v_new_cnt then
    raise exception 'value_positions clone lost rows (% -> %)', v_old_cnt, v_new_cnt;
  end if;

  insert into public.tradeoffs
    (id, revision_id, topic_id, position_id, gain, cost, risk, review_status)
  select 'm_' || v_prefix || '_to_' || row_number() over (order by t.id),
         v_new_rev, t.topic_id, mp.new_id, t.gain, t.cost, t.risk, 'unreviewed'
  from public.tradeoffs t
  join private.merge_object_map mp
    on mp.operation_id = v_operation_id
   and mp.object_kind = 'position'
   and mp.old_id = t.position_id
  where t.revision_id = v_old_rev;

  insert into public.claim_evaluations
    (topic_id, claim_id, state, rationale, evaluated_by, evaluated_at, is_demo)
  select ce.topic_id, mc.new_id, ce.state, ce.rationale,
         ce.evaluated_by, ce.evaluated_at, ce.is_demo
  from public.claim_evaluations ce
  join private.merge_object_map mc
    on mc.operation_id = v_operation_id
   and mc.object_kind = 'claim'
   and mc.old_id = ce.claim_id
  where ce.topic_id = v_c.topic_id
    and coalesce(ce.authored_by, 'reviewer') <> 'bridge'
  on conflict (topic_id, claim_id) do nothing;

  insert into public.claim_endorsements (topic_id, claim_id, reviewer_id, state)
  select en.topic_id, mc.new_id, en.reviewer_id, en.state
  from public.claim_endorsements en
  join private.merge_object_map mc
    on mc.operation_id = v_operation_id
   and mc.object_kind = 'claim'
   and mc.old_id = en.claim_id
  where en.topic_id = v_c.topic_id
  on conflict do nothing;

  if v_c.type = 'new_source' then
    insert into public.sources
      (id, revision_id, topic_id, url, title, publisher, source_type,
       retrieval_status, retrieved_at, quality_notes, sort_order)
    values
      ('m_' || v_prefix || '_apply_src', v_new_rev, v_c.topic_id,
       coalesce(v_c.url, ''),
       coalesce(nullif(v_c.title, ''), 'Community-submitted source'),
       'Community contributor', 'other', 'partial', null,
       'Community-submitted; alignment not yet labeled.',
       (select coalesce(max(sort_order), 0) + 1
        from public.sources where revision_id = v_new_rev));

    select new_id into v_target
    from private.merge_object_map
    where operation_id = v_operation_id
      and object_kind = 'claim'
      and old_id = v_c.target_object_id;
    if v_target is null then
      raise exception 'new_source target claim % unresolved', v_c.target_object_id;
    end if;

    insert into public.evidence_links
      (id, revision_id, claim_id, source_id, source_excerpt_id, label, rationale,
       confidence, review_status, sort_order)
    values
      ('m_' || v_prefix || '_apply_ev', v_new_rev, v_target,
       'm_' || v_prefix || '_apply_src', null, 'unclear',
       coalesce(nullif(v_c.body, ''),
                'Community-submitted source awaiting alignment labeling.'),
       0.50, 'unreviewed',
       (select coalesce(max(sort_order), 0) + 1
        from public.evidence_links where revision_id = v_new_rev));

  elsif v_c.type = 'new_claim' then
    insert into public.claims
      (id, revision_id, topic_id, text, claim_type, generated_by,
       review_status, sort_order)
    values
      ('m_' || v_prefix || '_apply_clm', v_new_rev, v_c.topic_id, v_c.body,
       case
         when v_c.body ~* '\m(should|must|ought)\M' then array['normative']
         else array['factual']
       end,
       'human', 'unreviewed',
       (select coalesce(max(sort_order), 0) + 1
        from public.claims where revision_id = v_new_rev));

    if v_c.target_object_id is not null then
      select new_id into v_target
      from private.merge_object_map
      where operation_id = v_operation_id
        and object_kind = 'position'
        and old_id = v_c.target_object_id;

      update public.debate_arguments
      set claim_ids = claim_ids || array['m_' || v_prefix || '_apply_clm']
      where revision_id = v_new_rev
        and position_id = v_target
        and direction = 'supports'
        and id = (
          select id
          from public.debate_arguments
          where revision_id = v_new_rev
            and position_id = v_target
            and direction = 'supports'
          order by sort_order
          limit 1
        );
    end if;

  elsif v_c.type = 'challenge_evidence_label' then
    select new_id into v_target
    from private.merge_object_map
    where operation_id = v_operation_id
      and object_kind = 'evidence_link'
      and old_id = v_c.target_object_id;
    if v_target is null then
      raise exception 'challenge target link % unresolved', v_c.target_object_id;
    end if;

    update public.evidence_links
    set label = v_c.proposed_label,
        rationale = rationale || E'\n— Community label challenge: ' ||
                    coalesce(nullif(v_c.body, ''), '(no rationale supplied)')
    where id = v_target and revision_id = v_new_rev;
  end if;

  update public.contributions
  set merged_revision_id = v_new_rev,
      merged_at = now()
  where id = p_contribution_id;

  insert into public.audit_events
    (topic_id, revision_id, actor_type, actor_id, event_type,
     input_object_ids, output_object_ids, summary)
  values
    (v_c.topic_id, v_new_rev, 'admin', v_actor::text, 'contribution_merged',
     array[p_contribution_id::text, v_old_rev], array[v_new_rev],
     'Accepted contribution merged into a new canonical revision (clone+apply).');

  perform public.review_revision(
    v_new_rev,
    'approve',
    'Auto-approved: mechanically cloned from approved revision ' || v_old_rev ||
    ' plus reviewer-accepted contribution ' || p_contribution_id::text || '.'
  );
  v_slug := public.publish_revision(v_new_rev);

  delete from private.merge_object_map
  where operation_id = v_operation_id;

  return v_slug;
end;
$$;

-- The legacy clone-and-merge path approved and published in one privileged
-- action and copied claim verdicts across changed evidence. Keep the signature
-- for client compatibility, but fail closed; the dossier workflow prepares a
-- digest-pinned draft for an independent review and publication instead.
create or replace function public.merge_contribution(p_contribution_id uuid)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.is_admin() then
    raise exception using errcode = '42501', message = 'admin role required';
  end if;
  raise exception using errcode = '0A000',
    message = 'legacy automatic merge is disabled; prepare a reviewed claim dossier';
end;
$$;

-- 10. Deny-by-default ACLs and RPC-only mutations. -------------------------

drop policy if exists topics_insert_own_draft on public.topics;
drop policy if exists topics_admin_update on public.topics;
drop policy if exists revisions_insert_own_draft on public.debate_revisions;
drop policy if exists revisions_admin_update on public.debate_revisions;
drop policy if exists content_admin_insert on public.positions;
drop policy if exists arguments_admin_insert on public.debate_arguments;
drop policy if exists claims_admin_insert on public.claims;
drop policy if exists sources_admin_insert on public.sources;
drop policy if exists excerpts_admin_insert on public.source_excerpts;
drop policy if exists evidence_links_admin_insert on public.evidence_links;
drop policy if exists values_admin_insert on public.debate_values;
drop policy if exists value_positions_admin_insert on public.value_positions;
drop policy if exists tradeoffs_admin_insert on public.tradeoffs;
drop policy if exists contributions_staff_update on public.contributions;
drop policy if exists seed_packets_insert_own on public.seed_packets;
drop policy if exists seed_packets_owner_or_staff_update on public.seed_packets;
drop policy if exists reviews_insert_staff on public.reviews;

drop policy if exists audit_select_visible on public.audit_events;
drop policy if exists possig_counts_select_visible on public.position_signal_counts;
drop policy if exists possig_pulse_select_staff on public.position_signal_pulse;

revoke insert, update, delete, truncate, references, trigger
on all tables in schema public
from public, anon, authenticated;

alter default privileges in schema public
  revoke insert, update, delete, truncate, references, trigger
  on tables from public, anon, authenticated;

grant insert on public.contributions to authenticated;
grant update on public.profiles to authenticated;

-- Identity-bearing and exact-count tables are never directly exposed through
-- PostgREST. Purpose-built RPCs above return only scoped or aggregated data.
revoke select on
  public.audit_events,
  public.position_signal_counts,
  public.position_signal_pulse,
  public.position_signal_ballots,
  public.reviews,
  public.claim_evaluations,
  public.source_integrity,
  public.reviewer_camps,
  public.claim_endorsements,
  public.bridge_audit
from public, anon, authenticated;

-- Public/editorial reads keep only non-identifying columns. This also keeps the
-- current explicit review-page selects working without exposing actor UUIDs or
-- private source quality notes through `select *`.
revoke select on public.topics, public.debate_revisions, public.sources
from public, anon, authenticated;

grant select (
  id, slug, title, question, summary, status,
  published_revision_id, created_at
) on public.topics to anon, authenticated;

grant select (
  id, topic_id, revision_number, status, review_status,
  generated_by, created_at, published_at
) on public.debate_revisions to anon, authenticated;

grant select (
  id, revision_id, topic_id, url, title, publisher, source_type,
  retrieval_status, retrieved_at, content_hash, content_version, sort_order
) on public.sources to anon, authenticated;

revoke execute on all functions in schema public
from public, anon, authenticated, service_role;

alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

-- Helpers invoked by RLS policies.
grant execute on function
  public.is_reviewer(),
  public.is_admin(),
  public.can_read_revision(text),
  public.can_read_topic(text)
to anon, authenticated;
grant execute on function public.app_role() to authenticated;

-- Safe public projections.
grant execute on function
  public.source_key(text),
  public.is_safe_public_url(text),
  public.get_position_signal(text),
  public.get_claim_evaluations(text),
  public.get_claim_bridging(text),
  public.get_source_floor(text),
  public.get_public_audit_events(text, text)
to anon, authenticated;

-- Caller-scoped actions and reads.
grant execute on function
  public.create_seed_packet(text, text, text[], jsonb),
  public.cast_position_signal(text, text, text, text),
  public.get_my_position_signal(text),
  public.get_my_contribution_decisions(text),
  public.get_my_reviewer_camp(text),
  public.get_my_endorsements(text)
to authenticated;

-- Reviewer/admin actions remain callable by the shared authenticated role, but
-- every function derives auth.uid() and checks the profile role internally.
grant execute on function
  public.review_revision(text, text, text),
  public.review_contribution(uuid, text, text),
  public.evaluate_claim(text, text, text, text),
  public.set_reviewer_camp(text, text),
  public.endorse_claim_state(text, text, text),
  public.withdraw_claim_endorsement(text, text),
  public.assess_source_floor(
    text, text, text, text, text, text, text,
    text, text, text, text, text, text
  ),
  public.publish_revision(text),
  public.merge_contribution(uuid)
to authenticated;

-- Only the verified Edge orchestration path can assert an AI actor/result.
grant execute on function
  public.claim_ai_job(uuid, uuid, uuid, integer),
  public.complete_mock_ai_job(uuid, uuid, uuid, jsonb, text),
  public.record_ai_job_failure(uuid, uuid, uuid, text)
to service_role;

grant select on public.published_debate_fixtures to anon, authenticated;

commit;
