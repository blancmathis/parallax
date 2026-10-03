# Contributing to Parallax

Thank you for helping improve Parallax. The project is still stabilizing its
source model, governance rules, privacy posture, and public deployment.

Parallax is developed and maintained by Peerlab. Peerlab maintainers set the
project direction and make final repository decisions.

## Know which layer you are changing

- **Current:** the default fixture-backed browser experience.
- **Mock:** browser-local or deterministic demonstration behavior.
- **Experimental:** optional Supabase, source-processing, provider, and other
  paths that are not yet covered by one complete release receipt.
- **Target:** product and architecture direction in the documentation; target
  prose is not evidence that a feature exists.

State the affected layer in the issue or pull request. Do not present a mock or
experimental result as production behavior, factual verification, or a
completed target.

## Useful contributions now

- Reproducible bugs.
- Claim-source alignment errors or missing source context.
- Accessibility, keyboard, mobile, and readability problems.
- Small UI or documentation improvements.
- Tests that expose a concrete failure.
- Focused feedback on the data model, review flow, privacy, or moderation risks.

Please do not use repository discussions as a general political debate forum.
If a demonstration debate is wrong, report the specific claim, source, label,
interface, or governance problem.

For a source correction, identify the exact artifact version, retrieval date,
quoted passage and locator, claim scope, proposed relationship label, and why
the current rationale is wrong. A URL alone is not enough when its contents can
change. Do not submit third-party text beyond what review and repository
licensing permit.

## Before opening a pull request

1. Search existing issues.
2. Open an issue before starting a large or behavior-changing contribution.
3. Keep the change focused and explain its user-visible effect.
4. Add or update the smallest relevant test.
5. Run the checks below.
6. Do not add analytics, tracking, accounts, data collection, or live model
   calls without an accepted design issue.

```bash
cd app
npm ci
npm run qa
npx playwright install chromium # first local browser run only
npm run qa:release
```

For interface changes, include screenshots at desktop and narrow widths. Do not
include private data, credentials, unpublished content, or third-party material
that cannot be redistributed.

The commands above cover the frontend, fixture/local-mock browser journeys,
bundle budget, and dependency checks. They do not exercise Supabase, RLS, or the
Edge Function. For backend work, use the guarded disposable procedure in
[`docs/deployment/deploy-runbook.md`](docs/deployment/deploy-runbook.md); it
requires an explicit `--reset` because it erases the local Parallax database.
Never run destructive fixtures against a hosted project.

For an Edge-only change, also run the checked-in Deno tasks:

```bash
cd supabase/functions/analyze-seed
deno task check
deno task test
```

Report exactly which commands ran and whether the evidence was local frontend,
browser E2E, disposable backend, hosted preview, or production observation.

For documentation changes, update the existing canonical owner, keep Current,
Mock, Experimental, and Target distinct, preserve stable paths and headings,
and add navigation in [`docs/INDEX.md`](docs/INDEX.md) only when a new durable
owner is required.

## Review standards

A contribution may be declined when it:

- asks Parallax to declare a winner or present model output as truth;
- adds a global source-reliability score instead of scoped claim-source review;
- weakens auditability, access controls, privacy, or human review;
- introduces partisan advocacy unrelated to improving the product;
- includes private, confidential, or improperly licensed material;
- expands scope substantially without prior agreement.

External contributors retain copyright in their contributions and agree to
license them under the repository's Apache-2.0 license. Contributions do not
transfer copyright ownership to Peerlab unless a separate written agreement
explicitly provides otherwise. You must have the right to submit your work.
