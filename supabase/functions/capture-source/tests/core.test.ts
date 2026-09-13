import { strict as assert } from "node:assert";
import { test } from "node:test";
import { HttpError } from "../../analyze-seed/core.ts";
import {
  type CapturedSource,
  type CaptureSourceDependencies,
  createCaptureSourceHandler,
  parseCaptureRequest,
} from "../core.ts";

const actorId = "11111111-1111-4111-8111-111111111111";
const artifactId = "22222222-2222-4222-8222-222222222222";
const idempotencyKey = "33333333-3333-4333-8333-333333333333";
const rawHash = `sha256:${"a".repeat(64)}`;
const normalizedHash = `sha256:${"b".repeat(64)}`;

const captured: CapturedSource = {
  requestedUrl: "https://example.com/report",
  finalUrl: "https://example.com/report",
  status: "found",
  httpStatus: 200,
  contentType: "text/plain",
  rawBytes: new TextEncoder().encode("abc"),
  rawHash,
  normalizedText: "abc",
  normalizedHash,
  byteLength: 3,
  title: "Report",
  publisher: "example.com",
  sourceType: "other",
  parserVersion: "bounded-text-v1",
  isTruncated: false,
  failureCode: null,
  locator: "normalized text",
  note: "Fetched as untrusted text.",
};

function artifactResult(reused = false) {
  return {
    ok: true,
    artifact_id: artifactId,
    reused,
    requested_url: captured.requestedUrl,
    final_url: captured.finalUrl,
    status: captured.status,
    content_type: captured.contentType,
    byte_length: captured.byteLength,
    raw_hash: captured.rawHash,
    normalized_hash: captured.normalizedHash,
    normalized_text: captured.normalizedText,
    title: captured.title,
    publisher: captured.publisher,
    source_type: captured.sourceType,
    parser_version: captured.parserVersion,
    is_truncated: captured.isTruncated,
    captured_at: "2026-08-30T12:00:00.000Z",
  };
}

function reserved() {
  return {
    ok: true,
    state: "reserved",
    idempotent: false,
    remaining: 4,
    reset_at: "2026-08-31T00:00:00.000Z",
  };
}

function dependencies(
  overrides: Partial<CaptureSourceDependencies> = {},
): CaptureSourceDependencies {
  return {
    authenticate: () => Promise.resolve({ id: actorId }),
    reserve: () => Promise.resolve(reserved()),
    capture: () => Promise.resolve(captured),
    store: () => Promise.resolve(artifactResult()),
    ...overrides,
  };
}

function captureRequest(
  body: Record<string, unknown> = {
    url: captured.requestedUrl,
    idempotency_key: idempotencyKey,
  },
  headers: Record<string, string> = {},
) {
  return new Request(
    "https://project.supabase.co/functions/v1/capture-source",
    {
      method: "POST",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    },
  );
}

async function body(response: Response) {
  return await response.json() as Record<string, unknown>;
}

test("capture request accepts only an HTTP(S) URL and a canonical UUID key", () => {
  assert.deepEqual(
    parseCaptureRequest({
      url: "https://example.com/report?page=2#section",
      idempotency_key: idempotencyKey.toUpperCase(),
    }),
    {
      url: "https://example.com/report?page=2",
      idempotencyKey,
    },
  );

  const rejected: Array<[Record<string, unknown>, string]> = [
    [
      { url: "https://example.com", idempotency_key: "retry-me" },
      "invalid_idempotency_key",
    ],
    [
      {
        url: "https://user:password@example.com/report",
        idempotency_key: idempotencyKey,
      },
      "invalid_source_url",
    ],
    [
      {
        url: "https://example.com:444/report",
        idempotency_key: idempotencyKey,
      },
      "source_port_not_allowed",
    ],
    [
      {
        url: "https://example.com/report?access_token=secret",
        idempotency_key: idempotencyKey,
      },
      "source_url_contains_credentials",
    ],
    [
      {
        url: "file:///etc/passwd",
        idempotency_key: idempotencyKey,
      },
      "invalid_source_url",
    ],
    [
      {
        url: "http://127.0.0.1/metadata",
        idempotency_key: idempotencyKey,
      },
      "source_host_blocked",
    ],
    [
      {
        url: "https://example.com/report",
        idempotency_key: idempotencyKey,
        unexpected: true,
      },
      "invalid_capture_request",
    ],
  ];
  for (const [input, code] of rejected) {
    assert.throws(
      () => parseCaptureRequest(input),
      (error) => error instanceof HttpError && error.code === code,
    );
  }
});

test("authentication is verified before reservation or quota consumption", async () => {
  const calls: string[] = [];
  const handler = createCaptureSourceHandler(dependencies({
    authenticate: () => {
      calls.push("authenticate");
      return Promise.resolve({ id: actorId });
    },
    reserve: () => {
      calls.push("reserve");
      return Promise.resolve(reserved());
    },
    capture: () => {
      calls.push("capture");
      return Promise.resolve(captured);
    },
    store: () => {
      calls.push("store");
      return Promise.resolve(artifactResult());
    },
  }));
  const response = await handler(captureRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["authenticate", "reserve", "capture", "store"]);

  calls.length = 0;
  const noToken = await handler(captureRequest(undefined, {
    authorization: "",
  }));
  assert.equal(noToken.status, 401);
  assert.deepEqual(calls, []);

  const invalidCalls: string[] = [];
  const invalidAuthHandler = createCaptureSourceHandler(dependencies({
    authenticate: () => {
      invalidCalls.push("authenticate");
      return Promise.resolve(null);
    },
    reserve: () => {
      invalidCalls.push("reserve");
      return Promise.resolve(reserved());
    },
  }));
  const invalidAuth = await invalidAuthHandler(captureRequest());
  assert.equal(invalidAuth.status, 401);
  assert.deepEqual(invalidCalls, ["authenticate"]);
});

test("unsafe request syntax is rejected after auth but before quota reservation", async () => {
  const calls: string[] = [];
  const handler = createCaptureSourceHandler(dependencies({
    authenticate: () => {
      calls.push("authenticate");
      return Promise.resolve({ id: actorId });
    },
    reserve: () => {
      calls.push("reserve");
      return Promise.resolve(reserved());
    },
  }));
  const response = await handler(captureRequest({
    url: "https://example.com/report?access_token=secret",
    idempotency_key: idempotencyKey,
  }));
  assert.equal(response.status, 422);
  assert.equal((await body(response)).error, "source_url_contains_credentials");
  assert.deepEqual(calls, ["authenticate"]);
});

test("a completed idempotency key returns the existing artifact without fetching", async () => {
  let fetched = false;
  let stored = false;
  const handler = createCaptureSourceHandler(dependencies({
    reserve: () =>
      Promise.resolve({
        ...artifactResult(),
        state: "completed",
        idempotent: true,
      }),
    capture: () => {
      fetched = true;
      return Promise.resolve(captured);
    },
    store: () => {
      stored = true;
      return Promise.resolve(artifactResult());
    },
  }));
  const response = await handler(captureRequest());
  const result = await body(response);
  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(result.artifact_id, artifactId);
  assert.equal(result.reused, true);
  assert.equal(result.normalized_text, "abc");
  assert.equal(result.ok, true);
  assert.equal("raw_content_base64" in result, false);
  assert.equal(fetched, false);
  assert.equal(stored, false);
});

test("idempotency replay refuses metadata for a different requested URL", async () => {
  const handler = createCaptureSourceHandler(dependencies({
    reserve: () =>
      Promise.resolve({
        ...artifactResult(),
        state: "completed",
        idempotent: true,
        requested_url: "https://example.com/other-report",
      }),
  }));
  const response = await handler(captureRequest());
  assert.equal(response.status, 503);
  assert.equal((await body(response)).error, "invalid_reservation_result");
});

test("in-progress and quota reservations are retryable without fetching", async () => {
  for (
    const expectation of [
      {
        reserve: {
          ok: true,
          state: "in_progress",
          idempotent: true,
          retry_after_seconds: 2,
        },
        status: 409,
        error: "capture_in_progress",
      },
      {
        reserve: {
          ok: false,
          state: "quota_exceeded",
          retry_after_seconds: 60,
        },
        status: 429,
        error: "capture_quota_exceeded",
      },
    ]
  ) {
    let fetched = false;
    const handler = createCaptureSourceHandler(dependencies({
      reserve: () => Promise.resolve(expectation.reserve),
      capture: () => {
        fetched = true;
        return Promise.resolve(captured);
      },
    }));
    const response = await handler(captureRequest());
    const result = await body(response);
    assert.equal(response.status, expectation.status);
    assert.equal(result.error, expectation.error);
    assert.equal(
      response.headers.get("retry-after"),
      String(
        expectation.reserve.retry_after_seconds,
      ),
    );
    assert.equal(fetched, false);
  }
});

test("successful capture stores exact bytes privately and returns only safe metadata", async () => {
  let observedPayload: Record<string, unknown> | undefined;
  const handler = createCaptureSourceHandler(dependencies({
    store: (input) => {
      observedPayload = input.payload;
      return Promise.resolve(artifactResult());
    },
  }));
  const response = await handler(captureRequest());
  const result = await body(response);
  assert.equal(response.status, 200);
  assert.equal(observedPayload?.raw_content_base64, "YWJj");
  assert.equal(observedPayload?.raw_sha256, rawHash);
  assert.equal(observedPayload?.normalized_text, "abc");
  assert.equal(observedPayload?.normalized_sha256, normalizedHash);
  assert.equal(observedPayload?.retrieval_status, "found");
  assert.equal(observedPayload?.http_status, 200);
  assert.equal(observedPayload?.failure_code, null);
  assert.equal(result.normalized_text, "abc");
  assert.equal("raw_content_base64" in result, false);
  assert.equal("raw_bytes" in result, false);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("failed retrievals are stored as technical failures without evidence text", async () => {
  const failedCapture: CapturedSource = {
    ...captured,
    status: "failed",
    httpStatus: 503,
    rawBytes: null,
    rawHash: null,
    normalizedText: null,
    normalizedHash: null,
    byteLength: 0,
    isTruncated: false,
    failureCode: "http-status",
  };
  let observedPayload: Record<string, unknown> | undefined;
  const handler = createCaptureSourceHandler(dependencies({
    capture: () => Promise.resolve(failedCapture),
    store: ({ payload }) => {
      observedPayload = payload;
      return Promise.resolve({
        ...artifactResult(),
        status: "failed",
        byte_length: 0,
        raw_hash: null,
        normalized_hash: null,
        normalized_text: null,
      });
    },
  }));
  const response = await handler(captureRequest());
  assert.equal(response.status, 200);
  assert.equal(observedPayload?.retrieval_status, "failed");
  assert.equal(observedPayload?.failure_code, "http-status");
  assert.equal(observedPayload?.raw_content_base64, null);
  assert.equal(observedPayload?.normalized_text, null);
  const result = await body(response);
  assert.equal(result.ok, true);
  assert.equal(result.artifact_id, artifactId);
  assert.equal(result.status, "failed");
});

test("capture and database contract failures fail closed", async () => {
  const thrownCapture = createCaptureSourceHandler(dependencies({
    capture: () => Promise.reject(new Error("network detail must not leak")),
  }));
  let response = await thrownCapture(captureRequest());
  assert.equal(response.status, 502);
  assert.equal((await body(response)).error, "source_capture_failed");

  const invalidCapture = createCaptureSourceHandler(dependencies({
    capture: () => Promise.resolve({ ...captured, rawHash: null }),
  }));
  response = await invalidCapture(captureRequest());
  assert.equal(response.status, 502);
  assert.equal((await body(response)).error, "invalid_capture_result");

  const invalidStore = createCaptureSourceHandler(dependencies({
    store: () => Promise.resolve({ ok: true, artifact_id: artifactId }),
  }));
  response = await invalidStore(captureRequest());
  assert.equal(response.status, 503);
  assert.equal((await body(response)).error, "invalid_artifact_result");

  const mismatchedStore = createCaptureSourceHandler(dependencies({
    store: () =>
      Promise.resolve({
        ...artifactResult(),
        title: "Different artifact",
      }),
  }));
  response = await mismatchedStore(captureRequest());
  assert.equal(response.status, 503);
  assert.equal((await body(response)).error, "invalid_artifact_result");
});

test("unsupported methods, content types, and browser origins are rejected", async () => {
  const handler = createCaptureSourceHandler(dependencies({
    allowedOrigins: new Set(["https://app.example"]),
  }));
  let response = await handler(
    new Request("https://edge.example", {
      method: "GET",
    }),
  );
  assert.equal(response.status, 405);

  response = await handler(captureRequest(undefined, {
    "content-type": "text/plain",
  }));
  assert.equal(response.status, 415);

  response = await handler(captureRequest(undefined, {
    origin: "https://evil.example",
  }));
  assert.equal(response.status, 403);
});
