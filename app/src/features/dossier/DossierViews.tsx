import { useCallback, useEffect, useId, useState } from "react";
import { LocaleLink as Link } from "../../i18n/links";
import { useI18n } from "../../i18n";
import { safeHttpUrl } from "../../lib/url";
import {
  normalizedReviewRationale,
  workflowErrorMessage,
} from "../workflow/model";
import {
  getClaimDossierDetail,
  getMyClaimDossiers,
  getPublicClaimDossiers,
  getReviewClaimDossiers,
  prepareClaimDossierRevision,
  reviewClaimDossier,
  type ClaimDossierEvidenceRecord,
  type ClaimDossierRecord,
  type ClaimDossierReviewDecision,
  type PrepareClaimDossierResult,
} from "./api";
import { ClaimDossierForm } from "./ClaimDossierForm";
import { debateByTopicId } from "../../data";
import "./dossier.css";

type DossierAudience = "reviewer" | "public" | "self";

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "Change set could not be displayed.";
  }
}

function EvidenceRecordCard({
  evidence,
  audience,
}: {
  evidence: ClaimDossierEvidenceRecord;
  audience: DossierAudience;
}) {
  const href = safeHttpUrl(evidence.artifact.final_url || evidence.artifact.requested_url);
  return (
    <article
      className="dossier-evidence-card"
      data-testid={`dossier-${audience}-${evidence.research_role}-evidence`}
    >
      <header className="rcard__head">
        <span className="rcard__type">{evidence.research_role} research role</span>
        <span className={`evlabel evlabel--${evidence.label}`}>{evidence.label.replace(/_/g, " ")}</span>
      </header>
      <p>
        <b>{evidence.artifact.title || "Captured source"}</b><br />
        {evidence.artifact.publisher}
      </p>
      {href && (
        <a href={href} target="_blank" rel="noreferrer" className="rcard__url">
          {href} ↗
        </a>
      )}
      <p className="dossier-note">
        Capture: <b>{evidence.artifact.status}</b> · {evidence.artifact.byte_length} bytes
      </p>
      <dl className="dossier-hashes">
        <div><dt>Raw artifact hash</dt><dd>{evidence.artifact.raw_hash ?? "not available"}</dd></div>
        <div><dt>Normalized text hash</dt><dd>{evidence.artifact.normalized_hash ?? "not available"}</dd></div>
        <div><dt>Excerpt hash</dt><dd>{evidence.excerpt_hash || "not available"}</dd></div>
      </dl>
      <p className="dossier-excerpt__meta">
        {evidence.locator} · bytes {evidence.start_offset}–{evidence.end_offset} · {evidence.offset_unit}
      </p>
      <blockquote>{evidence.exact_excerpt}</blockquote>
      <p>{evidence.rationale}</p>
      {audience === "reviewer" && evidence.artifact.normalized_text && (
        <details>
          <summary>Inspect captured normalized text</summary>
          <pre className="dossier-diff" data-testid="dossier-review-artifact-text">
            {evidence.artifact.normalized_text}
          </pre>
        </details>
      )}
    </article>
  );
}

function DossierRecordCard({
  dossier,
  audience,
  children,
}: {
  dossier: ClaimDossierRecord;
  audience: DossierAudience;
  children?: React.ReactNode;
}) {
  return (
    <article className="rcard dossier-card">
      <header className="rcard__head">
        <span className="rcard__type">
          {dossier.submission_kind === "challenge" ? "evidence challenge" : "claim dossier"}
        </span>
        <span className={`rcard__verdict rcard__verdict--${dossier.status}`}>
          {dossier.status.replace(/_/g, " ")}
        </span>
        <span className="rcard__sampletag">reviewed evidence workflow</span>
      </header>
      <h3>{dossier.claim_text}</h3>
      <dl className="dossier-card__facts">
        <div><dt>Dossier ID</dt><dd><code>{dossier.id}</code></dd></div>
        <div><dt>Base revision</dt><dd><code>{dossier.base_revision_id}</code></dd></div>
        <div><dt>Position</dt><dd><code>{dossier.target_position_id}</code></dd></div>
        <div><dt>Profile</dt><dd>{dossier.claim_profile} · {dossier.language}</dd></div>
        <div><dt>Argument direction</dt><dd>{dossier.argument_direction}</dd></div>
        <div><dt>Created</dt><dd>{dossier.created_at || "not exposed"}</dd></div>
      </dl>
      {dossier.target_evidence_link_id && (
        <p className="dossier-challenge-target">
          Contests evidence link <code>{dossier.target_evidence_link_id}</code>
        </p>
      )}
      <div>
        <b>Scope</b>
        <p>{dossier.scope_note}</p>
      </div>
      <div>
        <b>Structured argument</b>
        <p>{dossier.argument_summary}</p>
      </div>
      <div className="dossier-evidence-grid">
        {dossier.evidence.map((evidence) => (
          <EvidenceRecordCard key={evidence.id} evidence={evidence} audience={audience} />
        ))}
      </div>
      {dossier.review && (
        <div className="rcard__rationale">
          <b>Review: {dossier.review.decision.replace(/_/g, " ")}</b>
          <p>{dossier.review.rationale}</p>
          {dossier.review.reviewed_at && <p className="rcard__target">{dossier.review.reviewed_at}</p>}
        </div>
      )}
      {dossier.change_set && (
        <details open={audience === "reviewer"}>
          <summary>Exact prepared revision diff</summary>
          <p className="dossier-note">
            Base {dossier.change_set.base_snapshot_hash ?? "hash unavailable"} → prepared {dossier.change_set.prepared_snapshot_hash ?? "hash unavailable"}
          </p>
          <p className="dossier-note">
            Change hash: {dossier.change_set.change_hash ?? "not available"}
          </p>
          <pre className="dossier-diff" data-testid="dossier-change-set">
            {prettyJson(dossier.change_set.changes)}
          </pre>
        </details>
      )}
      {children}
    </article>
  );
}

function ReviewDossierCard({
  dossier,
  isAdmin,
  busy,
  onReload,
  onMessage,
  onError,
}: {
  dossier: ClaimDossierRecord;
  isAdmin: boolean;
  busy: boolean;
  onReload: () => Promise<void>;
  onMessage: (value: string) => void;
  onError: (value: string) => void;
}) {
  const [rationale, setRationale] = useState("");
  const [localBusy, setLocalBusy] = useState(false);
  const [detail, setDetail] = useState<ClaimDossierRecord | null>(null);
  const [detailError, setDetailError] = useState("");
  const rationaleId = useId();
  const validRationale = normalizedReviewRationale(rationale);
  const canReview = dossier.status === "submitted";

  const inspect = async () => {
    setLocalBusy(true);
    setDetailError("");
    try {
      setDetail(await getClaimDossierDetail(dossier.id));
    } catch (error) {
      setDetailError(workflowErrorMessage(error, "Could not load the full dossier."));
    } finally {
      setLocalBusy(false);
    }
  };

  const decide = async (decision: ClaimDossierReviewDecision) => {
    if (!validRationale) return;
    setLocalBusy(true);
    onError("");
    onMessage("");
    try {
      await reviewClaimDossier(dossier.id, decision, validRationale);
      onMessage(`Dossier decision recorded: ${decision.replace(/_/g, " ")}.`);
      await onReload();
    } catch (error) {
      onError(workflowErrorMessage(error, "Could not review the evidence dossier."));
    } finally {
      setLocalBusy(false);
    }
  };

  const prepare = async () => {
    setLocalBusy(true);
    onError("");
    onMessage("");
    try {
      const result: PrepareClaimDossierResult = await prepareClaimDossierRevision(dossier.id);
      onMessage(
        `Draft revision prepared: ${result.revision_id} · change set ${result.change_set_id}. Nothing was published.`,
      );
      await onReload();
    } catch (error) {
      onError(workflowErrorMessage(error, "Could not prepare the draft revision."));
    } finally {
      setLocalBusy(false);
    }
  };

  const disabled = busy || localBusy;
  return (
    <DossierRecordCard dossier={detail ?? dossier} audience="reviewer">
      <div>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          disabled={disabled}
          onClick={inspect}
        >
          {detail ? "Reload full dossier" : "Inspect full dossier"}
        </button>
        <p className="dossier-note">
          Full normalized source text is restricted to the owner and reviewers.
          Load it before deciding.
        </p>
        {detailError && <p className="form-error" role="alert">{detailError}</p>}
      </div>
      {canReview && (
        <div className="rcard__decision">
          <label className="field" htmlFor={rationaleId}>
            <span className="field__label">Dossier review rationale</span>
            <textarea
              id={rationaleId}
              className="field__input"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              placeholder="Required rationale (8 characters minimum)."
            />
          </label>
          <p className="dossier-note">
            Review structure, exact evidence, scope, and the proposed change. Approval
            means eligible for draft preparation—not true, complete, or published.
          </p>
          <div className="rcard__buttons">
            <button type="button" className="btn btn--ghost" disabled={disabled || !detail || !validRationale} onClick={() => decide("request_changes")}>
              Request changes
            </button>
            <button type="button" className="btn btn--approve" disabled={disabled || !detail || !validRationale} onClick={() => decide("approve")}>
              Approve dossier
            </button>
            <button type="button" className="btn btn--reject" disabled={disabled || !detail || !validRationale} onClick={() => decide("reject")}>
              Reject dossier
            </button>
          </div>
        </div>
      )}
      {dossier.status === "accepted" && !dossier.prepared_revision_id && (
        <div>
          <button type="button" className="btn btn--primary" disabled={disabled || !isAdmin} onClick={prepare}>
            Prepare draft revision
          </button>
          <p className="dossier-note">
            {isAdmin
              ? "Creates an inspectable draft and exact diff only. It does not publish or establish the claim."
              : "Admin role required. Reviewers can approve the dossier but cannot prepare or publish a revision."}
          </p>
        </div>
      )}
      {dossier.prepared_revision_id && (
        <p className="backend-note">
          Prepared draft revision: <code>{dossier.prepared_revision_id}</code>. It must be separately reviewed before an admin can publish it.
        </p>
      )}
    </DossierRecordCard>
  );
}

export function DossierReviewQueue({
  topicId,
  isAdmin,
}: {
  topicId: string;
  isAdmin: boolean;
}) {
  const [dossiers, setDossiers] = useState<ClaimDossierRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setDossiers(await getReviewClaimDossiers(topicId));
      setError("");
    } catch (loadError) {
      setError(workflowErrorMessage(loadError, "Could not load claim dossiers."));
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void reload();
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  return (
    <section className="reviewpage__section dossier-queue" aria-labelledby="dossier-review-title">
      <header>
        <h2 className="reviewpage__subtitle" id="dossier-review-title">
          Claim evidence dossiers <span className="fold__count">{dossiers.length}</span>
        </h2>
        <p className="dossier-note">
          Human-only bounded pilot. Research roles are coverage roles; labels describe
          a passage/claim relationship. Retrieval failure is never counter-evidence.
        </p>
        <button type="button" className="btn btn--ghost btn--small" disabled={loading} onClick={reload}>
          Refresh dossier queue
        </button>
      </header>
      {message && <p className="backend-note" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {loading && <p className="backend-note" role="status">Loading claim dossiers…</p>}
      {!loading && !error && dossiers.length === 0 && (
        <p className="reviewpage__emptyhint">No claim dossiers visible to this reviewer.</p>
      )}
      {dossiers.map((dossier) => (
        <ReviewDossierCard
          key={dossier.id}
          dossier={dossier}
          isAdmin={isAdmin}
          busy={loading}
          onReload={reload}
          onMessage={setMessage}
          onError={setError}
        />
      ))}
    </section>
  );
}

export function MyClaimDossiers({ topicId }: { topicId: string }) {
  const { locale } = useI18n();
  const [dossiers, setDossiers] = useState<ClaimDossierRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revising, setRevising] = useState<ClaimDossierRecord | null>(null);
  const [revisionBusy, setRevisionBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const debate = debateByTopicId(topicId, locale);

  useEffect(() => {
    let cancelled = false;
    getMyClaimDossiers(topicId).then(
      (rows) => {
        if (cancelled) return;
        setDossiers(rows);
        setError("");
        setLoading(false);
      },
      (loadError) => {
        if (cancelled) return;
        setError(workflowErrorMessage(loadError, "Could not load your claim dossiers."));
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [topicId, version]);

  const revise = async (submissionId: string) => {
    setRevisionBusy(true);
    setError("");
    try {
      setRevising(await getClaimDossierDetail(submissionId));
    } catch (loadError) {
      setError(workflowErrorMessage(loadError, "Could not load the requested changes."));
    } finally {
      setRevisionBusy(false);
    }
  };

  return (
    <section className="youpage__section dossier-self" aria-labelledby="my-dossiers-title">
      <h2 className="youpage__subtitle" id="my-dossiers-title">
        {locale === "fr" ? "Mes dossiers de preuve" : "My evidence dossiers"}
      </h2>
      <p className="youpage__hint">
        {locale === "fr"
          ? "Statut backend réel, décision motivée et révision préparée, sans publication automatique."
          : "Real backend status, reasoned decision, and prepared draft—with no automatic publication."}
      </p>
      {loading && <p className="backend-note" role="status">Loading evidence dossiers…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {!loading && !error && dossiers.length === 0 && (
        <p className="reviewpage__emptyhint">No evidence dossier submitted for this pilot.</p>
      )}
      {revising && debate && (
        <ClaimDossierForm
          key={revising.id}
          debate={debate}
          initialDossier={revising}
          onCancel={() => setRevising(null)}
          onSubmitted={() => {
            setRevising(null);
            setLoading(true);
            setVersion((current) => current + 1);
          }}
        />
      )}
      {dossiers.map((dossier) => (
        <DossierRecordCard key={dossier.id} dossier={dossier} audience="self">
          {dossier.status === "changes_requested" && !revising && (
            <button
              type="button"
              className="btn btn--primary btn--small"
              disabled={revisionBusy}
              onClick={() => revise(dossier.id)}
            >
              {revisionBusy ? "Loading requested changes…" : "Revise requested dossier"}
            </button>
          )}
        </DossierRecordCard>
      ))}
    </section>
  );
}

export function PublicClaimDossiers({
  topicId,
  onChallenge,
}: {
  topicId: string;
  onChallenge: (evidenceLinkId: string) => void;
}) {
  const { locale } = useI18n();
  const [dossiers, setDossiers] = useState<ClaimDossierRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPublicClaimDossiers(topicId).then(
      (rows) => {
        if (cancelled) return;
        setDossiers(rows);
        setError("");
        setLoading(false);
      },
      (loadError) => {
        if (cancelled) return;
        setError(workflowErrorMessage(loadError, "Could not load reviewed evidence dossiers."));
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  if (!loading && !error && dossiers.length === 0) return null;
  return (
    <section className="work dossier-public" aria-labelledby="public-dossiers-title">
      <p className="section__eyebrow">Reviewed evidence dossiers</p>
      <h2 className="section__title" id="public-dossiers-title">
        Inspect the claim, the counter-search,
        <br />
        <em>and the exact passages.</em>
      </h2>
      <div className="dossier-boundary">
        <p>
          {locale === "fr"
            ? "« Relu » signifie que le dossier structuré et sa révision ont franchi les contrôles publiés. Ce n’est ni un verdict de vérité, ni une garantie d’exhaustivité, ni un score de confiance."
            : "Reviewed means the structured dossier and its revision passed the published checks. It is not a truth verdict, completeness guarantee, or confidence score."}
        </p>
        <p>
          {locale === "fr"
            ? "Chaque dossier reste contestable avec deux nouvelles sources distinctes et des extraits exacts."
            : "Every dossier remains contestable with two new distinct sources and exact excerpts."}
        </p>
      </div>
      {loading && <p className="backend-note" role="status">Loading reviewed evidence dossiers…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {dossiers.map((dossier) => {
        const challengeTarget =
          dossier.evidence.find((item) => item.evidence_link_id)?.evidence_link_id ??
          dossier.target_evidence_link_id;
        return (
          <DossierRecordCard key={dossier.id} dossier={dossier} audience="public">
            {challengeTarget ? (
              <button type="button" className="btn btn--ghost" onClick={() => onChallenge(challengeTarget)}>
                Challenge this dossier
              </button>
            ) : (
              <p className="dossier-note">
                Contestation will be available once this dossier exposes its published evidence-link locator.
              </p>
            )}
          </DossierRecordCard>
        );
      })}
      <p className="dossier-note">
        Status labels describe review history. They never automatically establish a claim.
      </p>
      <Link to="/method" className="link">Read the review method</Link>
    </section>
  );
}
