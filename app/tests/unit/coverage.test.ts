import { describe, expect, it } from "vitest";
import { DEBATES } from "../../src/data";
import {
  coverageFor,
  excerptFor,
  fixtureHistoryUrl,
} from "../../src/data/coverage";

describe("draft coverage", () => {
  it("counts distinct sources used by each position, not repeated citations", () => {
    const debate = structuredClone(DEBATES[0]);
    const position = debate.positions[0];
    const argument = debate.arguments.find(
      (item) => item.position_id === position.id,
    )!;
    const link = debate.evidence_links.find((item) =>
      argument.claim_ids.includes(item.claim_id),
    )!;
    const before = coverageFor(debate);
    debate.evidence_links.push({ ...link, id: "duplicate_citation" });
    const after = coverageFor(debate);
    expect(after.sourcesByPosition).toEqual(before.sourcesByPosition);
    expect(after.links).toBe(before.links + 1);
  });

  it("rejects excerpts from a different source and handles an empty corpus", () => {
    const debate = structuredClone(DEBATES[0]);
    const link = debate.evidence_links[0];
    link.source_excerpt_id = "wrong_source";
    debate.source_excerpts = [
      {
        id: "wrong_source",
        source_id: "another_source",
        text: "A passage belonging to another source.",
        locator: "paragraph 1",
        extracted_by: "human",
      },
    ];
    expect(excerptFor(debate, link)).toBeUndefined();
    expect(coverageFor(debate).withExcerpt).toBe(0);
    debate.evidence_links = [];
    expect(coverageFor(debate).excerptPercent).toBeNull();
  });

  it("links each locale to its own actual fixture history", () => {
    expect(fixtureHistoryUrl(DEBATES[0], "fr")).toBe(
      "https://github.com/blancmathis/parallax/commits/main/app/src/data/fr/congestion-pricing.json",
    );
    expect(fixtureHistoryUrl(DEBATES[0], "en")).toBe(
      "https://github.com/blancmathis/parallax/commits/main/app/src/data/congestion-pricing.json",
    );
  });
});
