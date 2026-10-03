# Roadmap

This document owns implementation status and the evidence required to move a
capability from target to current. Product policy belongs in
[02-product.md](02-product.md); conceptual data and engine targets belong in
[03-data-model.md](03-data-model.md), [07-engine.md](07-engine.md), and
[08-sources.md](08-sources.md).

The build principle remains the smallest loop that proves a useful structured
dossier:

> seed packet → provisional structure → debate page → contribution → review →
> revised debate page.

The dossier must be exact about its sources, scope, provenance, uncertainty,
and review state. It is provisional and revisable, not an oracle of truth.

## Status legend

| Status | Meaning |
| --- | --- |
| **Current** | Present in the default fixture-backed browser app; available validation evidence is stated separately and may be structural rather than behavioral. |
| **Mock** | Demonstrates the product loop with local or deterministic artifacts. |
| **Experimental** | Optional code or database contracts exist and may have local integration tests, but no complete release receipt proves the hosted end-to-end behavior. |
| **Target** | Required behavior remains to be implemented and validated. |

## Current validation surface

The frontend commands listed in [README.md](../README.md#run-the-app) and defined
by [`app/package.json`](../app/package.json) cover TypeScript, lint, fixture
structure, unit/runtime-contract tests, coverage, a test-origin production
build, bundle budgets, dependency audit, and fixture/local-mock browser E2E.

The guarded local bootstrap in
[`scripts/bootstrap-local.sh`](../scripts/bootstrap-local.sh), documented by the
[deployment runbook](deployment/deploy-runbook.md#rebuild-the-local-stack-from-scratch),
rebuilds a disposable Supabase stack, runs the SQL authorization/hardening
matrices, and smokes Auth, REST, and deterministic Edge analysis. CI owns
separate frontend, browser, Edge, and disposable-Supabase jobs.

These checks still do **not** prove a hosted deployment, real Cloudflare preview
routing, backup/restore, observability, a live model, semantic citation
correctness, or the complete multi-role browser journey through publication.

## Milestone 0 — Project setup **Current**

- Browser application under `app/` using Vite, React, and TypeScript.
- Reproducible dependency installation through `npm ci`.
- Frontend unit, coverage, fixture, browser, build, bundle, and dependency
  checks, plus Edge and disposable-Supabase CI jobs.
- Tracked contribution, security, and hosted-deployment guidance.

## Milestone 1 — Fixture-backed debates **Current**

- Three English/French demonstration debates render positions, arguments,
  claims, evidence labels, sources, values, trade-offs, and audit events.
- Readers can inspect the debates without authentication or infrastructure.
- Truth-apt fixture claims may have scoped evidence labels; normative claims
  are not forced into factual evidence labels.
- Labels and browser-derived summaries are demonstration state. They are not
  reviewed factual conclusions.

Completion still missing at this layer:

- exact excerpts and locators for every truth-apt claim, rather than partial
  coverage in selected fixture links;
- versioned source-artifact identity and freshness handling;
- semantic citation checks, not only structural fixture checks.

## Milestone 2 — Contribution draft flow **Mock / experimental**

**Mock:** the default browser accepts contribution drafts and stores them in
`localStorage`. Drafts do not mutate tracked fixtures.

**Experimental:** the Supabase client and migrations include authenticated,
persistent contribution paths. Disposable RLS and backend smokes now exercise
the contract, but the complete hosted user journey and failure surface remain
unproven.

## Milestone 3 — Review and revision flow **Mock / experimental**

**Mock:** a local reviewer can approve or reject a draft, record a rationale,
and create a visible revision overlay and audit event.

**Experimental:** Supabase contracts exist for reviewer decisions, canonical
contribution merge, immutable published revisions, and audit records.

Still required before this is current full-stack behavior:

- inspection of current and previous revisions in the user interface;
- a browser E2E receipt covering authenticated contributor → reviewer → admin
  merge → publish → audit against the disposable backend;
- the same receipt on an isolated HTTPS shared-test deployment.

## Milestone 4 — Seed analysis **Mock / experimental**

- **Experimental:** a signed-in user can submit a seed packet through the
  Supabase RPC path.
- **Mock:** the Edge Function checks source accessibility and produces a
  deterministic reviewable draft.
- **Unavailable:** a live-provider request fails explicitly; no live model call
  or provider-connectivity claim is implemented.

Target work:

- implement the six reviewable stages in
  [02-product.md](02-product.md#ai-pipeline-contract);
- validate every output against an executable schema;
- retain prompts, model/version, source inputs, output identity, and failure
  evidence in an auditable job record;
- fail closed and present invalid output as a review problem;
- keep every generated object explicitly unreviewed until a human decision.

## Milestone 5 — Versioned sources and evidence excerpts **Experimental / target**

**Experimental:** the database schema can store source excerpts and connect an
evidence row to an excerpt. The mock analysis path records source access status
and can create provisional rows.

Target completion requires:

- an exact source-artifact version or immutable snapshot identity;
- canonical URL, publication/version date, retrieval date, content digest, and
  access outcome;
- exact excerpt plus page, paragraph, timestamp, or equivalent locator;
- explicit separation of citation fidelity, inferential warrant, and corpus
  weight;
- refresh/change handling that never silently carries a label to a new source
  version;
- human review evidence for any public procedural status.

## Milestone 6 — General topic creation **Experimental / target**

**Experimental:** a proposal form, seed-packet RPC, deterministic analysis, and
review queue exist behind Supabase configuration.

Target completion requires general-purpose source handling, duplicate/scope
resolution, safe error recovery, reviewer publication of the first revision,
and an E2E journey proven outside the curated fixtures.

## Milestone 7 — Global claim graph and source governance **Target**

**Experimental:** the database contains a simple two-camp count gate for claim
evaluations. It is not matrix factorization, does not prove anti-coordination,
and does not establish production thresholds or representative coverage.

The following remain architecture targets, not current capabilities:

- global claim identity and scoped local uses;
- graph lifecycle, deduplication, dependency alerts, and version propagation;
- adversarial evidence dossiers and coverage ledger;
- cross-group procedural review with privacy and anti-coordination safeguards;
- rotating review functions, appeals, and auditable governance;
- reusable, versioned source artifacts and scoped sourcing claims.

## Global readiness gate

Parallax is ready for global prototype testing only when a new maintainer can,
from a clean clone and documented prerequisites:

1. run the fixture app and every repository check;
2. provision a disposable backend without guessing ports, roles, or secrets;
3. submit a sourced argument as a contributor;
4. inspect exact source versions and excerpts;
5. review, challenge, publish, and inspect the resulting audit trail;
6. verify authorization boundaries with automated RLS tests;
7. exercise failure states for unavailable sources and invalid analysis;
8. distinguish every mock, unreviewed, contested, and reviewed state in the UI;
9. repeat the flow through an automated browser test.

Until those receipts exist, the project is a useful browser prototype plus an
experimental backend—not a complete verification service.

## Explicitly later

Do not start before the core loop is reproducible: public reputation, agent
consensus marketplaces, forkable debates, broad discovery, large-scale
governance automation, mobile applications, real-time rooms, and large-scale
moderation queues.
