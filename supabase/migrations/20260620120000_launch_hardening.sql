-- Launch hardening (pre-go-live). All additive: two CHECK constraints, one
-- function tweak, and a view recreate that masks identity. No grant/RLS change.

-- ── B1 — URLs must be http(s). The client guards at render-time (safeHttpUrl)
-- and at submit; this is the authoritative gate so a javascript:/data: URL can
-- never PERSIST — and thus never reach the anon-readable published payload via
-- the contribution merge.
alter table public.contributions
  add constraint contributions_url_http
  check (url is null or url ~* '^https?://');
-- Sources also allow the mock-AI pipeline's 'about:blank' placeholder
-- (complete_mock_ai_job uses it when a retrieval carries no url). It is inert —
-- safeHttpUrl renders it as a non-link — so it is safe to persist; the point of
-- the constraint is to block javascript:/data:/vbscript: scheme injection.
alter table public.sources
  add constraint sources_url_http
  check (url is null or url = 'about:blank' or url ~* '^https?://');

-- ── H2 (deferred, documented) — the audit asked whether a single endorser per
-- camp should be able to mint a cross-camp verdict. The brigade protection that
-- matters is already in place and unchanged: bridge_min_camps() = 2 means a
-- single camp (a majority of ANY size on one side) can NEVER bridge a claim — it
-- stays pending_single_camp (rls_matrix test (f)). Endorsing also requires an
-- admin-granted reviewer/admin role, so this path is not open to anonymous
-- signups. Raising bridge_k() from 1 to 2 (require >= 2 concurring reviewers per
-- camp) is a corpus-QUALITY knob, not an anti-brigade fix; it only bites once a
-- real reviewer corps exists, and exercising it needs >= 4 reviewer accounts the
-- seed does not have. We therefore raise it at reviewer onboarding (with accounts
-- + a matching rls_matrix case) rather than ship an untested threshold. Bridging
-- ships latent at launch (no reviewers, no rows), so k = 1 changes nothing today.

-- ── B2 — never leak a real auth.users UUID to the anonymous published payload.
-- created_by / published_by are editorial-process actors the UI never renders →
-- emit a constant. audit actor_id keeps its string label for ai/system rows and
-- drops to the actor_type for human (admin/user) rows. Everything else identical
-- to the original view (security_invoker; published topics+revisions only).
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
        'actor_id', case
          when ae.actor_type in ('ai', 'system') then coalesce(ae.actor_id, ae.actor_type)
          else ae.actor_type
        end,
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
