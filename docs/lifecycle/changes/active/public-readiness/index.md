---
context_room:
  id: lifecycle.change.public-readiness
---

# Public-readiness vertical slice

## Summary

This active change coordinates the smallest end-to-end Parallax slice that a
new maintainer can run and test without mistaking mock, experimental, or target
behavior for current truth.

## Defines

The accepted current-to-target delta, constraints, evidence gates, rollback,
and affected documentation owners for public-readiness work.

## Does not define

This page does not own current product behavior, data schemas, source policy,
security policy, or deployment commands. Those remain in the linked current
owners and executable contracts.

## Objective

Deliver a globally testable prototype in which a contributor can submit a
sourced argument, the system can create a structured provisional dossier, a
reviewer can inspect and challenge the exact source use, and the resulting
revision and audit trail remain inspectable.

The output must be exact about scope, provenance, source version, uncertainty,
and review state. It is a provisional dossier, not an oracle of truth.

## Current baseline

- The default browser application renders three fixture-backed debates and a
  local mock contribution/review loop.
- Optional Supabase contracts cover authentication, contributions, revisions,
  aggregate signals, evaluations, source assessment, and deterministic seed
  analysis. A guarded disposable bootstrap and CI integration checks now exist,
  but the complete hosted multi-role journey is still experimental.
- The browser fixture contract supports optional source excerpts, but it does
  not yet provide complete exact-excerpt and artifact-version identity for each
  truth-apt claim.
- The global claim graph, full source-governance engine, and live six-stage AI
  pipeline remain target designs.

See [README current status](../../../../../README.md#current-status) and the
[implementation roadmap](../../../../04-roadmap.md) for current detail.

## Current-to-target delta

| Area | Current owner | Delta required by this change |
| --- | --- | --- |
| Product behavior | [Product decisions](../../../../02-product.md) | Complete one contributor → source inspection → review → publish journey while preserving provisional labels and human authority. |
| Data contracts | [Data model](../../../../03-data-model.md) | Align executable schemas, fixtures, database rows, exact excerpts, source versions, and audit references. |
| Implementation status | [Roadmap](../../../../04-roadmap.md) | Close the global-readiness gate with observed receipts rather than feature claims. |
| Claim review | [Objectivity engine](../../../../07-engine.md) | Prevent heuristic or unreviewed labels from becoming `established`; retain scope, date, and review evidence. |
| Source assurance | [Sources and evidence](../../../../08-sources.md) | Make exact versioned artifacts, locators, content identity, citation fidelity, uncertainty, and refresh behavior inspectable. |
| Operations | [Deployment runbook](../../../../deployment/deploy-runbook.md) | Provide a disposable, reproducible backend path before calling full-stack behavior current. |
| Security | [Security policy](../../../../../SECURITY.md) | Exercise authorization and untrusted-source boundaries without claiming production assurance. |

## Constraints

- Preserve the current no-winner, no-global-source-score, and human-review
  boundaries.
- Keep Current, Mock, Experimental, and Target visibly distinct in UI,
  documentation, logs, and test evidence.
- Do not publish a truth-apt source label without an exact artifact version,
  excerpt locator, content identity, scope, and review state.
- Do not carry an assessment silently across a changed source artifact.
- Treat fetched documents as untrusted input; never expose secrets to the
  browser or source-processing context.
- Do not describe provider connectivity as live analysis.
- Keep normative claims distinct from factual evidence labels.

## Acceptance evidence

This change is complete only when a new maintainer can use tracked instructions
to produce all of the following from a clean clone:

1. a successful repository QA receipt using commands that exist in
   [`app/package.json`](../../../../../app/package.json);
2. an observed browser E2E receipt for the default fixture and local mock flow;
3. a disposable backend receipt covering migrations, RLS, Edge Function,
   contributor, reviewer, publication, and audit behavior;
4. an observed source receipt showing exact artifact identity, excerpt,
   locator, retrieval state, scoped label, human decision, and source-change
   handling;
5. an observed failure receipt for unavailable sources and invalid analysis;
6. a documentation link/status audit with no competing current owner or
   unlabelled target claim;
7. explicit confirmation that no live-model or production-security claim was
   inferred from mock or experimental evidence.

Passing type checks or structural fixture checks alone is insufficient evidence
for the behavioral and source-assurance items.

## Rollback

Keep new backend or model-dependent behavior gated until the full acceptance
receipt exists. If a change mislabels provisional material, weakens source
traceability, or breaks the default fixture experience, disable that new path
and restore the last working current behavior while retaining audit records and
the failing test case. Reverting this change document does not revert runtime
code; rollback must follow the affected implementation owner's procedure.
