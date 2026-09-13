#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/app"
DIST_DIR="$APP_DIR/dist"

fail() {
  printf 'build-frontend: %s\n' "$*" >&2
  exit 1
}

usage() {
  printf '%s\n' \
    'Usage: SITE_ORIGIN=https://… VITE_SITE_ORIGIN=https://… \' \
    '  VITE_SUPABASE_URL=https://… VITE_SUPABASE_ANON_KEY=… \' \
    '  ./scripts/build-frontend.sh'
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi
[[ $# -eq 0 ]] || fail "this command accepts no positional arguments"

if [[ "${VITE_LOCAL_TEST_IDENTITIES:-}" == "1" ]]; then
  fail "VITE_LOCAL_TEST_IDENTITIES=1 is local-only and must never be used for a deployable build"
fi

for command_name in node npm; do
  command -v "$command_name" >/dev/null 2>&1 || fail "missing required command: $command_name"
done

: "${SITE_ORIGIN:?Set SITE_ORIGIN to the controlled canonical HTTPS origin.}"
: "${VITE_SITE_ORIGIN:?Set VITE_SITE_ORIGIN to the same controlled HTTPS origin.}"
: "${VITE_SUPABASE_URL:?Set VITE_SUPABASE_URL to the shared-test or production Supabase URL.}"
: "${VITE_SUPABASE_ANON_KEY:?Set VITE_SUPABASE_ANON_KEY to a browser-safe publishable or anon key.}"

PARALLAX_PUBLIC_KEY_TO_VALIDATE="$VITE_SUPABASE_ANON_KEY" \
PARALLAX_PUBLIC_KEY_LABEL="VITE_SUPABASE_ANON_KEY" \
  node "$ROOT_DIR/scripts/lib/public-key.mjs"

APP_DIR="$APP_DIR" node <<'NODE'
const { readFileSync, readdirSync } = require("node:fs");
const { isIP } = require("node:net");
const { join } = require("node:path");
const env = process.env;

function fail(message) {
  console.error(`build-frontend: ${message}`);
  process.exit(1);
}

function parseOrigin(name) {
  let url;
  try {
    url = new URL(env[name]);
  } catch {
    fail(`${name} must be an absolute URL`);
  }

  if (url.protocol !== "https:") fail(`${name} must use https`);
  if (url.username || url.password || url.port) fail(`${name} must not contain credentials or a port`);
  if (url.pathname !== "/" || url.search || url.hash) {
    fail(`${name} must be an origin only, without a path, query, fragment, or trailing slash`);
  }
  if (env[name] !== url.origin) {
    fail(`${name} must be written exactly as its canonical origin`);
  }

  const host = url.hostname.toLowerCase();
  const ipHost = host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
  const blockedSuffixes = [
    ".example",
    ".invalid",
    ".test",
    ".local",
    ".localhost",
    ".internal",
    ".lan",
    ".home",
  ];
  if (
    !host.includes(".") ||
    isIP(ipHost) !== 0 ||
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "127.0.0.1" ||
    host.startsWith("127.") ||
    ["example.com", "example.net", "example.org"].includes(host) ||
    blockedSuffixes.some((suffix) => host === suffix.slice(1) || host.endsWith(suffix))
  ) {
    fail(`${name} uses a local or reserved hostname`);
  }
  if (host === "parallax.org" || host.endsWith(".parallax.org")) {
    fail(`${name} must not claim the unrelated parallax.org domain`);
  }

  return url.origin;
}

const canonical = parseOrigin("SITE_ORIGIN");
const viteCanonical = parseOrigin("VITE_SITE_ORIGIN");
if (canonical !== viteCanonical) fail("SITE_ORIGIN and VITE_SITE_ORIGIN must match exactly");
parseOrigin("VITE_SUPABASE_URL");

const contactEmail = env.VITE_CONTACT_EMAIL?.trim();
if (contactEmail) {
  if (!/^[^@\s]+@[^@\s]+$/.test(contactEmail)) {
    fail("VITE_CONTACT_EMAIL must be a single valid-looking email address when set");
  }
  if (/@(?:[^@.]+\.)*parallax\.org$/i.test(contactEmail)) {
    fail("VITE_CONTACT_EMAIL must not claim the unrelated parallax.org domain");
  }
}

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(absolute) : [absolute];
  });
}

const sourceFiles = [
  join(env.APP_DIR, "index.html"),
  ...filesUnder(join(env.APP_DIR, "src")).filter((file) => /\.(?:ts|tsx|js|jsx|html)$/i.test(file)),
];
const forbiddenSource = sourceFiles.filter((file) =>
  /parallax\.org/i.test(readFileSync(file, "utf8"))
);
if (forbiddenSource.length) {
  fail(`unrelated parallax.org domain remains in application source: ${forbiddenSource.join(", ")}`);
}
NODE

expected_npm="$(node -e 'const p=require(process.argv[1]); const v=p.packageManager?.match(/^npm@(.+)$/)?.[1]; if (!v) process.exit(2); process.stdout.write(v)' "$APP_DIR/package.json")" \
  || fail "app/package.json must pin packageManager as npm@<version>"
actual_npm="$(npm --version)"

run_npm() {
  if [[ "$actual_npm" == "$expected_npm" ]]; then
    npm "$@"
  else
    npx --yes "npm@$expected_npm" "$@"
  fi
}

if [[ "$actual_npm" != "$expected_npm" ]]; then
  printf 'build-frontend: using pinned npm %s via npx (host has %s)\n' "$expected_npm" "$actual_npm"
fi

printf 'build-frontend: installing the locked frontend dependencies\n'
(
  cd "$APP_DIR"
  export npm_config_engine_strict=true
  run_npm ci
  run_npm run build
  run_npm run check:bundle
  run_npm run audit:prod
)

SITE_ORIGIN="$SITE_ORIGIN" DIST_DIR="$DIST_DIR" node <<'NODE'
const { existsSync, readFileSync, readdirSync } = require("node:fs");
const { join } = require("node:path");

const dist = process.env.DIST_DIR;
const canonical = process.env.SITE_ORIGIN;
const required = [
  "index.html",
  "404.html",
  "debates.html",
  "fr.html",
  "fr/debates.html",
  "robots.txt",
  "sitemap.xml",
  "_headers",
  "_redirects",
];

for (const relative of required) {
  if (!existsSync(join(dist, relative))) {
    throw new Error(`build-frontend: missing build artifact app/dist/${relative}`);
  }
}

const forbiddenDirectoryIndexes = [
  "debates/index.html",
  "method/index.html",
  "fr/index.html",
  "fr/method/index.html",
];
for (const relative of forbiddenDirectoryIndexes) {
  if (existsSync(join(dist, relative))) {
    throw new Error(
      `build-frontend: trailing-slash prerender is incompatible with slashless canonicals: app/dist/${relative}`,
    );
  }
}

const home = readFileSync(join(dist, "index.html"), "utf8");
if (!home.includes(`rel="canonical" href="${canonical}/"`)) {
  throw new Error("build-frontend: generated home canonical does not match SITE_ORIGIN");
}

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(absolute) : [absolute];
  });
}

const deployableTextFiles = filesUnder(dist)
  .filter((file) => /\.(?:html|xml|txt|js|css|json|map)$/i.test(file));
const forbidden = /parallax\.org/i;
const offenders = deployableTextFiles
  .filter((file) => forbidden.test(readFileSync(file, "utf8")));
if (offenders.length) {
  throw new Error(
    `build-frontend: unrelated parallax.org domain leaked into deployable assets: ${offenders.join(", ")}`,
  );
}

const forbiddenSeedCredentials = [
  "user@example.test",
  "reviewer@example.test",
  "admin@example.test",
  "Parallax123!",
];
for (const credential of forbiddenSeedCredentials) {
  const leakedInto = deployableTextFiles.filter((file) =>
    readFileSync(file, "utf8").includes(credential)
  );
  if (leakedInto.length) {
    throw new Error(
      `build-frontend: local test credential leaked into deployable assets: ${leakedInto.join(", ")}`,
    );
  }
}
NODE

printf 'build-frontend: deployable static build ready at %s\n' "$DIST_DIR"
