-- ============================================================================
-- CANONICAL CONTRIBUTION MERGE. ADDITIVE ONLY. Closes the contribution loop
-- (docs/02 D4): an ACCEPTED contribution becomes an immutable, dated PUBLISHED
-- revision by CLONING the topic's current published revision into a fresh DRAFT
-- (revision_number = max+1, computed under a topic FOR UPDATE lock), remapping
-- every internal reference to freshly-minted ids, APPLYING the contribution,
-- then reusing review_revision('approve') + publish_revision to swing the
-- canonical read path. Past revisions stay inspectable (publish_revision marks
-- the prior one 'superseded'; rows are never deleted or mutated).
--
-- DOES NOT TOUCH: auth/RLS/roles, publish_revision/review_revision, the
-- immutability triggers, published_debate_fixtures, D15 signal. Gate is ADMIN
-- only (aligned with publish_revision's is_admin() — D8: a reviewer ACCEPTS a
-- contribution, an ADMIN merges/publishes it).
--
-- COLLISION-FREE IDS ARE A CORRECTNESS REQUIREMENT: the view resolves
-- value_positions / tradeoffs.position_id / evidence_links.* / arg->claim joins
-- revision-GLOBALLY, and R_old's rows survive as 'superseded'. Any minted id
-- aliasing an existing id would leak old rows into the new revision's view
-- output. Every minted id lives in the disjoint namespace m_<uuid12>_<table>_<n>
-- / rev_<uuid12>_r<n> (a UUID-derived 12-hex prefix, never derived from old id).
--
-- INTEGRITY: every element-wise / junction remap is COUNT-PRESERVING — a LEFT
-- join + raise-on-NULL aborts the whole transaction on any unresolved ref.
--
-- v1 APPLY: new_source, new_claim, challenge_evidence_label. DEFERRED (cloned,
-- but APPLY raises — reject-and-rollback): new_position, challenge_steelman,
-- value_tradeoff_correction.
--
-- claim_evaluations (G2) + bridging endorsements keyed on (topic_id, claim_id)
-- are FORWARD-REMAPPED through the claim map so the public objectivity badges
-- survive a merge. bridge-authored rows are skipped (recompute_bridging
-- re-derives them from the remapped endorsements on the next organic call).
--
-- LIMITATIONS (honest): single-flight per topic via the topic FOR UPDATE lock;
-- no 3-way merge / no rebase; new_claim against a position with no 'supports'
-- argument lands UNWIRED (inspectable, no dangling ref).
-- ============================================================================

-- ---- 0. Additive columns: idempotency guard + overlay-suppression key -------
alter table public.contributions
  add column if not exists merged_revision_id text
    references public.debate_revisions(id) on delete set null;
alter table public.contributions
  add column if not exists merged_at timestamptz;

-- Tiny helper: turn a silent claim_ids[] element drop into a hard error.
create or replace function public.raise_dangling(p_arg text, p_claim text)
returns text language plpgsql as $$
begin
  raise exception 'dangling claim_ids ref: argument % references claim % not in clone', p_arg, p_claim;
end;
$$;

-- ---- 1. The RPC ------------------------------------------------------------
create or replace function public.merge_contribution(p_contribution_id uuid)
returns text                       -- returns the published slug (deep-linkable)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor    uuid := auth.uid();
  v_c        public.contributions%rowtype;
  v_old_rev  text;
  v_new_rev  text;
  v_new_num  integer;
  v_prefix   text;
  v_target   text;
  v_old_cnt  integer;
  v_new_cnt  integer;
  v_slug     text;
begin
  -- (A) GATE — admin only.
  if v_actor is null or not public.is_admin() then
    raise exception 'admin role required';
  end if;

  -- (B) LOAD + LOCK the contribution.
  select * into v_c from public.contributions
    where id = p_contribution_id for update;
  if not found then raise exception 'contribution not found'; end if;
  if v_c.status <> 'accepted' then
    raise exception 'only accepted contributions can be merged (status=%)', v_c.status;
  end if;
  if v_c.merged_revision_id is not null then
    raise exception 'contribution already merged into revision %', v_c.merged_revision_id;
  end if;

  -- (C) ENFORCE the v1 subset BEFORE any clone.
  if v_c.type not in ('new_source','new_claim','challenge_evidence_label') then
    raise exception
      'contribution type % is accepted but not yet auto-mergeable (deferred in merge v1)', v_c.type
      using hint = 'Supported v1 types: new_source, new_claim, challenge_evidence_label.';
  end if;

  -- (D) LOCK the topic, read its current published revision.
  select published_revision_id into v_old_rev
    from public.topics where id = v_c.topic_id for update;
  if v_old_rev is null then
    raise exception 'topic % has no published revision to clone', v_c.topic_id;
  end if;

  -- (E) PRE-FLIGHT stale-target guard.
  if v_c.target_object_id is not null then
    if v_c.type = 'new_source' then
      if not exists (select 1 from public.claims
                     where id = v_c.target_object_id and revision_id = v_old_rev) then
        raise exception 'stale target: claim % not in current published revision', v_c.target_object_id;
      end if;
    elsif v_c.type = 'new_claim' then
      if not exists (select 1 from public.positions
                     where id = v_c.target_object_id and revision_id = v_old_rev) then
        raise exception 'stale target: position % not in current published revision', v_c.target_object_id;
      end if;
    elsif v_c.type = 'challenge_evidence_label' then
      if not exists (select 1 from public.evidence_links
                     where id = v_c.target_object_id and revision_id = v_old_rev) then
        raise exception 'stale target: evidence_link % not in current published revision', v_c.target_object_id;
      end if;
    end if;
  end if;
  if v_c.type = 'challenge_evidence_label' and v_c.proposed_label is null then
    raise exception 'challenge_evidence_label requires a proposed_label';
  end if;

  -- (F) NEXT revision_number UNDER the topic lock (max+1).
  select coalesce(max(revision_number), 0) + 1 into v_new_num
    from public.debate_revisions where topic_id = v_c.topic_id;

  -- (G) DISJOINT id namespace.
  v_prefix  := left(replace(extensions.gen_random_uuid()::text, '-', ''), 12);
  v_new_rev := 'rev_' || v_prefix || '_r' || v_new_num;

  insert into public.debate_revisions
    (id, topic_id, revision_number, status, review_status, generated_by, created_by)
  values
    (v_new_rev, v_c.topic_id, v_new_num, 'draft', 'unreviewed', 'mixed', v_actor);

  -- (H) DETERMINISTIC temp id-maps (drop-if-exists for the single-tx harness).
  drop table if exists _mp, _mc, _ms, _mx, _mv, _me;
  create temp table _mp (old text primary key, new text not null);
  create temp table _mc (old text primary key, new text not null);
  create temp table _ms (old text primary key, new text not null);
  create temp table _mx (old text primary key, new text not null);
  create temp table _mv (old text primary key, new text not null);
  create temp table _me (old text primary key, new text not null);

  -- positions ----------------------------------------------------------------
  with src as (
    select p.*, 'm_'||v_prefix||'_pos_'||row_number() over (order by p.sort_order, p.id) as nid
      from public.positions p where p.revision_id = v_old_rev
  ), ins as (
    insert into public.positions
      (id, revision_id, topic_id, title, short_summary, steelman, status,
       generated_by, review_status, sort_order)
    select nid, v_new_rev, topic_id, title, short_summary, steelman,
           'draft', generated_by, 'unreviewed', sort_order
      from src returning 1
  )
  insert into _mp(old, new) select id, nid from src;

  -- claims -------------------------------------------------------------------
  with src as (
    select c.*, 'm_'||v_prefix||'_clm_'||row_number() over (order by c.sort_order, c.id) as nid
      from public.claims c where c.revision_id = v_old_rev
  ), ins as (
    insert into public.claims
      (id, revision_id, topic_id, text, claim_type, generated_by, review_status, sort_order)
    select nid, v_new_rev, topic_id, text, claim_type, generated_by, 'unreviewed', sort_order
      from src returning 1
  )
  insert into _mc(old, new) select id, nid from src;

  -- sources ------------------------------------------------------------------
  with src as (
    select s.*, 'm_'||v_prefix||'_src_'||row_number() over (order by s.sort_order, s.id) as nid
      from public.sources s where s.revision_id = v_old_rev
  ), ins as (
    insert into public.sources
      (id, revision_id, topic_id, url, title, publisher, source_type,
       retrieval_status, retrieved_at, quality_notes, content_hash, sort_order)
    select nid, v_new_rev, topic_id, url, title, publisher, source_type,
           retrieval_status, retrieved_at, quality_notes, content_hash, sort_order
      from src returning 1
  )
  insert into _ms(old, new) select id, nid from src;

  -- source_excerpts (remap source_id via _ms) --------------------------------
  with src as (
    select e.*, 'm_'||v_prefix||'_exc_'||row_number() over (order by e.id) as nid
      from public.source_excerpts e where e.revision_id = v_old_rev
  ), ins as (
    insert into public.source_excerpts
      (id, revision_id, source_id, text, locator, extracted_by, created_at)
    select s.nid, v_new_rev, ms.new, s.text, s.locator, s.extracted_by, s.created_at
      from src s
      left join _ms ms on ms.old = s.source_id
     where (s.source_id is null) = (ms.new is null)
    returning 1
  )
  insert into _mx(old, new) select id, nid from src;
  select count(*) into v_old_cnt from public.source_excerpts where revision_id = v_old_rev;
  select count(*) into v_new_cnt from public.source_excerpts where revision_id = v_new_rev;
  if v_old_cnt <> v_new_cnt then
    raise exception 'excerpt clone lost rows (% -> %): unresolved source_id', v_old_cnt, v_new_cnt;
  end if;

  -- debate_values ------------------------------------------------------------
  with src as (
    select v.*, 'm_'||v_prefix||'_val_'||row_number() over (order by v.sort_order, v.id) as nid
      from public.debate_values v where v.revision_id = v_old_rev
  ), ins as (
    insert into public.debate_values
      (id, revision_id, topic_id, name, description, tension_with, sort_order)
    select nid, v_new_rev, topic_id, name, description, tension_with, sort_order
      from src returning 1
  )
  insert into _mv(old, new) select id, nid from src;

  -- debate_arguments: remap position_id + claim_ids[] element-wise -----------
  insert into public.debate_arguments
    (id, revision_id, position_id, direction, summary, claim_ids,
     generated_by, review_status, sort_order)
  select 'm_'||v_prefix||'_arg_'||row_number() over (order by a.sort_order, a.id),
         v_new_rev, mp.new, a.direction, a.summary,
         (select coalesce(array_agg(
                    case when mc.new is null
                         then public.raise_dangling(a.id, u.cid) else mc.new end
                    order by u.ord), '{}'::text[])
            from unnest(a.claim_ids) with ordinality as u(cid, ord)
            left join _mc mc on mc.old = u.cid),
         a.generated_by, 'unreviewed', a.sort_order
    from public.debate_arguments a
    join _mp mp on mp.old = a.position_id
   where a.revision_id = v_old_rev;

  -- evidence_links: remap claim_id, source_id (NOT NULL) + source_excerpt_id --
  with src as (
    select el.*,
           'm_'||v_prefix||'_ev_'||row_number() over (order by el.sort_order, el.id) as nid
      from public.evidence_links el where el.revision_id = v_old_rev
  ), ins as (
    insert into public.evidence_links
      (id, revision_id, claim_id, source_id, source_excerpt_id, label, rationale,
       confidence, review_status, sort_order)
    select s.nid, v_new_rev, mc.new, ms.new, mx.new, s.label, s.rationale,
           s.confidence, 'unreviewed', s.sort_order
      from src s
      join      _mc mc on mc.old = s.claim_id
      join      _ms ms on ms.old = s.source_id
      left join _mx mx on mx.old = s.source_excerpt_id
    returning 1
  )
  insert into _me(old, new) select id, nid from src;
  select count(*) into v_old_cnt from public.evidence_links where revision_id = v_old_rev;
  select count(*) into v_new_cnt from public.evidence_links where revision_id = v_new_rev;
  if v_old_cnt <> v_new_cnt then
    raise exception 'evidence_link clone lost rows (% -> %): unresolved claim/source ref', v_old_cnt, v_new_cnt;
  end if;
  if (select count(*) from public.evidence_links where revision_id = v_old_rev and source_excerpt_id is not null)
     <> (select count(*) from public.evidence_links where revision_id = v_new_rev and source_excerpt_id is not null) then
    raise exception 'evidence_link excerpt null-preservation broke';
  end if;

  -- value_positions: junction, remap BOTH columns, count-preserving ----------
  insert into public.value_positions (value_id, position_id)
  select mv.new, mp.new
    from public.value_positions vp
    join public.debate_values dv on dv.id = vp.value_id  and dv.revision_id = v_old_rev
    join public.positions     pp on pp.id = vp.position_id and pp.revision_id = v_old_rev
    join _mv mv on mv.old = vp.value_id
    join _mp mp on mp.old = vp.position_id;
  select count(*) into v_old_cnt
    from public.value_positions vp
    join public.debate_values dv on dv.id = vp.value_id and dv.revision_id = v_old_rev
    join public.positions pp on pp.id = vp.position_id and pp.revision_id = v_old_rev;
  select count(*) into v_new_cnt
    from public.value_positions vp
    join public.debate_values dv on dv.id = vp.value_id and dv.revision_id = v_new_rev;
  if v_old_cnt <> v_new_cnt then
    raise exception 'value_positions clone lost rows (% -> %)', v_old_cnt, v_new_cnt;
  end if;

  -- tradeoffs: remap position_id ---------------------------------------------
  insert into public.tradeoffs
    (id, revision_id, topic_id, position_id, gain, cost, risk, review_status)
  select 'm_'||v_prefix||'_to_'||row_number() over (order by t.id),
         v_new_rev, t.topic_id, mp.new, t.gain, t.cost, t.risk, 'unreviewed'
    from public.tradeoffs t
    join _mp mp on mp.old = t.position_id
   where t.revision_id = v_old_rev;

  -- (I) FORWARD-REMAP the objectivity record so badges survive the merge.
  insert into public.claim_evaluations
    (topic_id, claim_id, state, rationale, evaluated_by, evaluated_at, is_demo)
  select ce.topic_id, mc.new, ce.state, ce.rationale, ce.evaluated_by, ce.evaluated_at, ce.is_demo
    from public.claim_evaluations ce
    join _mc mc on mc.old = ce.claim_id
   where ce.topic_id = v_c.topic_id
     and coalesce(ce.authored_by, 'reviewer') <> 'bridge'
  on conflict (topic_id, claim_id) do nothing;

  insert into public.claim_endorsements (topic_id, claim_id, reviewer_id, state)
  select en.topic_id, mc.new, en.reviewer_id, en.state
    from public.claim_endorsements en
    join _mc mc on mc.old = en.claim_id
   where en.topic_id = v_c.topic_id
  on conflict do nothing;

  -- (J) APPLY the contribution onto the DRAFT.
  if v_c.type = 'new_source' then
    insert into public.sources
      (id, revision_id, topic_id, url, title, publisher, source_type,
       retrieval_status, retrieved_at, quality_notes, sort_order)
    values
      ('m_'||v_prefix||'_apply_src', v_new_rev, v_c.topic_id,
       coalesce(v_c.url, ''),
       coalesce(nullif(v_c.title, ''), 'Community-submitted source'),
       'Community contributor', 'other', 'partial', null,
       'Community-submitted; alignment not yet labeled.',
       (select coalesce(max(sort_order),0)+1 from public.sources where revision_id = v_new_rev));

    select new into v_target from _mc where old = v_c.target_object_id;
    if v_target is null then raise exception 'new_source target claim % unresolved', v_c.target_object_id; end if;
    insert into public.evidence_links
      (id, revision_id, claim_id, source_id, source_excerpt_id, label, rationale,
       confidence, review_status, sort_order)
    values
      ('m_'||v_prefix||'_apply_ev', v_new_rev, v_target, 'm_'||v_prefix||'_apply_src',
       null, 'unclear',
       coalesce(nullif(v_c.body,''),'Community-submitted source awaiting alignment labeling.'),
       0.50, 'unreviewed',
       (select coalesce(max(sort_order),0)+1 from public.evidence_links where revision_id = v_new_rev));

  elsif v_c.type = 'new_claim' then
    insert into public.claims
      (id, revision_id, topic_id, text, claim_type, generated_by, review_status, sort_order)
    values
      ('m_'||v_prefix||'_apply_clm', v_new_rev, v_c.topic_id, v_c.body,
       case when v_c.body ~* '\m(should|must|ought)\M' then array['normative'] else array['factual'] end,
       'human', 'unreviewed',
       (select coalesce(max(sort_order),0)+1 from public.claims where revision_id = v_new_rev));

    if v_c.target_object_id is not null then
      select new into v_target from _mp where old = v_c.target_object_id;
      update public.debate_arguments
        set claim_ids = claim_ids || array['m_'||v_prefix||'_apply_clm']
        where revision_id = v_new_rev and position_id = v_target and direction = 'supports'
          and id = (select id from public.debate_arguments
                     where revision_id = v_new_rev and position_id = v_target and direction = 'supports'
                     order by sort_order limit 1);
    end if;

  elsif v_c.type = 'challenge_evidence_label' then
    select new into v_target from _me where old = v_c.target_object_id;
    if v_target is null then raise exception 'challenge target link % unresolved', v_c.target_object_id; end if;
    update public.evidence_links
      set label = v_c.proposed_label,
          rationale = rationale || E'\n— Community label challenge: ' ||
                      coalesce(nullif(v_c.body,''),'(no rationale supplied)')
      where id = v_target and revision_id = v_new_rev;
  end if;

  -- (K) STAMP + AUDIT.
  update public.contributions
    set merged_revision_id = v_new_rev, merged_at = now()
    where id = p_contribution_id;

  insert into public.audit_events
    (topic_id, revision_id, actor_type, actor_id, event_type, input_object_ids, output_object_ids, summary)
  values
    (v_c.topic_id, v_new_rev, 'admin', v_actor::text, 'contribution_merged',
     array[p_contribution_id::text, v_old_rev], array[v_new_rev],
     'Accepted contribution merged into a new canonical revision (clone+apply).');

  -- (L) REUSE the pipeline, unchanged.
  perform public.review_revision(
    v_new_rev, 'approve',
    'Auto-approved: mechanically cloned from approved revision '||v_old_rev||
    ' plus reviewer-accepted contribution '||p_contribution_id::text||'.');
  v_slug := public.publish_revision(v_new_rev);

  return v_slug;
end;
$$;

-- ---- GRANTS + the bridging-pattern REVOKE (defense in depth) ----------------
grant execute on function public.merge_contribution(uuid) to authenticated;
revoke execute on function public.merge_contribution(uuid) from public, anon;
revoke execute on function public.raise_dangling(text, text) from public, anon, authenticated;
