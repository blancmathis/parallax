-- =========================================================================
-- SOURCING FLOOR v1 (docs/08 §16, §19, §20.1, §3/§4, §22). ADDITIVE ONLY.
--
-- A published, RULES-BASED, READ-TIME-SCOPED assessment of a source's INTEGRITY
-- (is this a credible source AT ALL, by mechanical rules) — computed as a pure
-- FUNCTION of declared source attributes, fired WITHOUT bridging or voting, NEVER
-- declaring a source true/false, kept DISTINCT from relevance (evidence_links.label,
-- untouched). docs/08 Layer 1 ("the floor") — the only layer that ships in v1.
--
-- CAPTURE-RESISTANCE (load-bearing):
--  * The library row stores ONLY vetted mechanical ATTRIBUTES (source-intrinsic,
--    §22 verify-once). The VERDICT is computed at READ time, PER-TOPIC, against
--    that topic's claim_types + bridged controversy — never frozen onto one topic
--    then leaked to another (§1 "never reliable in the abstract", §14).
--  * `controversial` is DERIVED server-side from the already-bridged
--    claim_evaluations.state in {contested,values} (cross-camp by construction) —
--    NEVER a free reviewer boolean (closes the §0/§4 single-assessor lever on R1).
--  * below_floor for fabrication/accountability requires an attached EXTERNAL
--    PROOF reference (§16 "proof, not a detector score"); without it those rules
--    soften to context_required.
--
-- STABLE IDENTITY = normalized url (source_key). NOT sources.id (revision-scoped).
--
-- DOES NOT TOUCH: published_debate_fixtures, publish/review pipeline, content RLS,
-- immutability triggers, or shipped D15/G2/bridging/merge objects.
--
-- PRIVACY (red line): assessed_by stored for audit, NEVER exposed. Table is
-- staff-only; the read RPC omits assessed_by; audit -> reviewer-only bridge_audit
-- (NOT public.audit_events, which the anon view embeds).
--
-- DEFERRED (named, NOT faked): per-source dossiers + objection economy (§18);
-- bridging GATE on contested integrity calls (§20.3); rotating juries (§20.4);
-- learned trust (§6); full per-domain matrix / GRADE / RoB2 (§4); agent
-- auto-extraction (§12/§22.1); removal / noindex (§15/§16 — v1 LABELS only);
-- search-parity (§19); content_hash artefact-versioning (§14).
-- =========================================================================

-- 1. STABLE-IDENTITY NORMALIZER. Immutable, identity-free. MUST be byte-identical
--    to the TS twin in app/src/lib/sourceKey.ts: trim; lowercase whole string;
--    http->https; strip #fragment; drop utm_*/fbclid/gclid (rebuild query, no
--    orphan separators); strip trailing slash.
create or replace function public.source_key(p_url text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  s     text := lower(btrim(coalesce(p_url, '')));
  base  text;
  qs    text;
  parts text[];
  kept  text[] := '{}';
  kv    text;
begin
  if s = '' then return ''; end if;
  s := regexp_replace(s, '^http://', 'https://');
  s := regexp_replace(s, '#.*$', '');
  if position('?' in s) > 0 then
    base := split_part(s, '?', 1);
    qs   := substring(s from position('?' in s) + 1);
    parts := regexp_split_to_array(qs, '&');
    foreach kv in array parts loop
      if kv <> '' and split_part(kv, '=', 1) !~ '^(utm_.*|fbclid|gclid)$' then
        kept := kept || kv;
      end if;
    end loop;
    if array_length(kept, 1) is null then s := base;
    else s := base || '?' || array_to_string(kept, '&'); end if;
  end if;
  s := regexp_replace(s, '/+$', '');
  return s;
end;
$$;

-- 2. THE LIBRARY ROW — one per STABLE source identity. ATTRIBUTES ONLY (+ proof
--    + audit). NO claim_id, NO relevance, NO frozen verdict, NO topic.
create table public.source_integrity (
  source_key   text primary key,
  content_hash text,
  sample_url   text not null default '',

  content_genre text not null default 'unknown'
    check (content_genre in
      ('primary','reporting','analysis','opinion','sponsored','ugc','ai_generated','unknown')),
  editorial_accountability text not null default 'unknown'
    check (editorial_accountability in
      ('named_masthead','named_author','org_only','anonymous','none','unknown')),
  correction_policy text not null default 'unknown'
    check (correction_policy in ('documented','informal','none','unknown')),
  fabrication_record text not null default 'none_known'
    check (fabrication_record in
      ('none_known','corrected_history','retraction_history','documented_fabrication')),
  independence text not null default 'unknown'
    check (independence in
      ('independent','funded_disclosed','funded_undisclosed','self_interested','unknown')),
  expertise_basis text not null default 'unknown'
    check (expertise_basis in ('peer_reviewed','domain_expert','journalistic','lay','none','unknown')),
  identity_basis text not null default 'unknown'
    check (identity_basis in ('verified','pseudonymous','unverified','unknown')),
  sensitive_domain text not null default 'none'
    check (sensitive_domain in ('none','health','law','finance','living_persons')),

  proof_ref text not null default '',

  assessed_by  uuid references auth.users(id),
  assessed_at  timestamptz not null default now(),
  is_demo      boolean not null default false
);
create index on public.source_integrity (content_hash);
alter table public.source_integrity enable row level security;

-- Staff-only direct select (holds assessed_by). Public path is the definer RPC.
create policy source_integrity_select_staff on public.source_integrity
  for select using (public.is_reviewer());

-- 3. THE FLOOR AS CODE — a PURE, deterministic rule function. Order: first hard
--    rule wins; else softest caveat; else meets_floor. `controversial` arrives
--    ALREADY DERIVED from bridged state. `has_proof` gates the §16 hard rules.
create or replace function public.source_floor_verdict(
  p_content_genre            text,
  p_editorial_accountability text,
  p_correction_policy        text,
  p_fabrication_record       text,
  p_independence             text,
  p_expertise_basis          text,
  p_identity_basis           text,
  p_sensitive_domain         text,
  p_controversial            boolean,
  p_claim_types              text[],
  p_has_proof                boolean
) returns table (verdict text, rule_id text)
language sql
immutable
set search_path = public
as $$
  select
    case
      when p_content_genre = 'ugc' and p_identity_basis = 'unverified'
           and ('factual' = any(coalesce(p_claim_types, '{}'::text[])))
           and coalesce(p_controversial, false)
        then 'below_floor'
      when p_fabrication_record = 'documented_fabrication'
        then case when coalesce(p_has_proof, false) then 'below_floor' else 'context_required' end
      when p_editorial_accountability in ('anonymous','none')
           and p_correction_policy in ('none','unknown')
        then case
               when ('factual' = any(coalesce(p_claim_types,'{}'::text[]))
                  or 'causal'  = any(coalesce(p_claim_types,'{}'::text[])))
                 then case when coalesce(p_has_proof,false) then 'below_floor' else 'context_required' end
               else 'context_required'
             end
      when coalesce(p_sensitive_domain,'none') <> 'none'
           and p_expertise_basis in ('lay','none')
        then case
               when p_content_genre in ('ugc','opinion')
                    and ('factual' = any(coalesce(p_claim_types,'{}'::text[])))
                    and coalesce(p_has_proof,false)
                 then 'below_floor'
               else 'context_required'
             end
      when p_content_genre in ('opinion','analysis')
           and ('factual' = any(coalesce(p_claim_types,'{}'::text[]))
             or 'causal'  = any(coalesce(p_claim_types,'{}'::text[])))
        then 'attribution_required'
      when p_content_genre in ('sponsored','ai_generated')
           or p_independence in ('funded_undisclosed','self_interested')
        then 'context_required'
      else 'meets_floor'
    end as verdict,
    case
      when p_content_genre = 'ugc' and p_identity_basis = 'unverified'
           and ('factual' = any(coalesce(p_claim_types,'{}'::text[])))
           and coalesce(p_controversial, false)
        then 'ugc_controversial_factual'
      when p_fabrication_record = 'documented_fabrication'
        then 'documented_fabrication'
      when p_editorial_accountability in ('anonymous','none')
           and p_correction_policy in ('none','unknown')
        then 'no_editorial_accountability'
      when coalesce(p_sensitive_domain,'none') <> 'none' and p_expertise_basis in ('lay','none')
        then 'high_bar_domain'
      when p_content_genre in ('opinion','analysis')
           and ('factual' = any(coalesce(p_claim_types,'{}'::text[]))
             or 'causal'  = any(coalesce(p_claim_types,'{}'::text[])))
        then 'opinion_attribution'
      when p_content_genre in ('sponsored','ai_generated')
           or p_independence in ('funded_undisclosed','self_interested')
        then 'conflict_context'
      else 'no_floor_rule'
    end as rule_id;
$$;

-- 4. WRITE PATH. SECURITY DEFINER, reviewer-gated. Stores ATTRIBUTES ONLY.
create or replace function public.assess_source_floor(
  p_topic_id                 text,
  p_url                      text,
  p_content_genre            text,
  p_editorial_accountability text,
  p_correction_policy        text,
  p_fabrication_record       text,
  p_independence             text,
  p_expertise_basis          text,
  p_identity_basis           text,
  p_sensitive_domain         text default 'none',
  p_proof_ref                text default '',
  p_content_hash             text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_key   text := public.source_key(p_url);
begin
  if v_actor is null or not public.is_reviewer() then
    raise exception 'reviewer role required';
  end if;
  if not public.can_read_topic(p_topic_id) then
    raise exception 'topic not readable';
  end if;
  if v_key = '' then
    raise exception 'source url required';
  end if;

  insert into public.source_integrity (
    source_key, content_hash, sample_url,
    content_genre, editorial_accountability, correction_policy, fabrication_record,
    independence, expertise_basis, identity_basis, sensitive_domain, proof_ref, assessed_by
  ) values (
    v_key, p_content_hash, p_url,
    coalesce(p_content_genre,'unknown'), coalesce(p_editorial_accountability,'unknown'),
    coalesce(p_correction_policy,'unknown'), coalesce(p_fabrication_record,'none_known'),
    coalesce(p_independence,'unknown'), coalesce(p_expertise_basis,'unknown'),
    coalesce(p_identity_basis,'unknown'), coalesce(p_sensitive_domain,'none'),
    coalesce(p_proof_ref,''), v_actor
  )
  on conflict (source_key) do update set
    content_hash             = coalesce(excluded.content_hash, public.source_integrity.content_hash),
    sample_url               = excluded.sample_url,
    content_genre            = excluded.content_genre,
    editorial_accountability = excluded.editorial_accountability,
    correction_policy        = excluded.correction_policy,
    fabrication_record       = excluded.fabrication_record,
    independence             = excluded.independence,
    expertise_basis          = excluded.expertise_basis,
    identity_basis           = excluded.identity_basis,
    sensitive_domain         = excluded.sensitive_domain,
    proof_ref                = excluded.proof_ref,
    assessed_by              = excluded.assessed_by,
    assessed_at              = now();

  insert into public.bridge_audit (topic_id, actor_id, event_type, detail)
    values (p_topic_id, v_actor, 'source_assessed', 'assessed ' || v_key);

  return jsonb_build_object('source_key', v_key, 'ok', true);
end;
$$;

-- 5. PUBLIC READ PATH. SECURITY DEFINER, can_read_topic-gated, identity-free.
--    Computes the verdict AT READ TIME, per-topic. controversial DERIVED from
--    bridged claim_evaluations.state; claim_types = this topic's union.
create or replace function public.get_source_floor(p_topic_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_types         text[];
  v_controversial boolean;
begin
  if not public.can_read_topic(p_topic_id) then
    return '[]'::jsonb;
  end if;

  select coalesce(array_agg(distinct ct), '{}'::text[]) into v_types
  from public.claims c
  join public.topics t on t.published_revision_id = c.revision_id
  cross join lateral unnest(c.claim_type) as ct
  where t.id = p_topic_id;

  select exists (
    select 1 from public.claim_evaluations
    where topic_id = p_topic_id and state in ('contested','values')
  ) into v_controversial;

  return coalesce((
    with topic_keys as (
      select distinct public.source_key(s.url) as source_key
      from public.topics t
      join public.sources s on s.revision_id = t.published_revision_id
      where t.id = p_topic_id and public.source_key(s.url) <> ''
    )
    select jsonb_agg(jsonb_build_object(
      'source_key',    si.source_key,
      'content_hash',  si.content_hash,
      'floor_verdict', fv.verdict,
      'rule_id',       fv.rule_id,
      'is_demo',       si.is_demo,
      'attributes', jsonb_build_object(
        'content_genre',            si.content_genre,
        'editorial_accountability', si.editorial_accountability,
        'correction_policy',        si.correction_policy,
        'fabrication_record',       si.fabrication_record,
        'independence',             si.independence,
        'expertise_basis',          si.expertise_basis,
        'identity_basis',           si.identity_basis,
        'sensitive_domain',         si.sensitive_domain
      )
    ) order by si.source_key)
    from public.source_integrity si
    join topic_keys tk on tk.source_key = si.source_key
    cross join lateral public.source_floor_verdict(
      si.content_genre, si.editorial_accountability, si.correction_policy,
      si.fabrication_record, si.independence, si.expertise_basis, si.identity_basis,
      si.sensitive_domain, v_controversial, v_types, (si.proof_ref <> '')
    ) fv
  ), '[]'::jsonb);
end;
$$;

-- 6. GRANTS / REVOKE (bridging discipline). NO table grant. The internal rule fn
--    is REVOKEd from anon/authenticated (Postgres/Supabase default EXECUTE).
grant execute on function public.source_key(text)        to anon, authenticated;
grant execute on function public.get_source_floor(text)  to anon, authenticated;
grant execute on function public.assess_source_floor(
  text, text, text, text, text, text, text, text, text, text, text, text
) to authenticated;
revoke execute on function public.source_floor_verdict(
  text, text, text, text, text, text, text, text, boolean, text[], boolean
) from public, anon, authenticated;
