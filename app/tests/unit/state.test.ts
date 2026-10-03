import { describe, expect, it } from "vitest";
import { DEBATES } from "../../src/data";
import {
  claimSharedBy,
  claimState,
  debateShape,
  type ClaimState,
} from "../../src/data/state";
import type {
  Claim,
  ClaimEvaluation,
  ClaimType,
  DebateFixture,
  EvidenceLabel,
  SourceAssessment,
} from "../../src/types";
import { sourceKey } from "../../src/lib/sourceKey";

const ARTIFACT_HASH = `sha256:${"a".repeat(64)}`;

function bridgedEstablishment(claimId: string): ClaimEvaluation {
  return {
    claim_id: claimId,
    state: "established",
    rationale: "Derived from a qualifying cross-camp bridge.",
    evaluated_at: "2026-08-30T12:00:00.000Z",
    is_demo: false,
    bridged: true,
    bridge_status: "bridged_established",
    camp_count: 2,
    endorser_band: "5to19",
  };
}

function confirmedAssessment(
  sourceKeyValue: string,
  overrides: Partial<SourceAssessment> = {},
): SourceAssessment {
  return {
    source_key: sourceKeyValue,
    content_hash: ARTIFACT_HASH,
    assessment_state: "confirmed",
    floor_verdict: "meets_floor",
    rule_id: "no_floor_rule",
    is_demo: false,
    attributes: {
      content_genre: "primary",
      editorial_accountability: "named_masthead",
      correction_policy: "documented",
      fabrication_record: "none_known",
      independence: "independent",
      expertise_basis: "domain_expert",
      identity_basis: "verified",
      sensitive_domain: "none",
    },
    ...overrides,
  };
}

function makeEvidenceInspectable(
  debate: DebateFixture,
  claim: Claim,
): Map<string, SourceAssessment> {
  const link = debate.evidence_links.find((item) => item.claim_id === claim.id);
  if (!link) throw new Error("Fixture precondition: evidence link missing.");
  const source = debate.sources.find((item) => item.id === link.source_id);
  if (!source) throw new Error("Fixture precondition: source missing.");

  link.review_status = "approved";
  link.assessment_state = "assessed";
  link.rationale = "The quoted passage directly supports this relation.";
  link.source_excerpt_id = `excerpt_for_${claim.id}`;
  source.retrieval_status = "found";
  source.retrieved_at = "2026-08-30T12:00:00.000Z";
  source.content_hash = ARTIFACT_HASH;
  debate.source_excerpts = [
    ...(debate.source_excerpts ?? []).filter(
      (item) => item.id !== link.source_excerpt_id,
    ),
    {
      id: link.source_excerpt_id,
      source_id: source.id,
      text: "An exact and inspectable passage from the captured artefact.",
      locator: "section 2, paragraph 4",
      extracted_by: "human",
    },
  ];

  return new Map([
    [sourceKey(source.url), confirmedAssessment(sourceKey(source.url))],
  ]);
}

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
  it.each([
    "established",
    "contested",
    "provisional",
    "values",
  ] satisfies ClaimState[])(
    "keeps a normative claim in values even when its explicit evaluation is %s",
    (evaluatedState) => {
      const { debate, claim } = scenario(["normative"], "supports_claim");

      expect(
        claimState(debate, claim, new Map([[claim.id, evaluatedState]])),
      ).toBe("values");
    },
  );

  it("treats normative as dominant in a mixed factual/normative claim", () => {
    const { debate, claim } = scenario(
      ["factual", "normative"],
      "supports_claim",
    );

    expect(
      claimState(debate, claim, new Map([[claim.id, "established"]])),
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

  it("does not trust a state-only established evaluation, even with inspectable evidence", () => {
    const { debate, claim } = scenario(["factual"], "supports_claim");
    const assessments = makeEvidenceInspectable(debate, claim);

    expect(
      claimState(
        debate,
        claim,
        new Map([[claim.id, "established"]]),
        assessments,
      ),
    ).toBe("provisional");
  });

  it("establishes only from a dated inter-camp bridge plus assessed, inspectable, above-floor evidence", () => {
    const { debate, claim } = scenario(["factual"], "supports_claim");
    const assessments = makeEvidenceInspectable(debate, claim);

    expect(
      claimState(
        debate,
        claim,
        new Map([[claim.id, bridgedEstablishment(claim.id)]]),
        assessments,
      ),
    ).toBe("established");
  });

  it.each(["missing", "blocked", "failed"] as const)(
    "keeps a bridged claim provisional when retrieval is %s",
    (retrievalStatus) => {
      const { debate, claim } = scenario(["factual"], "supports_claim");
      const assessments = makeEvidenceInspectable(debate, claim);
      const source = debate.sources.find(
        (item) => item.id === debate.evidence_links[0].source_id,
      );
      if (!source) throw new Error("Fixture precondition: source missing.");
      source.retrieval_status = retrievalStatus;

      expect(
        claimState(
          debate,
          claim,
          new Map([[claim.id, bridgedEstablishment(claim.id)]]),
          assessments,
        ),
      ).toBe("provisional");
    },
  );

  it("accepts a partial capture when its hash, retrieval date and excerpt remain inspectable", () => {
    const { debate, claim } = scenario(["factual"], "supports_claim");
    const assessments = makeEvidenceInspectable(debate, claim);
    const source = debate.sources.find(
      (item) => item.id === debate.evidence_links[0].source_id,
    );
    if (!source) throw new Error("Fixture precondition: source missing.");
    source.retrieval_status = "partial";

    expect(
      claimState(
        debate,
        claim,
        new Map([[claim.id, bridgedEstablishment(claim.id)]]),
        assessments,
      ),
    ).toBe("established");
  });

  it("requires the claim itself to be approved before establishment", () => {
    const { debate, claim } = scenario(["factual"], "supports_claim");
    const assessments = makeEvidenceInspectable(debate, claim);
    claim.review_status = "unreviewed";

    expect(
      claimState(
        debate,
        claim,
        new Map([[claim.id, bridgedEstablishment(claim.id)]]),
        assessments,
      ),
    ).toBe("provisional");
  });

  it("does not establish evidence whose source reference is missing", () => {
    const { debate, claim } = scenario(["factual"], "supports_claim");
    const assessments = makeEvidenceInspectable(debate, claim);
    debate.evidence_links[0].source_id = "missing_source";

    expect(
      claimState(
        debate,
        claim,
        new Map([[claim.id, bridgedEstablishment(claim.id)]]),
        assessments,
      ),
    ).toBe("provisional");
  });

  it.each([
    ["legacy/missing", undefined],
    ["legacy_unverified", "legacy_unverified"],
    ["pending_review", "pending_review"],
    ["inconclusive", "inconclusive"],
  ] as const)(
    "keeps a bridged claim provisional for a %s evidence assessment",
    (_label, assessmentState) => {
      const { debate, claim } = scenario(["factual"], "supports_claim");
      const assessments = makeEvidenceInspectable(debate, claim);
      debate.evidence_links[0].assessment_state = assessmentState;

      expect(
        claimState(
          debate,
          claim,
          new Map([[claim.id, bridgedEstablishment(claim.id)]]),
          assessments,
        ),
      ).toBe("provisional");
    },
  );

  it("requires an approved link with a bounded rationale", () => {
    const variants = [
      (debate: DebateFixture) => {
        debate.evidence_links[0].review_status = "unreviewed";
      },
      (debate: DebateFixture) => {
        debate.evidence_links[0].rationale = "short";
      },
    ];

    for (const mutate of variants) {
      const { debate, claim } = scenario(["factual"], "supports_claim");
      const assessments = makeEvidenceInspectable(debate, claim);
      mutate(debate);

      expect(
        claimState(
          debate,
          claim,
          new Map([[claim.id, bridgedEstablishment(claim.id)]]),
          assessments,
        ),
      ).toBe("provisional");
    }
  });

  it.each([
    "unassessed",
    "stale",
    "legacy_unverified",
    "pending_review",
  ] as const)(
    "keeps a bridged claim provisional when the source assessment is %s",
    (assessmentState) => {
      const { debate, claim } = scenario(["factual"], "supports_claim");
      const assessments = makeEvidenceInspectable(debate, claim);
      const key = [...assessments.keys()][0];
      assessments.set(
        key,
        confirmedAssessment(key, { assessment_state: assessmentState }),
      );

      expect(
        claimState(
          debate,
          claim,
          new Map([[claim.id, bridgedEstablishment(claim.id)]]),
          assessments,
        ),
      ).toBe("provisional");
    },
  );

  it.each(["unknown", "below_floor"] as const)(
    "keeps a bridged claim provisional when the source floor is %s",
    (floorVerdict) => {
      const { debate, claim } = scenario(["factual"], "supports_claim");
      const assessments = makeEvidenceInspectable(debate, claim);
      const key = [...assessments.keys()][0];
      assessments.set(
        key,
        confirmedAssessment(key, { floor_verdict: floorVerdict }),
      );

      expect(
        claimState(
          debate,
          claim,
          new Map([[claim.id, bridgedEstablishment(claim.id)]]),
          assessments,
        ),
      ).toBe("provisional");
    },
  );

  it("keeps missing, stale-hash and non-inspectable source proof provisional", () => {
    const variants = [
      (debate: DebateFixture, assessments: Map<string, SourceAssessment>) => {
        const source = debate.sources.find(
          (item) => item.id === debate.evidence_links[0].source_id,
        );
        if (!source) throw new Error("Fixture precondition: source missing.");
        source.content_hash = null;
        return assessments;
      },
      (_debate: DebateFixture, assessments: Map<string, SourceAssessment>) => {
        const key = [...assessments.keys()][0];
        assessments.set(
          key,
          confirmedAssessment(key, {
            content_hash: `sha256:${"b".repeat(64)}`,
          }),
        );
        return assessments;
      },
      (debate: DebateFixture, assessments: Map<string, SourceAssessment>) => {
        const source = debate.sources.find(
          (item) => item.id === debate.evidence_links[0].source_id,
        );
        if (!source) throw new Error("Fixture precondition: source missing.");
        source.retrieved_at = "";
        return assessments;
      },
      (debate: DebateFixture, assessments: Map<string, SourceAssessment>) => {
        debate.source_excerpts = [];
        return assessments;
      },
    ];

    for (const mutate of variants) {
      const { debate, claim } = scenario(["factual"], "supports_claim");
      const assessments = mutate(
        debate,
        makeEvidenceInspectable(debate, claim),
      );
      expect(
        claimState(
          debate,
          claim,
          new Map([[claim.id, bridgedEstablishment(claim.id)]]),
          assessments,
        ),
      ).toBe("provisional");
    }
  });

  it("requires the full, public bridge proof instead of an arbitrary established object", () => {
    const variants: Partial<ClaimEvaluation>[] = [
      { bridged: false },
      { bridge_status: "pending_single_camp" },
      { camp_count: 1 },
      { endorser_band: "withheld" },
      { evaluated_at: null },
      { rationale: "short" },
      { is_demo: true },
    ];

    for (const override of variants) {
      const { debate, claim } = scenario(["factual"], "supports_claim");
      const assessments = makeEvidenceInspectable(debate, claim);
      const evaluation = { ...bridgedEstablishment(claim.id), ...override };
      expect(
        claimState(
          debate,
          claim,
          new Map([[claim.id, evaluation]]),
          assessments,
        ),
      ).toBe("provisional");
    }
  });

  it("does not apply an evaluation belonging to another claim", () => {
    const { debate, claim } = scenario(["factual"], "supports_claim");

    expect(
      claimState(
        debate,
        claim,
        new Map([["different_claim", "established"]]),
      ),
    ).toBe("provisional");
  });

  it("does not establish any truth-apt claim from a positive link alone", () => {
    const { debate, claim } = scenario(["causal"], "supports_claim");

    expect(claimState(debate, claim)).toBe("provisional");
  });

  it("makes an approved, accessible evidence challenge contested", () => {
    const { debate, claim } = scenario(["factual"], "contradicts_claim");
    const assessments = makeEvidenceInspectable(debate, claim);

    expect(claimState(debate, claim, undefined, assessments)).toBe(
      "contested",
    );
  });

  it("does not treat an inaccessible challenge as evidence", () => {
    const { debate, claim } = scenario(["factual"], "contradicts_claim");
    const assessments = makeEvidenceInspectable(debate, claim);
    const source = debate.sources.find(
      (item) => item.id === debate.evidence_links[0].source_id,
    );
    if (!source) throw new Error("Fixture precondition: source missing.");
    source.retrieval_status = "blocked";

    expect(claimState(debate, claim, undefined, assessments)).toBe(
      "provisional",
    );
  });

  it.each(["contested", "rejected"] as const)(
    "keeps a %s claim contested without an evaluation",
    (reviewStatus) => {
      const { debate, claim } = scenario(["factual"], "supports_claim");
      claim.review_status = reviewStatus;

      expect(claimState(debate, claim)).toBe("contested");
    },
  );

  it("honors an explicit contested evaluation", () => {
    const { debate, claim } = scenario(["factual"], "supports_claim");

    expect(
      claimState(debate, claim, new Map([[claim.id, "contested"]])),
    ).toBe("contested");
  });

  it("propagates the same invariants into the aggregate debate shape", () => {
    const normative = scenario(
      ["normative"],
      "supports_claim",
      "normative_claim",
    );
    const unevaluatedFact = scenario(
      ["factual"],
      "supports_claim",
      "unevaluated_fact",
    );
    const evaluatedFact = scenario(
      ["factual"],
      "supports_claim",
      "evaluated_fact",
    );
    const debate: DebateFixture = {
      ...normative.debate,
      claims: [normative.claim, unevaluatedFact.claim, evaluatedFact.claim],
      evidence_links: [
        ...normative.debate.evidence_links,
        ...unevaluatedFact.debate.evidence_links,
        ...evaluatedFact.debate.evidence_links,
      ],
    };
    const assessments = makeEvidenceInspectable(debate, evaluatedFact.claim);
    const evaluations = new Map<string, ClaimEvaluation>([
      [
        evaluatedFact.claim.id,
        bridgedEstablishment(evaluatedFact.claim.id),
      ],
    ]);

    expect(debateShape(debate, evaluations, assessments)).toEqual({
      established: 1,
      contested: 0,
      provisional: 1,
      values: 1,
      total: 3,
      temperament: "values",
    });
  });

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

  it("derives settled and contested aggregate temperaments", () => {
    const settled = scenario(["factual"], "supports_claim", "settled_claim");
    const assessments = makeEvidenceInspectable(settled.debate, settled.claim);
    const contested = scenario(
      ["factual"],
      "supports_claim",
      "contested_claim",
    );
    contested.claim.review_status = "contested";

    expect(
      debateShape(
        settled.debate,
        new Map([
          [settled.claim.id, bridgedEstablishment(settled.claim.id)],
        ]),
        assessments,
      ).temperament,
    ).toBe("settled");
    expect(debateShape(contested.debate).temperament).toBe("contested");
    expect(debateShape(settled.debate).temperament).toBe("provisional");
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
