---
context_room:
  id: project.documentation.index
---

# Documentation index

## Summary

Parallax is currently a browser prototype with a fixture-backed demonstration,
a local mock contribution/review loop, and an experimental Supabase path. The
larger verification, graph, source-governance, and AI mechanisms remain target
designs unless a document explicitly says otherwise.

## Defines

This page is the navigation entry point for the tracked project documentation
and the shared vocabulary used to distinguish current, mock, experimental, and
target behavior.

## Does not define

This page does not own product behavior, data contracts, implementation status,
security guarantees, or deployment procedures. Follow the linked owner for
each subject.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| **Current** | Present in the default fixture-backed browser app; the owning document states whether evidence is structural, unit, browser E2E, backend, or manually observed. |
| **Mock** | Demonstrates a flow with local or deterministic data; it is not evidence of production behavior or factual verification. |
| **Experimental** | Code and/or database contracts exist, but the path requires optional infrastructure and is not yet proven by the default end-to-end validation. |
| **Target** | Product or architecture direction. It must not be described as implemented until code, operations, and validation evidence agree. |

The target output is an **exact, structured, source-grounded provisional
dossier**, not an oracle of truth. Statuses such as `established` are scoped,
dated, revisable procedural conclusions; they must never be inferred from an
unreviewed fixture label or a model answer alone.

## Start by task

| Reader task | Canonical owner |
| --- | --- |
| Understand what can be run now | [Repository README](../README.md#current-status) |
| Run the browser prototype and checks | [Repository README](../README.md#run-the-app) |
| Understand product decisions and the bounded MVP | [Product scope and decisions](02-product.md) |
| Compare implemented, mock, experimental, and target work | [Roadmap](04-roadmap.md) |
| Follow the transversal public-readiness change | [Public-readiness vertical slice](lifecycle/changes/active/public-readiness/index.md) |
| Understand the current fixture contract and target graph model | [Data model](03-data-model.md) |
| Understand the long-term institutional direction | [Vision and identity](06-vision.md) |
| Understand the target contribution and review engine | [Objectivity engine](07-engine.md) |
| Understand target source and evidence governance | [Sources and evidence](08-sources.md) |
| Deploy the optional Supabase path | [Deployment runbook](deployment/deploy-runbook.md) |
| Decide whether an environment is promotable | [Operations readiness](deployment/operations-readiness.md) |
| Contribute safely | [Contributing guide](../CONTRIBUTING.md) |
| Report a vulnerability | [Security policy](../SECURITY.md) |

## Document map

| Document | Owns | Lifecycle |
| --- | --- | --- |
| [01-vision.md](01-vision.md) | Original product problem and principles | Target direction |
| [02-product.md](02-product.md) | Product decisions, current prototype boundary, target MVP | Mixed, explicitly labelled |
| [03-data-model.md](03-data-model.md) | Current fixture contract orientation and target conceptual model | Mixed, explicitly labelled |
| [04-roadmap.md](04-roadmap.md) | Current implementation status and completion gates | Current status + target work |
| [05-research.md](05-research.md) | Research process and unresolved product questions | Research guidance |
| [06-vision.md](06-vision.md) | Target identity, theory of change, and institutional boundaries | Target |
| [07-engine.md](07-engine.md) | Target engine behavior and invariants | Target, with current boundary |
| [08-sources.md](08-sources.md) | Target source/evidence policy and implementation requirements | Target, with current boundary |
| [Seed debate research](seed-debates/congestion-pricing.md) | Source notes for the congestion-pricing demonstration | Historical research record |
| [Deployment runbook](deployment/deploy-runbook.md) | Hosted Supabase deployment procedure | Operations |
| [Operations readiness](deployment/operations-readiness.md) | Environment ownership, recovery, observability, and promotion evidence | Operations gate |
| [Public-readiness vertical slice](lifecycle/changes/active/public-readiness/index.md) | Accepted current-to-target delta and completion evidence | Active change |

## Mechanical owners

Documentation explains the contracts; these files remain authoritative for
their exact executable forms:

- browser data types: [`app/src/types.ts`](../app/src/types.ts);
- fixture validation: [`app/scripts/check-fixtures.mjs`](../app/scripts/check-fixtures.mjs);
- browser commands: [`app/package.json`](../app/package.json);
- database and RLS contracts: [`supabase/migrations/`](../supabase/migrations/);
- server analysis behavior and tests:
  [`supabase/functions/analyze-seed/`](../supabase/functions/analyze-seed/);
- SQL policy and hardening tests: [`supabase/tests/`](../supabase/tests/);
- repository CI contract: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
