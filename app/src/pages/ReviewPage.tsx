import { useCallback, useEffect, useId, useState } from "react";
import { LocaleLink as Link } from "../i18n/links";
import type { Contribution } from "../types";
import { debateByTopicId, letterOf, slugOf } from "../data";
import { useI18n, type Locale } from "../i18n";
import {
  analyzeSeedPacket,
  loadSupabaseReviewState,
  mergeContribution,
  publishRevision,
  reviewRevision,
  reviewSupabaseContribution,
  type ReviewRevisionItem,
  type SeedPacketItem,
  type SupabaseReviewState,
} from "../lib/backend";
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
  const { locale, t } = useI18n();
  const rationaleId = useId();
  const debate = debateByTopicId(contribution.topic_id, locale);
  const target = targetDescription(contribution, locale, t);

  const decide = (decision: "approve" | "reject") => {
    reviewContribution(contribution.id, decision, rationale.trim());
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
          {t.review.rationalePlaceholder}
        </label>
        <input
          id={rationaleId}
          name="rationale"
          className="field__input"
          placeholder={t.review.rationalePlaceholder}
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
        />
        <div className="rcard__buttons">
          <button
            type="button"
            className="btn btn--approve"
            onClick={() => decide("approve")}
          >
            {t.common.actions.approve}
          </button>
          <button
            type="button"
            className="btn btn--reject"
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
  return (
    <article className="rcard">
      <header className="rcard__head">
        <span className="rcard__type">seed packet</span>
        <span className={`rcard__verdict rcard__verdict--${packet.status}`}>
          {packet.status}
        </span>
      </header>
      <h3 className="rcard__title">{packet.topic_question}</h3>
      <p className="rcard__body">{packet.initial_position}</p>
      {packet.source_inputs.length > 0 && (
        <div className="source-status-list">
          {packet.source_inputs.map((source, index) => (
            <span key={`${packet.id}-${index}`} className="source-status-list__item">
              {source.url ?? "source"} · provided
            </span>
          ))}
        </div>
      )}
      <div className="rcard__buttons">
        <button
          type="button"
          className="btn btn--primary btn--small"
          disabled={busy || packet.status === "analyzed"}
          onClick={() => onRun(packet.id)}
        >
          {packet.status === "analyzed" ? "Draft generated" : "Run mock AI"}
        </button>
        {packet.generated_revision_id && (
          <span className="backend-note">Draft: {packet.generated_revision_id}</span>
        )}
      </div>
    </article>
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
  onReview: (revisionId: string, decision: "approve" | "reject", rationale: string) => void;
  onPublish: (revisionId: string) => void;
  busy: boolean;
}) {
  const [rationale, setRationale] = useState("Reviewed locally.");
  return (
    <article className="rcard">
      <header className="rcard__head">
        <span className="rcard__type">draft revision</span>
        <Link to={revision.slug ? `/debates/${revision.slug}` : "/review"} className="rcard__topic">
          {revision.topic_title}
        </Link>
        <span className={`rcard__verdict rcard__verdict--${revision.review_status}`}>
          {revision.review_status}
        </span>
      </header>
      <h3 className="rcard__title">{revision.topic_question}</h3>
      <p className="rcard__target">revision {revision.revision_number} · {revision.id}</p>
      <div className="rcard__decision">
        <input
          className="field__input"
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
          aria-label="Review rationale"
        />
        <div className="rcard__buttons">
          <button
            className="btn btn--approve"
            disabled={busy}
            onClick={() => onReview(revision.id, "approve", rationale)}
          >
            Approve
          </button>
          <button
            className="btn btn--reject"
            disabled={busy}
            onClick={() => onReview(revision.id, "reject", rationale)}
          >
            Reject
          </button>
          <button
            className="btn btn--primary"
            disabled={busy || !isAdmin || revision.review_status !== "approved"}
            onClick={() => onPublish(revision.id)}
            title={isAdmin ? "Publish approved revision" : "Admin role required"}
          >
            Publish
          </button>
        </div>
      </div>
      {!isAdmin && (
        <p className="backend-note">Reviewer role can review; admin role is required to publish.</p>
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
  contribution: Contribution;
  onDecision: (contributionId: string, decision: "approve" | "reject", rationale: string) => void;
  onMerge: (contributionId: string) => void;
  isAdmin: boolean;
  busy: boolean;
}) {
  const [rationale, setRationale] = useState("Reviewed locally.");
  const { t } = useI18n();
  const mergeable = MERGEABLE_TYPES.has(contribution.type);
  return (
    <article className="rcard">
      <header className="rcard__head">
        <span className="rcard__type">{contribution.type.replace(/_/g, " ")}</span>
        <span className={`rcard__verdict rcard__verdict--${contribution.status}`}>
          {contribution.status}
        </span>
      </header>
      {contribution.title && <h3 className="rcard__title">{contribution.title}</h3>}
      {contribution.target_object_id && (
        <p className="rcard__target">
          {t.common.labels.on}: {contribution.target_object_id}
        </p>
      )}
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
      {contribution.status === "submitted" && (
        <div className="rcard__decision">
          <input
            className="field__input"
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
            aria-label="Contribution rationale"
          />
          <div className="rcard__buttons">
            <button
              className="btn btn--approve"
              disabled={busy}
              onClick={() => onDecision(contribution.id, "approve", rationale)}
            >
              Approve
            </button>
            <button
              className="btn btn--reject"
              disabled={busy}
              onClick={() => onDecision(contribution.id, "reject", rationale)}
            >
              Reject
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
          {t.review.mergedInto(contribution.merged_revision_id)}
        </p>
      )}
    </article>
  );
}

function BackendReviewPage() {
  const auth = useAuth();
  const { t } = useI18n();
  const [state, setState] = useState<SupabaseReviewState>({
    revisions: [],
    seedPackets: [],
    contributions: [],
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  usePageTitle(t.meta.titleReview);

  const reload = useCallback(async () => {
    if (!auth.isReviewer) return;
    setBusy(true);
    setMessage("");
    try {
      setState(await loadSupabaseReviewState());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load backend review queue.");
    } finally {
      setBusy(false);
    }
  }, [auth.isReviewer]);

  useEffect(() => {
    queueMicrotask(() => {
      void reload();
    });
  }, [auth.profile?.role, reload]);

  const runMock = async (packetId: string) => {
    setBusy(true);
    setMessage("");
    try {
      await analyzeSeedPacket(packetId, "mock");
      await reload();
      setMessage("Mock AI draft generated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mock AI generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const decideRevision = async (
    revisionId: string,
    decision: "approve" | "reject",
    rationale: string,
  ) => {
    setBusy(true);
    setMessage("");
    try {
      await reviewRevision(revisionId, decision, rationale);
      await reload();
      setMessage(`Revision ${decision}d.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Revision review failed.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async (revisionId: string) => {
    setBusy(true);
    setMessage("");
    try {
      const slug = await publishRevision(revisionId);
      await reload();
      setMessage(`Published. Open /debates/${slug}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publish failed.");
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
    try {
      await reviewSupabaseContribution(contributionId, decision, rationale);
      await reload();
      setMessage(`Contribution ${decision}d.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Contribution review failed.");
    } finally {
      setBusy(false);
    }
  };

  const mergeAccepted = async (contributionId: string) => {
    setBusy(true);
    setMessage("");
    try {
      const slug = await mergeContribution(contributionId);
      await reload();
      setMessage(t.review.mergeDone(slug));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.review.mergeFailed);
    } finally {
      setBusy(false);
    }
  };

  if (auth.status === "loading") {
    return (
      <main className="page reviewpage" id="main">
        <p className="backend-note">Loading session...</p>
      </main>
    );
  }

  if (!auth.user) {
    return (
      <main className="page reviewpage" id="main">
        <header className="reviewpage__head">
          <p className="section__eyebrow">{t.review.eyebrow}</p>
          <h1 className="section__title section__title--big">Backend review requires login.</h1>
          <p className="section__lede">Sign in on the You page, then return to the queue.</p>
          <Link to="/you" className="btn btn--primary">Open account</Link>
        </header>
      </main>
    );
  }

  if (!auth.isReviewer) {
    return (
      <main className="page reviewpage" id="main">
        <header className="reviewpage__head">
          <p className="section__eyebrow">{t.review.eyebrow}</p>
          <h1 className="section__title section__title--big">Reviewer role required.</h1>
          <p className="section__lede">
            Normal users can create drafts and contributions, but cannot review or publish.
          </p>
          <Link to="/you" className="btn btn--ghost">Switch account</Link>
        </header>
      </main>
    );
  }

  return (
    <main className="page reviewpage" id="main">
      <header className="reviewpage__head">
        <p className="section__eyebrow">{t.review.eyebrow}</p>
        <h1 className="section__title section__title--big">
          Backend review queue
          <br />
          <em>{auth.isAdmin ? "admin publish enabled" : "reviewer mode"}</em>
        </h1>
        <p className="section__lede">
          Supabase-backed drafts, seed packets, contribution reviews, and atomic publish.
        </p>
        <p className="bridgenote">{t.features.bridgeNote}</p>
        {message && <p className="backend-note">{message}</p>}
        <button className="btn btn--ghost btn--small" disabled={busy} onClick={reload}>
          Refresh queue
        </button>
      </header>

      <section className="reviewpage__section">
        <h2 className="reviewpage__subtitle">
          Seed packets <span className="fold__count">{state.seedPackets.length}</span>
        </h2>
        {state.seedPackets.length === 0 ? (
          <p className="reviewpage__emptyhint">No seed packets visible to this role.</p>
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
          Draft revisions <span className="fold__count">{state.revisions.length}</span>
        </h2>
        {state.revisions.length === 0 ? (
          <p className="reviewpage__emptyhint">No draft revisions visible to this role.</p>
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
          Contributions <span className="fold__count">{state.contributions.length}</span>
        </h2>
        {state.contributions.length === 0 ? (
          <p className="reviewpage__emptyhint">No submitted contributions visible to this role.</p>
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
