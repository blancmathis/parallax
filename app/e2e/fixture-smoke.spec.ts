import { readFileSync } from "node:fs";
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
  debateQuestions: readonly string[];
};

const locales: readonly LocaleFixture[] = [
  {
    label: "English",
    lang: "en",
    homePath: "/en/",
    debatesPath: "/en/debates",
    debatePath: "/en/debates/smartphones-schools",
    debateQuestions: [
      "Should cities implement congestion pricing for cars?",
      "Should schools ban smartphones during class?",
      "Should nuclear power be expanded to fight climate change?",
    ],
  },
  {
    label: "French",
    lang: "fr",
    homePath: "/",
    debatesPath: "/debates",
    debatePath: "/debates/smartphones-schools",
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
      await expect(page.locator("main > section")).toHaveCount(4);
      await expect(page.locator("a.dcard").first()).toBeInViewport();
      runtime.assertNoErrors();
      await assertPageHealth(page);
    });

    test("language switch preserves project route, query and hash", async ({ page }) => {
      const runtime = monitorRuntimeErrors(page);
      const projectPath = locale.lang === "fr" ? "/projet" : "/en/project";
      const target = locale.lang === "fr" ? "EN" : "FR";
      const targetPath = locale.lang === "fr" ? "/en/project" : "/projet";
      await page.goto(`${projectPath}?read=project#about`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.locator(".masthead__right").getByRole("button", { name: target, exact: true }).click();
      await expect.poll(() => new URL(page.url()).pathname).toBe(targetPath);
      expect(new URL(page.url()).search).toBe("?read=project");
      expect(new URL(page.url()).hash).toBe("#about");
      await expect(page.locator("html")).toHaveAttribute("lang", target.toLowerCase());
      runtime.assertNoErrors();
      await assertPageHealth(page);
    });

    test("legal footer links open localized reading pages", async ({ page }) => {
      const runtime = monitorRuntimeErrors(page);
      await page.goto(locale.homePath);
      const pages = locale.lang === "fr"
        ? [["Mentions légales", "/mentions-legales"], ["Confidentialité", "/confidentialite"], ["Contact", "/contact"]]
        : [["Legal notice", "/en/legal"], ["Privacy", "/en/privacy"], ["Contact", "/en/contact"]];
      for (const [title, path] of pages) {
        await page.locator("footer").getByRole("link", { name: title, exact: true }).click();
        await expectPathAndLanguage(page, path, locale.lang);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));
        await assertPageHealth(page);
      }
      await expect(page.locator("footer a[href*='template=source-alignment.yml']")).toHaveCount(1);
      runtime.assertNoErrors();
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

  });
}

test.describe("static reading without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const locale of locales) {
    test(`${locale.label} dossier contains its fixture steelman`, async ({ page }) => {
      const fixture = JSON.parse(readFileSync(
        new URL(`../src/data/${locale.lang === "fr" ? "fr/" : ""}smartphones-schools.json`, import.meta.url),
        "utf8",
      )) as { positions: { steelman: string }[] };
      await page.goto(locale.debatePath);
      await expect(page.locator("html")).toHaveAttribute("lang", locale.lang);
      await expect(page.locator(".steelman p").first()).toHaveText(fixture.positions[0].steelman);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(locale.debateQuestions[1]);
    });
  }
});
