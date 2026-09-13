export const LIMITS = {
  requestBytes: 4_096,
  requestReadTimeoutMs: 2_000,
  sourceCount: 8,
  sourceInputsBytes: 24_576,
  sourceUrlCharacters: 2_048,
  sourceUrlBytes: 4_096,
  sourceNoteCharacters: 240,
  sourceNoteBytes: 960,
  sourceBytes: 128_000,
  sourceFetchTimeoutMs: 4_500,
  dnsTimeoutMs: 1_500,
  dnsAddressCount: 16,
  authTimeoutMs: 5_000,
  databaseTimeoutMs: 8_000,
  analysisLeaseMs: 60_000,
} as const;

export type AnalyzeProvider = "mock" | "openrouter";

export type AiFailureCode =
  | "openrouter_unavailable"
  | "source_retrieval_failed"
  | "analysis_failed"
  | "invalid_analysis_result"
  | "timeout"
  | "interrupted"
  | "unknown";

export type AnalyzeRequest = {
  seedPacketId: string;
  provider: AnalyzeProvider;
};

export type AiJobClaim =
  | {
    state: "claimed";
    leaseExpiresAt: string;
    claimToken: string;
    replayed: boolean;
    quotaRemaining?: number;
  }
  | { state: "in_progress"; leaseExpiresAt: string }
  | { state: "quota_exceeded"; retryAfterSeconds: number }
  | { state: "completed"; revisionId: string }
  | { state: "failed"; errorCode: AiFailureCode };

export type SourceInput = {
  url: string;
  note: string;
};

export type Retrieval = {
  url: string;
  status: "found" | "missing" | "blocked" | "failed" | "partial";
  title: string;
  publisher: string;
  excerpt: string;
  note: string;
  locator: string;
  hash: string | null;
};

export type DnsRecordType = "A" | "AAAA";
export type DnsResolver = (
  hostname: string,
  recordType: DnsRecordType,
) => Promise<string[]>;

const SAFE_OBJECT_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/;
const CANONICAL_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SENSITIVE_QUERY_KEY =
  /(?:^|[_-])(?:access[_-]?token|token|secret|client[_-]?secret|password|passwd|api[_-]?key|apikey|auth|authorization|code|credential|sig|signature|session|jwt|key)(?:$|[_-])/i;

export function isSafeObjectId(value: unknown): value is string {
  return typeof value === "string" && SAFE_OBJECT_ID.test(value);
}

function isCanonicalUuid(value: unknown): value is string {
  return typeof value === "string" && CANONICAL_UUID.test(value);
}

function isAiFailureCode(value: unknown): value is AiFailureCode {
  return [
    "openrouter_unavailable",
    "source_retrieval_failed",
    "analysis_failed",
    "invalid_analysis_result",
    "timeout",
    "interrupted",
    "unknown",
  ].includes(value as AiFailureCode);
}

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export function aiFailureCodeFor(error: unknown): AiFailureCode {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "interrupted";
  }
  if (!(error instanceof HttpError)) return "unknown";
  if (error.code.endsWith("timeout") || error.status === 408) return "timeout";
  if (error.code === "live_provider_unavailable") {
    return "openrouter_unavailable";
  }
  if (error.code === "source_retrieval_failed") {
    return "source_retrieval_failed";
  }
  if (error.code === "invalid_analysis_result") {
    return "invalid_analysis_result";
  }
  if (error.code === "analysis_failed") return "analysis_failed";
  return "unknown";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function utf8Bytes(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export function parseAllowedOrigins(
  configuredValue: string,
  supabaseUrl: string,
) {
  const origins = new Set<string>();
  const configuredOrigins = configuredValue.split(",");
  for (const rawOrigin of configuredOrigins) {
    const candidate = rawOrigin.trim();
    if (!candidate) {
      if (configuredValue.trim()) {
        throw new HttpError(500, "invalid_cors_configuration");
      }
      continue;
    }
    try {
      const url = new URL(candidate);
      const isLoopback = ["127.0.0.1", "localhost", "[::1]"].includes(
        url.hostname.toLowerCase(),
      );
      if (
        (url.protocol === "https:" ||
          (url.protocol === "http:" && isLoopback)) &&
        !url.username &&
        !url.password &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash
      ) {
        origins.add(url.origin);
        continue;
      }
    } catch {
      // The shared error below makes any partial configuration fail closed.
    }
    throw new HttpError(500, "invalid_cors_configuration");
  }

  try {
    const hostname = new URL(supabaseUrl).hostname.toLowerCase();
    if (["127.0.0.1", "localhost", "[::1]"].includes(hostname)) {
      origins.add("http://127.0.0.1:5173");
      origins.add("http://localhost:5173");
    }
  } catch {
    // Missing or invalid Supabase configuration adds no implicit origin.
  }
  return origins;
}

export async function withTimeout<T>(
  operation: PromiseLike<T>,
  timeoutMs: number,
  error: HttpError,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(error), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

export function createDeadlineFetch(
  timeoutMs: number,
  fetchImpl: typeof fetch = fetch,
): typeof fetch {
  return (async (input, init) => {
    const controller = new AbortController();
    const upstreamSignal = init?.signal;
    const forwardAbort = () => controller.abort(upstreamSignal?.reason);
    if (upstreamSignal?.aborted) {
      forwardAbort();
    } else {
      upstreamSignal?.addEventListener("abort", forwardAbort, { once: true });
    }
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchImpl(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
      upstreamSignal?.removeEventListener("abort", forwardAbort);
    }
  }) as typeof fetch;
}

export async function readBoundedJson(
  request: Request,
  maxBytes: number = LIMITS.requestBytes,
  timeoutMs: number = LIMITS.requestReadTimeoutMs,
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]
    .trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new HttpError(415, "content_type_required");
  }

  const announcedLength = request.headers.get("content-length");
  if (announcedLength !== null) {
    const parsedLength = Number(announcedLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      throw new HttpError(400, "invalid_content_length");
    }
    if (parsedLength > maxBytes) throw new HttpError(413, "request_too_large");
  }

  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "invalid_json");

  const chunks: Uint8Array[] = [];
  let total = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      void reader.cancel("request body timeout").catch(() => {});
      reject(new HttpError(408, "request_timeout"));
    }, timeoutMs);
  });

  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timedOut]);
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        void reader.cancel("request body too large").catch(() => {});
        throw new HttpError(413, "request_too_large");
      }
      chunks.push(value);
    }
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }

  const bytes = concatBytes(chunks, total);
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, "invalid_json");
  }
  if (!isRecord(parsed)) throw new HttpError(400, "invalid_payload");
  return parsed;
}

export function parseAnalyzeRequest(
  body: Record<string, unknown>,
): AnalyzeRequest {
  const allowedKeys = new Set(["seed_packet_id", "provider"]);
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) {
    throw new HttpError(400, "invalid_payload");
  }

  const seedPacketId = body.seed_packet_id;
  if (
    typeof seedPacketId !== "string" ||
    !isCanonicalUuid(seedPacketId)
  ) {
    throw new HttpError(400, "invalid_seed_packet_id");
  }

  const provider = body.provider ?? "mock";
  if (provider !== "mock" && provider !== "openrouter") {
    throw new HttpError(400, "invalid_provider");
  }
  return { seedPacketId, provider };
}

export function parseAiJobClaim(value: unknown): AiJobClaim {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    throw new HttpError(503, "invalid_claim_result");
  }

  const hasExactKeys = (keys: string[]) => {
    const expected = new Set(keys);
    const actual = Object.keys(value);
    return actual.length === expected.size &&
      actual.every((key) => expected.has(key));
  };

  if (value.state === "completed") {
    if (
      !hasExactKeys(["ok", "state", "revision_id"]) ||
      value.ok !== true ||
      !isSafeObjectId(value.revision_id)
    ) {
      throw new HttpError(503, "invalid_claim_result");
    }
    return { state: "completed", revisionId: value.revision_id };
  }

  if (value.state === "claimed") {
    const requiredKeys = [
      "ok",
      "state",
      "replayed",
      "claim_token",
      "lease_expires_at",
    ];
    if (value.replayed === false) requiredKeys.push("quota_remaining");
    if (
      !hasExactKeys(requiredKeys) ||
      value.ok !== true ||
      typeof value.replayed !== "boolean" ||
      !isCanonicalUuid(value.claim_token) ||
      typeof value.lease_expires_at !== "string" ||
      !Number.isFinite(Date.parse(value.lease_expires_at)) ||
      (value.replayed === false &&
        (!Number.isSafeInteger(value.quota_remaining) ||
          (value.quota_remaining as number) < 0 ||
          (value.quota_remaining as number) > 10_000))
    ) {
      throw new HttpError(503, "invalid_claim_result");
    }
    return {
      state: "claimed",
      leaseExpiresAt: value.lease_expires_at,
      claimToken: value.claim_token,
      replayed: value.replayed,
      ...(value.replayed === false
        ? { quotaRemaining: value.quota_remaining as number }
        : {}),
    };
  }

  if (value.state === "in_progress") {
    if (
      !hasExactKeys(["ok", "state", "lease_expires_at"]) ||
      value.ok !== false ||
      typeof value.lease_expires_at !== "string" ||
      !Number.isFinite(Date.parse(value.lease_expires_at))
    ) {
      throw new HttpError(503, "invalid_claim_result");
    }
    return {
      state: "in_progress",
      leaseExpiresAt: value.lease_expires_at,
    };
  }

  if (value.state === "quota_exceeded") {
    if (
      !hasExactKeys(["ok", "state", "retry_after_seconds"]) ||
      value.ok !== false ||
      !Number.isSafeInteger(value.retry_after_seconds) ||
      (value.retry_after_seconds as number) < 1 ||
      (value.retry_after_seconds as number) > 86_400
    ) {
      throw new HttpError(503, "invalid_claim_result");
    }
    return {
      state: "quota_exceeded",
      retryAfterSeconds: value.retry_after_seconds as number,
    };
  }

  if (value.state === "failed") {
    if (
      !hasExactKeys(["ok", "state", "error_code"]) ||
      value.ok !== false ||
      !isAiFailureCode(value.error_code)
    ) {
      throw new HttpError(503, "invalid_claim_result");
    }
    return { state: "failed", errorCode: value.error_code };
  }

  throw new HttpError(503, "invalid_claim_result");
}

export function parseSourceInputs(value: unknown): SourceInput[] {
  if (!Array.isArray(value)) throw new HttpError(422, "invalid_source_inputs");
  if (value.length > LIMITS.sourceCount) {
    throw new HttpError(422, "too_many_sources");
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new HttpError(422, "invalid_source_inputs");
  }
  if (utf8Bytes(serialized) > LIMITS.sourceInputsBytes) {
    throw new HttpError(422, "source_inputs_too_large");
  }

  return value.map((entry) => {
    if (!isRecord(entry)) throw new HttpError(422, "invalid_source_input");
    const allowedKeys = new Set(["url", "note"]);
    if (Object.keys(entry).some((key) => !allowedKeys.has(key))) {
      throw new HttpError(422, "invalid_source_input");
    }
    if (typeof entry.url !== "string") {
      throw new HttpError(422, "invalid_source_url");
    }
    const rawUrl = entry.url.trim();
    if (
      !rawUrl ||
      rawUrl.length > LIMITS.sourceUrlCharacters ||
      utf8Bytes(rawUrl) > LIMITS.sourceUrlBytes
    ) {
      throw new HttpError(422, "invalid_source_url");
    }

    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new HttpError(422, "invalid_source_url");
    }
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new HttpError(422, "invalid_source_url");
    }
    if (!url.hostname || url.username || url.password) {
      throw new HttpError(422, "invalid_source_url");
    }
    const allowedPort = url.protocol === "https:" ? "443" : "80";
    if (url.port && url.port !== allowedPort) {
      throw new HttpError(422, "source_port_not_allowed");
    }
    if (hasSensitiveQueryKey(url)) {
      throw new HttpError(422, "source_url_contains_credentials");
    }
    url.hash = "";

    const noteValue = entry.note ?? "";
    if (typeof noteValue !== "string") {
      throw new HttpError(422, "invalid_source_note");
    }
    const note = noteValue.trim();
    if (
      note.length > LIMITS.sourceNoteCharacters ||
      utf8Bytes(note) > LIMITS.sourceNoteBytes
    ) {
      throw new HttpError(422, "source_note_too_large");
    }
    return { url: url.toString(), note };
  });
}

function parseIpv4(input: string): number[] | null {
  const parts = input.split(".");
  if (parts.length !== 4) return null;
  const numbers = parts.map((part) => Number(part));
  if (
    numbers.some((part, index) =>
      !Number.isInteger(part) || part < 0 || part > 255 ||
      String(part) !== parts[index]
    )
  ) return null;
  return numbers;
}

function isPublicIpv4(parts: number[]) {
  const [a, b, c] = parts;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 192 && b === 88 && c === 99) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a >= 224) return false;
  return true;
}

function parseIpv6(input: string): number[] | null {
  let value = input.toLowerCase();
  if (value.startsWith("[") && value.endsWith("]")) value = value.slice(1, -1);
  if (!value.includes(":")) return null;
  if (value.includes("%")) return null;
  if ((value.match(/::/g) ?? []).length > 1) return null;

  let ipv4Tail: number[] | null = null;
  const lastColon = value.lastIndexOf(":");
  const tail = value.slice(lastColon + 1);
  if (tail.includes(".")) {
    ipv4Tail = parseIpv4(tail);
    if (!ipv4Tail) return null;
    value = `${value.slice(0, lastColon)}:${
      ((ipv4Tail[0] << 8) | ipv4Tail[1]).toString(16)
    }:${((ipv4Tail[2] << 8) | ipv4Tail[3]).toString(16)}`;
  }

  const hasCompression = value.includes("::");
  const [leftRaw, rightRaw = ""] = value.split("::");
  const left = leftRaw ? leftRaw.split(":") : [];
  const right = rightRaw ? rightRaw.split(":") : [];
  const groups = [...left, ...right];
  if (groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null;
  const missing = 8 - groups.length;
  if ((hasCompression && missing < 1) || (!hasCompression && missing !== 0)) {
    return null;
  }

  return [
    ...left.map((group) => Number.parseInt(group, 16)),
    ...Array.from({ length: hasCompression ? missing : 0 }, () => 0),
    ...right.map((group) => Number.parseInt(group, 16)),
  ];
}

function isPublicIpv6(parts: number[]) {
  if (parts.length !== 8) return false;
  const [a, b] = parts;
  if ((a & 0xe000) !== 0x2000) return false;
  if (a === 0x2001 && b <= 0x01ff) return false; // IETF protocol assignments.
  if (a === 0x2001 && b === 0x0db8) return false; // Documentation.
  if (a === 0x2002) return false; // 6to4 can encode a private IPv4 target.
  if (a === 0x3ffe) return false; // Deprecated 6bone space.
  if (a === 0x3fff && (b & 0xf000) === 0) return false; // Documentation.
  return true;
}

export function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host.length > 253) return true;
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan") ||
    host.endsWith(".home") ||
    host.endsWith(".arpa") ||
    host === "metadata.google.internal"
  ) return true;

  const ipv4 = parseIpv4(host);
  if (ipv4) return !isPublicIpv4(ipv4);
  if (host.includes(":")) {
    const ipv6 = parseIpv6(host);
    return !ipv6 || !isPublicIpv6(ipv6);
  }
  return false;
}

export async function resolvePublicHost(
  hostname: string,
  resolver: DnsResolver,
) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (isBlockedHost(host)) throw new HttpError(422, "source_host_blocked");

  if (parseIpv4(host)) return [host];
  if (parseIpv6(host)) return [host.replace(/^\[|\]$/g, "")];

  let ipv4: string[];
  let ipv6: string[];
  try {
    [ipv4, ipv6] = await Promise.all([
      resolver(host, "A"),
      resolver(host, "AAAA"),
    ]);
  } catch {
    throw new HttpError(422, "source_dns_unavailable");
  }
  const addresses = [...ipv4, ...ipv6];
  if (
    addresses.length === 0 ||
    addresses.length > LIMITS.dnsAddressCount ||
    addresses.some((address) =>
      (!parseIpv4(address) && !parseIpv6(address)) || isBlockedHost(address)
    )
  ) {
    throw new HttpError(422, "source_host_blocked");
  }
  return [...new Set(addresses.map((address) => address.toLowerCase()))].sort();
}

export function sameAddressSet(first: string[], second: string[]) {
  if (first.length !== second.length) return false;
  return first.every((address, index) => address === second[index]);
}

export function hasSensitiveQueryKey(url: URL) {
  return [...url.searchParams.keys()].some((key) =>
    SENSITIVE_QUERY_KEY.test(key) ||
    ["fb_access_token", "x-amz-signature", "x-goog-signature"].includes(
      key.toLowerCase(),
    )
  );
}

export function sanitizeUrlForStorage(input: URL) {
  const safe = new URL(input.toString());
  safe.username = "";
  safe.password = "";
  safe.hash = "";
  for (const key of [...safe.searchParams.keys()]) {
    if (
      SENSITIVE_QUERY_KEY.test(key) ||
      ["fb_access_token", "x-amz-signature", "x-goog-signature"].includes(
        key.toLowerCase(),
      )
    ) safe.searchParams.delete(key);
  }
  return safe.toString();
}

export function isAllowedContentType(value: string | null) {
  if (!value) return false;
  const mime = value.split(";", 1)[0].trim().toLowerCase();
  return new Set([
    "text/plain",
    "text/html",
    "application/json",
    "application/xhtml+xml",
  ]).has(mime);
}

export function isLikelyTextContent(bytes: Uint8Array) {
  const prefix = bytes.slice(0, 8);
  const asciiPrefix = String.fromCharCode(...prefix);
  if (
    asciiPrefix.startsWith("%PDF-") ||
    asciiPrefix.startsWith("GIF87a") ||
    asciiPrefix.startsWith("GIF89a") ||
    (prefix[0] === 0x89 && asciiPrefix.slice(1).startsWith("PNG")) ||
    (prefix[0] === 0xff && prefix[1] === 0xd8 && prefix[2] === 0xff) ||
    (prefix[0] === 0x50 && prefix[1] === 0x4b && prefix[2] === 0x03 &&
      prefix[3] === 0x04) ||
    (prefix[0] === 0x1f && prefix[1] === 0x8b)
  ) return false;

  const sample = bytes.slice(0, Math.min(bytes.byteLength, 512));
  let controls = 0;
  for (const byte of sample) {
    if (byte === 0) return false;
    if (byte < 0x20 && ![0x09, 0x0a, 0x0d].includes(byte)) controls += 1;
  }
  return sample.byteLength === 0 || controls / sample.byteLength <= 0.05;
}

export function extractTitle(text: string, fallback: string) {
  const match = text.match(/<title[^>]*>([^<]{1,160})<\/title>/i);
  return (match?.[1] ?? fallback).replace(/\s+/g, " ").trim().slice(0, 160);
}

export function normalizeTextArtifact(
  text: string,
  contentType = "text/html",
) {
  const normalizedInput = ["text/html", "application/xhtml+xml"].includes(
      contentType,
    )
    ? text
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
    : text;
  return normalizedInput
    .replace(/\s+/g, " ")
    .trim();
}

export function textExcerpt(text: string) {
  return normalizeTextArtifact(text).slice(0, 900);
}

export function concatBytes(chunks: Uint8Array[], total: number) {
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

export async function hashBytes(bytes: Uint8Array) {
  const input = new Uint8Array(bytes.byteLength);
  input.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", input.buffer);
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}

export function isLeaseStale(updatedAt: string, now = Date.now()) {
  const timestamp = Date.parse(updatedAt);
  return Number.isFinite(timestamp) &&
    now - timestamp >= LIMITS.analysisLeaseMs;
}
