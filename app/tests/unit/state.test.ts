import { describe, expect, it } from "vitest";
import { DEBATES } from "../../src/data";
import {
  claimSharedBy,
  claimState,
  debateShape,
} from "../../src/data/state";
import type {
  Claim,
  ClaimType,
  DebateFixture,
  EvidenceLabel,
} from "../../src/types";

function scenario(
  claimTypes: ClaimType[],
  label?: EvidenceLabel,
  id = "claim_under_test",
): { debate: DebateFixture; claim: Claim } {
  const base = structuredClone(DEBATES[0]);
  const claim: Claim = {
    ...base.claims[0],
    id,
    claim_type: claimTypes,
    evidence_link_ids: label ? [`evidence_for_${id}`] : [],
    review_status: "approved",
  };
  const evidence = label
    ? [
        {
          ...base.evidence_links[0],
          id: `evidence_for_${id}`,
          claim_id: id,
          label,
        },
      ]
    : [];
  return {
    claim,
    debate: { ...base, claims: [claim], evidence_links: evidence },
  };
}

describe("claimState epistemic contract", () => {
  it("treats normative as dominant in a mixed factual/normative claim", () => {
    const { debate, claim } = scenario(
      ["factual", "normative"],
      "supports_claim",
    );

    expect(
      claimState(debate, claim),
    ).toBe("values");
  });

  it.each([
    "supports_claim",
    "partially_supports_claim",
  ] satisfies EvidenceLabel[])(
    "does not establish a factual claim from %s without an explicit evaluation",
    (label) => {
      const { debate, claim } = scenario(["factual"], label);

      expect(claimState(debate, claim)).toBe("provisional");
    },
  );

  it("keeps a mixed factual/causal claim provisional without an evaluation", () => {
    const { debate, claim } = scenario(
      ["factual", "causal"],
      "supports_claim",
    );

    expect(claimState(debate, claim)).toBe("provisional");
  });

  it.each(["contested", "rejected"] as const)(
    "keeps a %s claim contested without an evaluation",
    (reviewStatus) => {
      const { debate, claim } = scenario(["factual"], "supports_claim");
      claim.review_status = reviewStatus;

      expect(claimState(debate, claim)).toBe("contested");
    },
  );

  it("keeps every seed claim visibly unreviewed without calling it contested", () => {
    for (const debate of DEBATES) {
      const shape = debateShape(debate);
      expect(shape.established).toBe(0);
      expect(shape.contested).toBe(0);
      expect(shape.total).toBe(debate.claims.length);

      for (const claim of debate.claims) {
        expect(claim.review_status).toBe("unreviewed");
        expect(claimState(debate, claim)).toBe(
          claim.claim_type.includes("normative") ? "values" : "provisional",
        );
      }
    }
  });


});

describe("claimSharedBy", () => {
  it("returns sorted, deduplicated letters only for cross-position claims", () => {
    const debate = structuredClone(DEBATES[0]);
    const [first, second, third] = debate.positions;
    const template = debate.arguments[0];
    debate.arguments = [
      {
        ...template,
        id: "arg_second",
        position_id: second.id,
        claim_ids: ["shared_claim", "single_claim", "shared_claim"],
      },
      {
        ...template,
        id: "arg_first",
        position_id: first.id,
        claim_ids: ["shared_claim"],
      },
      {
        ...template,
        id: "arg_third",
        position_id: third.id,
        claim_ids: ["third_only"],
      },
      {
        ...template,
        id: "arg_orphan",
        position_id: "missing_position",
        claim_ids: ["shared_claim"],
      },
    ];

    expect(claimSharedBy(debate)).toEqual(
      new Map([["shared_claim", ["A", "B"]]]),
    );
  });
});
