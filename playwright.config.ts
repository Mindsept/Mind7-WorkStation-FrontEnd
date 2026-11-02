import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: [["list"]],
  use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    {
      name: "production-contract",
      testMatch: [
        "contract.spec.ts",
        "profile-contract.spec.ts",
        "motion-contract.spec.ts",
        "covers-contract.spec.ts",
      ],
      use: { baseURL: "http://127.0.0.1:4173" },
    },
    {
      name: "cross-origin-api",
      testMatch: "cross-origin.spec.ts",
      use: { baseURL: "http://127.0.0.1:4175" },
    },
  ],
  webServer: [
    {
      command: "npm run preview -- --port 4173 --strictPort",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: !process.env.CI,
    },
    {
      command:
        "npm run build -- --outDir dist-cross-origin && npm run preview -- --outDir dist-cross-origin --port 4175 --strictPort",
      env: { VITE_API_BASE: "http://127.0.0.1:4176/api/v1" },
      url: "http://127.0.0.1:4175",
      reuseExistingServer: false,
    },
  ],
});
