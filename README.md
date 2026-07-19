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

- The browser app includes English and French interfaces and three sourced
  demonstration debates.
- It runs without a backend in a read-only fixture mode.
- An optional Supabase backend adds authentication, contributions, review,
  revisions, position signals, source assessments, and an analysis pipeline.
- The analysis pipeline uses deterministic mock output by default. Live model
  use is optional, server-side, and explicitly configured.
- The project does not yet provide production guarantees, comprehensive topic
  coverage, or automated factual verification.

## Run the app

Requirements: Node.js 22 or newer and npm.

```bash
git clone https://github.com/Swarek/parallax.git
cd parallax/app
npm ci
npm run dev
```

The printed local URL opens the fixture-backed version. No account, database,
or API key is required.

Useful checks:

```bash
npm run check
npm run lint
npm run check:fixtures
SITE_ORIGIN=https://example.com VITE_SITE_ORIGIN=https://example.com npm run build
```

For the optional Supabase deployment, start with
[`docs/deployment/deploy-runbook.md`](docs/deployment/deploy-runbook.md). Never
put service-role, database, JWT, or model-provider secrets in frontend
variables.

## What is implemented

- Structured positions, arguments, claims, evidence labels, values, and
  trade-offs.
- Source panels that describe claim-source alignment rather than assigning a
  global reliability score.
- Contribution drafts, human review, revision publishing, and audit history.
- Position signals with vote-before-reveal behavior.
- Reviewer claim evaluations and source-integrity assessments.
- Keyboard-accessible, responsive English and French interfaces.
- Static fixture fallback plus an optional Supabase-backed workflow.
- A guarded seed-analysis edge function with mock and opt-in live-model modes.

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
| `docs/01-vision.md` | Product problem and principles |
| `docs/03-data-model.md` | Main data contracts |
| `docs/04-roadmap.md` | Current implementation roadmap |
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
