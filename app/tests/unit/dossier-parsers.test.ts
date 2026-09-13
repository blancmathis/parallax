import { describe, expect, it } from "vitest";

import {
  parseCaptureSourceResponse,
  parseClaimDossierDetail,
  parsePrivateClaimDossierList,
  parsePublicClaimDossierList,
} from "../../src/features/dossier/api";

const HASH_1 = `sha256:${"1".repeat(64)}`;
const HASH_2 = `sha256:${"2".repeat(64)}`;
const HASH_3 = `sha256:${"3".repeat(64)}`;
const HASH_4 = `sha256:${"4".repeat(64)}`;

function privateArtifact(role: "support" | "counter", includeNormalizedText = false) {
  const artifactId = role === "support" ? "artifact-support" : "artifact-counter";
  return {
    artifact_id: artifactId,
    requested_url: `https://example.org/${role}`,
    final_url: `https://example.org/${role}`,
    status: role === "support" ? "found" : "partial",
    content_type: "text/html",
    byte_length: role === "support" ? 1_024 : 2_048,
    raw_hash: role === "support" ? HASH_1 : HASH_3,
    normalized_hash: role === "support" ? HASH_2 : HASH_4,
    ...(includeNormalizedText
      ? { normalized_text: `${role} source normalized text` }
      : {}),
    title: `${role} source`,
    publisher: "Example publisher",
    source_type: "report",
    parser_version: "fixture-v1",
    is_truncated: role === "counter",
    captured_at: "2026-08-30T08:00:00Z",
  };
}

function privateEvidence(role: "support" | "counter", includeNormalizedText = false) {
  const isSupport = role === "support";
  return {
    research_role: role,
    source_artifact_id: isSupport ? "artifact-support" : "artifact-counter",
    start_offset: isSupport ? 10 : 20,
    end_offset: isSupport ? 42 : 61,
    offset_unit: "utf8_bytes_v1",
    exact_excerpt: isSupport ? "Support excerpt" : "Counter excerpt",
    excerpt_hash: isSupport ? HASH_1 : HASH_3,
    locator: isSupport ? "Table 2" : "Methodology, paragraph 4",
    label: isSupport ? "supports_claim" : "contradicts_claim",
    rationale: isSupport
      ? "This directly measures the claimed outcome."
      : "This independent source reports the principal limitation.",
    artifact: privateArtifact(role, includeNormalizedText),
  };
}

function privateDossier(options?: {
  includeNormalizedText?: boolean;
  status?: "submitted" | "changes_requested" | "accepted" | "rejected";
  withReview?: boolean;
}) {
  const status = options?.status ?? "submitted";
  return {
    id: "dossier-private-1",
    topic_id: "should-nyc-keep-congestion-pricing",
    base_revision_id: "revision-base-1",
    submission_kind: "new_claim",
    target_position_id: "position-support",
    target_evidence_link_id: null,
    claim_profile: "factual_descriptive_v1",
    claim_text: "Traffic entering the zone declined during the pilot period.",
    argument_summary: "Observed traffic counts describe the pilot's measured effect.",
    argument_direction: "supports",
    scope_note: "Applies to inbound vehicle counts during the stated pilot window.",
    language: "en",
    status,
    prepared_revision_id: null,
    supersedes_submission_id: null,
    created_at: "2026-08-30T08:05:00Z",
    review: options?.withReview
      ? {
          decision: status === "changes_requested" ? "request_changes" : "approve",
          rationale: "The excerpts and locators were checked against both artifacts.",
          reviewed_at: "2026-08-30T09:00:00Z",
        }
      : null,
    evidence: [
      privateEvidence("support", options?.includeNormalizedText),
      privateEvidence("counter", options?.includeNormalizedText),
    ],
    change_set: null,
  };
}

function publicSource(role: "support" | "counter") {
  const isSupport = role === "support";
  return {
    id: isSupport ? "source-public-support" : "source-public-counter",
    url: `https://public.example.org/${role}`,
    title: `${role} public source`,
    publisher: "Public example publisher",
    source_type: "report",
    retrieval_status: isSupport ? "found" : "partial",
    retrieved_at: "2026-08-30T10:00:00Z",
    content_hash: isSupport ? HASH_1 : HASH_3,
    normalized_hash: isSupport ? HASH_2 : HASH_4,
    content_type: "text/html",
    byte_length: isSupport ? 3_000 : 4_000,
    parser_version: "fixture-v1",
    is_truncated: !isSupport,
  };
}

function publicEvidence(role: "support" | "counter") {
  const isSupport = role === "support";
  return {
    evidence_link_id: isSupport ? "evidence-public-support" : "evidence-public-counter",
    research_role: role,
    relation: isSupport ? "supports_claim" : "contradicts_claim",
    rationale: isSupport
      ? "The public excerpt supports the bounded measurement."
      : "The public excerpt records an important counter-check.",
    exact_excerpt: isSupport ? "Public support excerpt" : "Public counter excerpt",
    offset_unit: "utf8_bytes_v1",
    start_offset: isSupport ? 12 : 30,
    end_offset: isSupport ? 36 : 57,
    excerpt_hash: isSupport ? HASH_1 : HASH_3,
    locator: isSupport ? "Results, table 1" : "Limitations, paragraph 2",
    source: publicSource(role),
  };
}

function publicDossier() {
  return {
    id: "dossier-public-1",
    topic_id: "should-nyc-keep-congestion-pricing",
    revision_id: "revision-published-1",
    prepared_revision_id: "revision-published-1",
    base_revision_id: "revision-base-1",
    submission_kind: "challenge",
    target_position_id: "position-support",
    target_evidence_link_id: "evidence-existing-1",
    claim_profile: "factual_descriptive_v1",
    claim_id: "claim-public-1",
    claim_text: "Traffic entering the zone declined during the pilot period.",
    argument_id: "argument-public-1",
    argument_summary: "The measured decline must be read with the published limitations.",
    argument_direction: "qualifies",
    scope_note: "Applies to inbound vehicle counts during the stated pilot window.",
    language: "en",
    review_status: "reviewed_and_published",
    review: {
      decision: "approve",
      rationale: "The dossier was checked against both immutable source captures.",
      reviewed_at: "2026-08-30T11:00:00Z",
    },
    evidence: [publicEvidence("support"), publicEvidence("counter")],
    change_set: {
      operations: [{ op: "add_claim", claim_id: "claim-public-1" }],
    },
    change_hash: HASH_4,
    published_at: "2026-08-30T11:05:00Z",
    pilot_limit: "This pilot covers one bounded factual profile.",
    disclaimer: "Review records provenance and fit; it does not establish truth.",
  };
}

describe("claim dossier runtime parsers", () => {
  it.each([
    ["owner", privateDossier()],
    [
      "reviewer",
      privateDossier({ status: "changes_requested", withReview: true }),
    ],
  ])("parses the %s list projection without normalized source text", (_surface, row) => {
    const [parsed] = parsePrivateClaimDossierList([row]);

    expect(parsed.evidence).toHaveLength(2);
    expect(parsed.evidence.map((item) => item.research_role)).toEqual([
      "support",
      "counter",
    ]);
    expect(parsed.evidence.every((item) => item.artifact.normalized_text === null)).toBe(
      true,
    );
    expect(parsed.evidence[0]?.artifact.artifact_id).toBe("artifact-support");
    expect(parsed.revision_id).toBeNull();
    expect(parsed.published_at).toBeNull();
  });

  it("requires and exposes normalized source text only in the private detail projection", () => {
    const parsed = parseClaimDossierDetail(
      privateDossier({ includeNormalizedText: true, status: "accepted", withReview: true }),
    );

    expect(parsed.status).toBe("accepted");
    expect(parsed.evidence.map((item) => item.artifact.normalized_text)).toEqual([
      "support source normalized text",
      "counter source normalized text",
    ]);
  });

  it("parses the separate public projection with nested sources, public link ids, and hashes", () => {
    const [parsed] = parsePublicClaimDossierList([publicDossier()]);

    expect(parsed.status).toBe("reviewed_and_published");
    expect(parsed.revision_id).toBe("revision-published-1");
    expect(parsed.review).toMatchObject({ decision: "approve" });
    expect(parsed.evidence[0]).toMatchObject({
      id: "evidence-public-support",
      evidence_link_id: "evidence-public-support",
      research_role: "support",
      label: "supports_claim",
      source_artifact_id: null,
      artifact: {
        artifact_id: null,
        public_source_id: "source-public-support",
        normalized_text: null,
        raw_hash: HASH_1,
        normalized_hash: HASH_2,
      },
    });
    expect(parsed.change_set).toEqual({
      change_set_id: null,
      prepared_revision_id: "revision-published-1",
      base_snapshot_hash: null,
      prepared_snapshot_hash: null,
      change_hash: HASH_4,
      changes: {
        operations: [{ op: "add_claim", claim_id: "claim-public-1" }],
      },
    });
    expect(parsed.disclaimer).toContain("does not establish truth");
  });

  it("parses stored capture failures without inventing hashes or normalized content", () => {
    const parsed = parseCaptureSourceResponse({
      ok: true,
      artifact_id: "artifact-failed-1",
      requested_url: "https://example.org/blocked",
      final_url: "https://example.org/blocked",
      status: "blocked",
      content_type: "text/html",
      byte_length: 0,
      raw_hash: null,
      normalized_hash: null,
      normalized_text: null,
      title: "Blocked source",
      publisher: "Example publisher",
      source_type: "webpage",
      parser_version: "fixture-v1",
      is_truncated: false,
      captured_at: "2026-08-30T12:00:00Z",
      reused: false,
    });

    expect(parsed).toMatchObject({
      status: "blocked",
      raw_hash: null,
      normalized_hash: null,
      normalized_text: null,
    });
  });

  it("throws on malformed private statuses instead of applying a status fallback", () => {
    const malformed = { ...privateDossier(), status: "pending" };

    expect(() => parsePrivateClaimDossierList([malformed])).toThrow(
      "Invalid private claim dossier 0 response: status.",
    );
  });

  it("throws when a detail response omits normalized source text", () => {
    expect(() => parseClaimDossierDetail(privateDossier())).toThrow(
      "Invalid claim dossier evidence 0 artifact response: normalized_text.",
    );
  });

  it("throws when a detail response does not contain one support and one counter source", () => {
    const malformed = {
      ...privateDossier({ includeNormalizedText: true }),
      evidence: [privateEvidence("support", true)],
    };

    expect(() => parseClaimDossierDetail(malformed)).toThrow(
      "Invalid claim dossier detail response: evidence.",
    );
  });

  it("throws when the public review state is not reviewed_and_published", () => {
    const malformed = { ...publicDossier(), review_status: "accepted" };

    expect(() => parsePublicClaimDossierList([malformed])).toThrow(
      "Invalid public claim dossier 0 response: review_status.",
    );
  });

  it("throws when a public evidence item omits its public evidence-link identity", () => {
    const dossier = publicDossier();
    const malformedEvidence = { ...dossier.evidence[0] };
    delete (malformedEvidence as Partial<typeof malformedEvidence>).evidence_link_id;

    expect(() =>
      parsePublicClaimDossierList([
        { ...dossier, evidence: [malformedEvidence, dossier.evidence[1]] },
      ]),
    ).toThrow("Invalid public claim dossier evidence 0 response: evidence_link_id.");
  });

  it("throws on malformed public hashes and never substitutes a placeholder", () => {
    const malformed = { ...publicDossier(), change_hash: "sha256:not-a-hash" };

    expect(() => parsePublicClaimDossierList([malformed])).toThrow(
      "Invalid public claim dossier 0 response: change_hash.",
    );
  });

  it("does not accept a private projection as a public dossier", () => {
    expect(() => parsePublicClaimDossierList([privateDossier()])).toThrow(
      "Invalid public claim dossier 0 response: review_status.",
    );
  });

  it("throws on malformed capture success data rather than fabricating hashes", () => {
    expect(() =>
      parseCaptureSourceResponse({
        ok: true,
        artifact_id: "artifact-found-1",
        requested_url: "https://example.org/report",
        final_url: "https://example.org/report",
        status: "found",
        content_type: "text/html",
        byte_length: 100,
        raw_hash: null,
        normalized_hash: HASH_2,
        normalized_text: "Normalized report",
        title: "Report",
        publisher: "Example publisher",
        source_type: "report",
        parser_version: "fixture-v1",
        is_truncated: false,
        captured_at: "2026-08-30T12:00:00Z",
        reused: false,
      }),
    ).toThrow("Invalid capture-source response: successful capture shape.");
  });
});
