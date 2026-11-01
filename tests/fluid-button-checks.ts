import { expect, type Locator, type Page } from "@playwright/test";
import fs from "node:fs/promises";

export async function checkFluidButton(
  button: Locator,
  pending: boolean,
  box?: { x: number; y: number; width: number; height: number } | null,
) {
  await expect(button).toHaveClass(/fluid-primary/);
  await expect(button).toHaveAttribute(
    "data-action-state",
    pending ? "pending" : "idle",
  );
  const surface = button.locator(".action-surface");
  await expect
    .poll(async () => (await surface.boundingBox())!.width)
    .toBeCloseTo(pending ? 64 : (await button.boundingBox())!.width - 2, 0);
  if (box) {
    const current = (await button.boundingBox())!;
    for (const key of ["x", "y", "width", "height"] as const)
      expect(current[key]).toBeCloseTo(box[key], 1);
  }
}

export async function captureFluid(page: Page, name: string) {
  await fs.mkdir("artifacts/fluid-buttons-v5", { recursive: true });
  await page.screenshot({
    path: `artifacts/fluid-buttons-v5/${name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
