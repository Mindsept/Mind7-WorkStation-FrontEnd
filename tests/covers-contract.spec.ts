import { test, expect, type Page } from "@playwright/test";
import {
  COVER_KEYS,
  PROJECT_COVERS,
  projectCover,
} from "../src/api/project-covers";
import fs from "node:fs/promises";
const uid = "30000000-0000-4000-8000-000000000001";
const stamp = "2026-11-01T09:00:00Z";
const projects = COVER_KEYS.map((cover_key, i) => ({
  id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  title: `${cover_key[0].toUpperCase() + cover_key.slice(1)} workspace`,
  description: "Cover catalog preview using explicit test records.",
  cover_key,
  creator_id: uid,
  created_at: stamp,
  updated_at: stamp,
}));
const collection = (items: unknown[]) => ({
  items,
  total: items.length,
  limit: 100,
  offset: 0,
});
async function fixture(page: Page) {
  let reversed = false;
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/v1", "");
    if (path === "/auth/session")
      return route.fulfill({
        json: {
          user: {
            id: uid,
            display_name: "Cover Reviewer",
            email: "review@example.com",
            role: "member",
            can_manage_attendance: true,
          },
          csrf_token: "cover-csrf",
        },
      });
    if (path === "/members")
      return route.fulfill({
        json: collection([
          {
            id: uid,
            display_name: "Cover Reviewer",
            email: "review@example.com",
            active: true,
            created_at: stamp,
            updated_at: stamp,
          },
        ]),
      });
    if (path === "/projects")
      return route.fulfill({
        json: collection(reversed ? [...projects].reverse() : projects),
      });
    if (path === "/attendance/summary")
      return route.fulfill({
        json: collection([{ member_id: uid, late_count: 0, absence_count: 0 }]),
      });
    const project = projects.find((p) => path === `/projects/${p.id}`);
    if (project) return route.fulfill({ json: project });
    return route.fulfill({ json: collection([]) });
  });
  return () => {
    reversed = true;
  };
}
for (const width of [1440, 768, 390]) {
  test(`Croissantage primary decoration stays within native control and panels remain static ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await fixture(page);
    await page.goto("/croissantage");
    const button = page.getByRole("button", {
      name: "Record attendance",
      exact: true,
    });
    await expect(button).toBeVisible();
    const b = (await button.boundingBox())!;
    const surface = (await button.locator(".action-surface").boundingBox())!;
    expect(b.width).toBeLessThan(220);
    expect(b.height).toBeGreaterThanOrEqual(40);
    expect(b.height).toBeLessThanOrEqual(44);
    expect(surface.x).toBeGreaterThanOrEqual(b.x);
    expect(surface.y).toBeGreaterThanOrEqual(b.y);
    expect(surface.width).toBeLessThanOrEqual(b.width);
    expect(surface.height).toBeLessThanOrEqual(b.height);
    for (const selector of [
      ".attendance-illustration",
      ".attendance-summary",
      ".date-filters",
      ".attendance-table",
    ]) {
      const panel = page.locator(selector);
      if (!(await panel.count())) continue;
      const box = await panel.boundingBox();
      await panel.hover();
      expect(await panel.boundingBox()).toEqual(box);
      await expect(panel).toHaveCSS("transform", "none");
    }
    await button.focus();
    await expect(button).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(button).toBeFocused();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(button).toHaveCSS("position", "relative");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
test("catalog keys survive reorder and detail navigation; unknown keys use a stable local fallback", async ({
  page,
}) => {
  const reverse = await fixture(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/projects");
  for (const p of projects) {
    const link = page.locator(`a.project-card[href="/projects/${p.id}"]`);
    await expect(link.locator("img")).toHaveAttribute(
      "src",
      PROJECT_COVERS[p.cover_key],
    );
    await expect(link.locator(".illustrated-surface img")).toHaveJSProperty(
      "naturalWidth",
      1200,
    );
    await link.scrollIntoViewIfNeeded();
    const before = await link.boundingBox();
    await link.hover({ position: { x: 40, y: 30 } });
    expect(await link.boundingBox()).toEqual(before);
    await expect(link).toHaveCSS("transform", "none");
    await expect(link.locator(".illustrated-surface")).toHaveCSS(
      "transform",
      "none",
    );
    await expect(link.locator(".illustrated-surface img")).toHaveCSS(
      "transform",
      "none",
    );
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(() => document.fonts.ready);
  await fs.mkdir("artifacts/covers-v6", { recursive: true });
  await page.screenshot({
    path: "artifacts/covers-v6/project-catalog-desktop.png",
    fullPage: true,
  });
  reverse();
  await page.reload();
  for (const p of projects)
    await expect(
      page.locator(`a.project-card[href="/projects/${p.id}"] img`),
    ).toHaveAttribute("src", PROJECT_COVERS[p.cover_key]);
  const selected = projects[2];
  await page
    .locator(`a.project-card[href="/projects/${selected.id}"]`)
    .press("Enter");
  await expect(page.locator(".project-cover-art")).toHaveAttribute(
    "src",
    PROJECT_COVERS[selected.cover_key],
  );
  const old = { id: projects[0].id, cover_key: "not-a-cover" };
  expect(projectCover(old)).toBe(projectCover({ id: old.id }));
  expect(projectCover(old)).toBe(PROJECT_COVERS.atelier);
});
