import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ContributePanel } from "../../src/components/Contribute";
import nuclearPower from "../../src/data/nuclear-power.json";
import { I18nProvider } from "../../src/i18n";
import type { DebateFixture } from "../../src/types";

vi.mock("../../src/lib/supabase", () => ({
  isSupabaseConfigured: false,
  supabase: null,
}));

vi.mock("../../src/lib/auth", () => ({
  useAuth: () => ({ user: null }),
}));

const debate = nuclearPower as unknown as DebateFixture;

function renderPanel() {
  return render(
    <MemoryRouter initialEntries={["/debates/nuclear-power"]}>
      <I18nProvider>
        <ContributePanel debate={debate} open onClose={vi.fn()} />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe("contribution choice controls", () => {
  it("uses native radio keyboard behavior for type and evidence-label choices", async () => {
    const user = userEvent.setup();
    renderPanel();

    const newClaim = screen.getByRole("radio", { name: /New claim/i });
    const newSource = screen.getByRole("radio", { name: /New source/i });
    expect(newClaim).toBeChecked();
    newClaim.focus();
    await user.keyboard("{ArrowRight}");
    expect(newSource).toHaveFocus();
    expect(newSource).toBeChecked();

    await user.click(screen.getByRole("radio", { name: /Challenge a label/i }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Which claim?" }),
      debate.claims[0].id,
    );
    const link = debate.evidence_links.find(
      (item) => item.claim_id === debate.claims[0].id,
    );
    expect(link).toBeDefined();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Which evidence link?" }),
      link!.id,
    );

    const partial = screen.getByRole("radio", { name: "partially supports" });
    const contradicts = screen.getByRole("radio", { name: "contradicts" });
    expect(partial).toBeChecked();
    partial.focus();
    await user.keyboard("{ArrowRight}");
    expect(contradicts).toHaveFocus();
    expect(contradicts).toBeChecked();
  });

  it("exposes the strict public-URL limit instead of accepting a prefix", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("radio", { name: /New source/i }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Which claim?" }),
      debate.claims[0].id,
    );
    const source = screen.getByRole("textbox", { name: "Source URL" });
    await user.type(source, "https://user:pass@example.com/report");

    expect(source).toHaveAttribute("maxlength", "2048");
    expect(source).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a valid public source URL matching those limits.",
    );
    expect(screen.getByRole("button", { name: "Submit for review" })).toBeDisabled();
  });
});
