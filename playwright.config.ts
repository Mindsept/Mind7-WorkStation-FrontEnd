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
      name: "mock-workflows",
      testMatch: "workflows.spec.ts",
      use: { baseURL: "http://127.0.0.1:5174" },
    },
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
  ],
  webServer: [
    {
      command: "npm run dev:mock -- --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run preview -- --port 4173 --strictPort",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
