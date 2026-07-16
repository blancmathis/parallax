# Deployment guide

Parallax consists of a Vite single-page application and an optional Supabase
backend. The browser app can be deployed first in read-only fixture mode and
connected to Supabase later.

This guide describes the repository's supported deployment shape. It does not
claim that a particular public instance is currently deployed or maintained.

## Security boundary

Only these values are browser-safe:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_ORIGIN`
- `SITE_ORIGIN` during the build

Keep `SUPABASE_SERVICE_ROLE_KEY`, database credentials, JWT secrets, and model
provider keys in Supabase or another server-side secret store. Never add them to
frontend environment variables, commits, build logs, screenshots, or issues.

## Deploy the fixture-backed frontend

Use Node.js 22 or newer.

```bash
cd app
npm ci
SITE_ORIGIN=https://your-domain.example \
VITE_SITE_ORIGIN=https://your-domain.example \
npm run build
```

Deploy `app/dist` to a static host. The repository includes SPA routing files
under `app/public/`; confirm that direct navigation to `/debates`, `/method`,
and `/fr/debates` returns the application rather than a 404.

The build requires a real origin because it generates canonical URLs,
OpenGraph metadata, hreflang links, and a sitemap. For a throwaway local build
only, `SITE_ORIGIN_ALLOW_DEFAULT=1` permits the placeholder origin.

## Add the Supabase backend

Install the Supabase CLI and create or select your own project. From the
repository root:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy analyze-seed
```

Set server-side function secrets in Supabase, not in the frontend host:

```bash
supabase secrets set OPENROUTER_API_KEY=YOUR_KEY
```

The model key is optional. Without it, the analysis function remains on the
deterministic mock path.

Configure the frontend build with the project's public URL and anon or
publishable key:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
VITE_SITE_ORIGIN=https://your-domain.example
SITE_ORIGIN=https://your-domain.example
```

Do not run `supabase/seed.sql` against a hosted project. It contains fixed local
test accounts for development and security-policy testing. To install only the
public demonstration corpus, review and apply `supabase/seed.corpus.sql`.

Provision real administrative accounts through Supabase Auth and create their
profile roles through a private, audited operator workflow. Never store an
administrative password in this repository.

## Verification

Before sharing a deployment:

1. Open `/`, `/debates`, `/method`, `/fr`, and `/fr/debates` directly.
2. Confirm the three fixture debates remain available if Supabase is absent.
3. If Supabase is enabled, verify sign-in, contributions, review authorization,
   publication, position signals, and source assessments with test accounts.
4. Confirm canonical URLs, hreflang entries, `robots.txt`, and `sitemap.xml` use
   the real production origin.
5. Inspect browser requests, storage, cookies, hosting logs, and headers before
   publishing any privacy claim.
6. Verify that no server-side secret appears in the browser bundle, host
   environment, network responses, or logs.

The SQL policy matrix in `supabase/tests/rls_matrix.sql` is intended for a local
disposable database transaction. Do not run destructive test fixtures against
production data.
