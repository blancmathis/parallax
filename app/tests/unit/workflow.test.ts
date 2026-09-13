import { describe, expect, it, vi } from "vitest";
import {
  REVIEW_RATIONALE_MIN_LENGTH,
  normalizedReviewRationale,
  requireReviewRationale,
  workflowCopy,
  workflowDecisionLabel,
  workflowErrorMessage,
  workflowProvenanceLabel,
  workflowStatusLabel,
  withWorkflowContribution,
  type ContributorWorkflowState,
  type DraftRevisionSnapshot,
  type WorkflowReview,
} from "../../src/features/workflow/model";
import type { Contribution } from "../../src/types";

function contribution(
  overrides: Partial<Contribution> = {},
): Contribution {
  return {
    id: "ctb_workflow",
    topic_id: "topic_congestion_pricing",
    type: "new_claim",
    body: "A contribution whose workflow state is tracked explicitly.",
    status: "submitted",
    created_by: "user_workflow",
    created_at: "2026-08-30T12:00:00.000Z",
    ...overrides,
  };
}

describe("review rationale contract", () => {
  it.each([
    ["", null],
    ["   ", null],
    ["x".repeat(REVIEW_RATIONALE_MIN_LENGTH - 1), null],
    [
      `  ${"x".repeat(REVIEW_RATIONALE_MIN_LENGTH - 1)}  `,
      null,
    ],
    [
      `  ${"x".repeat(REVIEW_RATIONALE_MIN_LENGTH)}  `,
      "x".repeat(REVIEW_RATIONALE_MIN_LENGTH),
    ],
    [
      "x".repeat(REVIEW_RATIONALE_MIN_LENGTH + 1),
      "x".repeat(REVIEW_RATIONALE_MIN_LENGTH + 1),
    ],
  ])("normalizes the boundary for %j", (input, expected) => {
    expect(normalizedReviewRationale(input)).toBe(expected);
  });

  it("returns the trimmed rationale at the exact minimum", () => {
    const rationale = "x".repeat(REVIEW_RATIONALE_MIN_LENGTH);

    expect(requireReviewRationale(`  ${rationale}  `)).toBe(rationale);
  });

  it("fails closed below the minimum and keeps the UI copy in sync", () => {
    expect(() =>
      requireReviewRationale(
        "x".repeat(REVIEW_RATIONALE_MIN_LENGTH - 1),
      ),
    ).toThrow(
      `A review rationale of at least ${REVIEW_RATIONALE_MIN_LENGTH} characters is required.`,
    );
    expect(workflowCopy("en").rationaleRequired).toContain(
      String(REVIEW_RATIONALE_MIN_LENGTH),
    );
    expect(workflowCopy("fr").rationaleRequired).toContain(
      String(REVIEW_RATIONALE_MIN_LENGTH),
    );
  });
});

describe("workflow state and provenance", () => {
  it("adds safe contributor tracking defaults without mutating the source", () => {
    const source = contribution();
    const sourceBefore = structuredClone(source);

    const tracked = withWorkflowContribution(source, "local");

    expect(tracked).toEqual({
      ...source,
      provenance: "local",
      review: null,
      review_visibility: "not_reviewed",
    });
    expect(source).toEqual(sourceBefore);
    expect(source).not.toHaveProperty("provenance");
  });

  it("preserves an explicit request_changes review and its backend provenance", () => {
    const review: WorkflowReview = {
      decision: "request_changes",
      rationale: "Clarify the comparison period.",
      reviewed_at: "2026-08-30T13:00:00.000Z",
      provenance: "supabase",
    };

    const tracked = withWorkflowContribution(
      contribution(),
      "supabase",
      review,
      "visible",
    );

    expect(tracked).toMatchObject({
      provenance: "supabase",
      review,
      review_visibility: "visible",
    });
    expect(workflowDecisionLabel("en", "request_changes")).toBe(
      "Request changes",
    );
    expect(workflowDecisionLabel("fr", "request_changes")).toBe(
      "Demander des modifications",
    );
  });

  it("labels representative workflow states and degrades unknown states safely", () => {
    expect(workflowStatusLabel("en", "submitted")).toBe("Submitted");
    expect(workflowStatusLabel("fr", "approved")).toBe("Approuvée");
    expect(workflowStatusLabel("en", "awaiting_human_review")).toBe(
      "awaiting human review",
    );
  });

  it("keeps local and backend provenance distinguishable in both locales", () => {
    expect(workflowProvenanceLabel("en", "local")).toBe("Local demo");
    expect(workflowProvenanceLabel("en", "supabase")).toBe(
      "Supabase backend",
    );
    expect(workflowProvenanceLabel("fr", "local")).toBe("Démo locale");
    expect(workflowProvenanceLabel("fr", "supabase")).toBe(
      "Backend Supabase",
    );
  });

  it("never exposes raw Error or PostgREST message fields", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const rawMessage =
      "duplicate key value violates unique constraint users_private_email_key";

    for (const error of [
      new Error(rawMessage),
      { message: rawMessage, details: "private@example.test" },
    ]) {
      const message = workflowErrorMessage(error, "Safe fallback");
      expect(message).toBe("Safe fallback");
      expect(message).not.toContain(rawMessage);
      expect(message).not.toContain("private@example.test");
    }
  });

  it.each([null, undefined, "bad response", {}, { message: "   " }])(
    "uses the caller fallback for an unmapped workflow error %j",
    (error) => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      expect(workflowErrorMessage(error, "Safe fallback")).toBe(
        "Safe fallback",
      );
    },
  );

  it("keeps the legacy two-argument API localized through its caller fallback", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(
      workflowErrorMessage(
        { code: "42501", message: "new row violates row-level security policy" },
        "Impossible d’effectuer cette action.",
      ),
    ).toBe("Impossible d’effectuer cette action.");
  });

  it("maps stable permission, constraint, not-found, and conflict codes in English", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(
      workflowErrorMessage(
        { code: "42501", message: "raw policy name" },
        "Fallback",
        { locale: "en", context: "submit" },
      ),
    ).toBe("You do not have permission to submit this item.");
    expect(
      workflowErrorMessage(
        { code: "23514", message: "raw check constraint" },
        "Fallback",
        { locale: "en", context: "submit" },
      ),
    ).toBe(
      "This submission does not satisfy the workflow rules. Check it and try again.",
    );
    expect(
      workflowErrorMessage(
        { code: "PGRST116", message: "raw table and filter" },
        "Fallback",
        { locale: "en", context: "load" },
      ),
    ).toBe("The requested content could not be found.");
    expect(
      workflowErrorMessage(
        { code: "23505", message: "raw index name" },
        "Fallback",
        { locale: "en", context: "publish" },
      ),
    ).toBe(
      "This revision changed before it could be published. Reload and try again.",
    );
  });

  it("maps stable permission, constraint, not-found, and conflict codes in French", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(
      workflowErrorMessage(
        { code: "PGRST301", message: "raw auth detail" },
        "Repli",
        { locale: "fr", context: "review" },
      ),
    ).toBe("Vous n’avez pas l’autorisation de réviser cet élément.");
    expect(
      workflowErrorMessage(
        { code: "23503", message: "raw foreign key" },
        "Repli",
        { locale: "fr", context: "review" },
      ),
    ).toBe(
      "Cette révision ne respecte pas les règles du processus. Vérifiez-la puis réessayez.",
    );
    expect(
      workflowErrorMessage(
        { code: "NOT_FOUND", message: "raw relation name" },
        "Repli",
        { locale: "fr", context: "load" },
      ),
    ).toBe("Le contenu demandé est introuvable.");
    expect(
      workflowErrorMessage(
        { code: "40001", message: "raw transaction detail" },
        "Repli",
        { locale: "fr", context: "submit" },
      ),
    ).toBe(
      "Cet élément a changé ou a déjà été envoyé. Rechargez puis réessayez.",
    );
  });

  it("uses safe generic copy when a caller fallback is empty", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(workflowErrorMessage(new Error("raw"), "", { locale: "en" })).toBe(
      "Something went wrong. Try again.",
    );
    expect(workflowErrorMessage(new Error("brut"), "   ", { locale: "fr" })).toBe(
      "Une erreur s’est produite. Réessayez.",
    );
  });

  it("rejects a caller fallback that accidentally repeats the raw backend message", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const rawMessage = "relation private_profiles does not exist";

    expect(
      workflowErrorMessage(new Error(rawMessage), rawMessage, { locale: "en" }),
    ).toBe("Something went wrong. Try again.");
    expect(
      workflowErrorMessage(
        { message: rawMessage },
        `Erreur backend : ${rawMessage}`,
        { locale: "fr" },
      ),
    ).toBe("Une erreur s’est produite. Réessayez.");
  });

  it("logs raw detail with an explicit context and correlation reference only in development", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const error = Object.assign(new Error("private backend detail"), {
      code: "42501",
    });

    const visibleMessage = workflowErrorMessage(error, "Safe fallback", {
      locale: "en",
      context: "review",
      reference: "review:contribution-42",
    });

    expect(visibleMessage).toBe(
      "You do not have permission to review this item.",
    );
    expect(visibleMessage).not.toContain("private backend detail");
    if (import.meta.env.DEV) {
      expect(consoleError).toHaveBeenCalledWith(
        "[workflow:error]",
        expect.objectContaining({
          context: "review",
          reference: "review:contribution-42",
          kind: "permission",
          code: "42501",
          error,
        }),
      );
    } else {
      expect(consoleError).not.toHaveBeenCalled();
    }
  });
});

describe("contributor and draft tracking DTOs", () => {
  it("keeps contributor submissions normalized around explicit origin and review state", () => {
    const state: ContributorWorkflowState = {
      contributions: [withWorkflowContribution(contribution(), "supabase")],
      seedPackets: [
        {
          id: "seed_workflow",
          topic_id: "topic_congestion_pricing",
          topic_question: "Should congestion pricing be introduced?",
          initial_position: "Introduce a bounded pilot.",
          initial_arguments: ["Measure traffic and equity outcomes."],
          status: "pending",
          generated_revision_id: null,
          error_message: null,
          created_at: "2026-08-30T12:00:00.000Z",
          updated_at: "2026-08-30T12:00:00.000Z",
          source_inputs: [{ url: "https://example.com/study" }],
          provenance: "supabase",
        },
      ],
    };

    expect(state.contributions[0]).toMatchObject({
      provenance: "supabase",
      review: null,
      review_visibility: "not_reviewed",
    });
    expect(state.seedPackets[0]).toMatchObject({
      status: "pending",
      generated_revision_id: null,
      provenance: "supabase",
    });
  });

  it("keeps every structured draft object tied to Supabase provenance", () => {
    const draft: DraftRevisionSnapshot = {
      revision_id: "rev_workflow",
      positions: [
        {
          id: "pos_a",
          title: "Pilot",
          short_summary: "Test before scaling.",
          steelman: "A pilot produces auditable evidence.",
          status: "draft",
          generated_by: "ai",
          review_status: "unreviewed",
          provenance: "supabase",
        },
      ],
      arguments: [
        {
          id: "arg_a",
          position_id: "pos_a",
          direction: "for",
          summary: "A pilot bounds implementation risk.",
          claim_ids: ["claim_a"],
          generated_by: "ai",
          review_status: "unreviewed",
          provenance: "supabase",
        },
      ],
      claims: [
        {
          id: "claim_a",
          text: "A pilot can be evaluated before expansion.",
          claim_type: ["factual"],
          generated_by: "ai",
          review_status: "unreviewed",
          provenance: "supabase",
        },
      ],
      sources: [
        {
          id: "src_a",
          url: "https://example.com/study",
          title: "Pilot study",
          publisher: "Example Institute",
          source_type: "report",
          retrieval_status: "retrieved",
          retrieved_at: "2026-08-30T12:00:00.000Z",
          quality_notes: "Primary report.",
          provenance: "supabase",
        },
      ],
      excerpts: [
        {
          id: "excerpt_a",
          source_id: "src_a",
          text: "The pilot was evaluated after twelve months.",
          locator: "p. 12",
          extracted_by: "ai",
          provenance: "supabase",
        },
      ],
      evidenceLinks: [
        {
          id: "link_a",
          claim_id: "claim_a",
          source_id: "src_a",
          source_excerpt_id: "excerpt_a",
          label: "supports_claim",
          rationale: "The excerpt reports an evaluation period.",
          confidence: 0.8,
          review_status: "unreviewed",
          provenance: "supabase",
        },
      ],
      values: [
        {
          id: "value_a",
          name: "Accountability",
          description: "Prefer auditable interventions.",
          tension_with: [],
          position_ids: ["pos_a"],
          provenance: "supabase",
        },
      ],
      tradeoffs: [
        {
          id: "tradeoff_a",
          position_id: "pos_a",
          gain: "Evidence before scaling",
          cost: "Pilot administration",
          risk: "Short evaluation horizon",
          review_status: "unreviewed",
          provenance: "supabase",
        },
      ],
    };

    const trackedObjects = [
      ...draft.positions,
      ...draft.arguments,
      ...draft.claims,
      ...draft.sources,
      ...draft.excerpts,
      ...draft.evidenceLinks,
      ...draft.values,
      ...draft.tradeoffs,
    ];

    expect(trackedObjects).toHaveLength(8);
    expect(trackedObjects.every((item) => item.provenance === "supabase")).toBe(
      true,
    );
    expect(draft.values[0].position_ids).toEqual(["pos_a"]);
  });
});
