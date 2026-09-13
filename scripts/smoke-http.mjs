#!/usr/bin/env node

import { validateBrowserPublicKey } from "./lib/public-key.mjs";

const options = {
  baseUrl: null,
  canonicalOrigin: null,
  supabaseUrl: null,
  publicKey: null,
  publicKeyEnv: null,
  loginEmail: null,
  loginPasswordEnv: null,
  allowedOrigin: null,
  deniedOrigin: null,
  expectCloudflareHeaders: false,
};

function usage() {
  console.log(`Usage:
  node scripts/smoke-http.mjs --base-url URL [--canonical-origin URL] [--expect-cloudflare-headers]
  PUBLIC_KEY=... node scripts/smoke-http.mjs --supabase-url URL --public-key-env PUBLIC_KEY

Optional authenticated handler/CORS proof:
  LOGIN_PASSWORD=... PUBLIC_KEY=... node scripts/smoke-http.mjs \\
    --supabase-url URL --public-key-env PUBLIC_KEY \\
    --login-email EMAIL --login-password-env LOGIN_PASSWORD \\
    --allowed-origin ORIGIN --denied-origin ORIGIN

Both frontend and Supabase targets may be supplied in the same invocation.
The smoke is read-only: it does not create accounts or mutate application data.`);
}

for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  switch (argument) {
    case "--base-url":
      options.baseUrl = process.argv[++index];
      break;
    case "--canonical-origin":
      options.canonicalOrigin = process.argv[++index];
      break;
    case "--supabase-url":
      options.supabaseUrl = process.argv[++index];
      break;
    case "--public-key":
      options.publicKey = process.argv[++index];
      break;
    case "--public-key-env":
      options.publicKeyEnv = process.argv[++index];
      break;
    case "--login-email":
      options.loginEmail = process.argv[++index];
      break;
    case "--login-password-env":
      options.loginPasswordEnv = process.argv[++index];
      break;
    case "--allowed-origin":
      options.allowedOrigin = process.argv[++index];
      break;
    case "--denied-origin":
      options.deniedOrigin = process.argv[++index];
      break;
    case "--expect-cloudflare-headers":
      options.expectCloudflareHeaders = true;
      break;
    case "-h":
    case "--help":
      usage();
      process.exit(0);
      break;
    default:
      throw new Error(`Unknown or incomplete argument: ${argument ?? "<missing>"}`);
  }
}

if (options.publicKeyEnv) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(options.publicKeyEnv)) {
    throw new Error("--public-key-env must name one environment variable");
  }
  if (options.publicKey) {
    throw new Error("Use only one of --public-key or --public-key-env");
  }
  options.publicKey = process.env[options.publicKeyEnv] ?? null;
}

if (!options.baseUrl && !options.supabaseUrl) {
  usage();
  throw new Error("At least one target is required");
}
if (Boolean(options.supabaseUrl) !== Boolean(options.publicKey)) {
  throw new Error("--supabase-url and a public key must be supplied together");
}
if (options.canonicalOrigin && !options.baseUrl) {
  throw new Error("--canonical-origin requires --base-url");
}
if (options.expectCloudflareHeaders && !options.baseUrl) {
  throw new Error("--expect-cloudflare-headers requires --base-url");
}
const authenticatedOptions = [
  options.loginEmail,
  options.loginPasswordEnv,
  options.allowedOrigin,
  options.deniedOrigin,
];
if (authenticatedOptions.some(Boolean) && !authenticatedOptions.every(Boolean)) {
  throw new Error(
    "authenticated Edge proof requires --login-email, --login-password-env, --allowed-origin, and --denied-origin",
  );
}
if (authenticatedOptions.every(Boolean) && !options.supabaseUrl) {
  throw new Error("authenticated Edge proof requires --supabase-url and a public key");
}
if (options.loginPasswordEnv && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(options.loginPasswordEnv)) {
  throw new Error("--login-password-env must name one environment variable");
}
if (options.supabaseUrl) {
  validateBrowserPublicKey(options.publicKey, options.publicKeyEnv ?? "--public-key");
}

function origin(value, name, { allowHttp = false } = {}) {
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error(`${name} must be an origin only`);
  }
  if (url.protocol !== "https:" && !(allowHttp && url.protocol === "http:")) {
    throw new Error(`${name} must use ${allowHttp ? "http or https" : "https"}`);
  }
  return url.origin;
}

const baseUrl = options.baseUrl ? origin(options.baseUrl, "--base-url", { allowHttp: true }) : null;
const canonicalOrigin = options.canonicalOrigin
  ? origin(options.canonicalOrigin, "--canonical-origin", { allowHttp: true })
  : baseUrl;
const supabaseUrl = options.supabaseUrl
  ? origin(options.supabaseUrl, "--supabase-url", { allowHttp: true })
  : null;

let checks = 0;
function pass(message) {
  checks += 1;
  console.log(`  ok   ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  pass(message);
}

async function request(url, init = {}) {
  let response;
  try {
    response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      ...init,
    });
  } catch (error) {
    throw new Error(`${url}: ${error.message}`, { cause: error });
  }
  return response;
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] ?? null;
}

function canonicalFrom(html) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (attribute(match[0], "rel")?.toLowerCase() === "canonical") {
      return attribute(match[0], "href");
    }
  }
  return null;
}

function alternateFrom(html, language) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (
      attribute(match[0], "rel")?.toLowerCase() === "alternate" &&
      attribute(match[0], "hreflang")?.toLowerCase() === language.toLowerCase()
    ) {
      return attribute(match[0], "href");
    }
  }
  return null;
}

function metaContent(html, key, value) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (attribute(match[0], key)?.toLowerCase() === value.toLowerCase()) {
      return attribute(match[0], "content");
    }
  }
  return null;
}

function assertStaticSecurityHeaders(response, label) {
  assert(response.headers.get("x-content-type-options") === "nosniff", `${label} sends nosniff`);
  assert(response.headers.get("x-frame-options") === "DENY", `${label} denies framing`);
  assert(
    response.headers.get("referrer-policy") === "strict-origin-when-cross-origin",
    `${label} sends the expected referrer policy`,
  );
  const csp = response.headers.get("content-security-policy") ?? "";
  assert(csp.includes("default-src 'self'") && csp.includes("frame-ancestors 'none'"), `${label} sends the CSP`);
  if (baseUrl.startsWith("https:")) {
    assert(
      response.headers.get("strict-transport-security") === "max-age=31536000",
      `${label} sends scoped HSTS`,
    );
  }
}

async function smokeFrontend() {
  console.log(`frontend smoke: ${baseUrl}`);
  const pageCases = [
    { path: "/", lang: "en", canonical: "/", kind: "home" },
    { path: "/method", lang: "en", canonical: "/method", kind: "method" },
    {
      path: "/debates/nuclear-power",
      lang: "en",
      canonical: "/debates/nuclear-power",
      kind: "debate",
    },
    { path: "/fr", lang: "fr", canonical: "/fr", kind: "home-fr" },
    { path: "/fr/method", lang: "fr", canonical: "/fr/method", kind: "method-fr" },
    {
      path: "/fr/debates/nuclear-power",
      lang: "fr",
      canonical: "/fr/debates/nuclear-power",
      kind: "debate-fr",
    },
  ];

  const titles = new Map();
  let rootHtml = "";
  for (const page of pageCases) {
    const response = await request(`${baseUrl}${page.path}`);
    assert(response.status === 200, `${page.path} returns 200 without a redirect`);
    assert(
      (response.headers.get("content-type") ?? "").includes("text/html"),
      `${page.path} is HTML`,
    );
    if (options.expectCloudflareHeaders) assertStaticSecurityHeaders(response, page.path);
    const html = await response.text();
    if (page.path === "/") rootHtml = html;
    assert(
      new RegExp(`<html\\b[^>]*\\blang=["']${page.lang}["']`, "i").test(html),
      `${page.path} declares lang=${page.lang}`,
    );
    assert(
      canonicalFrom(html) === `${canonicalOrigin}${page.canonical}`,
      `${page.path} has the exact canonical`,
    );
    assert(
      metaContent(html, "property", "og:url") === `${canonicalOrigin}${page.canonical}`,
      `${page.path} has the exact OpenGraph URL`,
    );
    const englishPath = page.lang === "fr"
      ? (page.canonical === "/fr" ? "/" : page.canonical.slice(3))
      : page.canonical;
    const frenchPath = englishPath === "/" ? "/fr" : `/fr${englishPath}`;
    assert(alternateFrom(html, "en") === `${canonicalOrigin}${englishPath}`, `${page.path} links EN hreflang`);
    assert(alternateFrom(html, "fr") === `${canonicalOrigin}${frenchPath}`, `${page.path} links FR hreflang`);
    assert(
      alternateFrom(html, "x-default") === `${canonicalOrigin}${englishPath}`,
      `${page.path} links x-default hreflang`,
    );
    assert(!/https:\/\/(?:[^/]+\.)?parallax\.org\b/i.test(html), `${page.path} does not claim parallax.org`);
    if (page.kind.startsWith("debate")) {
      assert(metaContent(html, "property", "og:type") === "article", `${page.path} is an OpenGraph article`);
    }
    const title = html.match(/<title\b[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
    assert(Boolean(title), `${page.path} has a title`);
    titles.set(page.kind, title);

    if (page.path !== "/") {
      for (const variant of [`${page.path}/`, `${page.path}.html`, `${page.path}/index.html`]) {
        const variantResponse = await request(`${baseUrl}${variant}`);
        assert(variantResponse.status === 307, `${variant} normalizes with a temporary redirect`);
        const location = variantResponse.headers.get("location");
        assert(Boolean(location), `${variant} sends a redirect location`);
        assert(
          new URL(location, baseUrl).href === `${baseUrl}${page.path}`,
          `${variant} redirects to the exact slashless route`,
        );
      }
    }
  }
  assert(titles.get("home") !== titles.get("method"), "English prerendered heads are route-specific");
  assert(titles.get("home-fr") !== titles.get("method-fr"), "French prerendered heads are route-specific");

  for (const missingPath of ["/__parallax_smoke_missing__", "/fr/__parallax_smoke_missing__"]) {
    const response = await request(`${baseUrl}${missingPath}`);
    assert(response.status === 404, `${missingPath} returns a real 404`);
    if (options.expectCloudflareHeaders) assertStaticSecurityHeaders(response, missingPath);
    const html = await response.text();
    assert(
      metaContent(html, "name", "robots")?.toLowerCase() === "noindex,follow",
      `${missingPath} is noindex`,
    );
  }

  const assetPaths = [...rootHtml.matchAll(/(?:src|href)=["']([^"']*\/assets\/[^"']+)["']/gi)]
    .map((match) => match[1]);
  for (const extension of [".js", ".css"]) {
    const assetPath = assetPaths.find((candidate) => new URL(candidate, baseUrl).pathname.endsWith(extension));
    assert(Boolean(assetPath), `root HTML references a hashed ${extension} asset`);
    assert(
      /-[A-Za-z0-9_-]{6,}\.(?:js|css)$/.test(new URL(assetPath, baseUrl).pathname),
      `${extension} asset filename is fingerprinted`,
    );
    const response = await request(new URL(assetPath, baseUrl));
    assert(response.status === 200, `${extension} asset returns 200 without a redirect`);
    const contentType = response.headers.get("content-type") ?? "";
    assert(
      extension === ".js" ? /javascript|ecmascript/.test(contentType) : contentType.includes("text/css"),
      `${extension} asset has the correct MIME type`,
    );
    if (options.expectCloudflareHeaders) {
      const cache = response.headers.get("cache-control") ?? "";
      assert(cache.includes("max-age=31536000") && cache.includes("immutable"), `${extension} asset is immutable`);
      assert(!cache.includes("max-age=0"), `${extension} asset has no conflicting zero-age cache rule`);
    }
  }

  const robotsResponse = await request(`${baseUrl}/robots.txt`);
  assert(robotsResponse.status === 200, "/robots.txt returns 200");
  const robots = await robotsResponse.text();
  assert(
    robots.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`),
    "/robots.txt points to the canonical sitemap",
  );

  const sitemapResponse = await request(`${baseUrl}/sitemap.xml`);
  assert(sitemapResponse.status === 200, "/sitemap.xml returns 200");
  const sitemap = await sitemapResponse.text();
  assert(sitemap.includes(`<loc>${canonicalOrigin}/`), "/sitemap.xml uses the canonical origin");
  assert(!sitemap.includes("parallax.org"), "/sitemap.xml does not claim parallax.org");

  if (options.expectCloudflareHeaders) {
    const rootResponse = await request(`${baseUrl}/`);
    assert(Boolean(rootResponse.headers.get("cf-ray")), "response is served through Cloudflare");
  }
}

async function smokeSupabase() {
  console.log(`Supabase smoke: ${supabaseUrl}`);
  const apiHeaders = { apikey: options.publicKey };

  const health = await request(`${supabaseUrl}/auth/v1/health`, { headers: apiHeaders });
  assert(health.status === 200, "Auth health returns 200");

  const published = await request(
    `${supabaseUrl}/rest/v1/published_debate_fixtures?select=topic_id,slug&limit=10`,
    { headers: { ...apiHeaders, Accept: "application/json" } },
  );
  assert(published.status === 200, "public published-debate REST query returns 200");
  const topics = await published.json();
  assert(Array.isArray(topics) && topics.length > 0, "public REST query returns a non-empty corpus");
  assert(
    topics.every((topic) => typeof topic.topic_id === "string" && typeof topic.slug === "string"),
    "public REST rows have topic_id and slug",
  );

  const edgeCases = [
    {
      slug: "analyze-seed",
      body: {
        seed_packet_id: "00000000-0000-0000-0000-000000000999",
        provider: "mock",
      },
      allowedStatus: 404,
      allowedError: "seed_packet_not_found",
    },
    {
      slug: "capture-source",
      body: {},
      allowedStatus: 422,
      allowedError: "invalid_capture_request",
    },
  ];

  for (const edgeCase of edgeCases) {
    const anonymousEdge = await request(`${supabaseUrl}/functions/v1/${edgeCase.slug}`, {
      method: "POST",
      headers: { ...apiHeaders, "content-type": "application/json" },
      body: JSON.stringify(edgeCase.body),
    });
    assert(
      anonymousEdge.status === 401,
      `${edgeCase.slug} rejects a request without a user JWT`,
    );
  }

  if (authenticatedOptions.every(Boolean)) {
    const allowedOrigin = origin(options.allowedOrigin, "--allowed-origin", { allowHttp: true });
    const deniedOrigin = origin(options.deniedOrigin, "--denied-origin", { allowHttp: true });
    assert(allowedOrigin !== deniedOrigin, "allowed and denied CORS origins are distinct");
    const password = process.env[options.loginPasswordEnv];
    assert(Boolean(password), `${options.loginPasswordEnv} supplies the login password`);

    const login = await request(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { ...apiHeaders, "content-type": "application/json" },
      body: JSON.stringify({ email: options.loginEmail, password }),
    });
    assert(login.status === 200, "seed user login returns 200");
    const loginBody = await login.json();
    const accessToken = loginBody?.access_token;
    assert(
      typeof accessToken === "string" && accessToken.length > 20,
      "seed user login returns an access token",
    );
    const authenticatedHeaders = {
      ...apiHeaders,
      authorization: `Bearer ${accessToken}`,
    };
    const preflightHeaders = (requestOrigin) => ({
      origin: requestOrigin,
      "access-control-request-method": "POST",
      "access-control-request-headers": "authorization, apikey, content-type",
    });

    for (const edgeCase of edgeCases) {
      const endpoint = `${supabaseUrl}/functions/v1/${edgeCase.slug}`;
      const allowedPreflight = await request(endpoint, {
        method: "OPTIONS",
        headers: preflightHeaders(allowedOrigin),
      });
      assert(
        allowedPreflight.status === 200 || allowedPreflight.status === 204,
        `${edgeCase.slug} accepts an allowed browser preflight at the gateway or handler`,
      );
      const allowedPreflightOrigin = allowedPreflight.headers.get("access-control-allow-origin");
      assert(
        allowedPreflightOrigin === allowedOrigin || allowedPreflightOrigin === "*",
        `${edgeCase.slug} allowed preflight grants the requested origin`,
      );
      const allowedMethods = (allowedPreflight.headers.get("access-control-allow-methods") ?? "")
        .toUpperCase();
      assert(
        allowedMethods.includes("POST") && allowedMethods.includes("OPTIONS"),
        `${edgeCase.slug} preflight permits POST and OPTIONS`,
      );
      const allowedHeaders = (allowedPreflight.headers.get("access-control-allow-headers") ?? "")
        .toLowerCase();
      assert(
        ["authorization", "apikey", "content-type"].every((header) =>
          allowedHeaders.includes(header)
        ),
        `${edgeCase.slug} preflight permits the required request headers`,
      );
      if (allowedPreflightOrigin === allowedOrigin) {
        assert(
          (allowedPreflight.headers.get("vary") ?? "").toLowerCase().split(",")
            .some((value) => value.trim() === "origin"),
          `${edgeCase.slug} handler-owned preflight varies by Origin`,
        );
      } else {
        pass(`${edgeCase.slug} gateway-owned wildcard preflight is classified separately`);
      }

      const deniedPreflight = await request(endpoint, {
        method: "OPTIONS",
        headers: preflightHeaders(deniedOrigin),
      });
      if (deniedPreflight.status === 403) {
        assert(
          !deniedPreflight.headers.has("access-control-allow-origin"),
          `${edgeCase.slug} handler-owned denied preflight grants no origin`,
        );
        const deniedPreflightBody = await deniedPreflight.json();
        assert(
          deniedPreflightBody?.error === "cors_origin_denied" &&
            typeof deniedPreflightBody?.request_id === "string" &&
            deniedPreflightBody.request_id.length > 0,
          `${edgeCase.slug} denied preflight is structured and request-correlated`,
        );
      } else {
        assert(
          (deniedPreflight.status === 200 || deniedPreflight.status === 204) &&
            deniedPreflight.headers.get("access-control-allow-origin") === "*",
          `${edgeCase.slug} gateway-owned preflight is explicitly origin-agnostic`,
        );
      }

      const deniedPost = await request(endpoint, {
        method: "POST",
        headers: {
          ...authenticatedHeaders,
          origin: deniedOrigin,
          "content-type": "application/json",
        },
        body: JSON.stringify(edgeCase.body),
      });
      assert(
        deniedPost.status === 403,
        `${edgeCase.slug} denied-origin POST reaches the Edge handler`,
      );
      assert(
        !deniedPost.headers.has("access-control-allow-origin"),
        `${edgeCase.slug} denied handler response grants no origin`,
      );
      const deniedPostBody = await deniedPost.json();
      assert(
        deniedPostBody?.error === "cors_origin_denied" &&
          typeof deniedPostBody?.request_id === "string" &&
          deniedPostBody.request_id.length > 0,
        `${edgeCase.slug} denied handler response is structured and request-correlated`,
      );

      const allowedPost = await request(endpoint, {
        method: "POST",
        headers: {
          ...authenticatedHeaders,
          origin: allowedOrigin,
          "content-type": "application/json",
        },
        body: JSON.stringify(edgeCase.body),
      });
      assert(
        allowedPost.status === edgeCase.allowedStatus,
        `${edgeCase.slug} authenticated read-only probe reaches the Edge handler`,
      );
      assert(
        allowedPost.headers.get("access-control-allow-origin") === allowedOrigin,
        `${edgeCase.slug} authenticated response echoes the allowed origin`,
      );
      const allowedPostBody = await allowedPost.json();
      assert(
        allowedPostBody?.error === edgeCase.allowedError &&
          typeof allowedPostBody?.request_id === "string" &&
          allowedPostBody.request_id.length > 0,
        `${edgeCase.slug} authenticated probe is structured and request-correlated`,
      );
    }
  }
}

if (baseUrl) await smokeFrontend();
if (supabaseUrl) await smokeSupabase();
console.log(`smoke-http: ${checks} checks passed`);
