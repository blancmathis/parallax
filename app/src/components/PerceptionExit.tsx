import { useEffect, useRef, useState } from "react";
import { LocaleLink as Link } from "../i18n/links";
import type { DebateFixture } from "../types";
import { useI18n } from "../i18n";
import { setPerception, useProfile } from "../lib/profile";

/**
 * The only metric that matters, measured on the reader themself:
 * "are the people who disagree with you reasonable?" — asked on the way in
 * (quiz calibration) and on the way out (here). The delta is the product.
 *
 * This is the visual climax of the Sonder loop. The two-offset-circles mark
 * becomes the gauge: a before mark and an after mark on the same 1–7 track,
 * and the span between them IS the delta. Held (delta 0) and moved-down get
 * equal weight and dignity to moved-up — no green/up styling that codes
 * "up = correct". Everything stays in this browser (privacy red line).
 */

const TRACK_MIN = 1;
const TRACK_MAX = 7;
const trackPct = (n: number) =>
  ((n - TRACK_MIN) / (TRACK_MAX - TRACK_MIN)) * 100;

const prefersNoMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function PerceptionExit({ debate }: { debate: DebateFixture }) {
  const { t } = useI18n();
  const profile = useProfile();
  const perception = profile.perception[debate.topic.id];
  const [justAnswered, setJustAnswered] = useState(false);

  const before = perception?.before;
  const after = perception?.after;
  const answered = after !== undefined;
  // Defect 4: the exit framing keys on `before === undefined`, never on a
  // looser "no baseline" notion. setPerception refuses to overwrite an
  // existing `before` (profile.ts L97), so the exit never writes one — the
  // sighting strip in the quiz owns the before-write. They never collide.
  const hasBaseline = before !== undefined;
  const delta =
    hasBaseline && after !== undefined ? after - before : undefined;

  return (
    <aside className="exitcard sonder-exit">
      <p className="exitcard__eyebrow">{t.interactive.perception.eyebrow}</p>
      {!answered ? (
        <>
          <h3 className="exitcard__question" id="exit-q">
            {t.interactive.perception.question}
          </h3>
          <fieldset
            className="quiz__scale"
            role="radiogroup"
            aria-labelledby="exit-q"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked="false"
                className="quiz__scalebtn"
                aria-label={
                  n === 1
                    ? `${n} — ${t.interactive.scale.min}`
                    : n === 7
                      ? `${n} — ${t.interactive.scale.max}`
                      : String(n)
                }
                onClick={() => {
                  setPerception(debate.topic.id, "after", n);
                  setJustAnswered(true);
                }}
              >
                {n}
              </button>
            ))}
          </fieldset>
          <div className="quiz__scalelabels">
            <span>{t.interactive.scale.min}</span>
            <span>{t.interactive.scale.max}</span>
          </div>
        </>
      ) : delta === undefined || before === undefined || after === undefined ? (
        // No baseline: degrade gracefully, no meter (nothing to span).
        <div className="exitcard__delta sonder-exit__nobaseline">
          <p>{t.interactive.perception.noBaseline}</p>
          <p className="exitcard__note">{t.interactive.perception.note}</p>
          <Link to="/you" className="quiz__link quiz__savedlink">
            {t.interactive.quiz.savedLink}
          </Link>
        </div>
      ) : (
        <DeltaReveal
          before={before}
          after={after}
          delta={delta}
          fresh={justAnswered}
          t={t}
        />
      )}
    </aside>
  );
}

/**
 * The delta resolves. The before mark holds; the after mark travels from the
 * before position to its measured value, and the read-out counts to the delta.
 * Single-shot, calm. CSS animations auto-snap under the global reduced-motion
 * rule; the rAF count-up carries its OWN reduced-motion check (defect 1).
 */
function DeltaReveal({
  before,
  after,
  delta,
  fresh,
  t,
}: {
  before: number;
  after: number;
  delta: number;
  fresh: boolean;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const reduced = prefersNoMotion();
  // The after mark animates from `before` → `after` only when freshly answered
  // AND motion is allowed. Static default IS the resolved end-state (after),
  // so reduced-motion / revisit renders a fully resolved meter, never a
  // mid-travel "before" state.
  const armed = fresh && !reduced;
  // Animated state seeds at the START of the travel (before / 0) only when
  // armed; the effect below eases it to the resolved end-state. When NOT armed
  // we never use this state — afterPos / shown are derived straight from the
  // measured end-state during render, so reduced-motion / revisit paints a
  // fully resolved meter with no effect-driven setState.
  const [animPos, setAnimPos] = useState(before);
  const [animShown, setAnimShown] = useState(0);
  const afterPos = armed ? animPos : after;
  const shown = armed ? animShown : Math.abs(delta);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!armed) return;
    // next frame: release the after mark to its measured value (CSS eases it)
    const release = requestAnimationFrame(() => setAnimPos(after));
    // count the magnitude up over the same beat
    const mag = Math.abs(delta);
    const dur = 720;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setAnimShown(Math.round(mag * (1 - Math.pow(1 - p, 3))));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(release);
      cancelAnimationFrame(rafRef.current);
    };
  }, [armed, after, delta]);

  const dir = delta > 0 ? "up" : delta < 0 ? "down" : "held";

  return (
    <div
      className={`exitcard__delta sonder-delta sonder-delta--${dir}`}
      key={fresh ? "fresh" : "old"}
    >
      <div
        className={`sonder-meter${armed ? " sonder-meter--armed" : ""}`}
        aria-hidden="true"
      >
        <span className="sonder-meter__track" />
        {/* the span between the two marks IS the delta */}
        <span
          className="sonder-meter__span"
          style={{
            left: `${trackPct(Math.min(before, after))}%`,
            width: `${Math.abs(trackPct(after) - trackPct(before))}%`,
          }}
        />
        <span
          className="sonder-meter__mark sonder-meter__mark--before"
          style={{ left: `${trackPct(before)}%` }}
        >
          <i />
          <em>{before}</em>
        </span>
        <span
          className="sonder-meter__mark sonder-meter__mark--after"
          style={{ left: `${trackPct(afterPos)}%` }}
        >
          <i />
          <em>{after}</em>
        </span>
      </div>
      <div className="sonder-meter__legend" aria-hidden="true">
        <span>{t.interactive.perception.beforeLabel}</span>
        <span>{t.interactive.perception.afterLabel}</span>
      </div>

      <p className="sonder-delta__readout" role="status" aria-live="polite">
        {delta === 0 ? (
          t.interactive.perception.held
        ) : delta > 0 ? (
          <>
            {t.interactive.perception.movedUpStart}{" "}
            <b className="sonder-delta__num">+{shown}</b>{" "}
            {t.interactive.perception.movedUpEnd}
          </>
        ) : (
          <>
            {t.interactive.perception.movedDownStart}{" "}
            <b className="sonder-delta__num">−{shown}</b>{" "}
            {t.interactive.perception.movedDownEnd}
          </>
        )}
      </p>

      <p className="sonder-delta__measured">
        {t.interactive.perception.measuredLine}
      </p>
      <p className="exitcard__note">{t.interactive.perception.note}</p>
      <Link to="/you" className="quiz__link quiz__savedlink">
        {t.interactive.quiz.savedLink}
      </Link>
    </div>
  );
}
