#!/usr/bin/env node

import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
let root = resolve(repositoryRoot, "app/dist");
let port = 8788;

function usage() {
  console.log(`Usage: node scripts/serve-dist.mjs [--root DIRECTORY] [--port PORT]

Serves a built static directory with asset-first flat-HTML lookup, Cloudflare's
default slashless HTML normalization, and a real top-level 404. This local
harness does not emulate _redirects, _headers, cache, TLS, or edge behavior.`);
}

for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  switch (argument) {
    case "--root":
      root = resolve(process.argv[++index] ?? "");
      break;
    case "--port":
      port = Number(process.argv[++index]);
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

if (!Number.isInteger(port) || port < 1024 || port > 65_535) {
  throw new Error("--port must be an integer from 1024 through 65535");
}
if (!existsSync(root) || !statSync(root).isDirectory()) {
  throw new Error(`Static root does not exist: ${root}`);
}
if (!existsSync(resolve(root, "index.html")) || !existsSync(resolve(root, "404.html"))) {
  throw new Error("Static root must contain index.html and 404.html");
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function existingFile(relative) {
  const candidate = resolve(root, relative);
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) return null;
  return existsSync(candidate) && statSync(candidate).isFile() ? candidate : null;
}

function flatHtmlFor(pathname) {
  if (pathname === "/") return existingFile("index.html");
  return existingFile(`.${pathname}.html`);
}

function canonicalRedirect(pathname) {
  if (pathname === "/") return null;

  let canonical = null;
  if (pathname.endsWith("/index.html")) {
    canonical = pathname.slice(0, -"/index.html".length) || "/";
  } else if (pathname.endsWith("/index")) {
    canonical = pathname.slice(0, -"/index".length) || "/";
  } else if (pathname.endsWith(".html")) {
    canonical = pathname.slice(0, -".html".length) || "/";
  } else if (pathname.endsWith("/")) {
    canonical = pathname.replace(/\/+$/, "") || "/";
  }

  return canonical && flatHtmlFor(canonical) ? canonical : null;
}

function resolveRequest(pathname) {
  if (pathname === "/_headers" || pathname === "/_redirects") return null;
  return flatHtmlFor(pathname) ?? existingFile(pathname === "/" ? "index.html" : `.${pathname}`);
}

const server = createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://local").pathname);
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }

  const redirect = canonicalRedirect(pathname);
  if (redirect) {
    response.writeHead(307, { location: redirect });
    response.end();
    return;
  }

  let file = resolveRequest(pathname);
  const status = file ? 200 : 404;
  file ??= resolve(root, "404.html");
  const body = readFileSync(file);
  response.writeHead(status, {
    "content-length": body.byteLength,
    "content-type": contentTypes[extname(file)] ?? "application/octet-stream",
  });
  response.end(request.method === "HEAD" ? undefined : body);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`serve-dist: ${root}`);
  console.log(`serve-dist: http://127.0.0.1:${port}`);
  console.log("serve-dist: local HTML-routing harness only; a real Cloudflare preview remains mandatory");
});
