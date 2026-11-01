import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const phase = process.argv[2] || "after";
const browser = await chromium.launch();
const result = [];
for (const width of [1440, 768, 390]) {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
  });
  await page.goto("http://localhost:5174/croissantage");
  const button = page.getByRole("button", {
    name: "Record attendance",
    exact: true,
  });
  await button.waitFor();
  await page.evaluate(() => document.fonts.ready);
  result.push({
    width,
    button: await button.boundingBox(),
    surface: await button.locator(".action-surface").boundingBox(),
    position: await button.evaluate((e) => getComputedStyle(e).position),
  });
  await page.screenshot({
    path: `artifacts/covers-v6/attendance-${phase}-${width}.png`,
  });
  if (phase === "after") {
    await page.goto("http://localhost:5174/projects");
    await page.locator(".project-card").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `artifacts/covers-v6/projects-after-${width}.png`,
    });
  }
  await page.close();
}
await writeFile(
  `artifacts/covers-v6/layout-${phase}.json`,
  JSON.stringify(result, null, 2),
);
await browser.close();
console.log(result);
