---
context_room:
  id: operations.deployment.readiness
---

# Operations readiness

## Summary

Parallax is ready for a shared test or production only when the corresponding
gate below has current evidence. Repository checks prove source behavior; they
do not prove hosted configuration, recovery, alert delivery, quotas, cost, or a
real user journey. Unknown operational decisions remain blockers rather than
implicit defaults.

## Defines

This document defines the release gates for environment isolation, promotion,
observability, recovery, abuse and cost control, privacy, and operational
ownership.

## Does not define

It does not define application behavior, database schema, vendor plan details,
incident-specific actions, or authorization to deploy. The executable procedure
is the [Deployment runbook](deploy-runbook.md).

## Readiness verdict

The project is not production-ready until every production row below has an
owner, an accepted target, and dated evidence from the actual environment. A
shared test can proceed earlier, but it must remain isolated and contain only
synthetic data.

| Gate | Shared test evidence | Additional production evidence |
| --- | --- | --- |
| Reproducible build | Dated `release-gate.sh --reset` PASS, clean lockfile install, complete build, no guessed canonical | Same commit and build contract used by Pages |
| Database | From-scratch migrations, local seed, every transactional SQL authorization matrix and DB lint | Reviewed hosted migration plan and schema version |
| Edge boundary | Both required functions pass frozen checks; JWT gateway plus handler validation; anonymous requests denied | Exact CORS origins, both deployed function versions, failure logs |
| Routing and SEO | Real Pages preview smoke for EN/FR, assets, 404, canonical and headers | Controlled domain, DNS/TLS, sitemap and production smoke |
| Product journey | Synthetic user → reviewer → admin → anonymous publication flow | Same flow after promotion using production-safe test records |
| Recovery | Backup availability checked | Successful isolated restore drill; accepted RPO/RTO |
| Observability | Logs and request IDs retrievable | Alert delivery and on-call response exercise |
| Abuse and cost | Synthetic load within configured limits | Approved quotas, budgets, plan headroom and escalation thresholds |
| Privacy | Synthetic data only | Accepted retention/deletion rules and access review |
| Rollback | Previous Pages deployment and compensating DB plan identified | Timed rollback exercise with recorded result |

## Environment inventory

Maintain one private operator inventory outside the public repository. For each
environment it must record:

- Cloudflare project, branch policy, custom domains, deployment ID, and owners;
- Supabase project ref, region, plan, migration version, and owners;
- where each secret is stored, who can read or rotate it, and its last rotation;
- Auth Site URL, exact redirect allowlist, SMTP, confirmation, CAPTCHA, and rate
  settings;
- backup/PITR availability and retention supplied by the actual plan;
- monitoring destinations and the human escalation path.

Do not copy secret values into this inventory. Store identifiers and custody,
then link to the authorized secret manager.

## Observability gate

Before a shared test, prove that an operator can retrieve:

- Cloudflare deployment/build logs and the exact deployed commit;
- browser-visible HTTP status and response headers;
- Supabase Auth, PostgREST, database, and Edge Function logs;
- the `request_id` returned and logged by `analyze-seed` and `capture-source`;
- database resource usage, storage growth, and connection pressure.

Before production, alerts must reach a named human for at least:

- frontend availability or elevated 5xx responses;
- Auth or PostgREST error-rate spikes;
- Edge Function 5xx, timeouts, or repeated authorization failures;
- database/storage capacity thresholds and backup failure;
- abnormal signup, contribution, source-fetch, or analysis volume;
- cost or quota thresholds for Cloudflare and Supabase.

Record a test alert and acknowledgment timestamp. A configured dashboard with no
delivery exercise is not sufficient. Supabase's log explorer is documented at
[Logs](https://supabase.com/docs/guides/monitoring-and-debugging/logs).

## Backup and recovery gate

The production owner must accept explicit recovery point and recovery time
objectives. Do not infer them from a vendor plan. Before launch:

1. verify the project's actual backup/PITR entitlement and retention;
2. take or identify a recovery point before a risky migration;
3. restore into an isolated target, never over the live project;
4. verify schema version, auth boundaries, row counts, published fixtures, and a
   representative role journey in the restored target;
5. record duration, data loss window, failures, and the operator;
6. update the procedure until the accepted objectives are met.

Static rollback and data recovery are separate. A Cloudflare rollback cannot
undo a migration or restore deleted rows. Supabase's current backup mechanisms
and plan constraints must be checked directly in
[Backups](https://supabase.com/docs/guides/platform/backups).

## Abuse, rate, and cost gate

The repository cannot set hosted plan limits. The environment owner must record
and test limits at every costly or privileged boundary:

- signup, login, confirmation, recovery, and token refresh;
- topic proposal, contribution, review, merge, and publication RPCs;
- source count and analysis-request size in `analyze-seed`, plus capture quota,
  fetched bytes, timeouts, and private-network blocking in `capture-source`;
- concurrent Edge executions and database connections;
- per-account and per-IP quotas for write-heavy operations;
- Cloudflare bandwidth/build usage and Supabase database, egress, storage, Auth,
  and Function usage.

The live external-model provider is currently disabled. Enabling a paid provider
is a separate reviewed change that needs atomic quota reservation, idempotency,
provider-side spend caps, usage accounting, alerts, and a kill switch before any
user can invoke it.

Load tests must use the isolated shared-test project and synthetic accounts.
Start below expected traffic, identify the first constrained resource, and set
alerts with enough headroom for an operator to respond. Never discover a limit
by exhausting production credits or capacity.

## Privacy and retention gate

Before production, define and implement:

- which account, contribution, source, audit, and request metadata is retained;
- retention periods and the legal/product reason for each;
- deletion, account closure, export, and backup-expiry behavior;
- who can query auth tables, audit events, logs, and backups;
- log redaction rules for tokens, credentials, source contents, and personal
  data;
- a periodic access review and secret-rotation cadence.

Do not publish a privacy, security, deletion, or retention claim until the live
storage, logs, backups, and operator access have been inspected against it.

## Promotion record

Every promoted release should retain a small, immutable record outside runtime
logs:

- commit SHA and release identifier;
- Pages deployment and Supabase project identifiers;
- migration versions and any corpus operation;
- build, SQL, Edge, HTTP smoke, accessibility, and role-journey results;
- backup/recovery point and rollback decision;
- known limitations, approving human, deployer, and timestamps.

Promotion stops on a failed gate, missing evidence, unexplained configuration
drift, or an unowned alert/recovery action. Fix and re-run the narrow failed
proof first, then repeat the complete release smoke before promotion.
