import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "Parallax123!";
const NORMAL_USER_ID = "00000000-0000-0000-0000-000000000101";
const CLAIM_TEXT =
  "Measured traffic was 12 percent lower in the priced zone during the reporting period.";
const SUPPORT_TEXT =
  "The measured zone recorded traffic 12 percent below the baseline during the reporting period.";
const COUNTER_TEXT =
  "Boundary roads recorded higher traffic during the same reporting period.";

type CaptureFixture = {
  url: string;
  text: string;
  title: string;
};

type StoredArtifact = {
  artifact_id: string;
  status: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`[backend-e2e] Missing ${name}`);
  return value;
}

const supabaseUrl = requiredEnv("PLAYWRIGHT_SUPABASE_URL");
const supabaseAnonKey = requiredEnv("PLAYWRIGHT_SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = requiredEnv(
  "PLAYWRIGHT_SUPABASE_SERVICE_ROLE_KEY",
);

function serviceClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

async function seedCapturedArtifact(
  client: SupabaseClient,
  actorId: string,
  idempotencyKey: string,
  fixture: CaptureFixture,
): Promise<StoredArtifact> {
  const reservation = await client.rpc("reserve_source_capture", {
    p_actor_id: actorId,
    p_idempotency_key: idempotencyKey,
    p_requested_url: fixture.url,
  });
  if (reservation.error) {
    throw new Error(
      `[backend-e2e] Could not reserve deterministic capture: ${reservation.error.message}`,
    );
  }

  const bytes = Buffer.from(fixture.text, "utf8");
  const hash = sha256(fixture.text);
  const stored = await client.rpc("store_source_artifact", {
    p_actor_id: actorId,
    p_idempotency_key: idempotencyKey,
    p_payload: {
      requested_url: fixture.url,
      final_url: fixture.url,
      http_status: 200,
      content_type: "text/plain; charset=utf-8",
      retrieval_status: "found",
      failure_code: null,
      raw_content_base64: bytes.toString("base64"),
      byte_length: bytes.byteLength,
      raw_sha256: hash,
      normalized_text: fixture.text,
      normalized_sha256: hash,
      title: fixture.title,
      publisher: "Parallax deterministic CI fixture",
      source_type: "report",
      parser_version: "playwright-service-fixture-v1",
      is_truncated: false,
      capture_metadata: {
        fixture_provenance: "playwright-service-role-seed",
        network_fetch: false,
      },
    },
  });
  if (stored.error) {
    throw new Error(
      `[backend-e2e] Could not store deterministic capture: ${stored.error.message}`,
    );
  }
  const value = stored.data as Partial<StoredArtifact> | null;
  if (!value?.artifact_id || value.status !== "found") {
    throw new Error("[backend-e2e] Artifact storage returned an invalid result");
  }
  return { artifact_id: value.artifact_id, status: value.status };
}

async function installDeterministicCaptureReplay(
  page: Page,
  actorId: string,
  fixtures: CaptureFixture[],
): Promise<Set<string>> {
  const byUrl = new Map(fixtures.map((fixture) => [fixture.url, fixture]));
  const seen = new Set<string>();
  const service = serviceClient();

  await page.route("**/functions/v1/capture-source", async (route) => {
    const request = route.request();
    if (request.method() !== "POST") {
      await route.continue();
      return;
    }

    const payload = request.postDataJSON() as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(["idempotency_key", "url"]);
    expect(request.headers().authorization).toMatch(/^Bearer\s+\S+$/);
    expect(payload.idempotency_key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const url = String(payload.url);
    const fixture = byUrl.get(url);
    if (!fixture) {
      throw new Error(`[backend-e2e] Unexpected capture URL: ${url}`);
    }

    // Seed through the service-only RPC using the browser's real idempotency
    // key, then continue to the real Edge Function. Its completed-reservation
    // branch returns the immutable artifact without any public network fetch.
    await seedCapturedArtifact(
      service,
      actorId,
      String(payload.idempotency_key),
      fixture,
    );
    seen.add(url);
    await route.continue();
  });

  return seen;
}

async function signIn(
  page: Page,
  email: string,
  locale: "en" | "fr" = "en",
) {
  await page.goto(locale === "fr" ? "/fr/you" : "/you");
  await page.getByLabel(locale === "fr" ? "Adresse e-mail" : "Email address").fill(email);
  await page.getByLabel(locale === "fr" ? "Mot de passe" : "Password").fill(PASSWORD);
  await page.getByRole("button", {
    name: locale === "fr" ? "Se connecter" : "Log in",
  }).click();
  await expect(page.getByRole("button", {
    name: locale === "fr" ? "Se déconnecter" : "Log out",
  })).toBeVisible();
}

async function useWholeCapturedPassage(page: Page, role: "support" | "counter") {
  const title = role === "support" ? "Support source" : "Counter source";
  const sourceText = page.getByLabel(`${title} normalized source text`);
  await expect(sourceText).toBeVisible();
  await sourceText.evaluate((element: HTMLTextAreaElement) => {
    element.focus();
    element.setSelectionRange(0, element.value.length);
    element.dispatchEvent(new Event("select", { bubbles: true }));
  });
  const useButton = page.getByRole("button", {
    name: `Use selected ${role} passage`,
  });
  await expect(useButton).toBeEnabled();
  await useButton.click();
}

test("user → reviewer → admin publishes a reviewed dossier with independent approval", async ({
  browser,
}) => {
  const userContext = await browser.newContext();
  const reviewerContext = await browser.newContext();
  const adminContext = await browser.newContext();
  const anonymousContext = await browser.newContext();

  try {
    const userPage = await userContext.newPage();
    const reviewerPage = await reviewerContext.newPage();
    const adminPage = await adminContext.newPage();
    const anonymousPage = await anonymousContext.newPage();
    const captureFixtures: CaptureFixture[] = [
      {
        url: "https://support.example.test/traffic-report",
        text: SUPPORT_TEXT,
        title: "Deterministic support traffic report",
      },
      {
        url: "https://counter.example.test/boundary-report",
        text: COUNTER_TEXT,
        title: "Deterministic boundary traffic report",
      },
    ];
    const capturedUrls = await installDeterministicCaptureReplay(
      userPage,
      NORMAL_USER_ID,
      captureFixtures,
    );

    await test.step("normal user is refused by the French review route", async () => {
      await signIn(userPage, "user@example.test", "fr");
      await userPage.goto("/fr/review");
      await expect(
        userPage.getByRole("heading", { name: "Rôle reviewer requis." }),
      ).toBeVisible();
    });

    await test.step("signed-in user submits two exact captured passages", async () => {
      await userPage.goto("/debates/congestion-pricing");
      await expect(userPage.getByText("Supabase", { exact: true }).first()).toBeVisible();
      await userPage.getByRole("button", { name: "Improve this debate" }).click();
      await userPage.getByRole("button", {
        name: "Open reviewed evidence dossier",
      }).click();

      await userPage.getByLabel("Claim text").fill(CLAIM_TEXT);
      await userPage.getByLabel("Scope").fill(
        "Priced zone traffic during the published reporting period only.",
      );
      await userPage.getByLabel("Argument summary").fill(
        "The measured decline supports the position while boundary traffic narrows its scope.",
      );

      await userPage.getByLabel("Support source URL").fill(captureFixtures[0].url);
      await userPage.getByRole("button", { name: "Capture support source" }).click();
      await expect(userPage.getByTestId("dossier-support-artifact")).toContainText(
        "Parallax deterministic CI fixture",
      );
      await useWholeCapturedPassage(userPage, "support");
      await userPage.getByLabel("Support source exact excerpt locator").fill(
        "CI fixture, full normalized text",
      );
      await userPage.getByLabel("Support source passage label").selectOption(
        "supports_claim",
      );
      await userPage.getByLabel("Support source passage rationale").fill(
        "The exact measured-zone passage directly reports the bounded observation.",
      );

      await userPage.getByLabel("Counter source URL").fill(captureFixtures[1].url);
      await userPage.getByRole("button", { name: "Capture counter source" }).click();
      await expect(userPage.getByTestId("dossier-counter-artifact")).toContainText(
        "Parallax deterministic CI fixture",
      );
      await useWholeCapturedPassage(userPage, "counter");
      await userPage.getByLabel("Counter source exact excerpt locator").fill(
        "CI fixture, full normalized text",
      );
      await userPage.getByLabel("Counter source passage label").selectOption(
        "does_not_support_claim",
      );
      await userPage.getByLabel("Counter source passage rationale").fill(
        "The boundary-road passage limits geographic scope without refuting the zone measure.",
      );

      expect(capturedUrls).toEqual(new Set(captureFixtures.map((item) => item.url)));
      const submit = userPage.getByRole("button", { name: "Submit evidence dossier" });
      await expect(submit).toBeEnabled();
      await submit.click();
      await expect(userPage.getByRole("heading", {
        name: "Evidence dossier sent for independent review",
      })).toBeVisible();
      await expect(userPage.getByRole("status")).toContainText(
        "Nothing was published or marked true",
      );
    });

    await test.step("reviewer approves the dossier but cannot prepare it", async () => {
      await signIn(reviewerPage, "reviewer@example.test");
      await reviewerPage.goto("/review");
      const dossier = reviewerPage.locator("article.dossier-card").filter({
        hasText: CLAIM_TEXT,
      });
      await expect(dossier).toBeVisible();
      await dossier.getByLabel("Dossier review rationale").fill(
        "Both exact passages, hashes, scope, and relation labels are inspectable.",
      );
      await dossier.getByRole("button", { name: "Approve dossier" }).click();
      await expect(reviewerPage.getByRole("status")).toContainText(
        "Dossier decision recorded: approve.",
      );

      const accepted = reviewerPage.locator("article.dossier-card").filter({
        hasText: CLAIM_TEXT,
      });
      await expect(accepted.getByRole("button", {
        name: "Prepare draft revision",
      })).toBeDisabled();
      await expect(accepted).toContainText("Admin role required");
    });

    let revisionId = "";
    await test.step("admin prepares a draft and is refused self-approval", async () => {
      await signIn(adminPage, "admin@example.test");
      await adminPage.goto("/review");
      const dossier = adminPage.locator("article.dossier-card").filter({
        hasText: CLAIM_TEXT,
      });
      await dossier.getByRole("button", { name: "Prepare draft revision" }).click();
      const status = adminPage.getByRole("status");
      await expect(status).toContainText("Nothing was published.");
      const statusText = await status.textContent();
      revisionId = statusText?.match(/Draft revision prepared:\s+(\S+)/)?.[1] ?? "";
      expect(revisionId).not.toBe("");

      await anonymousPage.goto("/debates/congestion-pricing");
      await expect(anonymousPage.getByText(CLAIM_TEXT, { exact: true })).toHaveCount(0);

      const revision = adminPage.locator("article.rcard").filter({ hasText: revisionId });
      await revision.getByRole("button", { name: /Inspect draft/i }).click();
      await expect(revision.getByRole("region", {
        name: "Complete structured draft",
      })).toBeVisible();
      await revision.getByLabel("Decision rationale").fill(
        "Attempted preparer self-review must be rejected by the backend.",
      );
      await revision.getByRole("button", { name: "Approve", exact: true }).click();
      await expect(adminPage.getByRole("alert")).toContainText(
        "draft preparers and modifiers cannot approve their own revision",
      );
    });

    await test.step("independent reviewer approves the exact prepared revision", async () => {
      await reviewerPage.goto("/review");
      const revision = reviewerPage.locator("article.rcard").filter({ hasText: revisionId });
      await expect(revision).toBeVisible();
      await revision.getByRole("button", { name: /Inspect draft/i }).click();
      await expect(revision.getByRole("region", {
        name: "Complete structured draft",
      })).toBeVisible();
      await revision.getByLabel("Decision rationale").fill(
        "The inspected change set matches the bounded dossier and both exact sources.",
      );
      await revision.getByRole("button", { name: "Approve", exact: true }).click();
      await expect(reviewerPage.getByRole("status")).toContainText(
        "Decision recorded",
      );
      await expect(revision.getByRole("button", { name: "Publish" })).toBeDisabled();
    });

    await test.step("independent admin publishes and anonymous readers inspect EN/FR", async () => {
      await adminPage.goto("/review");
      const revision = adminPage.locator("article.rcard").filter({ hasText: revisionId });
      const publish = revision.getByRole("button", { name: "Publish" });
      await expect(publish).toBeEnabled();
      await publish.click();
      await expect(adminPage.getByRole("status")).toContainText(
        "Published: /debates/congestion-pricing.",
      );

      await anonymousPage.goto("/debates/congestion-pricing");
      const publicDossier = anonymousPage.locator("article.dossier-card").filter({
        hasText: CLAIM_TEXT,
      });
      await expect(publicDossier).toBeVisible();
      await expect(publicDossier).toContainText(SUPPORT_TEXT);
      await expect(publicDossier).toContainText(COUNTER_TEXT);
      await expect(publicDossier).toContainText("sha256:");
      await expect(publicDossier).not.toContainText("established");
      await expect(anonymousPage.getByText(
        "Reviewed means the structured dossier and its revision passed the published checks. It is not a truth verdict, completeness guarantee, or confidence score.",
      )).toBeVisible();
      await expect(publicDossier.getByRole("button", {
        name: "Challenge this dossier",
      })).toBeVisible();

      await anonymousPage.goto("/fr/debates/congestion-pricing");
      await expect(anonymousPage.getByText(CLAIM_TEXT, { exact: true })).toBeVisible();
      await expect(anonymousPage.getByText(
        "« Relu » signifie que le dossier structuré et sa révision ont franchi les contrôles publiés. Ce n’est ni un verdict de vérité, ni une garantie d’exhaustivité, ni un score de confiance.",
      )).toBeVisible();
    });

    await test.step("signed-in user can open the structured public challenge", async () => {
      await userPage.goto("/debates/congestion-pricing");
      const publicDossier = userPage.locator("article.dossier-card").filter({
        hasText: CLAIM_TEXT,
      });
      await publicDossier.getByRole("button", {
        name: "Challenge this dossier",
      }).click();
      await expect(userPage.getByRole("heading", {
        name: "Challenge with a reviewed evidence dossier",
      })).toBeVisible();
      await expect(userPage.getByLabel("Claim text")).toHaveValue(CLAIM_TEXT);
      await expect(userPage.getByText(
        "Contesting reviewed evidence link:",
      )).toBeVisible();
    });
  } finally {
    await Promise.all([
      userContext.close(),
      reviewerContext.close(),
      adminContext.close(),
      anonymousContext.close(),
    ]);
  }
});

test("the harness never points service credentials at a hosted project", async () => {
  expect(new URL(supabaseUrl).hostname).toMatch(/^(127\.0\.0\.1|localhost|\[::1\])$/);
  expect(supabaseServiceRoleKey).not.toBe(supabaseAnonKey);
});
