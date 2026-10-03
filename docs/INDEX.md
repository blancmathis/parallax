---
context_room:
  id: project.documentation.index
---

# Documentation index

## Summary

Parallax is currently a read-only static site: three French debates
(English translations under `/en/`), all unreviewed drafts, prerendered with
their text in the HTML. Since 2026-10-03 the first-year product is an edited
publication with open challenges (decisions D16–D25 in
[02-product.md](02-product.md)). The earlier Supabase backend and the
verification-engine research are archived under the tag
`archive/workspace-20260913`. Graph, engine, and governance mechanisms remain
target designs unless a document explicitly says otherwise.

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
| **Current** | Present in the published static site; the owning document states whether evidence is structural, unit, browser E2E, backend, or manually observed. |
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
| See current status, the sequenced plan, and what is cut or deferred | [Roadmap](04-roadmap.md) |
| Understand how the North Star is measured | [Measurement pre-registration](protocol/2026-10-03-measurement-preregistration.md) |
| Recruit or brief a reviewer (FR) | [Kit de relecture](relecture/README.md) |
| Understand the current fixture contract and target graph model | [Data model](03-data-model.md) |
| Understand the long-term institutional direction | [Vision and identity](06-vision.md) |
| Understand the target contribution and review engine | [Objectivity engine](07-engine.md) |
| Understand target source and evidence governance | [Sources and evidence](08-sources.md) |
| Publish the site and pass the launch gate | [Publishing](deployment/publishing.md) |
| Contribute safely | [Contributing guide](../CONTRIBUTING.md) |
| Report a vulnerability | [Security policy](../SECURITY.md) |

## Document map

| Document | Owns | Lifecycle |
| --- | --- | --- |
| [01-vision.md](01-vision.md) | Original product problem and principles | Target direction |
| [02-product.md](02-product.md) | Product decisions, current prototype boundary, target MVP | Mixed, explicitly labelled |
| [03-data-model.md](03-data-model.md) | Current fixture contract orientation and target conceptual model | Mixed, explicitly labelled |
| [04-roadmap.md](04-roadmap.md) | Current status, phased plan, cut and deferred work | Current status + plan |
| [05-research.md](05-research.md) | Research process and unresolved product questions | Research guidance |
| [06-vision.md](06-vision.md) | Target identity, theory of change, and institutional boundaries | Target |
| [07-engine.md](07-engine.md) | Target engine behavior and invariants | Target, with current boundary |
| [08-sources.md](08-sources.md) | Target source/evidence policy and implementation requirements | Target, with current boundary |
| [Seed debate research](seed-debates/congestion-pricing.md) | Source notes for the congestion-pricing demonstration | Historical research record |
| [Measurement pre-registration](protocol/2026-10-03-measurement-preregistration.md) | Trial design, measures, sample size, decision rules | Frozen before data; dated amendments |
| [Kit de relecture](relecture/README.md) | Reviewer role, attestations, signature form, invitation (FR) | Operations |
| [Publishing](deployment/publishing.md) | Single publication path, launch gate, solo operations | Operations gate |

## Mechanical owners

Documentation explains the contracts; these files remain authoritative for
their exact executable forms:

- browser data types: [`app/src/types.ts`](../app/src/types.ts);
- fixture validation: [`app/scripts/check-fixtures.mjs`](../app/scripts/check-fixtures.mjs);
- browser commands: [`app/package.json`](../app/package.json);
- debate content and its history: [`app/src/data/`](../app/src/data/);
- frozen, unused backend: [`supabase/`](../supabase/) (archived work lives
  under the tag `archive/workspace-20260913`);
- repository CI contract: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
