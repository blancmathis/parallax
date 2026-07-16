# Roadmap

Build principle: the smallest thing that proves the debate-structure loop —

> seed packet → AI structure → debate page → contribution → review → revised
> debate page.

## Milestone 0 — Project Setup ✅

- [x] Git repository.
- [x] README explaining the docs and how to run the app.
- [x] Minimal web app starts locally (`app/`, Vite + React + TypeScript).
- [x] Type checks run with one command (`npm run check`).
- [x] No product features beyond what Milestone 1 requires.

## Milestone 1 — Static Seeded Debate Page ✅

Prove the information architecture before any AI automation.

- [x] Three seeded debates stored as JSON fixtures (`app/src/data/*.json`):
      congestion pricing, smartphones in schools, nuclear power.
- [x] The app renders: topic, positions, arguments, claims, evidence labels,
      sources, values, trade-offs, audit events.
- [x] Users can switch between positions.
- [x] Every claim visibly links to at least one evidence label.
- [x] Usable without auth, AI keys, or database setup.

Spike questions this milestone answers:

- Does the data model render cleanly?
- Are positions, claims, evidence, values, and trade-offs understandable on
  one screen?
- Is the audit log visible without overwhelming the reader?
- What is the main navigation unit? → **the position**.

Stop rule: if the static page feels confusing, fix the model and UI before
adding AI.

## Milestone 2 — Contribution Draft Flow ✅ *(prototype)*

- [x] A user can submit a draft contribution (new claim, new source,
      challenge to an evidence label, challenge to a steelman, proposed new
      position) from any debate page.
- [x] Drafts appear as pending and never mutate the published debate.

*Prototype note:* drafts persist in `localStorage` (`app/src/lib/store.ts`).
Server-side persistence arrives with Milestone 4+.

## Milestone 3 — Review and Revision Flow ✅ *(prototype)*

- [x] A reviewer can approve or reject a pending contribution (`/review`).
- [x] Approved contributions merge into the live debate view and bump a
      local revision number.
- [x] Rejected contributions keep a visible review rationale.
- [x] The audit log records every submission, decision, and publication.
- [ ] Users can inspect at least the current and previous revision
      *(deferred: needs real versioned storage, not a client-side overlay)*.

## Milestone 4 — AI Analysis for One Seed Packet

- [ ] A seed packet can be submitted.
- [ ] A server-side pipeline runs the six AI stages
      ([02-product.md](02-product.md#ai-pipeline-contract)).
- [ ] AI output is validated against [03-data-model.md](03-data-model.md);
      invalid output fails safely and surfaces as a review problem.
- [ ] All generated objects are marked AI-generated and unreviewed.

## Milestone 5 — Source Retrieval and Evidence Excerpts

- [ ] Source URLs are fetched or marked unavailable.
- [ ] Extracted source text is stored as excerpts; evidence labels point to
      exact excerpts.
- [ ] The UI distinguishes: source not found / found but irrelevant / supports
      the claim / contradicts the claim.

This is where "verified" becomes concrete instead of rhetorical.

## Milestone 6 — General Topic Creation

- [ ] A user can create a new topic from a seed packet.
- [ ] The system creates a draft debate structure; a reviewer publishes the
      first revision.
- [ ] The app lists available topics.
- [ ] Topic creation checks for an existing debate (anchor-claim dedup +
      question similarity + scope comparison) before creating, and offers the
      existing debate / a sub-debate / a parent node instead of a duplicate
      ([07-engine.md](07-engine.md)).

## Milestone 7 — Global Claim Graph & Source Engine

Post-core-loop. The backend the engine ([07-engine.md](07-engine.md)) and
source layer ([08-sources.md](08-sources.md)) imply, once the debate-structure
loop holds.

- [ ] Claim-graph store with lifecycle (proposed → live → merged/retired).
- [ ] Embedding dedup service for claims **and** debates.
- [ ] Bridging-consensus scorer plus its guardrails.
- [ ] Coverage ledger.
- [ ] Governance engine: rules-floor, four statuses, rotating juries, appeals.
- [ ] Sourcing-claim pipeline.

## Explicitly Later

Do not start before the core loop works: public profiles, reputation, agent
consensus verification, forkable debates, search and discovery, governance
tooling, mobile app, real-time debate rooms, large-scale moderation queues.
