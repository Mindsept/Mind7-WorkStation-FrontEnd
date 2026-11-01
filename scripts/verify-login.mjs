import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("artifacts/final-acceptance/auth", { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  baseURL: "http://localhost:5173",
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Work Station" }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/final-acceptance/auth/live-login.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Continue with Microsoft" }).click();
  await expect(page.getByRole("alert")).toContainText("not configured");
  await expect(
    page.getByRole("heading", { name: "Work Station" }),
  ).toBeFocused();
  expect(new URL(page.url()).searchParams.has("auth_error")).toBe(false);
  await page.screenshot({
    path: "artifacts/final-acceptance/auth/live-development-message.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Development administrator", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your projects" }),
  ).toBeVisible();
  const session = await (
    await context.request.get("/api/v1/auth/session")
  ).json();
  expect(session.user.role).toBe("admin");
  expect(session.user.can_manage_attendance).toBe(true);
  await page.goto("/?auth_error=not_whitelisted");
  await expect(
    page.getByRole("heading", { name: "Your projects" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.locator(".user-trigger").click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(
    page.getByRole("heading", { name: "Work Station" }),
  ).toBeVisible();
  expect((await context.request.get("/api/v1/auth/session")).status()).toBe(
    401,
  );
  await page.goto("/api/v1/auth/login?dev_user=admin");
  await expect(
    page.getByRole("heading", { name: "Your projects" }),
  ).toBeVisible();
  const active = (
    await (await context.request.get("/api/v1/auth/session")).json()
  ).csrf_token;
  expect(
    (
      await context.request.post("/api/v1/auth/logout", {
        headers: { "X-CSRF-Token": active },
      })
    ).status(),
  ).toBe(204);
  await page.getByRole("link", { name: "Croissantage", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your session has expired" }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/final-acceptance/auth/live-expired.png",
  });
  expect(errors).toEqual([]);
  await writeFile(
    "artifacts/final-acceptance/auth/live-login-check.json",
    JSON.stringify(
      {
        executed_at: new Date().toISOString(),
        mode: "Real backend development identity; not live Microsoft Entra",
        passed: [
          "Signed-out gate",
          "Microsoft normal link returns safe development notice",
          "Query cleanup and focus",
          "Explicit legacy development identity returns attendance capability",
          "Existing session wins over failed-sign-in hint",
          "UI logout and subsequent session 401",
          "Own server session revoked; next authenticated navigation reaches expiry UI",
          "No page errors",
        ],
      },
      null,
      2,
    ),
  );
  console.log("Live development auth: 8 checks passed; no live Entra claim.");
} finally {
  const response = await context.request.get("/api/v1/auth/session");
  if (response.ok()) {
    const session = await response.json();
    await context.request.post("/api/v1/auth/logout", {
      headers: {
        "X-CSRF-Token": session.csrf_token,
        Origin: "http://localhost:5173",
      },
    });
  }
  await browser.close();
}
