import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import congestionPricing from "../../src/data/congestion-pricing.json";
import { I18nProvider } from "../../src/i18n";
import type { DebateFixture } from "../../src/types";

const dossierApi = vi.hoisted(() => ({
  captureClaimDossierSource: vi.fn(),
  submitClaimDossier: vi.fn(),
}));

vi.mock("../../src/lib/supabase", () => ({
  isSupabaseConfigured: true,
  requireSupabase: vi.fn(),
}));

vi.mock("../../src/lib/auth", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: { id: "user-test", email: "user@example.test" },
    profile: { role: "normal" },
    isReviewer: false,
    isAdmin: false,
  }),
}));

vi.mock("../../src/features/dossier/api", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../src/features/dossier/api")
  >();
  return {
    ...actual,
    captureClaimDossierSource: dossierApi.captureClaimDossierSource,
    submitClaimDossier: dossierApi.submitClaimDossier,
  };
});

import { ClaimDossierForm } from "../../src/features/dossier/ClaimDossierForm";

const debate = congestionPricing as unknown as DebateFixture;

function renderForm(challengeEvidenceLinkId?: string) {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <ClaimDossierForm
          debate={debate}
          challengeEvidenceLinkId={challengeEvidenceLinkId}
        />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe("claim dossier form", () => {
  it("exposes the bounded two-source workflow and keeps submission disabled until complete", () => {
    renderForm();

    expect(screen.getByRole("heading", { name: "Submit a reviewed evidence dossier" })).toBeInTheDocument();
    expect(screen.getByLabelText("Claim text")).toHaveAttribute("lang", "en");
    expect(screen.getByLabelText("Scope")).toBeInTheDocument();
    expect(screen.getByLabelText("Argument summary")).toBeInTheDocument();
    expect(screen.getByLabelText("Support source URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Counter source URL")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit evidence dossier" })).toBeDisabled();
    expect(screen.getByLabelText("Research role: support")).toHaveTextContent(
      "not automatically contradictory",
    );
    expect(screen.getByLabelText("Research role: counter")).toHaveTextContent(
      "not automatically contradictory",
    );
  });

  it("rejects sensitive query parameters before calling the capture Edge function", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(
      screen.getByLabelText("Support source URL"),
      "https://example.org/report?access_token=secret",
    );
    await user.click(screen.getByRole("button", { name: "Capture support source" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "without credentials, a non-standard port, or sensitive query parameters",
    );
    expect(dossierApi.captureClaimDossierSource).not.toHaveBeenCalled();
  });

  it("makes a public evidence challenge explicit without implying refutation", () => {
    const target = debate.evidence_links[0];
    renderForm(target.id);
    expect(
      screen.getByRole("heading", { name: "Challenge with a reviewed evidence dossier" }),
    ).toBeInTheDocument();
    expect(screen.getByText(target.id, { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText("Claim text")).toHaveValue(
      debate.claims.find((claim) => claim.id === target.claim_id)?.text,
    );
  });
});
