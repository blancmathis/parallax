import { describe, expect, it } from "vitest";
import { getDebates } from "../../src/data";
import type { ClaimType, DebateFixture } from "../../src/types";
import { debateFixtureSchema } from "../helpers/fixture-contract";

function cloneFixture(locale: "en" | "fr" = "en"): DebateFixture {
  return structuredClone(getDebates(locale)[0]);
}

function removeClaimEvidence(
  fixture: DebateFixture,
  claimIndex: number,
): void {
  const claim = fixture.claims[claimIndex];
  const removedIds = new Set(claim.evidence_link_ids);
  claim.evidence_link_ids = [];
  fixture.evidence_links = fixture.evidence_links.filter(
    (link) => !removedIds.has(link.id),
  );
}

describe("runtime debate fixture contract", () => {
  for (const locale of ["en", "fr"] as const) {
    for (const fixture of getDebates(locale)) {
      it(`accepts ${locale}/${fixture.topic.id}`, () => {
        expect(() => debateFixtureSchema.parse(fixture)).not.toThrow();
      });
    }
  }

  it("rejects a dangling cross-reference", () => {
    const fixture = cloneFixture();
    fixture.arguments[0].claim_ids.push("claim_that_does_not_exist");

    const result = debateFixtureSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message:
              "Unknown claim reference: claim_that_does_not_exist.",
          }),
        ]),
      );
    }
  });

  it("rejects a one-way relationship even when both ids exist", () => {
    const fixture = cloneFixture();
    const argument = fixture.arguments[0];
    const owner = fixture.positions.find(
      (position) => position.id === argument.position_id,
    );
    if (!owner) throw new Error("Fixture precondition: argument owner missing.");
    owner.argument_ids = owner.argument_ids.filter((id) => id !== argument.id);

    const result = debateFixtureSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: `Position ${owner.id} does not reference argument ${argument.id}.`,
          }),
        ]),
      );
    }
  });

  it.each<{ label: string; claimTypes: ClaimType[] }>([
    { label: "factual", claimTypes: ["factual"] },
    { label: "causal", claimTypes: ["causal"] },
    { label: "predictive", claimTypes: ["predictive"] },
    { label: "definitional", claimTypes: ["definitional"] },
    {
      label: "mixed normative and factual",
      claimTypes: ["normative", "factual"],
    },
  ])(
    "requires evidence for $label claims",
    ({ claimTypes }) => {
      const fixture = cloneFixture();
      const claimIndex = fixture.claims.findIndex(
        (claim) => claim.evidence_link_ids.length > 0,
      );
      if (claimIndex < 0) {
        throw new Error("Fixture precondition: evidenced claim missing.");
      }
      fixture.claims[claimIndex].claim_type = claimTypes;
      removeClaimEvidence(fixture, claimIndex);

      const result = debateFixtureSchema.safeParse(fixture);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["claims", claimIndex, "evidence_link_ids"],
              message:
                "Non-normative claims require at least one evidence link.",
            }),
          ]),
        );
      }
    },
  );

  it("allows a normative-only claim without evidence", () => {
    const fixture = cloneFixture();
    const claimIndex = fixture.claims.findIndex(
      (claim) => claim.evidence_link_ids.length > 0,
    );
    if (claimIndex < 0) {
      throw new Error("Fixture precondition: evidenced claim missing.");
    }
    fixture.claims[claimIndex].claim_type = ["normative"];
    removeClaimEvidence(fixture, claimIndex);

    expect(() => debateFixtureSchema.parse(fixture)).not.toThrow();
  });

  it("rejects invalid source URLs and out-of-range confidence", () => {
    const fixture = cloneFixture();
    fixture.sources[0].url = "javascript:alert(1)";
    fixture.evidence_links[0].confidence = 1.01;

    const result = debateFixtureSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining([
          ["sources", 0, "url"],
          ["evidence_links", 0, "confidence"],
        ]),
      );
    }
  });

  it("validates optional source excerpts against their evidence source", () => {
    const fixture = cloneFixture();
    const link = fixture.evidence_links[0];
    fixture.source_excerpts = [
      ...(fixture.source_excerpts ?? []),
      {
        id: "excerpt_contract_test",
        source_id: link.source_id,
        text: "A versioned passage from the cited source.",
        locator: "p. 12",
        extracted_by: "human",
        created_at: "2026-08-30T12:00:00Z",
      },
    ];
    link.source_excerpt_id = "excerpt_contract_test";

    expect(() => debateFixtureSchema.parse(fixture)).not.toThrow();

    const anotherSource = fixture.sources.find(
      (source) => source.id !== link.source_id,
    );
    if (!anotherSource) {
      throw new Error("Fixture precondition: second source missing.");
    }
    const addedExcerpt = fixture.source_excerpts.find(
      (excerpt) => excerpt.id === "excerpt_contract_test",
    );
    if (!addedExcerpt) {
      throw new Error("Fixture precondition: added excerpt missing.");
    }
    addedExcerpt.source_id = anotherSource.id;
    const result = debateFixtureSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["evidence_links", 0, "source_excerpt_id"],
            message:
              "Source excerpt excerpt_contract_test belongs to another source.",
          }),
        ]),
      );
    }
  });
});
