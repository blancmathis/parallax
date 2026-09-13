export type ReviewStatus = "unreviewed" | "approved" | "contested" | "rejected";
export type GeneratedBy = "human" | "ai" | "mixed";

export type EvidenceLabel =
  | "supports_claim"
  | "partially_supports_claim"
  | "contradicts_claim"
  | "does_not_support_claim"
  | "unclear";

export type EvidenceAssessmentState =
  | "legacy_unverified"
  | "not_assessed"
  | "pending_review"
  | "assessed"
  | "inconclusive"
  | "error";

export type ClaimType =
  | "factual"
  | "causal"
  | "predictive"
  | "normative"
  | "definitional";

export interface Topic {
  id: string;
  title: string;
  question: string;
  summary: string;
  status: "draft" | "published" | "archived";
  current_revision_id: string;
  created_at: string;
  created_by: string;
}

export interface DebateRevision {
  id: string;
  topic_id: string;
  revision_number: number;
  status: "draft" | "published" | "superseded";
  published_at: string;
  published_by: string;
}

export interface Position {
  id: string;
  topic_id: string;
  title: string;
  short_summary: string;
  steelman: string;
  status: "draft" | "published" | "contested" | "archived";
  argument_ids: string[];
  value_ids: string[];
  tradeoff_ids: string[];
  generated_by: GeneratedBy;
  review_status: ReviewStatus;
}

export interface Argument {
  id: string;
  position_id: string;
  direction: "supports" | "opposes" | "qualifies";
  summary: string;
  claim_ids: string[];
  generated_by: GeneratedBy;
  review_status: ReviewStatus;
  origin_dossier_submission_id?: string | null;
}

export interface Claim {
  id: string;
  text: string;
  claim_type: ClaimType[];
  topic_id: string;
  evidence_link_ids: string[];
  generated_by: GeneratedBy;
  review_status: ReviewStatus;
  origin_dossier_submission_id?: string | null;
}

export interface Source {
  id: string;
  url: string;
  title: string;
  publisher: string;
  source_type: "article" | "paper" | "report" | "law" | "dataset" | "video" | "other";
  retrieval_status: "found" | "missing" | "blocked" | "failed" | "partial";
  retrieved_at: string;
  quality_notes: string;
  /** SHA-256 of the exact retrieved artefact, qualified as `sha256:<hex>`.
   *  `null` means the source is known but no reproducible artefact hash is
   *  available; omission is reserved for legacy backend payloads. */
  content_hash?: string | null;
  /** Private capture provenance exposed only as an opaque immutable reference. */
  source_artifact_id?: string | null;
  origin_dossier_submission_id?: string | null;
}

export interface SourceExcerpt {
  id: string;
  source_id: string;
  /** Exact source text. Translated mirrors must keep these bytes unchanged. */
  text: string;
  /** Human-inspectable page, section, paragraph, table, or other locator. */
  locator: string;
  extracted_by: "human" | "ai" | "system";
  created_at?: string;
  start_offset?: number | null;
  end_offset?: number | null;
  offset_unit?: "utf8_bytes_v1" | null;
  excerpt_hash?: string | null;
  origin_dossier_submission_id?: string | null;
}

export interface EvidenceLink {
  id: string;
  claim_id: string;
  source_id: string;
  label: EvidenceLabel;
  rationale: string;
  confidence: number;
  review_status: ReviewStatus;
  /** Hardened backend assessment state. Missing means a legacy fixture/payload
   *  and must never be treated as reviewed evidence. */
  assessment_state?: EvidenceAssessmentState;
  /** Optional exact passage backing this claim-source alignment. */
  source_excerpt_id?: string | null;
  /** Search coverage role, deliberately independent from the evidence label. */
  research_role?: "support" | "counter" | null;
  origin_dossier_submission_id?: string | null;
}

export interface Value {
  id: string;
  topic_id: string;
  name: string;
  description: string;
  position_ids: string[];
  tension_with: string[];
}

export interface TradeOff {
  id: string;
  topic_id: string;
  position_id: string;
  gain: string;
  cost: string;
  risk: string;
  review_status: ReviewStatus;
}

export interface AuditEvent {
  id: string;
  topic_id: string;
  revision_id: string;
  actor_type: "user" | "admin" | "ai" | "system";
  actor_id: string;
  event_type: string;
  summary: string;
  created_at: string;
}

export type ContributionType =
  | "new_claim"
  | "new_source"
  | "new_position"
  | "challenge_evidence_label"
  | "challenge_steelman"
  | "value_tradeoff_correction";

export interface Contribution {
  id: string;
  topic_id: string;
  type: ContributionType;
  body: string;
  title?: string;
  url?: string;
  proposed_label?: EvidenceLabel;
  target_object_id?: string;
  status: "submitted" | "accepted" | "rejected";
  // canonical merge (D4): set once an accepted contribution has been merged into
  // a new published revision. "merged" = merged_revision_id != null.
  merged_revision_id?: string | null;
  merged_at?: string | null;
  created_by: string;
  created_at: string;
}

export interface Review {
  id: string;
  target_object_id: string;
  target_object_type: "contribution";
  decision: "approve" | "reject";
  rationale: string;
  reviewed_by: string;
  reviewed_at: string;
}

export interface DebateFixture {
  topic: Topic;
  revision: DebateRevision;
  positions: Position[];
  arguments: Argument[];
  claims: Claim[];
  sources: Source[];
  /** Exact passages are separate artefacts so one source remains one source. */
  source_excerpts?: SourceExcerpt[];
  evidence_links: EvidenceLink[];
  values: Value[];
  tradeoffs: TradeOff[];
  audit_events: AuditEvent[];
}

/* ————— Position signal (D15) — aggregate-only, anonymous ————— */
export type SignalPhase = "before" | "after";
export type SignalConfidence = "emerging" | "forming" | "settled";

/** One bucket of the anonymous distribution. RANGES, never raw live counts;
 *  ordered by position_id (canonical), NEVER ranked. */
export interface PositionShare {
  position_id: string; // fixture-style id ("pos_a") or "__undecided__"
  phase: SignalPhase;
  withheld: boolean; // true => below the k-anonymity floor, share hidden
  share_lo: number | null;
  share_hi: number | null;
}

/** The only signal object served to the client. Aggregate-only, anonymous. */
export interface PositionAggregate {
  topic_id: string;
  is_demo: boolean; // true for fixture/seed demo — the UI must badge it
  released: boolean; // k-anonymity release gate (min phase total >= 20)
  totals: Partial<Record<SignalPhase, number>>;
  confidence: SignalConfidence;
  distribution: PositionShare[];
  source: "supabase" | "fixtures";
}

/* ————— Claim evaluations (G2) + bridging consensus (cross-camp gate) ————— */
export type ClaimEvalState = "established" | "contested" | "values";

/** Cross-camp bridging outcome for a claim (extends G2). */
export type BridgeStatus =
  | "bridged_established"
  | "bridged_contested"
  | "bridged_conflicting" // >=2 camps bridged BOTH states — honest unresolved
  | "pending_single_camp"
  | "insufficient";

export type EndorserBand = "withheld" | "5to19" | "20plus";

/** A dated, audited evaluation of a claim's state. Identity-free on the wire.
 *  `state` is null for an endorsed-but-unbridged claim (the heuristic stays).
 *  Bridging fields are absent under FR / no backend. */
export interface ClaimEvaluation {
  claim_id: string;
  state: ClaimEvalState | null;
  rationale: string;
  evaluated_at: string | null;
  is_demo: boolean;
  bridged?: boolean;
  bridge_status?: BridgeStatus;
  camp_count?: number; // distinct camps; 0 when withheld below the public floor
  endorser_band?: EndorserBand;
}

/** Reviewer-only: the VIEWING reviewer's own camp + endorsements. Never others'. */
export type EndorsementSelf = Map<string, "established" | "contested">;
export interface ReviewerSelf {
  camp_id: string | null; // 'pos_a'… | '__undecided__' | null (undeclared)
  endorsements: EndorsementSelf;
}

/* ————— Source integrity floor (v1) — rules, not a vote; integrity ≠ relevance ————— */
export type IntegrityVerdict =
  | "meets_floor" // no rule fired — the client renders NO chip (not an endorsement)
  | "attribution_required"
  | "context_required"
  | "below_floor"
  | "unknown";

export type SourceAssessmentState =
  | "unassessed"
  | "stale"
  | "legacy_unverified"
  | "pending_review"
  | "confirmed";

export type FloorRuleId =
  | "ugc_controversial_factual"
  | "no_editorial_accountability"
  | "opinion_attribution"
  | "conflict_context"
  | "high_bar_domain"
  | "documented_fabrication"
  | "no_floor_rule";

export interface IntegrityAttributes {
  content_genre: string;
  editorial_accountability: string;
  correction_policy: string;
  fabrication_record: string;
  independence: string;
  expertise_basis: string;
  identity_basis: string;
  sensitive_domain: string;
}

export interface SourceAssessment {
  source_key: string; // normalized url — the overlay join key
  content_hash: string | null;
  assessment_state: SourceAssessmentState;
  floor_verdict: IntegrityVerdict;
  rule_id: FloorRuleId | (string & {}); // forward-compat; unknown → render nothing
  rationale?: string;
  is_demo: boolean;
  attributes: IntegrityAttributes;
}
