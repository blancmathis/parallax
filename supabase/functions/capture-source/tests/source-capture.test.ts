import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { DnsResolver } from "../../analyze-seed/core.ts";
import { captureProvidedSource } from "../../analyze-seed/source-fetch.ts";

const publicResolver: DnsResolver = (_hostname, recordType) =>
  Promise.resolve(recordType === "A" ? ["93.184.216.34"] : []);

test("shared capture hashes exact raw bytes and the full normalized text", async () => {
  const raw =
    "<html><title>Public report</title><script>ignore()</script><body>A   B</body></html>";
  const result = await captureProvidedSource(
    { url: "https://example.com/report", note: "" },
    {
      resolveDns: publicResolver,
      fetchImpl: (() =>
        Promise.resolve(
          new Response(raw, {
            headers: { "content-type": "text/html; charset=utf-8" },
          }),
        )) as typeof fetch,
    },
  );

  assert.equal(result.status, "found");
  assert.equal(result.byteLength, new TextEncoder().encode(raw).byteLength);
  assert.equal(new TextDecoder().decode(result.rawBytes ?? undefined), raw);
  assert.equal(result.normalizedText, "Public report A B");
  assert.equal(
    result.rawHash,
    "sha256:d1dc51a2bd47bf71f4a8c742ccccea5685bc09f62370f18fae9e0ad8e02bcc44",
  );
  assert.equal(
    result.normalizedHash,
    "sha256:a9ca1083c45db39ae9720ede711bce320bfcad6b8f38bb06da93e3a40f08a38f",
  );
  assert.equal(result.failureCode, null);
});

test("shared capture blocks private A, private AAAA, and IPv4-mapped answers", async () => {
  const cases: Array<{ a: string[]; aaaa: string[] }> = [
    { a: ["10.0.0.4"], aaaa: [] },
    { a: ["93.184.216.34"], aaaa: ["fd00::1"] },
    { a: [], aaaa: ["::ffff:127.0.0.1"] },
  ];
  for (const addresses of cases) {
    let fetched = false;
    const result = await captureProvidedSource(
      { url: "https://example.com/private", note: "" },
      {
        resolveDns: (_hostname, recordType) =>
          Promise.resolve(recordType === "A" ? addresses.a : addresses.aaaa),
        fetchImpl: (() => {
          fetched = true;
          return Promise.resolve(new Response("must not fetch"));
        }) as typeof fetch,
      },
    );
    assert.equal(fetched, false);
    assert.equal(result.status, "blocked");
    assert.equal(result.failureCode, "blocked-before-fetch");
    assert.equal(result.rawBytes, null);
  }
});

test("shared capture discards redirects and DNS-rebinding responses", async () => {
  const redirect = await captureProvidedSource(
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
  assert.equal(redirect.failureCode, "redirect-not-followed");

  let aCalls = 0;
  const rebound = await captureProvidedSource(
    { url: "https://example.com/rebind", note: "" },
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
          new Response("discard", {
            headers: { "content-type": "text/plain" },
          }),
        )) as typeof fetch,
    },
  );
  assert.equal(rebound.status, "blocked");
  assert.equal(rebound.failureCode, "dns-address-changed");
  assert.equal(rebound.rawBytes, null);
});

test("shared capture rejects unsupported MIME, compression, and disguised binary bodies", async () => {
  for (
    const response of [
      new Response("%PDF-1.7", {
        headers: { "content-type": "application/pdf" },
      }),
      new Response("%PDF-1.7", {
        headers: { "content-type": "text/plain" },
      }),
      new Response("compressed bytes are refused", {
        headers: {
          "content-type": "text/plain",
          "content-encoding": "gzip",
        },
      }),
    ]
  ) {
    const result = await captureProvidedSource(
      { url: "https://example.com/file", note: "" },
      {
        resolveDns: publicResolver,
        fetchImpl: (() => Promise.resolve(response)) as typeof fetch,
      },
    );
    assert.equal(result.status, "unsupported");
    assert.equal(result.rawBytes, null);
    assert.equal(result.rawHash, null);
    assert.equal(result.normalizedText, null);
  }
});

test("shared capture truncates at the byte limit and hashes accepted bytes only", async () => {
  const result = await captureProvidedSource(
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
  assert.equal(result.byteLength, 8);
  assert.equal(result.isTruncated, true);
  assert.equal(
    new TextDecoder().decode(result.rawBytes ?? undefined),
    "12345678",
  );
  assert.equal(
    result.rawHash,
    "sha256:ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f",
  );
});

test("transport and HTTP errors stay capture failures, never counter-evidence", async () => {
  const unavailable = await captureProvidedSource(
    { url: "https://example.com/unavailable", note: "" },
    {
      resolveDns: publicResolver,
      fetchImpl: (() =>
        Promise.resolve(
          new Response(null, {
            status: 503,
            headers: { "content-type": "text/plain" },
          }),
        )) as typeof fetch,
    },
  );
  assert.equal(unavailable.status, "failed");
  assert.equal(unavailable.failureCode, "http-status");
  assert.equal(unavailable.rawBytes, null);
  assert.equal(unavailable.normalizedText, null);

  const missing = await captureProvidedSource(
    { url: "https://example.com/missing", note: "" },
    {
      resolveDns: publicResolver,
      fetchImpl: (() =>
        Promise.resolve(
          new Response(null, {
            status: 404,
            headers: { "content-type": "text/plain" },
          }),
        )) as typeof fetch,
    },
  );
  assert.equal(missing.status, "missing");
  assert.equal(missing.failureCode, "http-status");

  const timeout = await captureProvidedSource(
    { url: "https://example.com/slow", note: "" },
    {
      resolveDns: publicResolver,
      fetchTimeoutMs: 5,
      fetchImpl:
        ((_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("aborted", "AbortError"));
            }, { once: true });
          })) as typeof fetch,
    },
  );
  assert.equal(timeout.status, "failed");
  assert.equal(timeout.failureCode, "fetch-timeout");
});
