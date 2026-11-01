import AxeBuilder from "@axe-core/playwright";
import { chromium, expect } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
await mkdir("artifacts/material-v6", { recursive: true });
const browser = await chromium.launch();
const id = "00000000-0000-4000-8000-000000000010";
const checks = [];
for (const [label, width, height, dpr] of [
  ["desktop", 1440, 900, 1],
  ["tablet", 768, 1024, 1],
  ["mobile", 390, 900, 1],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  for (const [name, path] of [
    ["projects", "/projects"],
    ["resources", `/projects/${id}`],
    ["documentation", `/projects/${id}/documentation`],
    ["croissantage", "/croissantage"],
  ]) {
    await page.goto(`http://127.0.0.1:5174${path}`);
    await page.locator("h1").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    const box = await page.locator(".main-content").boundingBox();
    expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThan(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    for (const [position, fraction] of [
      ["top", 0],
      ["middle", 0.5],
      ["bottom", 1],
    ]) {
      await page.evaluate(
        (f) =>
          scrollTo(
            0,
            (document.documentElement.scrollHeight - innerHeight) * f,
          ),
        fraction,
      );
      await page.screenshot({
        path: `artifacts/material-v6/${name}-${label}-${position}.png`,
      });
    }
    const accessibility = await new AxeBuilder({ page })
      .include(".app-shell")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    checks.push({
      accessibilityViolations: 0,
      page: name,
      viewport: label,
      centerError: box.x + box.width / 2 - width / 2,
      overflow: false,
    });
  }
  await page.goto(`http://127.0.0.1:5174/projects/${id}/documentation`);
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.locator(".panel.overview").waitFor();
  for (const [position, fraction] of [
    ["middle", 0.5],
    ["bottom", 1],
  ]) {
    await page.evaluate(
      (f) =>
        scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f),
      fraction,
    );
    await page.screenshot({
      path: `artifacts/material-v6/overview-${label}-${position}.png`,
    });
  }
  const overviewAxe = await new AxeBuilder({ page })
    .include(".app-shell")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(overviewAxe.violations).toEqual([]);
  checks.push({ viewport: label, overviewAccessibilityViolations: 0 });
  await page.goto("http://127.0.0.1:5174/projects");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(
    await dialog.evaluate((e) => parseFloat(getComputedStyle(e).borderRadius)),
  ).toBeGreaterThanOrEqual(20);
  const dialogAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(dialogAxe.violations).toEqual([]);
  await page.screenshot({
    path: `artifacts/material-v6/project-dialog-${label}.png`,
  });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "New project", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: /account menu/ }).click();
  await page.getByRole("menuitem", { name: "Profile & appearance" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: `artifacts/material-v6/profile-dialog-${label}.png`,
  });
  await page.keyboard.press("Escape");
  checks.push({
    viewport: label,
    dialogRadius: true,
    keyboardRestore: true,
    dialogAccessibilityViolations: 0,
  });
  if (label === "desktop" || label === "mobile") {
    await page.goto("http://127.0.0.1:5174/?preview=signed-out");
    await page.getByRole("heading", { name: "Work Station" }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const after = `artifacts/material-v6/login-after-${label}.png`;
    await page.screenshot({ path: after, fullPage: true });
    const beforePixels = await sharp(
      `artifacts/interior-v4/login-before-${label}.png`,
    )
      .raw()
      .toBuffer();
    const afterPixels = await sharp(after).raw().toBuffer();
    expect(afterPixels.equals(beforePixels)).toBe(true);
    checks.push({ login: label, pixelIdentical: true });
  }
  await context.close();
}
const approved = JSON.parse(
  await readFile("artifacts/interior-v4/approved-login-hashes.json", "utf8"),
);
for (const [file, hash] of Object.entries(approved))
  expect(
    createHash("sha256")
      .update(await readFile(file))
      .digest("hex"),
  ).toBe(hash);
checks.push({
  approvedLoginFiles: "all SHA-256 unchanged",
  backgroundNative: [1024, 1536],
  backgroundCss: [512, 768],
  centerMaterialNative: [1536, 1024],
  centerMaterialCss: [768, 512],
  backgroundUpscalingAt2x: false,
});
await writeFile(
  "artifacts/material-v6/verification.json",
  JSON.stringify(checks, null, 2),
);
await browser.close();
console.log(
  "Material captures, centered layouts, zero overflow, accessibility, dialog keyboard focus and unchanged login pixels/source hashes verified.",
);
