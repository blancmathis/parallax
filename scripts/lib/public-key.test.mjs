import assert from "node:assert/strict";
import test from "node:test";

import { validateBrowserPublicKey } from "./public-key.mjs";

function unsignedJwt(payload) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

test("accepts only documented browser-safe Supabase key forms", () => {
  const publishable = "sb_publishable_1234567890abcdefghijklmnop";
  const anonJwt = unsignedJwt({ role: "anon" });

  assert.equal(validateBrowserPublicKey(publishable), publishable);
  assert.equal(validateBrowserPublicKey(anonJwt), anonJwt);
});

test("rejects placeholders, secret keys, and privileged JWTs", () => {
  assert.throws(
    () => validateBrowserPublicKey("replace-with-the-local-publishable-or-anon-key"),
    /sb_publishable_ key or a legacy Supabase anon JWT/,
  );
  assert.throws(
    () => validateBrowserPublicKey("sb_secret_1234567890abcdefghijklmnop"),
    /secret or unsupported key type/,
  );
  assert.throws(
    () => validateBrowserPublicKey(unsignedJwt({ role: "service_role" })),
    /anon role/,
  );
});
