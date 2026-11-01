import { expect, type Locator, type Page } from "@playwright/test";

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

export async function assertNoOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
