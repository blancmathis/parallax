# Publishing and operating the site

This document owns the single publication path, the launch gate, and the
routine a single editor can run. It replaces the archived deployment runbook
and operations-readiness gate (tag `archive/workspace-20260913`), which were
written for the frozen Supabase backend and a team.

## One path to production

1. A change lands on `main` through a reviewed pull request. Content changes
   are commits to the debate files, so the Git history is the public record of
   every revision.
2. Cloudflare Pages builds `main`: root directory `app`, build command
   `npm ci && npm run build`, output directory `dist`, environment
   `SITE_ORIGIN` and `VITE_SITE_ORIGIN` set to the public origin.
3. The build prerenders every route in French (`/`) and English (`/en/`), with
   the page text in the HTML.
4. Rollback: in the Pages dashboard, redeploy the previous deployment. One click.

There is no database in the read-only phase. Nothing else needs deploying.

## Launch gate

The site goes public only when the five controls below are green. Record the
date and the evidence (command output, link) next to each one in the pull
request that opens the site.

| # | Control | Evidence |
| --- | --- | --- |
| 1 | CI is green on `main` | GitHub Actions run |
| 2 | No displayed number is invented | the numerals contract test passes; manual read of the home page and one debate |
| 3 | Every factual claim of a **reviewed** debate has a verified excerpt; unreviewed debates show "Brouillon non relu" | fixture checks; visual check |
| 4 | Legal pages exist and hold no placeholder | `npm run check:launch` |
| 5 | A content takedown was tested end to end | a test commit removes a passage, the deployed page no longer shows it, the previous deployment is deleted in Pages, and the time taken is written down |

## Running it alone

- **Backup:** the content is in Git. When a database exists, a weekly export
  is enough: it only holds challenges and anonymous measures.
- **Monitoring:** one uptime probe on the home page and one debate page, with
  an email alert. No on-call.
- **Moderation:** two one-hour slots per week. Nothing is published without a
  human action, so nothing burns at night.
- **Pace:** one debate per week at most.
- **Machinery rule:** nothing is built unless a real user asked for it this
  week. Warning sign: more lines of SQL than lines of debate in a month.
