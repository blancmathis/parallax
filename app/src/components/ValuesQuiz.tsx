import { useCallback, useMemo, useState } from "react";
import { LocaleLink as Link } from "../i18n/links";
import type { DebateFixture } from "../types";
import { POSITION_LETTERS } from "../data";
import { insightFor } from "../data/insight";
import { useI18n } from "../i18n";
import {
  saveQuizResult,
  setPerception,
  useProfile,
} from "../lib/profile";
import { toast } from "../lib/toast-store";

/**
 * Defect 3 (double-sticky math) — RESOLVED via option (a): the sighting strip
 * is NON-STICKY. The already-sticky `.switcher` (top: calc(--masthead-h - 2px))
 * stays the single sticky element; the spine is the persistent cue. The
 * "Sighted at N" line lives inline in the quiz flow, so there is no second
 * `top` to reconcile and nothing overlaps/jumps on mobile (defect 5: under
 * ~640px the spine remains the only persistent sticky element; this mono line
 * is static, capped one row tall).
 */

/**
 * The values quiz — five trade-offs, one minute.
 * The point is not to sort people into camps: it is the reveal at the end,
 * where you see how many values you share with the people you disagree with.
 * All copy lives in t.interactive.quiz.
 */

type Step =
  | { kind: "intro" }
  | { kind: "baseline" }
  | { kind: "question"; index: number }
  | { kind: "result" };

export function ValuesQuiz({
  debate,
  onPickPosition,
}: {
  debate: DebateFixture;
  onPickPosition: (positionId: string) => void;
}) {
  const { locale, t } = useI18n();
  const insight = insightFor(debate.topic.id, locale);
  const profile = useProfile();
  const saved = profile.quiz[debate.topic.id];
  // The sighting strip owns the before-write (defect 4): once set here,
  // setPerception refuses to overwrite it, so the exit card never writes a
  // `before`. This value is the persistent, NON-STICKY sighting cue.
  const sighted = profile.perception[debate.topic.id]?.before;

  const [step, setStep] = useState<Step>({ kind: "intro" });
  const [answers, setAnswers] = useState<Record<string, "a" | "b">>({});

  const sightingLine = (extra?: boolean) =>
    sighted !== undefined ? (
      <p className="quiz__sighted" aria-hidden={extra ? undefined : true}>
        <span className="quiz__sightedmark" />
        {t.interactive.quiz.sightedAt(sighted)}
      </p>
    ) : null;

  const valueName = (id: string) =>
    debate.values.find((v) => v.id === id)?.name ?? id;

  const scoreOf = useCallback(
    (ans: Record<string, "a" | "b">) => {
      const s: Record<string, number> = {};
      if (!insight) return s;
      for (const q of insight.tradeoffs) {
        const pick = ans[q.id];
        if (!pick) continue;
        for (const vid of q[pick].value_ids) s[vid] = (s[vid] ?? 0) + 1;
      }
      return s;
    },
    [insight],
  );
  const scores = useMemo(() => scoreOf(answers), [answers, scoreOf]);

  if (!insight) return null;

  const total = insight.tradeoffs.length;

  const rankPositions = (valueScores: Record<string, number>) =>
    debate.positions
      .map((p) => {
        const raw = p.value_ids.reduce((n, v) => n + (valueScores[v] ?? 0), 0);
        const max = Math.max(
          1,
          p.value_ids.length *
            Math.max(1, ...Object.values(valueScores).concat(0)),
        );
        return { position: p, raw, pct: Math.round((raw / max) * 100) };
      })
      .sort((x, y) => y.raw - x.raw);

  const finish = (allAnswers: Record<string, "a" | "b">) => {
    // Score the COMPLETE answer set — the memoized `scores` lags the last
    // question's setState, so saving from it would drop the final answer.
    const finalScores = scoreOf(allAnswers);
    const ranked = rankPositions(finalScores);
    const best = ranked[0];
    saveQuizResult(debate.topic.id, {
      value_scores: finalScores,
      match_position_id: best.position.id,
      completed_at: new Date().toISOString(),
    });
    setStep({ kind: "result" });
    toast(t.interactive.quiz.savedToast, "success");
  };

  /* ——— compact card when already taken ——— */
  if (saved && step.kind === "intro") {
    const match = debate.positions.find(
      (p) => p.id === saved.match_position_id,
    );
    const letter = match
      ? POSITION_LETTERS[debate.positions.findIndex((p) => p.id === match.id)]
      : "?";
    const topValues = Object.entries(saved.value_scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id]) => valueName(id));
    return (
      <div className="quiz quiz--compact">
        <div className="quiz__compactrow">
          <span className="quiz__compactbadge">{letter}</span>
          <div>
            <p className="quiz__compactlead">
              {t.interactive.quiz.compactLeadStart} <b>{match?.title}</b>
              {t.interactive.quiz.compactLeadEnd(topValues)}
            </p>
            <div className="quiz__compactactions">
              {match && (
                <button
                  className="quiz__link"
                  onClick={() => onPickPosition(match.id)}
                >
                  {t.interactive.quiz.reRead}
                </button>
              )}
              <button
                className="quiz__link quiz__link--faint"
                onClick={() => {
                  setAnswers({});
                  setStep({ kind: "question", index: 0 });
                }}
              >
                {t.interactive.quiz.retake}
              </button>
              <Link to="/you" className="quiz__link quiz__link--faint">
                {t.interactive.quiz.savedLink}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      {step.kind === "intro" && (
        <div className="quiz__intro">
          <div className="quiz__introtext">
            <p className="quiz__eyebrow">{t.interactive.quiz.introEyebrow}</p>
            <h3 className="quiz__title">{t.interactive.quiz.introTitle}</h3>
            <p className="quiz__lede">{t.interactive.quiz.introLede}</p>
          </div>
          <div className="quiz__introactions">
            <button
              className="btn btn--primary"
              onClick={() => setStep({ kind: "baseline" })}
            >
              {t.interactive.quiz.start}
            </button>
            <span className="quiz__privacy">{t.interactive.quiz.privacy}</span>
          </div>
        </div>
      )}

      {step.kind === "baseline" && (
        <div className="quiz__panel" key="baseline">
          <p className="quiz__eyebrow">{t.interactive.quiz.baselineEyebrow}</p>
          <h3 className="quiz__question" id="quiz-baseline-q">
            {t.interactive.quiz.baselineQuestion}
          </h3>
          <fieldset
            className="quiz__scale"
            role="radiogroup"
            aria-labelledby="quiz-baseline-q"
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
                  setPerception(debate.topic.id, "before", n);
                  setStep({ kind: "question", index: 0 });
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
        </div>
      )}

      {step.kind === "question" && (
        <div className="quiz__panel" key={step.index}>
          {sightingLine()}
          <div className="quiz__progress">
            {insight.tradeoffs.map((q, i) => (
              <i
                key={q.id}
                className={`quiz__dot${
                  i < step.index
                    ? " quiz__dot--done"
                    : i === step.index
                      ? " quiz__dot--now"
                      : ""
                }`}
              />
            ))}
            <span className="quiz__count">
              {step.index + 1}/{total}
            </span>
          </div>
          <h3 className="quiz__question" id={`quiz-q-${step.index}`}>
            {insight.tradeoffs[step.index].prompt}
          </h3>
          <div
            className="quiz__options"
            role="radiogroup"
            aria-labelledby={`quiz-q-${step.index}`}
          >
            {(["a", "b"] as const).map((side) => (
              <button
                key={side}
                type="button"
                role="radio"
                aria-checked={answers[insight.tradeoffs[step.index].id] === side}
                className="quiz__option"
                onClick={() => {
                  setAnswers((prev) => ({
                    ...prev,
                    [insight.tradeoffs[step.index].id]: side,
                  }));
                  if (step.index + 1 < total)
                    setStep({ kind: "question", index: step.index + 1 });
                  else
                    finish({
                      ...answers,
                      [insight.tradeoffs[step.index].id]: side,
                    });
                }}
              >
                {insight.tradeoffs[step.index][side].text}
              </button>
            ))}
          </div>
          {step.index > 0 && (
            <button
              className="quiz__link quiz__link--faint"
              onClick={() => setStep({ kind: "question", index: step.index - 1 })}
            >
              {t.interactive.quiz.back}
            </button>
          )}
        </div>
      )}

      {step.kind === "result" &&
        (() => {
          const ranked = rankPositions(scores);
          const best = ranked[0];
          const bestLetter =
            POSITION_LETTERS[
              debate.positions.findIndex((p) => p.id === best.position.id)
            ];
          const topValues = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .filter(([, n]) => n > 0);
          const maxScore = topValues[0]?.[1] ?? 1;
          const bridges = ranked
            .slice(1)
            .map(({ position }) => {
              const shared = position.value_ids
                .filter((v) => (scores[v] ?? 0) > 0)
                .sort((x, y) => (scores[y] ?? 0) - (scores[x] ?? 0))[0];
              return shared
                ? {
                    letter:
                      POSITION_LETTERS[
                        debate.positions.findIndex(
                          (p) => p.id === position.id,
                        )
                      ],
                    value: valueName(shared),
                  }
                : null;
            })
            .filter(Boolean) as { letter: string; value: string }[];

          return (
            <div className="quiz__panel quiz__result" key="result">
              {sightingLine(true)}
              <p className="quiz__eyebrow">{t.interactive.quiz.resultEyebrow}</p>
              <div className="quiz__values">
                {topValues.map(([id, n]) => (
                  <div key={id} className="quiz__valuerow">
                    <span className="quiz__valuename">{valueName(id)}</span>
                    <span className="quiz__valuebar">
                      <i style={{ width: `${(n / maxScore) * 100}%` }} />
                    </span>
                  </div>
                ))}
              </div>

              <div className="quiz__match">
                <span className="quiz__matchletter">{bestLetter}</span>
                <div className="quiz__matchbody">
                  <p className="quiz__matchlead">{t.interactive.quiz.matchLead}</p>
                  <p className="quiz__matchtitle">{best.position.title}</p>
                </div>
                <button
                  className="btn btn--primary btn--small"
                  onClick={() => onPickPosition(best.position.id)}
                >
                  {t.interactive.quiz.readFirst}
                </button>
              </div>

              {bridges.length > 0 && (
                <div className="quiz__bridges">
                  <p className="quiz__bridgeslead">
                    {t.interactive.quiz.bridgesLead}
                  </p>
                  {bridges.map((b) => (
                    <p key={b.letter} className="quiz__bridge">
                      {t.interactive.quiz.bridge(b.value, b.letter)}
                    </p>
                  ))}
                  <p className="quiz__bridgenote">
                    {t.interactive.quiz.lensNote}
                  </p>
                </div>
              )}

              <Link to="/you" className="quiz__link quiz__savedlink">
                {t.interactive.quiz.savedLink}
              </Link>
            </div>
          );
        })()}
    </div>
  );
}
