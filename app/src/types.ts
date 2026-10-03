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
}
