import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST_ASSETS = new URL("../dist/assets/", import.meta.url);
const BUDGETS = {
  ".js": {
    largestBytes: 700_000,
    largestGzipBytes: 190_000,
    totalGzipBytes: 310_000,
  },
  ".css": {
    largestBytes: 130_000,
    largestGzipBytes: 22_000,
    totalGzipBytes: 22_000,
  },
};

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const assetDirectory = DIST_ASSETS.pathname;
const files = walk(assetDirectory);
let failures = 0;

for (const [extension, budget] of Object.entries(BUDGETS)) {
  const measured = files
    .filter((file) => extname(file) === extension)
    .map((file) => {
      const contents = readFileSync(file);
      return {
        file,
        bytes: statSync(file).size,
        gzipBytes: gzipSync(contents).byteLength,
      };
    });

  if (measured.length === 0) {
    console.error(`[bundle-budget] no ${extension} assets found in app/dist/assets`);
    failures += 1;
    continue;
  }

  const largest = measured.reduce((current, item) =>
    item.bytes > current.bytes ? item : current,
  );
  const largestGzip = measured.reduce((current, item) =>
    item.gzipBytes > current.gzipBytes ? item : current,
  );
  const totalGzipBytes = measured.reduce((sum, item) => sum + item.gzipBytes, 0);

  const checks = [
    ["largest raw", largest.bytes, budget.largestBytes],
    ["largest gzip", largestGzip.gzipBytes, budget.largestGzipBytes],
    ["total gzip", totalGzipBytes, budget.totalGzipBytes],
  ];

  for (const [label, actual, limit] of checks) {
    const ok = actual <= limit;
    console.log(
      `[bundle-budget] ${ok ? "ok" : "FAIL"} ${extension} ${label}: ${actual} / ${limit} bytes`,
    );
    if (!ok) failures += 1;
  }
}

if (failures > 0) process.exit(1);
