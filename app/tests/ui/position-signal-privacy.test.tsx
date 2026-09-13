import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import congestionPricing from "../../src/data/congestion-pricing.json";
import { I18nProvider } from "../../src/i18n";
import type { DebateFixture } from "../../src/types";

vi.mock("../../src/lib/profile", () => ({
  castSignal: vi.fn(),
  useProfile: () => ({ signal: {} }),
}));

vi.mock("../../src/lib/backend", () => ({
  castPositionSignal: vi.fn(),
  usePositionAggregate: () => ({ aggregate: null }),
}));

import { PositionSignalBefore } from "../../src/components/PositionSignal";

const debate = congestionPricing as unknown as DebateFixture;

function renderBallot(source: "fixtures" | "supabase", path = "/debate") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider>
        <PositionSignalBefore debate={debate} source={source} />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe("position signal privacy copy", () => {
  it("says that a fixture ballot is browser-only", () => {
    renderBallot("fixtures");

    expect(
      screen.getByText(
        "Local demo: this pick stays in this browser and is not sent to a server.",
      ),
    ).toBeInTheDocument();
  });

  it("discloses the private account-linked backend ballot in French", () => {
    renderBallot("supabase", "/fr/debat");

    expect(
      screen.getByText(/un bulletin privé lié à votre compte est conservé/i),
    ).toHaveTextContent(/seules des fourchettes agrégées.*k-anonymisées/i);
    expect(screen.queryByText(/jamais lié à vous/i)).not.toBeInTheDocument();
  });
});
