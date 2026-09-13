import type { EvidenceLabel } from "../../types";
import { requireSupabase } from "../../lib/supabase";
import { requireReviewRationale } from "../workflow/model";
import {
  buildClaimDossierPayload,
  dossierSourceUrl,
  type CapturedSourceArtifact,
  type ClaimDossierDraft,
  type DossierArgumentDirection,
  type DossierResearchRole,
  type DossierSubmissionKind,
  type SourceCaptureStatus,
} from "./model";

export type ClaimDossierStatus =
  | "submitted"
  | "changes_requested"
  | "accepted"
  | "rejected";
export type ClaimDossierReviewDecision = "request_changes" | "approve" | "reject";
export type ClaimDossierDisplayStatus = ClaimDossierStatus | "reviewed_and_published";

export interface ClaimDossierArtifactView {
  /** Private immutable artefact id. Always null in the public projection. */
  artifact_id: string | null;
  public_source_id: string | null;
  requested_url: string;
  final_url: string;
  status: SourceCaptureStatus;
  content_type: string;
  byte_length: number;
  raw_hash: string;
  normalized_hash: string;
  normalized_text: string | null;
  title: string;
  publisher: string;
  source_type: string;
  parser_version: string;
  is_truncated: boolean;
  captured_at: string;
}

export interface ClaimDossierEvidenceRecord {
  id: string;
  evidence_link_id: string | null;
  research_role: DossierResearchRole;
  source_artifact_id: string | null;
  start_offset: number;
  end_offset: number;
  offset_unit: "utf8_bytes_v1";
  exact_excerpt: string;
  excerpt_hash: string;
  locator: string;
  label: EvidenceLabel;
  rationale: string;
  artifact: ClaimDossierArtifactView;
}

export interface ClaimDossierReviewRecord {
  decision: ClaimDossierReviewDecision;
  rationale: string;
  reviewed_at: string;
}

export interface ClaimDossierChangeSet {
  change_set_id: string | null;
  prepared_revision_id: string | null;
  base_snapshot_hash: string | null;
  prepared_snapshot_hash: string | null;
  change_hash: string | null;
  changes: unknown;
}

export interface ClaimDossierRecord {
  id: string;
  contribution_id: string;
  topic_id: string;
  base_revision_id: string;
  revision_id: string | null;
  submission_kind: DossierSubmissionKind;
  target_position_id: string;
  target_evidence_link_id: string | null;
  claim_profile: "factual_descriptive_v1";
  claim_text: string;
  argument_summary: string;
  argument_direction: DossierArgumentDirection;
  scope_note: string;
  language: string;
  status: ClaimDossierDisplayStatus;
  prepared_revision_id: string | null;
  supersedes_submission_id: string | null;
  created_at: string;
  published_at: string | null;
  pilot_limit: string | null;
  disclaimer: string | null;
  review: ClaimDossierReviewRecord | null;
  evidence: ClaimDossierEvidenceRecord[];
  change_set: ClaimDossierChangeSet | null;
}

export interface SubmitClaimDossierResult {
  id: string;
  status: ClaimDossierStatus;
  idempotent: boolean;
}

export interface PrepareClaimDossierResult {
  revision_id: string;
  change_set_id: string;
  idempotent: boolean;
}

type JsonObject = Record<string, unknown>;

const CAPTURE_STATUSES = [
  "found",
  "partial",
  "blocked",
  "failed",
  "missing",
  "oversize",
  "unsupported",
] as const;
const EVIDENCE_LABELS = [
  "supports_claim",
  "partially_supports_claim",
  "contradicts_claim",
  "does_not_support_claim",
  "unclear",
] as const;
const DOSSIER_STATUSES = [
  "submitted",
  "changes_requested",
  "accepted",
  "rejected",
] as const;
const REVIEW_DECISIONS = ["request_changes", "approve", "reject"] as const;
const HASH = /^sha256:[0-9a-f]{64}$/;

function fail(context: string, field: string): never {
  throw new Error(`Invalid ${context} response: ${field}.`);
}

function record(value: unknown, context: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(context, "expected an object");
  }
  return value as JsonObject;
}

function string(row: JsonObject, key: string, context: string): string {
  const value = row[key];
  if (typeof value !== "string" || !value.trim()) fail(context, key);
  return value as string;
}

function nullableString(row: JsonObject, key: string, context: string): string | null {
  const value = row[key];
  if (value === null) return null;
  if (typeof value !== "string" || !value.trim()) fail(context, key);
  return value as string;
}

function optionalNullableString(
  row: JsonObject,
  key: string,
  context: string,
): string | null {
  return key in row ? nullableString(row, key, context) : null;
}

function finiteNumber(row: JsonObject, key: string, context: string): number {
  const value = row[key];
  if (typeof value !== "number" || !Number.isFinite(value)) fail(context, key);
  return value as number;
}

function boolean(row: JsonObject, key: string, context: string): boolean {
  const value = row[key];
  if (typeof value !== "boolean") fail(context, key);
  return value as boolean;
}

function enumValue<T extends string>(
  row: JsonObject,
  key: string,
  allowed: readonly T[],
  context: string,
): T {
  const value = row[key];
  if (typeof value !== "string" || !allowed.includes(value as T)) fail(context, key);
  return value as T;
}

function hash(row: JsonObject, key: string, context: string): string {
  const value = string(row, key, context);
  if (!HASH.test(value)) fail(context, key);
  return value;
}

function nullableHash(row: JsonObject, key: string, context: string): string | null {
  const value = nullableString(row, key, context);
  if (value !== null && !HASH.test(value)) fail(context, key);
  return value;
}

function array(value: unknown, context: string): unknown[] {
  if (!Array.isArray(value)) fail(context, "expected an array");
  return value as unknown[];
}

function reviewFrom(value: unknown, context: string): ClaimDossierReviewRecord | null {
  if (value === null) return null;
  const row = record(value, `${context} review`);
  return {
    decision: enumValue(row, "decision", REVIEW_DECISIONS, `${context} review`),
    rationale: string(row, "rationale", `${context} review`),
    reviewed_at: string(row, "reviewed_at", `${context} review`),
  };
}

function privateArtifactFrom(
  value: unknown,
  context: string,
  requireNormalizedText: boolean,
): ClaimDossierArtifactView {
  const row = record(value, context);
  const normalizedText = optionalNullableString(row, "normalized_text", context);
  if (requireNormalizedText && normalizedText === null) fail(context, "normalized_text");
  return {
    artifact_id: string(row, "artifact_id", context),
    public_source_id: null,
    requested_url: string(row, "requested_url", context),
    final_url: string(row, "final_url", context),
    status: enumValue(row, "status", ["found", "partial"] as const, context),
    content_type: string(row, "content_type", context),
    byte_length: finiteNumber(row, "byte_length", context),
    raw_hash: hash(row, "raw_hash", context),
    normalized_hash: hash(row, "normalized_hash", context),
    normalized_text: normalizedText,
    title: string(row, "title", context),
    publisher: string(row, "publisher", context),
    source_type: string(row, "source_type", context),
    parser_version: string(row, "parser_version", context),
    is_truncated: boolean(row, "is_truncated", context),
    captured_at: string(row, "captured_at", context),
  };
}

function privateEvidenceFrom(
  value: unknown,
  dossierId: string,
  index: number,
  requireNormalizedText: boolean,
): ClaimDossierEvidenceRecord {
  const context = `claim dossier evidence ${index}`;
  const row = record(value, context);
  const role = enumValue(row, "research_role", ["support", "counter"] as const, context);
  const artifactId = string(row, "source_artifact_id", context);
  const artifact = privateArtifactFrom(row.artifact, `${context} artifact`, requireNormalizedText);
  if (artifact.artifact_id !== artifactId) fail(context, "artifact identity mismatch");
  return {
    id: `${dossierId}:${role}`,
    evidence_link_id: null,
    research_role: role,
    source_artifact_id: artifactId,
    start_offset: finiteNumber(row, "start_offset", context),
    end_offset: finiteNumber(row, "end_offset", context),
    offset_unit: enumValue(row, "offset_unit", ["utf8_bytes_v1"] as const, context),
    exact_excerpt: string(row, "exact_excerpt", context),
    excerpt_hash: hash(row, "excerpt_hash", context),
    locator: string(row, "locator", context),
    label: enumValue(row, "label", EVIDENCE_LABELS, context),
    rationale: string(row, "rationale", context),
    artifact,
  };
}

function changeSetFromPrivate(row: JsonObject, context: string): ClaimDossierChangeSet | null {
  if (!("change_set" in row) || row.change_set === null) return null;
  const value = record(row.change_set, `${context} change set`);
  if ("id" in value) {
    return {
      change_set_id: string(value, "id", `${context} change set`),
      prepared_revision_id: string(value, "prepared_revision_id", `${context} change set`),
      base_snapshot_hash: hash(value, "base_snapshot_hash", `${context} change set`),
      prepared_snapshot_hash: hash(value, "prepared_snapshot_hash", `${context} change set`),
      change_hash: hash(value, "change_hash", `${context} change set`),
      changes: value.change_set,
    };
  }
  return {
    change_set_id: null,
    prepared_revision_id: optionalNullableString(row, "prepared_revision_id", context),
    base_snapshot_hash: optionalNullableString(row, "base_snapshot_hash", context),
    prepared_snapshot_hash: optionalNullableString(row, "prepared_snapshot_hash", context),
    change_hash: optionalNullableString(row, "change_hash", context),
    changes: value,
  };
}

function privateDossierFrom(
  value: unknown,
  context: string,
  requireDetail: boolean,
): ClaimDossierRecord {
  const row = record(value, context);
  const id = string(row, "id", context);
  const evidenceValues = "evidence" in row ? array(row.evidence, `${context} evidence`) : [];
  if (requireDetail && evidenceValues.length !== 2) fail(context, "evidence");
  const evidence = evidenceValues.map((item, index) =>
    privateEvidenceFrom(item, id, index, requireDetail),
  );
  if (
    evidence.length > 0 &&
    (evidence.length !== 2 ||
      evidence.filter((item) => item.research_role === "support").length !== 1 ||
      evidence.filter((item) => item.research_role === "counter").length !== 1)
  ) {
    fail(context, "support/counter evidence pair");
  }
  return {
    id,
    contribution_id: id,
    topic_id: string(row, "topic_id", context),
    base_revision_id: string(row, "base_revision_id", context),
    revision_id: null,
    submission_kind: enumValue(row, "submission_kind", ["new_claim", "challenge"] as const, context),
    target_position_id: string(row, "target_position_id", context),
    target_evidence_link_id: nullableString(row, "target_evidence_link_id", context),
    claim_profile: enumValue(row, "claim_profile", ["factual_descriptive_v1"] as const, context),
    claim_text: string(row, "claim_text", context),
    argument_summary: string(row, "argument_summary", context),
    argument_direction: enumValue(
      row,
      "argument_direction",
      ["supports", "opposes", "qualifies"] as const,
      context,
    ),
    scope_note: string(row, "scope_note", context),
    language: string(row, "language", context),
    status: enumValue(row, "status", DOSSIER_STATUSES, context),
    prepared_revision_id: nullableString(row, "prepared_revision_id", context),
    supersedes_submission_id: nullableString(row, "supersedes_submission_id", context),
    created_at: string(row, "created_at", context),
    published_at: null,
    pilot_limit: null,
    disclaimer: null,
    review: reviewFrom(row.review ?? null, context),
    evidence,
    change_set: changeSetFromPrivate(row, context),
  };
}

function publicSourceFrom(value: unknown, context: string): ClaimDossierArtifactView {
  const row = record(value, context);
  return {
    artifact_id: null,
    public_source_id: string(row, "id", context),
    requested_url: string(row, "url", context),
    final_url: string(row, "url", context),
    status: enumValue(row, "retrieval_status", ["found", "partial"] as const, context),
    content_type: string(row, "content_type", context),
    byte_length: finiteNumber(row, "byte_length", context),
    raw_hash: hash(row, "content_hash", context),
    normalized_hash: hash(row, "normalized_hash", context),
    normalized_text: null,
    title: string(row, "title", context),
    publisher: string(row, "publisher", context),
    source_type: string(row, "source_type", context),
    parser_version: string(row, "parser_version", context),
    is_truncated: boolean(row, "is_truncated", context),
    captured_at: string(row, "retrieved_at", context),
  };
}

function publicEvidenceFrom(value: unknown, index: number): ClaimDossierEvidenceRecord {
  const context = `public claim dossier evidence ${index}`;
  const row = record(value, context);
  const evidenceLinkId = string(row, "evidence_link_id", context);
  return {
    id: evidenceLinkId,
    evidence_link_id: evidenceLinkId,
    research_role: enumValue(row, "research_role", ["support", "counter"] as const, context),
    source_artifact_id: null,
    start_offset: finiteNumber(row, "start_offset", context),
    end_offset: finiteNumber(row, "end_offset", context),
    offset_unit: enumValue(row, "offset_unit", ["utf8_bytes_v1"] as const, context),
    exact_excerpt: string(row, "exact_excerpt", context),
    excerpt_hash: hash(row, "excerpt_hash", context),
    locator: string(row, "locator", context),
    label: enumValue(row, "relation", EVIDENCE_LABELS, context),
    rationale: string(row, "rationale", context),
    artifact: publicSourceFrom(row.source, `${context} source`),
  };
}

function publicDossierFrom(value: unknown, index: number): ClaimDossierRecord {
  const context = `public claim dossier ${index}`;
  const row = record(value, context);
  const id = string(row, "id", context);
  enumValue(row, "review_status", ["reviewed_and_published"] as const, context);
  const revisionId = string(row, "revision_id", context);
  const publishedAt = string(row, "published_at", context);
  const evidence = array(row.evidence, `${context} evidence`).map(publicEvidenceFrom);
  if (
    evidence.length !== 2 ||
    evidence.filter((item) => item.research_role === "support").length !== 1 ||
    evidence.filter((item) => item.research_role === "counter").length !== 1
  ) {
    fail(context, "support/counter evidence pair");
  }
  return {
    id,
    contribution_id: id,
    topic_id: string(row, "topic_id", context),
    base_revision_id: string(row, "base_revision_id", context),
    revision_id: revisionId,
    submission_kind: enumValue(row, "submission_kind", ["new_claim", "challenge"] as const, context),
    target_position_id: string(row, "target_position_id", context),
    target_evidence_link_id: nullableString(row, "target_evidence_link_id", context),
    claim_profile: enumValue(row, "claim_profile", ["factual_descriptive_v1"] as const, context),
    claim_text: string(row, "claim_text", context),
    argument_summary: string(row, "argument_summary", context),
    argument_direction: enumValue(
      row,
      "argument_direction",
      ["supports", "opposes", "qualifies"] as const,
      context,
    ),
    scope_note: string(row, "scope_note", context),
    language: string(row, "language", context),
    status: "reviewed_and_published",
    prepared_revision_id: revisionId,
    supersedes_submission_id: null,
    created_at: publishedAt,
    published_at: publishedAt,
    pilot_limit: string(row, "pilot_limit", context),
    disclaimer: string(row, "disclaimer", context),
    review: reviewFrom(row.review, context),
    evidence,
    change_set: {
      change_set_id: null,
      prepared_revision_id: revisionId,
      base_snapshot_hash: null,
      prepared_snapshot_hash: null,
      change_hash: hash(row, "change_hash", context),
      changes: row.change_set,
    },
  };
}

export function parseCaptureSourceResponse(data: unknown): CapturedSourceArtifact {
  const context = "capture-source";
  const row = record(data, context);
  const status = enumValue(row, "status", CAPTURE_STATUSES, context);
  const ok = boolean(row, "ok", context);
  const artifactId = nullableString(row, "artifact_id", context);
  const rawHash = nullableHash(row, "raw_hash", context);
  const normalizedHash = nullableHash(row, "normalized_hash", context);
  const normalizedText = nullableString(row, "normalized_text", context);
  if (
    (status === "found" || status === "partial") &&
    (!ok || artifactId === null || rawHash === null || normalizedHash === null || normalizedText === null)
  ) {
    fail(context, "successful capture shape");
  }
  if (
    status !== "found" &&
    status !== "partial" &&
    (!ok || artifactId === null || rawHash !== null || normalizedHash !== null || normalizedText !== null)
  ) {
    fail(context, "failed capture shape");
  }
  return {
    ok,
    artifact_id: artifactId,
    requested_url: string(row, "requested_url", context),
    final_url: string(row, "final_url", context),
    status,
    content_type: string(row, "content_type", context),
    byte_length: finiteNumber(row, "byte_length", context),
    raw_hash: rawHash,
    normalized_hash: normalizedHash,
    normalized_text: normalizedText,
    title: string(row, "title", context),
    publisher: string(row, "publisher", context),
    source_type: string(row, "source_type", context),
    parser_version: string(row, "parser_version", context),
    is_truncated: boolean(row, "is_truncated", context),
    captured_at: string(row, "captured_at", context),
    reused: boolean(row, "reused", context),
  };
}

export function parsePrivateClaimDossierList(data: unknown): ClaimDossierRecord[] {
  return array(data, "private claim dossier list").map((item, index) =>
    privateDossierFrom(item, `private claim dossier ${index}`, false),
  );
}

export function parseClaimDossierDetail(data: unknown): ClaimDossierRecord {
  return privateDossierFrom(data, "claim dossier detail", true);
}

export function parsePublicClaimDossierList(data: unknown): ClaimDossierRecord[] {
  return array(data, "public claim dossier list").map(publicDossierFrom);
}

export async function captureClaimDossierSource(
  sourceUrl: string,
  idempotencyKey: string,
): Promise<CapturedSourceArtifact> {
  const url = dossierSourceUrl(sourceUrl);
  if (!url) {
    throw new Error(
      "Use a public HTTP(S) URL without credentials, a non-standard port, or sensitive query parameters.",
    );
  }
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("capture-source", {
    body: { url, idempotency_key: idempotencyKey },
  });
  if (error) throw error;
  return parseCaptureSourceResponse(data);
}

export async function submitClaimDossier(
  draft: ClaimDossierDraft,
  idempotencyKey: string,
): Promise<SubmitClaimDossierResult> {
  const payload = await buildClaimDossierPayload(draft);
  const client = requireSupabase();
  const { data, error } = await client.rpc("submit_claim_dossier", {
    p_payload: payload,
    p_idempotency_key: idempotencyKey,
  });
  if (error) throw error;
  const row = record(data, "submit_claim_dossier");
  return {
    id: string(row, "id", "submit_claim_dossier"),
    status: enumValue(row, "status", DOSSIER_STATUSES, "submit_claim_dossier"),
    idempotent: boolean(row, "idempotent", "submit_claim_dossier"),
  };
}

async function getPrivateDossiers(
  rpc: "get_my_claim_dossiers" | "get_review_claim_dossiers",
  topicId: string,
): Promise<ClaimDossierRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc(rpc, {
    p_topic_id: topicId,
    p_limit: 25,
    p_before: null,
  });
  if (error) throw error;
  return parsePrivateClaimDossierList(data);
}

export function getMyClaimDossiers(topicId: string): Promise<ClaimDossierRecord[]> {
  return getPrivateDossiers("get_my_claim_dossiers", topicId);
}

export function getReviewClaimDossiers(topicId: string): Promise<ClaimDossierRecord[]> {
  return getPrivateDossiers("get_review_claim_dossiers", topicId);
}

export async function getClaimDossierDetail(submissionId: string): Promise<ClaimDossierRecord> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("get_claim_dossier_detail", {
    p_submission_id: submissionId,
  });
  if (error) throw error;
  return parseClaimDossierDetail(data);
}

export async function getPublicClaimDossiers(topicId: string): Promise<ClaimDossierRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("get_public_claim_dossiers", {
    p_topic_id: topicId,
  });
  if (error) throw error;
  return parsePublicClaimDossierList(data);
}

export async function reviewClaimDossier(
  submissionId: string,
  decision: ClaimDossierReviewDecision,
  rationale: string,
): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.rpc("review_claim_dossier", {
    p_submission_id: submissionId,
    p_decision: decision,
    p_rationale: requireReviewRationale(rationale),
  });
  if (error) throw error;
}

export async function prepareClaimDossierRevision(
  submissionId: string,
): Promise<PrepareClaimDossierResult> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("prepare_claim_dossier_revision", {
    p_submission_id: submissionId,
  });
  if (error) throw error;
  const row = record(data, "prepare_claim_dossier_revision");
  return {
    revision_id: string(row, "revision_id", "prepare_claim_dossier_revision"),
    change_set_id: string(row, "change_set_id", "prepare_claim_dossier_revision"),
    idempotent: boolean(row, "idempotent", "prepare_claim_dossier_revision"),
  };
}
