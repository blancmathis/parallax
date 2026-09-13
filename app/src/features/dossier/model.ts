import type { EvidenceLabel } from "../../types";

export const DOSSIER_PROFILE = "factual_descriptive_v1" as const;
export const DOSSIER_PILOT_TOPIC_ID = "topic_congestion_pricing" as const;
export const DOSSIER_LANGUAGE = "en" as const;
export const DOSSIER_OFFSET_UNIT = "utf8_bytes_v1" as const;

export type DossierResearchRole = "support" | "counter";
export type DossierSubmissionKind = "new_claim" | "challenge";
export type DossierArgumentDirection = "supports" | "opposes" | "qualifies";
export type SourceCaptureStatus =
  | "found"
  | "partial"
  | "blocked"
  | "failed"
  | "missing"
  | "oversize"
  | "unsupported";

export interface CapturedSourceArtifact {
  ok: boolean;
  artifact_id: string | null;
  requested_url: string;
  final_url: string;
  status: SourceCaptureStatus;
  content_type: string;
  byte_length: number;
  raw_hash: string | null;
  normalized_hash: string | null;
  /** Private to the submitting user/reviewer. Never render in the public view. */
  normalized_text: string | null;
  title: string;
  publisher: string;
  source_type: string;
  parser_version: string;
  is_truncated: boolean;
  captured_at: string;
  reused: boolean;
  failure_code?: string | null;
}

export interface ExactUtf8Selection {
  start_offset: number;
  end_offset: number;
  exact_excerpt: string;
}

export interface ClaimDossierEvidenceDraft extends ExactUtf8Selection {
  research_role: DossierResearchRole;
  source_artifact: CapturedSourceArtifact;
  locator: string;
  label: EvidenceLabel;
  rationale: string;
}

export interface ClaimDossierDraft {
  topic_id: string;
  base_revision_id: string;
  submission_kind: DossierSubmissionKind;
  target_position_id: string;
  target_evidence_link_id: string | null;
  claim_profile: typeof DOSSIER_PROFILE;
  claim_text: string;
  argument_summary: string;
  argument_direction: DossierArgumentDirection;
  scope_note: string;
  language: typeof DOSSIER_LANGUAGE;
  supersedes_submission_id?: string | null;
  evidence: ClaimDossierEvidenceDraft[];
}

export interface ClaimDossierEvidencePayload extends ExactUtf8Selection {
  source_artifact_id: string;
  research_role: DossierResearchRole;
  offset_unit: typeof DOSSIER_OFFSET_UNIT;
  excerpt_hash: string;
  locator: string;
  label: EvidenceLabel;
  rationale: string;
}

export interface ClaimDossierSubmissionPayload
  extends Omit<ClaimDossierDraft, "evidence"> {
  claim_type: "factual";
  evidence: ClaimDossierEvidencePayload[];
}

export type ClaimDossierValidationCode =
  | "pilot_topic_required"
  | "profile_required"
  | "base_revision_required"
  | "position_required"
  | "challenge_target_required"
  | "challenge_target_forbidden"
  | "claim_out_of_profile"
  | "argument_required"
  | "scope_required"
  | "evidence_pair_required"
  | "distinct_sources_required"
  | "unusable_capture"
  | "invalid_excerpt"
  | "excerpt_too_large"
  | "locator_required"
  | "rationale_required";

export type ClaimDossierValidationResult =
  | { ok: true; value: ClaimDossierDraft }
  | { ok: false; code: ClaimDossierValidationCode; message: string };

const SENSITIVE_QUERY_KEY =
  /(?:^|[_-])(access[_-]?token|api[_-]?key|auth|authorization|credential|jwt|password|pass|secret|session|signature|sig)(?:$|[_-])/i;

const DESCRIPTIVE_PROFILE_EXCLUSION =
  /\b(?:should|must|ought|cause|causes|caused|causing|because|therefore|predict|predicts|predicted|will|would|lead|leads|led|reduce|reduces|reduced|increase|increases|increased)\b|\bresults?\s+in\b|\bdue\s+to\b/i;

function decodedFragment(value: string): string {
  let decoded = value;
  for (let pass = 0; pass < 2; pass += 1) {
    try {
      const next = decodeURIComponent(decoded.replace(/\+/g, " "));
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function hasSensitiveFragment(hash: string): boolean {
  if (!hash) return false;
  const decoded = decodedFragment(hash.slice(1));
  return decoded.split(/[&;?]/).some((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return false;
    return SENSITIVE_QUERY_KEY.test(part.slice(0, separator).trim());
  });
}

/**
 * Client-side preview of the server URL policy. This is convenience and early
 * feedback only; the Edge function remains responsible for DNS/redirect SSRF
 * checks before every request.
 */
export function dossierSourceUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  try {
    const url = new URL(trimmed);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return undefined;
    }
    const allowedPort = url.protocol === "https:" ? "443" : "80";
    if (url.port && url.port !== allowedPort) return undefined;
    for (const key of url.searchParams.keys()) {
      if (SENSITIVE_QUERY_KEY.test(key)) return undefined;
    }
    if (hasSensitiveFragment(url.hash)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function dossierSourceIdentity(value: string): string | undefined {
  const safe = dossierSourceUrl(value);
  if (!safe) return undefined;
  const url = new URL(safe);
  url.hash = "";
  url.searchParams.sort();
  return url.toString();
}

function splitsSurrogatePair(text: string, index: number): boolean {
  if (index <= 0 || index >= text.length) return false;
  const before = text.charCodeAt(index - 1);
  const after = text.charCodeAt(index);
  return before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff;
}

/** Convert textarea DOM indices (UTF-16 code units) into canonical UTF-8 bytes. */
export function exactUtf8Selection(
  normalizedText: string,
  selectionStart: number,
  selectionEnd: number,
): ExactUtf8Selection | null {
  if (
    !Number.isInteger(selectionStart) ||
    !Number.isInteger(selectionEnd) ||
    selectionStart < 0 ||
    selectionEnd > normalizedText.length ||
    selectionEnd <= selectionStart ||
    splitsSurrogatePair(normalizedText, selectionStart) ||
    splitsSurrogatePair(normalizedText, selectionEnd)
  ) {
    return null;
  }
  const exactExcerpt = normalizedText.slice(selectionStart, selectionEnd);
  if (!exactExcerpt.trim()) return null;
  const encoder = new TextEncoder();
  const startOffset = encoder.encode(normalizedText.slice(0, selectionStart)).length;
  const endOffset = startOffset + encoder.encode(exactExcerpt).length;
  return {
    start_offset: startOffset,
    end_offset: endOffset,
    exact_excerpt: exactExcerpt,
  };
}

function failed(
  code: ClaimDossierValidationCode,
  message: string,
): ClaimDossierValidationResult {
  return { ok: false, code, message };
}

function usableArtifact(
  artifact: CapturedSourceArtifact,
): artifact is CapturedSourceArtifact & {
  artifact_id: string;
  raw_hash: string;
  normalized_hash: string;
  normalized_text: string;
} {
  return (
    artifact.ok &&
    (artifact.status === "found" || artifact.status === "partial") &&
    Boolean(artifact.artifact_id) &&
    Boolean(artifact.raw_hash) &&
    Boolean(artifact.normalized_hash) &&
    Boolean(artifact.normalized_text)
  );
}

function selectionMatchesArtifact(evidence: ClaimDossierEvidenceDraft): boolean {
  const text = evidence.source_artifact.normalized_text;
  if (!text) return false;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  if (
    evidence.start_offset < 0 ||
    evidence.end_offset <= evidence.start_offset ||
    evidence.end_offset > encoded.length
  ) {
    return false;
  }
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
      encoded.slice(evidence.start_offset, evidence.end_offset),
    );
    return decoded === evidence.exact_excerpt && Boolean(decoded.trim());
  } catch {
    return false;
  }
}

export function validateClaimDossierDraft(
  input: ClaimDossierDraft,
): ClaimDossierValidationResult {
  if (input.topic_id !== DOSSIER_PILOT_TOPIC_ID) {
    return failed(
      "pilot_topic_required",
      "The claim dossier pilot is limited to the congestion-pricing topic.",
    );
  }
  if (input.claim_profile !== DOSSIER_PROFILE || input.language !== DOSSIER_LANGUAGE) {
    return failed(
      "profile_required",
      "This pilot accepts English factual descriptive claims only.",
    );
  }
  if (!input.base_revision_id.trim()) {
    return failed("base_revision_required", "A current base revision is required.");
  }
  if (!input.target_position_id.trim()) {
    return failed("position_required", "Choose the position this argument belongs to.");
  }
  if (input.submission_kind === "challenge" && !input.target_evidence_link_id) {
    return failed(
      "challenge_target_required",
      "A challenge must identify the reviewed evidence link it contests.",
    );
  }
  if (input.submission_kind === "new_claim" && input.target_evidence_link_id) {
    return failed(
      "challenge_target_forbidden",
      "A new claim cannot target an existing evidence link.",
    );
  }

  const claimText = input.claim_text.trim();
  if (
    claimText.length < 20 ||
    claimText.length > 600 ||
    DESCRIPTIVE_PROFILE_EXCLUSION.test(claimText)
  ) {
    return failed(
      "claim_out_of_profile",
      "Write a 20–600 character factual description without causal, predictive, or normative language.",
    );
  }
  const argumentSummary = input.argument_summary.trim();
  if (argumentSummary.length < 20 || argumentSummary.length > 1200) {
    return failed(
      "argument_required",
      "The structured argument summary must contain 20–1200 characters.",
    );
  }
  const scopeNote = input.scope_note.trim();
  if (scopeNote.length < 8 || scopeNote.length > 800) {
    return failed(
      "scope_required",
      "State the population, place, and period covered by the claim.",
    );
  }
  if (
    input.evidence.length !== 2 ||
    input.evidence.filter((item) => item.research_role === "support").length !== 1 ||
    input.evidence.filter((item) => item.research_role === "counter").length !== 1
  ) {
    return failed(
      "evidence_pair_required",
      "Attach exactly one support source and one counter source.",
    );
  }
  if (
    input.evidence[0].source_artifact.artifact_id &&
    input.evidence[0].source_artifact.artifact_id ===
      input.evidence[1].source_artifact.artifact_id
  ) {
    return failed(
      "distinct_sources_required",
      "Support and counter evidence must come from two distinct captures.",
    );
  }
  const sourceIdentities = input.evidence.map((item) =>
    dossierSourceIdentity(
      item.source_artifact.final_url || item.source_artifact.requested_url,
    ),
  );
  if (
    !sourceIdentities[0] ||
    !sourceIdentities[1] ||
    sourceIdentities[0] === sourceIdentities[1]
  ) {
    return failed(
      "distinct_sources_required",
      "Support and counter evidence must have two distinct final URL identities.",
    );
  }
  for (const evidence of input.evidence) {
    if (!usableArtifact(evidence.source_artifact)) {
      return failed(
        "unusable_capture",
        "Only found or partial captures with verifiable hashes can be evidence. A failure is not a refutation.",
      );
    }
    if (!selectionMatchesArtifact(evidence)) {
      return failed(
        "invalid_excerpt",
        "Each excerpt must exactly match the selected UTF-8 byte range.",
      );
    }
    const excerptBytes = new TextEncoder().encode(evidence.exact_excerpt).length;
    if (evidence.exact_excerpt.length > 2000 || excerptBytes > 8192) {
      return failed(
        "excerpt_too_large",
        "Each exact excerpt is limited to 2,000 characters and 8,192 UTF-8 bytes.",
      );
    }
    if (!evidence.locator.trim() || evidence.locator.trim().length > 500) {
      return failed("locator_required", "Add a human-readable source locator.");
    }
    if (
      evidence.rationale.trim().length < 8 ||
      evidence.rationale.trim().length > 2000
    ) {
      return failed(
        "rationale_required",
        "Explain the claim/source relationship in 8–2,000 characters.",
      );
    }
  }
  return {
    ok: true,
    value: {
      ...input,
      claim_text: claimText,
      argument_summary: argumentSummary,
      scope_note: scopeNote,
      evidence: input.evidence.map((item) => ({
        ...item,
        locator: item.locator.trim(),
        rationale: item.rationale.trim(),
      })),
    },
  };
}

export async function sha256Text(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `sha256:${hex}`;
}

export async function buildClaimDossierPayload(
  draft: ClaimDossierDraft,
): Promise<ClaimDossierSubmissionPayload> {
  const validated = validateClaimDossierDraft(draft);
  if (!validated.ok) throw new Error(validated.message);
  const evidence = await Promise.all(
    validated.value.evidence.map(async (item) => ({
      source_artifact_id: item.source_artifact.artifact_id as string,
      research_role: item.research_role,
      offset_unit: DOSSIER_OFFSET_UNIT,
      start_offset: item.start_offset,
      end_offset: item.end_offset,
      exact_excerpt: item.exact_excerpt,
      excerpt_hash: await sha256Text(item.exact_excerpt),
      locator: item.locator,
      label: item.label,
      rationale: item.rationale,
    })),
  );
  const { evidence: _draftEvidence, ...submission } = validated.value;
  void _draftEvidence;
  return { ...submission, claim_type: "factual", evidence };
}
