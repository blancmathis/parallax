#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"

if ! command -v supabase >/dev/null 2>&1; then
  echo "[rls] Supabase CLI is required" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "[rls] PostgreSQL client (psql) is required" >&2
  exit 1
fi

status_env="$(cd "${repo_root}" && supabase status --output env)"
db_url="$(printf '%s\n' "${status_env}" | sed -n 's/^DB_URL="\(.*\)"$/\1/p')"

if [[ -z "${db_url}" ]]; then
  echo "[rls] Could not resolve DB_URL from supabase status" >&2
  exit 1
fi

test_files=(
  "${repo_root}/supabase/tests/rls_matrix.sql"
  "${repo_root}/supabase/tests/backend_security_hardening.sql"
  "${repo_root}/supabase/tests/claim_dossier_vertical.sql"
)

for test_file in "${test_files[@]}"; do
  if [[ ! -f "${test_file}" ]]; then
    echo "[rls] Missing SQL test: ${test_file}" >&2
    exit 1
  fi
  echo "[rls] Running ${test_file#"${repo_root}/"}"
  psql "${db_url}" -X \
    --set ON_ERROR_STOP=1 \
    --file "${test_file}"
done
