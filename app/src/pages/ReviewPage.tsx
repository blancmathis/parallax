import { useCallback, useEffect, useId, useState } from "react";
import { LocaleLink as Link } from "../i18n/links";
import type { Contribution } from "../types";
import { debateByTopicId, letterOf, slugOf } from "../data";
import { useI18n, type Locale } from "../i18n";
import {
  analyzeSeedPacket,
  loadReviewRevisionDraft,
  loadSupabaseReviewState,
  mergeContribution,
  publishRevision,
  reviewRevision,
  reviewSupabaseContribution,
  type ReviewRevisionItem,
  type SeedPacketItem,
  type SupabaseReviewState,
} from "../lib/backend";
import {
  normalizedReviewRationale,
  workflowCopy,
  workflowDecisionLabel,
  workflowErrorMessage,
  workflowProvenanceLabel,
  workflowStatusLabel,
  type DraftRevisionSnapshot,
  type WorkflowContribution,
  type WorkflowReviewDecision,
} from "../features/workflow/model";
import { DossierReviewQueue } from "../features/dossier/DossierViews";
import { DOSSIER_PILOT_TOPIC_ID } from "../features/dossier/model";
import { useAuth } from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase";
import { safeHttpUrl } from "../lib/url";
import { usePageTitle } from "../lib/ui";
import {
  resetDemoData,
  reviewContribution,
  reviewOf,
  useStore,
} from "../lib/store";

function formatReviewTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function targetDescription(
  c: Contribution,
  locale: Locale,
  t: ReturnType<typeof useI18n>["t"],
): string {
  const debate = debateByTopicId(c.topic_id, locale);
  if (!debate || !c.target_object_id) return "";
  const pos = debate.positions.find((p) => p.id === c.target_object_id);
  if (pos) return t.review.targetPosition(letterOf(debate, pos.id), pos.title);
  const claim = debate.claims.find((cl) => cl.id === c.target_object_id);
  if (claim) return t.review.targetClaim(claim.id, claim.text);
  const link = debate.evidence_links.find((l) => l.id === c.target_object_id);
  if (link) {
    const source = debate.sources.find((s) => s.id === link.source_id);
    const claim2 = debate.claims.find((cl) => cl.id === link.claim_id);
    return t.review.targetEvidence(
      source?.publisher ?? link.source_id,
      claim2?.id.toUpperCase() ?? link.claim_id,
    );
  }
  return c.target_object_id;
}

function PendingCard({ contribution }: { contribution: Contribution }) {
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState("");
  const { locale, t } = useI18n();
  const copy = workflowCopy(locale);
  const rationaleId = useId();
  const debate = debateByTopicId(contribution.topic_id, locale);
  const target = targetDescription(contribution, locale, t);
  const validRationale = normalizedReviewRationale(rationale);

  const decide = (decision: "approve" | "reject") => {
    if (!validRationale) {
      setError(copy.rationaleRequired);
      return;
    }
    if (!reviewContribution(contribution.id, decision, validRationale)) {
      setError(copy.rationaleRequired);
    }
  };

  return (
    <article className="rcard">
      <header className="rcard__head">
        <span className="rcard__type">{t.common.contributionLabels[contribution.type]}</span>
        {debate && (
          <Link to={`/debates/${slugOf(debate)}`} className="rcard__topic">
            {debate.topic.title}
          </Link>
        )}
        <span className="rcard__time">
          {formatReviewTime(contribution.created_at, locale)}
        </span>
      </header>

      {contribution.title && <h3 className="rcard__title">{contribution.title}</h3>}
      {target && <p className="rcard__target">{t.common.labels.on}: {target}</p>}
      <p className="rcard__body">{contribution.body}</p>
      {contribution.url && (
        <a
          className="rcard__url"
          href={safeHttpUrl(contribution.url)}
          target="_blank"
          rel="noreferrer"
        >
          {contribution.url} ↗
        </a>
      )}
      {contribution.proposed_label && (
        <p className="rcard__target">
          {t.common.labels.proposedLabel}:{" "}
          <span className={`evlabel evlabel--${contribution.proposed_label}`}>
            {t.common.evidenceLabels[contribution.proposed_label]}
          </span>
        </p>
      )}

      <div className="rcard__decision">
        <label className="sr-only" htmlFor={rationaleId}>
          {copy.rationaleLabel}
        </label>
        <input
          id={rationaleId}
          name="rationale"
          className="field__input"
          placeholder={copy.rationalePlaceholder}
          value={rationale}
          onChange={(e) => {
            setRationale(e.target.value);
            setError("");
          }}
          aria-describedby={`${rationaleId}-hint${error ? ` ${rationaleId}-error` : ""}`}
        />
        <p className="backend-note" id={`${rationaleId}-hint`}>{copy.rationaleRequired}</p>
        {error && (
          <p className="form-error" id={`${rationaleId}-error`} role="alert">
            {error}
          </p>
        )}
        <div className="rcard__buttons">
          <button
            type="button"
            className="btn btn--approve"
            disabled={!validRationale}
            onClick={() => decide("approve")}
          >
            {t.common.actions.approve}
          </button>
          <button
            type="button"
            className="btn btn--reject"
            disabled={!validRationale}
            onClick={() => decide("reject")}
          >
            {t.common.actions.reject}
          </button>
        </div>
      </div>
    </article>
  );
}

/** A read-only illustration of a pending item so first-time visitors can see
 *  what reviewing feels like without first drafting a contribution. It never
 *  touches the store — controls are inert and clearly marked as a sample. */
function SampleCard() {
  const { t } = useI18n();
  return (
    <article className="rcard rcard--sample" aria-hidden="true">
      <header className="rcard__head">
        <span className="rcard__type">{t.review.sampleType}</span>
        <span className="rcard__topic rcard__topic--static">
          {t.review.sampleTopic}
        </span>
        <span className="rcard__sampletag">{t.review.sampleTag}</span>
      </header>
      <p className="rcard__target">
        {t.common.labels.on}: {t.review.sampleTarget}
      </p>
      <p className="rcard__body">{t.review.sampleBody}</p>
      <div className="rcard__decision">
        <input
          className="field__input"
          placeholder={t.review.rationalePlaceholder}
          tabIndex={-1}
          readOnly
          aria-hidden="true"
        />
        <div className="rcard__buttons">
          <span className="btn btn--approve" aria-hidden="true">
            {t.common.actions.approve}
          </span>
          <span className="btn btn--reject" aria-hidden="true">
            {t.common.actions.reject}
          </span>
        </div>
      </div>
    </article>
  );
}

function BackendSeedPacketCard({
  packet,
  onRun,
  busy,
}: {
  packet: SeedPacketItem;
  onRun: (packetId: string) => void;
  busy: boolean;
}) {
  const { locale } = useI18n();
  const copy = workflowCopy(locale);
  const isFr = locale === "fr";
  return (
    <article className="rcard">
      <header className="rcard__head">
        <span className="rcard__type">{isFr ? "dossier de recherche" : "research seed packet"}</span>
        <span className={`rcard__verdict rcard__verdict--${packet.status}`}>
          {workflowStatusLabel(locale, packet.status)}
        </span>
        <span className="rcard__sampletag">
          {workflowProvenanceLabel(locale, packet.provenance)}
        </span>
      </header>
      <h3 className="rcard__title">{packet.topic_question}</h3>
      <p className="rcard__body">{packet.initial_position}</p>
      <p className="rcard__target">
        {copy.objectId}: {packet.id} · {copy.createdAt}: {formatReviewTime(packet.created_at, locale)}
      </p>
      {packet.initial_arguments.length > 0 && (
        <div>
          <b>{isFr ? "Arguments initiaux" : "Initial arguments"}</b>
          <ol>
            {packet.initial_arguments.map((argument, index) => (
              <li key={`${packet.id}-argument-${index}`}>{argument}</li>
            ))}
          </ol>
        </div>
      )}
      {packet.source_inputs.length > 0 && (
        <div className="source-status-list">
          {packet.source_inputs.map((source, index) => {
            const href = safeHttpUrl(source.url);
            return (
              <span key={`${packet.id}-${index}`} className="source-status-list__item">
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer">
                    {source.url} ↗
                  </a>
                ) : (
                  source.url ?? (isFr ? "source sans URL" : "source without URL")
                )}
                {source.note ? ` · ${source.note}` : ""}
              </span>
            );
          })}
        </div>
      )}
      {packet.error_message && (
        <p className="form-error" role="alert">{packet.error_message}</p>
      )}
      <div className="rcard__buttons">
        <button
          type="button"
          className="btn btn--primary btn--small"
          disabled={busy || packet.status === "analyzed"}
          onClick={() => onRun(packet.id)}
        >
          {packet.status === "analyzed"
            ? workflowStatusLabel(locale, "analyzed")
            : isFr
              ? "Lancer l’analyse IA simulée"
              : "Run mock AI analysis"}
        </button>
        {packet.generated_revision_id && (
          <span className="backend-note">
            {isFr ? "Brouillon" : "Draft"}: {packet.generated_revision_id}
          </span>
        )}
      </div>
    </article>
  );
}

function DraftRevisionInspector({ snapshot }: { snapshot: DraftRevisionSnapshot }) {
  const { locale } = useI18n();
  const copy = workflowCopy(locale);
  const isFr = locale === "fr";
  const origin = workflowProvenanceLabel(locale, "supabase");

  const empty = <p className="backend-note">{copy.noObjects}</p>;
  return (
    <section aria-label={copy.completeDraft}>
      <h4>{copy.completeDraft}</h4>
      <p className="rcard__target">
        {copy.objectId}: {snapshot.revision_id} · {copy.origin}: {origin}
      </p>

      <details open>
        <summary>{isFr ? "Positions" : "Positions"} ({snapshot.positions.length})</summary>
        {snapshot.positions.length === 0
          ? empty
          : snapshot.positions.map((position) => (
              <article key={position.id} className="rcard rcard--decided">
                <b>{position.title}</b>
                <p>{position.short_summary}</p>
                <p><b>Steelman:</b> {position.steelman}</p>
                <p className="rcard__target">
                  {position.id} · {workflowStatusLabel(locale, position.review_status)} · {origin}
                </p>
              </article>
            ))}
      </details>

      <details>
        <summary>{isFr ? "Arguments" : "Arguments"} ({snapshot.arguments.length})</summary>
        {snapshot.arguments.length === 0
          ? empty
          : snapshot.arguments.map((argument) => (
              <article key={argument.id} className="rcard rcard--decided">
                <b>{argument.direction} · {argument.position_id}</b>
                <p>{argument.summary}</p>
                <p className="rcard__target">
                  {isFr ? "Affirmations" : "Claims"}: {argument.claim_ids.join(", ") || "—"} · {origin}
                </p>
              </article>
            ))}
      </details>

      <details>
        <summary>{isFr ? "Affirmations" : "Claims"} ({snapshot.claims.length})</summary>
        {snapshot.claims.length === 0
          ? empty
          : snapshot.claims.map((claim) => (
              <article key={claim.id} className="rcard rcard--decided">
                <b>{claim.id} · {claim.claim_type.join(", ")}</b>
                <p>{claim.text}</p>
                <p className="rcard__target">
                  {workflowStatusLabel(locale, claim.review_status)} · {origin}
                </p>
              </article>
            ))}
      </details>

      <details>
        <summary>{isFr ? "Sources et extraits" : "Sources and excerpts"} ({snapshot.sources.length} + {snapshot.excerpts.length})</summary>
        {snapshot.sources.length === 0
          ? empty
          : snapshot.sources.map((source) => {
              const href = safeHttpUrl(source.url);
              return (
                <article key={source.id} className="rcard rcard--decided">
                  <b>{source.title} · {source.publisher}</b>
                  <p>{source.source_type} · {source.retrieval_status}</p>
                  {href ? (
                    <a className="rcard__url" href={href} target="_blank" rel="noreferrer">
                      {source.url} ↗
                    </a>
                  ) : (
                    <p className="form-error">{isFr ? "URL de source invalide" : "Invalid source URL"}</p>
                  )}
                  {source.quality_notes && <p>{source.quality_notes}</p>}
                  {snapshot.excerpts
                    .filter((excerpt) => excerpt.source_id === source.id)
                    .map((excerpt) => (
                      <blockquote key={excerpt.id}>
                        {excerpt.text}
                        <footer>{excerpt.locator} · {excerpt.extracted_by} · {origin}</footer>
                      </blockquote>
                    ))}
                  <p className="rcard__target">{source.id} · {origin}</p>
                </article>
              );
            })}
      </details>

      <details>
        <summary>{isFr ? "Liens de preuve" : "Evidence links"} ({snapshot.evidenceLinks.length})</summary>
        {snapshot.evidenceLinks.length === 0
          ? empty
          : snapshot.evidenceLinks.map((link) => (
              <article key={link.id} className="rcard rcard--decided">
                <b>{link.claim_id} ↔ {link.source_id}</b>
                <p>{link.label} · {Math.round(link.confidence * 100)}%</p>
                <p>{link.rationale}</p>
                <p className="rcard__target">
                  {workflowStatusLabel(locale, link.review_status)} · {origin}
                </p>
              </article>
            ))}
      </details>

      <details>
        <summary>{isFr ? "Valeurs" : "Values"} ({snapshot.values.length})</summary>
        {snapshot.values.length === 0
          ? empty
          : snapshot.values.map((value) => (
              <article key={value.id} className="rcard rcard--decided">
                <b>{value.name}</b>
                <p>{value.description}</p>
                <p className="rcard__target">
                  {isFr ? "Positions" : "Positions"}: {value.position_ids.join(", ") || "—"} · {origin}
                </p>
              </article>
            ))}
      </details>

      <details>
        <summary>{isFr ? "Arbitrages" : "Trade-offs"} ({snapshot.tradeoffs.length})</summary>
        {snapshot.tradeoffs.length === 0
          ? empty
          : snapshot.tradeoffs.map((tradeoff) => (
              <article key={tradeoff.id} className="rcard rcard--decided">
                <b>{tradeoff.position_id}</b>
                <p><b>{isFr ? "Gain" : "Gain"}:</b> {tradeoff.gain}</p>
                <p><b>{isFr ? "Coût" : "Cost"}:</b> {tradeoff.cost}</p>
                <p><b>{isFr ? "Risque" : "Risk"}:</b> {tradeoff.risk}</p>
                <p className="rcard__target">{origin}</p>
              </article>
            ))}
      </details>
    </section>
  );
}

function BackendRevisionCard({
  revision,
  isAdmin,
  onReview,
  onPublish,
  busy,
}: {
  revision: ReviewRevisionItem;
  isAdmin: boolean;
  onReview: (revisionId: string, decision: WorkflowReviewDecision, rationale: string) => void;
  onPublish: (revisionId: string) => void;
  busy: boolean;
}) {
  const [rationale, setRationale] = useState("");
  const [snapshot, setSnapshot] = useState<DraftRevisionSnapshot | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftError, setDraftError] = useState("");
  const { locale } = useI18n();
  const copy = workflowCopy(locale);
  const isFr = locale === "fr";
  const rationaleId = useId();
  const validRationale = normalizedReviewRationale(rationale);
  const canDecide = Boolean(snapshot && validRationale);

  const inspectDraft = async () => {
    setDraftBusy(true);
    setDraftError("");
    try {
      setSnapshot(await loadReviewRevisionDraft(revision.id));
    } catch (error) {
      setDraftError(workflowErrorMessage(error, copy.draftLoadFailed));
    } finally {
      setDraftBusy(false);
    }
  };

  return (
    <article className="rcard">
      <header className="rcard__head">
        <span className="rcard__type">{isFr ? "révision brouillon" : "draft revision"}</span>
        <Link to={revision.slug ? `/debates/${revision.slug}` : "/review"} className="rcard__topic">
          {revision.topic_title}
        </Link>
        <span className={`rcard__verdict rcard__verdict--${revision.review_status}`}>
          {workflowStatusLabel(locale, revision.review_status)}
        </span>
        <span className="rcard__sampletag">
          {workflowProvenanceLabel(locale, revision.provenance)}
        </span>
      </header>
      <h3 className="rcard__title">{revision.topic_question}</h3>
      <p className="rcard__target">
        {isFr ? "révision" : "revision"} {revision.revision_number} · {revision.id} · {formatReviewTime(revision.created_at, locale)}
      </p>
      {revision.review ? (
        <div className="rcard__rationale">
          <b>{copy.reviewHistory}: {workflowDecisionLabel(locale, revision.review.decision)}</b>
          <p>{revision.review.rationale || (isFr ? "Justification vide (ancienne décision)." : "Empty rationale (legacy decision).")}</p>
          <p className="rcard__target">{formatReviewTime(revision.review.reviewed_at, locale)}</p>
        </div>
      ) : (
        <p className="backend-note">{copy.reviewPending}</p>
      )}
      <button
        type="button"
        className="btn btn--ghost btn--small"
        disabled={draftBusy}
        onClick={inspectDraft}
      >
        {draftBusy ? copy.loadingDraft : snapshot ? copy.reloadDraft : copy.inspectDraft}
      </button>
      {draftError && <p className="form-error" role="alert">{draftError}</p>}
      {snapshot && <DraftRevisionInspector snapshot={snapshot} />}
      <div className="rcard__decision">
        <label className="sr-only" htmlFor={rationaleId}>{copy.rationaleLabel}</label>
        <input
          id={rationaleId}
          className="field__input"
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
          placeholder={copy.rationalePlaceholder}
          aria-label={copy.rationaleLabel}
          aria-describedby={`${rationaleId}-hint`}
        />
        <p className="backend-note" id={`${rationaleId}-hint`}>{copy.rationaleRequired}</p>
        {!snapshot && (
          <p className="backend-note">
            {isFr
              ? "Chargez le brouillon complet avant de prendre une décision."
              : "Load the complete draft before making a decision."}
          </p>
        )}
        <div className="rcard__buttons">
          <button
            type="button"
            className="btn btn--approve"
            disabled={busy || !canDecide}
            onClick={() => validRationale && onReview(revision.id, "approve", validRationale)}
          >
            {workflowDecisionLabel(locale, "approve")}
          </button>
          <button
            type="button"
            className="btn btn--reject"
            disabled={busy || !canDecide}
            onClick={() => validRationale && onReview(revision.id, "reject", validRationale)}
          >
            {workflowDecisionLabel(locale, "reject")}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy || !canDecide}
            onClick={() => validRationale && onReview(revision.id, "request_changes", validRationale)}
          >
            {workflowDecisionLabel(locale, "request_changes")}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy || !canDecide}
            onClick={() => validRationale && onReview(revision.id, "mark_contested", validRationale)}
          >
            {workflowDecisionLabel(locale, "mark_contested")}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy || !isAdmin || revision.review_status !== "approved"}
            onClick={() => onPublish(revision.id)}
            title={isAdmin
              ? isFr ? "Publier la révision approuvée" : "Publish approved revision"
              : isFr ? "Rôle administrateur requis" : "Admin role required"}
          >
            {isFr ? "Publier" : "Publish"}
          </button>
        </div>
      </div>
      {!isAdmin && (
        <p className="backend-note">
          {isFr
            ? "Le rôle reviewer peut réviser ; le rôle admin est requis pour publier."
            : "Reviewer role can review; admin role is required to publish."}
        </p>
      )}
    </article>
  );
}

const MERGEABLE_TYPES = new Set([
  "new_source",
  "new_claim",
  "challenge_evidence_label",
]);

function BackendContributionCard({
  contribution,
  onDecision,
  onMerge,
  isAdmin,
  busy,
}: {
  contribution: WorkflowContribution;
  onDecision: (contributionId: string, decision: "approve" | "reject", rationale: string) => void;
  onMerge: (contributionId: string) => void;
  isAdmin: boolean;
  busy: boolean;
}) {
  const [rationale, setRationale] = useState("");
  const { locale, t } = useI18n();
  const copy = workflowCopy(locale);
  const isFr = locale === "fr";
  const rationaleId = useId();
  const validRationale = normalizedReviewRationale(rationale);
  const mergeable = MERGEABLE_TYPES.has(contribution.type);
  return (
    <article className="rcard">
      <header className="rcard__head">
        <span className="rcard__type">{contribution.type.replace(/_/g, " ")}</span>
        <span className={`rcard__verdict rcard__verdict--${contribution.status}`}>
          {workflowStatusLabel(locale, contribution.status)}
        </span>
        <span className="rcard__sampletag">
          {workflowProvenanceLabel(locale, contribution.provenance)}
        </span>
      </header>
      {contribution.topic_title && (
        contribution.topic_slug ? (
          <Link className="rcard__topic" to={`/debates/${contribution.topic_slug}`}>
            {contribution.topic_title}
          </Link>
        ) : (
          <p className="rcard__topic">{contribution.topic_title}</p>
        )
      )}
      {contribution.title && <h3 className="rcard__title">{contribution.title}</h3>}
      {contribution.target_object_id && (
        <p className="rcard__target">
          {t.common.labels.on}: {contribution.target_object_id}
        </p>
      )}
      <p className="rcard__target">
        {copy.objectId}: {contribution.id} · {copy.createdAt}: {formatReviewTime(contribution.created_at, locale)}
      </p>
      <p className="rcard__body">{contribution.body}</p>
      {contribution.url && (
        <a
          className="rcard__url"
          href={safeHttpUrl(contribution.url)}
          target="_blank"
          rel="noreferrer"
        >
          {contribution.url} ↗
        </a>
      )}
      {contribution.proposed_label && (
        <p className="rcard__target">
          {t.common.labels.proposedLabel}:{" "}
          <span className={`evlabel evlabel--${contribution.proposed_label}`}>
            {t.common.evidenceLabels[contribution.proposed_label]}
          </span>
        </p>
      )}
      {contribution.review ? (
        <div className="rcard__rationale">
          <b>{copy.reviewHistory}: {workflowDecisionLabel(locale, contribution.review.decision)}</b>
          <p>{contribution.review.rationale || (isFr ? "Justification vide (ancienne décision)." : "Empty rationale (legacy decision).")}</p>
          <p className="rcard__target">{formatReviewTime(contribution.review.reviewed_at, locale)}</p>
        </div>
      ) : (
        <p className="backend-note">{copy.reviewPending}</p>
      )}
      {contribution.status === "submitted" && (
        <div className="rcard__decision">
          <label className="sr-only" htmlFor={rationaleId}>{copy.rationaleLabel}</label>
          <input
            id={rationaleId}
            className="field__input"
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
            placeholder={copy.rationalePlaceholder}
            aria-label={copy.rationaleLabel}
            aria-describedby={`${rationaleId}-hint`}
          />
          <p className="backend-note" id={`${rationaleId}-hint`}>{copy.rationaleRequired}</p>
          <div className="rcard__buttons">
            <button
              type="button"
              className="btn btn--approve"
              disabled={busy || !validRationale}
              onClick={() => validRationale && onDecision(contribution.id, "approve", validRationale)}
            >
              {workflowDecisionLabel(locale, "approve")}
            </button>
            <button
              type="button"
              className="btn btn--reject"
              disabled={busy || !validRationale}
              onClick={() => validRationale && onDecision(contribution.id, "reject", validRationale)}
            >
              {workflowDecisionLabel(locale, "reject")}
            </button>
          </div>
        </div>
      )}
      {contribution.status === "accepted" && !contribution.merged_revision_id && (
        <div className="rcard__decision">
          <button
            className="btn btn--primary"
            disabled={busy || !isAdmin || !mergeable}
            title={
              !isAdmin
                ? t.review.mergeAdminOnly
                : !mergeable
                  ? t.review.mergeDeferred
                  : t.review.mergeHint
            }
            onClick={() => onMerge(contribution.id)}
          >
            {t.review.mergeAction}
          </button>
          {!isAdmin && <p className="backend-note">{t.review.mergeAdminOnly}</p>}
          {isAdmin && !mergeable && (
            <p className="backend-note">{t.review.mergeDeferred}</p>
          )}
        </div>
      )}
      {contribution.merged_revision_id && (
        <p className="backend-note">
          {copy.mergedRevision}: {contribution.merged_revision_id}
          {contribution.topic_slug && (
            <> · <Link className="link" to={`/debates/${contribution.topic_slug}`}>
              {isFr ? "ouvrir le débat" : "open debate"}
            </Link></>
          )}
        </p>
      )}
    </article>
  );
}

function BackendReviewPage() {
  const auth = useAuth();
  const { locale, t } = useI18n();
  const copy = workflowCopy(locale);
  const isFr = locale === "fr";
  const [state, setState] = useState<SupabaseReviewState>({
    revisions: [],
    seedPackets: [],
    contributions: [],
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  usePageTitle(t.meta.titleReview);

  const reload = useCallback(async () => {
    if (!auth.isReviewer) return false;
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      setState(await loadSupabaseReviewState());
      return true;
    } catch (error) {
      setErrorMessage(
        workflowErrorMessage(
          error,
          isFr
            ? "Impossible de charger la file de révision backend."
            : "Could not load backend review queue.",
        ),
      );
      return false;
    } finally {
      setBusy(false);
    }
  }, [auth.isReviewer, isFr]);

  useEffect(() => {
    queueMicrotask(() => {
      setState({ revisions: [], seedPackets: [], contributions: [] });
      setMessage("");
      setErrorMessage("");
      void reload();
    });
  }, [auth.profile?.role, auth.user?.id, reload]);

  const runMock = async (packetId: string) => {
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      await analyzeSeedPacket(packetId, "mock");
      if (await reload()) {
        setMessage(isFr ? "Brouillon IA simulé généré." : "Mock AI draft generated.");
      }
    } catch (error) {
      setErrorMessage(
        workflowErrorMessage(
          error,
          isFr ? "Échec de la génération IA simulée." : "Mock AI generation failed.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const decideRevision = async (
    revisionId: string,
    decision: WorkflowReviewDecision,
    rationale: string,
  ) => {
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      await reviewRevision(revisionId, decision, rationale);
      if (await reload()) {
        setMessage(
          isFr
            ? `Décision enregistrée : ${workflowDecisionLabel(locale, decision)}.`
            : `Decision recorded: ${workflowDecisionLabel(locale, decision)}.`,
        );
      }
    } catch (error) {
      setErrorMessage(
        workflowErrorMessage(
          error,
          isFr ? "Échec de la révision du brouillon." : "Revision review failed.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const publish = async (revisionId: string) => {
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      const slug = await publishRevision(revisionId);
      if (await reload()) {
        setMessage(isFr ? `Publié : /debates/${slug}.` : `Published: /debates/${slug}.`);
      }
    } catch (error) {
      setErrorMessage(
        workflowErrorMessage(error, isFr ? "Échec de la publication." : "Publish failed."),
      );
    } finally {
      setBusy(false);
    }
  };

  const decideContribution = async (
    contributionId: string,
    decision: "approve" | "reject",
    rationale: string,
  ) => {
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      await reviewSupabaseContribution(contributionId, decision, rationale);
      if (await reload()) {
        setMessage(
          isFr
            ? `Décision enregistrée : ${workflowDecisionLabel(locale, decision)}.`
            : `Decision recorded: ${workflowDecisionLabel(locale, decision)}.`,
        );
      }
    } catch (error) {
      setErrorMessage(
        workflowErrorMessage(
          error,
          isFr ? "Échec de la révision de la contribution." : "Contribution review failed.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const mergeAccepted = async (contributionId: string) => {
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      const slug = await mergeContribution(contributionId);
      if (await reload()) setMessage(t.review.mergeDone(slug));
    } catch (error) {
      setErrorMessage(workflowErrorMessage(error, t.review.mergeFailed));
    } finally {
      setBusy(false);
    }
  };

  if (auth.status === "loading") {
    return (
      <main className="page reviewpage" id="main">
        <p className="backend-note">{isFr ? "Chargement de la session…" : "Loading session…"}</p>
      </main>
    );
  }

  if (!auth.user) {
    return (
      <main className="page reviewpage" id="main">
        <header className="reviewpage__head">
          <p className="section__eyebrow">{t.review.eyebrow}</p>
          <h1 className="section__title section__title--big">
            {isFr ? "La révision backend requiert une connexion." : "Backend review requires login."}
          </h1>
          <p className="section__lede">
            {isFr
              ? "Connectez-vous sur la page Vous, puis revenez à la file."
              : "Sign in on the You page, then return to the queue."}
          </p>
          <Link to="/you" className="btn btn--primary">
            {isFr ? "Ouvrir le compte" : "Open account"}
          </Link>
        </header>
      </main>
    );
  }

  if (!auth.isReviewer) {
    return (
      <main className="page reviewpage" id="main">
        <header className="reviewpage__head">
          <p className="section__eyebrow">{t.review.eyebrow}</p>
          <h1 className="section__title section__title--big">
            {isFr ? "Rôle reviewer requis." : "Reviewer role required."}
          </h1>
          <p className="section__lede">
            {isFr
              ? "Les utilisateurs normaux peuvent créer des brouillons et des contributions, mais pas les réviser ni les publier."
              : "Normal users can create drafts and contributions, but cannot review or publish."}
          </p>
          <Link to="/you" className="btn btn--ghost">
            {isFr ? "Changer de compte" : "Switch account"}
          </Link>
        </header>
      </main>
    );
  }

  return (
    <main className="page reviewpage" id="main">
      <header className="reviewpage__head">
        <p className="section__eyebrow">{t.review.eyebrow}</p>
        <h1 className="section__title section__title--big">
          {isFr ? "File de révision backend" : "Backend review queue"}
          <br />
          <em>
            {auth.isAdmin
              ? isFr ? "publication admin activée" : "admin publish enabled"
              : isFr ? "mode reviewer" : "reviewer mode"}
          </em>
        </h1>
        <p className="section__lede">
          {isFr
            ? "Brouillons, dossiers de recherche, contributions et publication atomique adossés à Supabase."
            : "Supabase-backed drafts, seed packets, contribution reviews, and atomic publish."}
        </p>
        <p className="bridgenote">{t.features.bridgeNote}</p>
        {message && <p className="backend-note" role="status">{message}</p>}
        {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
        <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={reload}>
          {isFr ? "Actualiser la file" : "Refresh queue"}
        </button>
      </header>

      <DossierReviewQueue
        topicId={DOSSIER_PILOT_TOPIC_ID}
        isAdmin={auth.isAdmin}
      />

      <section className="reviewpage__section">
        <h2 className="reviewpage__subtitle">
          {copy.seedPackets} <span className="fold__count">{state.seedPackets.length}</span>
        </h2>
        {state.seedPackets.length === 0 ? (
          <p className="reviewpage__emptyhint">
            {isFr ? "Aucun dossier de recherche visible pour ce rôle." : "No seed packets visible to this role."}
          </p>
        ) : (
          state.seedPackets.map((packet) => (
            <BackendSeedPacketCard
              key={packet.id}
              packet={packet}
              busy={busy}
              onRun={runMock}
            />
          ))
        )}
      </section>

      <section className="reviewpage__section">
        <h2 className="reviewpage__subtitle">
          {isFr ? "Révisions brouillon" : "Draft revisions"} <span className="fold__count">{state.revisions.length}</span>
        </h2>
        {state.revisions.length === 0 ? (
          <p className="reviewpage__emptyhint">
            {isFr ? "Aucune révision brouillon visible pour ce rôle." : "No draft revisions visible to this role."}
          </p>
        ) : (
          state.revisions.map((revision) => (
            <BackendRevisionCard
              key={revision.id}
              revision={revision}
              isAdmin={auth.isAdmin}
              busy={busy}
              onReview={decideRevision}
              onPublish={publish}
            />
          ))
        )}
      </section>

      <section className="reviewpage__section">
        <h2 className="reviewpage__subtitle">
          {copy.contributions} <span className="fold__count">{state.contributions.length}</span>
        </h2>
        {state.contributions.length === 0 ? (
          <p className="reviewpage__emptyhint">
            {isFr ? "Aucune contribution visible pour ce rôle." : "No submitted contributions visible to this role."}
          </p>
        ) : (
          state.contributions.map((contribution) => (
            <BackendContributionCard
              key={contribution.id}
              contribution={contribution}
              busy={busy}
              onDecision={decideContribution}
              onMerge={mergeAccepted}
              isAdmin={auth.isAdmin}
            />
          ))
        )}
      </section>
    </main>
  );
}

function LocalReviewPage() {
  const store = useStore();
  const { locale, t } = useI18n();
  usePageTitle(t.meta.titleReview);
  const pendingTitleId = useId();
  const decidedTitleId = useId();
  const pending = store.contributions.filter((c) => c.status === "submitted");
  const decided = [...store.contributions]
    .filter((c) => c.status !== "submitted")
    .reverse();

  return (
    <main className="page reviewpage" id="main">
      <header className="reviewpage__head">
        <p className="section__eyebrow">{t.review.eyebrow}</p>
        <h1 className="section__title section__title--big reviewpage__title">
          <span className="reviewpage__titleline">{t.review.title}</span>
          <em className="reviewpage__titleline">{t.review.titleEm}</em>
        </h1>
        <p className="section__lede">{t.review.lede}</p>
        <p className="bridgenote">{t.features.bridgeNote}</p>
      </header>

      <section className="reviewpage__section" aria-labelledby={pendingTitleId}>
        <h2 className="reviewpage__subtitle" id={pendingTitleId}>
          {t.common.labels.pending} <span className="fold__count">{pending.length}</span>
        </h2>
        {pending.length === 0 ? (
          <div className="reviewpage__empty">
            <p>{t.review.clear}</p>
            <p className="reviewpage__emptyhint">
              {t.review.emptyHintStart} <b>{t.review.emptyHintButton}</b>{" "}
              {t.review.emptyHintEnd}
            </p>
            <Link to="/debates" className="btn btn--ghost">
              {t.common.actions.browseDebates} →
            </Link>
            <div className="reviewpage__sample">
              <p className="reviewpage__samplehint">{t.review.sampleHint}</p>
              <SampleCard />
            </div>
          </div>
        ) : (
          pending.map((c) => <PendingCard key={c.id} contribution={c} />)
        )}
      </section>

      {decided.length > 0 && (
        <section className="reviewpage__section" aria-labelledby={decidedTitleId}>
          <h2 className="reviewpage__subtitle" id={decidedTitleId}>
            {t.common.labels.decided} <span className="fold__count">{decided.length}</span>
          </h2>
          {decided.map((c) => {
            const review = reviewOf(store, c.id);
            const debate = debateByTopicId(c.topic_id, locale);
            return (
              <article key={c.id} className="rcard rcard--decided">
                <header className="rcard__head">
                  <span
                    className={`rcard__verdict rcard__verdict--${c.status}`}
                  >
                    {t.common.contributionStatusLabels[c.status]}
                  </span>
                  <span className="rcard__type">
                    {t.common.contributionLabels[c.type]}
                  </span>
                  {debate && (
                    <Link
                      to={`/debates/${slugOf(debate)}`}
                      className="rcard__topic"
                    >
                      {debate.topic.title}
                    </Link>
                  )}
                </header>
                <p className="rcard__body">{c.body}</p>
                {review && review.rationale && (
                  <p className="rcard__rationale">
                    <b>{t.common.labels.reviewer}:</b> {review.rationale}
                  </p>
                )}
              </article>
            );
          })}
          <button className="reviewpage__reset" onClick={resetDemoData}>
            {t.common.actions.resetDemo}
          </button>
        </section>
      )}
    </main>
  );
}

export default function ReviewPage() {
  return isSupabaseConfigured ? <BackendReviewPage /> : <LocalReviewPage />;
}
