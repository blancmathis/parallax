# Security policy

Parallax is an active prototype. It does not yet provide production security or
availability guarantees.

The project is maintained by Peerlab.

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

## Supported versions

Only the latest commit on `main` is currently supported. Historical commits and
unreleased branches do not receive security fixes.
