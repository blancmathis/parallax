import { useEffect, useRef, useState } from "react";
import { LocaleLink as Link } from "../i18n/links";
import type { DebateFixture, Position } from "../types";
import { insightFor } from "../data/insight";
import { useI18n } from "../i18n";
import { saveSteelmanResult } from "../lib/profile";
import { toast } from "../lib/toast-store";

/**
 * The steelman test — the anti-dunk. Two questions: can you state this
 * position the way a supporter would, and do you know what it costs?
 * Passing earns the position's badge on your local profile.
 */

export function SteelmanTest({
  debate,
  position,
  open,
  onClose,
}: {
  debate: DebateFixture;
  position: Position;
  open: boolean;
  onClose: () => void;
}) {
  const { locale, t } = useI18n();
  const insight = insightFor(debate.topic.id, locale);

  // Defect 2: deep-link ordering. A caller may flip `open` true in the SAME
  // tick it changes the selected position, so the `position` prop can arrive
  // one render stale at the moment of opening. We LOCK the target position the
  // instant `open` becomes true and drive the whole test off the lock — the
  // body never renders for the previous position. We re-lock whenever the
  // incoming position id changes while open (handles a switch mid-session).
  const [lockedId, setLockedId] = useState(position.id);
  const activePosition =
    debate.positions.find((p) => p.id === lockedId) ?? position;
  const questions =
    insight?.steelman.filter((q) => q.position_id === activePosition.id) ?? [];

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Reset the whole test whenever a session begins (open flips true) or the
  // incoming position changes while open. This is the "adjust state when an
  // input changes" pattern (set state during render, no effect): the body
  // never renders a stale question for the previous position/session.
  const sessionKey = open ? position.id : null;
  const [lastSession, setLastSession] = useState(sessionKey);
  if (sessionKey !== null && sessionKey !== lastSession) {
    setLastSession(sessionKey);
    setLockedId(position.id);
    setIndex(0);
    setPicked(null);
    setCorrectCount(0);
    setFinished(false);
  } else if (sessionKey === null && lastSession !== null) {
    // Remember that the session closed so re-opening re-arms a fresh reset.
    setLastSession(null);
  }

  // Lock body scroll while the modal is open (a real external-system side
  // effect — no setState here, so it stays in an effect with proper cleanup).
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* Focus trap: move focus in on open, cycle Tab/Shift+Tab, restore on close. */
  // Capture the trigger and restore focus to it ONLY when the dialog closes —
  // keyed on `open` alone, so advancing a question doesn't throw focus outside.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => {
      previouslyFocused?.focus?.();
    };
  }, [open]);

  // Keep focus inside the dialog: focus the first control on open / each advance,
  // and trap Tab. This effect never restores focus outward.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
    focusable()[0]?.focus();
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = focusable();
      if (els.length === 0) return;
      const firstEl = els[0];
      const lastEl = els[els.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    panel.addEventListener("keydown", onTab);
    return () => {
      panel.removeEventListener("keydown", onTab);
    };
  }, [open, index, finished]);

  if (!open || questions.length === 0) return null;

  const q = questions[index];
  const isCorrectPick = picked !== null && q.options[picked]?.correct === true;

  const next = () => {
    const newCorrect = correctCount + (isCorrectPick ? 1 : 0);
    if (index + 1 < questions.length) {
      setCorrectCount(newCorrect);
      setIndex(index + 1);
      setPicked(null);
    } else {
      const passed = newCorrect === questions.length;
      setCorrectCount(newCorrect);
      setFinished(true);
      saveSteelmanResult(debate.topic.id, activePosition.id, {
        passed,
        correct: newCorrect,
        total: questions.length,
        attempted_at: new Date().toISOString(),
      });
      if (passed) toast(t.interactive.steelman.badgeToast, "success");
    }
  };

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="steelman-title"
    >
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel" ref={panelRef}>
        <header className="modal__head">
          <div>
            <p className="modal__eyebrow">{t.interactive.steelman.eyebrow}</p>
            <h3 className="modal__title" id="steelman-title">
              {t.interactive.steelman.title}
            </h3>
          </div>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label={t.common.actions.close}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        {!finished ? (
          <div className="modal__body" key={q.id}>
            <p className="modal__counter">
              {t.interactive.steelman.counter(
                index + 1,
                questions.length,
                activePosition.title,
              )}
            </p>
            <h4 className="modal__question" id="steelman-question">
              {q.prompt}
            </h4>
            <div
              className="modal__options"
              role="radiogroup"
              aria-labelledby="steelman-question"
            >
              {q.options.map((opt, i) => {
                let cls = "modal__option";
                if (picked !== null) {
                  if (opt.correct) cls += " modal__option--correct";
                  else if (i === picked) cls += " modal__option--wrong";
                  else cls += " modal__option--muted";
                }
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={picked === i}
                    className={cls}
                    disabled={picked !== null}
                    onClick={() => setPicked(i)}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="modal__explain" role="status" aria-live="polite">
                <p>
                  <b>
                    {isCorrectPick
                      ? t.interactive.steelman.exactly
                      : t.interactive.steelman.notQuite}
                  </b>{" "}
                  {q.explain}
                </p>
                <button className="btn btn--primary btn--small" onClick={next}>
                  {index + 1 < questions.length
                    ? t.interactive.steelman.next
                    : t.interactive.steelman.seeResult}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="modal__body modal__done" role="status" aria-live="polite">
            {correctCount === questions.length ? (
              <>
                <span className="stamp stamp--inline stamp--green">
                  {t.interactive.steelman.passStamp}
                </span>
                <h4>{t.interactive.steelman.passTitle}</h4>
                <p>{t.interactive.steelman.passBody}</p>
                <Link to="/you" className="quiz__link quiz__savedlink">
                  {t.interactive.quiz.savedLink}
                </Link>
              </>
            ) : (
              <>
                <span className="stamp stamp--inline">
                  {correctCount}/{questions.length}
                </span>
                <h4>{t.interactive.steelman.failTitle}</h4>
                <p>{t.interactive.steelman.failBody}</p>
              </>
            )}
            <div className="modal__doneactions">
              <button className="btn btn--ghost btn--small" onClick={onClose}>
                {t.interactive.steelman.backToReading}
              </button>
              {correctCount < questions.length && (
                <button
                  className="btn btn--primary btn--small"
                  onClick={() => {
                    setIndex(0);
                    setPicked(null);
                    setCorrectCount(0);
                    setFinished(false);
                  }}
                >
                  {t.interactive.steelman.tryAgain}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
