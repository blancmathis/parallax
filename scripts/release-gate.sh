#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/app"
SUPABASE_DIR="$ROOT_DIR/supabase"
EDGE_ROOT="$SUPABASE_DIR/functions"
EDGE_FUNCTIONS=(analyze-seed capture-source)
EXPECTED_NODE="v22.23.0"
EXPECTED_NPM="10.9.8"
EXPECTED_DENO="2.9.6"
EXPECTED_SUPABASE_CLI="2.75.0"
LOCAL_PROJECT_ID="parallax-local"
LOCAL_API_PORT="55421"
SMOKE_PORT="4173"
RESET_CONFIRMED=false
REPLACE_ENV=false
server_pid=""
server_log=""
deno_cache_volume=""

fail() {
  printf 'release-gate: %s\n' "$*" >&2
  exit 1
}

usage() {
  printf '%s\n' \
    'Usage: ./scripts/release-gate.sh --reset [--replace-env]' \
    '' \
    'Runs every local release gate without deploying anything.' \
    '--reset is mandatory: the command erases only the disposable Supabase' \
    'database whose committed project_id is parallax-local.' \
    '--replace-env forwards explicit permission to replace ignored app/.env.local.'
}

cleanup() {
  if [[ -n "$server_pid" ]]; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  if [[ -n "$server_log" && -e "$server_log" ]]; then
    unlink "$server_log"
  fi
  if [[ -n "$deno_cache_volume" ]]; then
    docker volume rm "$deno_cache_volume" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

while (($#)); do
  case "$1" in
    --reset) RESET_CONFIRMED=true ;;
    --replace-env) REPLACE_ENV=true ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      fail "unknown argument: $1"
      ;;
  esac
  shift
done

[[ "$RESET_CONFIRMED" == true ]] \
  || fail "refusing to erase local data without the explicit --reset flag"

for command_name in docker node npm psql supabase curl jq shasum; do
  command -v "$command_name" >/dev/null 2>&1 \
    || fail "missing required command: $command_name"
done

[[ "$(node --version)" == "$EXPECTED_NODE" ]] \
  || fail "Node $EXPECTED_NODE is required to match CI (found $(node --version))"
[[ "$(npm --version)" == "$EXPECTED_NPM" ]] \
  || fail "npm $EXPECTED_NPM is required to match app/package.json (found $(npm --version))"
actual_supabase_cli="$(supabase --version 2>/dev/null)"
[[ "$actual_supabase_cli" == "$EXPECTED_SUPABASE_CLI" ]] \
  || fail "Supabase CLI $EXPECTED_SUPABASE_CLI is required (found $actual_supabase_cli)"

grep -Fqx "project_id = \"$LOCAL_PROJECT_ID\"" "$ROOT_DIR/supabase/config.toml" \
  || fail "supabase/config.toml must identify only the disposable $LOCAL_PROJECT_ID project"
grep -Eq "^port = $LOCAL_API_PORT$" "$ROOT_DIR/supabase/config.toml" \
  || fail "supabase/config.toml must expose the expected local API port $LOCAL_API_PORT"
for edge_function in "${EDGE_FUNCTIONS[@]}"; do
  edge_dir="$EDGE_ROOT/$edge_function"
  [[ -f "$edge_dir/deno.json" && -f "$edge_dir/deno.lock" ]] \
    || fail "Edge Function $edge_function must commit deno.json and deno.lock"
  awk -v section="[functions.$edge_function]" '
    $0 == section { in_section = 1; next }
    in_section && /^\[/ { exit 1 }
    in_section && $0 == "verify_jwt = true" { found = 1; exit 0 }
    END { if (!found) exit 1 }
  ' "$ROOT_DIR/supabase/config.toml" \
    || fail "supabase/config.toml must enable JWT verification for $edge_function"
done

sql_tests=(
  "$ROOT_DIR/supabase/tests/rls_matrix.sql"
  "$ROOT_DIR/supabase/tests/backend_security_hardening.sql"
  "$ROOT_DIR/supabase/tests/claim_dossier_vertical.sql"
)
for sql_test in "${sql_tests[@]}"; do
  [[ -f "$sql_test" ]] || fail "missing SQL matrix: $sql_test"
  [[ "$(grep -Ec '^begin;$' "$sql_test")" -eq 1 ]] \
    || fail "SQL matrix must contain exactly one top-level begin: $sql_test"
  [[ "$(grep -Ec '^rollback;$' "$sql_test")" -eq 1 ]] \
    || fail "SQL matrix must contain exactly one top-level rollback: $sql_test"
  ! grep -Eiq '^[[:space:]]*commit[[:space:]]*;' "$sql_test" \
    || fail "SQL matrix contains a commit: $sql_test"
  [[ "$(awk 'NF { last=$0 } END { print last }' "$sql_test")" == "rollback;" ]] \
    || fail "SQL matrix has content after its final rollback: $sql_test"
done

docker info >/dev/null 2>&1 \
  || fail "Docker is installed but its daemon is not running"

deno_mode=docker
if command -v deno >/dev/null 2>&1; then
  actual_deno="$(deno --version | sed -n 's/^deno //p' | head -n 1)"
  [[ "$actual_deno" == "$EXPECTED_DENO" ]] \
    || fail "Deno $EXPECTED_DENO is required to match CI (found ${actual_deno:-unknown})"
  deno_mode=native
else
  deno_cache_volume="parallax-deno-release-${PPID}-${RANDOM}"
  docker volume create "$deno_cache_volume" >/dev/null
fi

run_deno() {
  local edge_function="$1"
  shift
  if [[ "$deno_mode" == native ]]; then
    (
      cd "$EDGE_ROOT/$edge_function"
      deno "$@"
    )
  else
    docker run --rm \
      --volume "$SUPABASE_DIR:/work:ro" \
      --volume "$deno_cache_volume:/deno-dir" \
      --env DENO_DIR=/deno-dir \
      --workdir "/work/functions/$edge_function" \
      "denoland/deno:$EXPECTED_DENO" \
      deno "$@"
  fi
}

resolved_deno="$(run_deno "${EDGE_FUNCTIONS[0]}" --version | sed -n 's/^deno //p' | head -n 1)"
[[ "$resolved_deno" == "$EXPECTED_DENO" ]] \
  || fail "resolved Deno runtime must be $EXPECTED_DENO (found ${resolved_deno:-unknown})"

printf '%s\n' \
  'release-gate: DESTRUCTIVE LOCAL ACTION CONFIRMED' \
  "  project_id: $LOCAL_PROJECT_ID" \
  "  API port:   $LOCAL_API_PORT" \
  '  command:    supabase db reset --local --yes' \
  '  scope:      the disposable local Parallax database only' \
  '  remote:     no link, push, deploy, secret change, or hosted mutation' \
  ''

printf 'release-gate: frontend clean install, QA, dependency audit, and Playwright\n'
node --test "$ROOT_DIR/scripts/lib/public-key.test.mjs"
(
  cd "$APP_DIR"
  export npm_config_engine_strict=true
  npm ci
  VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' npm run qa:release
  npm audit --audit-level=high
)

printf 'release-gate: frozen Edge dependency, format, lint, type, and unit matrix\n'
for edge_function in "${EDGE_FUNCTIONS[@]}"; do
  printf 'release-gate: checking Edge Function %s\n' "$edge_function"
  edge_lock="$EDGE_ROOT/$edge_function/deno.lock"
  edge_lock_before="$(shasum -a 256 "$edge_lock" | awk '{print $1}')"
  run_deno "$edge_function" ci
  run_deno "$edge_function" task fmt
  run_deno "$edge_function" task lint
  run_deno "$edge_function" task check
  run_deno "$edge_function" task test
  edge_lock_after="$(shasum -a 256 "$edge_lock" | awk '{print $1}')"
  [[ "$edge_lock_after" == "$edge_lock_before" ]] \
    || fail "Edge checks changed the frozen $edge_function/deno.lock"
done

bootstrap_args=(--reset)
if [[ "$REPLACE_ENV" == true ]]; then
  bootstrap_args+=(--replace-env)
fi
"$ROOT_DIR/scripts/bootstrap-local.sh" "${bootstrap_args[@]}"

printf 'release-gate: authenticated Edge integration and idempotent replay\n'
npm --prefix "$APP_DIR" run test:supabase:smoke

printf 'release-gate: database lint\n'
(
  cd "$ROOT_DIR"
  supabase db lint \
    --local \
    --schema public,private \
    --level warning \
    --fail-on error
)

printf 'release-gate: final static build and HTTP routing smoke\n'
(
  cd "$APP_DIR"
  VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' npm run build:test
  npm run check:bundle
)

server_log="$(mktemp "${TMPDIR:-/tmp}/parallax-release-http.XXXXXX")"
node "$ROOT_DIR/scripts/serve-dist.mjs" --root "$APP_DIR/dist" --port "$SMOKE_PORT" \
  >"$server_log" 2>&1 &
server_pid=$!

server_ready=false
for _attempt in $(seq 1 80); do
  if curl --fail --silent --show-error \
    "http://127.0.0.1:$SMOKE_PORT/" \
    --output /dev/null; then
    server_ready=true
    break
  fi
  if ! kill -0 "$server_pid" 2>/dev/null; then
    sed -n '1,120p' "$server_log" >&2
    fail "local HTTP harness exited before becoming ready"
  fi
  sleep 0.25
done
[[ "$server_ready" == true ]] || {
  sed -n '1,120p' "$server_log" >&2
  fail "local HTTP harness did not become ready"
}

node "$ROOT_DIR/scripts/smoke-http.mjs" \
  --base-url "http://127.0.0.1:$SMOKE_PORT" \
  --canonical-origin "http://127.0.0.1:$SMOKE_PORT"

printf '%s\n' \
  '' \
  'release-gate: PASS' \
  'All repository-local release gates passed. No deployment or remote mutation was performed.' \
  'A real Cloudflare preview, isolated hosted Supabase test, and recorded browser role journey remain external promotion gates.'
