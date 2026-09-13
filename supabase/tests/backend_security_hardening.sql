\set ON_ERROR_STOP on

begin;

create or replace function pg_temp.assert_true(p_name text, p_ok boolean)
returns void
language plpgsql
as $$
begin
  if p_ok is distinct from true then
    raise exception 'assertion failed: %', p_name;
  end if;
end;
$$;

create or replace function pg_temp.expect_sqlstate(
  p_statement text,
  p_expected_sqlstate text
)
returns void
language plpgsql
as $$
declare
  v_sqlstate text;
begin
  begin
    execute p_statement;
  exception
    when others then
      get stacked diagnostics v_sqlstate = returned_sqlstate;
      if v_sqlstate = p_expected_sqlstate then
        return;
      end if;
      raise exception 'expected SQLSTATE %, got % for: %',
        p_expected_sqlstate, v_sqlstate, p_statement;
  end;
  raise exception 'expected SQLSTATE %, statement succeeded: %',
    p_expected_sqlstate, p_statement;
end;
$$;

-- This is intentionally the first regression assertion: before the hardening
-- migration it is RED because PostgreSQL/Supabase grants function execution to
-- PUBLIC and the historical migration also granted it to authenticated.
select pg_temp.assert_true(
  'unfenced privileged AI completion signature is removed',
  to_regprocedure(
    'public.complete_mock_ai_job(uuid,uuid,jsonb,text)'
  ) is null
);

select pg_temp.assert_true(
  'fenced AI completion is not executable by API roles',
  not has_function_privilege(
    'anon',
    'public.complete_mock_ai_job(uuid,uuid,uuid,jsonb,text)',
    'execute'
  )
  and not has_function_privilege(
    'authenticated',
    'public.complete_mock_ai_job(uuid,uuid,uuid,jsonb,text)',
    'execute'
  )
);
select pg_temp.assert_true(
  'trusted AI completion is executable by service_role',
  has_function_privilege(
    'service_role',
    'public.complete_mock_ai_job(uuid,uuid,uuid,jsonb,text)',
    'execute'
  )
);
select pg_temp.assert_true(
  'AI claim is service-only',
  not has_function_privilege(
    'anon', 'public.claim_ai_job(uuid,uuid,uuid,integer)', 'execute'
  )
  and not has_function_privilege(
    'authenticated', 'public.claim_ai_job(uuid,uuid,uuid,integer)', 'execute'
  )
  and has_function_privilege(
    'service_role', 'public.claim_ai_job(uuid,uuid,uuid,integer)', 'execute'
  )
);
select pg_temp.assert_true(
  'exact bridge outcome is internal',
  not has_function_privilege(
    'authenticated', 'public.bridge_outcome(text,text)', 'execute'
  )
);
select pg_temp.assert_true(
  'camp resolver is internal',
  not has_function_privilege(
    'authenticated', 'public.camp_of_position(text,text)', 'execute'
  )
);
select pg_temp.assert_true(
  'raw audit is closed',
  not has_table_privilege('anon', 'public.audit_events', 'select')
  and not has_table_privilege('authenticated', 'public.audit_events', 'select')
);
select pg_temp.assert_true(
  'raw position tables are closed',
  not has_table_privilege('anon', 'public.position_signal_counts', 'select')
  and not has_table_privilege('authenticated', 'public.position_signal_counts', 'select')
  and not has_table_privilege('authenticated', 'public.position_signal_ballots', 'select')
);
select pg_temp.assert_true(
  'attempt tokens and account quota state are private',
  not has_schema_privilege('anon', 'private', 'usage')
  and not has_schema_privilege('authenticated', 'private', 'usage')
  and not has_schema_privilege('service_role', 'private', 'usage')
  and not has_table_privilege(
    'authenticated', 'private.ai_analysis_attempts', 'select'
  )
  and not has_table_privilege(
    'service_role', 'private.account_quota_windows', 'select'
  )
);
select pg_temp.assert_true(
  'actor UUID columns are not selectable by API roles',
  not has_column_privilege('anon', 'public.topics', 'created_by', 'select')
  and not has_column_privilege('authenticated', 'public.debate_revisions', 'created_by', 'select')
  and not has_column_privilege('authenticated', 'public.debate_revisions', 'published_by', 'select')
);
select pg_temp.assert_true(
  'private source notes are not selectable by API roles',
  not has_column_privilege('anon', 'public.sources', 'quality_notes', 'select')
  and not has_column_privilege('authenticated', 'public.sources', 'quality_notes', 'select')
);

-- Source identity v2 keeps every potentially semantic distinction.
select pg_temp.assert_true(
  'source key normalizes only scheme host and tracking parameters',
  public.source_key(
    '  HTTPS://Example.COM/Path?utm_source=x&A=One&fbclid=z#Frag  '
  ) = 'https://example.com/Path?A=One#Frag'
);
select pg_temp.assert_true(
  'source key preserves scheme path query fragment and trailing slash',
  public.source_key('http://example.com/Path?A=One#Frag')
    <> public.source_key('https://example.com/Path?A=One#Frag')
  and public.source_key('https://example.com/Path?A=One#Frag')
    <> public.source_key('https://example.com/path?A=One#Frag')
  and public.source_key('https://example.com/Path?A=One#Frag')
    <> public.source_key('https://example.com/Path?A=one#Frag')
  and public.source_key('https://example.com/Path?A=One#Frag')
    <> public.source_key('https://example.com/Path?A=One#frag')
  and public.source_key('https://example.com/Path/')
    <> public.source_key('https://example.com/Path')
);
select pg_temp.assert_true(
  'new public URLs reject credentials unsafe ports and secret query keys',
  public.is_safe_public_url('https://example.com:443/Path?view=full#Frag')
  and not public.is_safe_public_url('https://user:password@example.com/Path')
  and not public.is_safe_public_url('https://example.com:8443/Path')
  and not public.is_safe_public_url('https://example.com/Path?access_token=secret')
  and not public.is_safe_public_url('https://example.com/Path?api%5Fkey=secret')
);
select pg_temp.assert_true(
  'URL safety parser is a read-only public validator',
  has_function_privilege(
    'anon', 'public.is_safe_public_url(text)', 'execute'
  )
  and has_function_privilege(
    'authenticated', 'public.is_safe_public_url(text)', 'execute'
  )
);

-- Contributions may be submitted directly, but only the review RPC can decide.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101',
  true
);
select pg_temp.expect_sqlstate(
  $$insert into public.contributions (
    topic_id, type, body, title, url, created_by
  ) values (
    'topic_congestion_pricing', 'new_source', 'Unsafe credential URL.',
    'Unsafe', 'https://user:secret@example.com/source',
    '00000000-0000-0000-0000-000000000101'
  )$$,
  '23514'
);
insert into public.contributions (
  id, topic_id, type, body, created_by
) values (
  '00000000-0000-0000-0000-0000000000b1',
  'topic_congestion_pricing',
  'new_claim',
  'A reviewable contribution.',
  '00000000-0000-0000-0000-000000000101'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000102',
  true
);
select pg_temp.expect_sqlstate(
  $$update public.contributions
    set status = 'accepted', body = 'silent rewrite'
    where id = '00000000-0000-0000-0000-0000000000b1'$$,
  '42501'
);
select pg_temp.expect_sqlstate(
  $$select public.review_contribution(
    '00000000-0000-0000-0000-0000000000b1', 'approve', ''
  )$$,
  '22023'
);
select public.review_contribution(
  '00000000-0000-0000-0000-0000000000b1',
  'approve',
  'The contribution is precise enough for canonical merge review.'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101',
  true
);
select pg_temp.assert_true(
  'author reads decision and rationale without reviewer identity',
  public.get_my_contribution_decisions('topic_congestion_pricing')::text
    like '%precise enough for canonical merge review%'
  and position(
    'reviewed_by' in
    public.get_my_contribution_decisions('topic_congestion_pricing')::text
  ) = 0
);

-- A single reviewer can never manufacture `established`.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000102',
  true
);
select pg_temp.expect_sqlstate(
  $$select public.evaluate_claim(
    'topic_congestion_pricing', 'cp_c1', 'established', 'One reviewer says so.'
  )$$,
  '22023'
);
select pg_temp.expect_sqlstate(
  $$select public.evaluate_claim(
    'topic_congestion_pricing', 'cp_c1', 'contested', ''
  )$$,
  '22023'
);
select public.evaluate_claim(
  'topic_congestion_pricing',
  'cp_c1',
  'contested',
  'The currently cited evidence leaves a material counterargument unresolved.'
);

-- Position signals ignore the caller-declared previous choice and persist one
-- private, revisable ballot per account/topic/phase.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101',
  true
);
select public.cast_position_signal(
  'topic_congestion_pricing', 'before', 'pos_a', 'pos_z'
);
select public.cast_position_signal(
  'topic_congestion_pricing', 'before', 'pos_a', 'pos_b'
);
select pg_temp.assert_true(
  'repeated signal is idempotent',
  public.get_my_position_signal('topic_congestion_pricing') ->> 'before' = 'pos_a'
);
select public.cast_position_signal(
  'topic_congestion_pricing', 'before', 'pos_b', 'pos_z'
);
select pg_temp.assert_true(
  'server-authoritative revision replaces the same ballot',
  public.get_my_position_signal('topic_congestion_pricing') ->> 'before' = 'pos_b'
);
select pg_temp.expect_sqlstate(
  $$select public.cast_position_signal(
    'topic_congestion_pricing', 'before', 'arbitrary_bucket', null
  )$$,
  '22023'
);
select pg_temp.assert_true(
  'small signal aggregate reveals no total or bucket presence',
  public.get_position_signal('topic_congestion_pricing') ->> 'released' = 'false'
  and public.get_position_signal('topic_congestion_pricing') -> 'totals' = '{}'::jsonb
  and public.get_position_signal('topic_congestion_pricing') -> 'distribution' = '[]'::jsonb
);
reset role;
select pg_temp.assert_true(
  'one physical ballot exists after repeated casts and revision',
  (select count(*) = 1 and min(position_id) = 'pos_b'
   from public.position_signal_ballots
   where user_id = '00000000-0000-0000-0000-000000000101'
     and topic_id = 'topic_congestion_pricing' and phase = 'before')
);

-- Published and superseded children are immutable even for the table owner.
select pg_temp.expect_sqlstate(
  $$insert into public.claims (
    id, revision_id, topic_id, text, claim_type, generated_by, review_status
  ) values (
    'forbidden_published_claim', 'cp_rev_001', 'topic_congestion_pricing',
    'Must never appear silently.', array['factual'], 'human', 'approved'
  )$$,
  '55000'
);
select pg_temp.expect_sqlstate(
  $$update public.claims set text = 'mutated' where id = 'cp_c1'$$,
  '55000'
);
select pg_temp.expect_sqlstate(
  $$delete from public.claims where id = 'cp_c1'$$,
  '55000'
);
select pg_temp.expect_sqlstate(
  $$insert into public.value_positions (value_id, position_id)
    values ('cp_val_mobility', 'cp_pos_b')$$,
  '55000'
);

-- Composite constraints reject cross-topic and cross-revision references.
insert into public.topics (
  id, slug, title, question, summary, status
) values
  ('hard_topic_a', 'hard-topic-a', 'A', 'Is A coherent?', 'A test topic.', 'draft'),
  ('hard_topic_b', 'hard-topic-b', 'B', 'Is B coherent?', 'A test topic.', 'draft');
insert into public.debate_revisions (
  id, topic_id, revision_number, status, review_status, generated_by
) values
  ('hard_rev_a', 'hard_topic_a', 1, 'draft', 'approved', 'human'),
  ('hard_rev_b', 'hard_topic_b', 1, 'draft', 'approved', 'human');

select pg_temp.expect_sqlstate(
  $$insert into public.positions (
    id, revision_id, topic_id, title, short_summary, steelman
  ) values (
    'hard_cross_position', 'hard_rev_a', 'hard_topic_b', 'Cross', 'Cross', 'Cross'
  )$$,
  '23503'
);
select pg_temp.expect_sqlstate(
  $$update public.topics
    set published_revision_id = 'hard_rev_b'
    where id = 'hard_topic_a'$$,
  '23503'
);

insert into public.positions (
  id, revision_id, topic_id, title, short_summary, steelman
) values
  ('hard_pos_a', 'hard_rev_a', 'hard_topic_a', 'A1', 'A1', 'A1'),
  ('hard_pos_b', 'hard_rev_b', 'hard_topic_b', 'B1', 'B1', 'B1');
insert into public.debate_values (
  id, revision_id, topic_id, name, description
) values ('hard_value_a', 'hard_rev_a', 'hard_topic_a', 'Value A', 'Value A');
select pg_temp.expect_sqlstate(
  $$insert into public.value_positions (value_id, position_id)
    values ('hard_value_a', 'hard_pos_b')$$,
  '23514'
);

-- Structurally empty/incomplete revisions cannot be published.
select pg_temp.expect_sqlstate(
  $$update public.debate_revisions
    set status = 'published', published_at = now()
    where id = 'hard_rev_a'$$,
  '23514'
);
select pg_temp.assert_true(
  'one-published-revision-per-topic index exists',
  to_regclass('public.debate_revisions_one_published_per_topic') is not null
);
select pg_temp.expect_sqlstate(
  $$insert into public.sources (
    id, revision_id, topic_id, url, title, publisher, source_type,
    retrieval_status, content_hash
  ) values (
    'hard_bad_hash', 'hard_rev_a', 'hard_topic_a', 'https://example.test/hash',
    'Bad hash', 'Test', 'other', 'found', 'not-a-sha256-digest'
  )$$,
  '23514'
);
select pg_temp.expect_sqlstate(
  $$insert into public.sources (
    id, revision_id, topic_id, url, title, publisher, source_type,
    retrieval_status
  ) values (
    'hard_secret_url', 'hard_rev_a', 'hard_topic_a',
    'https://example.test/source?api_key=secret',
    'Secret URL', 'Test', 'other', 'found'
  )$$,
  '23514'
);
select pg_temp.expect_sqlstate(
  $$insert into public.sources (
    id, revision_id, topic_id, url, title, publisher, source_type,
    retrieval_status
  ) values (
    'hard_unsafe_port', 'hard_rev_a', 'hard_topic_a',
    'https://example.test:8443/source',
    'Unsafe port', 'Test', 'other', 'found'
  )$$,
  '23514'
);

-- Trusted completion is fenced by a private random token. Input limits, account
-- quotas and lease takeover are enforced in the same database transaction.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101',
  true
);
select pg_temp.expect_sqlstate(
  $$select public.create_seed_packet(
    'Should unsafe source credentials be rejected?',
    'Yes, before durable storage.',
    array['Credentials must never become public.'],
    '[{"url":"https://user:secret@example.com/source","note":"unsafe"}]'::jsonb
  )$$,
  '22023'
);
select pg_temp.expect_sqlstate(
  $$select public.create_seed_packet(
    'Should unbounded argument lists be rejected?',
    'Yes, before durable storage.',
    array['a','b','c','d','e','f','g','h','i'],
    '[]'::jsonb
  )$$,
  '22023'
);
select public.create_seed_packet(
  'Should trusted completion derive its verified actor?',
  'Yes, only through the trusted backend.',
  array['The service assertion is checked against packet ownership.'],
  '[]'::jsonb
) as completion_packet_id \gset
select public.create_seed_packet(
  'Should failure state survive a separate transaction?',
  'Yes, with a stable error code.',
  array['Failure recording must be idempotent.'],
  '[]'::jsonb
) as failure_packet_id \gset
select public.create_seed_packet(
  'Should an expired analysis lease be reclaimed safely?',
  'Yes, through the atomic service claim.',
  array['Reviewers may operate the trusted analysis path.'],
  '[]'::jsonb
) as stale_packet_id \gset

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000103',
  true
);
select public.create_seed_packet(
  'Should persistent account quotas bound analysis work?',
  'Yes, atomically in the database.',
  array['Quota state must survive worker processes.'],
  '[]'::jsonb
) as quota_packet_id \gset
reset role;
update private.account_quota_settings
set max_requests = 1
where action = 'seed_create';
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000103',
  true
);
select pg_temp.expect_sqlstate(
  $$select public.create_seed_packet(
    'Should a second seed inside the quota window fail?',
    'Yes, with retry metadata in the database error.',
    array['The fixed window boundary is persistent.'],
    '[]'::jsonb
  )$$,
  'P0001'
);

reset role;
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select pg_temp.expect_sqlstate(
  format(
    'select public.claim_ai_job(%L, %L, %L, 60)',
    :'completion_packet_id',
    '00000000-0000-0000-0000-000000000199',
    '10000000-0000-0000-0000-000000000099'
  ),
  '42501'
);
select pg_temp.expect_sqlstate(
  format(
    'select public.complete_mock_ai_job(%L, %L, %L, %L::jsonb, %L)',
    :'completion_packet_id',
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    '[]',
    'mock'
  ),
  '55000'
);
select pg_temp.assert_true(
  'owner can atomically claim analysis work',
  public.claim_ai_job(
    :'completion_packet_id',
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    60
  ) ->> 'state' = 'claimed'
);
select pg_temp.assert_true(
  'same token claim replay is idempotent',
  public.claim_ai_job(
    :'completion_packet_id',
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    60
  ) ->> 'replayed' = 'true'
);
select pg_temp.assert_true(
  'a live lease prevents a different token from duplicating work',
  public.claim_ai_job(
    :'completion_packet_id',
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000011',
    60
  ) ->> 'state' = 'in_progress'
);
select pg_temp.expect_sqlstate(
  format(
    'select public.complete_mock_ai_job(%L, %L, %L, %L::jsonb, %L)',
    :'completion_packet_id',
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    '[]',
    'openrouter'
  ),
  '22023'
);
select public.complete_mock_ai_job(
  :'completion_packet_id',
  '00000000-0000-0000-0000-000000000101',
  '10000000-0000-0000-0000-000000000001',
  '[]'::jsonb,
  'mock'
);
select pg_temp.assert_true(
  'completed claims are idempotently reusable',
  public.claim_ai_job(
    :'completion_packet_id',
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000012',
    60
  ) ->> 'state' = 'completed'
);
select pg_temp.expect_sqlstate(
  format(
    'select public.record_ai_job_failure(%L, %L, %L, %L)',
    :'failure_packet_id',
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000002',
    'timeout'
  ),
  '55000'
);
select public.claim_ai_job(
  :'failure_packet_id',
  '00000000-0000-0000-0000-000000000101',
  '10000000-0000-0000-0000-000000000002',
  60
);
select public.record_ai_job_failure(
  :'failure_packet_id',
  '00000000-0000-0000-0000-000000000101',
  '10000000-0000-0000-0000-000000000002',
  'timeout'
);
select pg_temp.assert_true(
  'failure recording is idempotent',
  public.record_ai_job_failure(
    :'failure_packet_id',
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000002',
    'timeout'
  ) ->> 'already_recorded' = 'true'
);

select pg_temp.assert_true(
  'reviewer can claim an owner packet through the trusted path',
  public.claim_ai_job(
    :'stale_packet_id',
    '00000000-0000-0000-0000-000000000102',
    '10000000-0000-0000-0000-000000000003',
    60
  ) ->> 'state' = 'claimed'
);
reset role;
update private.ai_analysis_attempts
set lease_expires_at = now() - interval '1 second'
where lease_token = '10000000-0000-0000-0000-000000000003';
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select pg_temp.assert_true(
  'an expired lease can be reclaimed atomically',
  public.claim_ai_job(
    :'stale_packet_id',
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000004',
    60
  ) ->> 'state' = 'claimed'
);
select pg_temp.expect_sqlstate(
  format(
    'select public.complete_mock_ai_job(%L, %L, %L, %L::jsonb, %L)',
    :'stale_packet_id',
    '00000000-0000-0000-0000-000000000102',
    '10000000-0000-0000-0000-000000000003',
    '[]',
    'mock'
  ),
  '55000'
);
select pg_temp.expect_sqlstate(
  format(
    'select public.record_ai_job_failure(%L, %L, %L, %L)',
    :'stale_packet_id',
    '00000000-0000-0000-0000-000000000102',
    '10000000-0000-0000-0000-000000000003',
    'interrupted'
  ),
  '55000'
);
select public.record_ai_job_failure(
  :'stale_packet_id',
  '00000000-0000-0000-0000-000000000101',
  '10000000-0000-0000-0000-000000000004',
  'interrupted'
);

select pg_temp.assert_true(
  'analysis quota first reservation succeeds',
  public.claim_ai_job(
    :'quota_packet_id',
    '00000000-0000-0000-0000-000000000103',
    '10000000-0000-0000-0000-000000000005',
    60
  ) ->> 'state' = 'claimed'
);
select public.record_ai_job_failure(
  :'quota_packet_id',
  '00000000-0000-0000-0000-000000000103',
  '10000000-0000-0000-0000-000000000005',
  'interrupted'
);
reset role;
update private.account_quota_settings
set max_requests = 1
where action = 'analysis_claim';
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select pg_temp.assert_true(
  'analysis quota returns explicit retry metadata without creating a claim',
  public.claim_ai_job(
    :'quota_packet_id',
    '00000000-0000-0000-0000-000000000103',
    '10000000-0000-0000-0000-000000000006',
    60
  ) ->> 'state' = 'quota_exceeded'
  and (
    public.claim_ai_job(
      :'quota_packet_id',
      '00000000-0000-0000-0000-000000000103',
      '10000000-0000-0000-0000-000000000006',
      60
    ) ->> 'retry_after_seconds'
  )::integer > 0
);
reset role;
select pg_temp.assert_true(
  'stale fencing and quota denial leave no active stale token',
  (select state = 'superseded'
   from private.ai_analysis_attempts
   where lease_token = '10000000-0000-0000-0000-000000000003')
  and not exists (
    select 1 from private.ai_analysis_attempts
    where lease_token = '10000000-0000-0000-0000-000000000006'
  )
);
select pg_temp.assert_true(
  'stable failure code and safe message persist',
  (select status = 'failed'
      and error_code = 'timeout'
      and error_message = 'The analysis timed out.'
      and failure_recorded_at is not null
   from public.seed_packets where id = :'failure_packet_id')
);
select pg_temp.assert_true(
  'idempotent failure produces one audit event',
  (select count(*) = 1 from public.audit_events
   where event_type = 'ai_analysis_failed'
     and :'failure_packet_id' = any(input_object_ids))
);

-- Source assessment has a required rationale and keeps unknown distinct from
-- meets-floor. The exact-key contract prevents case-sensitive collisions.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000102',
  true
);
select pg_temp.expect_sqlstate(
  $$select public.assess_source_floor(
    'topic_congestion_pricing',
    'https://rosap.ntl.bts.gov/view/dot/42199',
    'opinion', 'named_author', 'documented', 'none_known',
    'independent', 'journalistic', 'verified', '', 'none', '', null
  )$$,
  '22023'
);
select public.assess_source_floor(
  'topic_congestion_pricing',
  'https://rosap.ntl.bts.gov/view/dot/42199',
  'opinion', 'named_author', 'documented', 'none_known',
  'independent', 'journalistic', 'verified',
  'The document is authored and its institutional provenance is inspectable.',
  'none', '', null
);
select public.assess_source_floor(
  'topic_congestion_pricing',
  'https://www.mta.info/agency/bridges-and-tunnels/congestion-relief-zone',
  'unknown', 'unknown', 'unknown', 'unknown',
  'unknown', 'unknown', 'unknown',
  'The source has not yet received a complete integrity assessment.',
  'unknown', '', null
);
select pg_temp.assert_true(
  'unknown source assessment does not become meets_floor',
  exists (
    select 1
    from jsonb_array_elements(
      public.get_source_floor('topic_congestion_pricing')
    ) assessment
    where assessment ->> 'source_key' =
      'https://www.mta.info/agency/bridges-and-tunnels/congestion-relief-zone'
      and assessment ->> 'floor_verdict' = 'unknown'
      and assessment ->> 'rule_id' = 'insufficient_information'
  )
);
select pg_temp.assert_true(
  'public source assessment omits assessor identity',
  position(
    'assessed_by' in public.get_source_floor('topic_congestion_pricing')::text
  ) = 0
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.assert_true(
  'public fixture exposes safe exact provenance fields',
  (select
    (debate -> 'sources' -> 0) ?& array[
      'source_key', 'retrieval_status', 'retrieved_at',
      'content_hash', 'content_version'
    ]
    and not ((debate -> 'sources' -> 0) ? 'quality_notes')
    and jsonb_typeof(debate -> 'source_excerpts') = 'array'
    and (debate -> 'evidence_links' -> 0) ? 'source_excerpt_id'
    and (debate -> 'evidence_links' -> 0) ? 'assessment_state'
   from public.published_debate_fixtures
   where topic_id = 'topic_congestion_pricing')
);
select pg_temp.assert_true(
  'public fixture and audit RPC expose no human UUID or private contribution event',
  (select position('00000000-' in debate::text) = 0
      and position('contribution_submitted' in debate::text) = 0
   from public.published_debate_fixtures
   where topic_id = 'topic_congestion_pricing')
  and position(
    '00000000-' in public.get_public_audit_events(
      'topic_congestion_pricing', 'cp_rev_001'
    )::text
  ) = 0
);

rollback;
