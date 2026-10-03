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
import { safeHttpUrl } from "../lib/url";
import { submitContribution } from "../lib/store";
import {
  withWorkflowContribution,
  workflowCopy,
  workflowErrorMessage,
  workflowProvenanceLabel,
  workflowStatusLabel,
  type WorkflowContribution,
} from "../features/workflow/model";
import { ClaimDossierForm } from "../features/dossier/ClaimDossierForm";
import { DOSSIER_PILOT_TOPIC_ID } from "../features/dossier/model";

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
  dossierChallengeEvidenceLinkId = null,
}: {
  debate: DebateFixture;
  open: boolean;
  onClose: () => void;
  dossierChallengeEvidenceLinkId?: string | null;
}) {
  const [type, setType] = useState<ContributionType>("new_claim");
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [target, setTarget] = useState("");
  const [evidenceTarget, setEvidenceTarget] = useState("");
  const [proposedLabel, setProposedLabel] =
    useState<EvidenceLabel>("partially_supports_claim");
  const [submitted, setSubmitted] = useState<WorkflowContribution | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dossierMode, setDossierMode] = useState(
    Boolean(dossierChallengeEvidenceLinkId),
  );
  const { locale, t } = useI18n();
  const copy = workflowCopy(locale);
  const isFr = locale === "fr";
  const auth = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      setSubmitted(null);
      restoreRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setType("new_claim");
      setBody("");
      setTitle("");
      setUrl("");
      setTarget("");
      setEvidenceTarget("");
      setSubmitted(null);
      setError("");
    });
    return () => {
      cancelled = true;
    };
  }, [debate.topic.id]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled && open && dossierChallengeEvidenceLinkId) {
        setDossierMode(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dossierChallengeEvidenceLinkId, open]);

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
  }, [dossierMode, open, onClose, submitted, type]);

  if (!open) return null;

  const needsPositionTarget =
    type === "new_claim" || type === "challenge_steelman";
  const needsClaimTarget =
    type === "new_source" || type === "challenge_evidence_label";
  const claimLinks = debate.evidence_links.filter(
    (l) => l.claim_id === target,
  );
  const normalizedUrl = url.trim();
  const validatedUrl = safeHttpUrl(normalizedUrl);
  const hasUrl = normalizedUrl.length > 0;
  const urlIsValid = !hasUrl || Boolean(validatedUrl);

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
    (type !== "new_source" || Boolean(validatedUrl)) &&
    urlIsValid;

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
        url: validatedUrl,
        proposed_label:
          type === "challenge_evidence_label" ? proposedLabel : undefined,
        target_object_id:
          type === "challenge_evidence_label"
            ? evidenceTarget
            : target || undefined,
      };
      let created: WorkflowContribution;
      if (isSupabaseConfigured) {
        if (!auth.user) {
          setError(
            isFr
              ? "Connectez-vous sur la page Vous avant d’envoyer un brouillon backend."
              : "Sign in on the You page before submitting a backend draft.",
          );
          return;
        }
        created = await submitSupabaseContribution({
          ...payload,
          created_by: auth.user.id,
        });
      } else {
        created = withWorkflowContribution(
          submitContribution(payload),
          "local",
        );
      }
      setSubmitted(created);
      setBody("");
      setTitle("");
      setUrl("");
    } catch (err) {
      setError(
        workflowErrorMessage(
          err,
          isFr ? "Impossible d’envoyer la contribution." : "Could not submit contribution.",
          {
            locale,
            context: "submit",
            reference: `contribution-submit:${debate.topic.id}`,
          },
        ),
      );
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

        {submitted ? (
          <div className="slideover__done">
            <span className="stamp stamp--inline">{t.contribute.submitted}</span>
            <h3>{t.contribute.pendingTitle}</h3>
            <p>{t.contribute.pendingBody}</p>
            <article className="rcard">
              <header className="rcard__head">
                <span className="rcard__type">
                  {t.common.contributionLabels[submitted.type]}
                </span>
                <span className={`rcard__verdict rcard__verdict--${submitted.status}`}>
                  {workflowStatusLabel(locale, submitted.status)}
                </span>
                <span className="rcard__sampletag">
                  {workflowProvenanceLabel(locale, submitted.provenance)}
                </span>
              </header>
              {submitted.title && <h4>{submitted.title}</h4>}
              {submitted.target_object_id && (
                <p className="rcard__target">
                  {t.common.labels.on}: {submitted.target_object_id}
                </p>
              )}
              <p className="rcard__body">{submitted.body}</p>
              {safeHttpUrl(submitted.url) && (
                <a
                  className="rcard__url"
                  href={safeHttpUrl(submitted.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {submitted.url} ↗
                </a>
              )}
              {submitted.proposed_label && (
                <p className="rcard__target">
                  {t.common.labels.proposedLabel}: {t.common.evidenceLabels[submitted.proposed_label]}
                </p>
              )}
              <p className="rcard__target">
                {copy.objectId}: {submitted.id} · {copy.origin}: {workflowProvenanceLabel(locale, submitted.provenance)}
              </p>
            </article>
            <div className="slideover__doneactions">
              <Link
                to={submitted.provenance === "supabase" ? "/you" : "/review"}
                className="btn btn--primary"
                onClick={onClose}
              >
                {submitted.provenance === "supabase"
                  ? copy.backendSubmissions
                  : t.contribute.openReview}
              </Link>
              <button className="btn btn--ghost" onClick={() => setSubmitted(null)}>
                {t.contribute.draftAnother}
              </button>
            </div>
          </div>
        ) : dossierMode ? (
          <div className="slideover__body">
            <ClaimDossierForm
              debate={debate}
              challengeEvidenceLinkId={dossierChallengeEvidenceLinkId}
              onCancel={() => setDossierMode(false)}
            />
          </div>
        ) : (
          <div className="slideover__body">
            {debate.topic.id === DOSSIER_PILOT_TOPIC_ID && (
              <div className="dossier-boundary">
                <b>Need a reviewable claim with exact source passages?</b>
                <p>
                  The bounded evidence-dossier pilot captures two distinct sources,
                  hashes the artefacts, records exact UTF-8 excerpt offsets, and keeps
                  publication as a separate reviewed step.
                </p>
                <button
                  type="button"
                  className="btn btn--primary btn--small"
                  onClick={() => setDossierMode(true)}
                >
                  Open reviewed evidence dossier
                </button>
              </div>
            )}
            <fieldset className="field field--choice">
              <legend className="field__label">{t.contribute.whatAdding}</legend>
              <div className="typegrid">
                {t.contribute.types.map((choice) => (
                  <label
                    key={choice.id}
                    className={`typecard${type === choice.id ? " typecard--active" : ""}`}
                  >
                    <input
                      className="choice-radio"
                      type="radio"
                      name="contribution-type"
                      value={choice.id}
                      checked={type === choice.id}
                      onChange={() => {
                        setType(choice.id);
                        setTarget("");
                        setEvidenceTarget("");
                      }}
                    />
                    <b>{choice.label}</b>
                    <span>{choice.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

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
                <fieldset className="field field--choice">
                  <legend className="field__label">
                    {t.contribute.shouldBeLabeled}
                  </legend>
                  <div className="labelpick">
                    {PROPOSABLE_LABELS.map((l) => (
                      <label
                        key={l}
                        className={`evlabel evlabel--${l} labelpick__item${
                          proposedLabel === l ? " labelpick__item--active" : ""
                        }`}
                      >
                        <input
                          className="choice-radio"
                          type="radio"
                          name="proposed-evidence-label"
                          value={l}
                          checked={proposedLabel === l}
                          onChange={() => setProposedLabel(l)}
                        />
                        <span>{t.common.evidenceLabels[l]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
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
                  maxLength={2048}
                  aria-invalid={(hasUrl && !urlIsValid) || undefined}
                  aria-describedby={
                    hasUrl && !urlIsValid
                      ? "contribute-url-hint contribute-url-error"
                      : "contribute-url-hint"
                  }
                />
                <p className="field__hint" id="contribute-url-hint">
                  {t.contribute.sourceUrlHint}
                </p>
                {hasUrl && !urlIsValid && (
                  <p
                    className="form-error"
                    id="contribute-url-error"
                    role="alert"
                  >
                    {t.contribute.sourceUrlInvalid}
                  </p>
                )}
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
                {submitting
                  ? isFr ? "Envoi…" : "Submitting…"
                  : t.contribute.submit}
              </button>
              <span className="slideover__hint">{t.contribute.hint}</span>
            </div>
            {isSupabaseConfigured && !auth.user && (
              <p className="form-error" role="alert">
                {isFr
                  ? "Connectez-vous avant d’envoyer des brouillons backend."
                  : "Sign in before submitting backend drafts."}
              </p>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
