import { expect, test } from "@playwright/test";
import {
  assertPageHealth,
  monitorRuntimeErrors,
} from "./helpers/page-health";

const STORE_KEY = "parallax.store.v1";
const debatePath = "/debates/smartphones-schools";
const debateQuestion = "Should schools ban smartphones during class?";

test("a local contribution can be reviewed, approved, and read in the debate", async ({
  page,
}) => {
  const contribution =
    "A predictable phone-free routine can reduce classroom transition friction.";
  const rationale = "Clear, relevant, and scoped to the selected position.";
  const runtime = monitorRuntimeErrors(page);

  await page.addInitScript((key) => window.localStorage.removeItem(key), STORE_KEY);
  await page.goto(debatePath);
  await expect(
    page.getByRole("heading", { level: 1, name: debateQuestion, exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Improve this debate" }).click();
  const contributionDialog = page.getByRole("dialog", {
    name: "Draft a contribution",
  });
  await expect(contributionDialog).toBeVisible();
  await contributionDialog.getByLabel("Which position?").selectOption("pos_a");
  await contributionDialog
    .getByLabel("The claim, stated atomically")
    .fill(contribution);
  await contributionDialog
    .getByRole("button", { name: "Submit for review" })
    .click();

  await expect(
    contributionDialog.getByRole("heading", {
      level: 3,
      name: "Your draft is pending review.",
    }),
  ).toBeVisible();
  await contributionDialog
    .getByRole("link", { name: "Open the review queue" })
    .click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/review");

  const pendingCard = page.getByRole("article").filter({
    hasText: contribution,
  });
  await expect(pendingCard).toBeVisible();
  await pendingCard
    .getByRole("textbox", {
      name: "Decision rationale",
    })
    .fill(rationale);
  await pendingCard.getByRole("button", { name: "Approve" }).click();

  const acceptedCard = page.getByRole("article").filter({
    hasText: contribution,
  });
  await expect(acceptedCard).toContainText("accepted");
  await expect(acceptedCard).toContainText(rationale);
  await acceptedCard
    .getByRole("link", { name: "Smartphones in Schools", exact: true })
    .click();

  await expect.poll(() => new URL(page.url()).pathname).toBe(debatePath);
  await expect(
    page.getByRole("heading", { level: 1, name: debateQuestion, exact: true }),
  ).toBeVisible();
  await expect(page.getByText(contribution, { exact: true })).toBeVisible();
  runtime.assertNoErrors();
  await assertPageHealth(page);
});
