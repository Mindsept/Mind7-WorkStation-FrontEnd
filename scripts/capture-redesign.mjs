import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts/redesign", { recursive: true });
const browser = await chromium.launch();
for (const [label, width, height] of [
  ["desktop", 1440, 1000],
  ["tablet", 768, 1024],
  ["mobile", 390, 900],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  for (const [name, path] of [
    ["projects", "/projects"],
    ["project", "/projects/00000000-0000-4000-8000-000000000010/documentation"],
    ["croissantage", "/croissantage"],
  ]) {
    await page.goto(`http://127.0.0.1:5174${path}`);
    await page.locator("h1").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `artifacts/redesign/${name}-${label}.png`,
      fullPage: true,
    });
  }
  await page.getByLabel("View as").selectOption("signed-out");
  await page.getByRole("heading", { name: "Work Station" }).waitFor();
  await page.screenshot({
    path: `artifacts/redesign/login-${label}.png`,
    fullPage: true,
  });
  await page.getByLabel("View as").selectOption("expired");
  await page
    .getByRole("heading", { name: "Your session has expired" })
    .waitFor();
  await page.screenshot({
    path: `artifacts/redesign/expired-${label}.png`,
    fullPage: true,
  });
  await page.close();
}
await browser.close();
console.log("Captured 15 redesigned desktop, tablet, mobile views.");
