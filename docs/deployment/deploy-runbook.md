---
context_room:
  id: operations.deployment.runbook
---

# Deployment runbook

## Summary

The supported shared-test and production shape is a prerendered static frontend
on Cloudflare Pages plus a separate hosted Supabase project. A release is not
ready merely because `npm run build` passes: it must also prove the database from
scratch, the Edge authorization boundary, Cloudflare's real asset routing and
headers, and the role-based product journey.

No public domain, Supabase project, backup policy, or production deployment is
asserted by this repository. In particular, `parallax.org` is not a project
domain and must never be used as the canonical origin.

## Defines

This runbook defines the reproducible local bootstrap, the supported Cloudflare
Pages and Supabase deployment contract, the smoke commands, promotion gates,
and rollback boundaries.

## Does not define

It does not authorize a deployment, assign production operators, create hosted
accounts, choose a domain, set recovery objectives, or prove that a remote
environment currently meets these requirements. Those decisions and their
evidence are tracked in [Operations readiness](operations-readiness.md).

## Environment boundaries

| Environment | Purpose | Data and credentials |
| --- | --- | --- |
| Local | Disposable development and security tests | `supabase/seed.sql`, fixed `.example.test` accounts, CLI-generated local keys |
| Shared test | End-to-end team acceptance | Dedicated hosted Supabase project, synthetic accounts and non-sensitive data only |
| Production | Public service | Separate project, real operator accounts, reviewed retention and recovery policy |

Never reuse a Supabase project, service/secret key, database password, auth
cookie, test account, or backup across these boundaries. A Cloudflare preview
must point to shared test, never to production.

## Security boundary

Browser-safe build values are:

- `VITE_SUPABASE_URL`;
- `VITE_SUPABASE_ANON_KEY`, despite its legacy name, containing a Supabase
  `sb_publishable_…` key or a legacy JWT whose role is exactly `anon`;
- `VITE_SITE_ORIGIN`;
- `SITE_ORIGIN`, consumed only by the build process.

Do not place a Supabase secret/service-role key, JWT signing secret, database
credential, or provider credential in `app/.env*`, Cloudflare frontend
variables, build logs, screenshots, issues, or browser storage. The supported
production build script rejects obvious Supabase secret/service-role keys.

Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` into the Edge runtime. The only custom Edge setting
currently required is `CORS_ALLOWED_ORIGINS`, an exact comma-separated list of
frontend origins. Hosted entries must use HTTPS; credentials, paths, queries,
fragments, empty entries, or a trailing comma make the Edge configuration fail
closed. The live model-provider path is deliberately unavailable; do not
configure or claim an OpenRouter integration.

## Run the complete local release gate

The fail-closed, one-command local release proof is:

```bash
./scripts/release-gate.sh --reset
```

In addition to the bootstrap prerequisites below, it requires Node `22.23.0`,
npm `10.9.8`, `curl`, `jq`, and the Playwright Chromium runtime. Install the
browser once with `cd app && npx playwright install chromium`. Native Deno
`2.9.6` is used when present; otherwise the gate runs the exact
`denoland/deno:2.9.6` image against the read-only Supabase tree and removes its
temporary Docker cache volume on exit. It never installs Deno globally.

The `--reset` flag is mandatory and is the destructive confirmation: the gate
prints the exact project ID, API port, and reset command before running. It
serializes local bootstraps, refuses any partial or complete `parallax-local`
stack owned by another checkout, and runs only
`supabase db reset --local --yes`; it never links, pushes, deploys, changes a
hosted secret, or mutates a remote project.

The gate runs, in order: a clean locked npm install; type, lint, fixture,
coverage, dependency, bundle, and desktop/mobile Playwright checks; frozen Deno
format/lint/type/unit checks for `analyze-seed` and `capture-source`; the local
Supabase reset and every transactional SQL authorization matrix; anonymous and
authenticated Edge smokes for both functions, including CORS, blocked source
capture, private persistence, and idempotent replay; database lint for both
`public` and `private`; then a
final flat-prerender build and HTTP routing/SEO/404 smoke. It leaves the verified
local stack running so the manual
role journey can begin immediately. If an existing ignored `app/.env.local`
must be replaced, opt in separately:

```bash
./scripts/release-gate.sh --reset --replace-env
```

A PASS proves repository-local behavior only. It cannot replace the real Pages
preview, isolated hosted Supabase, alert, recovery, or recorded browser-role
gates described below.

## Rebuild the local stack from scratch

Prerequisites:

- Docker with a running daemon;
- Supabase CLI `2.75.0`;
- a Node/npm pair accepted by `app/package.json`;
- PostgreSQL `psql` 17 or compatible.

From the repository root:

```bash
./scripts/bootstrap-local.sh --reset
```

`--reset` is intentionally mandatory. The command runs exactly
`supabase db reset --local --yes`, so it erases the local Parallax database,
replays every migration, loads `supabase/seed.sql`, installs locked frontend
dependencies, generates an ignored browser-safe `app/.env.local`, runs the SQL
authorization and hardening matrices in their rollback transactions, and
starts both Edge Functions for Auth, REST, CORS, handler, persistence, and
idempotency integration smokes against disposable local data. It never links to
or resets a remote project.

Before installing dependencies or starting containers, the script acquires a
per-user global lock and verifies ownership from every container carrying the
`parallax-local` project label, including partial stopped stacks. It starts the
stack on the dedicated `parallax-local-loopback-<uid>` Docker bridge configured
with `host_binding_ipv4=127.0.0.1`, then verifies every published container port
is loopback-only before the reset. A stale lock is a fail-closed condition:
inspect its recorded PID and checkout, and remove only that exact lock directory
after confirming the process no longer exists.
This follows Supabase's documented
[loopback-only Docker network pattern](https://supabase.com/docs/guides/local-development).

If an existing `app/.env.local` is stale, inspect it and then opt in to an
atomic replacement:

```bash
./scripts/bootstrap-local.sh --reset --replace-env
```

Start the browser app on the exact Auth-allowlisted origin:

```bash
supabase functions serve \
  --network-id "parallax-local-loopback-$(id -u)"
```

In a separate terminal:

```bash
cd app
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

The fixed local accounts use password `Parallax123!`:

- `user@example.test`;
- `reviewer@example.test`;
- `admin@example.test`.

New local signups require email confirmation. Inspect the confirmation message
in the local mailbox printed by the bootstrap script. Seed accounts are already
confirmed.

The bootstrap never stops another local stack. If port `55421` is owned by an
older project, first confirm that no task is using it, then stop that exact local
project explicitly with `supabase stop --project-id <old-local-project-id>`.

## Exercise the Cloudflare static contract locally

Vite proves application behavior but does not expose the generated route files
or a real 404. Build with a throwaway local origin, then serve the exact `dist`
directory through the repository's asset-first HTTP harness:

```bash
cd app
SITE_ORIGIN=http://127.0.0.1:8788 \
VITE_SITE_ORIGIN=http://127.0.0.1:8788 \
npm run build
```

From the repository root:

```bash
node scripts/serve-dist.mjs --root app/dist --port 8788
```

In another terminal, from the repository root:

```bash
node scripts/smoke-http.mjs --base-url http://127.0.0.1:8788
```

This checks raw prerendered heads, EN/FR routes, JS/CSS MIME types, the sitemap,
robots, hashed assets, Cloudflare-style `307` normalization of `.html` and
trailing-slash variants to the slashless canonical, and real 404 statuses. The
harness intentionally does not emulate Cloudflare `_redirects`, `_headers`,
cache, TLS, or Edge behavior, so it cannot prove the host configuration. It is
also not a full-stack browser test:
the production CSP intentionally does not allow a browser page to call an HTTP
local Supabase endpoint. Use Vite for the local role-based journey and a real
HTTPS Pages preview for the integrated hosted journey and header proof.

## Prepare an isolated hosted Supabase project

These are operator actions against an external system. Execute them only in a
new shared-test project after resolving the project ref and receiving explicit
authorization for that target.

1. Create a dedicated Supabase project and record its region, owner, plan, and
   deletion policy.
2. Resolve and display the target project ref in the approved deployment job
   before any write. Do not keep a shared-test or production link as an
   ambiguous workstation default.
3. Apply committed migrations through a reviewed PR and the approved deployment
   job. The repository's local guard intentionally blocks ad-hoc
   `supabase db push`; no hosted migration is authorized by this runbook.
4. Never apply `supabase/seed.sql` remotely. It contains fixed local accounts.
   `supabase/seed.corpus.sql` is public demonstration data, but it is currently
   a one-time SQL seed rather than an idempotent migration; use it only on an
   empty disposable shared-test project after review.
5. Deploy both required functions only after their individual frozen Deno checks,
   the database migrations, and the local integration smoke pass. The approved
   job must use the resolved target ref and keep JWT verification enabled for
   both:

   ```bash
   for function_name in analyze-seed capture-source; do
     supabase functions deploy "$function_name" \
       --project-ref "$SUPABASE_PROJECT_REF"
   done
   ```

6. Set the exact frontend origins, without paths or trailing slashes:

   ```bash
   supabase secrets set \
     CORS_ALLOWED_ORIGINS="$SITE_ORIGIN,$CF_PAGES_PREVIEW_URL"
   ```

7. Configure hosted Auth independently of `supabase/config.toml`: the exact
   Site URL plus `$SITE_ORIGIN/you` and `$SITE_ORIGIN/fr/you` as redirect URLs
   (and the same two paths on each approved preview origin), email confirmation,
   a real SMTP provider, password policy, abuse controls, and CAPTCHA when
   public signup is enabled. The local configuration and tests do not prove
   that SMTP or these hosted redirect entries are active.
8. Run the read-only hosted backend smoke:

   ```bash
   PARALLAX_SMOKE_PUBLIC_KEY="$SUPABASE_PUBLISHABLE_KEY" \
   node scripts/smoke-http.mjs \
     --supabase-url "$SUPABASE_URL" \
     --public-key-env PARALLAX_SMOKE_PUBLIC_KEY
   ```

   To prove that the deployed handler itself starts and that CORS is exact, use
   a synthetic shared-test login and keep its password out of command arguments:

   ```bash
   PARALLAX_SMOKE_PUBLIC_KEY="$SUPABASE_PUBLISHABLE_KEY" \
   PARALLAX_SMOKE_LOGIN_PASSWORD="$SHARED_TEST_USER_PASSWORD" \
   node scripts/smoke-http.mjs \
     --supabase-url "$SUPABASE_URL" \
     --public-key-env PARALLAX_SMOKE_PUBLIC_KEY \
     --login-email "$SHARED_TEST_USER_EMAIL" \
     --login-password-env PARALLAX_SMOKE_LOGIN_PASSWORD \
     --allowed-origin "$SITE_ORIGIN" \
	     --denied-origin https://not-allowed.invalid
	   ```

   This read-only probe proves that both deployed handlers start, enforce JWT,
   and apply exact CORS. It intentionally submits only invalid resource IDs or
   bodies and does not prove capture reservation, storage, or replay.

   The positive `capture-source` proof writes one synthetic blocked artifact and
   replays its idempotency key. Run that proof locally through
   `npm --prefix app run test:supabase:smoke`; in shared test, exercise the same
   flow with an authorized synthetic account and verify the private artifact,
   reservation, and Edge log. Never run this write probe against production.

The local `supabase/config.toml` is a disposable developer profile, not a
production configuration source. Supabase's current production checklist is
the external baseline for hosted settings:
[Going into production](https://supabase.com/docs/guides/deployment/going-into-prod).

## Build the deployable frontend

The only supported release build entry point is:

```bash
SITE_ORIGIN=https://YOUR_CONTROLLED_DOMAIN \
VITE_SITE_ORIGIN=https://YOUR_CONTROLLED_DOMAIN \
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
VITE_SUPABASE_ANON_KEY="$SUPABASE_PUBLISHABLE_KEY" \
./scripts/build-frontend.sh
```

The script requires a controlled HTTPS canonical written exactly as its origin,
requires the two origin variables to match, rejects local/reserved origins and
`parallax.org`, accepts only the two supported browser-public Supabase key forms,
installs the lockfile exactly, runs the complete frontend
build, enforces the bundle and production-dependency audit gates, checks required
flat prerender/SEO assets, and scans application source plus deployable HTML,
JavaScript, CSS, XML, JSON, and text for the unrelated domain. It does not upload
anything. `VITE_CONTACT_EMAIL` is optional; when absent, the contact CTAs are not
rendered. When set, it must identify an inbox controlled by the project.

For Cloudflare Pages use repository root `/`, build command
`./scripts/build-frontend.sh`, output directory `app/dist`, build image v3, and
pin `NODE_VERSION=22.23.0`. Set the four browser/build variables above for both
preview and production, using the shared-test Supabase values in previews.
Cloudflare's build image does not honor `package.json` engines automatically;
the script enables strict engine checking and obtains the repository-pinned npm
version when the image's npm differs.

## Cloudflare routing contract

`app/public/_redirects` intentionally contains no wildcard rewrite. Every known
non-root route is emitted as a flat `.html` asset: `method.html`,
`debates/<slug>.html`, `fr.html`, and their French equivalents. Cloudflare's
default HTML handling therefore serves the slashless public URLs directly and
normalizes `.html`, `/index.html`, and trailing-slash variants back to them with
`307`. Cloudflare evaluates redirect rules before checking assets, so an SPA
catch-all would mask these route-specific files, hashed assets, and `404.html`.
The release must preserve these properties:

- every known EN/FR route returns its own HTML document with status 200;
- `.html`, `/index.html`, and trailing-slash variants redirect exactly once to
  the corresponding slashless URL;
- JS and CSS assets return directly with their correct MIME type;
- unknown paths return the generated `404.html` with status 404;
- route canonicals and hreflang links use the controlled origin;
- `/assets/*` is immutable without a conflicting zero-age cache directive;
- static responses carry the reviewed CSP and security headers.

A debate that exists only in the database after the last build does not have a
direct-load static document. Supporting that case requires a new build or an
explicit asset-first Pages Function/SSR design. Restoring a wildcard rewrite is
not an acceptable substitute because it destroys prerender and 404 correctness.

See Cloudflare's current behavior for
[redirects](https://developers.cloudflare.com/pages/configuration/redirects/),
[headers](https://developers.cloudflare.com/pages/configuration/headers/), and
[serving pages](https://developers.cloudflare.com/pages/configuration/serving-pages/).

## Verify a real Pages preview

Build the preview with the intended canonical origin, then run:

```bash
PARALLAX_SMOKE_PUBLIC_KEY="$SUPABASE_PUBLISHABLE_KEY" \
node scripts/smoke-http.mjs \
  --base-url "$CF_PAGES_PREVIEW_URL" \
  --canonical-origin "$SITE_ORIGIN" \
  --expect-cloudflare-headers \
  --supabase-url "$SUPABASE_URL" \
  --public-key-env PARALLAX_SMOKE_PUBLIC_KEY
```

`--expect-cloudflare-headers` additionally requires Cloudflare evidence, CSP,
frame protection, `nosniff`, referrer policy, scoped HSTS over HTTPS, and the
immutable asset cache rule. Do not treat local Wrangler, Vite, a successful
upload, or a green build as equivalent to this preview proof.

Then complete the browser journey with synthetic shared-test accounts:

1. visitor reads each of the three fixture debates in EN and FR;
2. a new user confirms email and signs in;
3. the user proposes a topic with structured arguments and sources, and a
   synthetic safe URL exercises `capture-source` plus idempotent replay;
4. mock analysis returns a structured draft without an external model call;
5. the user contributes an argument and source assessment;
6. a reviewer accepts or rejects the contribution with an audit record;
7. an admin merges and publishes a new revision;
8. an anonymous browser sees the published revision after refresh;
9. unauthorized user/reviewer/admin actions remain denied;
10. request IDs and relevant logs are retrievable for failures.

Record the commit SHA, Pages deployment ID, Supabase project ref, migration
version, smoke output, browser-test result, tester, and timestamp. Without that
evidence the environment is only configured, not verified.

## Promotion and rollback

Promote the same reviewed commit only after every gate in
[Operations readiness](operations-readiness.md) is satisfied. Before the first
production migration, prove a backup restore into an isolated project and have
explicit recovery objectives.

Cloudflare Pages can roll back static deployments, but that does not roll back
Supabase schema or data. Treat database migrations as forward-only by default;
prepare and test a compensating migration for any incompatible change. If a
release fails:

1. stop promotion and preserve request/deployment IDs;
2. roll back the Pages deployment when the defect is frontend-only;
3. disable the affected feature or Edge Function when safe;
4. apply only a reviewed compensating database change;
5. restore data only through the approved recovery procedure;
6. rerun the preview/backend smoke and the affected role journey before
   reopening traffic.

Cloudflare documents its
[deployment rollback](https://developers.cloudflare.com/pages/configuration/rollbacks/),
and Supabase documents
[backups](https://supabase.com/docs/guides/platform/backups). Their presence is
not recovery evidence; an isolated restore drill is.
