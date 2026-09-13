\set ON_ERROR_STOP on

begin;

create or replace function pg_temp.assert_true(p_name text, p_ok boolean)
returns void language plpgsql as $$
begin
  if p_ok is distinct from true then
    raise exception 'assertion failed: %', p_name;
  end if;
end;
$$;

create or replace function pg_temp.expect_sqlstate(
  p_statement text,
  p_expected text
)
returns void language plpgsql as $$
declare v_actual text;
begin
  begin
    execute p_statement;
  exception when others then
    get stacked diagnostics v_actual = returned_sqlstate;
    if v_actual = p_expected then return; end if;
    raise exception 'expected SQLSTATE %, got % for %',
      p_expected, v_actual, p_statement;
  end;
  raise exception 'expected SQLSTATE %, statement succeeded: %',
    p_expected, p_statement;
end;
$$;

create or replace function pg_temp.artifact_payload(
  p_requested_url text,
  p_final_url text,
  p_text text,
  p_status text default 'found'
)
returns jsonb language sql as $$
  select case when p_status in ('found', 'partial') then
    jsonb_build_object(
      'requested_url', p_requested_url,
      'final_url', p_final_url,
      'http_status', 200,
      'content_type', 'text/plain; charset=utf-8',
      'raw_content_base64', encode(convert_to(p_text, 'UTF8'), 'base64'),
      'byte_length', octet_length(convert_to(p_text, 'UTF8')),
      'raw_sha256', 'sha256:' || encode(
        extensions.digest(convert_to(p_text, 'UTF8'), 'sha256'), 'hex'
      ),
      'normalized_text', p_text,
      'normalized_sha256', 'sha256:' || encode(
        extensions.digest(convert_to(p_text, 'UTF8'), 'sha256'), 'hex'
      ),
      'retrieval_status', p_status,
      'title', 'Captured report',
      'publisher', 'Example Institute',
      'source_type', 'report',
      'parser_version', 'plain-text-v1',
      'is_truncated', p_status = 'partial'
    )
  else
    jsonb_build_object(
      'requested_url', p_requested_url,
      'final_url', p_final_url,
      'http_status', 503,
      'content_type', 'text/plain',
      'retrieval_status', p_status,
      'failure_code', 'http_status',
      'title', 'Unavailable report',
      'publisher', 'Example Institute',
      'source_type', 'report',
      'parser_version', 'plain-text-v1',
      'is_truncated', false
    )
  end
$$;

create or replace function pg_temp.valid_payload(
  p_support uuid,
  p_counter uuid,
  p_base text default 'cp_rev_001',
  p_position text default 'cp_pos_a'
)
returns jsonb language sql as $$
  select jsonb_build_object(
    'topic_id', 'topic_congestion_pricing',
    'base_revision_id', p_base,
    'submission_kind', 'new_claim',
    'target_position_id', p_position,
    'claim_type', 'factual',
    'claim_profile', 'factual_descriptive_v1',
    'claim_text',
      'Measured traffic was 12 percent lower in the priced zone during the reporting period.',
    'argument_summary',
      'The zone decline is relevant while boundary displacement remains material.',
    'argument_direction', 'qualifies',
    'scope_note', 'Applies only to the measured zone and reporting period.',
    'language', 'en',
    'evidence', jsonb_build_array(
      jsonb_build_object(
        'research_role', 'support',
        'source_artifact_id', p_support,
        'start_offset', octet_length(convert_to('Préface ', 'UTF8')),
        'end_offset', octet_length(convert_to(
          'Préface 🚲 mobility report: traffic fell 12 percent.', 'UTF8'
        )),
        'exact_excerpt', '🚲 mobility report: traffic fell 12 percent.',
        'locator', 'paragraph 1, sentence 1',
        'label', 'supports_claim',
        'rationale', 'The exact passage reports the measured zone decline.'
      ),
      jsonb_build_object(
        'research_role', 'counter',
        'source_artifact_id', p_counter,
        'start_offset', 0,
        'end_offset', octet_length(convert_to(
          'The same period saw traffic rise on boundary roads.', 'UTF8'
        )),
        'exact_excerpt', 'The same period saw traffic rise on boundary roads.',
        'locator', 'paragraph 1, sentence 1',
        'label', 'does_not_support_claim',
        'rationale',
          'The passage narrows geographic scope without refuting the zone measure.'
      )
    )
  )
$$;

select pg_temp.assert_true(
  'private dossier tables and exact RPC contract exist',
  to_regclass('private.source_artifacts') is not null
  and to_regclass('private.claim_dossier_submissions') is not null
  and to_regclass('private.claim_dossier_evidence') is not null
  and to_regclass('private.revision_change_sets') is not null
  and to_regprocedure('public.reserve_source_capture(uuid,uuid,text)') is not null
  and to_regprocedure('public.store_source_artifact(uuid,uuid,jsonb)') is not null
  and to_regprocedure('public.submit_claim_dossier(jsonb,uuid)') is not null
  and to_regprocedure('public.review_claim_dossier(uuid,text,text)') is not null
  and to_regprocedure('public.prepare_claim_dossier_revision(uuid)') is not null
  and to_regprocedure(
    'public.get_my_claim_dossiers(text,integer,timestamp with time zone)'
  ) is not null
  and to_regprocedure(
    'public.get_review_claim_dossiers(text,integer,timestamp with time zone)'
  ) is not null
  and to_regprocedure('public.get_claim_dossier_detail(uuid)') is not null
  and to_regprocedure('public.get_public_claim_dossiers(text)') is not null
);

select pg_temp.assert_true(
  'raw private data is closed while only intended RPC roles can execute',
  not has_table_privilege('anon', 'private.source_artifacts', 'select')
  and not has_table_privilege('authenticated', 'private.source_artifacts', 'select')
  and not has_table_privilege('service_role', 'private.source_artifacts', 'select')
  and not has_table_privilege(
    'authenticated', 'private.claim_dossier_submissions', 'select'
  )
  and has_function_privilege(
    'service_role', 'public.reserve_source_capture(uuid,uuid,text)', 'execute'
  )
  and has_function_privilege(
    'service_role', 'public.store_source_artifact(uuid,uuid,jsonb)', 'execute'
  )
  and not has_function_privilege(
    'authenticated', 'public.store_source_artifact(uuid,uuid,jsonb)', 'execute'
  )
  and has_function_privilege(
    'authenticated', 'public.submit_claim_dossier(jsonb,uuid)', 'execute'
  )
  and not has_function_privilege(
    'anon', 'public.submit_claim_dossier(jsonb,uuid)', 'execute'
  )
  and has_function_privilege(
    'anon', 'public.get_public_claim_dossiers(text)', 'execute'
  )
);

select pg_temp.assert_true(
  'storage URL policy rejects credentials, secrets, and non-web schemes',
  public.is_safe_public_url('https://example.test/report?q=traffic')
  and not public.is_safe_public_url('https://u:p@example.test/report')
  and not public.is_safe_public_url(
    'https://example.test/report?access_token=secret'
  )
  and not public.is_safe_public_url('file:///etc/passwd')
);

reset role;
update private.account_quota_settings
set max_requests = 5
where action = 'dossier_capture';

set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.expect_sqlstate(
  $$select public.reserve_source_capture(
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    'https://example.test/support'
  )$$,
  '42501'
);

reset role;
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);

select pg_temp.assert_true(
  'new reservation is reserved and replay is in progress',
  public.reserve_source_capture(
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    'https://example.test/support'
  ) ->> 'state' = 'reserved'
  and public.reserve_source_capture(
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    'https://example.test/support'
  ) ->> 'state' = 'in_progress'
);

select public.reserve_source_capture(
  '00000000-0000-0000-0000-000000000101',
  '10000000-0000-0000-0000-000000000002',
  'https://example.test/counter'
);
select public.reserve_source_capture(
  '00000000-0000-0000-0000-000000000101',
  '10000000-0000-0000-0000-000000000003',
  'https://example.test/unavailable'
);
select public.reserve_source_capture(
  '00000000-0000-0000-0000-000000000101',
  '10000000-0000-0000-0000-000000000004',
  'https://example.test/long'
);
select public.reserve_source_capture(
  '00000000-0000-0000-0000-000000000101',
  '10000000-0000-0000-0000-000000000005',
  'https://example.test/mirror'
);

select pg_temp.assert_true(
  'capture quota returns explicit retry metadata without a reservation',
  public.reserve_source_capture(
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000006',
    'https://example.test/sixth'
  ) ->> 'state' = 'quota_exceeded'
  and (
    public.reserve_source_capture(
      '00000000-0000-0000-0000-000000000101',
      '10000000-0000-0000-0000-000000000006',
      'https://example.test/sixth'
    ) ->> 'retry_after_seconds'
  )::integer > 0
);

select (
  public.store_source_artifact(
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    pg_temp.artifact_payload(
      'https://example.test/support',
      'https://example.test/support',
      'Préface 🚲 mobility report: traffic fell 12 percent. End.'
    )
  ) ->> 'artifact_id'
)::uuid as support_artifact_id \gset

select (
  public.store_source_artifact(
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000002',
    pg_temp.artifact_payload(
      'https://example.test/counter',
      'https://example.test/counter',
      'The same period saw traffic rise on boundary roads.'
    )
  ) ->> 'artifact_id'
)::uuid as counter_artifact_id \gset

select (
  public.store_source_artifact(
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000003',
    pg_temp.artifact_payload(
      'https://example.test/unavailable',
      'https://example.test/unavailable',
      null,
      'failed'
    )
  ) ->> 'artifact_id'
)::uuid as failed_artifact_id \gset

select (
  public.store_source_artifact(
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000004',
    pg_temp.artifact_payload(
      'https://example.test/long',
      'https://example.test/long',
      repeat('🚲', 2050)
    )
  ) ->> 'artifact_id'
)::uuid as long_artifact_id \gset

select (
  public.store_source_artifact(
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000005',
    pg_temp.artifact_payload(
      'https://example.test/mirror',
      'https://example.test/support',
      'A second capture of the same final source identity.'
    )
  ) ->> 'artifact_id'
)::uuid as mirror_artifact_id \gset

select pg_temp.assert_true(
  'completed reservation replays immutable artifact metadata without refetch',
  public.reserve_source_capture(
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    'https://example.test/support'
  ) ->> 'state' = 'completed'
  and (
    public.reserve_source_capture(
      '00000000-0000-0000-0000-000000000101',
      '10000000-0000-0000-0000-000000000001',
      'https://example.test/support'
    ) ->> 'artifact_id'
  )::uuid = :'support_artifact_id'::uuid
  and public.reserve_source_capture(
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    'https://example.test/support'
  ) ->> 'raw_hash' like 'sha256:%'
);

reset role;
select pg_temp.assert_true(
  'idempotent replay and quota denial do not consume extra capture slots',
  (
    select request_count = 5
    from private.account_quota_windows
    where actor_id = '00000000-0000-0000-0000-000000000101'
      and action = 'dossier_capture'
    order by window_start desc limit 1
  )
  and not exists (
    select 1 from private.source_capture_reservations
    where idempotency_key = '10000000-0000-0000-0000-000000000006'
  )
);

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select pg_temp.assert_true(
  'artifact storage replay is idempotent',
  public.store_source_artifact(
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    pg_temp.artifact_payload(
      'https://example.test/support',
      'https://example.test/support',
      'Préface 🚲 mobility report: traffic fell 12 percent. End.'
    )
  ) ->> 'reused' = 'true'
);
select pg_temp.expect_sqlstate(
  format(
    'select public.store_source_artifact(%L::uuid,%L::uuid,%L::jsonb)',
    '00000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    (
      pg_temp.artifact_payload(
        'https://example.test/support',
        'https://example.test/support',
        'Préface 🚲 mobility report: traffic fell 12 percent. End.'
      ) || jsonb_build_object(
        'normalized_text', 'Different normalized output for identical bytes.',
        'normalized_sha256', 'sha256:' || encode(extensions.digest(
          convert_to('Different normalized output for identical bytes.', 'UTF8'),
          'sha256'
        ), 'hex')
      )
    )::text
  ),
  '22023'
);

reset role;
select pg_temp.assert_true(
  'stored bytes and hashes are exact while failure is not evidence',
  (
    select byte_length = octet_length(raw_content)
      and raw_sha256 = 'sha256:' || encode(
        extensions.digest(raw_content, 'sha256'), 'hex'
      )
      and normalized_sha256 = 'sha256:' || encode(extensions.digest(
        convert_to(normalized_text, 'UTF8'), 'sha256'
      ), 'hex')
    from private.source_artifacts
    where id = :'support_artifact_id'::uuid
  )
  and (
    select retrieval_status = 'failed'
      and raw_content is null
      and raw_sha256 is null
      and normalized_text is null
      and normalized_sha256 is null
    from private.source_artifacts
    where id = :'failed_artifact_id'::uuid
  )
);
select pg_temp.expect_sqlstate(
  format(
    'update private.source_artifacts set title=%L where id=%L',
    'mutated', :'support_artifact_id'
  ),
  '55000'
);

-- Direct table insertion cannot mint a dossier without the atomic RPC intent.
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.expect_sqlstate(
  $$insert into public.contributions(
    topic_id,type,body,created_by
  ) values (
    'topic_congestion_pricing','claim_dossier','bypass attempt',
    '00000000-0000-0000-0000-000000000101'
  )$$,
  '42501'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select pg_temp.expect_sqlstate(
  format(
    'select public.submit_claim_dossier(%L::jsonb,%L::uuid)',
    pg_temp.valid_payload(
      :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
    )::text,
    '20000000-0000-0000-0000-000000000001'
  ),
  '42501'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

-- The vertical is deliberately limited to one enabled topic/profile.
select pg_temp.expect_sqlstate(
  format(
    'select public.submit_claim_dossier(%L::jsonb,%L::uuid)',
    (
      pg_temp.valid_payload(
        :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
      ) || jsonb_build_object(
        'topic_id','topic_smartphones_schools',
        'base_revision_id','sm_rev_001',
        'target_position_id','sm_pos_a'
      )
    )::text,
    '20000000-0000-0000-0000-000000000010'
  ),
  '22023'
);
select pg_temp.expect_sqlstate(
  format(
    'select public.submit_claim_dossier(%L::jsonb,%L::uuid)',
    (
      pg_temp.valid_payload(
        :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
      ) || jsonb_build_object(
        'claim_text',
        'The charge caused traffic to fall and will reduce it again.'
      )
    )::text,
    '20000000-0000-0000-0000-000000000011'
  ),
  '22023'
);
select pg_temp.expect_sqlstate(
  format(
    'select public.submit_claim_dossier(%L::jsonb,%L::uuid)',
    (
      pg_temp.valid_payload(
        :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
      ) || jsonb_build_object('claim_type','normative')
    )::text,
    '20000000-0000-0000-0000-000000000012'
  ),
  '22023'
);
select pg_temp.expect_sqlstate(
  format(
    'select public.submit_claim_dossier(%L::jsonb,%L::uuid)',
    jsonb_set(
      pg_temp.valid_payload(
        :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
      ),
      '{evidence,0,start_offset}',
      to_jsonb(char_length('Préface '))
    )::text,
    '20000000-0000-0000-0000-000000000013'
  ),
  '22023'
);

-- Excerpts above either public bound (>2000 chars or >8192 UTF-8 bytes) fail.
select pg_temp.expect_sqlstate(
  format(
    'select public.submit_claim_dossier(%L::jsonb,%L::uuid)',
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            pg_temp.valid_payload(
              :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
            ),
            '{evidence,0,source_artifact_id}',
            to_jsonb(:'long_artifact_id'::uuid)
          ),
          '{evidence,0,start_offset}', '0'::jsonb
        ),
        '{evidence,0,end_offset}', to_jsonb(8200)
      ),
      '{evidence,0,exact_excerpt}', to_jsonb(repeat('🚲',2050))
    )::text,
    '20000000-0000-0000-0000-000000000014'
  ),
  '22023'
);

-- Retrieval failure can never be persisted as a contradictory counter-source.
select pg_temp.expect_sqlstate(
  format(
    'select public.submit_claim_dossier(%L::jsonb,%L::uuid)',
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            pg_temp.valid_payload(
              :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
            ),
            '{evidence,1,source_artifact_id}',
            to_jsonb(:'failed_artifact_id'::uuid)
          ),
          '{evidence,1,start_offset}', '0'::jsonb
        ),
        '{evidence,1,end_offset}', '1'::jsonb
      ),
      '{evidence,1,exact_excerpt}', '"x"'::jsonb
    )::text,
    '20000000-0000-0000-0000-000000000015'
  ),
  '22023'
);

-- A challenge target must belong to a claim referenced by an argument of the
-- selected position, not merely to any evidence link in the same revision.
select pg_temp.expect_sqlstate(
  format(
    'select public.submit_claim_dossier(%L::jsonb,%L::uuid)',
    (
      pg_temp.valid_payload(
        :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
      ) || jsonb_build_object(
        'submission_kind','challenge',
        'target_evidence_link_id','cp_ev_c4_s6'
      )
    )::text,
    '20000000-0000-0000-0000-000000000016'
  ),
  '22023'
);

-- Independent recaptures are valid, but support and counter evidence in one
-- dossier must resolve to distinct canonical source identities (final URLs).
select pg_temp.expect_sqlstate(
  format(
    'select public.submit_claim_dossier(%L::jsonb,%L::uuid)',
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            pg_temp.valid_payload(
              :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
            ),
            '{evidence,1,source_artifact_id}',
            to_jsonb(:'mirror_artifact_id'::uuid)
          ),
          '{evidence,1,start_offset}', '0'::jsonb
        ),
        '{evidence,1,end_offset}', to_jsonb(octet_length(convert_to(
          'A second capture of the same final source identity.', 'UTF8'
        )))
      ),
      '{evidence,1,exact_excerpt}',
      to_jsonb('A second capture of the same final source identity.'::text)
    )::text,
    '20000000-0000-0000-0000-000000000017'
  ),
  '22023'
);

-- Happy path and submission quota boundary.
select (
  public.submit_claim_dossier(
    pg_temp.valid_payload(
      :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
    ),
    '20000000-0000-0000-0000-000000000020'
  ) ->> 'id'
)::uuid as original_dossier_id \gset

reset role;
update private.account_quota_settings
set max_requests = 1 where action = 'dossier_submit';
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.assert_true(
  'dossier replay is idempotent at quota boundary',
  (
    public.submit_claim_dossier(
      pg_temp.valid_payload(
        :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
      ),
      '20000000-0000-0000-0000-000000000020'
    ) ->> 'id'
  )::uuid = :'original_dossier_id'::uuid
  and public.submit_claim_dossier(
    pg_temp.valid_payload(
      :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
    ),
    '20000000-0000-0000-0000-000000000020'
  ) ->> 'idempotent' = 'true'
);
select pg_temp.expect_sqlstate(
  format(
    'select public.submit_claim_dossier(%L::jsonb,%L::uuid)',
    pg_temp.valid_payload(
      :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
    )::text,
    '20000000-0000-0000-0000-000000000021'
  ),
  'P0001'
);

reset role;
select pg_temp.assert_true(
  'exact UTF-8 slice, research roles and immutable intent are persisted',
  (
    select count(*) = 1 and base_revision_id = 'cp_rev_001'
    from private.claim_dossier_submissions
    where id = :'original_dossier_id'::uuid
    group by base_revision_id
  )
  and (
    select count(*) = 2
      and count(*) filter (where research_role='support') = 1
      and count(*) filter (
        where research_role='counter' and label='does_not_support_claim'
      ) = 1
    from private.claim_dossier_evidence
    where submission_id = :'original_dossier_id'::uuid
  )
  and (
    select e.start_offset = octet_length(convert_to('Préface ', 'UTF8'))
      and e.start_offset <> char_length('Préface ')
      and convert_from(substring(
        convert_to(a.normalized_text,'UTF8')
        from e.start_offset + 1 for e.end_offset - e.start_offset
      ),'UTF8') = e.exact_excerpt
      and e.excerpt_hash = 'sha256:' || encode(extensions.digest(
        convert_to(e.exact_excerpt,'UTF8'),'sha256'
      ),'hex')
    from private.claim_dossier_evidence e
    join private.source_artifacts a on a.id=e.source_artifact_id
    where e.submission_id=:'original_dossier_id'::uuid
      and e.research_role='support'
  )
);

update private.account_quota_settings
set max_requests = 100 where action = 'dossier_submit';

-- Caller-scoped list is paginated/clamped and excludes normalized full text;
-- the owner-only detail getter intentionally exposes it for excerpt selection.
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.assert_true(
  'owner list clamps limits, filters cursor, and omits normalized text',
  jsonb_array_length(public.get_my_claim_dossiers(null,0,null)) = 1
  and jsonb_array_length(public.get_my_claim_dossiers(null,999,null)) <= 50
  and jsonb_array_length(public.get_my_claim_dossiers(
    null,25,now() - interval '1 second'
  )) = 0
  and position('normalized_text' in
    public.get_my_claim_dossiers(null,25,null)::text) = 0
  and position('raw_content' in
    public.get_my_claim_dossiers(null,25,null)::text) = 0
);
select pg_temp.assert_true(
  'owner detail contains complete artifact metadata but never raw bytes',
  public.get_claim_dossier_detail(:'original_dossier_id'::uuid)::text
    like '%normalized_text%'
  and public.get_claim_dossier_detail(:'original_dossier_id'::uuid)::text
    like '%🚲 mobility report: traffic fell 12 percent.%'
  and public.get_claim_dossier_detail(:'original_dossier_id'::uuid)::text
    like '%sha256:%'
  and position('raw_content' in
    public.get_claim_dossier_detail(:'original_dossier_id'::uuid)::text) = 0
);
select pg_temp.expect_sqlstate(
  $$select public.get_review_claim_dossiers(null,25,null)$$,
  '42501'
);
select pg_temp.expect_sqlstate(
  format(
    'select public.review_claim_dossier(%L::uuid,%L,%L)',
    :'original_dossier_id','approve','12345678'
  ),
  '42501'
);

-- Review rationale boundaries are exact: 0/7 rejected, 8 accepted.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000102', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.expect_sqlstate(
  format(
    'select public.review_claim_dossier(%L::uuid,%L,%L)',
    :'original_dossier_id','request_changes',''
  ),
  '22023'
);
select pg_temp.expect_sqlstate(
  format(
    'select public.review_claim_dossier(%L::uuid,%L,%L)',
    :'original_dossier_id','request_changes','1234567'
  ),
  '22023'
);
select public.review_claim_dossier(
  :'original_dossier_id'::uuid,
  'request_changes',
  '12345678'
) as request_changes_review_id \gset

select pg_temp.expect_sqlstate(
  format(
    'select public.review_claim_dossier(%L::uuid,%L,%L)',
    :'original_dossier_id','approve','A second decision is not permitted.'
  ),
  '55000'
);
select pg_temp.expect_sqlstate(
  format(
    'select public.prepare_claim_dossier_revision(%L::uuid)',
    :'original_dossier_id'
  ),
  '42501'
);

reset role;
select pg_temp.assert_true(
  'request changes records rationale without mutating original dossier',
  (
    select status='changes_requested' from public.contributions
    where id=:'original_dossier_id'::uuid
  )
  and (
    select decision='request_changes' and rationale='12345678'
    from public.reviews where id=:'request_changes_review_id'::uuid
  )
  and (
    select prepared_revision_id is null
    from private.claim_dossier_submissions
    where id=:'original_dossier_id'::uuid
  )
);

set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select (
  public.submit_claim_dossier(
    pg_temp.valid_payload(
      :'support_artifact_id'::uuid, :'counter_artifact_id'::uuid
    ) || jsonb_build_object(
      'scope_note',
        'Applies only to the named priced zone and reporting period.',
      'supersedes_submission_id', :'original_dossier_id'::uuid
    ),
    '20000000-0000-0000-0000-000000000030'
  ) ->> 'id'
)::uuid as replacement_dossier_id \gset

reset role;
select pg_temp.assert_true(
  'supersession creates a second immutable dossier linked to the first',
  (
    select supersedes_submission_id=:'original_dossier_id'::uuid
    from private.claim_dossier_submissions
    where id=:'replacement_dossier_id'::uuid
  )
  and (
    select status='submitted' from public.contributions
    where id=:'replacement_dossier_id'::uuid
  )
  and (
    select count(*)=2 from private.claim_dossier_submissions
    where id in (
      :'original_dossier_id'::uuid, :'replacement_dossier_id'::uuid
    )
  )
);

-- Reviewer list is bounded and metadata-only; reviewer detail unlocks the
-- normalized artifact needed to verify exact excerpts.
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000102', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.assert_true(
  'review list clamps and excludes normalized full text',
  jsonb_array_length(public.get_review_claim_dossiers(null,1,null)) = 1
  and jsonb_array_length(public.get_review_claim_dossiers(null,999,null)) <= 50
  and jsonb_array_length(public.get_review_claim_dossiers(
    null,25,now() - interval '1 second'
  )) = 0
  and position('normalized_text' in
    public.get_review_claim_dossiers(null,25,null)::text) = 0
  and public.get_review_claim_dossiers(null,25,null)::text
    like '%exact_excerpt%'
  and public.get_review_claim_dossiers(null,25,null)::text
    like '%sha256:%'
  and public.get_review_claim_dossiers(null,25,null)::text
    like '%locator%'
);
select pg_temp.assert_true(
  'reviewer detail exposes normalized artifact for verification',
  public.get_claim_dossier_detail(:'replacement_dossier_id'::uuid)::text
    like '%normalized_text%'
  and public.get_claim_dossier_detail(:'replacement_dossier_id'::uuid)::text
    like '%Préface 🚲 mobility report%'
);
select public.review_claim_dossier(
  :'replacement_dossier_id'::uuid,
  'approve',
  'The bounded claim and both exact passages are inspectable.'
) as approval_review_id \gset

-- Admin preparation is idempotent and stops at an unreviewed draft.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000103', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select public.prepare_claim_dossier_revision(
  :'replacement_dossier_id'::uuid
) as prepared_result \gset
select (:'prepared_result'::jsonb->>'revision_id') as prepared_revision_id \gset
select (:'prepared_result'::jsonb->>'change_set_id')::uuid as change_set_id \gset

select pg_temp.assert_true(
  'prepare replay returns one draft and no publication',
  public.prepare_claim_dossier_revision(
    :'replacement_dossier_id'::uuid
  ) ->> 'revision_id' = :'prepared_revision_id'
  and public.prepare_claim_dossier_revision(
    :'replacement_dossier_id'::uuid
  ) ->> 'idempotent' = 'true'
);

reset role;
select pg_temp.assert_true(
  'prepared draft and exact change set are reviewable but unpublished',
  (
    select status='draft' and review_status='unreviewed'
      and published_at is null
    from public.debate_revisions where id=:'prepared_revision_id'
  )
  and (
    select published_revision_id='cp_rev_001'
    from public.topics where id='topic_congestion_pricing'
  )
  and (
    select id=:'change_set_id'::uuid
      and dossier_review_id=:'approval_review_id'::uuid
      and base_snapshot_hash ~ '^sha256:[0-9a-f]{64}$'
      and prepared_snapshot_hash ~ '^sha256:[0-9a-f]{64}$'
      and change_hash ~ '^sha256:[0-9a-f]{64}$'
      and change_set #>> '{state}' = 'prepared'
      and change_set #>> '{submission_id}' = :'replacement_dossier_id'
      and jsonb_array_length(change_set #> '{adds,claim_ids}') = 1
    from private.revision_change_sets
    where submission_id=:'replacement_dossier_id'::uuid
  )
);

set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000102', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.assert_true(
  'review list exposes prepared diff and content hashes without full text',
  public.get_review_claim_dossiers(null,25,null)::text
    like '%' || :'prepared_revision_id' || '%'
  and public.get_review_claim_dossiers(null,25,null)::text like '%change_set%'
  and public.get_review_claim_dossiers(null,25,null)::text
    like '%prepared_snapshot_hash%'
  and position('normalized_text' in
    public.get_review_claim_dossiers(null,25,null)::text) = 0
);
select pg_temp.expect_sqlstate(
  format('select public.publish_revision(%L)', :'prepared_revision_id'),
  '42501'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000103', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.expect_sqlstate(
  format('select public.publish_revision(%L)', :'prepared_revision_id'),
  '55000'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000102', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select public.review_revision(
  :'prepared_revision_id', 'approve',
  'The prepared diff exactly matches the approved immutable dossier.'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000103', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select public.publish_revision(:'prepared_revision_id');

reset role;
select pg_temp.assert_true(
  'separate review and publish supersede old revision atomically',
  (
    select published_revision_id=:'prepared_revision_id'
    from public.topics where id='topic_congestion_pricing'
  )
  and (
    select status='superseded' from public.debate_revisions
    where id='cp_rev_001'
  )
  and exists (
    select 1 from public.claims
    where revision_id=:'prepared_revision_id'
      and origin_dossier_submission_id=:'replacement_dossier_id'::uuid
  )
  and exists (
    select 1 from public.evidence_links
    where revision_id=:'prepared_revision_id'
      and origin_dossier_submission_id=:'replacement_dossier_id'::uuid
      and research_role='counter' and label='does_not_support_claim'
  )
);

-- Public projection exposes reviewed provenance/excerpts and balanced research
-- roles, but neither private bodies/identities nor a truth verdict.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select pg_temp.assert_true(
  'public reviewed dossier is inspectable and identity-safe',
  jsonb_typeof(public.get_public_claim_dossiers(
    'topic_congestion_pricing'
  )) = 'array'
  and public.get_public_claim_dossiers('topic_congestion_pricing')::text
    like '%' || :'replacement_dossier_id' || '%'
  and public.get_public_claim_dossiers('topic_congestion_pricing')::text
    like '%🚲 mobility report: traffic fell 12 percent.%'
  and public.get_public_claim_dossiers('topic_congestion_pricing')::text
    like '%The same period saw traffic rise on boundary roads.%'
  and public.get_public_claim_dossiers('topic_congestion_pricing')::text
    like '%sha256:%'
  and public.get_public_claim_dossiers('topic_congestion_pricing')::text
    like '%reviewed_and_published%'
  and public.get_public_claim_dossiers('topic_congestion_pricing')::text
    like '%does not certify truth or research completeness%'
  and position('raw_content' in
    public.get_public_claim_dossiers('topic_congestion_pricing')::text) = 0
  and position('normalized_text' in
    public.get_public_claim_dossiers('topic_congestion_pricing')::text) = 0
  and position('submitted_by' in
    public.get_public_claim_dossiers('topic_congestion_pricing')::text) = 0
  and position('reviewed_by' in
    public.get_public_claim_dossiers('topic_congestion_pricing')::text) = 0
  and position('truth_verdict' in
    public.get_public_claim_dossiers('topic_congestion_pricing')::text) = 0
);
select pg_temp.expect_sqlstate(
  format(
    'select public.get_claim_dossier_detail(%L::uuid)',
    :'replacement_dossier_id'
  ),
  '42501'
);

-- Target a reviewed evidence link through the very argument/position that
-- references its claim. The challenge itself still requires support+counter.
reset role;
select e.id as target_evidence_link_id, a.position_id as challenge_position_id
from public.evidence_links e
join public.debate_arguments a
  on a.revision_id=e.revision_id
 and e.claim_id=any(a.claim_ids)
where e.revision_id=:'prepared_revision_id'
  and e.origin_dossier_submission_id=:'replacement_dossier_id'::uuid
  and a.origin_dossier_submission_id=:'replacement_dossier_id'::uuid
  and e.research_role='support'
limit 1 \gset

set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select (
  public.submit_claim_dossier(
    pg_temp.valid_payload(
      :'support_artifact_id'::uuid,
      :'counter_artifact_id'::uuid,
      :'prepared_revision_id',
      :'challenge_position_id'
    ) || jsonb_build_object(
      'submission_kind','challenge',
      'target_evidence_link_id', :'target_evidence_link_id',
      'claim_text',
        'Boundary-road traffic was higher during the same reporting period.',
      'argument_summary',
        'The boundary measurement contests an unqualified reading of the zone result.',
      'scope_note',
        'Contests only the geographic completeness of the published measurement.'
    ),
    '20000000-0000-0000-0000-000000000040'
  ) ->> 'id'
)::uuid as challenge_dossier_id \gset

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000102', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select public.review_claim_dossier(
  :'challenge_dossier_id'::uuid, 'approve',
  'The contestation is bounded and both exact passages are inspectable.'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000103', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select public.prepare_claim_dossier_revision(
  :'challenge_dossier_id'::uuid
) as challenge_prepare_result \gset
select (:'challenge_prepare_result'::jsonb->>'revision_id')
  as challenge_revision_id \gset

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000102', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select public.review_revision(
  :'challenge_revision_id', 'approve',
  'The challenge diff preserves the prior dossier and adds contestation.'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000103', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select public.publish_revision(:'challenge_revision_id');

reset role;
select pg_temp.assert_true(
  'challenge publishes a new revision without erasing prior history',
  (
    select published_revision_id=:'challenge_revision_id'
    from public.topics where id='topic_congestion_pricing'
  )
  and (
    select status='superseded' from public.debate_revisions
    where id=:'prepared_revision_id'
  )
  and exists (
    select 1 from public.claims
    where revision_id=:'prepared_revision_id'
      and origin_dossier_submission_id=:'replacement_dossier_id'::uuid
  )
  and exists (
    select 1 from public.claims
    where revision_id=:'challenge_revision_id'
      and origin_dossier_submission_id=:'challenge_dossier_id'::uuid
  )
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select pg_temp.assert_true(
  'public projection retains reviewed dossier plus visible contestation',
  public.get_public_claim_dossiers('topic_congestion_pricing')::text
    like '%' || :'replacement_dossier_id' || '%'
  and public.get_public_claim_dossiers('topic_congestion_pricing')::text
    like '%' || :'challenge_dossier_id' || '%'
  and public.get_public_claim_dossiers('topic_congestion_pricing')::text
    like '%Boundary-road traffic was higher during the same reporting period.%'
  and public.get_public_claim_dossiers('topic_congestion_pricing')::text
    like '%challenge%'
  and public.get_public_claim_dossiers('topic_congestion_pricing')::text
    like '%' || :'target_evidence_link_id' || '%'
  and position('Unavailable report' in
    public.get_public_claim_dossiers('topic_congestion_pricing')::text) = 0
);

rollback;
