import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { DnsResolver } from "../core.ts";
import {
  captureProvidedSource,
  fetchPinnedSource,
  fetchProvidedSource,
} from "../source-fetch.ts";

const publicResolver: DnsResolver = (_hostname, recordType) =>
  Promise.resolve(recordType === "A" ? ["93.184.216.34"] : []);

test("fetchProvidedSource retrieves bounded text through the shared capture core", async () => {
  const result = await fetchProvidedSource(
    {
      url: "https://example.com/report?lang=fr",
      note: "Primary source selected by the submitter.",
    },
    {
      resolveDns: publicResolver,
      fetchImpl: (() =>
        Promise.resolve(
          new Response(
            "<html><title>Source title</title><body>Useful evidence.</body></html>",
            { headers: { "content-type": "text/html; charset=utf-8" } },
          ),
        )) as typeof fetch,
    },
  );
  assert.equal(result.status, "found");
  assert.equal(result.title, "Source title");
  assert.equal(result.excerpt, "Source title Useful evidence.");
  assert.match(result.note, /untrusted/i);
  assert.match(result.note, /Submitter note: Primary source/);
  assert.equal(new URL(result.url).searchParams.get("lang"), "fr");
  assert.match(result.hash ?? "", /^sha256:[0-9a-f]{64}$/);
});

test("captureProvidedSource exposes bounded raw and normalized provenance", async () => {
  const raw =
    "<html><title>Source title</title><body>Useful evidence.</body></html>";
  const result = await captureProvidedSource(
    { url: "https://example.com/report", note: "" },
    {
      resolveDns: publicResolver,
      pinnedFetchImpl: (_url, address) => {
        assert.equal(address, "93.184.216.34");
        return Promise.resolve(
          new Response(raw, {
            headers: { "content-type": "text/html; charset=utf-8" },
          }),
        );
      },
    },
  );
  assert.equal(result.status, "found");
  assert.equal(result.httpStatus, 200);
  assert.equal(result.contentType, "text/html");
  assert.equal(result.parserVersion, "bounded-text-v1");
  assert.equal(result.isTruncated, false);
  assert.equal(result.failureCode, null);
  assert.equal(result.normalizedText, "Source title Useful evidence.");
  assert.equal(
    result.normalizedHash,
    "sha256:3f39d61b5257f355df81b6ae7c9fb50bbdc7d773afa21ad3941ea590a6df8f6f",
  );
  assert.equal(new TextDecoder().decode(result.rawBytes ?? undefined), raw);
  assert.equal(result.byteLength, new TextEncoder().encode(raw).byteLength);
  assert.match(result.rawHash ?? "", /^sha256:[0-9a-f]{64}$/);
});

test("fetchPinnedSource connects to the validated IP while preserving HTTP Host", async () => {
  let observedHost = "";
  let observedPath = "";
  const server = Deno.serve({
    hostname: "127.0.0.1",
    port: 0,
    onListen: () => {},
  }, (request) => {
    observedHost = request.headers.get("host") ?? "";
    observedPath = new URL(request.url).pathname + new URL(request.url).search;
    return new Response("pinned transport");
  });
  try {
    const port = (server.addr as Deno.NetAddr).port;
    const response = await fetchPinnedSource(
      new URL(`http://does-not-resolve.invalid:${port}/probe?value=1`),
      "127.0.0.1",
      new AbortController().signal,
    );
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "pinned transport");
    assert.equal(observedHost, `does-not-resolve.invalid:${port}`);
    assert.equal(observedPath, "/probe?value=1");
  } finally {
    await server.shutdown();
  }
});

test("fetchPinnedSource aborts the direct socket request", async () => {
  const server = Deno.serve({
    hostname: "127.0.0.1",
    port: 0,
    onListen: () => {},
  }, async () => {
    await new Promise((resolve) => setTimeout(resolve, 75));
    return new Response("late response");
  });
  try {
    const port = (server.addr as Deno.NetAddr).port;
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5);
    await assert.rejects(
      () =>
        fetchPinnedSource(
          new URL(`http://does-not-resolve.invalid:${port}/slow`),
          "127.0.0.1",
          controller.signal,
        ),
      (error: unknown) =>
        error instanceof Error &&
        (error.name === "AbortError" || "code" in error &&
            error.code === "ABORT_ERR"),
    );
  } finally {
    await server.shutdown();
  }
});

test("sensitive query parameters are blocked before DNS or fetch", async () => {
  let resolved = false;
  let fetched = false;
  const result = await captureProvidedSource(
    { url: "https://example.com/report?access_token=secret", note: "" },
    {
      resolveDns: () => {
        resolved = true;
        return Promise.resolve(["93.184.216.34"]);
      },
      fetchImpl: (() => {
        fetched = true;
        return Promise.resolve(new Response("must not run"));
      }) as typeof fetch,
    },
  );
  assert.equal(resolved, false);
  assert.equal(fetched, false);
  assert.equal(result.status, "blocked");
  assert.equal(result.failureCode, "sensitive-query-parameter");
  assert.equal(new URL(result.requestedUrl).searchParams.size, 0);
  assert.equal(result.rawBytes, null);
  assert.equal(result.byteLength, 0);
});

test("retrieval notes preserve system provenance within the database limit", async () => {
  const result = await fetchProvidedSource(
    {
      url: "https://example.com/report",
      note: "x".repeat(240),
    },
    {
      resolveDns: publicResolver,
      fetchImpl: (() =>
        Promise.resolve(
          new Response("evidence", {
            headers: { "content-type": "text/plain" },
          }),
        )) as typeof fetch,
    },
  );
  assert.equal(result.note.length, 240);
  assert.match(result.note, /^Fetched text is untrusted/);
  assert.match(result.note, /Submitter note:/);
});

test("fetchProvidedSource blocks a private AAAA answer before fetch", async () => {
  let fetched = false;
  const result = await fetchProvidedSource(
    { url: "https://example.com/", note: "" },
    {
      resolveDns: (_hostname, recordType) =>
        Promise.resolve(
          recordType === "A" ? ["93.184.216.34"] : ["fd00::1"],
        ),
      fetchImpl: (() => {
        fetched = true;
        return Promise.resolve(new Response("must not run"));
      }) as typeof fetch,
    },
  );
  assert.equal(fetched, false);
  assert.equal(result.status, "blocked");
  assert.equal(result.locator, "blocked-before-fetch");
  assert.equal(result.hash, null);
});

test("fetchProvidedSource discards a response when DNS answers change", async () => {
  let aCalls = 0;
  const result = await fetchProvidedSource(
    { url: "https://example.com/", note: "" },
    {
      resolveDns: (_hostname, recordType) => {
        if (recordType === "AAAA") return Promise.resolve([]);
        aCalls += 1;
        return Promise.resolve([
          aCalls === 1 ? "93.184.216.34" : "93.184.216.35",
        ]);
      },
      fetchImpl: (() =>
        Promise.resolve(
          new Response("discard me", {
            headers: { "content-type": "text/plain" },
          }),
        )) as typeof fetch,
    },
  );
  assert.equal(result.status, "blocked");
  assert.equal(result.locator, "dns-address-changed");
});

test("fetchProvidedSource rejects redirects and unsupported MIME types", async () => {
  const redirect = await fetchProvidedSource(
    { url: "https://example.com/redirect", note: "" },
    {
      resolveDns: publicResolver,
      fetchImpl: (() =>
        Promise.resolve(
          new Response(null, {
            status: 302,
            headers: { location: "https://other.example/" },
          }),
        )) as typeof fetch,
    },
  );
  assert.equal(redirect.status, "blocked");
  assert.equal(redirect.locator, "redirect-not-followed");
  assert.equal(redirect.hash, null);

  const binary = await fetchProvidedSource(
    { url: "https://example.com/file.pdf", note: "" },
    {
      resolveDns: publicResolver,
      fetchImpl: (() =>
        Promise.resolve(
          new Response("%PDF", {
            headers: { "content-type": "application/pdf" },
          }),
        )) as typeof fetch,
    },
  );
  assert.equal(binary.status, "blocked");
  assert.equal(binary.locator, "unsupported-content-type");

  const disguisedBinary = await fetchProvidedSource(
    { url: "https://example.com/disguised", note: "" },
    {
      resolveDns: publicResolver,
      fetchImpl: (() =>
        Promise.resolve(
          new Response("%PDF-1.7", {
            headers: { "content-type": "text/plain" },
          }),
        )) as typeof fetch,
    },
  );
  assert.equal(disguisedBinary.status, "blocked");
  assert.equal(disguisedBinary.locator, "binary-content-detected");
  assert.equal(disguisedBinary.hash, null);
});

test("captureProvidedSource rejects bytes invalid for the declared text encoding", async () => {
  const result = await captureProvidedSource(
    { url: "https://example.com/invalid-utf8", note: "" },
    {
      resolveDns: publicResolver,
      fetchImpl: (() =>
        Promise.resolve(
          new Response(new Uint8Array([0xff, 0xfe]), {
            headers: { "content-type": "text/plain; charset=utf-8" },
          }),
        )) as typeof fetch,
    },
  );
  assert.equal(result.status, "unsupported");
  assert.equal(result.failureCode, "invalid-text-encoding");
  assert.equal(result.rawBytes, null);
  assert.equal(result.normalizedText, null);
});

test("normalization preserves JSON strings and plain-text angle brackets", async () => {
  const cases = [
    {
      contentType: "application/json",
      raw: '{"claim":"1 < 2 > 0"}',
    },
    {
      contentType: "text/plain",
      raw: "claim: 1 < 2 > 0",
    },
  ];
  for (const { contentType, raw } of cases) {
    const result = await captureProvidedSource(
      { url: "https://example.com/evidence", note: "" },
      {
        resolveDns: publicResolver,
        fetchImpl: (() =>
          Promise.resolve(
            new Response(raw, {
              headers: { "content-type": contentType },
            }),
          )) as typeof fetch,
      },
    );
    assert.equal(result.status, "found");
    assert.equal(result.normalizedText, raw);
  }
});

test("invalid JSON is a technical capture failure, not normalized evidence", async () => {
  const result = await captureProvidedSource(
    { url: "https://example.com/invalid-json", note: "" },
    {
      resolveDns: publicResolver,
      fetchImpl: (() =>
        Promise.resolve(
          new Response("{not-json}", {
            headers: { "content-type": "application/json" },
          }),
        )) as typeof fetch,
    },
  );
  assert.equal(result.status, "unsupported");
  assert.equal(result.failureCode, "invalid-json-content");
  assert.equal(result.rawBytes, null);
  assert.equal(result.normalizedText, null);
});

test("fetchProvidedSource truncates and hashes the exact accepted bytes", async () => {
  const result = await fetchProvidedSource(
    { url: "https://example.com/large", note: "" },
    {
      resolveDns: publicResolver,
      maxSourceBytes: 8,
      fetchImpl: (() =>
        Promise.resolve(
          new Response("123456789", {
            headers: { "content-type": "text/plain" },
          }),
        )) as typeof fetch,
    },
  );
  assert.equal(result.status, "partial");
  assert.equal(result.excerpt, "12345678");
  assert.equal(result.locator, "first 8 bytes");
  assert.equal(
    result.hash,
    "sha256:ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f",
  );
});

test("fetchProvidedSource returns a bounded timeout failure", async () => {
  const result = await fetchProvidedSource(
    { url: "https://example.com/slow", note: "" },
    {
      resolveDns: publicResolver,
      fetchTimeoutMs: 10,
      fetchImpl:
        ((_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("aborted", "AbortError"));
            }, { once: true });
          })) as typeof fetch,
    },
  );
  assert.equal(result.status, "failed");
  assert.equal(result.locator, "fetch-timeout");
});
