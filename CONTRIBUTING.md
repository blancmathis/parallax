# Contributing to Parallax

Thank you for helping improve Parallax. The project is still stabilizing its
source model, governance rules, privacy posture, and public deployment.

Parallax is developed and maintained by Peerlab. Peerlab maintainers set the
project direction and make final repository decisions.

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
npm run check
npm run lint
npm run check:fixtures
SITE_ORIGIN=https://example.com VITE_SITE_ORIGIN=https://example.com npm run build
```

For interface changes, include screenshots at desktop and narrow widths. Do not
include private data, credentials, unpublished content, or third-party material
that cannot be redistributed.

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
