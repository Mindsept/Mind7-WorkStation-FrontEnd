import { chromium, expect } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
await mkdir("artifacts/interactions-v5", { recursive: true });
const browser = await chromium.launch();
const id = "00000000-0000-4000-8000-000000000010";
const checks = [];
for (const [label, width, height, dpr] of [
  ["desktop", 1440, 900, 1],
  ["tablet", 768, 1024, 1],
  ["mobile", 390, 900, 1],
  ["retina", 1440, 900, 2],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: dpr,
    reducedMotion: "reduce",
  });
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
        path: `artifacts/interactions-v5/${name}-${label}-${position}.png`,
      });
    }
    checks.push({
      page: name,
      viewport: label,
      centerError: box.x + box.width / 2 - width / 2,
      overflow: false,
    });
  }
  if (label === "desktop" || label === "mobile") {
    await page.goto("http://127.0.0.1:5174/?preview=signed-out");
    await page.getByRole("heading", { name: "Work Station" }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const after = `artifacts/interactions-v5/login-after-${label}.png`;
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
  await page.close();
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
  devicePixelRatioVerified: 2,
  backgroundUpscalingAt2x: false,
});
await writeFile(
  "artifacts/interactions-v5/verification.json",
  JSON.stringify(checks, null, 2),
);
await browser.close();
console.log(
  "Centered layouts, 2x captures, zero overflow, unchanged login pixels and source hashes verified.",
);
