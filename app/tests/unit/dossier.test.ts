import { describe, expect, it } from "vitest";
import type { EvidenceLabel } from "../../src/types";
import {
  DOSSIER_PROFILE,
  dossierSourceUrl,
  exactUtf8Selection,
  validateClaimDossierDraft,
  type CapturedSourceArtifact,
  type ClaimDossierDraft,
} from "../../src/features/dossier/model";

function artifact(
  id: string,
  normalizedText: string,
  status: "found" | "partial" = "found",
): CapturedSourceArtifact {
  return {
    ok: true,
    artifact_id: id,
    requested_url: `https://example.test/${id}`,
    final_url: `https://example.test/${id}`,
    status,
    content_type: "text/html",
    byte_length: new TextEncoder().encode(normalizedText).length,
    raw_hash: `sha256:${"a".repeat(64)}`,
    normalized_hash: `sha256:${"b".repeat(64)}`,
    normalized_text: normalizedText,
    title: `Source ${id}`,
    publisher: "Example publisher",
    source_type: "article",
    parser_version: "normalized-text-v1",
    is_truncated: status === "partial",
    captured_at: "2026-08-30T12:00:00Z",
    reused: false,
  };
}

function evidence(
  source: CapturedSourceArtifact,
  researchRole: "support" | "counter",
  label: EvidenceLabel,
) {
  const selected = exactUtf8Selection(source.normalized_text ?? "", 0, 20);
  if (!selected) throw new Error("fixture excerpt should be selectable");
  return {
    research_role: researchRole,
    source_artifact: source,
    start_offset: selected.start_offset,
    end_offset: selected.end_offset,
    exact_excerpt: selected.exact_excerpt,
    locator: "paragraph 1",
    label,
    rationale: "Directly relevant passage.",
  } as const;
}

function draft(): ClaimDossierDraft {
  const support = artifact(
    "11111111-1111-4111-8111-111111111111",
    "Observed weekday traffic volume was 12 percent lower in the priced zone.",
  );
  const counter = artifact(
    "22222222-2222-4222-8222-222222222222",
    "Observed weekend traffic volume was unchanged during the same period.",
  );
  return {
    topic_id: "topic_congestion_pricing",
    base_revision_id: "rev_congestion_pricing_1",
    submission_kind: "new_claim",
    target_position_id: "pos_a",
    target_evidence_link_id: null,
    claim_profile: DOSSIER_PROFILE,
    claim_text: "Weekday traffic volume was lower inside the priced zone in 2025.",
    argument_summary:
      "This observation qualifies the position by separating weekday and weekend measurements.",
    argument_direction: "qualifies",
    scope_note: "Describes the measured pilot period and priced zone only.",
    language: "en",
    evidence: [
      evidence(support, "support", "unclear"),
      evidence(counter, "counter", "supports_claim"),
    ],
  };
}

describe("claim dossier source URL policy", () => {
  it("accepts ordinary public HTTP(S) URLs", () => {
    expect(dossierSourceUrl("https://example.org/report?q=traffic")).toBe(
      "https://example.org/report?q=traffic",
    );
    expect(dossierSourceUrl("http://example.org:80/report")).toBe(
      "http://example.org/report",
    );
  });

  it.each([
    "ftp://example.org/report",
    "https://user:secret@example.org/report",
    "https://example.org:8443/report",
    "https://example.org/report?access_token=secret",
    "https://example.org/report?X-Api-Key=secret",
    "https://example.org/report?signature=secret",
  ])("rejects unsafe source URL %s", (url) => {
    expect(dossierSourceUrl(url)).toBeUndefined();
  });
});

describe("exact UTF-8 excerpt selection", () => {
  it("converts DOM UTF-16 selection indices to byte offsets without changing text", () => {
    const text = "Before café 🚲 after";
    const start = text.indexOf("café");
    const end = text.indexOf(" after");
    expect(exactUtf8Selection(text, start, end)).toEqual({
      start_offset: 7,
      end_offset: 17,
      exact_excerpt: "café 🚲",
    });
  });

  it("rejects empty selections", () => {
    expect(exactUtf8Selection("source text", 2, 2)).toBeNull();
  });
});

describe("claim dossier validation", () => {
  it("requires exactly one support and one counter while keeping role separate from label", () => {
    const result = validateClaimDossierDraft(draft());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.evidence[0]).toMatchObject({
      research_role: "support",
      label: "unclear",
    });
    expect(result.value.evidence[1]).toMatchObject({
      research_role: "counter",
      label: "supports_claim",
    });
  });

  it("requires two distinct captured artefacts", () => {
    const value = draft();
    value.evidence[1] = {
      ...value.evidence[1],
      source_artifact: value.evidence[0].source_artifact,
    };
    expect(validateClaimDossierDraft(value)).toMatchObject({
      ok: false,
      code: "distinct_sources_required",
    });
  });

  it("never accepts a failed capture as evidence or refutation", () => {
    const value = draft();
    value.evidence[1] = {
      ...value.evidence[1],
      source_artifact: {
        ...value.evidence[1].source_artifact,
        ok: false,
        status: "blocked",
        raw_hash: null,
        normalized_hash: null,
        normalized_text: null,
      },
    };
    expect(validateClaimDossierDraft(value)).toMatchObject({
      ok: false,
      code: "unusable_capture",
    });
  });

  it("rejects causal or predictive claims from the descriptive pilot", () => {
    const value = draft();
    value.claim_text = "Congestion pricing will reduce traffic because drivers change routes.";
    expect(validateClaimDossierDraft(value)).toMatchObject({
      ok: false,
      code: "claim_out_of_profile",
    });
  });
});
