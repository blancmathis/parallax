import { expect, test, type Page } from "@playwright/test";
import {
  assertPageHealth,
  monitorRuntimeErrors,
} from "./helpers/page-health";

type LocaleFixture = {
  label: string;
  lang: "en" | "fr";
  homePath: string;
  debatesPath: string;
  debatePath: string;
  youPath: string;
  debateQuestions: readonly string[];
};

const locales: readonly LocaleFixture[] = [
  {
    label: "English",
    lang: "en",
    homePath: "/",
    debatesPath: "/debates",
    debatePath: "/debates/smartphones-schools",
    youPath: "/you",
    debateQuestions: [
      "Should cities implement congestion pricing for cars?",
      "Should schools ban smartphones during class?",
      "Should nuclear power be expanded to fight climate change?",
    ],
  },
  {
    label: "French",
    lang: "fr",
    homePath: "/fr",
    debatesPath: "/fr/debates",
    debatePath: "/fr/debates/smartphones-schools",
    youPath: "/fr/you",
    debateQuestions: [
      "Les villes devraient-elles instaurer un péage de congestion pour les voitures ?",
      "Les écoles devraient-elles interdire les smartphones pendant les cours ?",
      "Faut-il développer le nucléaire pour lutter contre le changement climatique ?",
    ],
  },
];

async function expectPathAndLanguage(
  page: Page,
  path: string,
  lang: LocaleFixture["lang"],
): Promise<void> {
  await expect.poll(() => new URL(page.url()).pathname).toBe(path);
  await expect(page.locator("html")).toHaveAttribute("lang", lang);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const locale of locales) {
  test.describe(`${locale.label} fixture mode`, () => {
    test("home route renders without high-impact regressions", async ({ page }) => {
      const runtime = monitorRuntimeErrors(page);

      await page.goto(locale.homePath);
      await expectPathAndLanguage(page, locale.homePath, locale.lang);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      runtime.assertNoErrors();
      await assertPageHealth(page);
    });

    test("debate index exposes every seeded fixture and its route", async ({
      page,
    }) => {
      const runtime = monitorRuntimeErrors(page);

      await page.goto(locale.debatesPath);
      await expectPathAndLanguage(page, locale.debatesPath, locale.lang);

      for (const question of locale.debateQuestions) {
        await expect(
          page.getByRole("heading", { level: 3, name: question, exact: true }),
        ).toBeVisible();
      }

      const featuredLink = page.getByRole("link", {
        name: new RegExp(escapeRegExp(locale.debateQuestions[1])),
      });
      await expect(featuredLink).toHaveAttribute("href", locale.debatePath);
      runtime.assertNoErrors();
      await assertPageHealth(page);
    });

    test("seeded debate route renders the matching localized fixture", async ({
      page,
    }) => {
      const runtime = monitorRuntimeErrors(page);

      await page.goto(locale.debatePath);
      await expectPathAndLanguage(page, locale.debatePath, locale.lang);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: locale.debateQuestions[1],
          exact: true,
        }),
      ).toBeVisible();
      runtime.assertNoErrors();
      await assertPageHealth(page);
    });

    test("public account route exposes no local seed credential", async ({ page }) => {
      const runtime = monitorRuntimeErrors(page);

      await page.goto(locale.youPath);
      await expectPathAndLanguage(page, locale.youPath, locale.lang);
      for (const credential of [
        "user@example.test",
        "reviewer@example.test",
        "admin@example.test",
        "Parallax123!",
      ]) {
        await expect(page.locator("body")).not.toContainText(credential);
      }
      runtime.assertNoErrors();
      await assertPageHealth(page);
    });
  });
}
