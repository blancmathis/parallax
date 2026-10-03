# Parallax

**Parallax makes disagreement inspectable.**

Parallax is developed and maintained by **Peerlab**.

Parallax is an open-source platform for turning difficult public questions into
structured, auditable debate maps. Instead of flattening everything into a
comment thread, it separates positions, arguments, claims, sources, values,
trade-offs, review decisions, and revision history.

Parallax does not declare winners or present AI output as truth. It helps
readers inspect what each position depends on, where sources align with a
specific claim, and where disagreement is driven by values or uncertainty.

## Current status

Parallax is an actively developed prototype, not a finished public service.

| Layer | Status | What that means today |
| --- | --- | --- |
| Browser demonstrations | **Current** | English and French interfaces render three fixture-backed debates without an account, database, or API key. |
| Contribution and review loop | **Mock** | In the default app, drafts, decisions, revision bumps, and extra audit events are stored in browser `localStorage`; published fixtures are not mutated. |
| Supabase workflow | **Experimental** | Auth, contributions, revisions, position signals, claim evaluations, source assessments, and seed-packet analysis have code and database contracts. A guarded disposable local bootstrap and CI integration tests exist; no hosted full-stack release has been proven. |
| AI analysis | **Mock** | The usable analysis path produces deterministic mock artifacts. Requests for the unavailable live provider fail explicitly; there is no live model analysis path. |
| Verification engine | **Target** | Exact excerpts, versioned source artifacts, reproducible research, adversarial review, and scoped procedural conclusions are not yet implemented end to end. |

Parallax does not provide production guarantees, comprehensive topic coverage,
or automated factual verification. Its bounded target is an exact, structured,
source-grounded **provisional dossier**, not an oracle that declares truth.
The shared status vocabulary and documentation map live in
[`docs/INDEX.md`](docs/INDEX.md).

## Run the app

Requirements: Node.js `>=22.22.2 <23` or `>=24.15.0`, and npm `10.9.8`, as
declared by [`app/package.json`](app/package.json).

```bash
git clone https://github.com/Swarek/parallax.git
cd parallax/app
npm ci
npm run dev
```

The printed local URL opens the fixture-backed version. No account, database,
or API key is required. It proves the browser demonstration and local mock
workflow only; it does not exercise Supabase, RLS, the Edge Function, or a live
model provider.

The maintained frontend quality gates are:

```bash
npm run qa
npx playwright install chromium # first local browser run only
npm run qa:release
```

`qa` covers TypeScript, lint, fixture structure, unit/runtime-contract tests,
coverage, a test-origin production build, bundle budgets, and the production
dependency audit. `qa:release` adds the fixture-backed and local-mock Playwright
journeys. Neither command is backend proof.

For the destructive but disposable local Supabase bootstrap, role accounts,
backend/Edge checks, and optional hosted deployment, follow the exact
prerequisites and commands in
[`docs/deployment/deploy-runbook.md`](docs/deployment/deploy-runbook.md). Never
put service-role, database, JWT, or model-provider secrets in frontend
variables.

## What is implemented

Current in the default fixture-backed app:

- Structured positions, arguments, claims, evidence labels, values, and
  trade-offs.
- Source panels that describe claim-source alignment rather than assigning a
  global reliability score.
- Local mock contribution drafts, review decisions, revision overlays, and
  audit events.
- Demonstration position signals and browser-derived claim summaries.
- Keyboard-accessible, responsive English and French interfaces.

Experimental behind an optional Supabase configuration:

- authentication, persistent contribution/review paths, revision publication,
  position signals, claim evaluations, and source-integrity assessments;
- a guarded seed-analysis Edge Function whose output is currently
  deterministic mock data. The unavailable live-provider request fails closed.

Not implemented end to end:

- a six-stage live AI analysis pipeline or live model-provider integration;
- exact source excerpts and locators for every truth-apt claim;
- a versioned source-artifact registry with freshness and change handling;
- the global claim graph, cross-camp governance, and general-purpose factual
  verification described in the target documents.

The implementation roadmap and completion criteria live in
[`docs/04-roadmap.md`](docs/04-roadmap.md).

## Principles

1. **Structure over verdicts.** Organize the disagreement; do not manufacture a
   winner.
2. **Claim-source alignment is scoped.** A label describes one source's
   relationship to one claim, not universal truth or source quality.
3. **Every serious position deserves a steelman.** Fairness remains open to
   human review and correction.
4. **Values and trade-offs stay visible.** They are part of the disagreement,
   not noise to remove.
5. **Important transformations are auditable.** Published changes should have
   a traceable rationale and revision history.

## Repository map

| Path | Purpose |
| --- | --- |
| `app/` | Vite, React, and TypeScript browser application |
| `app/src/data/` | English and French demonstration fixtures |
| `supabase/migrations/` | Database schema, policies, and backend functions |
| `supabase/functions/` | Server-side analysis edge function |
| `supabase/tests/` | SQL security and behavior checks |
| `docs/INDEX.md` | Documentation navigation and status vocabulary |
| `docs/01-vision.md` | Product problem and principles |
| `docs/02-product.md` | Product decisions and bounded MVP |
| `docs/03-data-model.md` | Main data contracts |
| `docs/04-roadmap.md` | Current implementation roadmap |
| `docs/05-research.md` | Research process and open questions |
| `docs/06-vision.md` | Target identity and theory of change |
| `docs/07-engine.md` | Target contribution and review engine |
| `docs/08-sources.md` | Source-governance model |

## Contributing and security

Focused bug reports, source-alignment corrections, accessibility feedback, and
small documented improvements are welcome. Read
[`CONTRIBUTING.md`](CONTRIBUTING.md) before opening an issue or pull request.

Do not disclose vulnerabilities or credentials in public issues. Follow
[`SECURITY.md`](SECURITY.md) instead.

## License and third-party material

Original Peerlab-authored Parallax code and documentation are © 2026 Peerlab
and licensed under the [Apache License 2.0](LICENSE). External contributions,
sources, quoted material, names, marks, and linked third-party works remain
subject to their respective authors' or owners' terms. See [`NOTICE`](NOTICE)
and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
