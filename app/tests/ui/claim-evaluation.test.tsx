import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import nuclearPower from "../../src/data/nuclear-power.json";
import { I18nProvider } from "../../src/i18n";
import type { DebateFixture } from "../../src/types";

const backend = vi.hoisted(() => ({
  evaluateClaim: vi.fn(),
  useDebateBySlug: vi.fn(),
}));

vi.mock("../../src/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {},
}));

vi.mock("../../src/lib/auth", () => ({
  useAuth: () => ({
    status: "authenticated",
    session: null,
    user: { id: "admin-test", email: "admin@example.test" },
    profile: {
      id: "admin-test",
      email: "admin@example.test",
      display_name: "Test admin",
      role: "admin",
    },
    isReviewer: true,
    isAdmin: true,
    refreshProfile: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("../../src/lib/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/backend")>();
  return {
    ...actual,
    useDebateBySlug: backend.useDebateBySlug,
    loadAcceptedContributions: vi.fn().mockResolvedValue([]),
    useClaimEvaluations: () => ({
      evaluations: new Map(),
      loading: false,
      error: null,
      reload: vi.fn(),
    }),
    evaluateClaim: backend.evaluateClaim,
    useReviewerSelf: () => ({
      self: { camp_id: "pos_a", endorsements: new Map() },
      loading: false,
      error: null,
      reload: vi.fn(),
    }),
    useSourceAssessments: () => ({
      assessments: new Map(),
      loading: false,
      error: null,
      reload: vi.fn(),
    }),
  };
});

import DebatePage from "../../src/pages/DebatePage";

const debate = nuclearPower as unknown as DebateFixture;

describe("claim evaluation decision contract", () => {
  beforeEach(() => {
    backend.evaluateClaim.mockReset();
    backend.evaluateClaim.mockResolvedValue({ ok: true });
    backend.useDebateBySlug.mockReturnValue({
      debate,
      debates: [debate],
      provenance: "supabase",
      loading: false,
      error: null,
    });
  });

  it("keeps established bridge-only and requires rationale for manual claim states", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/debates/nuclear-power"]}>
        <I18nProvider>
          <Routes>
            <Route path="/debates/:slug" element={<DebatePage />} />
          </Routes>
        </I18nProvider>
      </MemoryRouter>,
    );

    const claimText = (await screen.findAllByText(debate.claims[0].text)).find(
      (element) => element.classList.contains("claim__text"),
    );
    expect(claimText).toBeDefined();
    const claimButton = claimText!.closest("button");
    expect(claimButton).not.toBeNull();
    await user.click(claimButton!);

    const decision = screen
      .getByText("Record the state:")
      .closest(".claimeval__set");
    expect(decision).toBeInstanceOf(HTMLElement);
    if (!(decision instanceof HTMLElement)) {
      throw new Error("The claim decision controls must be an HTML element.");
    }

    const established = within(decision).queryByRole("button", {
      name: "Established",
    });
    expect(established).not.toBeInTheDocument();
    expect(within(decision).getByRole("note")).toHaveTextContent(
      "Established is calculated only after reviewers from opposing camps agree; it is never assigned manually.",
    );

    const rationale = within(decision).getByRole("textbox", {
      name: "Decision rationale",
    });
    const contested = within(decision).getByRole("button", {
      name: "Contested",
    });
    const values = within(decision).getByRole("button", {
      name: "A values choice",
    });
    expect(contested).toBeDisabled();
    expect(values).toBeDisabled();

    await user.type(rationale, "1234567");
    expect(contested).toBeDisabled();
    expect(values).toBeDisabled();

    await user.clear(rationale);
    await user.type(rationale, "Verified against the cited source.");
    expect(contested).toBeEnabled();
    expect(values).toBeEnabled();
    await user.click(contested);

    expect(backend.evaluateClaim).toHaveBeenCalledWith({
      topic_id: debate.topic.id,
      claim_id: debate.claims[0].id,
      state: "contested",
      rationale: "Verified against the cited source.",
    });
  });

  it("exposes the same bridge-only contract and rationale gate in French", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/fr/debates/nuclear-power"]}>
        <I18nProvider>
          <Routes>
            <Route path="/fr/debates/:slug" element={<DebatePage />} />
          </Routes>
        </I18nProvider>
      </MemoryRouter>,
    );

    const claimText = (await screen.findAllByText(debate.claims[0].text)).find(
      (element) => element.classList.contains("claim__text"),
    );
    expect(claimText).toBeDefined();
    const claimButton = claimText!.closest("button");
    expect(claimButton).not.toBeNull();
    await user.click(claimButton!);

    const decision = screen
      .getByText("Consigner l'état :")
      .closest(".claimeval__set");
    expect(decision).toBeInstanceOf(HTMLElement);
    if (!(decision instanceof HTMLElement)) {
      throw new Error("Les contrôles de décision doivent être un élément HTML.");
    }

    expect(
      within(decision).queryByRole("button", { name: "Établie" }),
    ).not.toBeInTheDocument();
    expect(within(decision).getByRole("note")).toHaveTextContent(
      "L’état « Établie » est calculé uniquement après l’accord de relecteurs de camps opposés ; il n’est jamais attribué manuellement.",
    );
    expect(
      within(decision).getByRole("textbox", {
        name: "Justification de la décision",
      }),
    ).toBeEnabled();
    expect(
      within(decision).getByRole("button", { name: "Contestée" }),
    ).toBeDisabled();
    expect(
      within(decision).getByRole("button", { name: "Un choix de valeurs" }),
    ).toBeDisabled();
  });
});
