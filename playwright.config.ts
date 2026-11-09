import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    browserName: "chromium",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH,
      args: ["--no-sandbox"],
    },
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
    actionTimeout: 15000,
    navigationTimeout: 15000,
  },
  workers: 1,
  timeout: 120000,
  expect: { timeout: 15000 },
});
