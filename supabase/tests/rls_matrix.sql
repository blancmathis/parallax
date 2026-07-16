\set ON_ERROR_STOP on

begin;

create or replace function pg_temp.expect_error(statement text)
returns void
language plpgsql
as $$
begin
  execute statement;
  raise exception 'expected statement to fail: %', statement;
exception
  when others then
    if sqlerrm like 'expected statement to fail:%' then
      raise;
    end if;
end;
$$;

create or replace function pg_temp.assert_true(name text, ok boolean)
returns void
language plpgsql
as $$
begin
  if not ok then
    raise exception 'assertion failed: %', name;
  end if;
end;
$$;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.assert_true(
  'anon reads only published topics',
  (select count(*) >= 1 and bool_and(status = 'published') from public.topics)
);
select pg_temp.assert_true(
  'anon sees no draft revisions',
  not exists (select 1 from public.debate_revisions where status = 'draft')
);
select pg_temp.expect_error($$
  insert into public.contributions (topic_id, type, body, created_by)
  values ('topic_congestion_pricing', 'new_claim', 'anon write must fail', '00000000-0000-0000-0000-000000000101')
$$);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select public.create_seed_packet(
  'Should normal users be able to create draft seed packets?',
  'Yes, as drafts only.',
  array['Normal users can create draft contribution data.'],
  '[]'::jsonb
);
insert into public.contributions (topic_id, type, body, created_by)
values (
  'topic_congestion_pricing',
  'new_claim',
  'Normal user contribution allowed as submitted draft.',
  '00000000-0000-0000-0000-000000000101'
);
select pg_temp.expect_error($$select public.review_revision('rev_draft_demo_1', 'approve', 'normal user must fail')$$);
select pg_temp.expect_error($$select public.publish_revision('rev_draft_demo_1')$$);
select pg_temp.expect_error($$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000101'$$);
update public.claims set text = 'mutated' where id = 'cp_c1';
select pg_temp.assert_true(
  'normal user cannot mutate published claim',
  (select text <> 'mutated' from public.claims where id = 'cp_c1')
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
select public.review_revision('rev_draft_demo_1', 'approve', 'Reviewer approves draft for RLS matrix.');
select pg_temp.expect_error($$select public.publish_revision('rev_draft_demo_1')$$);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);
select pg_temp.assert_true('admin role detected', public.is_admin());
select public.publish_revision('rev_draft_demo_1');

-- ————— Position signal (D15) —————
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

-- (a) anon CANNOT write the counts table directly (no insert policy)
select pg_temp.expect_error($$
  insert into public.position_signal_counts (topic_id, phase, position_id, count)
  values ('topic_congestion_pricing', 'before', 'pos_a', 1)
$$);
-- (b) anon cast is account-gated
select pg_temp.expect_error($$
  select public.cast_position_signal('topic_congestion_pricing', 'before', 'pos_a')
$$);
-- (c) anon read of empty signal is safe (no error, not released)
select pg_temp.assert_true(
  'anon reads unreleased signal without error',
  (select (public.get_position_signal('topic_congestion_pricing') ->> 'released') = 'false')
);
-- (d) anon cannot read the staff-only pulse table
select pg_temp.assert_true(
  'anon sees no pulse rows', not exists (select 1 from public.position_signal_pulse)
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
-- (e) authed cast succeeds; first cast => bucket count 1
select public.cast_position_signal('topic_congestion_pricing', 'before', 'pos_a');
select pg_temp.assert_true(
  'first cast increments bucket to 1',
  (select count = 1 from public.position_signal_counts
   where topic_id='topic_congestion_pricing' and phase='before' and position_id='pos_a')
);
-- (f) revise: decrement old + increment new, count conserved
select public.cast_position_signal('topic_congestion_pricing', 'before', 'pos_b', 'pos_a');
select pg_temp.assert_true(
  'revise moves the count (old=0,new=1)',
  (select coalesce((select count from public.position_signal_counts
     where topic_id='topic_congestion_pricing' and phase='before' and position_id='pos_a'),0) = 0)
  and (select count = 1 from public.position_signal_counts
     where topic_id='topic_congestion_pricing' and phase='before' and position_id='pos_b')
);
-- (g) THE RED LINE: no per-actor/individual row exists; assert no identity column.
select pg_temp.assert_true(
  'counts table has no identity column',
  not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='position_signal_counts'
      and column_name in ('user_id','voter','reader_key','choice_hash','actor','created_by')
  )
);
-- (h) authed non-reviewer cannot read pulse (RLS)
select pg_temp.assert_true(
  'normal user sees no pulse rows', not exists (select 1 from public.position_signal_pulse)
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
-- (i) reviewer sees pulse VOLUME, but it carries no actor/position — cannot
-- confirm whether user ...101 voted, nor for which position (oracle eliminated).
select pg_temp.assert_true(
  'reviewer sees actor-less pulse only',
  (select count(*) >= 1 from public.position_signal_pulse
   where topic_id='topic_congestion_pricing')
  and not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='position_signal_pulse'
      and column_name not in ('topic_id','minute','casts'))
);

-- ————— Claim evaluations (G2 / Library of Truths) —————
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
-- (a) anon sees ZERO rows of the identity-bearing table (RLS staff-only blocks)
select pg_temp.assert_true(
  'anon sees no claim_evaluations rows directly',
  not exists (select 1 from public.claim_evaluations)
);
-- (b) anon cannot evaluate (account-gated + reviewer)
select pg_temp.expect_error($$
  select public.evaluate_claim('topic_congestion_pricing', 'cp_c1', 'established')
$$);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
-- (c) a normal authed user cannot evaluate (reviewer required)
select pg_temp.expect_error($$
  select public.evaluate_claim('topic_congestion_pricing', 'cp_c1', 'established')
$$);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
-- (d) reviewer can evaluate; record stored
select public.evaluate_claim('topic_congestion_pricing', 'cp_c1', 'established', 'Survived cross-camp review.');
select pg_temp.assert_true(
  'reviewer evaluation stored',
  (select state = 'established' from public.claim_evaluations
   where topic_id='topic_congestion_pricing' and claim_id='cp_c1')
);
-- (e) invalid state rejected
select pg_temp.expect_error($$
  select public.evaluate_claim('topic_congestion_pricing', 'cp_c1', 'winner')
$$);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
-- (f) anon reads the evaluation via the public RPC...
select pg_temp.assert_true(
  'anon reads evaluation via rpc',
  (public.get_claim_evaluations('topic_congestion_pricing')::text like '%established%')
);
-- (g) THE RED LINE: the public read NEVER exposes who evaluated (evaluated_by)
select pg_temp.assert_true(
  'public read omits evaluator identity',
  position('evaluated_by' in public.get_claim_evaluations('topic_congestion_pricing')::text) = 0
);
-- (h) ...and STILL sees zero rows of the identity-bearing table directly, even
-- though a row now exists (RLS blocks => evaluated_by never reaches anon)
select pg_temp.assert_true(
  'anon still sees no identity rows after a real evaluation',
  not exists (select 1 from public.claim_evaluations)
);

-- ═══════════════ BRIDGING (cross-camp consensus gate) ═══════════════
-- Seed: cp_pos_a (sort_order 1 -> pos_a), cp_pos_b (sort_order 2 -> pos_b); claims cp_c1, cp_c2.

-- (b) anon cannot endorse / declare / write / read identity tables / recompute
reset role; set local role anon; select set_config('request.jwt.claim.sub','',true);
select pg_temp.expect_error($$ select public.endorse_claim_state('topic_congestion_pricing','cp_c2','established') $$);
select pg_temp.expect_error($$ select public.set_reviewer_camp('topic_congestion_pricing','cp_pos_a') $$);
select pg_temp.expect_error($$ insert into public.claim_endorsements(topic_id,claim_id,reviewer_id,state)
  values ('topic_congestion_pricing','cp_c2','00000000-0000-0000-0000-000000000102','established') $$);
select pg_temp.expect_error($$ select public.recompute_bridging('topic_congestion_pricing','cp_c2') $$);
select pg_temp.assert_true('anon sees no endorsements', not exists(select 1 from public.claim_endorsements));
select pg_temp.assert_true('anon sees no camps', not exists(select 1 from public.reviewer_camps));
select pg_temp.assert_true('anon sees no bridge_audit', not exists(select 1 from public.bridge_audit));

-- (c) normal user (101) cannot endorse/declare/recompute
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000101',true);
select pg_temp.expect_error($$ select public.set_reviewer_camp('topic_congestion_pricing','cp_pos_a') $$);
select pg_temp.expect_error($$ select public.endorse_claim_state('topic_congestion_pricing','cp_c2','established') $$);
select pg_temp.expect_error($$ select public.recompute_bridging('topic_congestion_pricing','cp_c2') $$);

-- (d) reviewer endorsing BEFORE declaring a camp RAISES (no silent undecided)
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000102',true);
select pg_temp.expect_error($$ select public.endorse_claim_state('topic_congestion_pricing','cp_c2','established') $$);

-- (e) camp resolution: published position -> ordinal; null/spoof -> __undecided__
select pg_temp.assert_true('cp_pos_a -> pos_a',
  public.set_reviewer_camp('topic_congestion_pricing','cp_pos_a') = 'pos_a');
select pg_temp.assert_true('null -> __undecided__',
  public.camp_of_position('topic_congestion_pricing', null) = '__undecided__');
select pg_temp.assert_true('raw pos_a is NOT a trusted camp (spoof rejected)',
  public.camp_of_position('topic_congestion_pricing','pos_a') = '__undecided__');

-- (f) ONE CAMP => pending, reaching BOTH read paths; no bridge row
select public.endorse_claim_state('topic_congestion_pricing','cp_c2','established');
select pg_temp.assert_true('single camp => pending in get_claim_bridging',
  public.get_claim_bridging('topic_congestion_pricing')::text like '%pending_single_camp%');
select pg_temp.assert_true('single camp => pending reaches get_claim_evaluations (union read)',
  public.get_claim_evaluations('topic_congestion_pricing')::text like '%pending_single_camp%');
select pg_temp.assert_true('single camp => no bridge row',
  not exists(select 1 from public.claim_evaluations where claim_id='cp_c2' and authored_by='bridge'));

-- (g) TWO DISTINCT CAMPS, same state => BRIDGED, reflected into claim_evaluations
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000103',true);
select public.set_reviewer_camp('topic_congestion_pricing','cp_pos_b');
select public.endorse_claim_state('topic_congestion_pricing','cp_c2','established');
select pg_temp.assert_true('two camps => bridged_established',
  public.get_claim_bridging('topic_congestion_pricing')::text like '%bridged_established%');
select pg_temp.assert_true('bridged reflected into claim_evaluations.state',
  (select state='established' from public.claim_evaluations where claim_id='cp_c2'));
select pg_temp.assert_true('bridge row is authored_by=bridge with null evaluated_by',
  (select authored_by='bridge' and evaluated_by is null
   from public.claim_evaluations where claim_id='cp_c2'));

-- (h) CAMP-FLIP COLLAPSE (live-join, no manual delete): 103 pos_b -> pos_a
select public.set_reviewer_camp('topic_congestion_pricing','cp_pos_a');
select pg_temp.assert_true('flip collapses to single camp => pending',
  public.get_claim_bridging('topic_congestion_pricing')::text like '%pending_single_camp%');
select pg_temp.assert_true('flip clears the bridge row (no manual delete)',
  not exists(select 1 from public.claim_evaluations where claim_id='cp_c2' and authored_by='bridge'));

-- (i) NON-DESTRUCTIVE: a human G2 eval is never clobbered by a bridge recompute
select public.evaluate_claim('topic_congestion_pricing','cp_c1','contested','human reason');
select public.endorse_claim_state('topic_congestion_pricing','cp_c1','established'); -- 103 pos_a
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000102',true);
select public.endorse_claim_state('topic_congestion_pricing','cp_c1','established'); -- 102 pos_a (same camp)
select pg_temp.assert_true('human eval survives bridge recompute',
  (select state='contested' and authored_by='reviewer' and rationale='human reason'
   from public.claim_evaluations where claim_id='cp_c1'));

-- (j) PRIVACY: anon payload + read RPCs leak NO auth.users uuid, camp, or audit
reset role; set local role anon; select set_config('request.jwt.claim.sub','',true);
-- The launch-hardening view (20260620120000) masks created_by/published_by to a
-- constant ('editorial') and drops the audit actor_id to actor_type for human
-- rows, so NO auth.users uuid of ANY shape may appear in the anon payload — not
-- reviewer 102 (bridging/eval only) NOR the publishing admin 103, which the base
-- view used to embed. Seed ids are slugs, so any '00000000-' is necessarily an
-- auth uuid leak. The per-claim event types must also stay absent.
select pg_temp.assert_true('anon fixtures payload embeds NO auth.users uuid at all',
  (select position('00000000-' in debate::text)=0
      and position('claim_evaluated' in debate::text)=0
      and position('claim_endorsed' in debate::text)=0
      and position('claim_bridged' in debate::text)=0
   from public.published_debate_fixtures where topic_id='topic_congestion_pricing'));
select pg_temp.assert_true('bridging read omits identity & camp',
  position('reviewer_id' in public.get_claim_bridging('topic_congestion_pricing')::text)=0
  and position('camp_id' in public.get_claim_bridging('topic_congestion_pricing')::text)=0);
select pg_temp.assert_true('eval read omits evaluator',
  position('evaluated_by' in public.get_claim_evaluations('topic_congestion_pricing')::text)=0);
select pg_temp.assert_true('anon still blind to identity tables after real activity',
  not exists(select 1 from public.claim_endorsements)
  and not exists(select 1 from public.reviewer_camps)
  and not exists(select 1 from public.bridge_audit));

-- (k) grant survival after CREATE OR REPLACE of get_claim_evaluations
select pg_temp.assert_true('anon retains execute on get_claim_evaluations',
  has_function_privilege('anon','public.get_claim_evaluations(text)','execute'));
select pg_temp.assert_true('authenticated retains execute on get_claim_evaluations',
  has_function_privilege('authenticated','public.get_claim_evaluations(text)','execute'));

-- ═══════════════ SOURCING FLOOR v1 ═══════════════
-- Runs BEFORE the D4 merge block so it reads the stable cp_rev_001 revision.
-- A real seeded congestion source url (its source_key is cited by the topic).
\set surl 'https://rosap.ntl.bts.gov/view/dot/42199'

-- Rule determinism (owner can call the REVOKEd internal fn): the pure fn IS the law.
reset role;
select pg_temp.assert_true('R1 UGC+controversial-factual => below_floor',
  (select verdict from public.source_floor_verdict('ugc','org_only','informal','none_known',
     'independent','journalistic','unverified','none', true, array['factual'], false)) = 'below_floor');
select pg_temp.assert_true('same UGC attrs, NON-controversial => meets_floor (claim-scoping is REAL)',
  (select verdict from public.source_floor_verdict('ugc','org_only','informal','none_known',
     'independent','journalistic','unverified','none', false, array['factual'], false)) = 'meets_floor');
select pg_temp.assert_true('R3 opinion on factual => attribution_required',
  (select verdict from public.source_floor_verdict('opinion','named_author','documented','none_known',
     'independent','journalistic','unknown','none', false, array['factual'], false)) = 'attribution_required');
select pg_temp.assert_true('documented_fabrication WITHOUT proof => context_required',
  (select verdict from public.source_floor_verdict('reporting','named_masthead','documented',
     'documented_fabrication','independent','journalistic','unknown','none', false, array['factual'], false))
   = 'context_required');
select pg_temp.assert_true('documented_fabrication WITH proof => below_floor',
  (select verdict from public.source_floor_verdict('reporting','named_masthead','documented',
     'documented_fabrication','independent','journalistic','unknown','none', false, array['factual'], true))
   = 'below_floor');

-- anon: RLS returns zero rows of the identity-bearing table; internal rule fn
-- sealed; public read returns an array.
set local role anon; select set_config('request.jwt.claim.sub','',true);
select pg_temp.assert_true('anon sees no source_integrity rows directly (RLS staff-only)',
  not exists (select 1 from public.source_integrity));
select pg_temp.expect_error($$ select * from public.source_floor_verdict('ugc','none','none',
  'none_known','unknown','none','unverified','none', true, array['factual'], false) $$);
select pg_temp.assert_true('anon get_source_floor returns array',
  jsonb_typeof(public.get_source_floor('topic_congestion_pricing')) = 'array');

-- normal user 101: reviewer gate blocks the write AND the internal rule fn.
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000101',true);
select pg_temp.expect_error($$ select public.assess_source_floor('topic_congestion_pricing',
  'https://rosap.ntl.bts.gov/view/dot/42199','opinion','named_author','documented','none_known',
  'independent','journalistic','unknown','none','','') $$);
select pg_temp.expect_error($$ select * from public.source_floor_verdict('ugc','none','none',
  'none_known','unknown','none','unverified','none', true, array['factual'], false) $$);

-- reviewer 102: write succeeds (attributes only), read computes + surfaces verdict.
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000102',true);
select public.assess_source_floor('topic_congestion_pricing',
  'https://rosap.ntl.bts.gov/view/dot/42199',
  'opinion','named_author','documented','none_known','independent','journalistic','unknown','none','','');
select pg_temp.assert_true('reviewer write surfaces a computed verdict via read',
  exists (select 1 from jsonb_array_elements(public.get_source_floor('topic_congestion_pricing')) e
          where e->'attributes'->>'content_genre' = 'opinion'
            and e->>'floor_verdict' is not null));
select pg_temp.assert_true('read NEVER exposes assessed_by',
  position('assessed_by' in public.get_source_floor('topic_congestion_pricing')::text) = 0);

-- PRIVACY: anon payload leaks neither reviewer 102's uuid nor the source event.
reset role; set local role anon; select set_config('request.jwt.claim.sub','',true);
select pg_temp.assert_true('anon fixtures payload leaks no source-assess identity/event',
  (select position('00000000-0000-0000-0000-000000000102' in debate::text)=0
      and position('source_assessed' in debate::text)=0
   from public.published_debate_fixtures where topic_id='topic_congestion_pricing'));
select pg_temp.assert_true('anon blind to source_integrity table',
  not exists (select 1 from public.source_integrity));

-- grant survival.
select pg_temp.assert_true('anon retains execute on get_source_floor',
  has_function_privilege('anon','public.get_source_floor(text)','execute'));
select pg_temp.assert_true('authenticated retains execute on get_source_floor',
  has_function_privilege('authenticated','public.get_source_floor(text)','execute'));

-- ═══════════════ CANONICAL CONTRIBUTION MERGE (D4) ═══════════════
-- Setup: a normal user submits a new_source on cp_c11; reviewer accepts it.
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000101',true);
insert into public.contributions (id, topic_id, type, body, title, url, target_object_id, created_by)
values ('00000000-0000-0000-0000-0000000000a1','topic_congestion_pricing','new_source',
        'A peer-reviewed cordon study.','Cordon pricing meta-analysis','https://example.org/cordon',
        'cp_c11','00000000-0000-0000-0000-000000000101');
insert into public.contributions (id, topic_id, type, body, target_object_id, created_by)
values ('00000000-0000-0000-0000-0000000000a2','topic_congestion_pricing','new_position',
        'A fourth camp.', null, '00000000-0000-0000-0000-000000000101');
insert into public.contributions (id, topic_id, type, body, title, url, target_object_id, created_by)
values ('00000000-0000-0000-0000-0000000000a3','topic_congestion_pricing','new_source',
        'targets a vanished claim.','Ghost','https://x','cp_c_does_not_exist',
        '00000000-0000-0000-0000-000000000101');

reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000102',true);
select public.review_contribution('00000000-0000-0000-0000-0000000000a1','approve','ok');
select public.review_contribution('00000000-0000-0000-0000-0000000000a2','approve','ok');
select public.review_contribution('00000000-0000-0000-0000-0000000000a3','approve','ok');
-- reviewer (non-admin) CANNOT merge (admin gate):
select pg_temp.expect_error($$select public.merge_contribution('00000000-0000-0000-0000-0000000000a1')$$);

-- anon + normal user CANNOT merge:
reset role; set local role anon; select set_config('request.jwt.claim.sub','',true);
select pg_temp.expect_error($$select public.merge_contribution('00000000-0000-0000-0000-0000000000a1')$$);
select pg_temp.assert_true('anon has no execute on merge_contribution',
  not has_function_privilege('anon','public.merge_contribution(uuid)','execute'));
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000101',true);
select pg_temp.expect_error($$select public.merge_contribution('00000000-0000-0000-0000-0000000000a1')$$);

-- ADMIN merges the new_source.
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000103',true);
select public.merge_contribution('00000000-0000-0000-0000-0000000000a1');

-- Physical-state assertions run as the session superuser (reset role): RLS hides
-- superseded-revision child rows even from admins, and we are verifying the rows
-- physically SURVIVE + clone correctly (immutability/integrity), not RLS visibility.
reset role;
-- (1) new published revision_number = 2 exists.
select pg_temp.assert_true('merge produced published revision_number=2',
  exists(select 1 from public.debate_revisions
         where topic_id='topic_congestion_pricing' and revision_number=2 and status='published'));
-- (2) cp_rev_001 superseded AND still selectable.
select pg_temp.assert_true('cp_rev_001 superseded',
  (select status='superseded' from public.debate_revisions where id='cp_rev_001'));
select pg_temp.assert_true('cp_rev_001 rows still inspectable',
  exists(select 1 from public.claims where revision_id='cp_rev_001'));
-- (3) topic points away from cp_rev_001.
select pg_temp.assert_true('topic points at new revision',
  (select published_revision_id <> 'cp_rev_001' from public.topics where id='topic_congestion_pricing'));

-- (5) the new source is in the view; NO old cp_ child id leaks.
reset role; set local role anon; select set_config('request.jwt.claim.sub','',true);
select pg_temp.assert_true('community source present in public view',
  (select debate::text like '%Cordon pricing meta-analysis%'
     from public.published_debate_fixtures where topic_id='topic_congestion_pricing'));
select pg_temp.assert_true('no superseded cp_ child id leaks into new view payload',
  (select position('cp_pos_' in debate::text)=0
      and position('cp_arg_' in debate::text)=0
      and position('cp_ev_'  in debate::text)=0
      and position('cp_val_' in debate::text)=0
      and position('cp_to_'  in debate::text)=0
     from public.published_debate_fixtures where topic_id='topic_congestion_pricing'));

-- (6) ZERO dangling refs on the NEW revision (all 7 sites), as superuser (RLS-bypassing).
reset role;
do $$
declare v_rev text := (select published_revision_id from public.topics where id='topic_congestion_pricing');
begin
  perform pg_temp.assert_true('no orphan arg.position_id',
    not exists(select 1 from public.debate_arguments a where a.revision_id=v_rev
               and not exists(select 1 from public.positions p where p.id=a.position_id and p.revision_id=v_rev)));
  perform pg_temp.assert_true('no orphan claim_ids[] element',
    not exists(select 1 from public.debate_arguments a, unnest(a.claim_ids) cid
               where a.revision_id=v_rev
               and not exists(select 1 from public.claims c where c.id=cid and c.revision_id=v_rev)));
  perform pg_temp.assert_true('no orphan evidence_links fks',
    not exists(select 1 from public.evidence_links el where el.revision_id=v_rev
      and (not exists(select 1 from public.claims c  where c.id=el.claim_id  and c.revision_id=v_rev)
        or not exists(select 1 from public.sources s where s.id=el.source_id and s.revision_id=v_rev)
        or (el.source_excerpt_id is not null
            and not exists(select 1 from public.source_excerpts x where x.id=el.source_excerpt_id and x.revision_id=v_rev)))));
  perform pg_temp.assert_true('no orphan value_positions',
    not exists(select 1 from public.value_positions vp
      join public.debate_values dv on dv.id=vp.value_id and dv.revision_id=v_rev
      where not exists(select 1 from public.positions p where p.id=vp.position_id and p.revision_id=v_rev)));
  perform pg_temp.assert_true('no orphan tradeoffs.position_id',
    not exists(select 1 from public.tradeoffs t where t.revision_id=v_rev
               and not exists(select 1 from public.positions p where p.id=t.position_id and p.revision_id=v_rev)));
  perform pg_temp.assert_true('positions count preserved',
    (select count(*) from public.positions where revision_id=v_rev)
    = (select count(*) from public.positions where revision_id='cp_rev_001'));
  perform pg_temp.assert_true('claims count preserved',
    (select count(*) from public.claims where revision_id=v_rev)
    = (select count(*) from public.claims where revision_id='cp_rev_001'));
  perform pg_temp.assert_true('value_positions count preserved',
    (select count(*) from public.value_positions vp join public.debate_values dv on dv.id=vp.value_id and dv.revision_id=v_rev)
    = (select count(*) from public.value_positions vp join public.debate_values dv on dv.id=vp.value_id and dv.revision_id='cp_rev_001'));
  perform pg_temp.assert_true('new source added (count = old+1)',
    (select count(*) from public.sources where revision_id=v_rev)
    = (select count(*) from public.sources where revision_id='cp_rev_001') + 1);
end $$;
select pg_temp.assert_true('minted ids are in the m_ namespace, disjoint from cp_',
  not exists(select 1 from public.claims c
             where c.revision_id=(select published_revision_id from public.topics where id='topic_congestion_pricing')
               and c.id like 'cp\_%'));

-- (7) objectivity record carried forward.
select pg_temp.assert_true('claim_evaluations forward-remapped onto new claims',
  exists(select 1 from public.claim_evaluations ce
         where ce.topic_id='topic_congestion_pricing'
           and ce.claim_id like 'm\_%\_clm\_%'));

-- (8) DOUBLE-MERGE blocked; stamped. Admin role so we reach the already-merged
-- guard rather than the admin gate.
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000103',true);
select pg_temp.expect_error($$select public.merge_contribution('00000000-0000-0000-0000-0000000000a1')$$);
select pg_temp.assert_true('contribution stamped merged',
  (select merged_revision_id is not null and merged_at is not null
     from public.contributions where id='00000000-0000-0000-0000-0000000000a1'));

-- (9) DEFERRED type rejected. (10) STALE target rejected.
select pg_temp.expect_error($$select public.merge_contribution('00000000-0000-0000-0000-0000000000a2')$$);
select pg_temp.expect_error($$select public.merge_contribution('00000000-0000-0000-0000-0000000000a3')$$);

-- (11) max+1-under-lock proof: a SECOND real merge yields revision_number=3. The
-- first merge re-minted claim ids, so target a claim in the CURRENT published
-- revision (resolved dynamically), not the now-superseded cp_c1.
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000101',true);
insert into public.contributions (id, topic_id, type, body, title, url, created_by)
values ('00000000-0000-0000-0000-0000000000a4','topic_congestion_pricing','new_source',
        'Second study.','Travel-time elasticities','https://example.org/elast',
        '00000000-0000-0000-0000-000000000101');
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000102',true);
select public.review_contribution('00000000-0000-0000-0000-0000000000a4','approve','ok');
-- point it at a claim in the CURRENT published revision (superuser bypasses RLS)
reset role;
update public.contributions set target_object_id =
  (select id from public.claims
   where revision_id=(select published_revision_id from public.topics where id='topic_congestion_pricing')
   order by sort_order limit 1)
  where id='00000000-0000-0000-0000-0000000000a4';
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000103',true);
select public.merge_contribution('00000000-0000-0000-0000-0000000000a4');
select pg_temp.assert_true('second merge yields revision_number=3 (max+1, not R_old+1)',
  exists(select 1 from public.debate_revisions
         where topic_id='topic_congestion_pricing' and revision_number=3 and status='published'));

reset role;
rollback;
