import type { DebateFixture } from "../types";
import { letterOf } from "../data";
import { coverageFor } from "../data/coverage";
import { useI18n } from "../i18n";

export function CoverageRegister({ debate }: { debate: DebateFixture }) {
  const { t } = useI18n();
  const coverage = coverageFor(debate);
  const positions = coverage.sourcesByPosition
    .map((item) => `${letterOf(debate, item.positionId)} : ${item.sources}`)
    .join(" · ");

  return (
    <aside className="draftnotice" aria-label={t.draft.title}>
      <p className="draftnotice__title">{t.draft.title}</p>
      <p className="draftnotice__provenance">{t.draft.provenance}</p>
      <p className="draftnotice__coverage">
        {t.draft.coverage(
          positions,
          coverage.withExcerpt,
          coverage.links,
          coverage.excerptPercent,
        )}{" "}
        {t.draft.reviewers}
      </p>
      <p className="draftnotice__note">{t.draft.excerptNote}</p>
    </aside>
  );
}
