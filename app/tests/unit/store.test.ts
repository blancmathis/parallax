import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  REVIEW_RATIONALE_MIN_LENGTH,
  acceptedFor,
  contributionLabel,
  getState,
  pendingFor,
  resetDemoData,
  reviewOf,
  reviewContribution,
  submitContribution,
  subscribe,
  useStore,
  type StoreState,
} from "../../src/lib/store";
import type { Contribution } from "../../src/types";

const STORE_KEY = "parallax.store.v1";

function submittedContribution(
  overrides: Partial<Contribution> = {},
): Contribution {
  return {
    id: "ctb_cross_tab",
    topic_id: "topic_congestion_pricing",
    type: "new_claim",
    body: "A testable contribution with enough detail.",
    status: "submitted",
    created_by: "visitor_remote",
    created_at: "2026-08-30T12:00:00.000Z",
    ...overrides,
  };
}

describe("local contribution store", () => {
  beforeEach(() => {
    resetDemoData();
    localStorage.clear();
  });

  it("submits, persists, audits, and notifies a contribution", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    const contribution = submitContribution({
      topic_id: "topic_congestion_pricing",
      type: "new_claim",
      body: "The policy changes peak-hour traffic volumes.",
    });

    expect(contribution).toMatchObject({
      topic_id: "topic_congestion_pricing",
      type: "new_claim",
      status: "submitted",
      created_by: "visitor_demo",
    });
    expect(contribution.id).toMatch(/^ctb_/);
    expect(getState().contributions).toEqual([contribution]);
    expect(getState().extra_audit).toHaveLength(1);
    expect(getState().extra_audit[0]).toMatchObject({
      topic_id: contribution.topic_id,
      event_type: "contribution_submitted",
      actor_type: "user",
    });
    expect(JSON.parse(localStorage.getItem(STORE_KEY) ?? "null")).toEqual(
      getState(),
    );
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
  });

  it.each([
    ["empty", ""],
    ["blank", "   "],
    [
      "short after trimming",
      `  ${"x".repeat(REVIEW_RATIONALE_MIN_LENGTH - 1)}  `,
    ],
  ])(
    "refuses a review whose rationale is $0 without mutating state",
    (_label, rationale) => {
      const contribution = submitContribution({
        topic_id: "topic_congestion_pricing",
        type: "new_source",
        body: "An additional source for the reviewed claim.",
        url: "https://example.com/source",
      });
      const before = structuredClone(getState());
      const listener = vi.fn();
      const unsubscribe = subscribe(listener);

      const accepted = reviewContribution(
        contribution.id,
        "approve",
        rationale,
      );

      expect(accepted).toBe(false);
      expect(getState()).toEqual(before);
      expect(listener).not.toHaveBeenCalled();

      unsubscribe();
    },
  );

  it("accepts exactly the minimum trimmed rationale and cannot decide twice", () => {
    const contribution = submitContribution({
      topic_id: "topic_congestion_pricing",
      type: "new_claim",
      body: "A claim ready for review.",
    });
    const rationale = "x".repeat(REVIEW_RATIONALE_MIN_LENGTH);

    expect(
      reviewContribution(contribution.id, "approve", `  ${rationale}  `),
    ).toBe(true);
    expect(getState().contributions[0].status).toBe("accepted");
    expect(getState().reviews).toHaveLength(1);
    expect(getState().reviews[0].rationale).toBe(rationale);
    expect(getState().revision_bumps).toEqual({
      topic_congestion_pricing: 1,
    });

    const afterFirstDecision = structuredClone(getState());
    expect(
      reviewContribution(contribution.id, "reject", "A later duplicate review"),
    ).toBe(false);
    expect(getState()).toEqual(afterFirstDecision);
  });

  it("records rejection without a revision bump and exposes workflow selectors", () => {
    const accepted = submitContribution({
      topic_id: "topic_congestion_pricing",
      type: "new_claim",
      body: "A contribution that will be accepted.",
    });
    const pending = submitContribution({
      topic_id: "topic_congestion_pricing",
      type: "new_source",
      body: "A contribution that remains pending.",
    });
    const rejected = submitContribution({
      topic_id: "topic_nuclear_power",
      type: "challenge_steelman",
      body: "A contribution that will be rejected.",
    });

    expect(
      reviewContribution(accepted.id, "approve", "Evidence is sufficient."),
    ).toBe(true);
    expect(
      reviewContribution(rejected.id, "reject", "The target is not precise."),
    ).toBe(true);

    const current = getState();
    expect(pendingFor(current)).toEqual([pending]);
    expect(pendingFor(current, "topic_congestion_pricing")).toEqual([pending]);
    expect(pendingFor(current, "topic_nuclear_power")).toEqual([]);
    expect(acceptedFor(current, "topic_congestion_pricing")).toEqual([
      expect.objectContaining({ id: accepted.id, status: "accepted" }),
    ]);
    expect(reviewOf(current, rejected.id)).toMatchObject({
      target_object_id: rejected.id,
      decision: "reject",
    });
    expect(reviewOf(current, "missing_contribution")).toBeUndefined();
    expect(current.revision_bumps).toEqual({ topic_congestion_pricing: 1 });
  });

  it.each([
    ["new_claim", "new claim"],
    ["new_source", "new source"],
    ["new_position", "new position"],
    ["challenge_evidence_label", "evidence label challenge"],
    ["challenge_steelman", "steelman challenge"],
    ["value_tradeoff_correction", "value/tradeoff correction"],
  ] as const)("labels contribution type %s", (type, label) => {
    expect(contributionLabel(type)).toBe(label);
  });

  it("updates React subscribers when a contribution is submitted", () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      submitContribution({
        topic_id: "topic_nuclear_power",
        type: "new_position",
        title: "Conditional expansion",
        body: "Expand only where delivery and waste conditions are met.",
      });
    });

    expect(result.current.contributions).toHaveLength(1);
    expect(result.current.contributions[0]).toMatchObject({
      topic_id: "topic_nuclear_power",
      type: "new_position",
    });
  });

  it("replaces in-memory state from a same-key storage event", () => {
    const { result } = renderHook(() => useStore());
    const next: StoreState = {
      contributions: [submittedContribution()],
      reviews: [],
      extra_audit: [],
      revision_bumps: { topic_congestion_pricing: 2 },
    };

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORE_KEY,
          newValue: JSON.stringify(next),
          storageArea: localStorage,
        }),
      );
    });

    expect(result.current).toEqual(next);
  });

  it("ignores unrelated storage events and resets on corrupt same-key data", () => {
    const contribution = submitContribution({
      topic_id: "topic_smartphones_schools",
      type: "challenge_steelman",
      target_object_id: "pos_a",
      body: "The current steelman omits a material implementation constraint.",
    });
    const before = structuredClone(getState());
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "another.application.key",
        newValue: JSON.stringify({ contributions: [] }),
      }),
    );
    expect(getState()).toEqual(before);
    expect(getState().contributions[0].id).toBe(contribution.id);
    expect(listener).not.toHaveBeenCalled();

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORE_KEY,
        newValue: "{not-json",
      }),
    );
    expect(getState()).toEqual({
      contributions: [],
      reviews: [],
      extra_audit: [],
      revision_bumps: {},
    });
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
  });
});
