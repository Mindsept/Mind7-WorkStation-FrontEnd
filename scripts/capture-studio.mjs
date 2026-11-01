import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("artifacts/studio-v3", { recursive: true });
const browser = await chromium.launch();
const id = "00000000-0000-4000-8000-000000000010";
const records = [];
for (const [label, width, height] of [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 390, 900],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  for (const [name, path] of [
    ["projects", "/projects"],
    ["resources", `/projects/${id}`],
    ["documentation", `/projects/${id}/documentation`],
    ["croissantage", "/croissantage"],
  ]) {
    await page.goto(`http://127.0.0.1:5174${path}`);
    await page.locator("h1").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `artifacts/studio-v3/${name}-${label}-full.png`,
      fullPage: true,
    });
    for (const [position, fraction] of [
      ["top", 0],
      ["middle", 0.5],
      ["bottom", 1],
    ]) {
      await page.evaluate(
        (f) =>
          window.scrollTo(
            0,
            (document.documentElement.scrollHeight - window.innerHeight) * f,
          ),
        fraction,
      );
      await page.screenshot({
        path: `artifacts/studio-v3/${name}-${label}-${position}.png`,
      });
    }
  }
  await page.goto("http://127.0.0.1:5174/?preview=signed-out");
  await page.getByRole("heading", { name: "Work Station" }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `artifacts/studio-v3/login-${label}.png`,
    fullPage: true,
  });
  const screen = page.locator(".computer-screen");
  const frame = page.locator(".computer-frame");
  const sb = await screen.boundingBox(),
    fb = await frame.boundingBox();
  expect(sb.x).toBeGreaterThan(fb.x);
  expect(sb.x + sb.width).toBeLessThan(fb.x + fb.width);
  expect(sb.y).toBeGreaterThan(fb.y);
  expect(sb.y + sb.height).toBeLessThan(fb.y + fb.height * 0.8);
  const login = page.getByRole("link", { name: "Continue with Microsoft" });
  await login.focus();
  await expect(login).toBeFocused();
  await page.screenshot({
    path: `artifacts/studio-v3/login-${label}-focus.png`,
    fullPage: true,
  });
  if (width === 1440) {
    await page.locator(".studio-brand").focus();
    await page.mouse.move(10, 80);
    await page.waitForTimeout(950);

    const before = await screen.evaluate(
      (el) => getComputedStyle(el, "::before").backgroundPosition,
    );
    await page.mouse.move(sb.x + sb.width * 0.2, sb.y + sb.height * 0.2);
    await page.waitForTimeout(400);
    await page.screenshot({
      path: "artifacts/studio-v3/login-glare-during.png",
    });
    await page.waitForTimeout(600);
    const after = await screen.evaluate(
      (el) => getComputedStyle(el, "::before").backgroundPosition,
    );
    records.push({ check: "Glare on screen material", before, after });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await screen.evaluate((el) => getComputedStyle(el, "::before").display),
  ).toBe("none");
  await page.getByLabel("View as").selectOption("expired");
  await page
    .getByRole("heading", { name: "Your session has expired" })
    .waitFor();
  await page.screenshot({
    path: `artifacts/studio-v3/expired-${label}.png`,
    fullPage: true,
  });
  records.push({
    viewport: label,
    screenInsideFrame: true,
    reducedMotion: "Glare disabled",
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  });
  await page.close();
}
await writeFile(
  "artifacts/studio-v3/composition-checks.json",
  JSON.stringify(records, null, 2),
);
await browser.close();
console.log(
  "Captured final scene, focused login, states and all major portal scroll positions.",
);
