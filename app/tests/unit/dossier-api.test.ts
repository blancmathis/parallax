import { beforeEach, describe, expect, it, vi } from "vitest";

const supabase = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock("../../src/lib/supabase", () => ({
  requireSupabase: () => ({
    functions: { invoke: supabase.invoke },
  }),
}));

import { captureClaimDossierSource } from "../../src/features/dossier/api";

describe("claim dossier capture API contract", () => {
  beforeEach(() => {
    supabase.invoke.mockResolvedValue({
      data: {
        ok: true,
        artifact_id: "00000000-0000-4000-8000-000000000001",
        requested_url: "https://example.org/report",
        final_url: "https://example.org/report",
        status: "found",
        content_type: "text/plain",
        byte_length: 14,
        raw_hash: `sha256:${"1".repeat(64)}`,
        normalized_hash: `sha256:${"2".repeat(64)}`,
        normalized_text: "Fixture report",
        title: "Fixture report",
        publisher: "Parallax CI fixture",
        source_type: "report",
        parser_version: "ci-fixture-v1",
        is_truncated: false,
        captured_at: "2026-08-30T00:00:00Z",
        reused: false,
      },
      error: null,
    });
  });

  it("sends the strict public Edge payload without aliases", async () => {
    await captureClaimDossierSource(
      "https://example.org/report",
      "30000000-0000-4000-8000-000000000001",
    );

    expect(supabase.invoke).toHaveBeenCalledWith("capture-source", {
      body: {
        url: "https://example.org/report",
        idempotency_key: "30000000-0000-4000-8000-000000000001",
      },
    });
  });
});
