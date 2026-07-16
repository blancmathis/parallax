import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { analyzeSeedPacket, createSeedPacket } from "../lib/backend";
import { useAuth } from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase";
import { toast } from "../lib/toast-store";

/**
 * Topic proposal — the UI for Milestone 6, working ahead of its backend.
 * Drafts are saved locally so nothing a future contributor writes is lost.
 * An optional email lets us notify the proposer when topic creation opens,
 * turning the Milestone-6 wait into a completing action rather than a dead end.
 */

const KEY = "parallax.topic-proposals.v1";

export function ProposeTopic({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [question, setQuestion] = useState("");
  const [why, setWhy] = useState("");
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const auth = useAuth();

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      setDone(false);
      restoreRef.current?.focus?.();
    };
  }, [open]);

  // Focus management: focus first field on open, cycle Tab/Shift+Tab, Escape closes.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.offsetParent !== null)
        : [];
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, done]);

  if (!open) return null;

  const valid =
    question.trim().length > 10 &&
    question.trim().endsWith("?") &&
    why.trim().length > 10;

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError("");
    try {
      if (isSupabaseConfigured) {
        if (!auth.user) {
          setError("Sign in on the You page before creating a backend seed packet.");
          return;
        }
        const sources = [s1.trim(), s2.trim()]
          .filter((url) => url.startsWith("http"))
          .map((url) => ({ url, note: "Provided from the topic proposal form." }));
        const packetId = await createSeedPacket({
          question: question.trim(),
          initialPosition: "This topic should be mapped in Parallax.",
          initialArguments: [why.trim()],
          sources,
        });
        await analyzeSeedPacket(packetId, "mock");
      } else {
        const prev = JSON.parse(localStorage.getItem(KEY) ?? "[]");
        prev.push({
          question: question.trim(),
          why: why.trim(),
          sources: [s1.trim(), s2.trim()].filter(Boolean),
          email: email.trim() || undefined,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem(KEY, JSON.stringify(prev));
      }
      setDone(true);
      toast(t.features.proposeSavedToast, "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the seed packet.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="propose-title"
    >
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel" ref={panelRef}>
        <header className="modal__head">
          <div>
            <p className="modal__eyebrow">{t.debatesIndex.next}</p>
            <h3 className="modal__title" id="propose-title">
              {t.features.proposeTitle}
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

        {done ? (
          <div className="modal__done">
            <span className="stamp stamp--inline" aria-hidden="true">
              ✓
            </span>
            <h4>{t.features.proposeSavedTitle}</h4>
            <p>{t.features.proposeSavedBody}</p>
            <div className="modal__doneactions">
              <button className="btn btn--ghost btn--small" onClick={onClose}>
                {t.common.actions.close}
              </button>
            </div>
          </div>
        ) : (
          <div className="modal__body slideover__body">
            <p className="section__lede" style={{ marginTop: 0, fontSize: 14.5 }}>
              {t.features.proposeLede}
            </p>
            {isSupabaseConfigured && (
              <p className="backend-note">
                {auth.user
                  ? "Backend mode: this creates a seed packet and mock AI draft."
                  : "Backend mode: sign in before creating a seed packet."}
              </p>
            )}
            <div className="field">
              <label className="field__label" htmlFor="propose-question">
                {t.features.proposeQuestion}
              </label>
              <input
                id="propose-question"
                className="field__input"
                placeholder={t.features.proposeQuestionPh}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="propose-why">
                {t.features.proposeWhy}
              </label>
              <textarea
                id="propose-why"
                className="field__input field__input--area"
                rows={3}
                placeholder={t.features.proposeWhyPh}
                value={why}
                onChange={(e) => setWhy(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field__label">{t.features.proposeSources}</label>
              <input
                className="field__input"
                placeholder="https://…"
                value={s1}
                onChange={(e) => setS1(e.target.value)}
              />
              <input
                className="field__input"
                placeholder="https://…"
                value={s2}
                onChange={(e) => setS2(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="propose-email">
                {t.features.proposeEmail}
              </label>
              <input
                id="propose-email"
                className="field__input"
                type="email"
                inputMode="email"
                placeholder={t.features.proposeEmailPh}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="field__hint">{t.features.proposeEmailHint}</p>
            </div>
            <div className="slideover__actions">
              <button
                className="btn btn--primary"
                disabled={!valid || submitting}
                onClick={submit}
              >
                {submitting ? "Creating..." : t.features.proposeSubmit}
              </button>
            </div>
            {error && <p className="form-error">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
