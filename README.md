# Parallax

**Parallax makes disagreement inspectable.**

Parallax is developed and maintained by **Peerlab**.

Parallax is an open-source platform for turning difficult public questions into
structured, auditable debate maps. Instead of flattening everything into a
comment thread, it separates positions, arguments, claims, sources, values,
trade-offs, and the Git history of each dossier.

Parallax does not declare winners or present AI output as truth. It helps
readers inspect what each position depends on, where sources align with a
specific claim, and where disagreement is driven by values or uncertainty.

## Current status

Parallax is an actively developed prototype, not a finished public service.

| Layer | Status | What that means today |
| --- | --- | --- |
| Reading site | **Current** | French at `/`, English under `/en/`; three fixture-backed drafts with a prerendered reading body and no account, database, or API key. |
| Human review | **Pending** | Drafts were prepared with AI tools. No named reviewer or supporter has signed them yet; coverage is computed from the fixtures. |
| Source alignment | **Draft** | Labels and stored excerpts are inspectable but unreviewed. Links without an excerpt are marked as unverified. |
| Backend archive | **Frozen** | The retained `supabase/` tree is inactive; the reading site and CI do not use it. |

Parallax does not provide production guarantees, comprehensive topic coverage,
or automated factual verification. Its bounded target is an exact, structured,
source-grounded **provisional dossier**, not an oracle that declares truth.
The shared status vocabulary and documentation map live in
[`docs/INDEX.md`](docs/INDEX.md).

## Run the app

Requirements: Node.js `>=22.22.2 <23` or `>=24.15.0`, and npm `10.9.8`, as
declared by [`app/package.json`](app/package.json).

```bash
git clone https://github.com/blancmathis/parallax.git
cd parallax/app
npm ci
npm run dev
```

The printed local URL opens the fixture-backed reading site. No account,
database, or API key is required.

The maintained frontend quality gates are:

```bash
npm run qa
npx playwright install chromium # first local browser run only
npm run test:e2e
```

`qa` covers TypeScript, lint, fixture structure, repository metadata,
unit/runtime-contract tests, coverage, a test-origin production build, bundle
budgets, and the production dependency audit. The browser suite covers French
and English on desktop and mobile, language navigation, legal routes, and
reading a dossier without JavaScript.

Before publishing, complete the postal address and contact email in
[`app/src/config/identity.json`](app/src/config/identity.json), set `SITE_ORIGIN`
and `VITE_SITE_ORIGIN` to the same controlled origin, and build again. Then run
`npm run check:launch`. It fails while identity placeholders remain, while a
legal page is missing, or while the build still contains an old placeholder.
`npm run qa:release` includes this publication gate after the frontend checks.

## What is implemented

Current in the default fixture-backed app:

- Structured positions, arguments, claims, evidence labels, values, and
  trade-offs.
- Source panels that describe claim-source alignment rather than assigning a
  global reliability score.
- A draft notice, AI preparation disclosure, computed source/excerpt coverage,
  and a link to each fixture's Git history.
- Keyboard-accessible, responsive French and English reading interfaces.
- A short home page, project page, legal notice, privacy page, and contact page.
- Static HTML reading content hydrated by React 19.

Not implemented end to end:

- named human review, supporter signatures, or reviewed publication;
- exact source excerpts and locators for every truth-apt claim;
- a versioned source-artifact registry with freshness and change handling;
- cross-camp governance and the general-purpose verification in the target
  documents.

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
| `app/` | Vite, React 19, TypeScript, and static HTML generation |
| `app/src/data/` | English and French demonstration fixtures |
| `app/src/config/identity.json` | Publisher identity and required launch coordinates |
| `supabase/` | Frozen backend archive; unused by the reading site |
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
