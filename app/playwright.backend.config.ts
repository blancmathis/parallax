import { defineConfig, devices } from "@playwright/test";

const port = 5173;
const baseURL = process.env.PLAYWRIGHT_BACKEND_BASE_URL ??
  `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e/backend",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["line"],
    ["html", { open: "never", outputFolder: "playwright-report/backend" }],
  ],
  outputDir: "test-results/backend",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BACKEND_BASE_URL
    ? undefined
    : {
        command: `npm run preview -- --host 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
  projects: [
    {
      name: "backend-desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
