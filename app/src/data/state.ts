import type {
  Claim,
  ClaimEvaluation,
  DebateFixture,
  EvidenceLink,
  Source,
  SourceAssessment,
} from "../types";
import { sourceKey } from "../lib/sourceKey";
import { safeHttpUrl } from "../lib/url";

// Kept local so this pure state module can be exercised without importing the
// fixture registry (which eagerly loads every JSON debate).
const POSITION_LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * Canonical epistemic-state derivation, shared by the debate page StateStrip
 * and the library cards' shape bar so the ledger never disagrees with its
 * cards. Previously duplicated verbatim in DebatePage.tsx and DebateCard.tsx.
 */
export type ClaimState =
  | "established"
  | "contested"
  | "provisional"
  | "values";

const POSITIVE_LABELS = new Set([
  "supports_claim",
  "partially_supports_claim",
]);

type EvaluationValue = ClaimState | ClaimEvaluation;

const SHA256 = /^sha256:[0-9a-f]{64}$/;

function isInspectableLink(
  debate: DebateFixture,
  link: EvidenceLink,
  sourceAssessments?: ReadonlyMap<string, SourceAssessment>,
): boolean {
  if (
    link.review_status !== "approved" ||
    link.assessment_state !== "assessed" ||
    typeof link.rationale !== "string" ||
    link.rationale.trim().length < 8 ||
    link.rationale.trim().length > 2000 ||
    !link.source_excerpt_id
  ) {
    return false;
  }

  const source = debate.sources.find((item) => item.id === link.source_id);
  if (!source || !isInspectableSource(source)) return false;

  const excerpt = debate.source_excerpts?.find(
    (item) =>
      item.id === link.source_excerpt_id && item.source_id === link.source_id,
  );
  if (
    !excerpt ||
    typeof excerpt.text !== "string" ||
    excerpt.text.trim() === "" ||
    typeof excerpt.locator !== "string" ||
    excerpt.locator.trim() === ""
  ) {
    return false;
  }

  const assessment = sourceAssessments?.get(sourceKey(source.url));
  return Boolean(
    assessment &&
      assessment.assessment_state === "confirmed" &&
      assessment.content_hash === source.content_hash &&
      assessment.floor_verdict !== "unknown" &&
      assessment.floor_verdict !== "below_floor" &&
      !assessment.is_demo &&
      assessment.attributes &&
      typeof assessment.attributes === "object" &&
      Object.values(assessment.attributes).every(
        (value) =>
          typeof value === "string" &&
          value.trim() !== "" &&
          value !== "unknown",
      ),
  );
}

function isInspectableSource(source: Source): boolean {
  return (
    (source.retrieval_status === "found" ||
      source.retrieval_status === "partial") &&
    typeof source.retrieved_at === "string" &&
    source.retrieved_at.trim() !== "" &&
    typeof source.content_hash === "string" &&
    SHA256.test(source.content_hash) &&
    typeof source.url === "string" &&
    Boolean(safeHttpUrl(source.url))
  );
}

function isBridgedEstablishment(value: EvaluationValue | undefined): boolean {
  return Boolean(
    value &&
      typeof value !== "string" &&
      value.state === "established" &&
      value.bridged === true &&
      value.bridge_status === "bridged_established" &&
      (value.camp_count ?? 0) >= 2 &&
      value.endorser_band !== undefined &&
      value.endorser_band !== "withheld" &&
      value.is_demo === false &&
      typeof value.evaluated_at === "string" &&
      value.evaluated_at.trim() !== "" &&
      typeof value.rationale === "string" &&
      value.rationale.trim().length >= 8 &&
      value.rationale.trim().length <= 2000,
  );
}

function evaluationState(
  value: EvaluationValue | undefined,
): ClaimState | null {
  if (!value) return null;
  return typeof value === "string" ? value : (value.state ?? null);
}

/** Establishment is displayable only when the client has the same minimum
 *  bridge + evidence proof that the hardened database requires. Missing source
 *  assessments, legacy links, or a state-only evaluation map fail closed. */
function hasEstablishmentEvidence(
  debate: DebateFixture,
  claim: Claim,
  sourceAssessments?: ReadonlyMap<string, SourceAssessment>,
): boolean {
  return debate.evidence_links.some(
    (link) =>
      link.claim_id === claim.id &&
      POSITIVE_LABELS.has(link.label) &&
      isInspectableLink(debate, link, sourceAssessments),
  );
}

/** The single source of truth for a claim's derived epistemic state. A stored,
 *  reviewer-authored evaluation (G2), when present, is authoritative over the
 *  heuristic — the Library-of-Truths record wins. */
export function claimState(
  debate: DebateFixture,
  claim: Claim,
  evaluations?: ReadonlyMap<string, EvaluationValue>,
  sourceAssessments?: ReadonlyMap<string, SourceAssessment>,
): ClaimState {
  // A normative proposition is a values choice even if stale backend data says
  // otherwise. It can be discussed and reviewed, never heuristically proved.
  if (claim.claim_type.includes("normative")) return "values";

  const stored = evaluations?.get(claim.id);
  const storedState = evaluationState(stored);
  if (storedState === "established") {
    // A bare state string is insufficient: only the full bridge DTO can prove
    // that establishment came from the cross-camp server gate.
    return claim.review_status === "approved" &&
      isBridgedEstablishment(stored) &&
      hasEstablishmentEvidence(debate, claim, sourceAssessments)
      ? "established"
      : "provisional";
  }
  if (storedState) return storedState;

  // A label only describes a source-claim relation. Without an auditable claim
  // evaluation it can contest a claim, but it cannot establish one.
  if (claim.review_status === "unreviewed") return "provisional";
  if (
    claim.review_status === "contested" ||
    claim.review_status === "rejected"
  ) {
    return "contested";
  }

  const links = debate.evidence_links.filter((l) => l.claim_id === claim.id);
  const hasReviewedChallenge = links.some(
    (link) =>
      (link.label === "contradicts_claim" ||
        link.label === "does_not_support_claim") &&
      isInspectableLink(debate, link, sourceAssessments),
  );
  return hasReviewedChallenge ? "contested" : "provisional";
}

/** The four aggregate temperaments the corpus can show at a glance. */
export type Temperament =
  | "settled"
  | "contested"
  | "provisional"
  | "values";

/** Per-debate aggregate of claim states + the dominant temperament. */
export function debateShape(
  debate: DebateFixture,
  evaluations?: ReadonlyMap<string, EvaluationValue>,
  sourceAssessments?: ReadonlyMap<string, SourceAssessment>,
): {
  established: number;
  contested: number;
  provisional: number;
  values: number;
  total: number;
  temperament: Temperament;
} {
  let established = 0;
  let contested = 0;
  let provisional = 0;
  let values = 0;
  for (const claim of debate.claims) {
    const s = claimState(debate, claim, evaluations, sourceAssessments);
    if (s === "established") established += 1;
    else if (s === "contested") contested += 1;
    else if (s === "provisional") provisional += 1;
    else values += 1;
  }
  const total = established + contested + provisional + values;
  // A non-settled temperament appears only when that exclusive state is a real
  // share of the corpus (>= a quarter of its claims). Provisional is never
  // folded into contested: pending review and an actual challenge are
  // materially different signals.
  let temperament: Temperament = "settled";
  if (
    values >= contested &&
    values >= provisional &&
    values * 4 >= total &&
    values > 0
  ) {
    temperament = "values";
  } else if (
    contested >= provisional &&
    contested * 4 >= total &&
    contested > 0
  ) {
    temperament = "contested";
  } else if (provisional * 4 >= total && provisional > 0) {
    temperament = "provisional";
  }
  return {
    established,
    contested,
    provisional,
    values,
    total,
    temperament,
  };
}

/** Letters of every position whose arguments reference a given claim id. */
export function claimSharedBy(debate: DebateFixture): Map<string, string[]> {
  const byClaim = new Map<string, Set<string>>();
  for (const arg of debate.arguments) {
    const idx = debate.positions.findIndex((p) => p.id === arg.position_id);
    if (idx < 0) continue;
    for (const claimId of arg.claim_ids) {
      const set = byClaim.get(claimId) ?? new Set<string>();
      set.add(POSITION_LETTERS[idx]);
      byClaim.set(claimId, set);
    }
  }
  const out = new Map<string, string[]>();
  for (const [claimId, set] of byClaim) {
    if (set.size > 1) out.set(claimId, [...set].sort());
  }
  return out;
}
