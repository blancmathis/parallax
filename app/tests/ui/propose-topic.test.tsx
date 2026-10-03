import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProposeTopic } from "../../src/components/ProposeTopic";
import { I18nProvider } from "../../src/i18n";

vi.mock("../../src/lib/supabase", () => ({
  isSupabaseConfigured: false,
  supabase: null,
}));

vi.mock("../../src/lib/auth", () => ({
  useAuth: () => ({ user: null }),
}));

function renderProposal() {
  return render(
    <MemoryRouter initialEntries={["/debates"]}>
      <I18nProvider>
        <ProposeTopic open onClose={vi.fn()} />
      </I18nProvider>
    </MemoryRouter>,
  );
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole("textbox", { name: "The debate question" }),
    "Should this public question be mapped?",
  );
  await user.type(
    screen.getByRole("textbox", { name: "Why it matters now" }),
    "It affects a large public decision.",
  );
}

describe("topic proposal source URLs", () => {
  it("accepts an uppercase HTTPS scheme and stores the validated local draft", async () => {
    const user = userEvent.setup();
    renderProposal();
    await fillRequiredFields(user);
    await user.type(
      screen.getByRole("textbox", { name: "First public source URL" }),
      "HTTPS://example.com/report",
    );

    await user.click(screen.getByRole("button", { name: "Save my proposal" }));

    expect(
      await screen.findByRole("heading", { name: "Saved, on your device." }),
    ).toBeInTheDocument();
    const stored = JSON.parse(
      localStorage.getItem("parallax.topic-proposals.v1") ?? "[]",
    ) as { sources: string[] }[];
    expect(stored[0]?.sources).toEqual(["HTTPS://example.com/report"]);
  });

  it("shows a field error instead of silently dropping an unsafe source", async () => {
    const user = userEvent.setup();
    renderProposal();
    await fillRequiredFields(user);
    const source = screen.getByRole("textbox", {
      name: "First public source URL",
    });
    await user.type(source, "https://user:pass@example.com/report");

    await user.click(screen.getByRole("button", { name: "Save my proposal" }));

    expect(source).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a full public http(s) URL without embedded credentials or a custom port.",
    );
    expect(localStorage.getItem("parallax.topic-proposals.v1")).toBeNull();
  });
});
