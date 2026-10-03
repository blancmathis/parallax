import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

type RuntimeErrorMonitor = {
  assertNoErrors: () => void;
};

export function monitorRuntimeErrors(page: Page): RuntimeErrorMonitor {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  return {
    assertNoErrors() {
      expect(
        { consoleErrors, pageErrors },
        "The page emitted browser console or uncaught runtime errors.",
      ).toEqual({ consoleErrors: [], pageErrors: [] });
    },
  };
}

function formatAxeViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
): string {
  return violations
    .map((violation) => {
      const targets = violation.nodes
        .map((node) => node.target.join(" "))
        .join(", ");
      return `${violation.id} (${violation.impact ?? "unknown"}): ${targets}`;
    })
    .join("\n");
}

export async function assertPageHealth(page: Page): Promise<void> {
  // Audit the supported reduced-motion reading state. Prerendered text is
  // visible before entrance animations settle; those fades distort contrast.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(async () => {
    await document.fonts?.ready;
  });

  const horizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    const widestContent = Math.max(root.scrollWidth, document.body?.scrollWidth ?? 0);
    return Math.max(0, widestContent - root.clientWidth);
  });
  expect(
    horizontalOverflow,
    `The page overflows the viewport horizontally by ${horizontalOverflow}px.`,
  ).toBeLessThanOrEqual(1);

  const axe = await new AxeBuilder({ page }).analyze();
  const highImpactViolations = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(
    highImpactViolations.length,
    `Serious or critical accessibility violations:\n${formatAxeViolations(highImpactViolations)}`,
  ).toBe(0);
}
