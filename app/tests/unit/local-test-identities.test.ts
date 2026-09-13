import { describe, expect, it } from "vitest";
import { localTestIdentityHelp } from "../../src/lib/localTestIdentities";

describe("local test identity help", () => {
  it("is disabled unless the explicit local development opt-in is present", () => {
    expect(localTestIdentityHelp).toBeNull();
  });
});
