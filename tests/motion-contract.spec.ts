import { checkFluidButton, assertNoOverflow } from "./fluid-button-checks";
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ viewport: { width: 1440, height: 900 }, video: "on" });
const pid = "10000000-0000-4000-8000-000000000001";
const uid = "30000000-0000-4000-8000-000000000001";
const fid = "40000000-0000-4000-8000-000000000001";
const stamp = "2026-11-01T09:00:00Z";
const pageOf = (items: unknown[]) => ({
  items,
  total: items.length,
  limit: 100,
  offset: 0,
});
const project = {
  id: pid,
  title: "Knowledge atelier",
  description: "Source files, decisions and documentation for the team.",
  creator_id: uid,
  created_at: stamp,
  updated_at: stamp,
};

async function fixture(page: Page) {
  const writes: string[] = [];
  const files = [
    {
      id: "20000000-0000-4000-8000-000000000001",
      project_id: pid,
      title: "Plan",
      filename: "plan.md",
      original_filename: "plan.md",
      folder_id: fid,
      resource_type: "markdown",
      content_type: "text/markdown",
      byte_size: 25,
      sha256: "test",
      uploader_id: uid,
      created_at: stamp,
      updated_at: stamp,
    },
  ];
  let release: (() => void) | undefined;
  let hold = false,
    exportFailure = true,
    uploadFailure = true;
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname.replace("/api/v1", "");
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, json: body });
    if (path === "/auth/session")
      return json({
        user: {
          id: uid,
          display_name: "Avery Laurent",
          email: "avery@example.com",
          role: "member",
          can_manage_attendance: true,
        },
        csrf_token: "motion-csrf",
      });
    if (path === "/members")
      return json(
        pageOf([
          {
            id: uid,
            display_name: "Avery Laurent",
            email: "avery@example.com",
            active: true,
            created_at: stamp,
            updated_at: stamp,
          },
        ]),
      );
    if (path === "/projects") return json(pageOf([project]));
    if (path === `/projects/${pid}`) return json(project);
    if (path.endsWith("/documentation"))
      return json({
        id: fid,
        project_id: pid,
        overview_markdown: "# Project overview",
        created_at: stamp,
        updated_at: stamp,
      });
    if (path.endsWith("/links")) return json(pageOf([]));
    if (path.endsWith("/folders"))
      return json(
        pageOf([
          {
            id: fid,
            project_id: pid,
            name: "Research",
            parent_id: null,
            created_at: stamp,
            updated_at: stamp,
          },
          {
            id: "40000000-0000-4000-8000-000000000002",
            project_id: pid,
            name: "Empty folder",
            parent_id: null,
            created_at: stamp,
            updated_at: stamp,
          },
        ]),
      );
    if (path.endsWith("/context-export")) {
      writes.push("export");
      if (hold)
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      if (exportFailure) {
        exportFailure = false;
        return json(
          {
            error: {
              code: "export_failed",
              message: "Archive service unavailable. Try again.",
            },
          },
          503,
        );
      }
      return route.fulfill({
        contentType: "application/zip",
        body: Buffer.from(
          "504b0506000000000000000000000000000000000000",
          "hex",
        ),
      });
    }
    if (path.endsWith("/resources") && req.method() === "POST") {
      const body = req.postData() || "",
        name = /filename="([^"]+)"/.exec(body)?.[1] || "unknown.md";
      writes.push(name);
      expect(req.headers()["x-csrf-token"]).toBe("motion-csrf");
      expect(body).toContain(fid);
      if (hold)
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      if (name === "retry.md" && uploadFailure) {
        uploadFailure = false;
        return json(
          {
            error: {
              code: "temporary_error",
              message: "Temporary upload failure",
            },
          },
          503,
        );
      }
      const file = {
        ...files[0],
        id: crypto.randomUUID(),
        title: name,
        filename: name,
        original_filename: name,
      };
      files.push(file);
      return json(file, 201);
    }
    if (path.endsWith("/resources")) return json(pageOf(files));
    return json({ error: { code: "not_found", message: path } }, 404);
  });
  return {
    writes,
    block: () => {
      hold = true;
    },
    release: () => {
      hold = false;
      release?.();
    },
    waiting: () => !!release,
  };
}

for (const width of [1440, 768, 390]) {
  test(`export notch compact geometry, tab spacing and error/retry ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({
      reducedMotion: width === 390 ? "reduce" : "no-preference",
    });
    const f = await fixture(page);
    await page.goto(`/projects/${pid}/documentation`);
    const button = page.getByRole("button", {
      name: "Extract context",
      exact: true,
    });
    await expect(button).toBeVisible();
    await page
      .locator(".export-panel")
      .evaluate((el) =>
        window.scrollTo(
          0,
          window.scrollY + el.getBoundingClientRect().top - 200,
        ),
      );
    const before = await button.boundingBox();
    const slot = await page.locator(".fluid-action-top").boundingBox();
    expect(Math.abs(slot!.width - before!.width)).toBeLessThan(1);
    expect(Math.abs(slot!.height - before!.height)).toBeLessThan(1);
    const tabs = await page.locator(".hub-views").boundingBox();
    const files = await page.locator(".file-explorer").boundingBox();
    expect(files!.y - tabs!.y - tabs!.height).toBe(16);

    f.block();
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(page.locator('[data-fluid-state="pending"]')).toBeVisible();
    await expect(button.locator(".action-loader")).toBeVisible();
    await button.press("Enter");
    await button.click({ force: true });
    expect(f.writes).toEqual(["export"]);
    await expect
      .poll(async () =>
        Math.abs((await button.boundingBox())!.width - before!.width),
      )
      .toBeLessThan(2);
    await expect
      .poll(async () =>
        Math.abs((await button.boundingBox())!.height - before!.height),
      )
      .toBeLessThan(2);
    await expect(button).toBeFocused();
    const busy = await button.boundingBox();
    expect(Math.abs(busy!.x - before!.x)).toBeLessThan(1);
    expect(Math.abs(busy!.y - before!.y)).toBeLessThan(1);
    const assertNoStatusOverlap = async () => {
      const geometry = await page.evaluate(() => {
        const detail = document
          .querySelector(".fluid-action-detail")!
          .getBoundingClientRect();
        const panel = document
          .querySelector(".export-panel")!
          .getBoundingClientRect();
        const tabs = document
          .querySelector(".hub-views")!
          .getBoundingClientRect();
        return {
          inside:
            detail.bottom <= panel.bottom &&
            detail.left >= panel.left &&
            detail.right <= panel.right,
          gap: tabs.top - detail.bottom,
        };
      });
      expect(geometry.inside).toBe(true);
      expect(geometry.gap).toBeGreaterThanOrEqual(16);
      await expect(
        page.getByRole("button", { name: "Files", exact: true }),
      ).toBeInViewport();
    };

    await expect(page.locator(".fluid-action-detail")).toHaveCSS(
      "opacity",
      "1",
    );
    await assertNoStatusOverlap();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);

    f.release();
    await expect(page.getByRole("alert")).toContainText(
      "Archive service unavailable",
    );
    await assertNoStatusOverlap();
    await checkFluidButton(button, false, before);
    await expect(button.locator(".action-pending")).toHaveCount(0);

    const downloaded = page.waitForEvent("download");
    await button.click();
    await downloaded;
    await expect(page.locator('[data-fluid-state="success"]')).toBeVisible();
    expect(f.writes).toEqual(["export", "export"]);
    await assertNoStatusOverlap();
    await page.getByRole("button", { name: "Dismiss export status" }).click();
    await expect(button).toBeFocused();
    await expect(page.locator('[data-fluid-state="idle"]')).toBeVisible();
    await expect(page.locator(".fluid-action-detail")).toHaveCount(0);
    await page.getByRole("button", { name: "Overview", exact: true }).click();
    await expect(page.locator(".panel.overview")).toBeVisible();
    const overviewGap = await page.evaluate(() => {
      const tabs = document
        .querySelector(".hub-views")!
        .getBoundingClientRect();
      const panel = document
        .querySelector(".panel.overview")!
        .getBoundingClientRect();
      return panel.top - tabs.bottom;
    });
    expect(overviewGap).toBe(16);
    await page
      .locator(".hub-views")
      .evaluate((el) =>
        window.scrollTo(
          0,
          window.scrollY + el.getBoundingClientRect().top - 200,
        ),
      );
  });
}

for (const width of [1440, 390]) {
  test(`upload append, partial failure, per-file retry and duplicate guard preserve successful files ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({
      reducedMotion: width === 390 ? "reduce" : "no-preference",
    });
    const f = await fixture(page);
    await page.goto(`/projects/${pid}?folder=${fid}`);
    await page.getByRole("button", { name: "Upload", exact: true }).click();
    const dialog = page.getByRole("dialog"),
      picker = dialog.getByLabel("Resource file", { exact: true });
    const file = (name: string) => ({
      name,
      mimeType: "text/markdown",
      buffer: Buffer.from("# Documentation"),
    });
    await picker.setInputFiles(file("first.md"));
    await picker.setInputFiles(file("retry.md"));
    await expect(dialog.locator(".upload-results li")).toHaveCount(2);
    f.block();
    const submit = dialog.getByRole("button", {
      name: "Upload files",
      exact: true,
    });
    await checkFluidButton(submit, false);
    const target = await submit.boundingBox();
    await assertNoOverflow(page);
    await submit.click();
    await expect(submit).toHaveAttribute("aria-busy", "true");
    await checkFluidButton(submit, true, target);
    await expect(submit).toBeFocused();
    await assertNoOverflow(page);
    await expect.poll(f.waiting).toBeTruthy();
    await submit.press("Enter");
    expect(f.writes).toEqual(["first.md"]);

    f.release();
    await expect(dialog.getByText("Temporary upload failure")).toBeVisible();
    await expect(dialog.locator('[data-upload-state="done"]')).toHaveCount(1);
    await checkFluidButton(submit, false);
    await assertNoOverflow(page);
    await dialog
      .getByRole("button", { name: "Retry retry.md", exact: true })
      .click();
    await expect(dialog.locator('[data-upload-state="done"]')).toHaveCount(2);
    expect(f.writes).toEqual(["first.md", "retry.md", "retry.md"]);
    await picker.setInputFiles(file("last.md"));
    await submit.click();
    await expect(dialog.locator('[data-upload-state="done"]')).toHaveCount(3);
    expect(f.writes).toEqual(["first.md", "retry.md", "retry.md", "last.md"]);
    await checkFluidButton(submit, false);
    await assertNoOverflow(page);
    await dialog.getByRole("button", { name: "Done", exact: true }).click();
    await expect(page.getByText("last.md", { exact: true })).toBeVisible();
  });
}

test("static cards and badge motion remain inside fixed targets; keyboard and reduced motion stay usable", async ({
  page,
}) => {
  await fixture(page);
  await page.goto("/projects");
  const card = page.locator(".illustrated-card").first();
  const link = page.getByRole("link", { name: /Knowledge atelier/ });
  const stable = await link.boundingBox();
  await card.hover({ position: { x: 70, y: 45 } });
  await expect(card.locator(".illustrated-surface")).toHaveCSS(
    "transform",
    "none",
  );
  await expect
    .poll(() =>
      card
        .locator(".illustrated-surface")
        .evaluate((el) => getComputedStyle(el).transform),
    )
    .toBe("none");
  expect(await link.boundingBox()).toEqual(stable);

  await link.press("Enter");
  const folder = page.locator(".explorer-row").filter({ hasText: "Research" });
  await folder.hover();
  await expect(folder.locator(".images-badge")).toHaveAttribute(
    "data-expanded",
    "true",
  );
  await expect(
    page
      .locator(".explorer-row")
      .filter({ hasText: "Empty folder" })
      .locator(".images-badge-paper"),
  ).toHaveCount(0);

  const bounds = await folder.boundingBox();
  for (const paper of await folder.locator(".images-badge-paper").all()) {
    const box = await paper.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(bounds!.y);
    expect(box!.y + box!.height).toBeLessThanOrEqual(
      bounds!.y + bounds!.height,
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await folder.hover();
  await expect(folder.locator(".images-badge")).toHaveAttribute(
    "data-expanded",
    "false",
  );
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.goto("/projects");
  await card.hover();
  await expect(card.locator(".illustrated-surface")).toHaveCSS(
    "transform",
    "none",
  );
});

for (const width of [1440, 390]) {
  test(`create pending state rejects duplicate submission and retains draft on failure ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({
      reducedMotion: width === 390 ? "reduce" : "no-preference",
    });
    await fixture(page);
    let count = 0;
    let release: (() => void) | undefined;
    await page.route("**/api/v1/projects", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      count++;
      if (count === 1) {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return route.fulfill({
          status: 503,
          json: {
            error: {
              code: "unavailable",
              message: "Please retry your project",
            },
          },
        });
      }
      return route.fulfill({
        status: 201,
        json: { ...project, ...route.request().postDataJSON() },
      });
    });
    await page.goto("/projects");
    await page
      .getByRole("button", { name: "New project", exact: true })
      .click();
    await page
      .getByLabel("Project title", { exact: true })
      .fill("Retained project draft");
    const submit = page.getByRole("button", {
      name: "Create project",
      exact: true,
    });
    await checkFluidButton(submit, false);
    const target = await submit.boundingBox();
    await assertNoOverflow(page);
    await submit.click();
    await expect(submit).toHaveAttribute("aria-busy", "true");
    await checkFluidButton(submit, true, target);
    await expect(submit).toBeFocused();
    await assertNoOverflow(page);
    await submit.press("Enter");
    await submit.click({ force: true });
    expect(count).toBe(1);
    release!();
    await expect(page.getByRole("alert")).toContainText(
      "Please retry your project",
    );
    await expect(page.getByLabel("Project title", { exact: true })).toHaveValue(
      "Retained project draft",
    );
    await checkFluidButton(submit, false);
    await assertNoOverflow(page);
    await submit.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await assertNoOverflow(page);
    expect(count).toBe(2);
  });
}

test("coarse touch input keeps cards and folders still and navigation available", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  try {
    await fixture(page);
    await page.goto("http://127.0.0.1:4173/projects");
    const card = page.locator(".illustrated-card").first();
    await expect(card.locator(".illustrated-surface")).toHaveCSS(
      "transform",
      "none",
    );
    await page.getByRole("link", { name: /Knowledge atelier/ }).tap();
    const row = page.locator(".explorer-row").filter({ hasText: "Research" });
    await expect(row.locator(".images-badge")).toHaveAttribute(
      "data-expanded",
      "false",
    );
    await row
      .getByRole("button", { name: /Research/ })
      .first()
      .tap();
    await expect(page).toHaveURL(new RegExp(`folder=${fid}`));
    await page.getByRole("button", { name: "Upload", exact: true }).tap();
    await expect(
      page.getByLabel("Resource file", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    await context.close();
  }
});

for (const width of [1440, 390]) {
  test(`primary save morph preserves form and target through failure and retry ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({
      reducedMotion: width === 390 ? "reduce" : "no-preference",
    });
    await fixture(page);
    let count = 0;
    let release: (() => void) | undefined;
    await page.route(`**/api/v1/projects/${pid}`, async (route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      count++;
      if (count === 1) {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return route.fulfill({
          status: 503,
          json: {
            error: {
              code: "unavailable",
              message: "Please retry your changes",
            },
          },
        });
      }
      return route.fulfill({
        json: { ...project, ...route.request().postDataJSON() },
      });
    });
    await page.goto(`/projects/${pid}`);
    await page
      .getByRole("button", { name: "Edit project", exact: true })
      .click();
    await page
      .getByLabel("Project title", { exact: true })
      .fill("Saved atelier");
    const save = page.getByRole("button", {
      name: "Save changes",
      exact: true,
    });
    await checkFluidButton(save, false);
    await assertNoOverflow(page);
    const target = await save.boundingBox();
    await save.click();
    await expect(save).toHaveAttribute("aria-busy", "true");
    await checkFluidButton(save, true, target);
    await expect(save).toBeFocused();
    await assertNoOverflow(page);
    await save.press("Enter");
    await save.click({ force: true });
    expect(count).toBe(1);
    release!();
    await expect(page.getByRole("alert")).toContainText(
      "Please retry your changes",
    );
    await expect(page.getByLabel("Project title", { exact: true })).toHaveValue(
      "Saved atelier",
    );
    await checkFluidButton(save, false);
    await assertNoOverflow(page);
    await save.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(count).toBe(2);
    await assertNoOverflow(page);
  });
}
