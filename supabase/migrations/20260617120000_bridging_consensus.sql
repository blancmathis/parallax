-- BRIDGING CONSENSUS (the integrity core). ADDITIVE ONLY. Extends G2
-- (claim_evaluations) with a Community-Notes-style CROSS-CAMP gate: a claim's
-- state becomes "bridged" (confirmed) only when reviewers from >=2 DISTINCT,
-- server-recorded, unfakeable camps each independently endorse the SAME state
-- above a per-camp floor — measured by camp DIVERSITY (a MIN across camps),
-- NEVER by head-count. A majority or single-camp brigade, at any volume, cannot
-- confirm. "contested" can itself be a bridged (cross-camp) verdict.
--
-- DOES NOT TOUCH: auth/RLS/roles, publish/review RPCs, immutability triggers,
-- published_debate_fixtures, NOR the shipped claim_evaluations columns in a
-- breaking way (one additive column + evaluated_by->nullable). The 5 existing
-- get_claim_evaluations fields are extended with ADDITIVE keys only.
--
-- PRIVACY (red line): reviewer identity AND camp NEVER leave the DB. All
-- bridging/evaluation audit goes to a NEW reviewer-only sink (bridge_audit) that
-- the public published_debate_fixtures view does NOT join. We deliberately STOP
-- writing claim-evaluation audit to public.audit_events (which the view embeds
-- where revision_id is null) — closing a latent G2 leak that exposed the
-- evaluator's uuid + the 'claim_evaluated' event to the anon payload.
--
-- DEFERRED (named, NOT faked): integrity-vs-relevance axis split (docs/08 §3/§4),
-- rotating juries (§20.4), rules-floor (§16/§20.1), multi-axis camp diversity &
-- learned latent factor (§9/§8), anti-coordination filtering (§8),
-- unresolved-after-full-procedure (§10). bridge_k() is a PROVISIONAL local floor
-- (=1 so the gate is observable with 2 seeded reviewers); production MUST raise
-- it (k>=2 each camp + a total-cohort release gate, mirroring D15).

-- =========================================================================
-- 0. ADDITIVE columns on the G2 table — make the bridge write NON-DESTRUCTIVE.
-- =========================================================================
alter table public.claim_evaluations
  add column if not exists authored_by text not null default 'reviewer'
    check (authored_by in ('reviewer', 'bridge'));
alter table public.claim_evaluations
  alter column evaluated_by drop not null;

-- =========================================================================
-- 1. Tunable floors (functions so a later migration bumps them with no rewrite).
-- =========================================================================
create or replace function public.bridge_k()
returns integer language sql immutable as $$ select 1 $$;

create or replace function public.bridge_min_camps()
returns integer language sql immutable as $$ select 2 $$;

-- =========================================================================
-- 2. REVIEWER-ONLY AUDIT SINK (NOT public.audit_events; NOT joined by the view).
-- =========================================================================
create table public.bridge_audit (
  id          uuid primary key default extensions.gen_random_uuid(),
  topic_id    text references public.topics(id) on delete cascade,
  actor_id    uuid,                 -- reviewer uuid; STAFF-ONLY, never public
  event_type  text not null,        -- camp_declared|camp_changed|claim_endorsed|claim_bridged|claim_evaluated
  claim_id    text,
  detail      text not null default '',
  created_at  timestamptz not null default now()
);
alter table public.bridge_audit enable row level security;
create policy bridge_audit_select_staff on public.bridge_audit
  for select using (public.is_reviewer());
-- NO insert/update/delete policy => only the SECURITY DEFINER RPCs write.

-- =========================================================================
-- 2.5 CLOSE THE LATENT G2 LEAK. Re-route claim-evaluation audit from the
--     publicly-embedded audit_events to the reviewer-only bridge_audit, and set
--     authored_by='reviewer' (a manual eval always wins its own row).
-- =========================================================================
create or replace function public.evaluate_claim(
  p_topic_id  text,
  p_claim_id  text,
  p_state     text,
  p_rationale text default ''
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.is_reviewer() then
    raise exception 'reviewer role required';
  end if;
  if p_state not in ('established', 'contested', 'values') then
    raise exception 'invalid claim state';
  end if;
  if not public.can_read_topic(p_topic_id) then
    raise exception 'topic not readable';
  end if;

  insert into public.claim_evaluations
      (topic_id, claim_id, state, rationale, evaluated_by, authored_by)
    values (p_topic_id, p_claim_id, p_state, coalesce(p_rationale, ''), v_actor, 'reviewer')
  on conflict (topic_id, claim_id) do update
    set state = excluded.state,
        rationale = excluded.rationale,
        evaluated_by = excluded.evaluated_by,
        authored_by = 'reviewer',
        evaluated_at = now();

  -- reviewer-only sink (was public.audit_events -> leaked into the anon view).
  insert into public.bridge_audit (topic_id, actor_id, event_type, claim_id, detail)
    values (p_topic_id, v_actor, 'claim_evaluated', p_claim_id, 'evaluated ' || p_state);
end;
$$;

-- =========================================================================
-- 3. PER-DEBATE REVIEWER CAMP — the integrity lock. One reviewer = one camp.
-- =========================================================================
create table public.reviewer_camps (
  topic_id    text not null references public.topics(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  camp_id     text not null check (camp_id = '__undecided__' or camp_id ~ '^pos_[a-z]$'),
  declared_at timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  is_demo     boolean not null default false,
  primary key (topic_id, reviewer_id)
);
alter table public.reviewer_camps enable row level security;
create policy reviewer_camps_select_staff on public.reviewer_camps
  for select using (public.is_reviewer());

-- =========================================================================
-- 4. PER-(claim, reviewer) ENDORSEMENT — one per reviewer per claim (revisable).
--    NO camp_id stored: the gate reads the LIVE camp via a JOIN to reviewer_camps.
-- =========================================================================
create table public.claim_endorsements (
  topic_id    text not null references public.topics(id) on delete cascade,
  claim_id    text not null,
  reviewer_id uuid not null references auth.users(id),
  state       text not null check (state in ('established', 'contested')),
  endorsed_at timestamptz not null default now(),
  is_demo     boolean not null default false,
  primary key (topic_id, claim_id, reviewer_id)
);
create index on public.claim_endorsements (topic_id, claim_id, state);
alter table public.claim_endorsements enable row level security;
create policy claim_endorsements_select_staff on public.claim_endorsements
  for select using (public.is_reviewer());

-- =========================================================================
-- 5. SERVER camp-id resolution — ordinal, against the PUBLISHED revision only.
--    NO verbatim 'pos_[a-f]' fast-path (that re-opens spoofing under EN).
-- =========================================================================
create or replace function public.camp_of_position(p_topic_id text, p_position_id text)
returns text
language sql stable security definer set search_path = public
as $$
  select case
    when p_position_id is null then '__undecided__'
    else coalesce((
      select 'pos_' || chr(96 + p.sort_order)
      from public.positions p
      join public.topics t on t.published_revision_id = p.revision_id
      where t.id = p_topic_id and p.id = p_position_id
      limit 1
    ), '__undecided__')
  end
$$;

-- =========================================================================
-- 6. SHARED BRIDGE-OUTCOME HELPER — the SINGLE computation behind write + read.
--    Counts DISTINCT LIVE camps per state (JOIN to reviewer_camps), excluding
--    '__undecided__', keeping camps with >= bridge_k() endorsers.
-- =========================================================================
create or replace function public.bridge_outcome(p_topic_id text, p_claim_id text)
returns table (status text, winner_state text, camp_count integer, endorser_total integer)
language sql stable security definer set search_path = public
as $$
  with live as (
    select e.state, rc.camp_id, e.reviewer_id
    from public.claim_endorsements e
    join public.reviewer_camps rc
      on rc.topic_id = e.topic_id and rc.reviewer_id = e.reviewer_id
    where e.topic_id = p_topic_id and e.claim_id = p_claim_id
      and rc.camp_id <> '__undecided__'
  ),
  per_state_camp as (
    select state, camp_id, count(*) as n from live group by state, camp_id
  ),
  qual as (
    select state, count(*) as distinct_camps, sum(n) as endorsers
    from per_state_camp
    where n >= public.bridge_k()
    group by state
  ),
  bridged as (select * from qual where distinct_camps >= public.bridge_min_camps()),
  agg as (
    select
      (select count(*) from bridged)                            as bridged_states,
      (select max(distinct_camps) from qual)                    as best_camps,
      (select max(distinct_camps) from bridged)                 as winner_camps,
      (select state from bridged order by distinct_camps desc, state limit 1) as one_state
  )
  select
    case
      when bridged_states >= 2 then 'bridged_conflicting'
      when bridged_states = 1 and one_state = 'established' then 'bridged_established'
      when bridged_states = 1 and one_state = 'contested'   then 'bridged_contested'
      when coalesce(best_camps, 0) = 1 then 'pending_single_camp'
      else 'insufficient'
    end as status,
    case when bridged_states = 1 then one_state else null end as winner_state,
    case when bridged_states = 1 then winner_camps
         when coalesce(best_camps,0) = 1 then 1 else 0 end       as camp_count,
    coalesce((select sum(endorsers)::int from qual), 0)          as endorser_total
  from agg
$$;

-- =========================================================================
-- 7. THE GATE WRITE-BACK. Writes a confirmed state into claim_evaluations ONLY
--    for a single-state bridge, ONLY into an authored_by='bridge' row, NEVER
--    touching a human authored_by='reviewer' row.
-- =========================================================================
create or replace function public.recompute_bridging(p_topic_id text, p_claim_id text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_status text;
  v_winner text;
  v_camps  integer;
  v_human  boolean;
begin
  select status, winner_state, camp_count
    into v_status, v_winner, v_camps
  from public.bridge_outcome(p_topic_id, p_claim_id);

  select exists (
    select 1 from public.claim_evaluations
    where topic_id = p_topic_id and claim_id = p_claim_id and authored_by = 'reviewer'
  ) into v_human;

  if v_winner is null then
    delete from public.claim_evaluations
      where topic_id = p_topic_id and claim_id = p_claim_id and authored_by = 'bridge';
    return;
  end if;

  if v_human then
    return;  -- a human eval exists: surface the bridge via the caption, never clobber.
  end if;

  insert into public.claim_evaluations
      (topic_id, claim_id, state, rationale, evaluated_by, authored_by, is_demo)
    values (p_topic_id, p_claim_id, v_winner, '', null, 'bridge', false)
  on conflict (topic_id, claim_id) do update
    set state = excluded.state, evaluated_by = null,
        authored_by = 'bridge', evaluated_at = now()
    where public.claim_evaluations.authored_by = 'bridge';

  insert into public.bridge_audit (topic_id, actor_id, event_type, claim_id, detail)
    values (p_topic_id, null, 'claim_bridged', p_claim_id,
            'Bridged as ' || v_winner || ' across ' || v_camps || ' camps.');
end;
$$;

-- =========================================================================
-- 8. DECLARE / REVISE camp. On a real change, recompute every claim this
--    reviewer endorsed (the live-join handles the new camp instantly).
-- =========================================================================
create or replace function public.set_reviewer_camp(
  p_topic_id    text,
  p_position_id text default null
) returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_camp  text;
  v_prev  text;
  r       record;
begin
  if v_actor is null or not public.is_reviewer() then
    raise exception 'reviewer role required';
  end if;
  if not public.can_read_topic(p_topic_id) then
    raise exception 'topic not readable';
  end if;
  v_camp := public.camp_of_position(p_topic_id, p_position_id);

  select camp_id into v_prev from public.reviewer_camps
    where topic_id = p_topic_id and reviewer_id = v_actor;

  if v_prev is null then
    insert into public.reviewer_camps (topic_id, reviewer_id, camp_id)
      values (p_topic_id, v_actor, v_camp);
    insert into public.bridge_audit (topic_id, actor_id, event_type, detail)
      values (p_topic_id, v_actor, 'camp_declared', 'declared');
  elsif v_prev <> v_camp then
    update public.reviewer_camps
      set camp_id = v_camp, updated_at = now()
      where topic_id = p_topic_id and reviewer_id = v_actor;
    insert into public.bridge_audit (topic_id, actor_id, event_type, detail)
      values (p_topic_id, v_actor, 'camp_changed', 'changed');
    for r in
      select distinct claim_id from public.claim_endorsements
      where topic_id = p_topic_id and reviewer_id = v_actor
    loop
      perform public.recompute_bridging(p_topic_id, r.claim_id);
    end loop;
  end if;
  return v_camp;
end;
$$;

-- =========================================================================
-- 9. ENDORSE / REVISE — reads the LOCKED camp (no camp argument). RAISES if no
--    camp declared. Recomputes the gate via the shared helper.
-- =========================================================================
create or replace function public.endorse_claim_state(
  p_topic_id text,
  p_claim_id text,
  p_state    text
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_camp  text;
begin
  if v_actor is null or not public.is_reviewer() then
    raise exception 'reviewer role required';
  end if;
  if p_state not in ('established', 'contested') then
    raise exception 'invalid endorsement state';
  end if;
  if not public.can_read_topic(p_topic_id) then
    raise exception 'topic not readable';
  end if;

  select camp_id into v_camp from public.reviewer_camps
    where topic_id = p_topic_id and reviewer_id = v_actor;
  if v_camp is null then
    raise exception 'declare your stance before endorsing (camp not set)';
  end if;

  insert into public.claim_endorsements (topic_id, claim_id, reviewer_id, state)
    values (p_topic_id, p_claim_id, v_actor, p_state)
  on conflict (topic_id, claim_id, reviewer_id) do update
    set state = excluded.state, endorsed_at = now();

  insert into public.bridge_audit (topic_id, actor_id, event_type, claim_id, detail)
    values (p_topic_id, v_actor, 'claim_endorsed', p_claim_id, 'endorsed ' || p_state);

  perform public.recompute_bridging(p_topic_id, p_claim_id);
end;
$$;

-- =========================================================================
-- 10/11. SELF reads — caller's OWN camp + endorsements only (auth.uid()-scoped).
-- =========================================================================
create or replace function public.get_my_reviewer_camp(p_topic_id text)
returns text
language sql stable security definer set search_path = public
as $$
  select camp_id from public.reviewer_camps
  where topic_id = p_topic_id and reviewer_id = auth.uid()
$$;

create or replace function public.get_my_endorsements(p_topic_id text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce((
    select jsonb_object_agg(claim_id, state)
    from public.claim_endorsements
    where topic_id = p_topic_id and reviewer_id = auth.uid()
  ), '{}'::jsonb)
$$;

-- =========================================================================
-- 12. PUBLIC AGGREGATE BRIDGING READ — identity-free, camp-free, k-anonymised.
-- =========================================================================
create or replace function public.get_claim_bridging(p_topic_id text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_floor integer := 5;   -- D15-parity public reveal floor (endorsers)
begin
  if not public.can_read_topic(p_topic_id) then
    return '[]'::jsonb;
  end if;
  return coalesce((
    with claims as (
      select distinct claim_id from public.claim_endorsements where topic_id = p_topic_id
    ),
    o as (
      select c.claim_id, b.status, b.winner_state, b.camp_count, b.endorser_total
      from claims c
      cross join lateral public.bridge_outcome(p_topic_id, c.claim_id) b
    )
    select jsonb_agg(jsonb_build_object(
      'claim_id', claim_id,
      'bridged', status in ('bridged_established','bridged_contested'),
      'bridge_status', status,
      'camp_count', case when endorser_total >= v_floor then camp_count else 0 end,
      'endorser_band', case
        when endorser_total >= 20 then '20plus'
        when endorser_total >= v_floor then '5to19'
        else 'withheld' end
    ) order by claim_id)
    from o
  ), '[]'::jsonb);
end;
$$;

-- =========================================================================
-- 13. ADDITIVE extension of the G2 read path — UNION of evaluated + endorsed
--     claims so pending/insufficient/conflicting reach the client. The 5 G2
--     fields are byte-identical for evaluated claims; evaluated_by NEVER emitted.
-- =========================================================================
create or replace function public.get_claim_evaluations(p_topic_id text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_bridge jsonb;
begin
  if not public.can_read_topic(p_topic_id) then
    return '[]'::jsonb;
  end if;
  v_bridge := public.get_claim_bridging(p_topic_id);
  return coalesce((
    with ids as (
      select claim_id from public.claim_evaluations where topic_id = p_topic_id
      union
      select distinct claim_id from public.claim_endorsements where topic_id = p_topic_id
    )
    select jsonb_agg(jsonb_build_object(
      'claim_id', i.claim_id,
      'state', ev.state,
      'rationale', coalesce(ev.rationale, ''),
      'evaluated_at', ev.evaluated_at,
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
      select bb.value from jsonb_array_elements(v_bridge) bb
      where bb.value ->> 'claim_id' = i.claim_id
    ) b on true
  ), '[]'::jsonb);
end;
$$;

-- =========================================================================
-- 14. GRANTS. NO table grant on the identity-bearing tables. recompute_bridging
--     is internal (NOT granted). Read RPCs are self-scoped or aggregate-only.
-- =========================================================================
grant execute on function public.bridge_k()                            to anon, authenticated;
grant execute on function public.bridge_min_camps()                    to anon, authenticated;
grant execute on function public.camp_of_position(text, text)          to authenticated;
grant execute on function public.set_reviewer_camp(text, text)         to authenticated;
grant execute on function public.endorse_claim_state(text, text, text) to authenticated;
grant execute on function public.get_my_reviewer_camp(text)            to authenticated;
grant execute on function public.get_my_endorsements(text)             to authenticated;
grant execute on function public.get_claim_bridging(text)              to anon, authenticated;
grant execute on function public.bridge_outcome(text, text)            to authenticated;
-- recompute_bridging is INTERNAL and WRITES: Postgres grants EXECUTE to PUBLIC by
-- default, so "not granting" is not enough — explicitly REVOKE it so only the
-- owner (the SECURITY DEFINER callers endorse_claim_state/set_reviewer_camp, which
-- run as the owner) can invoke it. Anon/authenticated cannot.
-- Supabase's default privileges grant EXECUTE to anon+authenticated explicitly,
-- so revoke from those roles (not just PUBLIC) to truly seal it.
revoke execute on function public.recompute_bridging(text, text) from public, anon, authenticated;
-- camp_of_position is identity-free + read-only; authenticated keeps it (the
-- rls_matrix calls it directly), anon has no use for it.
revoke execute on function public.camp_of_position(text, text) from public, anon;
