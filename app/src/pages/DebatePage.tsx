import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { LocaleLink as Link } from "../i18n/links";
import type {
  BridgeStatus,
  Claim,
  ClaimEvaluation,
  ClaimType,
  Contribution,
  DebateFixture,
  EndorsementSelf,
  EvidenceLabel,
  IntegrityVerdict,
  Position,
  Source,
  SourceAssessment,
  SourceExcerpt,
} from "../types";
import { POSITION_LETTERS, letterOf } from "../data";
import { claimState, claimSharedBy, type ClaimState } from "../data/state";
import { insightFor } from "../data/insight";
import {
  acceptedFor,
  pendingFor,
  useStore,
} from "../lib/store";
import { useProfile, type SteelmanResult } from "../lib/profile";
import { toast } from "../lib/toast-store";
import {
  copyLink,
  useReveal,
  usePageTitle,
  useReadingProgress,
} from "../lib/ui";
import { ContributePanel } from "../components/Contribute";
import { ValuesQuiz } from "../components/ValuesQuiz";
import { SteelmanTest } from "../components/SteelmanTest";
import { PerceptionExit } from "../components/PerceptionExit";
import {
  PositionSignal,
  PositionSignalBefore,
} from "../components/PositionSignal";
import { useI18n, type Locale } from "../i18n";
import { DebateCard } from "../components/DebateCard";
import {
  useDebateBySlug,
  loadAcceptedContributions,
  useClaimEvaluations,
  evaluateClaim,
  endorseClaim,
  setReviewerCamp,
  useReviewerSelf,
  useSourceAssessments,
  assessSource,
} from "../lib/backend";
import { sourceKey } from "../lib/sourceKey";
import { safeHttpUrl } from "../lib/url";
import { useAuth } from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase";
import { PublicClaimDossiers } from "../features/dossier/DossierViews";

const EVIDENCE_LEGEND: EvidenceLabel[] = [
  "supports_claim",
  "partially_supports_claim",
  "contradicts_claim",
  "does_not_support_claim",
  "unclear",
];

function formatTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/* ————— confidence meter ————— */

function ConfidenceMeter({ value }: { value: number }) {
  const { t } = useI18n();
  const filled = Math.max(1, Math.round(value * 5));
  const bucket =
    value >= 0.75 ? "high" : value >= 0.45 ? "med" : "low";
  const aria = `${t.common.labels.confidence} ${value.toFixed(2)} · ${t.common.confidenceBuckets[bucket]}`;
  return (
    <span className="confmeter" title={aria} aria-label={aria} role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <i
          key={i}
          className={`confmeter__seg${i < filled ? " confmeter__seg--on" : ""}`}
          aria-hidden="true"
        />
      ))}
      <span className="confmeter__bucket" aria-hidden="true">
        {t.common.confidenceBuckets[bucket]}
      </span>
    </span>
  );
}

function SourceTrace({
  source,
  excerpt,
}: {
  source: Source;
  excerpt?: SourceExcerpt;
}) {
  const { locale } = useI18n();
  const hash = source.content_hash;
  const provisional =
    locale === "fr"
      ? "Provenance provisoire : aucun artefact haché et inspectable n'est enregistré."
      : "Provisional provenance: no hashed, inspectable artefact is recorded.";

  if (!excerpt) {
    return <p className="evcard__foot">{provisional}</p>;
  }

  return (
    <details className="evcard__trace" open>
      <summary>
        {locale === "fr" ? "Passage source exact" : "Exact source passage"}
      </summary>
      <blockquote>{excerpt.text}</blockquote>
      <p className="evcard__foot">
        {excerpt.locator} · {locale === "fr" ? "extrait par" : "extracted by"}{" "}
        {excerpt.extracted_by}
      </p>
      <p className="evcard__foot">
        {hash
          ? `${locale === "fr" ? "Artefact" : "Artefact"}: ${hash}`
          : provisional}
      </p>
    </details>
  );
}

/* ————— claim row ————— */

/** Audited claim-evaluation + bridging context — provided by DebatePage,
 *  consumed by ClaimRow + the StateStrip so the ledger and the cards never
 *  disagree. The bridged result flows through the SAME evaluations map. */
interface ClaimEvalContextValue {
  stateMap: Map<string, ClaimState>;
  evaluations: Map<string, ClaimEvaluation>;
  canEvaluate: boolean; // reviewer && source === 'supabase'
  isAdmin: boolean; // admin-only direct override
  topicId: string;
  reload: () => void;
  // ——— bridging (reviewer-only, self-scoped) ———
  myCamp: string | null; // 'pos_a' | '__undecided__' | null (undeclared)
  myEndorsements: EndorsementSelf;
  positions: { id: string; letter: string; title: string }[];
  reloadSelf: () => void;
  // ——— source integrity floor (v1), keyed by normalized url ———
  assessments: Map<string, SourceAssessment>;
  canAssess: boolean; // reviewer && source === 'supabase'
  reloadAssessments: () => void;
}
const ClaimEvalContext = createContext<ClaimEvalContextValue | null>(null);

type BridgeCopy = ReturnType<typeof useI18n>["t"]["claimEval"]["bridge"];

const INTEGRITY_VERDICTS: IntegrityVerdict[] = [
  "attribution_required",
  "context_required",
  "below_floor",
]; // meets_floor never gets a chip (anti-Goodhart: clean must not RISE)

/** The source-integrity chip — returns null when no rule fired or no assessment.
 *  Sits BESIDE the relevance label; the two are never merged. */
function SourceIntegrityChip({ source }: { source: Source }) {
  const { t, locale } = useI18n();
  const ctx = useContext(ClaimEvalContext);
  const a = ctx?.assessments.get(sourceKey(source.url));
  if (!a) return null;
  if (!INTEGRITY_VERDICTS.includes(a.floor_verdict as IntegrityVerdict))
    return null;
  const ti = t.sourceFloor;
  const verdict = a.floor_verdict as IntegrityVerdict;
  const rule = ti.rules[a.rule_id] ?? "";
  const drivers = [
    ti.attrValues.content_genre?.[a.attributes?.content_genre],
    ti.attrValues.editorial_accountability?.[a.attributes?.editorial_accountability],
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <span
      className={`integrity integrity--${verdict}`}
      lang={locale}
      title={ti.verdictHint[verdict]}
    >
      <span className="integrity__verdict">{ti.verdicts[verdict]}</span>
      {rule && <span className="integrity__rule">{rule}</span>}
      {drivers && <span className="integrity__drivers">{ti.drivenBy(drivers)}</span>}
      {a.is_demo && <span className="integrity__demo">{ti.demo}</span>}
    </span>
  );
}

/** The integrity-vs-relevance teaching — load-bearing honesty. Always renders. */
function IntegrityLegend() {
  const { t } = useI18n();
  const ti = t.sourceFloor;
  return (
    <div className="intlegend">
      <p className="intlegend__eyebrow">{ti.legendEyebrow}</p>
      <p className="intlegend__note">{ti.vsRelevance}</p>
      <p className="intlegend__note">{ti.notTruth}</p>
      <p className="intlegend__note">{ti.libraryReuse}</p>
    </div>
  );
}

const ASSESS_ATTRS: {
  key:
    | "content_genre"
    | "editorial_accountability"
    | "correction_policy"
    | "fabrication_record"
    | "independence"
    | "expertise_basis"
    | "identity_basis"
    | "sensitive_domain";
  options: string[];
}[] = [
  { key: "content_genre", options: ["unknown", "primary", "reporting", "analysis", "opinion", "sponsored", "ugc", "ai_generated"] },
  { key: "editorial_accountability", options: ["unknown", "named_masthead", "named_author", "org_only", "anonymous", "none"] },
  { key: "correction_policy", options: ["unknown", "documented", "informal", "none"] },
  { key: "fabrication_record", options: ["none_known", "corrected_history", "retraction_history", "documented_fabrication"] },
  { key: "independence", options: ["unknown", "independent", "funded_disclosed", "funded_undisclosed", "self_interested"] },
  { key: "expertise_basis", options: ["unknown", "peer_reviewed", "domain_expert", "journalistic", "lay", "none"] },
  { key: "identity_basis", options: ["unknown", "verified", "pseudonymous", "unverified"] },
  { key: "sensitive_domain", options: ["none", "health", "law", "finance", "living_persons"] },
];

/** Reviewer-only: declare a source's mechanical attributes (the rules compute the
 *  verdict — the reviewer never sets it). */
function SourceAssessControl({ source }: { source: Source }) {
  const { t } = useI18n();
  const ctx = useContext(ClaimEvalContext);
  const ta = t.sourceFloor;
  const [busy, setBusy] = useState(false);
  const [attrs, setAttrs] = useState<Record<string, string>>(() =>
    Object.fromEntries(ASSESS_ATTRS.map((a) => [a.key, a.options[0]])),
  );
  const [proof, setProof] = useState("");
  if (!ctx?.canAssess) return null;

  async function submit() {
    if (!ctx) return;
    setBusy(true);
    const res = await assessSource({
      topic_id: ctx.topicId,
      url: source.url,
      content_genre: attrs.content_genre,
      editorial_accountability: attrs.editorial_accountability,
      correction_policy: attrs.correction_policy,
      fabrication_record: attrs.fabrication_record,
      independence: attrs.independence,
      expertise_basis: attrs.expertise_basis,
      identity_basis: attrs.identity_basis,
      sensitive_domain: attrs.sensitive_domain,
      proof_ref: proof,
    });
    setBusy(false);
    toast(res.ok ? ta.assess.saved : ta.assess.failed);
    if (res.ok) ctx.reloadAssessments();
  }

  return (
    <details className="srcassess">
      <summary className="srcassess__title">{ta.assess.title}</summary>
      <p className="claimeval__camphint">{ta.assess.hint}</p>
      <div className="srcassess__attrs">
        {ASSESS_ATTRS.map((a) => (
          <label key={a.key} className="srcassess__attr">
            <span>{a.key.replace(/_/g, " ")}</span>
            <select
              className="field__input"
              value={attrs[a.key]}
              onChange={(e) =>
                setAttrs((prev) => ({ ...prev, [a.key]: e.target.value }))
              }
            >
              {a.options.map((o) => (
                <option key={o} value={o}>
                  {ta.attrValues[a.key]?.[o] ?? o}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <label className="srcassess__proof">
        <span>{ta.assess.proofLabel}</span>
        <input
          className="field__input"
          value={proof}
          onChange={(e) => setProof(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="btn btn--primary"
        disabled={busy}
        onClick={submit}
      >
        {ta.assess.save}
      </button>
      <p className="srcassess__verdict">{ta.assess.verdictReadonly}</p>
      <SourceIntegrityChip source={source} />
    </details>
  );
}

function renderBridge(tb: BridgeCopy, status: BridgeStatus, n: number): string {
  switch (status) {
    case "bridged_established":
      // camp_count is withheld to 0 below the endorser floor — drop the "0 camps".
      return n >= 1
        ? tb.status.bridged_established(n)
        : tb.status.bridged_established_nocount;
    case "bridged_contested":
      return n >= 1
        ? tb.status.bridged_contested(n)
        : tb.status.bridged_contested_nocount;
    case "bridged_conflicting":
      return tb.status.bridged_conflicting;
    case "pending_single_camp":
      return tb.status.pending_single_camp;
    case "insufficient":
      return tb.status.insufficient;
  }
}

/** One-time per-debate stance declaration (reviewer). Recorded server-side,
 *  private; gates endorsement so a single camp can never confirm alone. */
function CampDeclaration() {
  const { t } = useI18n();
  const ctx = useContext(ClaimEvalContext);
  const [busy, setBusy] = useState(false);
  if (!ctx) return null;
  const tc = t.claimEval.bridge.camp;
  async function pick(positionId: string | null) {
    if (!ctx) return;
    setBusy(true);
    const res = await setReviewerCamp({
      topic_id: ctx.topicId,
      position_id: positionId,
    });
    setBusy(false);
    toast(res.ok ? tc.saved : tc.failed);
    if (res.ok) ctx.reloadSelf();
  }
  return (
    <div className="claimeval__campdecl">
      <p className="claimeval__camptitle">{tc.prompt}</p>
      <p className="claimeval__camphint">{tc.why}</p>
      <div
        className="claimeval__camppicks"
        role="group"
        aria-label={tc.prompt}
      >
        {ctx.positions.map((p) => (
          <button
            key={p.id}
            type="button"
            className="claimeval__btn"
            disabled={busy}
            onClick={() => pick(p.id)}
          >
            {tc.pick(p.letter, p.title)}
          </button>
        ))}
        <button
          type="button"
          className="claimeval__btn"
          disabled={busy}
          onClick={() => pick(null)}
        >
          {tc.undecided}
        </button>
      </div>
      <p className="claimeval__camplock">{tc.lockHint}</p>
    </div>
  );
}

/** Reviewer endorses a claim's state FROM their locked camp. Counts only across
 *  distinct camps; the reviewer's own stance is shown to them alone. */
function ReviewerEndorse({ claim }: { claim: Claim }) {
  const { t, locale } = useI18n();
  const ctx = useContext(ClaimEvalContext);
  const [busy, setBusy] = useState(false);
  if (!ctx) return null;
  const tb = t.claimEval.bridge;
  const mine = ctx.myEndorsements.get(claim.id);
  const myLetter =
    ctx.myCamp && ctx.myCamp !== "__undecided__"
      ? (ctx.positions.find(
          (x) => `pos_${x.letter.toLowerCase()}` === ctx.myCamp,
        )?.letter ?? ctx.myCamp)
      : tb.camp.undecided;
  async function endorse(state: "established" | "contested") {
    if (!ctx) return;
    setBusy(true);
    const res = await endorseClaim({
      topic_id: ctx.topicId,
      claim_id: claim.id,
      state,
    });
    setBusy(false);
    toast(res.ok ? tb.endorseSaved : tb.endorseFailed);
    if (res.ok) ctx.reloadSelf();
  }
  return (
    <div className="claimeval__endorse" role="group" aria-label={tb.endorse}>
      <span className="claimeval__setlabel">{tb.endorse}</span>
      {(["established", "contested"] as const).map((s) => (
        <button
          key={s}
          type="button"
          className="claimeval__btn"
          aria-pressed={mine === s}
          disabled={busy}
          onClick={() => endorse(s)}
          lang={locale}
        >
          {t.claimEval.stateLabel[s]}
        </button>
      ))}
      <span className="claimeval__mycamp" title={tb.yourCampHint}>
        {tb.yourCamp(myLetter)}
      </span>
    </div>
  );
}

function ClaimProvenance({ claim }: { claim: Claim }) {
  const { t, locale } = useI18n();
  const ctx = useContext(ClaimEvalContext);
  const [busy, setBusy] = useState(false);
  const [rationale, setRationale] = useState("");
  if (!ctx) return null;
  const ev = ctx.evaluations.get(claim.id);
  const tp = t.claimEval;
  const tb = tp.bridge;
  const state = ev?.state ?? null;
  const status = ev?.bridge_status;
  const rationaleId = `claim-evaluation-rationale-${claim.id}`;
  const rationaleHintId = `${rationaleId}-hint`;
  const establishedPolicyId = `${rationaleId}-established-policy`;
  const rationaleIsValid = rationale.trim().length >= 8;
  // "insufficient" is a truthy status but means "no cross-camp verdict yet" —
  // don't render that caption beside an Established/Contested badge from a direct
  // (un-bridged) evaluation.
  const caption =
    status && status !== "insufficient"
      ? renderBridge(tb, status, ev?.camp_count ?? 0)
      : null;

  async function setState(s: "contested" | "values") {
    if (!ctx || !rationaleIsValid || busy) return;
    setBusy(true);
    try {
      const res = await evaluateClaim({
        topic_id: ctx.topicId,
        claim_id: claim.id,
        state: s,
        rationale: rationale.trim(),
      });
      if (!res.ok) {
        toast(tp.failedToast);
        return;
      }
      setRationale("");
      ctx.reload();
      toast(tp.savedToast);
    } catch {
      toast(tp.failedToast);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="claimeval">
      {state ? (
        <p className="claimeval__provenance">
          <span className={`claimeval__badge claimeval__badge--${state}`}>
            {tp.stateLabel[state]}
          </span>
          {caption && (
            <span
              className={`claimeval__bridge claimeval__bridge--${status}`}
              lang={locale}
            >
              {caption}
            </span>
          )}
          {ev?.evaluated_at && !ev.bridged
            ? ` ${tp.byReview(ev.evaluated_at.slice(0, 10))}`
            : ""}
          {ev?.rationale ? ` — ${ev.rationale}` : ""}
          {ev?.is_demo && <span className="claimeval__demo">{tb.demo}</span>}
        </p>
      ) : caption ? (
        <p className="claimeval__provenance claimeval__provenance--pending">
          <span
            className={`claimeval__bridge claimeval__bridge--${status}`}
            lang={locale}
          >
            {caption}
          </span>
        </p>
      ) : null}

      {ctx.canEvaluate &&
        (ctx.myCamp == null ? (
          <CampDeclaration />
        ) : (
          <ReviewerEndorse claim={claim} />
        ))}

      {ctx.canEvaluate && ctx.isAdmin && (
        <div
          className="claimeval__set"
          role="group"
          aria-describedby={establishedPolicyId}
        >
          <span className="claimeval__setlabel">{tp.setState}</span>
          <p id={establishedPolicyId} className="claimeval__policy" role="note">
            {tp.establishedBridgeOnly}
          </p>
          <label className="field__label" htmlFor={rationaleId}>
            {tp.rationaleLabel}
          </label>
          <textarea
            id={rationaleId}
            className="field__input field__input--area"
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
            aria-describedby={`${establishedPolicyId} ${rationaleHintId}`}
            minLength={8}
            rows={3}
            required
            disabled={busy}
          />
          <p id={rationaleHintId} className="field__hint">
            {tp.rationaleHint}
          </p>
          <div className="claimeval__actions">
            {(["contested", "values"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className="claimeval__btn"
                disabled={busy || !rationaleIsValid}
                onClick={() => setState(s)}
                lang={locale}
              >
                {tp.stateLabel[s]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ClaimRow({
  debate,
  claim,
  contestedLinks,
  anchorId,
  sharedWith,
}: {
  debate: DebateFixture;
  claim: Claim;
  contestedLinks: Map<string, Contribution>;
  anchorId: string;
  sharedWith?: string[];
}) {
  const [open, setOpen] = useState(
    () => window.location.hash.slice(1) === anchorId,
  );
  const [linked] = useState(open);
  const { locale, t } = useI18n();
  const evalCtx = useContext(ClaimEvalContext);
  const links = debate.evidence_links.filter((l) => l.claim_id === claim.id);
  const hasContest = links.some((l) => contestedLinks.has(l.id));

  useEffect(() => {
    if (linked)
      document.getElementById(anchorId)?.scrollIntoView({ block: "center" });
  }, [linked, anchorId]);

  const state = claimState(debate, claim, evalCtx?.stateMap);
  const stateClass = state === "provisional" ? "contested" : state;

  return (
    <div
      id={anchorId}
      className={`claim claim--st-${stateClass}${open ? " claim--open" : ""}${linked ? " claim--flash" : ""}`}
    >
      <div className="claim__rowwrap">
        <button
          className="claim__row"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span className="claim__text">
            {claim.text}
            <span className="claim__types">
              {claim.claim_type.map((ct) => (
                <span key={ct} className="claimtype">
                  {t.common.claimTypes[ct as ClaimType]}
                </span>
              ))}
              {sharedWith && sharedWith.length > 0 && (
                <span className="claimtype claimtype--shared">
                  {t.debatePage.sharedClaim(sharedWith.join(" · "))}
                </span>
              )}
              {state === "provisional" && (
                <span className="claimtype claimtype--shared">
                  {locale === "fr" ? "provisoire · non établi" : "provisional · not established"}
                </span>
              )}
            </span>
          </span>
          <span className="claim__evidence">
            {links.map((l) => (
              <span key={l.id} className="claim__dotwrap">
                <i className={`dot dot--${l.label}`} aria-hidden="true" />
                <span className="sr-only">
                  {t.common.evidenceLabels[l.label]}
                </span>
              </span>
            ))}
            {t.common.counts.sourceCount(links.length)}
            {hasContest && (
              <span className="claim__contested">{t.debatePage.contested}</span>
            )}
            <span className="claim__chevron" aria-hidden="true">
              ›
            </span>
          </span>
        </button>
        <button
          type="button"
          className="claim__copy"
          aria-label={t.interactive.debate.claimCopyTitle}
          onClick={(e) => {
            e.stopPropagation();
            copyLink(anchorId).then(
              (ok) => ok && toast(t.interactive.debate.claimLinkCopied),
            );
          }}
        >
          <span aria-hidden="true">⧉</span>
        </button>
      </div>

      {open && (
        <div className="evdrawer">
          <ClaimProvenance claim={claim} />
          {links.length === 0 ? (
            <article className="evcard evcard--empty">
              <p className="evcard__rationale">{t.debatePage.evidenceEmpty}</p>
              <p className="evcard__foot">{t.common.labels.noSourceYet}</p>
            </article>
          ) : (
            links.map((link) => {
              const source = debate.sources.find((s) => s.id === link.source_id);
              const excerpt = debate.source_excerpts?.find(
                (item) => item.id === link.source_excerpt_id,
              );
              const contest = contestedLinks.get(link.id);
              return (
                <article key={link.id} className="evcard">
                  <header className="evcard__head">
                    <span className={`evlabel evlabel--${link.label}`}>
                      {t.common.evidenceLabels[link.label]}
                    </span>
                    {source && (
                      <a
                        className="evcard__source"
                        href={safeHttpUrl(source.url)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.publisher} ↗
                      </a>
                    )}
                    {source && <SourceIntegrityChip source={source} />}
                  </header>
                  <p className="evcard__rationale">{link.rationale}</p>
                  {source && <SourceTrace source={source} excerpt={excerpt} />}
                  <footer className="evcard__foot">
                    {t.common.labels.confidence}{" "}
                    <ConfidenceMeter value={link.confidence} /> ·{" "}
                    {t.common.reviewStatusLabels[link.review_status]}
                    {source ? ` · ${source.quality_notes}` : ""}
                  </footer>
                  {contest && (
                    <div className="evcard__contest">
                      <b>
                        {t.debatePage.communityChallengeProposes(
                          contest.proposed_label
                            ? t.common.evidenceLabels[contest.proposed_label]
                            : t.common.nav.review,
                        )}
                      </b>
                      <p>{contest.body}</p>
                    </div>
                  )}
                </article>
              );
            })
          )}
          <p className="evdrawer__note">{t.debatePage.evidenceNote}</p>
        </div>
      )}
    </div>
  );
}

/* ————— argument meta ————— */

function argMeta(
  debate: DebateFixture,
  claimIds: string[],
  t: ReturnType<typeof useI18n>["t"],
  evalMap?: Map<string, ClaimState>,
): string {
  const claims = claimIds
    .map((id) => debate.claims.find((c) => c.id === id))
    .filter((c): c is Claim => Boolean(c));
  if (claims.length === 0) return "";
  const contested = claims.filter(
    (c) => claimState(debate, c, evalMap) === "contested",
  ).length;
  // dominant evidence label across the argument's claims
  const tally = new Map<EvidenceLabel, number>();
  for (const c of claims) {
    for (const l of debate.evidence_links.filter((e) => e.claim_id === c.id)) {
      tally.set(l.label, (tally.get(l.label) ?? 0) + 1);
    }
  }
  let dominant: EvidenceLabel | null = null;
  let best = 0;
  for (const [label, n] of tally) {
    if (n > best) {
      best = n;
      dominant = label;
    }
  }
  return t.debatePage.argMeta(
    claims.length,
    contested,
    dominant ? t.common.evidenceLabels[dominant] : t.common.labels.noSourceYet,
  );
}

/* ————— reading flow ————— */

function Reading({
  debate,
  position,
  community,
  contestedLinks,
  steelmanChallenge,
  communityClaims,
  sharedClaims,
  onTakeTest,
  testBadge,
}: {
  debate: DebateFixture;
  position: Position;
  community: boolean;
  contestedLinks: Map<string, Contribution>;
  steelmanChallenge?: Contribution;
  communityClaims: Contribution[];
  sharedClaims: Map<string, string[]>;
  onTakeTest?: () => void;
  testBadge?: SteelmanResult;
}) {
  const { locale, t } = useI18n();
  const evalCtx = useContext(ClaimEvalContext);
  const args = debate.arguments.filter((a) => a.position_id === position.id);
  const tradeoff = debate.tradeoffs.find((tr) => tr.position_id === position.id);
  const values = debate.values.filter((v) =>
    v.position_ids.includes(position.id),
  );
  const voices = (insightFor(debate.topic.id, locale)?.voices ?? []).filter(
    (v) => v.position_id === position.id,
  );
  const letter = POSITION_LETTERS[
    debate.positions.findIndex((p) => p.id === position.id)
  ];

  return (
    <div className="reading" key={position.id}>
      <p className="reading__eyebrow">
        {community
          ? t.debatePage.communityReadingEyebrow
          : t.debatePage.readingEyebrow(letter)}
      </p>
      <h2 className="reading__title">{position.title}</h2>

      {values.length > 0 && (
        <div className="reading__values">
          {values.map((v) => (
            <span key={v.id} className="valuechip">
              {v.name}
            </span>
          ))}
        </div>
      )}

      <figure className={`steelman${steelmanChallenge ? " steelman--contested" : ""}`}>
        <figcaption className="steelman__label">
          {t.debatePage.steelmanLabel}
          {steelmanChallenge && (
            <span className="steelman__flag">{t.debatePage.contested}</span>
          )}
        </figcaption>
        <p>{position.steelman}</p>
        {steelmanChallenge && (
          <div className="steelman__challenge">
            <b>{t.debatePage.communityChallenge}</b> {steelmanChallenge.body}
          </div>
        )}
      </figure>

      {voices.length > 0 && (
        <div className="voices">
          <p className="voices__eyebrow">{t.features.voicesEyebrow}</p>
          <div className="voices__grid">
            {voices.map((v, i) => (
              <blockquote
                key={v.id}
                className="voice"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <p className="voice__text">“{v.text}”</p>
                <footer className="voice__who">
                  <b>{v.name}</b> — {v.detail}
                  <span className="voice__tag">{t.features.voicesSample}</span>
                </footer>
              </blockquote>
            ))}
          </div>
          <p className="voices__hint">{t.features.voicesHint}</p>
        </div>
      )}

      {args.length > 0 && (
        <>
          <h3 className="reading__sub">{t.debatePage.restsOn}</h3>
          <p className="reading__hint">{t.debatePage.restsHint}</p>

          <ol className="arglist">
            {args.map((arg) => (
              <li key={arg.id} className="arglist__item">
                <div className="arglist__head">
                  <span className={`dir dir--${arg.direction}`}>
                    {t.common.directionLabels[arg.direction]}
                  </span>
                  <span className="arglist__summary">{arg.summary}</span>
                </div>
                {arg.claim_ids.length > 0 && (
                  <p className="arglist__meta">
                    {argMeta(debate, arg.claim_ids, t, evalCtx?.stateMap)}
                  </p>
                )}
                {arg.claim_ids.map((claimId) => {
                  const claim = debate.claims.find((c) => c.id === claimId);
                  return claim ? (
                    <ClaimRow
                      key={`${arg.id}-${claim.id}`}
                      debate={debate}
                      claim={claim}
                      contestedLinks={contestedLinks}
                      anchorId={`${arg.id}-${claim.id}`}
                      sharedWith={sharedClaims.get(claim.id)}
                    />
                  ) : null;
                })}
              </li>
            ))}
          </ol>
        </>
      )}

      {communityClaims.length > 0 && (
        <>
          <h3 className="reading__sub">{t.debatePage.communityAdditions}</h3>
          <p className="reading__hint">{t.debatePage.communityAdditionsHint}</p>
          {communityClaims.map((c) => (
            <div key={c.id} className="claim claim--community">
              <div className="claim__row claim__row--static">
                <span className="claim__text">{c.body}</span>
                <span className="claim__evidence">
                  {c.url ? (
                    <a
                      href={safeHttpUrl(c.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="claim__srclink"
                    >
                      {t.common.labels.source} ↗
                    </a>
                  ) : (
                    t.common.labels.noSourceYet
                  )}
                  <span className="claim__dotwrap">
                    <i className="dot dot--unclear" aria-hidden="true" />
                    <span className="sr-only">
                      {t.common.evidenceLabels.unclear}
                    </span>
                  </span>
                </span>
              </div>
            </div>
          ))}
        </>
      )}

      {community && (
        <p className="reading__communitynote">
          {t.debatePage.communityNote}
        </p>
      )}

      {tradeoff && (
        <>
          <h3 className="reading__sub">{t.debatePage.asksAccept}</h3>
          <div className="ledger">
            <div className="ledger__cell">
              <span className="ledger__key ledger__key--gain">{t.debatePage.youGain}</span>
              <p>{tradeoff.gain}</p>
            </div>
            <div className="ledger__cell">
              <span className="ledger__key ledger__key--cost">{t.debatePage.youPay}</span>
              <p>{tradeoff.cost}</p>
            </div>
            <div className="ledger__cell">
              <span className="ledger__key ledger__key--risk">{t.debatePage.youRisk}</span>
              <p>{tradeoff.risk}</p>
            </div>
          </div>
        </>
      )}

      {onTakeTest && (
        <div className="smcta">
          <span className="smcta__text">{t.interactive.debate.smctaText}</span>
          {testBadge?.passed ? (
            <span className="smcta__earned">{t.interactive.debate.smctaEarned}</span>
          ) : (
            <button className="btn btn--ghost btn--small" onClick={onTakeTest}>
              {t.interactive.debate.smctaButton}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ————— values matrix ————— */

function ValuesMatrix({
  debate,
  communityPositions,
}: {
  debate: DebateFixture;
  communityPositions: Position[];
}) {
  const { t } = useI18n();
  const positions = [...debate.positions, ...communityPositions];
  const cols = positions.length;

  return (
    <div className="matrix" style={{ ["--poscols" as string]: cols }}>
      <div className="matrix__row matrix__row--head">
        <span />
        {positions.map((p, i) => (
          <span
            key={p.id}
            className={`matrix__poshead${
              i >= debate.positions.length ? " matrix__poshead--community" : ""
            }`}
          >
            {(POSITION_LETTERS[i] ?? "+")}
          </span>
        ))}
      </div>
      {debate.values.map((v) => (
        <div key={v.id} className="matrix__row">
          <div className="matrix__value">
            <span className="matrix__name">{v.name}</span>
            <span className="matrix__desc">{v.description}</span>
            <span className="matrix__tension">
              {t.debatePage.inTensionWith} {v.tension_with.join(", ")}
            </span>
          </div>
          {positions.map((p, i) => (
            <span
              key={p.id}
              className={`matrix__cell${
                i >= debate.positions.length ? " matrix__cell--community" : ""
              }`}
            >
              {i >= debate.positions.length ? (
                <i className="matrix__nodot" title={t.debatePage.communityUnmapped} />
              ) : v.position_ids.includes(p.id) ? (
                <i className="matrix__dot" />
              ) : (
                <i className="matrix__nodot" />
              )}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ————— fault-line map ————— */

/**
 * A claim, resolved to its primary lane (evidence-state, the ONE primary axis)
 * and its orthogonal cross-position signal (which positions cite it).
 * Strength (claimState) and citation (claimSharedBy) are independent axes and
 * must not be conflated: a "both sides cite this" badge is a secondary mark
 * inside the Settled lane, never a lane of its own.
 */
type MappedClaim = {
  claim: Claim;
  state: ClaimState;
  /** position letters that cite this claim, when cited by more than one */
  sharedWith: string[];
  /** evidence labels attached, for the row's ev-dots */
  labels: EvidenceLabel[];
};

const LANE_ORDER: ClaimState[] = [
  "established",
  "contested",
  "provisional",
  "values",
];

function FaultLineMap({
  debate,
  onJumpToClaim,
}: {
  debate: DebateFixture;
  onJumpToClaim: (claimId: string) => void;
}) {
  const { locale, t } = useI18n();
  const evalCtx = useContext(ClaimEvalContext);
  const reveal = useReveal<HTMLDivElement>();
  const shared = claimSharedBy(debate);

  // Resolve every claim to (state, sharedWith, labels) once. The stored
  // evaluations map (human/bridged verdicts) is authoritative over the
  // heuristic, so the lanes match the StateStrip counts above them.
  const mapped: MappedClaim[] = debate.claims.map((claim) => ({
    claim,
    state: claimState(debate, claim, evalCtx?.stateMap),
    sharedWith: shared.get(claim.id) ?? [],
    labels: debate.evidence_links
      .filter((l) => l.claim_id === claim.id)
      .map((l) => l.label),
  }));

  const lanes: Record<ClaimState, MappedClaim[]> = {
    established: mapped.filter((m) => m.state === "established"),
    contested: mapped.filter((m) => m.state === "contested"),
    provisional: mapped.filter((m) => m.state === "provisional"),
    values: mapped.filter((m) => m.state === "values"),
  };

  // "Common ground first": the green facts BOTH sides stand on. Lead with the
  // cross-position count; degrade to the overall settled count when the
  // both-sides subset is thin, so the hook never depends on absent data.
  const settledShared = lanes.established.filter(
    (m) => m.sharedWith.length > 0,
  );
  const commonGround =
    settledShared.length > 0
      ? t.debatePage.faultCommonGround(settledShared.length)
      : t.debatePage.faultCommonGroundFallback(lanes.established.length);

  const laneMeta: Record<
    ClaimState,
    { label: string; caption: string; count: number }
  > = {
    established: {
      label: t.debatePage.faultLaneSettled,
      caption: t.debatePage.faultLaneSettledCaption,
      count: lanes.established.length,
    },
    contested: {
      label: t.debatePage.faultLaneContested,
      caption: t.debatePage.faultLaneContestedCaption,
      count: lanes.contested.length,
    },
    provisional: {
      label: locale === "fr" ? "Provisoire / inconnu" : "Provisional / unknown",
      caption:
        locale === "fr"
          ? "Non relu indépendamment ou preuve indisponible — aucun verdict de vérité."
          : "Not independently reviewed or evidence unavailable — no truth verdict.",
      count: lanes.provisional.length,
    },
    values: {
      label: t.debatePage.faultLaneValues,
      caption: t.debatePage.faultLaneValuesCaption,
      count: lanes.values.length,
    },
  };

  return (
    <div className="faultline__map" ref={reveal}>
      <p className="faultline__commonground">
        <i className="faultline__cgdot" aria-hidden="true" />
        {commonGround}
      </p>

      {LANE_ORDER.map((state) => {
        const rows = lanes[state];
        const meta = laneMeta[state];
        return (
          <section
            key={state}
            className={`faultline__lane faultline__lane--${state === "provisional" ? "contested" : state}`}
          >
            <header className="faultline__lanehead">
              <span className="faultline__lanelabel">
                {meta.label}
                <span className="faultline__lanecount">{meta.count}</span>
              </span>
              <span className="faultline__lanecaption">{meta.caption}</span>
            </header>

            {rows.length === 0 ? (
              <p className="faultline__empty">
                {state === "contested"
                  ? t.debatePage.faultEmptyContested
                  : state === "provisional"
                    ? locale === "fr"
                      ? "Aucune affirmation provisoire."
                      : "No provisional claims."
                  : state === "values"
                    ? t.debatePage.faultEmptyValues
                    : t.debatePage.faultEmptySettled}
              </p>
            ) : (
              <ul className="faultline__rows">
                {rows.map(({ claim, sharedWith, labels }) => (
                  <li key={claim.id} className="faultline__row">
                    <button
                      type="button"
                      className="faultline__chip"
                      onClick={() => onJumpToClaim(claim.id)}
                    >
                      <span className="faultline__chiptext">{claim.text}</span>
                      <span className="faultline__chipmeta">
                        {state === "established" && sharedWith.length > 0 && (
                          <span className="faultline__bothsides">
                            {t.debatePage.faultBothSides(
                              sharedWith.join(" · "),
                            )}
                          </span>
                        )}
                        <span className="faultline__evdots">
                          {labels.length === 0 ? (
                            <span className="faultline__novsrc">
                              {t.common.labels.noSourceYet}
                            </span>
                          ) : (
                            labels.map((label, i) => (
                              <span
                                key={i}
                                className="faultline__evdot"
                              >
                                <i
                                  className={`dot dot--${label}`}
                                  aria-hidden="true"
                                />
                                <span className="sr-only">
                                  {t.common.evidenceLabels[label]}
                                </span>
                              </span>
                            ))
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <p className="faultline__legend">{t.debatePage.faultSettledNote}</p>
    </div>
  );
}

/* ————— priorities weighting ————— */

/**
 * Reuses the values-quiz scoring (position.value_ids · value_scores) to rank
 * positions by the reader's own priorities. tension_with is decoration and is
 * NOT wired into scoring. This coexists with ValuesMatrix: the matrix still
 * carries the community "unmapped" state; this view answers "given what YOU
 * weigh, which positions lead."
 */
function PrioritiesWeighting({ debate }: { debate: DebateFixture }) {
  const { t } = useI18n();
  const profile = useProfile();
  const scores = profile.quiz[debate.topic.id]?.value_scores;

  if (!scores || Object.keys(scores).length === 0) {
    return (
      <p className="faultline__weightempty">
        {t.debatePage.faultWeightEmpty}{" "}
        <a href="#positions" className="link">
          {t.debatePage.faultWeightEmptyCta}
        </a>
      </p>
    );
  }

  // Same scoring shape as ValuesQuiz.rankPositions, normalized to a percentage.
  const maxScore = Math.max(1, ...Object.values(scores).concat(0));
  const ranked = debate.positions
    .map((p, i) => {
      const raw = p.value_ids.reduce((n, v) => n + (scores[v] ?? 0), 0);
      const max = Math.max(1, p.value_ids.length * maxScore);
      return {
        position: p,
        letter: (POSITION_LETTERS[i] ?? "+"),
        raw,
        pct: Math.round((raw / max) * 100),
      };
    })
    .sort((a, b) => b.raw - a.raw);

  const top = ranked[0]?.raw ?? 0;

  return (
    <div className="faultline__weight">
      <p className="faultline__weighteyebrow">{t.debatePage.faultWeightLead}</p>
      <ul className="faultline__weightrows">
        {ranked.map(({ position, letter, raw, pct }) => (
          <li
            key={position.id}
            className={`faultline__weightrow${
              raw > 0 && raw === top ? " faultline__weightrow--lead" : ""
            }`}
          >
            <span className="faultline__weightletter">{letter}</span>
            <span className="faultline__weighttitle">
              {position.title.split("—")[0].trim()}
            </span>
            <span className="faultline__weightbar">
              <i style={{ width: `${pct}%` }} />
            </span>
            <span className="faultline__weightpct">{pct}%</span>
          </li>
        ))}
      </ul>
      <p className="faultline__weightnote">{t.debatePage.faultWeightNote}</p>
    </div>
  );
}

/* ————— evidence legend ————— */

function EvidenceLegend() {
  const { t } = useI18n();
  return (
    <div className="evlegend">
      <span className="evlegend__eyebrow">{t.common.labels.evidence}</span>
      <div className="evlegend__pills">
        {EVIDENCE_LEGEND.map((label) => (
          <span key={label} className={`evlabel evlabel--${label}`}>
            {t.common.evidenceLabels[label]}
          </span>
        ))}
      </div>
      <p className="evlegend__note">{t.debatePage.legendCaption}</p>
    </div>
  );
}

/* ————— page ————— */

export default function DebatePage() {
  const { slug } = useParams();
  const { locale, t } = useI18n();
  const {
    debate,
    debates,
    provenance,
    loading,
    error: debateLoadError,
  } = useDebateBySlug(slug, locale);
  const store = useStore();
  const profile = useProfile();
  const progress = useReadingProgress();
  const auth = useAuth();
  const {
    evaluations,
    error: evaluationsError,
    reload: reloadEvaluations,
  } = useClaimEvaluations(debate?.topic.id, locale);
  const reviewerSelf = useReviewerSelf(debate?.topic.id, locale, auth.isReviewer);
  const {
    assessments,
    error: assessmentsError,
    reload: reloadAssessments,
  } = useSourceAssessments(debate?.topic.id, locale);
  const evalStateMap = useMemo(() => {
    const m = new Map<string, ClaimState>();
    // a PRESENT state is always confirmed (a human eval or a bridged result);
    // null-state rows (endorsed-but-unbridged) keep the heuristic.
    for (const [id, e] of evaluations) if (e.state) m.set(id, e.state);
    return m;
  }, [evaluations]);
  const [contribOpen, setContribOpen] = useState(false);
  const [dossierChallengeEvidenceLinkId, setDossierChallengeEvidenceLinkId] =
    useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  usePageTitle(
    debate ? `${debate.topic.question} — Parallax` : "Parallax",
  );

  // Backend-approved contributions for this topic, merged with the local store.
  // RLS scopes the Supabase read to the caller's own/staff-visible rows; the
  // store path remains the fallback (and the only path when Supabase is off).
  const [backendAccepted, setBackendAccepted] = useState<Contribution[]>([]);
  const [backendAcceptedError, setBackendAcceptedError] = useState<
    string | null
  >(null);
  const topicId = debate?.topic.id;
  useEffect(() => {
    let cancelled = false;
    const resolve =
      isSupabaseConfigured && topicId
        ? loadAcceptedContributions(topicId)
        : Promise.resolve<Contribution[]>([]);
    resolve
      .then((rows) => {
        if (!cancelled) {
          setBackendAccepted(rows);
          setBackendAcceptedError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setBackendAccepted([]);
          setBackendAcceptedError(
            error instanceof Error
              ? error.message
              : "Accepted contributions could not be loaded.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  const storeAccepted = useMemo(
    () => (topicId ? acceptedFor(store, topicId) : []),
    [store, topicId],
  );
  const accepted = useMemo(() => {
    const seen = new Set(backendAccepted.map((c) => c.id));
    return [...backendAccepted, ...storeAccepted.filter((c) => !seen.has(c.id))];
  }, [backendAccepted, storeAccepted]);
  const pending = debate ? pendingFor(store, debate.topic.id) : [];

  const communityPositions: Position[] = useMemo(
    () =>
      !debate
        ? []
        : accepted
            .filter((c) => c.type === "new_position")
            .map((c) => ({
              id: c.id,
              topic_id: debate.topic.id,
              title: c.title ?? t.debatePage.communityPosition,
              short_summary: c.body.slice(0, 120),
              steelman: c.body,
              status: "published" as const,
              argument_ids: [],
              value_ids: [],
              tradeoff_ids: [],
              generated_by: "human" as const,
              review_status: "unreviewed" as const,
            })),
    [debate, accepted, t.debatePage.communityPosition],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!debate) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const positions = [...debate.positions, ...communityPositions];
      setSelectedId((prev) => {
        const cur = positions.findIndex(
          (p) => p.id === (prev ?? positions[0].id),
        );
        const next =
          e.key === "ArrowRight"
            ? Math.min(cur + 1, positions.length - 1)
            : Math.max(cur - 1, 0);
        return positions[next].id;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [debate, communityPositions]);

  if (!debate && loading) {
    return (
      <main className="page notfound">
        <h1 className="section__title">Loading debate...</h1>
      </main>
    );
  }

  if (!debate) {
    return (
      <main className="page notfound">
        <h1 className="section__title">{t.debatePage.notFound}</h1>
        <Link to="/debates" className="btn btn--ghost">
          {t.debatePage.back}
        </Link>
      </main>
    );
  }

  const allPositions = [...debate.positions, ...communityPositions];
  const position =
    allPositions.find((p) => p.id === selectedId) ?? allPositions[0];

  const sharedClaims = claimSharedBy(debate);

  const perception = profile.perception[debate.topic.id];
  const perceptionDelta =
    perception?.before !== undefined && perception?.after !== undefined
      ? perception.after - perception.before
      : undefined;

  const others = debates
    .filter((d) => d.topic.id !== debate.topic.id)
    .slice(0, 2);

  const contestedLinks = new Map(
    accepted
      .filter((c) => c.type === "challenge_evidence_label" && c.target_object_id)
      .map((c) => [c.target_object_id as string, c]),
  );
  const steelmanChallenge = accepted.find(
    (c) =>
      c.type === "challenge_steelman" && c.target_object_id === position.id,
  );
  const communityClaims = accepted.filter(
    (c) => c.type === "new_claim" && c.target_object_id === position.id,
  );
  const communitySources = accepted.filter((c) => c.type === "new_source");

  const auditTrail = [
    ...debate.audit_events,
    ...store.extra_audit.filter((e) => e.topic_id === debate.topic.id),
  ];
  const revision =
    debate.revision.revision_number +
    (store.revision_bumps[debate.topic.id] ?? 0);

  const choose = (id: string) => {
    setSelectedId(id);
    document
      .getElementById("reading")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Fault-line chip → the claim in the reading section. A claim can be cited by
  // several arguments/positions; jump to the first that references it, select
  // that position so its drawer mounts, then scroll the anchor into view.
  const jumpToClaim = (claimId: string) => {
    const owner = debate.arguments.find((a) =>
      a.claim_ids.includes(claimId),
    );
    if (!owner) return;
    const ownerPos = debate.positions.find((p) => p.id === owner.position_id);
    if (ownerPos) setSelectedId(ownerPos.id);
    const anchorId = `${owner.id}-${claimId}`;
    // Let the selected position (and its drawer) mount before scrolling.
    requestAnimationFrame(() => {
      const el = document.getElementById(anchorId);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("claim--flash");
    });
  };

  const badges = profile.steelman[debate.topic.id] ?? {};
  const matchId = profile.quiz[debate.topic.id]?.match_position_id;
  const positionHasTest = (
    insightFor(debate.topic.id, locale)?.steelman ?? []
  ).some((q) => q.position_id === position.id);
  const insightSteelman = insightFor(debate.topic.id, locale)?.steelman ?? [];

  const share = () => {
    if (navigator.share) {
      navigator
        .share({ title: debate.topic.question, url: window.location.href })
        .catch(() => {});
    } else {
      copyLink().then((ok) => ok && toast(t.interactive.debate.debateLinkCopied));
    }
  };

  return (
    <ClaimEvalContext.Provider
      value={{
        stateMap: evalStateMap,
        evaluations,
        canEvaluate: auth.isReviewer && provenance === "supabase",
        isAdmin: auth.isAdmin,
        topicId: debate.topic.id,
        reload: reloadEvaluations,
        myCamp: reviewerSelf.self?.camp_id ?? null,
        myEndorsements: reviewerSelf.self?.endorsements ?? new Map(),
        positions: debate.positions.map((p) => ({
          id: p.id,
          letter: letterOf(debate, p.id),
          title: p.title,
        })),
        reloadSelf: () => {
          reloadEvaluations();
          reviewerSelf.reload();
        },
        assessments,
        canAssess: auth.isReviewer && provenance === "supabase",
        reloadAssessments,
      }}
    >
    <main className="page">
      <div className="progressbar" aria-hidden="true">
        <i style={{ transform: `scaleX(${progress})` }} />
      </div>
      {/* — hero — */}
      <section className="hero hero--debate">
        <p className="hero__kicker">
          <Link to="/debates" className="hero__back">
            {t.debatePage.back}
          </Link>
          · {t.common.labels.publicPolicy}
        </p>
        <h1 className="hero__question">{debate.topic.question}</h1>
        <p className="hero__summary">{debate.topic.summary}</p>
        <div className="hero__statusrow">
          <div className="hero__status">
            <span>{t.debatePage.heroStatus(revision, debate.sources.length)}</span>
            <span className="backend-pill">
              {provenance === "supabase" ? "Supabase" : "Fixtures"}
            </span>
            <details className="revhistory">
              <summary>{t.features.revHistory}</summary>
              <div className="revhistory__list">
                <span>
                  rev. 1 — {t.features.revSeed} ·{" "}
                  {debate.revision.published_at.slice(0, 10)}
                </span>
                {Array.from(
                  { length: store.revision_bumps[debate.topic.id] ?? 0 },
                  (_, i) => (
                    <span key={i}>
                      rev. {i + 2} — {t.features.revLocal}
                    </span>
                  ),
                )}
              </div>
            </details>
          </div>
          <div className="hero__actions">
            <button className="sharebtn" onClick={share}>
              {t.interactive.debate.share}
            </button>
            <button
              className="btn btn--ghost btn--small"
              onClick={() => setContribOpen(true)}
            >
              {t.debatePage.improve}
            </button>
          </div>
        </div>
        {pending.length > 0 && (
          <Link to="/review" className="pendingbar">
            {t.common.counts.draftContributions(pending.length)}
          </Link>
        )}
        {(debateLoadError ||
          backendAcceptedError ||
          evaluationsError ||
          reviewerSelf.error ||
          assessmentsError) && (
          <div className="form-error" role="alert">
            <p>
              {locale === "fr"
                ? "Certaines données en direct sont indisponibles. Les données locales restent affichées comme provisoires."
                : "Some live data is unavailable. Local data remains visible as provisional."}
            </p>
            {debateLoadError && <p>{debateLoadError}</p>}
            {backendAcceptedError && <p>{backendAcceptedError}</p>}
            {evaluationsError && <p>{evaluationsError}</p>}
            {reviewerSelf.error && <p>{reviewerSelf.error}</p>}
            {assessmentsError && <p>{assessmentsError}</p>}
          </div>
        )}
        <span className="stamp">{t.common.labels.unreviewedStamp}</span>
      </section>

      {/* — state of the debate — */}
      <section className="statewrap">
        <div className="statestrip">
          <span className="statestrip__eyebrow">{t.features.stateEyebrow}</span>
          <span className="statestrip__chip statestrip__chip--est">
            <i />
            {t.features.stateEstablished(
              debate.claims.filter((c) => claimState(debate, c, evalStateMap) === "established").length,
            )}
          </span>
          <span className="statestrip__chip statestrip__chip--con">
            <i />
            {t.features.stateContested(
              debate.claims.filter((c) => claimState(debate, c, evalStateMap) === "contested").length,
            )}
          </span>
          <span className="statestrip__chip statestrip__chip--con">
            <i />
            {locale === "fr"
              ? `${debate.claims.filter((c) => claimState(debate, c, evalStateMap) === "provisional").length} provisoire(s) / inconnue(s)`
              : `${debate.claims.filter((c) => claimState(debate, c, evalStateMap) === "provisional").length} provisional / unknown`}
          </span>
          <span className="statestrip__chip statestrip__chip--val">
            <i />
            {t.features.stateValues(
              debate.claims.filter((c) => claimState(debate, c, evalStateMap) === "values").length,
            )}
          </span>
          <span className="statestrip__note">{t.features.stateNote}</span>
        </div>
        <EvidenceLegend />
        <IntegrityLegend />
      </section>

      {/* — the fault-line map — */}
      <section className="faultline" id="faultline">
        <p className="section__eyebrow">{t.debatePage.faultEyebrow}</p>
        <h2 className="section__title">
          {t.debatePage.faultTitle}
          <br />
          <em>{t.debatePage.faultEm}</em>
        </h2>
        <p className="section__lede">{t.debatePage.faultLede}</p>
        <FaultLineMap debate={debate} onJumpToClaim={jumpToClaim} />
      </section>

      {/* — values quiz — */}
      <section className="quizwrap">
        <ValuesQuiz debate={debate} onPickPosition={choose} />
        <PositionSignalBefore
          debate={debate}
          source={provenance ?? "fixtures"}
        />
      </section>

      {/* — chooser — */}
      <section className="chooser" id="positions">
        <p className="section__eyebrow">{t.debatePage.step1}</p>
        <h2 className="section__title">
          {t.common.counts.seriousAnswers(allPositions.length)}
          <br />
          <em>{t.debatePage.chooserEm}</em>
        </h2>

        <div className="chooser__grid">
          {allPositions.map((p, i) => (
            <button
              key={p.id}
              className={`poscard${p.id === position.id ? " poscard--active" : ""}${
                i >= debate.positions.length ? " poscard--community" : ""
              }`}
              onClick={() => choose(p.id)}
              aria-pressed={p.id === position.id}
            >
              <span className="poscard__letter">{(POSITION_LETTERS[i] ?? "+")}</span>
              <span className="poscard__title">{p.title}</span>
              <span className="poscard__summary">{p.short_summary}</span>
              <span className="poscard__cta">
                {i >= debate.positions.length
                  ? t.debatePage.communityAccepted
                  : p.id === position.id
                    ? t.debatePage.readingBelow
                    : t.debatePage.readThisView}
              </span>
            </button>
          ))}
        </div>
        <p className="chooser__note">{t.debatePage.chooserNote}</p>
      </section>

      {/* — reading — */}
      <section className="readingwrap" id="reading">
        <div
          className="switcher"
          role="group"
          aria-label={t.debatePage.positionAria}
        >
          {allPositions.map((p, i) => {
            const isCommunity = i >= debate.positions.length;
            const hasTest = insightSteelman.some(
              (q) => q.position_id === p.id,
            );
            return (
              <button
                key={p.id}
                aria-pressed={p.id === position.id}
                className={`switcher__pill${
                  p.id === position.id ? " switcher__pill--active" : ""
                }`}
                onClick={() => setSelectedId(p.id)}
              >
                <b aria-hidden="true">{(POSITION_LETTERS[i] ?? "+")}</b>
                <span>{p.title.split("—")[0].trim()}</span>
                {badges[p.id]?.passed && (
                  <span className="switcher__check">
                    <span aria-hidden="true">✓</span>
                    <span className="sr-only">{t.debatePage.switcherPassed}</span>
                  </span>
                )}
                {p.id === matchId && (
                  <span className="switcher__match">
                    <span aria-hidden="true">●</span>
                    <span className="sr-only">{t.debatePage.switcherMatch}</span>
                  </span>
                )}
                {!isCommunity && hasTest && !badges[p.id]?.passed && (
                  <span className="switcher__totest" title={t.debatePage.switcherTakeTest}>
                    <span aria-hidden="true">○</span>
                    <span className="sr-only">{t.debatePage.switcherTakeTest}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Reading
          debate={debate}
          position={position}
          community={!debate.positions.some((p) => p.id === position.id)}
          contestedLinks={contestedLinks}
          steelmanChallenge={steelmanChallenge}
          communityClaims={communityClaims}
          sharedClaims={sharedClaims}
          onTakeTest={positionHasTest ? () => setTestOpen(true) : undefined}
          testBadge={badges[position.id]}
        />
      </section>

      {/* — why we disagree — */}
      <section className="disagree" id="disagree">
        <p className="section__eyebrow">{t.debatePage.step2}</p>
        <h2 className="section__title">
          {t.debatePage.disagreeTitle}
          <br />
          <em>{t.debatePage.disagreeEm}</em>
        </h2>
        <p className="section__lede">{t.debatePage.disagreeLede}</p>
        <ValuesMatrix debate={debate} communityPositions={communityPositions} />
        <PrioritiesWeighting debate={debate} />
        <PerceptionExit debate={debate} />
        <PositionSignal debate={debate} source={provenance ?? "fixtures"} />
      </section>

      {/* — reviewed evidence dossiers — */}
      {isSupabaseConfigured && (
        <PublicClaimDossiers
          topicId={debate.topic.id}
          onChallenge={(evidenceLinkId) => {
            setDossierChallengeEvidenceLinkId(evidenceLinkId);
            setContribOpen(true);
          }}
        />
      )}

      {/* — show the work — */}
      <section className="work" id="work">
        <p className="section__eyebrow">{t.debatePage.workEyebrow}</p>
        <h2 className="section__title">
          {t.debatePage.workTitle}
          <br />
          <em>{t.debatePage.workEm}</em>
        </h2>

        <details className="fold">
          <summary>
            {t.debatePage.allSources}{" "}
            <span className="fold__count">
              {debate.sources.length + communitySources.length}
            </span>
          </summary>
          <div className="fold__body">
            {debate.sources.map((s) => (
              <div key={s.id} className="source">
                <a
                  className="source__title"
                  href={safeHttpUrl(s.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.title} ↗
                </a>
                <span className="source__meta">
                  {s.publisher} · {t.common.sourceTypes[s.source_type]} ·{" "}
                  {t.common.labels.retrieved} {s.retrieved_at}{" "}
                  ·{" "}
                  <b className={`retrieval--${s.retrieval_status}`}>
                    {t.common.retrievalStatuses[s.retrieval_status]}
                  </b>
                </span>
                <span className="source__notes">{s.quality_notes}</span>
                <span className="source__notes">
                  {s.content_hash
                    ? `${locale === "fr" ? "Artefact vérifiable" : "Verifiable artefact"}: ${s.content_hash}`
                    : locale === "fr"
                      ? "Artefact non haché : provenance provisoire."
                      : "Unhashed artefact: provisional provenance."}
                </span>
                <SourceIntegrityChip source={s} />
                <SourceAssessControl source={s} />
              </div>
            ))}
            {communitySources.map((c) => (
              <div key={c.id} className="source source--community">
                <a
                  className="source__title"
                  href={safeHttpUrl(c.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {c.url} ↗
                </a>
                <span className="source__meta">
                  {t.debatePage.communitySubmittedSource}
                </span>
                <span className="source__notes">{c.body}</span>
              </div>
            ))}
          </div>
        </details>

        <details className="fold">
          <summary>
            {t.debatePage.auditTrail} <span className="fold__count">{auditTrail.length}</span>
          </summary>
          <div className="fold__body">
            <div className="audit">
              {auditTrail.map((e) => (
                <div key={e.id} className="audit__event">
                  <span className="audit__type">
                    {t.common.auditEventTypes[e.event_type] ?? e.event_type.replace(/_/g, " ")}
                  </span>
                  <span className="audit__meta">
                    {t.common.actorTypes[e.actor_type]} · {formatTime(e.created_at, locale)}{" "}
                    {t.common.labels.utc}
                  </span>
                  <p className="audit__summary">{e.summary}</p>
                </div>
              ))}
            </div>
            {pending.length > 0 && (
              <Link to="/review" className="pendingbar">
                {t.debatePage.openReviewQueue}
              </Link>
            )}
          </div>
        </details>

        <details className="fold">
          <summary>{t.debatePage.howToRead}</summary>
          <div className="fold__body fold__body--prose">
            <p>{t.debatePage.howToReadP1}</p>
            <p>
              {t.debatePage.howToReadP2Start}{" "}
              <b>{t.common.evidenceLabels.supports_claim}</b>,{" "}
              <b>{t.common.evidenceLabels.partially_supports_claim}</b>,{" "}
              <b>{t.common.evidenceLabels.contradicts_claim}</b>,{" "}
              <b>{t.common.evidenceLabels.does_not_support_claim}</b>,{" "}
              <b>{t.common.evidenceLabels.unclear}</b>. {t.debatePage.howToReadP2End}
            </p>
            <p>{t.debatePage.howToReadP3}</p>
          </div>
        </details>
      </section>

      {/* — continue — */}
      <section className="preview continueband">
        <p className="section__eyebrow">{t.debatePage.continueEyebrow}</p>
        <h2 className="section__title">{t.debatePage.continueTitle}</h2>
        {perceptionDelta !== undefined && perceptionDelta > 0 && (
          <p className="loop__note continueband__delta">
            {t.debatePage.continueDelta(perceptionDelta)}{" "}
            <Link to="/you" className="link">
              {t.debatePage.continueProfileLink}
            </Link>
          </p>
        )}
        {others.length > 0 && (
          <div className="preview__grid preview__grid--pair">
            {others.map((d, i) => (
              <DebateCard key={d.topic.id} debate={d} index={i} />
            ))}
          </div>
        )}
        <p className="preview__more">
          <Link to="/debates" className="btn btn--ghost">
            {t.common.actions.allDebates}
          </Link>{" "}
          <Link to="/you" className="link">
            {t.debatePage.continueYouLink}
          </Link>
        </p>
      </section>

      <ContributePanel
        debate={debate}
        open={contribOpen}
        dossierChallengeEvidenceLinkId={dossierChallengeEvidenceLinkId}
        onClose={() => {
          setContribOpen(false);
          setDossierChallengeEvidenceLinkId(null);
        }}
      />
      <SteelmanTest
        debate={debate}
        position={position}
        open={testOpen}
        onClose={() => setTestOpen(false)}
      />
    </main>
    </ClaimEvalContext.Provider>
  );
}
