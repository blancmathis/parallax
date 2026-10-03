import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const config = readFileSync(
  resolve(process.cwd(), "../supabase/config.toml"),
  "utf8",
);

describe("local auth configuration", () => {
  it("allowlists only the localized recovery routes on tested local origins", () => {
    const block = config.match(/additional_redirect_urls\s*=\s*\[([\s\S]*?)\]/)?.[1];
    expect(block).toBeDefined();
    const urls = [...(block ?? "").matchAll(/"([^"]+)"/g)]
      .map((match) => match[1])
      .sort();

    expect(urls).toEqual([
      "http://127.0.0.1:4173/fr/you",
      "http://127.0.0.1:4173/you",
      "http://127.0.0.1:5173/fr/you",
      "http://127.0.0.1:5173/you",
      "http://localhost:4173/fr/you",
      "http://localhost:4173/you",
      "http://localhost:5173/fr/you",
      "http://localhost:5173/you",
    ]);
  });

  it("keeps the local password contract aligned with the public form", () => {
    expect(config).toMatch(/minimum_password_length\s*=\s*12/);
    expect(config).toMatch(
      /password_requirements\s*=\s*"lower_upper_letters_digits_symbols"/,
    );
  });

  it("makes the deployable build fail closed on the local identity opt-in", () => {
    const result = spawnSync("bash", ["../scripts/build-frontend.sh"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, VITE_LOCAL_TEST_IDENTITIES: "1" },
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "VITE_LOCAL_TEST_IDENTITIES=1 is local-only and must never be used for a deployable build",
    );
  });
});
