# Roadmap

This document owns implementation status, the sequenced plan, and the gates
that move work forward. Product decisions live in
[02-product.md](02-product.md) (D16–D25 set the 2026-10-03 direction);
publication and the launch gate live in
[deployment/publishing.md](deployment/publishing.md).

## Current status (2026-10-03)

**Current:** a read-only static site. French at `/`, English under `/en/`.
Every route is prerendered with its text in the HTML. Three debates
(congestion pricing, smartphones in schools, nuclear power) are **unreviewed
drafts**, prepared with AI tools, and say so at the top of the page with a
coverage line computed from the files. The content lives in
[`app/src/data`](../app/src/data); its Git history is the public record.

**Archived (tag `archive/workspace-20260913`):** the Supabase backend
(39 tables), accounts, contribution and review flows, the position signal,
the values quiz, the steelman test and badges, the verification-engine
research, and the team operations runbooks. Nothing was deleted; the tag
keeps it all. The `supabase/` directory on `main` is frozen and unused by the
site.

**North star:** readers misjudge the other side less after reading. Measured
only through the [pre-registered protocol](protocol/2026-10-03-measurement-preregistration.md).

## Phase 1 — two weeks: online and honest

| Step | Deliverable | Success | Stop |
| --- | --- | --- | --- |
| 1. Triage the branch | `main` holds the UI, its tests, front CI and state docs; archive tag on `de6c866` | front CI green on `main` | triage over 3 days: restart from `main`, copy only `app/src` and its tests |
| 2. Remove what misleads | no demo aggregate, scripted audit log, badge, values quiz, or dead link | a test fails when a displayed number has no source | none: not negotiable |
| 3. Prerender the body | every debate readable without JavaScript, French by default | debate text present in the raw HTML | hydration blocked over 3 days: plain static rendering |
| 4. Go online, read-only | domain, 3 debates marked "Brouillon non relu", legal notice, privacy, contact | public address; HTTP check green | — |
| 5. Pre-register the measure | [one-page protocol](protocol/2026-10-03-measurement-preregistration.md), dated | hypothesis, primary measure, sample size and stop rule written before any data | — |
| 6. Recruit reviewers | 6 reviewers, 2 per position, for the pilot debate ([kit](relecture/README.md)) | 6 written agreements | under 3 agreements in 3 weeks: change the pilot topic |

**Gate 1:** the five controls of the [launch gate](deployment/publishing.md#launch-gate).

## Phase 2 — ninety days: prove or refute the loop

| Month | Deliverable | Success | Stop |
| --- | --- | --- | --- |
| 1. One exemplary debate | the pilot on the new template: prediction, real voices, signed steelmen, cruxes with excerpts | 100% of factual claims with a verified excerpt; 3 of 3 steelmen signed "faithful"; 8 of 10 testers find the crux | no supporter signs after two revisions: rework the steelman template |
| 2. Pipeline and challenges | offline AI pipeline; 4 debates; "Contester" button; public register; newsletter | 12 hours of work per debate, measured; model–human agreement measured on the gold set | over 25 hours for the fourth debate: shrink the template |
| 3. The measure | 8 debates; randomized trial; 2 pilot classes | effect ≥ 0.3 point on 7, or prediction error −20%; 30 challenges received, 10 accepted | CI excludes +0.2 point: redo the loop before a ninth debate |

**Gate 2** is the only one that can reverse the plan: without a measured
effect at day 90, the loop is redesigned before more debates are written.

## Phase 3 — twelve months: useful to others

| Months | Deliverable | Success | Stop |
| --- | --- | --- | --- |
| 4–6 | 15 debates; association created; 2 funding applications filed; teacher kit tested in 5 classes | 5 teachers reuse it without a reminder; measure replicated at two weeks | no teacher reuses it: the school channel is wrong, switch to the press |
| 7–9 | 25 debates; reviewer accounts; grounded AI dialogue experiment; one media partner | 30 active reviewers, present in every camp; 30% of accepted corrections from non-invited people | under 300 complete readings a month despite 20 debates: become a tool for classes or newsrooms |
| 10–12 | 30 debates; corpus exported under an open licence; first "steelman fidelity" evaluation set; decision on open contributions | funding secured; 1,000 complete readings a month | neither funding nor use: maintenance mode, or hand the corpus over |

## Cut on 2026-10-03

The values quiz and personal reweighting; the position signal and per-account
ballots; steelman badges and the guardian role earned by a test; demo
aggregates, the fixture audit log and composite voices; user-triggered
analysis (`analyze-seed`) and "propose a topic"; the eight-attribute integrity
floor; the two parallel contribution systems and the role separation between
accounts; the ten-row readiness gate; twelve of the sixteen landing blocks and
the funder pitch (moved to the Project page); the words "library of truths"
and "clear answers".

## Deferred, with the trigger that reopens each item

| Work | Reopen when |
| --- | --- |
| Algorithmic bridging | 300 active reviewers spread across the camps |
| Public accounts and uninvited contributions | 30% of accepted corrections come from non-invited people, and answers stay under 14 days |
| Global graph, fractal sub-debates, semantic dedup | 50 debates and ten claims really shared between debates |
| Guardians, random juries, appeals | 100 reviewers and a first conflict the editor cannot settle alone |
| Verification engine, certificates | a third party commits in writing to a pilot |
| Paid feeds, commercial evaluation sets, subsidiary | 50 reviewed debates and a written request from a lab |
| Dialogue with an AI | months 7–9, as an experiment under a randomized trial |
| Student accounts, GAR connection | ten schools using it regularly |
| AI agent consensus (D10) | a written and reviewed threat model; not before |

## Validation surface

The frontend commands in [README.md](../README.md#run-the-app), defined by
[`app/package.json`](../app/package.json), cover types, lint, fixture
structure, unit and contract tests (including the copy-truth and
displayed-numbers contracts), the prerendered build, bundle budgets, the
dependency audit, the launch check, and browser journeys in both languages.
