import { describe, expect, it } from "vitest";
import {
  authCopy,
  authPasswordMeetsPolicy,
  MIN_AUTH_PASSWORD_LENGTH,
} from "../../src/features/auth/model";

describe("auth form model", () => {
  it("matches the 12-character mixed-character Supabase password policy", () => {
    expect(MIN_AUTH_PASSWORD_LENGTH).toBe(12);
    expect(authPasswordMeetsPolicy("Parallax123!")).toBe(true);
    expect(authPasswordMeetsPolicy("Short1!a")).toBe(false);
    expect(authPasswordMeetsPolicy("alllowercase1!")).toBe(false);
    expect(authPasswordMeetsPolicy("ALLUPPERCASE1!")).toBe(false);
    expect(authPasswordMeetsPolicy("NoDigitsHere!")).toBe(false);
    expect(authPasswordMeetsPolicy("NoSymbolHere1")).toBe(false);
  });

  it("keeps signup confirmation and reset messages anti-enumerating in EN and FR", () => {
    expect(authCopy("en").confirmationRequired).toMatch(/^If this address/);
    expect(authCopy("en").resetRequested).toMatch(/^If an account exists/);
    expect(authCopy("fr").confirmationRequired).toMatch(/^Si cette adresse/);
    expect(authCopy("fr").resetRequested).toMatch(/^Si un compte correspond/);
  });
});
