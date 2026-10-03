import type { DebateFixture, EvidenceLink, SourceExcerpt } from "../types";
import { slugOf } from "./index";
import type { Locale } from "../i18n";

/** A stored excerpt must belong to the linked source and have usable text. */
export function excerptFor(
  debate: DebateFixture,
  link: EvidenceLink,
): SourceExcerpt | undefined {
  return debate.source_excerpts?.find(
    (excerpt) =>
      excerpt.id === link.source_excerpt_id &&
      excerpt.source_id === link.source_id &&
      excerpt.text.trim().length > 0 &&
      excerpt.locator.trim().length > 0,
  );
}

export function coverageFor(debate: DebateFixture) {
  const sourcesByPosition = debate.positions.map((position) => {
    const claimIds = new Set(
      debate.arguments
        .filter((argument) => argument.position_id === position.id)
        .flatMap((argument) => argument.claim_ids),
    );
    const sourceIds = new Set(
      debate.evidence_links
        .filter((link) => claimIds.has(link.claim_id))
        .filter((link) =>
          debate.sources.some((source) => source.id === link.source_id),
        )
        .map((link) => link.source_id),
    );
    return { positionId: position.id, sources: sourceIds.size };
  });
  const links = debate.evidence_links.length;
  const withExcerpt = debate.evidence_links.filter((link) =>
    excerptFor(debate, link),
  ).length;

  return {
    sourcesByPosition,
    links,
    withExcerpt,
    excerptPercent: links > 0 ? Math.round((withExcerpt / links) * 100) : null,
  };
}

export function fixtureHistoryUrl(
  debate: DebateFixture,
  locale: Locale,
): string {
  const folder = locale === "fr" ? "fr/" : "";
  return `https://github.com/blancmathis/parallax/commits/main/app/src/data/${folder}${slugOf(debate)}.json`;
}
