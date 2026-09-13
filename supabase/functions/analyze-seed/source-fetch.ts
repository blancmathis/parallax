import http, {
  type IncomingMessage,
  type RequestOptions as HttpRequestOptions,
} from "node:http";
import https, { type RequestOptions as HttpsRequestOptions } from "node:https";
import { isIP } from "node:net";
import { Readable } from "node:stream";
import { checkServerIdentity } from "node:tls";
import {
  concatBytes,
  type DnsResolver,
  extractTitle,
  hashBytes,
  hasSensitiveQueryKey,
  HttpError,
  isAllowedContentType,
  isLikelyTextContent,
  LIMITS,
  normalizeTextArtifact,
  resolvePublicHost,
  type Retrieval,
  sameAddressSet,
  sanitizeUrlForStorage,
  type SourceInput,
} from "./core.ts";

export type FetchSourceDependencies = {
  resolveDns: DnsResolver;
  pinnedFetchImpl?: PinnedFetch;
  /** Test-only compatibility hook. Production callers use the pinned transport. */
  fetchImpl?: typeof fetch;
  fetchTimeoutMs?: number;
  maxSourceBytes?: number;
};

export type PinnedFetch = (
  url: URL,
  address: string,
  signal: AbortSignal,
) => Promise<Response>;

export type SourceCaptureStatus =
  | "found"
  | "partial"
  | "blocked"
  | "failed"
  | "missing"
  | "unsupported";

export type CapturedSource = {
  requestedUrl: string;
  finalUrl: string;
  status: SourceCaptureStatus;
  httpStatus: number | null;
  contentType: string;
  rawBytes: Uint8Array | null;
  rawHash: string | null;
  normalizedText: string | null;
  normalizedHash: string | null;
  byteLength: number;
  title: string;
  publisher: string;
  sourceType: "other";
  parserVersion: "bounded-text-v1";
  isTruncated: boolean;
  failureCode: string | null;
  locator: string;
  note: string;
};

type CaptureFields = {
  status: SourceCaptureStatus;
  title: string;
  locator: string;
  note?: string;
  httpStatus?: number | null;
  contentType?: string;
  rawBytes?: Uint8Array | null;
  rawHash?: string | null;
  normalizedText?: string | null;
  normalizedHash?: string | null;
};

function boundedNote(systemNote: string, submitterNote: string) {
  const submitterLabel = " Submitter note: ";
  const boundedSystemNote = systemNote.slice(0, LIMITS.sourceNoteCharacters);
  const remainingNoteCharacters = Math.max(
    0,
    LIMITS.sourceNoteCharacters - boundedSystemNote.length -
      submitterLabel.length,
  );
  return submitterNote && remainingNoteCharacters > 0
    ? `${boundedSystemNote}${submitterLabel}${
      submitterNote.slice(0, remainingNoteCharacters)
    }`
    : boundedSystemNote;
}

function baseContentType(value: string | null) {
  return value?.split(";", 1)[0].trim().toLowerCase() ||
    "application/octet-stream";
}

function decodeDeclaredText(bytes: Uint8Array, contentType: string | null) {
  const match = contentType?.match(/;\s*charset\s*=\s*["']?([^;"'\s]+)/i);
  const charset = match?.[1] ?? "utf-8";
  try {
    return new TextDecoder(charset, { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function captureResult(
  input: SourceInput,
  url: URL,
  fields: CaptureFields,
): CapturedSource {
  const systemNote = fields.note ??
    "Source retrieval was handled by the bounded server fetcher.";
  const safeUrl = sanitizeUrlForStorage(url);
  const rawBytes = fields.rawBytes ?? null;
  return {
    requestedUrl: safeUrl,
    finalUrl: safeUrl,
    status: fields.status,
    httpStatus: fields.httpStatus ?? null,
    contentType: fields.contentType ?? "application/octet-stream",
    rawBytes,
    rawHash: fields.rawHash ?? null,
    normalizedText: fields.normalizedText ?? null,
    normalizedHash: fields.normalizedHash ?? null,
    byteLength: rawBytes?.byteLength ?? 0,
    title: fields.title,
    publisher: url.hostname.slice(0, 200),
    sourceType: "other",
    parserVersion: "bounded-text-v1",
    isTruncated: fields.status === "partial",
    failureCode: ["found", "partial"].includes(fields.status)
      ? null
      : fields.locator,
    locator: fields.locator,
    note: boundedNote(systemNote, input.note),
  };
}

function boundedPositiveInteger(value: number | undefined, maximum: number) {
  if (!Number.isSafeInteger(value) || (value as number) < 1) return maximum;
  return Math.min(value as number, maximum);
}

function canonicalNetworkAddress(value: string | undefined) {
  if (!value) return null;
  const raw = value.toLowerCase().replace(/^\[|\]$/g, "");
  const mappedIpv4 = raw.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4 && isIP(mappedIpv4) === 4) return mappedIpv4;
  if (isIP(raw) === 4) {
    return raw.split(".").map((part) => String(Number(part))).join(".");
  }
  if (isIP(raw) === 6) {
    try {
      return new URL(`http://[${raw}]/`).hostname.slice(1, -1);
    } catch {
      return null;
    }
  }
  return null;
}

function responseHeaders(message: IncomingMessage) {
  const headers = new Headers();
  for (let index = 0; index < message.rawHeaders.length; index += 2) {
    headers.append(message.rawHeaders[index], message.rawHeaders[index + 1]);
  }
  return headers;
}

export const fetchPinnedSource: PinnedFetch = (url, address, signal) => {
  return new Promise<Response>((resolve, reject) => {
    const requestedHostname = url.hostname.replace(/^\[|\]$/g, "");
    const family = isIP(address);
    if (family === 0) {
      reject(new HttpError(502, "invalid_pinned_address"));
      return;
    }

    const commonOptions: HttpRequestOptions = {
      hostname: address,
      port: Number(url.port || (url.protocol === "https:" ? 443 : 80)),
      path: `${url.pathname}${url.search}`,
      method: "GET",
      family,
      agent: false,
      signal,
      maxHeaderSize: 16_384,
      headers: {
        accept:
          "text/html,text/plain,application/xhtml+xml,application/json;q=0.9",
        "accept-encoding": "identity",
        host: url.host,
        "user-agent": "ParallaxSourceFetcher/0.4",
      },
    };

    const onResponse = (message: IncomingMessage) => {
      const actualAddress = canonicalNetworkAddress(
        message.socket.remoteAddress,
      );
      const expectedAddress = canonicalNetworkAddress(address);
      if (!actualAddress || actualAddress !== expectedAddress) {
        message.destroy();
        reject(new HttpError(502, "source_socket_address_mismatch"));
        return;
      }
      const status = message.statusCode ?? 0;
      if (status < 200 || status > 599) {
        message.destroy();
        reject(new HttpError(502, "invalid_source_status"));
        return;
      }

      const bodyForbidden = [204, 205, 304].includes(status);
      if (bodyForbidden) message.resume();
      resolve(
        new Response(
          bodyForbidden
            ? null
            : Readable.toWeb(message) as ReadableStream<Uint8Array>,
          { status, headers: responseHeaders(message) },
        ),
      );
    };

    let request: http.ClientRequest;
    if (url.protocol === "https:") {
      const tlsOptions: HttpsRequestOptions = {
        ...commonOptions,
        rejectUnauthorized: true,
        servername: isIP(requestedHostname) === 0
          ? requestedHostname
          : undefined,
        checkServerIdentity: (_hostname, certificate) =>
          checkServerIdentity(requestedHostname, certificate),
      };
      request = https.request(tlsOptions, onResponse);
    } else if (url.protocol === "http:") {
      request = http.request(commonOptions, onResponse);
    } else {
      reject(new HttpError(502, "invalid_source_protocol"));
      return;
    }
    request.once("upgrade", (_response, socket) => {
      socket.destroy();
      reject(new HttpError(502, "source_protocol_upgrade_blocked"));
    });
    request.once("error", reject);
    request.end();
  });
};

async function cancelBody(response: Response) {
  try {
    await response.body?.cancel();
  } catch {
    // Cancellation is best-effort once a response has been rejected.
  }
}

export async function captureProvidedSource(
  input: SourceInput,
  dependencies: FetchSourceDependencies,
): Promise<CapturedSource> {
  const url = new URL(input.url);
  const expectedPort = url.protocol === "https:" ? "443" : "80";
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username || url.password ||
    (url.port && url.port !== expectedPort)
  ) {
    throw new HttpError(422, "invalid_source_url");
  }
  const pinnedFetch: PinnedFetch = dependencies.pinnedFetchImpl ??
    (dependencies.fetchImpl
      ? (target, _address, signal) =>
        dependencies.fetchImpl!(target.toString(), {
          signal,
          redirect: "manual",
          headers: {
            accept:
              "text/html,text/plain,application/xhtml+xml,application/json;q=0.9",
            "accept-encoding": "identity",
            "user-agent": "ParallaxSourceFetcher/0.4-test",
          },
        })
      : fetchPinnedSource);
  const fetchTimeoutMs = boundedPositiveInteger(
    dependencies.fetchTimeoutMs,
    LIMITS.sourceFetchTimeoutMs,
  );
  const maxSourceBytes = boundedPositiveInteger(
    dependencies.maxSourceBytes,
    LIMITS.sourceBytes,
  );

  if (hasSensitiveQueryKey(url)) {
    return captureResult(input, url, {
      status: "blocked",
      title: "Blocked provided URL",
      locator: "sensitive-query-parameter",
      note: "Credential-bearing source URLs are not fetched or retained.",
    });
  }

  let addressesBefore: string[];
  try {
    addressesBefore = await resolvePublicHost(
      url.hostname,
      dependencies.resolveDns,
    );
  } catch {
    return captureResult(input, url, {
      status: "blocked",
      title: "Blocked provided URL",
      locator: "blocked-before-fetch",
      note: "The source host did not pass the public-network policy.",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);
  let httpStatus: number | null = null;
  let contentType = "application/octet-stream";
  try {
    const response = await pinnedFetch(
      url,
      addressesBefore[0],
      controller.signal,
    );
    httpStatus = response.status;
    const declaredContentType = response.headers.get("content-type");
    contentType = baseContentType(declaredContentType);

    // The production transport connects directly to addressesBefore[0], keeps
    // the original Host/SNI/certificate identity, and verifies remoteAddress.
    // DNS revalidation remains a conservative change detector; it is not the
    // mechanism that closes the DNS-to-socket race.
    let addressesAfter: string[];
    try {
      addressesAfter = await resolvePublicHost(
        url.hostname,
        dependencies.resolveDns,
      );
    } catch {
      await cancelBody(response);
      return captureResult(input, url, {
        status: "blocked",
        title: "Source host changed",
        locator: "dns-revalidation-failed",
        note: "DNS revalidation failed after the connection was opened.",
        httpStatus,
        contentType,
      });
    }
    if (!sameAddressSet(addressesBefore, addressesAfter)) {
      await cancelBody(response);
      return captureResult(input, url, {
        status: "blocked",
        title: "Source host changed",
        locator: "dns-address-changed",
        note:
          "The source address changed during retrieval, so the response was discarded.",
        httpStatus,
        contentType,
      });
    }

    if (response.status >= 300 && response.status < 400) {
      await cancelBody(response);
      return captureResult(input, url, {
        status: "blocked",
        title: `HTTP ${response.status}`,
        locator: "redirect-not-followed",
        note: "Redirects are not followed by the source fetcher.",
        httpStatus,
        contentType,
      });
    }
    if (!response.ok) {
      await cancelBody(response);
      return captureResult(input, url, {
        status: response.status === 404 ? "missing" : "failed",
        title: `HTTP ${response.status}`,
        locator: "http-status",
        note: "The source did not return a usable response.",
        httpStatus,
        contentType,
      });
    }
    const contentEncoding = response.headers.get("content-encoding")?.trim()
      .toLowerCase();
    if (contentEncoding && contentEncoding !== "identity") {
      await cancelBody(response);
      return captureResult(input, url, {
        status: "unsupported",
        title: "Unsupported source encoding",
        locator: "unsupported-content-encoding",
        note:
          "Compressed source bodies are not accepted by the pinned fetcher.",
        httpStatus,
        contentType,
      });
    }
    if (!isAllowedContentType(response.headers.get("content-type"))) {
      await cancelBody(response);
      return captureResult(input, url, {
        status: "unsupported",
        title: "Unsupported source type",
        locator: "unsupported-content-type",
        note: "Only bounded textual source formats are accepted.",
        httpStatus,
        contentType,
      });
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return captureResult(input, url, {
        status: "failed",
        title: "Empty response",
        locator: "empty-body",
        note: "The source response did not include a body.",
        httpStatus,
        contentType,
      });
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    let partial = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      const remaining = maxSourceBytes - total;
      if (remaining <= 0) {
        partial = true;
        await reader.cancel("source body limit reached");
        break;
      }
      if (value.byteLength > remaining) {
        chunks.push(value.slice(0, remaining));
        total += remaining;
        partial = true;
        await reader.cancel("source body limit reached");
        break;
      }
      chunks.push(value);
      total += value.byteLength;
    }

    if (total === 0) {
      return captureResult(input, url, {
        status: "failed",
        title: "Empty response",
        locator: "empty-body",
        note: "The source response body was empty.",
        httpStatus,
        contentType,
      });
    }

    const bytes = concatBytes(chunks, total);
    if (!isLikelyTextContent(bytes)) {
      return captureResult(input, url, {
        status: "unsupported",
        title: "Unsupported source body",
        locator: "binary-content-detected",
        note: "The response body did not match a bounded textual format.",
        httpStatus,
        contentType,
      });
    }
    const raw = decodeDeclaredText(bytes, declaredContentType);
    if (raw === null) {
      return captureResult(input, url, {
        status: "unsupported",
        title: "Unsupported source encoding",
        locator: "invalid-text-encoding",
        note: "The response could not be decoded using its declared encoding.",
        httpStatus,
        contentType,
      });
    }
    let normalizedText: string;
    if (contentType === "application/json") {
      try {
        JSON.parse(raw);
      } catch {
        return captureResult(input, url, {
          status: "unsupported",
          title: "Invalid JSON source",
          locator: "invalid-json-content",
          note: "The response was not valid JSON despite its declared type.",
          httpStatus,
          contentType,
        });
      }
      normalizedText = raw.trim();
    } else {
      normalizedText = normalizeTextArtifact(raw, contentType);
    }
    if (!normalizedText) {
      return captureResult(input, url, {
        status: "failed",
        title: "Empty normalized source",
        locator: "empty-normalized-text",
        note: "The response did not contain usable normalized text.",
        httpStatus,
        contentType,
      });
    }
    const normalizedBytes = new TextEncoder().encode(normalizedText);
    return captureResult(input, url, {
      status: partial ? "partial" : "found",
      title: extractTitle(raw, url.hostname),
      locator: partial
        ? `first ${maxSourceBytes} bytes`
        : "bounded fetch excerpt",
      note:
        "Fetched text is untrusted; capture is byte-bounded and raw content must remain private.",
      httpStatus,
      contentType,
      rawBytes: bytes,
      rawHash: await hashBytes(bytes),
      normalizedText,
      normalizedHash: await hashBytes(normalizedBytes),
    });
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "AbortError" ||
      error instanceof HttpError && error.code.endsWith("timeout");
    return captureResult(input, url, {
      status: "failed",
      title: timedOut ? "Source fetch timed out" : "Source fetch failed",
      locator: timedOut ? "fetch-timeout" : "fetch-error",
      note: timedOut
        ? "The source did not complete within the retrieval deadline."
        : "The source could not be retrieved safely.",
      httpStatus,
      contentType,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchProvidedSource(
  input: SourceInput,
  dependencies: FetchSourceDependencies,
): Promise<Retrieval> {
  const captured = await captureProvidedSource(input, dependencies);
  return {
    url: captured.finalUrl,
    status: captured.status === "unsupported" ? "blocked" : captured.status,
    title: captured.title,
    publisher: captured.publisher,
    excerpt: captured.normalizedText?.slice(0, 900) ?? "",
    note: captured.note,
    locator: captured.locator,
    hash: captured.rawHash,
  };
}
