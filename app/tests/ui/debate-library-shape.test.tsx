import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import nuclearPower from "../../src/data/nuclear-power.json";
import { I18nProvider } from "../../src/i18n";
import type { DebateFixture } from "../../src/types";

const fixtures = vi.hoisted(() => ({
  getDebates: vi.fn(),
}));

vi.mock("../../src/data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/data")>();
  return { ...actual, getDebates: fixtures.getDebates };
});

import DebatesIndex from "../../src/pages/DebatesIndex";

function oneClaimDebate(
  id: string,
  question: string,
  reviewStatus: "unreviewed" | "contested",
): DebateFixture {
  const debate = structuredClone(
    nuclearPower,
  ) as unknown as DebateFixture;
  debate.topic.id = `topic_${id}`;
  debate.topic.question = question;
  debate.claims = [
    {
      ...debate.claims[0],
      id: `claim_${id}`,
      claim_type: ["factual"],
      review_status: reviewStatus,
      evidence_link_ids: [],
    },
  ];
  debate.evidence_links = [];
  return debate;
}

describe("debate library epistemic shape", () => {
  const provisional = oneClaimDebate(
    "provisional",
    "Which claim still needs independent review?",
    "unreviewed",
  );
  const contested = oneClaimDebate(
    "contested",
    "Which claim has actually been challenged?",
    "contested",
  );

  beforeEach(() => {
    fixtures.getDebates.mockReturnValue([provisional, contested]);
  });

  it("renders exclusive corpus/card counts and sorts the two states separately", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter initialEntries={["/debates"]}>
        <I18nProvider>
          <DebatesIndex />
        </I18nProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("img", {
        name: "0 established, 1 contested, 1 provisional, 0 values-dependent",
      }),
    ).toBeInTheDocument();

    const provisionalHeading = screen.getByRole("heading", {
      level: 3,
      name: provisional.topic.question,
    });
    const provisionalCard = provisionalHeading.closest("a");
    expect(provisionalCard).toBeInstanceOf(HTMLAnchorElement);
    expect(
      within(provisionalCard as HTMLAnchorElement).getByText(
        "1 provisional claim awaiting review",
      ),
    ).toBeInTheDocument();
    expect(
      provisionalCard?.querySelector(".atlas-spine__seg--contested"),
    ).toBeNull();
    expect(
      provisionalCard?.querySelector(".atlas-spine__seg--provisional"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Most contested" }));
    let cards = container.querySelectorAll<HTMLAnchorElement>("a.dcard");
    expect(cards[0]).toHaveTextContent(contested.topic.question);

    await user.click(
      screen.getByRole("button", { name: "Most awaiting review" }),
    );
    cards = container.querySelectorAll<HTMLAnchorElement>("a.dcard");
    expect(cards[0]).toHaveTextContent(provisional.topic.question);
  });
});
