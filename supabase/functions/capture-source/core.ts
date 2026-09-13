import {
  HttpError,
  isBlockedHost,
  LIMITS,
  parseAllowedOrigins,
  parseSourceInputs,
  readBoundedJson,
} from "../analyze-seed/core.ts";
import type {
  CapturedSource as SharedCapturedSource,
  SourceCaptureStatus,
} from "../analyze-seed/source-fetch.ts";

const CANONICAL_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const CAPTURE_STATUSES = [
  "found",
  "partial",
  "missing",
  "blocked",
  "failed",
  "unsupported",
] as const;

export type CaptureStatus = SourceCaptureStatus;

export type CaptureRequest = {
  url: string;
  idempotencyKey: string;
};

export type CapturedSource = SharedCapturedSource;

export type StoreSourcePayload = {
  requested_url: string;
  final_url: string;
  http_status: number | null;
  content_type: string;
  retrieval_status: CaptureStatus;
  failure_code: string | null;
  raw_content_base64: string | null;
  byte_length: number;
  raw_sha256: string | null;
  normalized_text: string | null;
  normalized_sha256: string | null;
  title: string;
  publisher: string;
  source_type: string;
  parser_version: string;
  is_truncated: boolean;
  capture_metadata: {
    locator: string;
    note: string;
  };
};

type ArtifactResponse = {
  ok: true;
  artifact_id: string;
  reused: boolean;
  requested_url: string;
  final_url: string;
  status: CaptureStatus;
  content_type: string;
  byte_length: number;
  raw_hash: string | null;
  normalized_hash: string | null;
  normalized_text: string | null;
  title: string;
  publisher: string;
  source_type: string;
  parser_version: string;
  is_truncated: boolean;
  captured_at: string;
};

type ReserveResult =
  | {
    state: "reserved";
    remaining: number;
    resetAt: string;
  }
  | {
    state: "in_progress";
    retryAfterSeconds: number;
  }
  | {
    state: "quota_exceeded";
    retryAfterSeconds: number;
  }
  | {
    state: "completed";
    artifact: ArtifactResponse;
  };

export type CaptureSourceDependencies = {
  authenticate: (token: string) => Promise<{ id: string } | null>;
  reserve: (input: {
    actorId: string;
    idempotencyKey: string;
    requestedUrl: string;
  }) => Promise<unknown>;
  capture: (input: { url: string; note: string }) => Promise<CapturedSource>;
  store: (input: {
    actorId: string;
    idempotencyKey: string;
    payload: StoreSourcePayload;
  }) => Promise<unknown>;
  allowedOrigins?: ReadonlySet<string>;
  onInternalError?: (error: unknown, requestId: string) => void;
};

const baseCorsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "600",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]) {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function isCaptureStatus(value: unknown): value is CaptureStatus {
  return CAPTURE_STATUSES.includes(value as CaptureStatus);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isHash(value: unknown): value is string {
  return typeof value === "string" && SHA256.test(value);
}

function isNullableHash(value: unknown): value is string | null {
  return value === null || isHash(value);
}

function isBoundedInteger(value: unknown, maximum: number) {
  return Number.isSafeInteger(value) && (value as number) >= 0 &&
    (value as number) <= maximum;
}

function isSafeRetry(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 1 &&
    (value as number) <= 86_400;
}

function requireIsoDate(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function configuredOrigins(supabaseUrl: string, configured: string) {
  return parseAllowedOrigins(configured, supabaseUrl);
}

function corsHeaders(
  request: Request,
  allowedOrigins: ReadonlySet<string>,
) {
  const origin = request.headers.get("origin");
  if (!origin) return { ...baseCorsHeaders, Vary: "Origin" };
  if (!allowedOrigins.has(origin)) return null;
  return {
    ...baseCorsHeaders,
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
}

function jsonResponse(
  request: Request,
  allowedOrigins: ReadonlySet<string>,
  status: number,
  body: Record<string, unknown>,
  requestId: string,
  extraHeaders: Record<string, string> = {},
) {
  const cors = corsHeaders(request, allowedOrigins) ?? {
    ...baseCorsHeaders,
    Vary: "Origin",
  };
  return new Response(JSON.stringify({ ...body, request_id: requestId }), {
    status,
    headers: {
      ...cors,
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });
}

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.match(/^Bearer\s+([^\s]+)$/i)?.[1] ?? null;
}

export function parseCaptureRequest(
  value: Record<string, unknown>,
): CaptureRequest {
  if (
    !hasOnlyKeys(value, ["url", "idempotency_key"]) ||
    Object.keys(value).length !== 2
  ) {
    throw new HttpError(422, "invalid_capture_request");
  }
  if (
    typeof value.idempotency_key !== "string" ||
    !CANONICAL_UUID.test(value.idempotency_key)
  ) {
    throw new HttpError(422, "invalid_idempotency_key");
  }

  // Reuse the hardened source URL parser used by analyze-seed. It rejects
  // credential-like query keys because capture retains the original bytes.
  const parsed = parseSourceInputs([{ url: value.url, note: "" }])[0];
  const url = new URL(parsed.url);
  if (isBlockedHost(url.hostname)) {
    throw new HttpError(422, "source_host_blocked");
  }
  return {
    url: url.toString(),
    idempotencyKey: value.idempotency_key.toLowerCase(),
  };
}

function parseArtifactResponse(
  value: Record<string, unknown>,
  reused: boolean,
): ArtifactResponse {
  if (
    typeof value.artifact_id !== "string" ||
    !CANONICAL_UUID.test(value.artifact_id) ||
    typeof value.requested_url !== "string" ||
    typeof value.final_url !== "string" ||
    !isCaptureStatus(value.status) ||
    typeof value.content_type !== "string" ||
    !isBoundedInteger(value.byte_length, LIMITS.sourceBytes) ||
    !isNullableHash(value.raw_hash) ||
    !isNullableHash(value.normalized_hash) ||
    !isNullableString(value.normalized_text) ||
    typeof value.title !== "string" ||
    typeof value.publisher !== "string" ||
    typeof value.source_type !== "string" || value.source_type.length === 0 ||
    typeof value.parser_version !== "string" ||
    value.parser_version.length === 0 ||
    typeof value.is_truncated !== "boolean" ||
    !requireIsoDate(value.captured_at)
  ) {
    throw new HttpError(503, "invalid_artifact_result");
  }
  if (
    (value.raw_hash === null) !== (value.byte_length === 0) ||
    (value.normalized_hash === null) !== (value.normalized_text === null) ||
    (value.status === "partial") !== value.is_truncated ||
    (["found", "partial"].includes(value.status)
      ? value.raw_hash === null || value.normalized_hash === null ||
        value.normalized_text === null || value.byte_length === 0
      : value.raw_hash !== null || value.normalized_hash !== null ||
        value.normalized_text !== null || value.byte_length !== 0)
  ) {
    throw new HttpError(503, "invalid_artifact_result");
  }
  return {
    ok: true,
    artifact_id: value.artifact_id,
    reused,
    requested_url: value.requested_url,
    final_url: value.final_url,
    status: value.status,
    content_type: value.content_type,
    byte_length: value.byte_length as number,
    raw_hash: value.raw_hash,
    normalized_hash: value.normalized_hash,
    normalized_text: value.normalized_text,
    title: value.title,
    publisher: value.publisher,
    source_type: value.source_type,
    parser_version: value.parser_version,
    is_truncated: value.is_truncated,
    captured_at: value.captured_at as string,
  };
}

export function parseReserveResult(value: unknown): ReserveResult {
  if (!isRecord(value) || typeof value.state !== "string") {
    throw new HttpError(503, "invalid_reservation_result");
  }
  if (
    value.state === "reserved" && value.ok === true &&
    value.idempotent === false &&
    isBoundedInteger(value.remaining, 10_000) &&
    requireIsoDate(value.reset_at)
  ) {
    return {
      state: "reserved",
      remaining: value.remaining as number,
      resetAt: value.reset_at as string,
    };
  }
  if (
    value.state === "in_progress" && value.ok === true &&
    value.idempotent === true && isSafeRetry(value.retry_after_seconds)
  ) {
    return {
      state: "in_progress",
      retryAfterSeconds: value.retry_after_seconds,
    };
  }
  if (
    value.state === "quota_exceeded" && value.ok === false &&
    isSafeRetry(value.retry_after_seconds)
  ) {
    return {
      state: "quota_exceeded",
      retryAfterSeconds: value.retry_after_seconds,
    };
  }
  if (
    value.state === "completed" && value.ok === true &&
    value.idempotent === true
  ) {
    return {
      state: "completed",
      artifact: parseArtifactResponse(value, true),
    };
  }
  throw new HttpError(503, "invalid_reservation_result");
}

export function parseStoreResult(value: unknown): ArtifactResponse {
  if (
    !isRecord(value) || value.ok !== true ||
    typeof value.reused !== "boolean"
  ) {
    throw new HttpError(503, "invalid_artifact_result");
  }
  return parseArtifactResponse(value, value.reused);
}

function artifactMatchesCapture(
  artifact: ArtifactResponse,
  captured: CapturedSource,
) {
  return artifact.requested_url === captured.requestedUrl &&
    artifact.final_url === captured.finalUrl &&
    artifact.status === captured.status &&
    artifact.content_type === captured.contentType &&
    artifact.byte_length === captured.byteLength &&
    artifact.raw_hash === captured.rawHash &&
    artifact.normalized_hash === captured.normalizedHash &&
    artifact.normalized_text === captured.normalizedText &&
    artifact.title === captured.title &&
    artifact.publisher === captured.publisher &&
    artifact.source_type === captured.sourceType &&
    artifact.parser_version === captured.parserVersion &&
    artifact.is_truncated === captured.isTruncated;
}

export function validateCapturedSource(value: unknown): CapturedSource {
  if (!isRecord(value)) throw new HttpError(502, "invalid_capture_result");
  const rawBytes = value.rawBytes;
  if (
    typeof value.requestedUrl !== "string" ||
    typeof value.finalUrl !== "string" ||
    !isCaptureStatus(value.status) ||
    typeof value.contentType !== "string" ||
    !(rawBytes === null || rawBytes instanceof Uint8Array) ||
    !isNullableHash(value.rawHash) ||
    !isNullableString(value.normalizedText) ||
    !isNullableHash(value.normalizedHash) ||
    !isBoundedInteger(value.byteLength, LIMITS.sourceBytes) ||
    !(value.httpStatus === null ||
      (Number.isSafeInteger(value.httpStatus) &&
        (value.httpStatus as number) >= 100 &&
        (value.httpStatus as number) <= 599)) ||
    typeof value.title !== "string" ||
    typeof value.publisher !== "string" ||
    typeof value.sourceType !== "string" ||
    typeof value.parserVersion !== "string" ||
    typeof value.isTruncated !== "boolean" ||
    !isNullableString(value.failureCode) ||
    typeof value.locator !== "string" ||
    typeof value.note !== "string"
  ) {
    throw new HttpError(502, "invalid_capture_result");
  }
  if (
    (rawBytes === null) !== (value.rawHash === null) ||
    (rawBytes?.byteLength ?? 0) !== value.byteLength ||
    (value.normalizedText === null) !== (value.normalizedHash === null) ||
    (value.status === "partial") !== value.isTruncated ||
    (["found", "partial"].includes(value.status as string)
      ? value.failureCode !== null || rawBytes === null ||
        value.normalizedText === null
      : value.failureCode === null || rawBytes !== null ||
        value.normalizedText !== null)
  ) {
    throw new HttpError(502, "invalid_capture_result");
  }
  return value as CapturedSource;
}

export function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.byteLength)),
    );
  }
  return btoa(binary);
}

export function toStorePayload(captured: CapturedSource): StoreSourcePayload {
  return {
    requested_url: captured.requestedUrl,
    final_url: captured.finalUrl,
    http_status: captured.httpStatus,
    content_type: captured.contentType,
    retrieval_status: captured.status,
    failure_code: captured.failureCode,
    raw_content_base64: captured.rawBytes === null
      ? null
      : bytesToBase64(captured.rawBytes),
    byte_length: captured.byteLength,
    raw_sha256: captured.rawHash,
    normalized_text: captured.normalizedText,
    normalized_sha256: captured.normalizedHash,
    title: captured.title,
    publisher: captured.publisher,
    source_type: captured.sourceType,
    parser_version: captured.parserVersion,
    is_truncated: captured.isTruncated,
    capture_metadata: {
      locator: captured.locator,
      note: captured.note,
    },
  };
}

export function createCaptureSourceHandler(
  dependencies: CaptureSourceDependencies,
) {
  const allowedOrigins = dependencies.allowedOrigins ?? new Set<string>();
  return async (request: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const cors = corsHeaders(request, allowedOrigins);
    if (!cors) {
      return jsonResponse(
        request,
        allowedOrigins,
        403,
        { error: "cors_origin_denied" },
        requestId,
      );
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return jsonResponse(
        request,
        allowedOrigins,
        405,
        { error: "method_not_allowed" },
        requestId,
      );
    }

    try {
      const token = bearerToken(request);
      if (!token) throw new HttpError(401, "auth_required");
      const actor = await dependencies.authenticate(token);
      if (!actor?.id || !CANONICAL_UUID.test(actor.id)) {
        throw new HttpError(401, "auth_required");
      }

      const body = await readBoundedJson(request);
      const parsed = parseCaptureRequest(body);
      const reservation = parseReserveResult(
        await dependencies.reserve({
          actorId: actor.id,
          idempotencyKey: parsed.idempotencyKey,
          requestedUrl: parsed.url,
        }),
      );

      if (reservation.state === "completed") {
        if (reservation.artifact.requested_url !== parsed.url) {
          throw new HttpError(503, "invalid_reservation_result");
        }
        return jsonResponse(
          request,
          allowedOrigins,
          200,
          reservation.artifact,
          requestId,
        );
      }
      if (reservation.state === "in_progress") {
        return jsonResponse(
          request,
          allowedOrigins,
          409,
          {
            error: "capture_in_progress",
            retry_after_seconds: reservation.retryAfterSeconds,
          },
          requestId,
          { "Retry-After": String(reservation.retryAfterSeconds) },
        );
      }
      if (reservation.state === "quota_exceeded") {
        return jsonResponse(
          request,
          allowedOrigins,
          429,
          {
            error: "capture_quota_exceeded",
            retry_after_seconds: reservation.retryAfterSeconds,
          },
          requestId,
          { "Retry-After": String(reservation.retryAfterSeconds) },
        );
      }

      let captured: CapturedSource;
      try {
        captured = validateCapturedSource(
          await dependencies.capture({ url: parsed.url, note: "" }),
        );
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(502, "source_capture_failed");
      }
      if (captured.requestedUrl !== parsed.url) {
        throw new HttpError(502, "invalid_capture_result");
      }

      const artifact = parseStoreResult(
        await dependencies.store({
          actorId: actor.id,
          idempotencyKey: parsed.idempotencyKey,
          payload: toStorePayload(captured),
        }),
      );
      if (!artifactMatchesCapture(artifact, captured)) {
        throw new HttpError(503, "invalid_artifact_result");
      }
      return jsonResponse(
        request,
        allowedOrigins,
        200,
        artifact,
        requestId,
      );
    } catch (error) {
      if (error instanceof HttpError) {
        return jsonResponse(
          request,
          allowedOrigins,
          error.status,
          { error: error.code },
          requestId,
        );
      }
      dependencies.onInternalError?.(error, requestId);
      return jsonResponse(
        request,
        allowedOrigins,
        500,
        { error: "internal_error" },
        requestId,
      );
    }
  };
}
