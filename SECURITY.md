# Security policy

Parallax is an active prototype. It does not yet provide production security or
availability guarantees.

The project is maintained by Peerlab.

## Current security boundary

| Layer | Status |
| --- | --- |
| Fixture-backed browser app | **Current prototype.** It requires no account or secret. Personal quiz/profile data and the local mock contribution/review overlay are stored in the browser. |
| Supabase auth, RLS, revision workflow, aggregate signals, source assessment, and Edge Function | **Experimental.** A disposable bootstrap, SQL matrices, Edge tests, and CI jobs exist, but they are not a production-security guarantee. |
| External source processing and provider access | **Experimental.** Fetched documents are untrusted input. Provider keys and service credentials must remain server-side. |
| Production threat model, independent security review, incident response, backup/restore proof, and availability guarantees | **Target / not provided.** |

The SQL policy and hardening tests under [`supabase/tests/`](supabase/tests/),
and the Edge checks under
[`supabase/functions/analyze-seed/`](supabase/functions/analyze-seed/), are useful
evidence only when run against or alongside the disposable environment at the
exact commit being evaluated. They do not establish security for an untested
hosted deployment.

Do not process secrets, private documents, personal allegations, or regulated
data through the prototype. A structured or reviewed dossier is provisional;
it is not a security, medical, legal, or factual oracle.

## Reporting a vulnerability

Do not disclose vulnerabilities, credentials, private data, or exploitation
steps in a public issue or pull request.

Use GitHub's
[private vulnerability reporting form](https://github.com/Swarek/parallax/security/advisories/new).

If the private form is unavailable, open a public issue containing only the
words "Private security contact requested" and no technical details. A
maintainer will establish a private route.

Include, when possible:

- the affected component and version or commit;
- reproduction steps and impact;
- whether credentials or personal data may be exposed;
- a minimal proof of concept without real user data;
- any suggested mitigation.

Reports involving exposed secrets, authorization bypass, cross-site scripting,
server-side request forgery, database policies, unsafe content rendering, or
dependency compromise are especially important.

For source-processing reports, also include whether an untrusted document could
influence prompts, tools, network access, stored excerpts, rendered content, or
audit records. Do not attach the real malicious/private document when a minimal
synthetic reproduction is sufficient.

## Supported versions

Only the latest commit on `main` is currently supported. Historical commits and
unreleased branches do not receive security fixes.
