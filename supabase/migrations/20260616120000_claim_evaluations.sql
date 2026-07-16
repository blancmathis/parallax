-- Audited claim evaluations (G2 — the Library of Truths record). ADDITIVE ONLY.
-- A claim's epistemic state becomes a DATED, reviewer-authored, AUDITED record
-- instead of only a client-side heuristic. One current evaluation per claim
-- (revisable; never "final"). Keyed on the claim id of the current published
-- revision (Supabase/EN); under fixtures/FR the client falls back to the
-- heuristic + a matching demo. Does NOT touch published_debate_fixtures, the
-- publish/review pipeline, content RLS, or the immutability triggers.

create table public.claim_evaluations (
  topic_id     text not null references public.topics(id) on delete cascade,
  -- claim id within the current published revision. NOT a FK: claims are
  -- revision-scoped and a new revision supersedes them (re-evaluation is correct).
  -- v1 states are the three the UI renders; 'refuted' is reserved for a later UI.
  claim_id     text not null,
  state        text not null check (state in ('established', 'contested', 'values')),
  rationale    text not null default '',
  -- WHO evaluated is stored for audit but NEVER exposed by the public read RPC
  -- (the table is not granted to anon/authenticated; reads go through the
  -- SECURITY DEFINER get_claim_evaluations, which omits evaluated_by).
  evaluated_by uuid not null references auth.users(id),
  evaluated_at timestamptz not null default now(),
  is_demo      boolean not null default false,
  primary key (topic_id, claim_id)
);

alter table public.claim_evaluations enable row level security;

-- Staff-only direct select (identity-bearing); the public, identity-free read
-- path is the definer RPC below. No insert/update/delete policy => only the
-- SECURITY DEFINER evaluate_claim writes.
create policy claim_eval_select_staff on public.claim_evaluations
for select using (public.is_reviewer());

-- THE WRITE PATH: reviewer-gated, last-write (revisable), audited.
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

  insert into public.claim_evaluations (topic_id, claim_id, state, rationale, evaluated_by)
    values (p_topic_id, p_claim_id, p_state, coalesce(p_rationale, ''), v_actor)
  on conflict (topic_id, claim_id) do update
    set state = excluded.state,
        rationale = excluded.rationale,
        evaluated_by = excluded.evaluated_by,
        evaluated_at = now();

  insert into public.audit_events (
    topic_id, actor_type, actor_id, event_type, input_object_ids, summary
  )
  values (
    p_topic_id, 'admin', v_actor::text, 'claim_evaluated',
    array[p_claim_id], 'Claim evaluated as ' || p_state || '.'
  );
end;
$$;

-- THE PUBLIC READ PATH: SECURITY DEFINER so it can read past the staff-only
-- policy, but it returns ONLY the state/rationale/date (never evaluated_by) and
-- enforces topic visibility itself. Shape is a jsonb array keyed by claim_id.
create or replace function public.get_claim_evaluations(p_topic_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_read_topic(p_topic_id) then
    return '[]'::jsonb;
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'claim_id', claim_id,
      'state', state,
      'rationale', rationale,
      'evaluated_at', evaluated_at,
      'is_demo', is_demo
    ) order by claim_id)
    from public.claim_evaluations
    where topic_id = p_topic_id
  ), '[]'::jsonb);
end;
$$;

-- Grants: NO table grant (protects evaluated_by); reads/writes go through RPCs.
grant execute on function public.get_claim_evaluations(text) to anon, authenticated;
grant execute on function public.evaluate_claim(text, text, text, text) to authenticated;
