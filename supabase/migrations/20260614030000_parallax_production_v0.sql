create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role text not null default 'normal' check (role in ('normal', 'reviewer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topics (
  id text primary key,
  slug text not null unique,
  title text not null,
  question text not null,
  summary text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_revision_id text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.debate_revisions (
  id text primary key,
  topic_id text not null references public.topics(id) on delete cascade,
  revision_number integer not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'superseded')),
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed', 'approved', 'contested', 'rejected')),
  generated_by text not null default 'human' check (generated_by in ('human', 'ai', 'mixed')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  published_by uuid references auth.users(id),
  unique (topic_id, revision_number)
);

alter table public.topics
  add constraint topics_published_revision_fk
  foreign key (published_revision_id) references public.debate_revisions(id);

create table public.positions (
  id text primary key,
  revision_id text not null references public.debate_revisions(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  title text not null,
  short_summary text not null,
  steelman text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'contested', 'archived')),
  generated_by text not null default 'human' check (generated_by in ('human', 'ai', 'mixed')),
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed', 'approved', 'contested', 'rejected')),
  sort_order integer not null default 0
);

create table public.debate_arguments (
  id text primary key,
  revision_id text not null references public.debate_revisions(id) on delete cascade,
  position_id text not null references public.positions(id) on delete cascade,
  direction text not null check (direction in ('supports', 'opposes', 'qualifies')),
  summary text not null,
  claim_ids text[] not null default '{}',
  generated_by text not null default 'human' check (generated_by in ('human', 'ai', 'mixed')),
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed', 'approved', 'contested', 'rejected')),
  sort_order integer not null default 0
);

create table public.claims (
  id text primary key,
  revision_id text not null references public.debate_revisions(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  text text not null,
  claim_type text[] not null default '{factual}',
  generated_by text not null default 'human' check (generated_by in ('human', 'ai', 'mixed')),
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed', 'approved', 'contested', 'rejected')),
  sort_order integer not null default 0,
  constraint claims_claim_type_allowed check (
    claim_type <@ array['factual', 'causal', 'predictive', 'normative', 'definitional']::text[]
  )
);

create table public.sources (
  id text primary key,
  revision_id text not null references public.debate_revisions(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  url text not null,
  title text not null,
  publisher text not null,
  source_type text not null default 'other' check (source_type in ('article', 'paper', 'report', 'law', 'dataset', 'video', 'other')),
  retrieval_status text not null check (retrieval_status in ('found', 'missing', 'blocked', 'failed', 'partial')),
  retrieved_at timestamptz,
  quality_notes text not null default '',
  content_hash text,
  sort_order integer not null default 0
);

create table public.source_excerpts (
  id text primary key,
  revision_id text not null references public.debate_revisions(id) on delete cascade,
  source_id text not null references public.sources(id) on delete cascade,
  text text not null,
  locator text not null default 'auto-excerpt',
  extracted_by text not null default 'system' check (extracted_by in ('human', 'ai', 'system')),
  created_at timestamptz not null default now()
);

create table public.evidence_links (
  id text primary key,
  revision_id text not null references public.debate_revisions(id) on delete cascade,
  claim_id text not null references public.claims(id) on delete cascade,
  source_id text not null references public.sources(id) on delete cascade,
  source_excerpt_id text references public.source_excerpts(id) on delete set null,
  label text not null check (label in ('supports_claim', 'partially_supports_claim', 'contradicts_claim', 'does_not_support_claim', 'unclear')),
  rationale text not null,
  confidence numeric(3,2) not null default 0.50 check (confidence >= 0 and confidence <= 1),
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed', 'approved', 'contested', 'rejected')),
  sort_order integer not null default 0
);

create table public.debate_values (
  id text primary key,
  revision_id text not null references public.debate_revisions(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  name text not null,
  description text not null,
  tension_with text[] not null default '{}',
  sort_order integer not null default 0
);

create table public.value_positions (
  value_id text not null references public.debate_values(id) on delete cascade,
  position_id text not null references public.positions(id) on delete cascade,
  primary key (value_id, position_id)
);

create table public.tradeoffs (
  id text primary key,
  revision_id text not null references public.debate_revisions(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  position_id text not null references public.positions(id) on delete cascade,
  gain text not null,
  cost text not null,
  risk text not null,
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed', 'approved', 'contested', 'rejected'))
);

create table public.contributions (
  id uuid primary key default extensions.gen_random_uuid(),
  topic_id text not null references public.topics(id) on delete cascade,
  type text not null check (type in ('new_claim', 'new_source', 'new_position', 'challenge_evidence_label', 'challenge_steelman', 'value_tradeoff_correction')),
  body text not null,
  title text,
  url text,
  proposed_label text check (proposed_label is null or proposed_label in ('supports_claim', 'partially_supports_claim', 'contradicts_claim', 'does_not_support_claim', 'unclear')),
  target_object_id text,
  status text not null default 'submitted' check (status in ('submitted', 'accepted', 'rejected')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.seed_packets (
  id uuid primary key default extensions.gen_random_uuid(),
  topic_id text not null references public.topics(id) on delete cascade,
  topic_question text not null,
  initial_position text not null,
  initial_arguments text[] not null default '{}',
  source_inputs jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'running', 'analyzed', 'failed')),
  generated_revision_id text references public.debate_revisions(id),
  error_message text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  seed_packet_id uuid not null references public.seed_packets(id) on delete cascade,
  provider text not null default 'mock' check (provider in ('mock', 'openrouter')),
  model text,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'skipped')),
  call_count integer not null default 0,
  estimated_cost_usd numeric(8,4) not null default 0,
  usage jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  target_object_id text not null,
  target_object_type text not null check (target_object_type in ('contribution', 'revision')),
  decision text not null check (decision in ('approve', 'reject', 'request_changes', 'mark_contested')),
  rationale text not null default '',
  reviewed_by uuid not null references auth.users(id),
  reviewed_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default extensions.gen_random_uuid(),
  topic_id text references public.topics(id) on delete cascade,
  revision_id text references public.debate_revisions(id) on delete cascade,
  actor_type text not null check (actor_type in ('user', 'admin', 'ai', 'system')),
  actor_id text,
  event_type text not null,
  input_object_ids text[] not null default '{}',
  output_object_ids text[] not null default '{}',
  summary text not null,
  created_at timestamptz not null default now()
);

create index on public.topics (slug);
create index on public.debate_revisions (topic_id, status);
create index on public.positions (revision_id, sort_order);
create index on public.debate_arguments (revision_id, position_id, sort_order);
create index on public.claims (revision_id, sort_order);
create index on public.sources (revision_id, sort_order);
create index on public.evidence_links (revision_id, claim_id);
create index on public.contributions (topic_id, status);
create index on public.seed_packets (created_by, status);
create index on public.audit_events (topic_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger seed_packets_set_updated_at
before update on public.seed_packets
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, new.id::text),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    'normal'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_auth_user();

create or replace function public.audit_contribution_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_events (
    topic_id, actor_type, actor_id, event_type, input_object_ids, summary
  )
  values (
    new.topic_id,
    'user',
    new.created_by::text,
    'contribution_submitted',
    array[new.id::text],
    'Contribution submitted for review.'
  );
  return new;
end;
$$;

create trigger contributions_audit_submitted
after insert on public.contributions
for each row execute function public.audit_contribution_submitted();

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'anon')
$$;

create or replace function public.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_role() in ('reviewer', 'admin')
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_role() = 'admin'
$$;

create or replace function public.can_read_revision(p_revision_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.debate_revisions r
    join public.topics t on t.published_revision_id = r.id
    where r.id = p_revision_id
      and r.status = 'published'
      and t.status = 'published'
  )
  or exists (
    select 1
    from public.debate_revisions r
    where r.id = p_revision_id
      and r.status = 'draft'
      and auth.uid() is not null
      and (r.created_by = auth.uid() or public.is_reviewer())
  )
$$;

create or replace function public.can_read_topic(p_topic_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.topics
    where id = p_topic_id and status = 'published'
  )
  or exists (
    select 1 from public.topics
    where id = p_topic_id
      and auth.uid() is not null
      and (created_by = auth.uid() or public.is_reviewer())
  )
$$;

create or replace function public.assert_revision_mutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_revision_id text;
begin
  v_revision_id := coalesce(new.revision_id, old.revision_id);
  if exists (
    select 1 from public.debate_revisions
    where id = v_revision_id and status in ('published', 'superseded')
  ) then
    raise exception 'published revisions are immutable';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger positions_immutable_published
before update or delete on public.positions
for each row execute function public.assert_revision_mutable();
create trigger debate_arguments_immutable_published
before update or delete on public.debate_arguments
for each row execute function public.assert_revision_mutable();
create trigger claims_immutable_published
before update or delete on public.claims
for each row execute function public.assert_revision_mutable();
create trigger sources_immutable_published
before update or delete on public.sources
for each row execute function public.assert_revision_mutable();
create trigger source_excerpts_immutable_published
before update or delete on public.source_excerpts
for each row execute function public.assert_revision_mutable();
create trigger evidence_links_immutable_published
before update or delete on public.evidence_links
for each row execute function public.assert_revision_mutable();
create trigger debate_values_immutable_published
before update or delete on public.debate_values
for each row execute function public.assert_revision_mutable();
create trigger tradeoffs_immutable_published
before update or delete on public.tradeoffs
for each row execute function public.assert_revision_mutable();

alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.debate_revisions enable row level security;
alter table public.positions enable row level security;
alter table public.debate_arguments enable row level security;
alter table public.claims enable row level security;
alter table public.sources enable row level security;
alter table public.source_excerpts enable row level security;
alter table public.evidence_links enable row level security;
alter table public.debate_values enable row level security;
alter table public.value_positions enable row level security;
alter table public.tradeoffs enable row level security;
alter table public.contributions enable row level security;
alter table public.seed_packets enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.reviews enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_own_or_staff on public.profiles
for select using (id = auth.uid() or public.is_reviewer());

create policy profiles_no_self_role_update on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid() and role = public.app_role());

create policy topics_select_visible on public.topics
for select using (public.can_read_topic(id));

create policy topics_insert_own_draft on public.topics
for insert to authenticated
with check (created_by = auth.uid() and status = 'draft');

create policy topics_admin_update on public.topics
for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy revisions_select_visible on public.debate_revisions
for select using (public.can_read_revision(id));

create policy revisions_insert_own_draft on public.debate_revisions
for insert to authenticated
with check (created_by = auth.uid() and status = 'draft');

create policy revisions_admin_update on public.debate_revisions
for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy positions_select_visible on public.positions
for select using (public.can_read_revision(revision_id));
create policy arguments_select_visible on public.debate_arguments
for select using (public.can_read_revision(revision_id));
create policy claims_select_visible on public.claims
for select using (public.can_read_revision(revision_id));
create policy sources_select_visible on public.sources
for select using (public.can_read_revision(revision_id));
create policy excerpts_select_visible on public.source_excerpts
for select using (public.can_read_revision(revision_id));
create policy evidence_links_select_visible on public.evidence_links
for select using (public.can_read_revision(revision_id));
create policy values_select_visible on public.debate_values
for select using (public.can_read_revision(revision_id));
create policy value_positions_select_visible on public.value_positions
for select using (
  exists (
    select 1 from public.debate_values v
    where v.id = value_id and public.can_read_revision(v.revision_id)
  )
);
create policy tradeoffs_select_visible on public.tradeoffs
for select using (public.can_read_revision(revision_id));

create policy content_admin_insert on public.positions
for insert to authenticated with check (public.is_admin());
create policy arguments_admin_insert on public.debate_arguments
for insert to authenticated with check (public.is_admin());
create policy claims_admin_insert on public.claims
for insert to authenticated with check (public.is_admin());
create policy sources_admin_insert on public.sources
for insert to authenticated with check (public.is_admin());
create policy excerpts_admin_insert on public.source_excerpts
for insert to authenticated with check (public.is_admin());
create policy evidence_links_admin_insert on public.evidence_links
for insert to authenticated with check (public.is_admin());
create policy values_admin_insert on public.debate_values
for insert to authenticated with check (public.is_admin());
create policy value_positions_admin_insert on public.value_positions
for insert to authenticated with check (public.is_admin());
create policy tradeoffs_admin_insert on public.tradeoffs
for insert to authenticated with check (public.is_admin());

create policy contributions_select_own_or_staff on public.contributions
for select using (created_by = auth.uid() or public.is_reviewer());

create policy contributions_insert_own on public.contributions
for insert to authenticated
with check (created_by = auth.uid() and status = 'submitted');

create policy contributions_staff_update on public.contributions
for update to authenticated
using (public.is_reviewer()) with check (public.is_reviewer());

create policy seed_packets_select_own_or_staff on public.seed_packets
for select using (created_by = auth.uid() or public.is_reviewer());

create policy seed_packets_insert_own on public.seed_packets
for insert to authenticated
with check (created_by = auth.uid());

create policy seed_packets_owner_or_staff_update on public.seed_packets
for update to authenticated
using (created_by = auth.uid() or public.is_reviewer())
with check (created_by = auth.uid() or public.is_reviewer());

create policy ai_jobs_select_own_or_staff on public.ai_jobs
for select using (created_by = auth.uid() or public.is_reviewer());

create policy reviews_select_staff on public.reviews
for select using (public.is_reviewer());

create policy reviews_insert_staff on public.reviews
for insert to authenticated
with check (public.is_reviewer() and reviewed_by = auth.uid());

create policy audit_select_visible on public.audit_events
for select using (
  (revision_id is not null and public.can_read_revision(revision_id))
  or (topic_id is not null and public.can_read_topic(topic_id))
  or public.is_reviewer()
);

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
      'created_by', coalesce(t.created_by::text, 'system')
    ),
    'revision', jsonb_build_object(
      'id', r.id,
      'topic_id', r.topic_id,
      'revision_number', r.revision_number,
      'status', r.status,
      'published_at', r.published_at,
      'published_by', coalesce(r.published_by::text, 'system')
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
        'title', s.title,
        'publisher', s.publisher,
        'source_type', s.source_type,
        'retrieval_status', case when s.retrieval_status = 'failed' then 'missing' else s.retrieval_status end,
        'retrieved_at', coalesce(to_char(s.retrieved_at at time zone 'UTC', 'YYYY-MM-DD'), ''),
        'quality_notes', s.quality_notes
      ) order by s.sort_order)
      from public.sources s
      where s.revision_id = r.id
    ), '[]'::jsonb),
    'evidence_links', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', el.id,
        'claim_id', el.claim_id,
        'source_id', el.source_id,
        'label', el.label,
        'rationale', el.rationale,
        'confidence', el.confidence,
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
    'audit_events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ae.id,
        'topic_id', ae.topic_id,
        'revision_id', coalesce(ae.revision_id, r.id),
        'actor_type', ae.actor_type,
        'actor_id', coalesce(ae.actor_id, ae.actor_type),
        'event_type', ae.event_type,
        'summary', ae.summary,
        'created_at', ae.created_at
      ) order by ae.created_at)
      from public.audit_events ae
      where ae.topic_id = t.id
        and (ae.revision_id is null or ae.revision_id = r.id)
    ), '[]'::jsonb)
  ) as debate
from public.topics t
join public.debate_revisions r on r.id = t.published_revision_id
where t.status = 'published'
  and r.status = 'published';

create or replace function public.create_seed_packet(
  p_question text,
  p_initial_position text,
  p_initial_arguments text[],
  p_sources jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_packet_id uuid := extensions.gen_random_uuid();
  v_slug_base text;
  v_slug text;
  v_topic_id text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if length(trim(p_question)) < 12 or right(trim(p_question), 1) <> '?' then
    raise exception 'seed packet question must be a question of at least 12 characters';
  end if;
  if length(trim(p_initial_position)) < 4 then
    raise exception 'initial position is required';
  end if;
  if jsonb_typeof(p_sources) <> 'array' then
    raise exception 'sources must be a JSON array';
  end if;

  v_slug_base := lower(regexp_replace(trim(p_question), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug_base := trim(both '-' from v_slug_base);
  if v_slug_base = '' then
    v_slug_base := 'seed-topic';
  end if;
  v_slug := left(v_slug_base, 54) || '-' || left(replace(v_packet_id::text, '-', ''), 8);
  v_topic_id := 'topic_' || replace(v_slug, '-', '_');

  insert into public.topics (id, slug, title, question, summary, status, created_by)
  values (
    v_topic_id,
    v_slug,
    trim(trailing '?' from trim(p_question)),
    trim(p_question),
    'Draft topic created from a seed packet. It is not public until reviewed and published.',
    'draft',
    v_actor
  );

  insert into public.seed_packets (
    id,
    topic_id,
    topic_question,
    initial_position,
    initial_arguments,
    source_inputs,
    created_by
  )
  values (
    v_packet_id,
    v_topic_id,
    trim(p_question),
    trim(p_initial_position),
    coalesce(p_initial_arguments, '{}'::text[]),
    p_sources,
    v_actor
  );

  insert into public.audit_events (
    topic_id,
    actor_type,
    actor_id,
    event_type,
    output_object_ids,
    summary
  )
  values (
    v_topic_id,
    'user',
    v_actor::text,
    'topic_created',
    array[v_packet_id::text],
    'Seed packet created a draft topic awaiting AI analysis.'
  );

  return v_packet_id;
end;
$$;

create or replace function public.complete_mock_ai_job(
  p_seed_packet_id uuid,
  p_actor_id uuid default auth.uid(),
  p_retrievals jsonb default '[]'::jsonb,
  p_provider text default 'mock'
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seed public.seed_packets%rowtype;
  v_actor uuid := coalesce(p_actor_id, auth.uid());
  v_prefix text := left(replace(p_seed_packet_id::text, '-', ''), 10);
  v_revision_id text := 'rev_' || v_prefix || '_draft';
  v_job_id uuid;
  v_arg text;
  v_idx integer := 0;
  v_claim_id text;
  v_claim_ids text[] := '{}';
  v_source jsonb;
  v_source_id text;
  v_excerpt_id text;
  v_first_claim_id text;
  v_status text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_seed from public.seed_packets where id = p_seed_packet_id for update;
  if not found then
    raise exception 'seed packet not found';
  end if;
  if v_seed.created_by <> v_actor and not public.is_reviewer() then
    raise exception 'not allowed to analyze this seed packet';
  end if;
  if v_seed.generated_revision_id is not null then
    return v_seed.generated_revision_id;
  end if;

  update public.seed_packets
    set status = 'running', error_message = null
    where id = p_seed_packet_id;

  insert into public.ai_jobs (seed_packet_id, provider, model, status, created_by)
  values (
    p_seed_packet_id,
    case when p_provider = 'openrouter' then 'openrouter' else 'mock' end,
    case when p_provider = 'openrouter' then 'deepseek/deepseek-v4-flash' else 'deterministic-mock-v0' end,
    'running',
    v_actor
  )
  returning id into v_job_id;

  insert into public.audit_events (topic_id, actor_type, actor_id, event_type, input_object_ids, summary)
  values (v_seed.topic_id, 'ai', 'mock', 'ai_analysis_started', array[p_seed_packet_id::text], 'Deterministic mock AI analysis started.');

  insert into public.debate_revisions (
    id, topic_id, revision_number, status, review_status, generated_by, created_by
  )
  values (
    v_revision_id, v_seed.topic_id, 1, 'draft', 'unreviewed', 'ai', v_actor
  );

  insert into public.positions (
    id, revision_id, topic_id, title, short_summary, steelman, generated_by, review_status, sort_order
  )
  values
    (
      'pos_' || v_prefix || '_initial',
      v_revision_id,
      v_seed.topic_id,
      v_seed.initial_position,
      'The seed author argues this position should be represented first.',
      'The strongest version of this position is that the policy should be judged by its concrete effects, source-backed claims, and explicit trade-offs rather than by slogans.',
      'ai',
      'unreviewed',
      1
    ),
    (
      'pos_' || v_prefix || '_guardrails',
      v_revision_id,
      v_seed.topic_id,
      'Proceed only with explicit guardrails',
      'A serious counter-position asks for safeguards, exemptions, or narrower scope before accepting the proposal.',
      'The strongest version of the guardrails view is that a policy can have good goals while still imposing unfair costs if exemptions, monitoring, and review are weak.',
      'ai',
      'unreviewed',
      2
    );

  if array_length(v_seed.initial_arguments, 1) is null then
    v_seed.initial_arguments := array['The seed packet needs reviewer-supplied claims before publication.'];
  end if;

  foreach v_arg in array v_seed.initial_arguments loop
    v_idx := v_idx + 1;
    v_claim_id := 'claim_' || v_prefix || '_' || v_idx;
    v_claim_ids := array_append(v_claim_ids, v_claim_id);
    insert into public.claims (
      id, revision_id, topic_id, text, claim_type, generated_by, review_status, sort_order
    )
    values (
      v_claim_id,
      v_revision_id,
      v_seed.topic_id,
      trim(v_arg),
      case
        when v_arg ilike '%should%' or v_arg ilike '%must%' then array['normative']::text[]
        when v_arg ilike '%can%' or v_arg ilike '%may%' then array['causal']::text[]
        else array['factual']::text[]
      end,
      'ai',
      'unreviewed',
      v_idx
    );
    insert into public.audit_events (topic_id, revision_id, actor_type, actor_id, event_type, output_object_ids, summary)
    values (v_seed.topic_id, v_revision_id, 'ai', 'mock', 'claim_extracted', array[v_claim_id], 'Mock pipeline extracted a candidate claim from the seed packet.');
  end loop;

  v_first_claim_id := v_claim_ids[1];

  insert into public.debate_arguments (
    id, revision_id, position_id, direction, summary, claim_ids, generated_by, review_status, sort_order
  )
  values
    (
      'arg_' || v_prefix || '_initial',
      v_revision_id,
      'pos_' || v_prefix || '_initial',
      'supports',
      'The initial position rests on the seed packet claims and their source alignment.',
      v_claim_ids,
      'ai',
      'unreviewed',
      1
    ),
    (
      'arg_' || v_prefix || '_guardrails',
      v_revision_id,
      'pos_' || v_prefix || '_guardrails',
      'qualifies',
      'The policy should be reviewed for distributional costs, enforcement risk, and implementation scope.',
      v_claim_ids,
      'ai',
      'unreviewed',
      2
    );

  v_idx := 0;
  for v_source in select * from jsonb_array_elements(coalesce(p_retrievals, '[]'::jsonb)) loop
    v_idx := v_idx + 1;
    v_status := coalesce(v_source ->> 'status', 'missing');
    if v_status not in ('found', 'missing', 'blocked', 'failed', 'partial') then
      v_status := 'missing';
    end if;
    v_source_id := 'source_' || v_prefix || '_' || v_idx;
    v_excerpt_id := 'excerpt_' || v_prefix || '_' || v_idx;
    insert into public.sources (
      id, revision_id, topic_id, url, title, publisher, source_type, retrieval_status,
      retrieved_at, quality_notes, content_hash, sort_order
    )
    values (
      v_source_id,
      v_revision_id,
      v_seed.topic_id,
      coalesce(v_source ->> 'url', 'about:blank'),
      coalesce(nullif(v_source ->> 'title', ''), 'Provided source ' || v_idx),
      coalesce(nullif(v_source ->> 'publisher', ''), 'Provided source'),
      'other',
      v_status,
      now(),
      coalesce(nullif(v_source ->> 'note', ''), 'Fetched source text is treated as untrusted; only bounded excerpts are stored.'),
      v_source ->> 'hash',
      v_idx
    );

    if coalesce(v_source ->> 'excerpt', '') <> '' then
      insert into public.source_excerpts (
        id, revision_id, source_id, text, locator, extracted_by
      )
      values (
        v_excerpt_id,
        v_revision_id,
        v_source_id,
        left(v_source ->> 'excerpt', 900),
        coalesce(nullif(v_source ->> 'locator', ''), 'bounded fetch excerpt'),
        'system'
      );
    else
      v_excerpt_id := null;
    end if;

    if v_first_claim_id is not null then
      insert into public.evidence_links (
        id, revision_id, claim_id, source_id, source_excerpt_id, label, rationale,
        confidence, review_status, sort_order
      )
      values (
        'ev_' || v_prefix || '_' || v_idx,
        v_revision_id,
        v_first_claim_id,
        v_source_id,
        v_excerpt_id,
        case when v_status in ('found', 'partial') then 'unclear' else 'does_not_support_claim' end,
        case
          when v_status in ('found', 'partial') then 'The source was retrieved, but a human reviewer must confirm the claim-source alignment.'
          when v_status = 'blocked' then 'The URL was blocked by server-side source retrieval safeguards.'
          else 'The source could not be retrieved for this draft.'
        end,
        0.50,
        'unreviewed',
        v_idx
      );
      insert into public.audit_events (topic_id, revision_id, actor_type, actor_id, event_type, input_object_ids, output_object_ids, summary)
      values (
        v_seed.topic_id,
        v_revision_id,
        'ai',
        'mock',
        'evidence_labeled',
        array[v_source_id, v_first_claim_id],
        array['ev_' || v_prefix || '_' || v_idx],
        'Mock pipeline stored a reviewable source alignment label.'
      );
    end if;

    insert into public.audit_events (topic_id, revision_id, actor_type, actor_id, event_type, output_object_ids, summary)
    values (
      v_seed.topic_id,
      v_revision_id,
      'system',
      'source-fetch',
      'source_retrieved',
      array[v_source_id],
      'Source retrieval status: ' || v_status || '.'
    );
  end loop;

  insert into public.debate_values (
    id, revision_id, topic_id, name, description, tension_with, sort_order
  )
  values
    ('value_' || v_prefix || '_evidence', v_revision_id, v_seed.topic_id, 'Evidence quality', 'Preference for claims tied to inspectable public sources.', array['Fairness'], 1),
    ('value_' || v_prefix || '_fairness', v_revision_id, v_seed.topic_id, 'Fairness', 'Concern for unequal burdens and implementation safeguards.', array['Evidence quality'], 2);

  insert into public.value_positions (value_id, position_id)
  values
    ('value_' || v_prefix || '_evidence', 'pos_' || v_prefix || '_initial'),
    ('value_' || v_prefix || '_fairness', 'pos_' || v_prefix || '_guardrails');

  insert into public.tradeoffs (
    id, revision_id, topic_id, position_id, gain, cost, risk, review_status
  )
  values
    (
      'trade_' || v_prefix || '_initial',
      v_revision_id,
      v_seed.topic_id,
      'pos_' || v_prefix || '_initial',
      'A structured proposal can become readable and reviewable quickly.',
      'Early structure may overfit the seed author''s framing.',
      'Weak source retrieval or narrow framing could hide important objections.',
      'unreviewed'
    ),
    (
      'trade_' || v_prefix || '_guardrails',
      v_revision_id,
      v_seed.topic_id,
      'pos_' || v_prefix || '_guardrails',
      'Safeguards reduce unfair or brittle implementation.',
      'Extra review can slow publication and leave gaps visible longer.',
      'A veto-style process can block useful maps if no one owns the next review step.',
      'unreviewed'
    );

  insert into public.audit_events (topic_id, revision_id, actor_type, actor_id, event_type, output_object_ids, summary)
  values
    (v_seed.topic_id, v_revision_id, 'ai', 'mock', 'position_generated', array['pos_' || v_prefix || '_initial', 'pos_' || v_prefix || '_guardrails'], 'Mock pipeline generated two reviewable positions.'),
    (v_seed.topic_id, v_revision_id, 'ai', 'mock', 'ai_analysis_completed', array[v_revision_id], 'Deterministic mock AI analysis completed and produced a draft revision.');

  update public.ai_jobs
    set status = 'completed',
        call_count = 0,
        completed_at = now(),
        usage = jsonb_build_object('mode', p_provider, 'live_calls', 0)
    where id = v_job_id;

  update public.seed_packets
    set status = 'analyzed',
        generated_revision_id = v_revision_id,
        error_message = null
    where id = p_seed_packet_id;

  return v_revision_id;
exception
  when others then
    update public.seed_packets
      set status = 'failed',
          error_message = left(sqlerrm, 300)
      where id = p_seed_packet_id;
    if v_job_id is not null then
      update public.ai_jobs
        set status = 'failed',
            error_message = left(sqlerrm, 300),
            completed_at = now()
        where id = v_job_id;
    end if;
    insert into public.audit_events (topic_id, actor_type, actor_id, event_type, input_object_ids, summary)
    values (coalesce(v_seed.topic_id, null), 'ai', 'mock', 'ai_analysis_failed', array[p_seed_packet_id::text], left(sqlerrm, 300));
    raise;
end;
$$;

create or replace function public.review_revision(
  p_revision_id text,
  p_decision text,
  p_rationale text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_revision public.debate_revisions%rowtype;
  v_review_id uuid;
  v_status text;
begin
  if v_actor is null or not public.is_reviewer() then
    raise exception 'reviewer role required';
  end if;
  if p_decision not in ('approve', 'reject', 'request_changes', 'mark_contested') then
    raise exception 'invalid review decision';
  end if;
  select * into v_revision from public.debate_revisions where id = p_revision_id for update;
  if not found then
    raise exception 'revision not found';
  end if;
  if v_revision.status <> 'draft' then
    raise exception 'only draft revisions can be reviewed';
  end if;

  v_status := case
    when p_decision = 'approve' then 'approved'
    when p_decision = 'reject' then 'rejected'
    else 'contested'
  end;

  insert into public.reviews (
    target_object_id, target_object_type, decision, rationale, reviewed_by
  )
  values (p_revision_id, 'revision', p_decision, coalesce(p_rationale, ''), v_actor)
  returning id into v_review_id;

  update public.debate_revisions
    set review_status = v_status
    where id = p_revision_id;

  insert into public.audit_events (
    topic_id, revision_id, actor_type, actor_id, event_type, input_object_ids, output_object_ids, summary
  )
  values (
    v_revision.topic_id,
    p_revision_id,
    'admin',
    v_actor::text,
    'review_completed',
    array[p_revision_id],
    array[v_review_id::text],
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
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_contribution public.contributions%rowtype;
  v_review_id uuid;
begin
  if v_actor is null or not public.is_reviewer() then
    raise exception 'reviewer role required';
  end if;
  if p_decision not in ('approve', 'reject') then
    raise exception 'invalid contribution decision';
  end if;
  select * into v_contribution from public.contributions where id = p_contribution_id for update;
  if not found then
    raise exception 'contribution not found';
  end if;
  if v_contribution.status <> 'submitted' then
    raise exception 'contribution already reviewed';
  end if;

  insert into public.reviews (
    target_object_id, target_object_type, decision, rationale, reviewed_by
  )
  values (p_contribution_id::text, 'contribution', p_decision, coalesce(p_rationale, ''), v_actor)
  returning id into v_review_id;

  update public.contributions
    set status = case when p_decision = 'approve' then 'accepted' else 'rejected' end
    where id = p_contribution_id;

  insert into public.audit_events (
    topic_id, actor_type, actor_id, event_type, input_object_ids, output_object_ids, summary
  )
  values (
    v_contribution.topic_id,
    'admin',
    v_actor::text,
    'review_completed',
    array[p_contribution_id::text],
    array[v_review_id::text],
    'Contribution review completed with decision: ' || p_decision || '.'
  );

  return v_review_id;
end;
$$;

create or replace function public.publish_revision(p_revision_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_revision public.debate_revisions%rowtype;
  v_previous text;
  v_slug text;
begin
  if v_actor is null or not public.is_admin() then
    raise exception 'admin role required';
  end if;
  select * into v_revision from public.debate_revisions where id = p_revision_id for update;
  if not found then
    raise exception 'revision not found';
  end if;
  if v_revision.status <> 'draft' then
    raise exception 'only draft revisions can be published';
  end if;
  if v_revision.review_status <> 'approved' then
    raise exception 'revision must be approved before publication';
  end if;

  select published_revision_id, slug
    into v_previous, v_slug
    from public.topics
    where id = v_revision.topic_id
    for update;

  if v_previous is not null and v_previous <> p_revision_id then
    update public.debate_revisions
      set status = 'superseded'
      where id = v_previous and status = 'published';
  end if;

  update public.positions set status = 'published', review_status = 'approved' where revision_id = p_revision_id;
  update public.debate_arguments set review_status = 'approved' where revision_id = p_revision_id;
  update public.claims set review_status = 'approved' where revision_id = p_revision_id;
  update public.evidence_links set review_status = 'approved' where revision_id = p_revision_id;
  update public.tradeoffs set review_status = 'approved' where revision_id = p_revision_id;

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
    topic_id, revision_id, actor_type, actor_id, event_type, input_object_ids, output_object_ids, summary
  )
  values (
    v_revision.topic_id,
    p_revision_id,
    'admin',
    v_actor::text,
    'revision_published',
    array[p_revision_id],
    array[v_revision.topic_id],
    'Approved revision published atomically through protected RPC.'
  );

  return v_slug;
end;
$$;

grant usage on schema public to anon, authenticated;
grant select on public.published_debate_fixtures to anon, authenticated;
grant select on
  public.profiles,
  public.topics,
  public.debate_revisions,
  public.positions,
  public.debate_arguments,
  public.claims,
  public.sources,
  public.source_excerpts,
  public.evidence_links,
  public.debate_values,
  public.value_positions,
  public.tradeoffs,
  public.contributions,
  public.seed_packets,
  public.ai_jobs,
  public.reviews,
  public.audit_events
to anon, authenticated;
grant insert on public.contributions, public.seed_packets to authenticated;
grant update on public.profiles, public.contributions, public.seed_packets to authenticated;
grant execute on function
  public.app_role(),
  public.is_reviewer(),
  public.is_admin(),
  public.create_seed_packet(text, text, text[], jsonb),
  public.complete_mock_ai_job(uuid, uuid, jsonb, text),
  public.review_revision(text, text, text),
  public.review_contribution(uuid, text, text),
  public.publish_revision(text)
to authenticated;
