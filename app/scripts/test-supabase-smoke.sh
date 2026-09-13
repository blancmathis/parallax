#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
local_network="parallax-local-loopback-$(id -u)"
edge_functions=(analyze-seed capture-source)

for command_name in supabase curl docker jq node psql; do
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "[supabase-smoke] ${command_name} is required" >&2
    exit 1
  fi
done

status_json="$(cd "${repo_root}" && supabase status --output json)"
api_url="$(jq -er '.API_URL // .api_url' <<<"${status_json}")"
anon_key="$(jq -er '.ANON_KEY // .anon_key' <<<"${status_json}")"
db_url="$(jq -er '.DB_URL // .db_url' <<<"${status_json}")"
function_url="${api_url}/functions/v1/analyze-seed"

runtime_tmp="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
edge_log="$(mktemp "${runtime_tmp}/parallax-edge-functions.log.XXXXXX")"
response_file="$(mktemp "${runtime_tmp}/parallax-analyze-response.json.XXXXXX")"
reused_response_file="$(mktemp "${runtime_tmp}/parallax-analyze-reused.json.XXXXXX")"
edge_pid=""

print_edge_log() {
  if [[ -f "${edge_log}" ]]; then
    sed -n '1,240p' "${edge_log}" >&2
  fi
}

cleanup() {
  if [[ -n "${edge_pid}" ]]; then
    kill "${edge_pid}" 2>/dev/null || true
    wait "${edge_pid}" 2>/dev/null || true
  fi
  for temporary_file in "${edge_log}" "${response_file}" "${reused_response_file}"; do
    [[ ! -e "${temporary_file}" ]] || unlink "${temporary_file}"
  done
}

trap print_edge_log ERR
trap cleanup EXIT

edge_serve_args=()
if docker network inspect "${local_network}" >/dev/null 2>&1; then
  edge_serve_args+=(--network-id "${local_network}")
fi

(
  cd "${repo_root}"
  exec supabase functions serve "${edge_serve_args[@]}"
) >"${edge_log}" 2>&1 &
edge_pid=$!

ready=0
for _attempt in $(seq 1 60); do
  functions_ready=1
  for edge_function in "${edge_functions[@]}"; do
    if ! curl --fail --silent --show-error \
      --request OPTIONS \
      "${api_url}/functions/v1/${edge_function}" \
      --output /dev/null; then
      functions_ready=0
      break
    fi
  done
  if [[ "${functions_ready}" -eq 1 ]]; then
    ready=1
    break
  fi
  if ! kill -0 "${edge_pid}" 2>/dev/null; then
    echo "[supabase-smoke] Edge Function exited before becoming ready" >&2
    print_edge_log
    exit 1
  fi
  sleep 1
done

if [[ "${ready}" -ne 1 ]]; then
  echo "[supabase-smoke] Edge Function did not become ready" >&2
  print_edge_log
  exit 1
fi

PARALLAX_SMOKE_PUBLIC_KEY="${anon_key}" \
PARALLAX_SMOKE_LOGIN_PASSWORD='Parallax123!' \
node "${repo_root}/scripts/smoke-http.mjs" \
  --supabase-url "${api_url}" \
  --public-key-env PARALLAX_SMOKE_PUBLIC_KEY \
  --login-email user@example.test \
  --login-password-env PARALLAX_SMOKE_LOGIN_PASSWORD \
  --allowed-origin http://127.0.0.1:5173 \
  --denied-origin http://127.0.0.1:5174

auth_response="$(
  curl --fail-with-body --silent --show-error \
    "${api_url}/auth/v1/token?grant_type=password" \
    --header "apikey: ${anon_key}" \
    --header "content-type: application/json" \
    --data '{"email":"user@example.test","password":"Parallax123!"}'
)"
access_token="$(
  jq -er '.access_token | select(type == "string" and length > 20)' \
    <<<"${auth_response}"
)"
actor_id="$(
  jq -er '
    .user.id |
    select(type == "string" and test("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"))
  ' <<<"${auth_response}"
)"

capture_function_url="${api_url}/functions/v1/capture-source"
capture_key="$(node -e 'process.stdout.write(crypto.randomUUID())')"
capture_target="https://localhost/parallax-smoke/${capture_key}"
capture_payload="$(
  jq -nc \
    --arg url "${capture_target}" \
    --arg key "${capture_key}" \
    '{url:$url,idempotency_key:$key}'
)"

capture_response="$(
  curl --fail-with-body --silent --show-error \
    "${capture_function_url}" \
    --header "apikey: ${anon_key}" \
    --header "authorization: Bearer ${access_token}" \
    --header "origin: http://127.0.0.1:5173" \
    --header "content-type: application/json" \
    --data "${capture_payload}"
)"

jq -e \
  --arg url "${capture_target}" '
    .ok == true and
    .reused == false and
    .requested_url == $url and
    .final_url == $url and
    .status == "blocked" and
    .byte_length == 0 and
    .raw_hash == null and
    .normalized_hash == null and
    .normalized_text == null and
    .is_truncated == false and
    ((.artifact_id // "") | test("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")) and
    ((.request_id // "") | length > 0) and
    (has("raw_content_base64") | not) and
    (has("raw_bytes") | not)
  ' <<<"${capture_response}" >/dev/null

capture_artifact_id="$(jq -er '.artifact_id' <<<"${capture_response}")"
capture_replay="$(
  curl --fail-with-body --silent --show-error \
    "${capture_function_url}" \
    --header "apikey: ${anon_key}" \
    --header "authorization: Bearer ${access_token}" \
    --header "origin: http://127.0.0.1:5173" \
    --header "content-type: application/json" \
    --data "${capture_payload}"
)"

jq -e \
  --arg artifact_id "${capture_artifact_id}" \
  --arg url "${capture_target}" '
    .ok == true and
    .reused == true and
    .artifact_id == $artifact_id and
    .requested_url == $url and
    .final_url == $url and
    .status == "blocked" and
    .byte_length == 0 and
    .raw_hash == null and
    .normalized_hash == null and
    .normalized_text == null and
    ((.request_id // "") | length > 0)
  ' <<<"${capture_replay}" >/dev/null

capture_persisted="$(
  psql "${db_url}" -X -At \
    --set ON_ERROR_STOP=1 \
    --set actor_id="${actor_id}" \
    --set idempotency_key="${capture_key}" \
    --set artifact_id="${capture_artifact_id}" \
    --set requested_url="${capture_target}" <<'SQL'
select
  (
    select count(*) = 1
    from private.source_artifacts artifact
    where artifact.id = :'artifact_id'::uuid
      and artifact.created_by = :'actor_id'::uuid
      and artifact.idempotency_key = :'idempotency_key'::uuid
      and artifact.requested_url = :'requested_url'
      and artifact.final_url = :'requested_url'
      and artifact.retrieval_status = 'blocked'
      and artifact.failure_code = 'blocked-before-fetch'
      and artifact.raw_content is null
      and artifact.byte_length = 0
      and artifact.raw_sha256 is null
      and artifact.normalized_text is null
      and artifact.normalized_sha256 is null
      and artifact.is_truncated is false
      and artifact.capture_metadata ->> 'locator' = 'blocked-before-fetch'
  )
  and (
    select count(*) = 1
    from private.source_capture_reservations reservation
    where reservation.actor_id = :'actor_id'::uuid
      and reservation.idempotency_key = :'idempotency_key'::uuid
      and reservation.requested_url = :'requested_url'
      and reservation.state = 'complete'
      and reservation.artifact_id = :'artifact_id'::uuid
  );
SQL
)"

if [[ "${capture_persisted}" != "t" ]]; then
  echo "[supabase-smoke] persisted blocked capture or replay is incomplete" >&2
  exit 1
fi

echo "[supabase-smoke] authenticated blocked capture, idempotent replay, and private persistence passed"

packet_response="$(
  curl --fail-with-body --silent --show-error \
    "${api_url}/rest/v1/rpc/create_seed_packet" \
    --header "apikey: ${anon_key}" \
    --header "authorization: Bearer ${access_token}" \
    --header "content-type: application/json" \
    --data '{
      "p_question":"Should this disposable CI topic be analyzed?",
      "p_initial_position":"Yes, through the deterministic mock path.",
      "p_initial_arguments":["The integration path must remain reproducible."],
      "p_sources":[]
    }'
)"
packet_id="$(
  jq -er '
    select(
      type == "string" and
      test("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
    )
  ' <<<"${packet_response}"
)"

curl --fail-with-body --silent --show-error \
  "${function_url}" \
  --header "apikey: ${anon_key}" \
  --header "authorization: Bearer ${access_token}" \
  --header "content-type: application/json" \
  --data "{\"seed_packet_id\":\"${packet_id}\",\"provider\":\"mock\"}" \
  --output "${response_file}"

jq -e '
  .provider == "mock" and
  .reused == false and
  (.revision_id | type == "string" and length > 0) and
  (.request_id | type == "string" and length > 0) and
  (.retrievals | type == "array" and length == 0)
' "${response_file}" >/dev/null

revision_id="$(jq -er '.revision_id' "${response_file}")"

curl --fail-with-body --silent --show-error \
  "${function_url}" \
  --header "apikey: ${anon_key}" \
  --header "authorization: Bearer ${access_token}" \
  --header "content-type: application/json" \
  --data "{\"seed_packet_id\":\"${packet_id}\",\"provider\":\"mock\"}" \
  --output "${reused_response_file}"

jq -e \
  --arg revision_id "${revision_id}" \
  '.provider == "mock" and .reused == true and .revision_id == $revision_id' \
  "${reused_response_file}" >/dev/null

persisted="$(
  psql "${db_url}" -X -At \
    --set ON_ERROR_STOP=1 \
    --set packet_id="${packet_id}" \
    --set revision_id="${revision_id}" <<'SQL'
select exists (
  select 1
  from public.seed_packets sp
  where sp.id = :'packet_id'::uuid
    and sp.status = 'analyzed'
    and sp.generated_revision_id = :'revision_id'
    and exists (
      select 1
      from public.ai_jobs job
      where job.seed_packet_id = sp.id
        and job.status = 'completed'
    )
    and exists (
      select 1
      from public.debate_revisions revision
      where revision.id = sp.generated_revision_id
        and revision.status = 'draft'
    )
);
SQL
)"

if [[ "${persisted}" != "t" ]]; then
  echo "[supabase-smoke] persisted mock analysis is incomplete" >&2
  exit 1
fi

echo "[supabase-smoke] authenticated mock analysis and idempotent replay passed"
