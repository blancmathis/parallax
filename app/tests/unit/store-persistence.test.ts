import { beforeEach, describe, expect, it, vi } from "vitest";

const STORE_KEY = "parallax.store.v1";

describe("local store hydration", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("falls back to an empty state when persisted JSON is corrupted", async () => {
    localStorage.setItem(STORE_KEY, "{not-valid-json");

    const { getState } = await import("../../src/lib/store");

    expect(getState()).toEqual({
      contributions: [],
      reviews: [],
      extra_audit: [],
      revision_bumps: {},
    });
  });

  it("normalizes malformed persisted collections and revision counters", async () => {
    const contribution = {
      id: "ctb_persisted",
      topic_id: "topic_congestion_pricing",
      type: "new_claim",
      body: "A persisted object.",
      status: "submitted",
      created_by: "visitor_demo",
      created_at: "2026-08-30T12:00:00Z",
    };
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        contributions: [contribution, null, 42, "invalid"],
        reviews: "not-an-array",
        extra_audit: [{ id: "record_survives_shallow_normalization" }, []],
        revision_bumps: {
          topic_congestion_pricing: 2,
          "": 1,
          negative: -1,
          fractional: 1.5,
          string_value: "3",
        },
      }),
    );

    const { getState } = await import("../../src/lib/store");

    expect(getState()).toEqual({
      contributions: [contribution],
      reviews: [],
      extra_audit: [{ id: "record_survives_shallow_normalization" }],
      revision_bumps: { topic_congestion_pricing: 2 },
    });
  });
});
