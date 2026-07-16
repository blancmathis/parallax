-- Aggregate Position Signal (D15). ADDITIVE ONLY.
-- Persists ONLY anonymous bucket counts. No per-vote rows, no user_id, no
-- identity join, no uid-derived hash in any reviewer-readable table.
-- Keyed on topic_id (the ONLY mode-stable id) + fixture-style position_id.
-- Deliberately NO FK to public.positions/debate_revisions: their ids are
-- prefixed (cp_pos_a) under EN-Supabase but raw (pos_a) under fixtures/FR;
-- an FK would (a) break supabase db reset on seed inserts and (b) make the
-- aggregate unreadable under FR. The aggregate is intentionally separate from
-- the immutable published content (red line: do NOT touch published_debate_fixtures).

-- 1. THE ONLY PERSISTED OBJECT: an anonymous distribution bucket.
create table public.position_signal_counts (
  topic_id     text not null references public.topics(id) on delete cascade,
  phase        text not null check (phase in ('before', 'after')),
  -- fixture-style position id ('pos_a'…) OR the literal '__undecided__'.
  -- NOT a FK (see header). NOT a claim id (filter 3 enforced by absence).
  position_id  text not null,
  count        bigint not null default 0 check (count >= 0),
  is_demo      boolean not null default false,
  updated_at   timestamptz not null default now(),
  primary key (topic_id, phase, position_id)
);
create index on public.position_signal_counts (topic_id, phase);

-- 2. Coarse, ACTOR-LESS anomaly counter for brigading detection.
-- Records ONLY (topic, minute) cast volume. NO actor token, NO uid, NO hash,
-- NO position — so it can never become a participation oracle. Reviewer-readable
-- is therefore safe: it reveals only "N casts on this topic this minute".
create table public.position_signal_pulse (
  topic_id     text not null references public.topics(id) on delete cascade,
  minute       timestamptz not null default date_trunc('minute', now()),
  casts        bigint not null default 0 check (casts >= 0),
  primary key (topic_id, minute)
);

alter table public.position_signal_counts enable row level security;
alter table public.position_signal_pulse  enable row level security;

-- Counts: readable by anyone who may read the (published) topic. No winner is
-- exposed here — raw counts; the public read path is the range/k-floor RPC below.
create policy possig_counts_select_visible on public.position_signal_counts
for select using (public.can_read_topic(topic_id));

-- Pulse: reviewer/admin only; actor-less so no privacy surface even if read.
create policy possig_pulse_select_staff on public.position_signal_pulse
for select using (public.is_reviewer());

-- NO insert/update/delete policy on either table => direct writes impossible for
-- anon/authenticated. The ONLY write path is the SECURITY DEFINER RPC below.

-- 3. THE WRITE PATH. SECURITY DEFINER, account-gated, rate-limited, last-write.
-- p_position_id / p_from_position are fixture-style ids ('pos_a') or null=undecided.
create or replace function public.cast_position_signal(
  p_topic_id      text,
  p_phase         text,
  p_position_id   text default null,   -- null => undecided / "it depends"
  p_from_position text default null    -- previous pick on revise (null on first cast)
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_to   text := coalesce(p_position_id, '__undecided__');
  v_from text := coalesce(p_from_position, '__undecided__');
  v_recent bigint;
begin
  -- ACCOUNT-GATE (anti-Sybil). Anonymous reads are fine; casting requires auth.
  if auth.uid() is null then
    raise exception 'authentication required to register a position signal';
  end if;
  if p_phase not in ('before', 'after') then
    raise exception 'invalid phase';
  end if;
  -- Only on a topic the caller may read (reuses existing helper; draft privacy inherited).
  if not public.can_read_topic(p_topic_id) then
    raise exception 'topic not readable';
  end if;

  -- COARSE RATE-LIMIT: cap casts per topic per minute. Actor-less by design --
  -- we accept topic-grain throttling rather than store any per-reader token.
  insert into public.position_signal_pulse (topic_id, casts)
    values (p_topic_id, 1)
  on conflict (topic_id, minute)
    do update set casts = public.position_signal_pulse.casts + 1
    returning casts into v_recent;
  if v_recent > 600 then    -- topic-wide ceiling/minute; tune w/ product (DEFERRED)
    raise exception 'signal volume ceiling reached for this debate; try again shortly';
  end if;

  -- APPLY THE DELTA atomically. Revising decrements old bucket, increments new.
  insert into public.position_signal_counts (topic_id, phase, position_id, count)
    values (p_topic_id, p_phase, v_to, 1)
  on conflict (topic_id, phase, position_id)
    do update set count = public.position_signal_counts.count + 1, updated_at = now();

  if p_from_position is not null and v_from <> v_to then
    update public.position_signal_counts
      set count = greatest(count - 1, 0), updated_at = now()
      where topic_id = p_topic_id and phase = p_phase and position_id = v_from;
  end if;
end;
$$;

-- 4. THE PUBLIC READ PATH. SECURITY INVOKER (RLS applies). Returns the shaped,
-- anonymous distribution as one jsonb row. RANGE + k-floor, never raw live counts,
-- never a winner. Ordered by position_id (stable) -- NOT by count.
create or replace function public.get_position_signal(p_topic_id text)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with raw as (
    select phase, position_id, count
    from public.position_signal_counts
    where topic_id = p_topic_id
  ),
  totals as (select phase, sum(count) as total from raw group by phase),
  -- k-anonymity: per-cell floor (count < 5 withheld) AND per-phase release gate (>=20)
  shaped as (
    select r.phase, r.position_id, r.count, t.total,
           (r.count >= 5) as cell_ok
    from raw r join totals t on t.phase = r.phase
    where t.total >= 20
  )
  select jsonb_build_object(
    'topic_id', p_topic_id,
    'is_demo', coalesce((select bool_or(is_demo) from public.position_signal_counts
                         where topic_id = p_topic_id), false),
    'released', coalesce((select min(total) from totals), 0) >= 20,
    'totals', coalesce((select jsonb_object_agg(phase, total) from totals), '{}'::jsonb),
    'confidence', case
        when coalesce((select min(total) from totals), 0) >= 500 then 'settled'
        when coalesce((select min(total) from totals), 0) >= 100 then 'forming'
        else 'emerging' end,
    'distribution', coalesce((
      select jsonb_agg(jsonb_build_object(
        'position_id', s.position_id,
        'phase', s.phase,
        'withheld', not s.cell_ok,
        -- share bucketed to nearest 5% (range, not exact); withheld cells null
        'share_lo', case when s.cell_ok
            then floor( (100.0 * s.count / nullif(s.total,0)) / 5) * 5 else null end,
        'share_hi', case when s.cell_ok
            then floor( (100.0 * s.count / nullif(s.total,0)) / 5) * 5 + 5 else null end
      ) order by s.position_id)   -- ORDER BY position_id, NEVER count: no leaderboard
      from shaped s
    ), '[]'::jsonb)
  )
$$;

-- 5. GRANTS (mirror existing grant-block style).
grant select  on public.position_signal_counts to anon, authenticated;
grant execute on function public.get_position_signal(text) to anon, authenticated;
grant execute on function public.cast_position_signal(text, text, text, text) to authenticated;
-- position_signal_pulse: NO grant to anon/authenticated; reviewer reads via RLS only.
