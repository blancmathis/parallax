import { LocaleLink as Link } from "../i18n/links";
import { useEffect, useState } from "react";
import type { DebateFixture } from "../types";
import { POSITION_LETTERS, slugOf } from "../data";
import { debateShape, type ClaimState } from "../data/state";
import { useI18n } from "../i18n";

const CARD_TINTS = ["card-tint-a", "card-tint-b", "card-tint-c"];

/** Locale-aware relative-time label, snapped to whole days, no new deps. */
function relativeDate(iso: string, locale: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.round((then - Date.now()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(days) >= 30) return rtf.format(Math.round(days / 30), "month");
  if (Math.abs(days) >= 7) return rtf.format(Math.round(days / 7), "week");
  return rtf.format(days, "day");
}

/** Returns true once, on the client, when motion is allowed (arming gate). */
function useMotionArmed(): boolean {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      // Defer one frame so the resolved CSS default paints first, then the
      // JS-only "fill" transition runs. Reduced-motion users never arm, so the
      // static default (already the resolved end-state) is what they keep.
      const id = requestAnimationFrame(() => setArmed(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);
  return armed;
}

export function DebateCard({
  debate,
  index,
  compact = false,
}: {
  debate: DebateFixture;
  index: number;
  /** Landing preview opts out of the heavier ledger chrome (stamp + date). */
  compact?: boolean;
}) {
  const { t, locale } = useI18n();
  const armed = useMotionArmed();
  const revision = debate.revision.revision_number;
  // Show a fixture date in static HTML and the first hydration render. Relative
  // time is a client enhancement, so an old build cannot cause a mismatch.
  const [revised, setRevised] = useState(
    debate.revision.published_at.slice(0, 10),
  );
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      setRevised(relativeDate(debate.revision.published_at, locale)),
    );
    return () => cancelAnimationFrame(frame);
  }, [debate.revision.published_at, locale]);

  const { established, contested, provisional, values, total, temperament } =
    debateShape(debate);

  // Dot/segment colours mirror the canonical claim-state mapping used by
  // the debate-page StateStrip: established -> green, contested -> red,
  // provisional -> amber, values -> slate. A min flex-basis guarantees a
  // 1-claim sliver stays perceivable next to a much larger segment.
  const segments: {
    state: ClaimState;
    dot:
      | "supports_claim"
      | "partially_supports_claim"
      | "contradicts_claim"
      | "unclear";
    n: number;
    label: string;
  }[] = [
    {
      state: "established",
      dot: "supports_claim",
      n: established,
      label: t.debateCard.shapeEstablished(established),
    },
    {
      state: "contested",
      dot: "contradicts_claim",
      n: contested,
      label: t.debateCard.shapeContested(contested),
    },
    {
      state: "provisional",
      dot: "partially_supports_claim",
      n: provisional,
      label: t.debateCard.shapeProvisional(provisional),
    },
    {
      state: "values",
      dot: "unclear",
      n: values,
      label: t.debateCard.shapeValues(values),
    },
  ];
  const present = segments.filter((s) => s.n > 0);

  return (
    <Link
      to={`/debates/${slugOf(debate)}`}
      className={`dcard ${CARD_TINTS[index % CARD_TINTS.length]} dcard--temp-${temperament}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {!compact && (
        <span
          className={`atlas-stamp atlas-stamp--${temperament}`}
          aria-hidden="true"
        >
          {t.atlas.temperaments[temperament]}
        </span>
      )}

      <div className="dcard__head">
        <span className="dcard__no">№ {String(index + 1).padStart(3, "0")}</span>
        <span className="dcard__rev">
          {t.common.labels.revisionShort} {revision}
        </span>
      </div>
      <h3 className="dcard__question">{debate.topic.question}</h3>
      <p className="dcard__summary">{debate.topic.summary}</p>

      <div className="dcard__positions">
        {debate.positions.map((p, i) => (
          <span key={p.id} className="dcard__pos">
            <b>{POSITION_LETTERS[i]}</b>
            {p.title.split("—")[1]?.trim() ?? p.title}
          </span>
        ))}
      </div>

      {/* Proportional spine: the same instrument as the corpus masthead, at
          card scale. The bar carries its own meaning — inline counts + a
          legend below it, never a tooltip-only signal. */}
      <div className="atlas-spine">
        <div
          className={`atlas-spine__bar${armed ? " atlas-spine__bar--armed" : ""}`}
          role="img"
          aria-label={t.atlas.spineSummary(
            established,
            contested,
            provisional,
            values,
          )}
        >
          {present.map((s) => (
            <span
              key={s.state}
              className={`atlas-spine__seg atlas-spine__seg--${s.state}`}
              style={{ flexGrow: s.n }}
              aria-hidden="true"
              title={s.label}
            />
          ))}
        </div>
        <ul className="atlas-spine__legend">
          {present.map((s) => (
            <li key={s.state} className="atlas-spine__key">
              <i className={`dot dot--${s.dot}`} aria-hidden="true" />
              <span aria-hidden="true">{s.n}</span>
              <span className="sr-only">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="dcard__foot">
        <span>
          {t.common.counts.cardStats(
            debate.claims.length,
            debate.sources.length,
            debate.evidence_links.length,
          )}
        </span>
        <span className="dcard__go">
          {t.debateCard.read}
        </span>
      </div>

      {!compact && (
        <span className="atlas-card__revised">
          {t.atlas.revisedPrefix}{" "}
          {revised}
          {total > 0 ? ` · ${t.atlas.claimsCounted(total)}` : ""}
        </span>
      )}
    </Link>
  );
}
