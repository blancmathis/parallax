#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/app"
APP_ENV="$APP_DIR/.env.local"
STACK_OWNER_FILE="$ROOT_DIR/supabase/.temp/parallax-bootstrap-owner"
EXPECTED_SUPABASE_CLI="2.75.0"
LOCAL_PROJECT_ID="parallax-local"
LOCAL_API_PORT="55421"
LOCAL_DOCKER_NETWORK="parallax-local-loopback-$(id -u)"
BOOTSTRAP_LOCK_DIR="${TMPDIR:-/tmp}/parallax-local-bootstrap-$(id -u).lock"
RESET_CONFIRMED=false
REPLACE_ENV=false
LOCK_ACQUIRED=false
SQL_TESTS=(
  "$ROOT_DIR/supabase/tests/rls_matrix.sql"
  "$ROOT_DIR/supabase/tests/backend_security_hardening.sql"
  "$ROOT_DIR/supabase/tests/claim_dossier_vertical.sql"
)

usage() {
  printf '%s\n' \
    'Usage: ./scripts/bootstrap-local.sh --reset [--replace-env]' \
    '' \
    'Creates a disposable local Parallax stack from migrations and seed data.' \
    '--reset is mandatory because the command erases the local Parallax database.' \
    '--replace-env atomically replaces the ignored app/.env.local file.'
}

fail() {
  printf 'bootstrap-local: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  if [[ "$LOCK_ACQUIRED" == true && -d "$BOOTSTRAP_LOCK_DIR" ]]; then
    [[ ! -e "$BOOTSTRAP_LOCK_DIR/pid" ]] || unlink "$BOOTSTRAP_LOCK_DIR/pid"
    [[ ! -e "$BOOTSTRAP_LOCK_DIR/root" ]] || unlink "$BOOTSTRAP_LOCK_DIR/root"
    rmdir "$BOOTSTRAP_LOCK_DIR" 2>/dev/null || true
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

for command_name in docker node npm psql supabase; do
  command -v "$command_name" >/dev/null 2>&1 || fail "missing required command: $command_name"
done

actual_supabase_cli="$(supabase --version 2>/dev/null)"
[[ "$actual_supabase_cli" == "$EXPECTED_SUPABASE_CLI" ]] \
  || fail "Supabase CLI $EXPECTED_SUPABASE_CLI is required (found $actual_supabase_cli)"

expected_npm="$(node -e 'const p=require(process.argv[1]); const v=p.packageManager?.match(/^npm@(.+)$/)?.[1]; if (!v) process.exit(2); process.stdout.write(v)' "$APP_DIR/package.json")" \
  || fail "app/package.json must pin packageManager as npm@<version>"
actual_npm="$(npm --version)"
[[ "$actual_npm" == "$expected_npm" ]] \
  || fail "npm $expected_npm is required by app/package.json (found $actual_npm)"

docker info >/dev/null 2>&1 \
  || fail "Docker is installed but its daemon is not running"

for sql_test in "${SQL_TESTS[@]}"; do
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

if ! mkdir "$BOOTSTRAP_LOCK_DIR" 2>/dev/null; then
  lock_pid="$(sed -n '1p' "$BOOTSTRAP_LOCK_DIR/pid" 2>/dev/null || true)"
  lock_root="$(sed -n '1p' "$BOOTSTRAP_LOCK_DIR/root" 2>/dev/null || true)"
  fail "another local bootstrap owns $BOOTSTRAP_LOCK_DIR (pid ${lock_pid:-unknown}, checkout ${lock_root:-unknown}); wait for it, or remove that exact stale directory only after confirming the process is gone"
fi
LOCK_ACQUIRED=true
umask 077
printf '%s\n' "$$" >"$BOOTSTRAP_LOCK_DIR/pid"
printf '%s\n' "$ROOT_DIR" >"$BOOTSTRAP_LOCK_DIR/root"

if ! docker network inspect "$LOCAL_DOCKER_NETWORK" >/dev/null 2>&1; then
  docker network create \
    --driver bridge \
    --opt com.docker.network.bridge.host_binding_ipv4=127.0.0.1 \
    "$LOCAL_DOCKER_NETWORK" >/dev/null
fi
network_driver="$(docker network inspect "$LOCAL_DOCKER_NETWORK" --format '{{.Driver}}')"
network_binding="$(
  docker network inspect "$LOCAL_DOCKER_NETWORK" \
    --format '{{index .Options "com.docker.network.bridge.host_binding_ipv4"}}'
)"
[[ "$network_driver" == "bridge" && "$network_binding" == "127.0.0.1" ]] \
  || fail "Docker network $LOCAL_DOCKER_NETWORK must be a bridge bound to 127.0.0.1"

api_port_owners="$(docker ps --filter publish="$LOCAL_API_PORT" --format '{{.Names}}')"
if [[ -n "$api_port_owners" && "$api_port_owners" != "supabase_kong_parallax-local" ]]; then
  fail "port $LOCAL_API_PORT belongs to another local stack ($api_port_owners); inspect it and stop that exact project explicitly"
fi

existing_stack="$(
  docker ps -a \
    --filter label="com.supabase.cli.project=$LOCAL_PROJECT_ID" \
    --format '{{.ID}} {{.Names}}' \
    | LC_ALL=C sort
)"
if [[ -n "$existing_stack" ]]; then
  existing_db_id="$(
    docker ps -a \
      --filter label="com.supabase.cli.project=$LOCAL_PROJECT_ID" \
      --filter name='^supabase_db_parallax-local$' \
      --format '{{.ID}}' \
      | head -n 1
  )"
  [[ -n "$existing_db_id" ]] \
    || fail "a partial $LOCAL_PROJECT_ID stack exists without its database container; stop that exact project explicitly before resetting"
  [[ -f "$STACK_OWNER_FILE" ]] \
    || fail "a $LOCAL_PROJECT_ID stack exists but this checkout has no ownership marker; stop that exact stack explicitly"
  recorded_root="$(sed -n '1p' "$STACK_OWNER_FILE")"
  recorded_db_id="$(sed -n '2p' "$STACK_OWNER_FILE")"
  [[ "$recorded_root" == "$ROOT_DIR" && "$recorded_db_id" == "$existing_db_id" ]] \
    || fail "the $LOCAL_PROJECT_ID stack belongs to another checkout or predates the ownership guard; stop it explicitly before continuing"
fi

printf 'bootstrap-local: installing the locked frontend dependencies\n'
(
  cd "$APP_DIR"
  npm_config_engine_strict=true npm ci
)

printf 'bootstrap-local: starting Supabase CLI %s on loopback-only Docker network %s\n' \
  "$EXPECTED_SUPABASE_CLI" "$LOCAL_DOCKER_NETWORK"
(
  cd "$ROOT_DIR"
  supabase start --yes --network-id "$LOCAL_DOCKER_NETWORK"
)

running_db_id="$(
  docker ps \
    --filter label="com.supabase.cli.project=$LOCAL_PROJECT_ID" \
    --filter name='^supabase_db_parallax-local$' \
    --format '{{.ID}}' \
    | head -n 1
)"
[[ -n "$running_db_id" ]] \
  || fail "Supabase started without the expected $LOCAL_PROJECT_ID database container"

running_stack="$(
  docker ps \
    --filter label="com.supabase.cli.project=$LOCAL_PROJECT_ID" \
    --format '{{.ID}} {{.Names}}' \
    | LC_ALL=C sort
)"
[[ -n "$running_stack" ]] || fail "Supabase started without project containers"
while read -r container_id container_name; do
  networks="$(docker inspect "$container_id" --format '{{json .NetworkSettings.Networks}}')"
  grep -Fq "\"$LOCAL_DOCKER_NETWORK\"" <<<"$networks" \
    || fail "$container_name is not attached to loopback-only network $LOCAL_DOCKER_NETWORK"
  while IFS= read -r host_ip; do
    [[ -z "$host_ip" || "$host_ip" == "127.0.0.1" ]] \
      || fail "$container_name publishes a port on non-loopback address $host_ip"
  done < <(
    docker inspect "$container_id" \
      --format '{{range $bindings := .NetworkSettings.Ports}}{{range $bindings}}{{println .HostIp}}{{end}}{{end}}'
  )
done <<<"$running_stack"

mkdir -p "$(dirname "$STACK_OWNER_FILE")"
owner_temp="$(mktemp "${STACK_OWNER_FILE}.tmp.XXXXXX")"
printf '%s\n%s\n' "$ROOT_DIR" "$running_db_id" >"$owner_temp"
chmod 600 "$owner_temp"
mv "$owner_temp" "$STACK_OWNER_FILE"

printf 'bootstrap-local: rebuilding the disposable database from migrations and seed\n'
(
  cd "$ROOT_DIR"
  supabase db reset --local --yes
)

status_env="$(cd "$ROOT_DIR" && supabase status -o env)"

status_value() {
  local key="$1"
  local value
  value="$(printf '%s\n' "$status_env" | sed -n "s/^${key}=\"\(.*\)\"$/\1/p" | head -n 1)"
  [[ -n "$value" ]] || return 1
  printf '%s' "$value"
}

api_url="$(status_value API_URL)" || fail "Supabase status did not expose API_URL"
db_url="$(status_value DB_URL)" || fail "Supabase status did not expose DB_URL"
studio_url="$(status_value STUDIO_URL)" || fail "Supabase status did not expose STUDIO_URL"
inbucket_url="$(status_value INBUCKET_URL || status_value MAILPIT_URL)" \
  || fail "Supabase status did not expose Inbucket/Mailpit URL"
public_key="$(status_value PUBLISHABLE_KEY || status_value ANON_KEY)" \
  || fail "Supabase status did not expose a browser-safe public key"

[[ "$api_url" == "http://127.0.0.1:$LOCAL_API_PORT" ]] \
  || fail "unexpected local API URL $api_url (expected http://127.0.0.1:$LOCAL_API_PORT)"

write_app_env() {
  local temp_env
  temp_env="$(mktemp "${APP_ENV}.tmp.XXXXXX")"
  trap '[[ ! -e "$temp_env" ]] || unlink "$temp_env"' RETURN
  umask 077
  printf '%s\n' \
    '# Generated by scripts/bootstrap-local.sh from the running local stack.' \
    "VITE_SUPABASE_URL=$api_url" \
    "VITE_SUPABASE_ANON_KEY=$public_key" \
    'VITE_SITE_ORIGIN=http://127.0.0.1:5173' \
    >"$temp_env"
  chmod 600 "$temp_env"
  mv "$temp_env" "$APP_ENV"
  trap - RETURN
}

expected_app_env="$(printf '%s\n' \
  '# Generated by scripts/bootstrap-local.sh from the running local stack.' \
  "VITE_SUPABASE_URL=$api_url" \
  "VITE_SUPABASE_ANON_KEY=$public_key" \
  'VITE_SITE_ORIGIN=http://127.0.0.1:5173')"

if [[ -e "$APP_ENV" && "$REPLACE_ENV" != true ]]; then
  [[ "$(<"$APP_ENV")" == "$expected_app_env" ]] \
    || fail "$APP_ENV is stale, duplicated, or custom; rerun with --replace-env to replace it explicitly"
  printf 'bootstrap-local: preserving the already-correct ignored app/.env.local\n'
else
  write_app_env
  printf 'bootstrap-local: wrote browser-safe values to ignored app/.env.local\n'
fi

printf 'bootstrap-local: running the transactional SQL authorization matrices\n'
for sql_test in "${SQL_TESTS[@]}"; do
  psql "$db_url" -X -v ON_ERROR_STOP=1 -f "$sql_test"
done

printf 'bootstrap-local: starting and testing both local Edge Functions\n'
npm --prefix "$APP_DIR" run test:supabase:smoke

printf '%s\n' \
  '' \
  'Local stack is ready.' \
  "  Supabase Studio: $studio_url" \
  "  Test mailbox:   $inbucket_url" \
  "  Start Edge:     supabase functions serve --network-id $LOCAL_DOCKER_NETWORK" \
  '  Start the app:  cd app && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort' \
  '' \
  'Seed accounts (local database only; password: Parallax123!):' \
  '  user@example.test' \
  '  reviewer@example.test' \
  '  admin@example.test'
