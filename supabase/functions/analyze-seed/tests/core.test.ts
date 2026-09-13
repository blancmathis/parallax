import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  aiFailureCodeFor,
  createDeadlineFetch,
  HttpError,
  isAllowedContentType,
  isBlockedHost,
  isLeaseStale,
  isLikelyTextContent,
  LIMITS,
  parseAiJobClaim,
  parseAllowedOrigins,
  parseAnalyzeRequest,
  parseSourceInputs,
  readBoundedJson,
  resolvePublicHost,
  sanitizeUrlForStorage,
} from "../core.ts";

function errorCode(action: () => unknown) {
  try {
    action();
  } catch (error) {
    assert.ok(error instanceof HttpError);
    return error.code;
  }
  assert.fail("expected HttpError");
}

test("parseAnalyzeRequest accepts a canonical UUID and defaults to mock", () => {
  assert.deepEqual(
    parseAnalyzeRequest({
      seed_packet_id: "11111111-2222-3333-4444-555555555555",
    }),
    {
      seedPacketId: "11111111-2222-3333-4444-555555555555",
      provider: "mock",
    },
  );
});

test("CORS origins are exact, HTTPS-only in production, and fail closed", () => {
  const production = parseAllowedOrigins(
    "https://app.example.com",
    "https://project.supabase.co",
  );
  assert.deepEqual([...production], ["https://app.example.com"]);
  assert.equal(production.has("https://app.example.com.evil.test"), false);

  for (
    const invalid of [
      "http://app.example.com",
      "https://user:pass@app.example.com",
      "https://app.example.com/path",
      "https://app.example.com?query=1",
      "https://app.example.com#fragment",
      "https://app.example.com,javascript:alert(1)",
      "https://app.example.com,",
    ]
  ) {
    assert.equal(
      errorCode(() =>
        parseAllowedOrigins(invalid, "https://project.supabase.co")
      ),
      "invalid_cors_configuration",
    );
  }

  const local = parseAllowedOrigins("", "http://127.0.0.1:55421");
  assert.deepEqual([...local].sort(), [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
  ]);
  assert.deepEqual(
    [...parseAllowedOrigins("http://localhost:4173", "")],
    ["http://localhost:4173"],
  );
});

test("AI job failures are reduced to the database allowlist", () => {
  assert.equal(
    aiFailureCodeFor(new HttpError(504, "database_timeout")),
    "timeout",
  );
  assert.equal(
    aiFailureCodeFor(new HttpError(502, "source_retrieval_failed")),
    "source_retrieval_failed",
  );
  assert.equal(
    aiFailureCodeFor(new HttpError(503, "analysis_failed")),
    "analysis_failed",
  );
  assert.equal(
    aiFailureCodeFor(new HttpError(503, "invalid_analysis_result")),
    "invalid_analysis_result",
  );
  assert.equal(aiFailureCodeFor(new Error("raw provider detail")), "unknown");
});

test("claim RPC output is validated before orchestration", () => {
  assert.deepEqual(
    parseAiJobClaim({
      ok: true,
      state: "claimed",
      replayed: false,
      claim_token: "10000000-0000-0000-0000-000000000001",
      lease_expires_at: "2026-08-30T12:01:00Z",
      quota_remaining: 19,
    }),
    {
      state: "claimed",
      leaseExpiresAt: "2026-08-30T12:01:00Z",
      claimToken: "10000000-0000-0000-0000-000000000001",
      replayed: false,
      quotaRemaining: 19,
    },
  );
  assert.deepEqual(
    parseAiJobClaim({
      ok: true,
      state: "claimed",
      replayed: true,
      claim_token: "10000000-0000-0000-0000-000000000001",
      lease_expires_at: "2026-08-30T12:01:00Z",
    }),
    {
      state: "claimed",
      leaseExpiresAt: "2026-08-30T12:01:00Z",
      claimToken: "10000000-0000-0000-0000-000000000001",
      replayed: true,
    },
  );
  assert.deepEqual(
    parseAiJobClaim({
      ok: true,
      state: "completed",
      revision_id: "rev_test_draft",
    }),
    { state: "completed", revisionId: "rev_test_draft" },
  );
  assert.deepEqual(
    parseAiJobClaim({
      ok: false,
      state: "in_progress",
      lease_expires_at: "2026-08-30T12:01:00Z",
    }),
    {
      state: "in_progress",
      leaseExpiresAt: "2026-08-30T12:01:00Z",
    },
  );
  assert.deepEqual(
    parseAiJobClaim({
      ok: false,
      state: "quota_exceeded",
      retry_after_seconds: 120,
    }),
    { state: "quota_exceeded", retryAfterSeconds: 120 },
  );
  assert.deepEqual(
    parseAiJobClaim({
      ok: false,
      state: "failed",
      error_code: "timeout",
    }),
    { state: "failed", errorCode: "timeout" },
  );
  assert.equal(
    errorCode(() =>
      parseAiJobClaim({
        ok: true,
        state: "claimed",
        replayed: false,
        claim_token: "10000000-0000-0000-0000-000000000001",
        lease_expires_at: "bad",
        quota_remaining: 19,
      })
    ),
    "invalid_claim_result",
  );
  assert.equal(
    errorCode(() =>
      parseAiJobClaim({
        ok: true,
        state: "claimed",
        replayed: false,
        claim_token: "not-a-uuid",
        lease_expires_at: "2026-08-30T12:01:00Z",
        quota_remaining: 19,
      })
    ),
    "invalid_claim_result",
  );
  assert.equal(
    errorCode(() =>
      parseAiJobClaim({
        ok: false,
        state: "quota_exceeded",
        retry_after_seconds: 0,
      })
    ),
    "invalid_claim_result",
  );
  assert.equal(
    errorCode(() =>
      parseAiJobClaim({
        ok: true,
        state: "completed",
        revision_id: "rev_test_draft",
        unexpected: true,
      })
    ),
    "invalid_claim_result",
  );
  assert.equal(
    errorCode(() =>
      parseAiJobClaim({
        ok: true,
        state: "completed",
        revision_id: "../../unexpected",
      })
    ),
    "invalid_claim_result",
  );
});

test("parseAnalyzeRequest rejects loose UUIDs, unknown providers, and unknown keys", () => {
  assert.equal(
    errorCode(() =>
      parseAnalyzeRequest({
        seed_packet_id: "------------------------------------",
      })
    ),
    "invalid_seed_packet_id",
  );
  assert.equal(
    errorCode(() =>
      parseAnalyzeRequest({
        seed_packet_id: "11111111-2222-3333-4444-555555555555",
        provider: "other",
      })
    ),
    "invalid_provider",
  );
  assert.equal(
    errorCode(() =>
      parseAnalyzeRequest({
        seed_packet_id: "11111111-2222-3333-4444-555555555555",
        extra: true,
      })
    ),
    "invalid_payload",
  );
});

test("readBoundedJson enforces media type and streamed byte limits", async () => {
  const valid = new Request("https://example.test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ok: true }),
  });
  assert.deepEqual(await readBoundedJson(valid), { ok: true });

  const wrongType = new Request("https://example.test", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "{}",
  });
  await assert.rejects(() => readBoundedJson(wrongType), {
    code: "content_type_required",
  });

  const tooLarge = new Request("https://example.test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(64) }),
  });
  await assert.rejects(() => readBoundedJson(tooLarge, 16), {
    code: "request_too_large",
  });
});

test("deadline fetch aborts the underlying network operation", async () => {
  let observedAbort = false;
  const neverCompletes =
    ((_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          observedAbort = true;
          reject(new DOMException("aborted", "AbortError"));
        }, { once: true });
      })) as typeof fetch;
  const bounded = createDeadlineFetch(10, neverCompletes);
  await assert.rejects(() => bounded("https://example.test"), {
    name: "AbortError",
  });
  assert.equal(observedAbort, true);
});

test("parseSourceInputs validates count, shape, size, protocol, ports, and notes", () => {
  assert.deepEqual(
    parseSourceInputs([
      { url: "https://example.com/source#fragment", note: " primary source " },
    ]),
    [
      { url: "https://example.com/source", note: "primary source" },
    ],
  );
  assert.equal(
    errorCode(() =>
      parseSourceInputs(Array.from({ length: LIMITS.sourceCount + 1 }, () => ({
        url: "https://example.com",
      })))
    ),
    "too_many_sources",
  );
  assert.equal(
    errorCode(() => parseSourceInputs([null])),
    "invalid_source_input",
  );
  assert.equal(
    errorCode(() => parseSourceInputs([{ url: 42 }])),
    "invalid_source_url",
  );
  assert.equal(
    errorCode(() =>
      parseSourceInputs([{ url: "https://example.com:8443/source" }])
    ),
    "source_port_not_allowed",
  );
  assert.equal(
    errorCode(() =>
      parseSourceInputs([{
        url: "https://example.com",
        note: "x".repeat(LIMITS.sourceNoteCharacters + 1),
      }])
    ),
    "source_note_too_large",
  );
  assert.equal(
    errorCode(() =>
      parseSourceInputs([{
        url: "https://example.com/report?api%5Fkey=must-not-leak",
      }])
    ),
    "source_url_contains_credentials",
  );
  assert.equal(
    errorCode(() =>
      parseSourceInputs([{
        url: `https://example.com/${"漢".repeat(1_500)}`,
      }])
    ),
    "invalid_source_url",
  );
});

test("network policy rejects private, special, mapped, and non-global addresses", () => {
  for (
    const hostname of [
      "127.0.0.1",
      "100.64.0.1",
      "169.254.169.254",
      "198.18.0.1",
      "[::1]",
      "[::ffff:7f00:1]",
      "[fc00::1]",
      "[fe80::1]",
      "[2001:2::1]",
      "[2001:db8::1]",
      "[2002:7f00:1::]",
      "[3ffe::1]",
      "[3fff::1]",
      "service.internal",
    ]
  ) {
    assert.equal(isBlockedHost(hostname), true, hostname);
  }
  assert.equal(isBlockedHost("93.184.216.34"), false);
  assert.equal(isBlockedHost("[2606:2800:220:1:248:1893:25c8:1946]"), false);
  assert.equal(isBlockedHost("example.com"), false);
});

test("resolvePublicHost evaluates both A and AAAA records and fails closed", async () => {
  const seen: string[] = [];
  await assert.rejects(
    () =>
      resolvePublicHost("example.com", (_hostname, recordType) => {
        seen.push(recordType);
        return Promise.resolve(
          recordType === "A" ? ["93.184.216.34"] : ["fc00::1"],
        );
      }),
    { code: "source_host_blocked" },
  );
  assert.deepEqual(seen.sort(), ["A", "AAAA"]);

  await assert.rejects(
    () =>
      resolvePublicHost(
        "unresolved.example",
        () => Promise.reject(new Error("resolver unavailable")),
      ),
    { code: "source_dns_unavailable" },
  );

  await assert.rejects(
    () =>
      resolvePublicHost(
        "too-many.example",
        (_hostname, recordType) =>
          Promise.resolve(
            recordType === "A"
              ? Array.from(
                { length: LIMITS.dnsAddressCount + 1 },
                (_, index) => `93.184.216.${index + 1}`,
              )
              : [],
          ),
      ),
    { code: "source_host_blocked" },
  );

  assert.deepEqual(
    await resolvePublicHost(
      "[2606:2800:220:1:248:1893:25c8:1946]",
      () => Promise.reject(new Error("literal must not resolve")),
    ),
    ["2606:2800:220:1:248:1893:25c8:1946"],
  );
});

test("stored URLs remove common secret parameters and fragments", () => {
  const sanitized = new URL(sanitizeUrlForStorage(
    new URL(
      "https://example.com/report?api_token=secret&sig=signed&lang=fr#private",
    ),
  ));
  assert.equal(sanitized.searchParams.has("api_token"), false);
  assert.equal(sanitized.searchParams.has("sig"), false);
  assert.equal(sanitized.searchParams.get("lang"), "fr");
  assert.equal(sanitized.hash, "");
});

test("content types and leases are explicit", () => {
  assert.equal(isAllowedContentType("text/html; charset=utf-8"), true);
  assert.equal(isAllowedContentType("text/plain"), true);
  assert.equal(isAllowedContentType("text/csv"), false);
  assert.equal(isAllowedContentType("application/ld+json"), false);
  assert.equal(isAllowedContentType("application/pdf"), false);
  assert.equal(
    isLikelyTextContent(new TextEncoder().encode("plain text")),
    true,
  );
  assert.equal(
    isLikelyTextContent(new TextEncoder().encode("%PDF-1.7")),
    false,
  );
  assert.equal(isLikelyTextContent(new Uint8Array([0x61, 0x00, 0x62])), false);
  const now = Date.parse("2026-08-30T10:00:00Z");
  assert.equal(isLeaseStale("2026-08-30T09:58:00Z", now), true);
  assert.equal(isLeaseStale("2026-08-30T09:59:30Z", now), false);
  assert.equal(isLeaseStale("not-a-date", now), false);
});
