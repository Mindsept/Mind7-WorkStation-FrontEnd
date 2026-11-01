import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const projectId = "00000000-0000-4000-8000-000000000010";
test("project CRUD, shared documentation, upload, rename, download and deletion", async ({
  page,
}) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByLabel("Project title").fill("Integration notebook");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A real interaction test");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Integration notebook", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit project", exact: true }).click();
  await page.getByLabel("Project title").fill("Updated notebook");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Updated notebook", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Documentation hub" }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Write an overview" }).click();
  await page
    .getByLabel("Overview Markdown")
    .fill(
      "# Decisions\n\n| Topic | Decision |\n| --- | --- |\n| Storage | Shared files |\n\n```ts\nconst shared = true\n```\n\n<script>window.pwned=true</script>\n\n[unsafe](javascript:alert(1))",
    );
  await page.getByRole("button", { name: "Save overview" }).click();
  await expect(page.getByRole("heading", { name: "Decisions" })).toBeVisible();
  await expect(page.locator(".markdown table")).toBeVisible();
  await expect(page.locator(".markdown script")).toHaveCount(0);
  await expect(page.locator('.markdown a[href^="javascript:"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Files", exact: true }).click();
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await page.getByLabel("Resource file").setInputFiles({
    name: "notes.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("# Shared notes\n\nSource collection test."),
  });
  await page.getByLabel("Resource title").fill("Shared notes");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Upload files", exact: true })
    .click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("link", { name: /^Shared notes notes.md/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Resources", exact: true }).click();
  await expect(
    page.getByRole("link", { name: /^Shared notes notes.md/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Rename Shared notes" }).click();
  await page.getByLabel("Title", { exact: true }).fill("Renamed notes");
  await page.getByRole("button", { name: "Save changes" }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Renamed notes" }).click();
  expect((await dl).suggestedFilename()).toBe("notes.md");
  await page.getByRole("link", { name: /^Renamed notes notes.md/ }).click();
  await expect(
    page.getByRole("heading", { name: "Shared notes", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to resources" }).click();
  await page.getByRole("button", { name: "Delete Renamed notes" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete resource" })
    .click();
  await expect(page.getByText("This folder is empty")).toBeVisible();
  await page
    .getByRole("button", { name: "Delete project", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Updated notebook", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete project", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your projects" }),
  ).toBeVisible();
  await expect(page.getByText("Updated notebook")).toHaveCount(0);
});
test("attendance filters, zero-event member, CRUD, duplicate validation and member permissions", async ({
  page,
}) => {
  await page.goto("/croissantage");
  await page.getByLabel("View as").selectOption("member");
  await expect(page.getByText("Sam Rivera")).toBeVisible();
  await page
    .getByRole("button", { name: "View history for Sam Rivera" })
    .click();
  await expect(page.getByText("A clear record")).toBeVisible();
  await page
    .getByRole("button", { name: "Record attendance", exact: true })
    .click();
  await page.getByLabel("Event date").fill("2026-10-30");
  await page.getByLabel("Minutes late").fill("12");
  await page.getByRole("button", { name: "Record event" }).click();
  await expect(page.getByText("Late arrival · 12 min")).toBeVisible();
  await page
    .getByRole("button", { name: "Record attendance", exact: true })
    .click();
  await page.getByLabel("Event date").fill("2026-10-30");
  await page.getByRole("button", { name: "Record event" }).click();
  await expect(page.getByRole("alert")).toContainText("already exists");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Edit event on 2026-10-30" }).click();
  await page.getByLabel("Event type").selectOption("absent");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".event-row")).toContainText("Absence");
  await expect(page.locator(".event-row")).not.toContainText("12 min");
  await page.getByLabel("From date").fill("2026-10-31");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("A clear record")).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete event on 2026-10-30" })
    .click();
  await page.getByRole("button", { name: "Delete event", exact: true }).click();
  await expect(page.getByText("A clear record")).toBeVisible();
  await page.getByLabel("View as").selectOption("member");
  await expect(
    page.getByRole("button", { name: "Record attendance", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Sam Rivera")).toBeVisible();
});
test("authentication states, search empty state, upload validation and explicit mock export failure", async ({
  page,
}) => {
  await page.goto("/projects");
  await page.getByRole("searchbox").fill("no-such-project");
  await expect(page.getByText("No matching projects")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.goto(`/projects/${projectId}/documentation`);
  await page.getByRole("button", { name: "Extract context" }).click();
  await expect(page.getByRole("alert")).toContainText("requires the backend");
  await page.getByRole("button", { name: "Files", exact: true }).click();
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await page.getByLabel("Resource file").setInputFiles({
    name: "bad.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("bad"),
  });
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "not supported",
  );
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Upload files", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  for (const [value, title] of [
    ["signed-out", "Work Station"],
    ["denied", "Access is restricted"],
    ["expired", "Your session has expired"],
  ]) {
    await page.getByLabel("View as").selectOption(value);
    await expect(
      page.getByRole("heading", { name: new RegExp(title) }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Continue with Microsoft" }),
    ).toHaveAttribute("href", "/api/v1/auth/login");
  }
});
for (const width of [390, 768, 1440])
  test(`responsive layout, keyboard dialog and accessibility at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/projects");
    await page.getByRole("heading", { name: "Your projects" }).waitFor();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await page.screenshot({
      path: `artifacts/projects-${width}.png`,
      fullPage: true,
    });
    let result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    await page
      .getByRole("button", { name: "New project", exact: true })
      .click();
    await expect(page.getByLabel("Project title")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "New project", exact: true }),
    ).toBeFocused();
    const primaryNavigation = page.getByRole("navigation", {
      name: "Main navigation",
    });
    await expect(
      primaryNavigation.getByRole("link", { name: "Projects", exact: true }),
    ).toBeVisible();
    await expect(
      primaryNavigation.getByRole("link", {
        name: "Croissantage",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      primaryNavigation.getByRole("link", { name: "Projects", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    const contentBox = await page.locator(".main-content").boundingBox();
    expect(
      Math.abs(contentBox!.x + contentBox!.width / 2 - width / 2),
    ).toBeLessThan(1);
    await primaryNavigation
      .getByRole("link", { name: "Croissantage", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/croissantage$/);
    await page.goto("/croissantage");
    await expect(page.getByText("Sam Rivera")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    await page.screenshot({
      path: `artifacts/attendance-${width}.png`,
      fullPage: true,
    });
    await page.goto(`/projects/${projectId}/documentation`);
    await page.getByRole("button", { name: "Overview", exact: true }).click();
    await page.getByRole("heading", { name: "Project overview" }).waitFor();
    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight / 2),
    );
    const location = page.getByRole("navigation", {
      name: "Workspace location",
    });
    await expect(
      location.getByRole("link", { name: "Projects", exact: true }),
    ).toHaveAttribute("href", "/projects");
    await expect(
      location.getByRole("link", { name: "WorkStation", exact: true }),
    ).toBeVisible();
    await expect(
      location.getByText("Documentation", { exact: true }),
    ).toBeVisible();

    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await expect(page.locator(".markdown pre")).toHaveAttribute(
      "tabindex",
      "0",
    );
    await page.goto("/?preview=signed-out");
    await page.getByRole("heading", { name: "Work Station" }).waitFor();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const login = page.getByRole("link", { name: "Continue with Microsoft" });
    await login.focus();
    await expect(login).toBeFocused();
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await page
        .locator(".computer-screen")
        .evaluate((el) => getComputedStyle(el, "::before").display),
    ).toBe("none");
    await expect(login).toBeVisible();
  });

test("nested explorer, multi-file results, Markdown authoring, move and bookmark icons", async ({
  page,
}) => {
  await page.goto(`/projects/${projectId}/documentation`);
  await page.getByRole("button", { name: "New folder", exact: true }).click();
  await page.getByLabel("Folder name").fill("Research");
  await page
    .getByRole("button", { name: "Create folder", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Research Folder · 0 items", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("navigation", { name: "Folder path" }),
  ).toContainText("Research");
  await page.getByRole("button", { name: "New folder", exact: true }).click();
  await page.getByLabel("Folder name").fill("Drafts");
  await page
    .getByRole("button", { name: "Create folder", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Drafts Folder · 0 items", exact: true })
    .click();
  await page.getByRole("button", { name: "New file", exact: true }).click();
  await page.getByLabel("Filename", { exact: true }).fill("plan.md");
  await page
    .getByLabel("File Markdown")
    .fill(
      "# Draft plan\n\n| Topic | Owner |\n| --- | --- |\n| Delivery | Team |",
    );
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("table")).toBeVisible();
  await page.getByRole("button", { name: "Create file", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit Markdown plan.md", exact: true })
    .click();
  await page
    .getByLabel("File Markdown")
    .fill("# Revised plan\n\nA saved revision.");
  await page
    .getByRole("button", { name: "Save Markdown", exact: true })
    .click();
  await page.getByRole("link", { name: /^plan.md plan.md/ }).click();
  await expect(
    page.getByRole("heading", { name: "Revised plan", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to resources" }).click();
  await expect(
    page.getByRole("navigation", { name: "Folder path" }),
  ).toContainText("Drafts");
  await page
    .getByRole("button", { name: "Rename plan.md", exact: true })
    .click();
  await page.getByLabel("Filename", { exact: true }).fill("decision.md");
  await page.getByLabel("Title", { exact: true }).fill("Decision");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByRole("button", { name: "Move Decision", exact: true })
    .click();
  await page
    .getByLabel("Destination folder")
    .selectOption({ label: "Research" });
  await page.getByRole("button", { name: "Move here", exact: true }).click();
  await expect(page.getByText("This folder is empty")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Folder path" })
    .getByRole("button", { name: "Research", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /^Decision decision.md/ }),
  ).toBeVisible();
  const dt = await page.evaluateHandle(() => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File(["# Imported"], "drop.md", { type: "text/markdown" }),
    );
    transfer.items.add(new File(["no"], "bad.exe"));
    return transfer;
  });
  await page
    .locator(".folder-row")
    .filter({ hasText: "Drafts" })
    .dispatchEvent("drop", { dataTransfer: dt });
  await expect(page.getByRole("dialog")).toContainText(
    "Project root / Research / Drafts",
  );
  await page.getByRole("button", { name: "Upload files", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Uploaded");
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "not supported",
  );
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete Drafts", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete folder", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "not empty",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "New folder", exact: true }).click();
  await page.getByLabel("Folder name").fill("DECISION.MD");
  await page
    .getByRole("button", { name: "Create folder", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "already exists",
  );
  await page.keyboard.press("Escape");
  for (const [title, url, icon] of [
    ["Repository", "https://github.com/mindsept/workstation", "GitHub"],
    [
      "Shared drive",
      "https://drive.google.com/drive/folders/example",
      "Google Drive",
    ],
    ["Lookalike", "https://github.com.example.org/project", "Website"],
  ]) {
    await page.getByRole("button", { name: "Add link", exact: true }).click();
    await page.getByLabel("Link label").fill(title);
    await page.getByLabel("URL", { exact: true }).fill(url);
    await expect(
      page.getByRole("dialog").getByRole("img", { name: icon, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Save link", exact: true }).click();
    await expect(
      page.getByRole("link", { name: new RegExp(`^${title}`) }),
    ).toHaveAttribute("rel", "noopener noreferrer");
  }
  await page.getByRole("button", { name: "Add link", exact: true }).click();
  await page.getByLabel("Link label").fill("Unsafe");
  await page.getByLabel("URL", { exact: true }).fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Save link", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "HTTP or HTTPS",
  );
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Move Decision", exact: true })
    .click();
  await expect(page.getByLabel("Destination folder")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Move Decision", exact: true }),
  ).toBeFocused();
});

test("mock project cover is selected once and retained across edits and filtered navigation", async ({
  page,
}) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page
    .getByLabel("Project title", { exact: true })
    .fill("Stable demo cover");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  const art = page.locator(".project-cover-art");
  await expect(art).toBeVisible();
  const cover = await art.getAttribute("src");
  expect(cover).toMatch(/^\/assets\/(covers\/|card-)/);
  const path = new URL(page.url()).pathname;
  await page.getByRole("button", { name: "Edit project", exact: true }).click();
  await page
    .getByLabel("Project title", { exact: true })
    .fill("Stable demo cover edited");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(art).toHaveAttribute("src", cover!);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "Search projects" })
    .fill("Stable demo");
  const link = page.locator(`a.project-card[href="${path}"]`);
  await expect(link.locator("img")).toHaveAttribute("src", cover!);
  await link.click();
  await expect(art).toHaveAttribute("src", cover!);
});
