import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";
import { debateBySlug, getDebates, letterOf, slugOf } from "../../src/data";
import { coverageFor } from "../../src/data/coverage";
import { claimSharedBy, claimState, debateShape } from "../../src/data/state";
import { dictionaries, I18nProvider, type Locale } from "../../src/i18n";
import whitelist from "../../src/numeric-whitelist.json";
import type { DebateFixture, EvidenceLabel } from "../../src/types";

// Inspect the resolved count-up state, independently of animation timing.
vi.mock("../../src/lib/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/ui")>();
  return { ...actual, useCountUp: (target: number) => target };
});

const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
const numerals = (text: string) => text.match(/\d+(?:[.,]\d+)?/g) ?? [];

function fixtureStrings(value: unknown): string[] {
  if (typeof value === "string") return [normalize(value)];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(fixtureStrings);
}

type NumericRule = { selector: string; texts: string[] };

function computedRules(
  element: Element,
  locale: Locale,
  current?: DebateFixture,
): NumericRule[] {
  const t = dictionaries[locale];
  const debates = getDebates(locale);
  const card = element.closest<HTMLAnchorElement>("a.dcard");
  const cardSlug = card?.getAttribute("href")?.split("/").pop();
  const debate = cardSlug ? debateBySlug(cardSlug, locale) : current;
  const totals = {
    claims: debates.reduce((n, d) => n + d.claims.length, 0),
    sources: debates.reduce((n, d) => n + d.sources.length, 0),
    links: debates.reduce((n, d) => n + d.evidence_links.length, 0),
  };
  const corpus = debates.map((d) => debateShape(d));
  const shape = {
    established: corpus.reduce((n, s) => n + s.established, 0),
    contested: corpus.reduce((n, s) => n + s.contested, 0),
    provisional: corpus.reduce((n, s) => n + s.provisional, 0),
    values: corpus.reduce((n, s) => n + s.values, 0),
  };
  const rules: NumericRule[] = [
    {
      selector: ".stat__n, .atlas-ledger__n",
      texts: [debates.length, ...Object.values(totals)].map(String),
    },
    {
      selector: ".preview .section__title em",
      texts: [
        t.common.counts.previewStats(
          totals.claims,
          totals.sources,
          totals.links,
        ),
      ],
    },
    {
      selector: ".atlas-spine--corpus .atlas-spine__key",
      texts: Object.entries(shape).map(([state, count]) =>
        t.atlas.legend[state as keyof typeof t.atlas.legend](count),
      ),
    },
    {
      selector: ".indexpage > .sr-only[role='status']",
      texts: [
        t.debatesIndex.resultsCount(
          element.closest(".indexpage")?.querySelectorAll("a.dcard").length ??
            0,
        ),
      ],
    },
  ];
  if (!debate) return rules;

  const s = debateShape(debate);
  const shared = claimSharedBy(debate);
  const coverage = coverageFor(debate);
  const positions = coverage.sourcesByPosition
    .map((item) => `${letterOf(debate, item.positionId)} : ${item.sources}`)
    .join(" · ");
  const cardNumber =
    card && card.parentElement
      ? [...card.parentElement.querySelectorAll("a.dcard")].indexOf(card) + 1
      : 0;
  const days = Math.round(
    (new Date(debate.revision.published_at).getTime() - Date.now()) /
      86_400_000,
  );
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const relative =
    Math.abs(days) >= 30
      ? rtf.format(Math.round(days / 30), "month")
      : Math.abs(days) >= 7
        ? rtf.format(Math.round(days / 7), "week")
        : rtf.format(days, "day");
  const cardLabels = [
    t.debateCard.shapeEstablished(s.established),
    t.debateCard.shapeContested(s.contested),
    t.debateCard.shapeProvisional(s.provisional),
    t.debateCard.shapeValues(s.values),
  ];
  const argLabels = debate.arguments.map((argument) => {
    const claims = argument.claim_ids
      .map((id) => debate.claims.find((claim) => claim.id === id))
      .filter((claim) => claim !== undefined);
    const tally = new Map<EvidenceLabel, number>();
    for (const claim of claims) {
      for (const link of debate.evidence_links.filter(
        (l) => l.claim_id === claim.id,
      )) {
        tally.set(link.label, (tally.get(link.label) ?? 0) + 1);
      }
    }
    const dominant = [...tally].sort((a, b) => b[1] - a[1])[0]?.[0];
    return t.debatePage.argMeta(
      claims.length,
      claims.filter((claim) => claimState(debate, claim) === "contested")
        .length,
      dominant
        ? t.common.evidenceLabels[dominant]
        : t.common.labels.noSourceYet,
    );
  });
  const counts = [s.established, s.contested, s.provisional, s.values];

  rules.push(
    {
      selector: ".dcard__no",
      texts: [`№ ${String(cardNumber).padStart(3, "0")}`],
    },
    {
      selector: ".dcard__rev",
      texts: [
        `${t.common.labels.revisionShort} ${debate.revision.revision_number}`,
      ],
    },
    {
      selector: ".dcard__foot > span:first-child",
      texts: [
        t.common.counts.cardStats(
          debate.claims.length,
          debate.sources.length,
          debate.evidence_links.length,
        ),
      ],
    },
    {
      selector: ".dcard .atlas-spine__key",
      texts: counts.map((n, i) => `${n}${cardLabels[i]}`),
    },
    {
      selector: ".atlas-card__revised",
      texts: [
        `${t.atlas.revisedPrefix} ${relative}${s.total > 0 ? ` · ${t.atlas.claimsCounted(s.total)}` : ""}`,
      ],
    },
    {
      selector: ".hero__status > span",
      texts: [
        t.debatePage.heroStatus(
          debate.revision.revision_number,
          debate.sources.length,
        ),
      ],
    },
    {
      selector: ".draftnotice__coverage",
      texts: [
        `${t.draft.coverage(positions, coverage.withExcerpt, coverage.links, coverage.excerptPercent)} ${t.draft.reviewers}`,
      ],
    },
    {
      selector: ".statestrip__chip",
      texts: [
        t.features.stateEstablished(s.established),
        t.features.stateContested(s.contested),
        t.features.stateValues(s.values),
        locale === "fr"
          ? `${s.provisional} provisoire(s) / inconnue(s)`
          : `${s.provisional} provisional / unknown`,
      ],
    },
    { selector: ".faultline__lanecount", texts: counts.map(String) },
    {
      selector: ".faultline__commonground",
      texts: [
        t.debatePage.faultCommonGround(
          [...shared].filter(([id]) =>
            debate.claims.some(
              (claim) =>
                claim.id === id && claimState(debate, claim) === "established",
            ),
          ).length,
        ),
        t.debatePage.faultCommonGroundFallback(s.established),
      ],
    },
    {
      selector: ".chooser .section__title",
      texts: [
        `${t.common.counts.seriousAnswers(debate.positions.length)}${t.debatePage.chooserEm}`,
      ],
    },
    { selector: ".arglist__meta", texts: argLabels },
    { selector: ".fold__count", texts: [String(debate.sources.length)] },
    {
      selector: ".source__notes",
      texts: debate.sources
        .filter((source) => source.content_hash)
        .map(
          (source) =>
            `${locale === "fr" ? "Artefact vérifiable" : "Verifiable artefact"}: ${source.content_hash}`,
        ),
    },
    {
      selector: ".evcard__trace .evcard__foot",
      texts: debate.sources
        .filter((source) => source.content_hash)
        .map((source) => `Artefact: ${source.content_hash}`),
    },
  );
  return rules;
}

function unexplainedNumbers(
  container: HTMLElement,
  locale: Locale,
  current?: DebateFixture,
) {
  const sources = new Set(getDebates(locale).flatMap(fixtureStrings));
  const failures: string[] = [];
  const permitted = (text: string, element: Element, attribute = false) => {
    const normalized = normalize(text);
    if (!numerals(normalized).length || sources.has(normalized)) return true;
    // The evidence footer prefixes a verbatim source note with a separator.
    if (
      element.closest(".evcard__foot") &&
      sources.has(normalized.replace(/^·\s*/, ""))
    )
      return true;
    if (
      whitelist.some(
        (entry) =>
          entry.reason.trim().length > 0 &&
          element.closest(entry.selector) &&
          numerals(normalized).every((number) =>
            entry.numbers.includes(number),
          ),
      )
    )
      return true;
    if (!attribute && element.closest(".claim__evidence")) {
      return (
        current?.claims.some(
          (claim) =>
            normalized ===
            dictionaries[locale].common.counts.sourceCount(
              current.evidence_links.filter(
                (link) => link.claim_id === claim.id,
              ).length,
            ),
        ) ?? false
      );
    }
    if (attribute && element.matches(".confmeter")) {
      const t = dictionaries[locale];
      return (
        current?.evidence_links.some((link) => {
          const bucket =
            link.confidence >= 0.75
              ? "high"
              : link.confidence >= 0.45
                ? "med"
                : "low";
          return (
            normalized ===
            `${t.common.labels.confidence} ${link.confidence.toFixed(2)} · ${t.common.confidenceBuckets[bucket]}`
          );
        }) ?? false
      );
    }
    if (attribute && element.matches(".atlas-spine__bar")) {
      const card = element.closest<HTMLAnchorElement>("a.dcard");
      const debate = card
        ? debateBySlug(
            card.getAttribute("href")?.split("/").pop() ?? "",
            locale,
          )
        : undefined;
      const shapes = (debate ? [debate] : getDebates(locale)).map((d) =>
        debateShape(d),
      );
      return (
        normalized ===
        dictionaries[locale].atlas.spineSummary(
          shapes.reduce((n, s) => n + s.established, 0),
          shapes.reduce((n, s) => n + s.contested, 0),
          shapes.reduce((n, s) => n + s.provisional, 0),
          shapes.reduce((n, s) => n + s.values, 0),
        )
      );
    }
    if (attribute && element.matches(".atlas-spine__seg")) {
      const card = element.closest<HTMLAnchorElement>("a.dcard");
      const debate = card
        ? debateBySlug(
            card.getAttribute("href")?.split("/").pop() ?? "",
            locale,
          )
        : undefined;
      const shapes = (debate ? [debate] : getDebates(locale)).map((d) =>
        debateShape(d),
      );
      const sum = (
        key: "established" | "contested" | "provisional" | "values",
      ) => shapes.reduce((n, shape) => n + shape[key], 0);
      const t = dictionaries[locale];
      return [
        debate
          ? t.debateCard.shapeEstablished(sum("established"))
          : t.atlas.legend.established(sum("established")),
        debate
          ? t.debateCard.shapeContested(sum("contested"))
          : t.atlas.legend.contested(sum("contested")),
        debate
          ? t.debateCard.shapeProvisional(sum("provisional"))
          : t.atlas.legend.provisional(sum("provisional")),
        debate
          ? t.debateCard.shapeValues(sum("values"))
          : t.atlas.legend.values(sum("values")),
      ].includes(normalized);
    }
    return (
      !attribute &&
      computedRules(element, locale, current).some((rule) => {
        const context = element.closest(rule.selector);
        return (
          context &&
          rule.texts.some(
            (expected) =>
              normalize(expected) === normalize(context.textContent ?? ""),
          )
        );
      })
    );
  };
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || parent.closest("script, style")) continue;
    if (!permitted(node.textContent ?? "", parent)) {
      failures.push(
        `${parent.className}: ${normalize(node.textContent ?? "")}`,
      );
    }
  }
  for (const element of container.querySelectorAll("[aria-label], [title], [placeholder], [alt]")) {
    for (const attribute of ["aria-label", "title", "placeholder", "alt"]) {
      const text = element.getAttribute(attribute);
      if (text && !permitted(text, element, true))
        failures.push(`${attribute}: ${text}`);
    }
  }
  return failures;
}

afterEach(() => vi.restoreAllMocks());

describe("displayed number provenance", () => {
  for (const locale of ["en", "fr"] as const) {
    const prefix = locale === "fr" ? "/fr" : "";
    const routes = [
      "",
      "/debates",
      "/method",
      "/missing",
      ...getDebates(locale).map((d) => `/debates/${slugOf(d)}`),
    ];
    it.each(routes)(
      `${locale} %s uses fixture, computed, or explicitly justified numbers`,
      async (route) => {
        vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
        vi.spyOn(Date, "now").mockReturnValue(
          new Date("2026-10-03T10:00:00Z").getTime(),
        );
        const current = route.startsWith("/debates/")
          ? debateBySlug(route.split("/").pop() ?? "", locale)
          : undefined;
        const { container } = render(
          <MemoryRouter initialEntries={[`${prefix}${route}` || "/"]}>
            <I18nProvider>
              <App />
            </I18nProvider>
          </MemoryRouter>,
        );
        await screen.findByRole("heading", { level: 1 });
        expect(unexplainedNumbers(container, locale, current)).toEqual([]);
        // Every position and every evidence drawer is checked, including data
        // that was initially outside the selected reading view.
        for (const button of container.querySelectorAll<HTMLButtonElement>(
          ".switcher__pill",
        )) {
          fireEvent.click(button);
          for (const claim of container.querySelectorAll<HTMLButtonElement>(
            ".claim__row",
          ))
            fireEvent.click(claim);
          expect(unexplainedNumbers(container, locale, current)).toEqual([]);
        }
      },
    );
  }

  it("rejects fabricated numbers even when that numeral occurs in a fixture", () => {
    const { container } = render(<p>42 people have approved this dossier.</p>);
    expect(unexplainedNumbers(container, "en")).toEqual([
      ": 42 people have approved this dossier.",
    ]);
  });

  it("requires a reason for every static whitelist entry", () => {
    for (const entry of whitelist) {
      expect(entry.reason.trim().length).toBeGreaterThan(0);
      expect(entry.numbers.length).toBeGreaterThan(0);
    }
  });
});
