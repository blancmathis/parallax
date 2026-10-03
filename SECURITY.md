# Security policy

Parallax is an active prototype. It does not yet provide production security or
availability guarantees.

The project is maintained by Peerlab.

## Current security boundary

| Layer | Status |
| --- | --- |
| Static reading site | **Current prototype.** No account or secret is required. The only browser storage is the last language (`parallax.locale`). |
| Content rendering | **Current.** Fixture strings and excerpts are rendered as text; external sources open as links. The reading app does not fetch or process source documents. |
| Archived backend | **Frozen / inactive.** The site does not use `supabase/`, and CI runs frontend checks only. |
| Production threat model, independent security review, incident response, backup/restore proof, and availability guarantees | **Target / not provided.** |

The frontend checks cover the fixture-backed reading interface, static HTML,
hydration, accessibility, and dependencies. The launch gate also blocks missing
publisher contact details and missing legal pages. Hosted security headers and
hosting configuration still require verification at deployment.

Do not process secrets, private documents, personal allegations, or regulated
data through the prototype. A structured or reviewed dossier is provisional;
it is not a security, medical, legal, or factual oracle.

## Reporting a vulnerability

Do not disclose vulnerabilities, credentials, private data, or exploitation
steps in a public issue or pull request.

Use GitHub's
[private vulnerability reporting form](https://github.com/blancmathis/parallax/security/advisories/new).

If the private form is unavailable, open a public issue containing only the
words "Private security contact requested" and no technical details. A
maintainer will establish a private route.

Include, when possible:

- the affected component and version or commit;
- reproduction steps and impact;
- whether credentials or personal data may be exposed;
- a minimal proof of concept without real user data;
- any suggested mitigation.

Reports involving exposed secrets, cross-site scripting, unsafe content
rendering, security headers, privacy regressions, or dependency compromise are
especially important. Use a minimal synthetic reproduction and do not attach
private source documents.

## Supported versions

Only the latest commit on `main` is currently supported. Historical commits and
unreleased branches do not receive security fixes.
