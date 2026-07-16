import { useEffect, useRef, useState } from "react";
import { LocaleLink as Link } from "../i18n/links";
import type {
  ContributionType,
  DebateFixture,
  EvidenceLabel,
} from "../types";
import { letterOf } from "../data";
import { useI18n } from "../i18n";
import { submitSupabaseContribution } from "../lib/backend";
import { useAuth } from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase";
import { submitContribution } from "../lib/store";

const PROPOSABLE_LABELS: EvidenceLabel[] = [
  "supports_claim",
  "partially_supports_claim",
  "contradicts_claim",
  "does_not_support_claim",
  "unclear",
];

export function ContributePanel({
  debate,
  open,
  onClose,
}: {
  debate: DebateFixture;
  open: boolean;
  onClose: () => void;
}) {
  const [type, setType] = useState<ContributionType>("new_claim");
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [target, setTarget] = useState("");
  const [evidenceTarget, setEvidenceTarget] = useState("");
  const [proposedLabel, setProposedLabel] =
    useState<EvidenceLabel>("partially_supports_claim");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { t } = useI18n();
  const auth = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

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

  // Focus management: focus into the panel on open, trap Tab, Escape closes.
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
  }, [open, onClose, done, type]);

  if (!open) return null;

  const needsPositionTarget =
    type === "new_claim" || type === "challenge_steelman";
  const needsClaimTarget =
    type === "new_source" || type === "challenge_evidence_label";
  const claimLinks = debate.evidence_links.filter(
    (l) => l.claim_id === target,
  );

  const similar =
    type === "new_claim" && body.trim().length > 15
      ? debate.claims
          .map((c) => {
            const words = (s: string) =>
              new Set(
                s
                  .toLowerCase()
                  .split(/\W+/)
                  .filter((w) => w.length > 3),
              );
            const a = words(body);
            const b = words(c.text);
            let overlap = 0;
            a.forEach((w) => b.has(w) && overlap++);
            return { claim: c, score: overlap / Math.sqrt(a.size * b.size || 1) };
          })
          .filter((x) => x.score >= 0.22)
          .sort((x, y) => y.score - x.score)
          .slice(0, 2)
          .map((x) => x.claim)
      : [];

  const valid =
    body.trim().length >= 12 &&
    (!needsPositionTarget || target) &&
    (!needsClaimTarget || target) &&
    (type !== "challenge_evidence_label" || evidenceTarget) &&
    (type !== "new_position" || title.trim().length >= 4) &&
    (type !== "new_source" || url.trim().startsWith("http"));

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        topic_id: debate.topic.id,
        type,
        body: body.trim(),
        title: title.trim() || undefined,
        url: url.trim() || undefined,
        proposed_label:
          type === "challenge_evidence_label" ? proposedLabel : undefined,
        target_object_id:
          type === "challenge_evidence_label"
            ? evidenceTarget
            : target || undefined,
      };
      if (isSupabaseConfigured) {
        if (!auth.user) {
          setError("Sign in on the You page before submitting a backend draft.");
          return;
        }
        await submitSupabaseContribution({
          ...payload,
          created_by: auth.user.id,
        });
      } else {
        submitContribution(payload);
      }
      setDone(true);
      setBody("");
      setTitle("");
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit contribution.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="slideover"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contribute-title"
    >
      <div className="slideover__backdrop" onClick={onClose} />
      <div className="slideover__panel" ref={panelRef}>
        <header className="slideover__head">
          <div>
            <p className="slideover__eyebrow">{t.contribute.improve}</p>
            <h2 className="slideover__title" id="contribute-title">
              {t.contribute.title}
            </h2>
          </div>
          <button
            className="slideover__close"
            onClick={onClose}
            aria-label={t.common.actions.close}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        {done ? (
          <div className="slideover__done">
            <span className="stamp stamp--inline">{t.contribute.submitted}</span>
            <h3>{t.contribute.pendingTitle}</h3>
            <p>{t.contribute.pendingBody}</p>
            <div className="slideover__doneactions">
              <Link to="/review" className="btn btn--primary" onClick={onClose}>
                {t.contribute.openReview}
              </Link>
              <button className="btn btn--ghost" onClick={() => setDone(false)}>
                {t.contribute.draftAnother}
              </button>
            </div>
          </div>
        ) : (
          <div className="slideover__body">
            <div className="field" role="radiogroup" aria-label={t.contribute.whatAdding}>
              <label className="field__label">{t.contribute.whatAdding}</label>
              <div className="typegrid">
                {t.contribute.types.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    role="radio"
                    aria-checked={type === choice.id}
                    className={`typecard${type === choice.id ? " typecard--active" : ""}`}
                    onClick={() => {
                      setType(choice.id);
                      setTarget("");
                      setEvidenceTarget("");
                    }}
                  >
                    <b>{choice.label}</b>
                    <span>{choice.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {needsPositionTarget && (
              <div className="field">
                <label className="field__label" htmlFor="contribute-position">
                  {t.contribute.whichPosition}
                </label>
                <select
                  id="contribute-position"
                  className="field__input"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="">{t.contribute.choosePosition}</option>
                  {debate.positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {letterOf(debate, p.id)} — {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {needsClaimTarget && (
              <div className="field">
                <label className="field__label" htmlFor="contribute-claim">
                  {t.contribute.whichClaim}
                </label>
                <select
                  id="contribute-claim"
                  className="field__input"
                  value={target}
                  onChange={(e) => {
                    setTarget(e.target.value);
                    setEvidenceTarget("");
                  }}
                >
                  <option value="">{t.contribute.chooseClaim}</option>
                  {debate.claims.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id.toUpperCase()} — {c.text}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {type === "challenge_evidence_label" && target && (
              <>
                <div className="field">
                  <label className="field__label" htmlFor="contribute-evlink">
                    {t.contribute.whichEvidenceLink}
                  </label>
                  <select
                    id="contribute-evlink"
                    className="field__input"
                    value={evidenceTarget}
                    onChange={(e) => setEvidenceTarget(e.target.value)}
                  >
                    <option value="">{t.contribute.chooseLink}</option>
                    {claimLinks.map((l) => {
                      const s = debate.sources.find(
                        (s) => s.id === l.source_id,
                      );
                      return (
                        <option key={l.id} value={l.id}>
                          {s?.publisher ?? l.source_id} · {t.contribute.currently} "
                          {t.common.evidenceLabels[l.label]}"
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" id="contribute-label-legend">
                    {t.contribute.shouldBeLabeled}
                  </label>
                  <div
                    className="labelpick"
                    role="radiogroup"
                    aria-labelledby="contribute-label-legend"
                  >
                    {PROPOSABLE_LABELS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        role="radio"
                        aria-checked={proposedLabel === l}
                        className={`evlabel evlabel--${l} labelpick__item${
                          proposedLabel === l ? " labelpick__item--active" : ""
                        }`}
                        onClick={() => setProposedLabel(l)}
                      >
                        {t.common.evidenceLabels[l]}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {type === "new_position" && (
              <div className="field">
                <label className="field__label" htmlFor="contribute-postitle">
                  {t.contribute.positionTitle}
                </label>
                <input
                  id="contribute-postitle"
                  className="field__input"
                  placeholder={t.contribute.positionTitlePlaceholder}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            )}

            {(type === "new_claim" || type === "new_source") && (
              <div className="field">
                <label className="field__label" htmlFor="contribute-url">
                  {t.contribute.sourceUrl}{" "}
                  {type === "new_claim" ? t.contribute.optional : ""}
                </label>
                <input
                  id="contribute-url"
                  className="field__input"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            )}

            <div className="field">
              <label className="field__label" htmlFor="contribute-body">
                {t.contribute.bodyLabels[type]}
              </label>
              <textarea
                id="contribute-body"
                className="field__input field__input--area"
                rows={5}
                placeholder={t.contribute.textareaPlaceholder}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {type === "new_claim" && similar.length > 0 && (
              <div className="dedup" role="region" aria-label={t.features.dedupTitle}>
                <p className="dedup__title">{t.features.dedupTitle}</p>
                <p className="dedup__hint">{t.features.dedupHint}</p>
                {similar.map((c) => (
                  <div key={c.id} className="dedup__row">
                    <span className="dedup__claim">{c.text}</span>
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      onClick={() => {
                        setType("new_source");
                        setTarget(c.id);
                      }}
                    >
                      {t.features.dedupUseIt}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="slideover__actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={!valid || submitting}
                onClick={submit}
              >
                {submitting ? "Submitting..." : t.contribute.submit}
              </button>
              <span className="slideover__hint">{t.contribute.hint}</span>
            </div>
            {isSupabaseConfigured && !auth.user && (
              <p className="form-error">Sign in before submitting backend drafts.</p>
            )}
            {error && <p className="form-error">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
