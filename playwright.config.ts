import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "phone",
      // Vera plays on a phone, one-handed, so that is the viewport under test.
      use: { ...devices["Pixel 7"] },
    },
  ],
  // Building and serving out/ means every test run also proves the static
  // export works exactly as it will when hosted.
  webServer: {
    command: `npm run build && npx serve out -l ${PORT} --no-clipboard`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
