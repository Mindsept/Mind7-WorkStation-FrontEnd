import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const browser = await chromium.launch();
const context = await browser.newContext({
  baseURL: "http://localhost:5173",
  reducedMotion: "reduce",
});
const page = await context.newPage();
const root = "artifacts/explorer";
mkdirSync(root, { recursive: true });
let project, csrf;
const checks = [];
const api = async (path, method = "GET", data) => {
  const r = await context.request.fetch(`/api/v1${path}`, {
    method,
    data,
    headers: { "X-CSRF-Token": csrf ?? "" },
  });
  if (!r.ok()) throw new Error(`${r.status()} ${await r.text()}`);
  return r.status() === 204 ? undefined : r.json();
};
try {
  await page.goto("/api/v1/auth/login?dev_user=admin");
  csrf = (await api("/auth/session")).csrf_token;
  project = await api("/projects", "POST", {
    title: "Workspace library review",
    description:
      "Temporary visual review project. Architecture notes, shared decisions and useful team references.",
  });
  const folder = await api(`/projects/${project.id}/folders`, "POST", {
    name: "Architecture",
  });
  await api(`/projects/${project.id}/folders`, "POST", {
    name: "Decisions",
    parent_id: folder.id,
  });
  await api(`/projects/${project.id}/folders`, "POST", {
    name: "Reference material",
    parent_id: folder.id,
  });
  for (const [title, url] of [
    ["Source repository", "https://github.com/example/workstation"],
    ["Shared project drive", "https://drive.google.com/drive/folders/example"],
    ["Project handbook", "https://example.org/handbook"],
  ])
    await api(`/projects/${project.id}/links`, "POST", { title, url });
  for (const [name, title, text] of [
    [
      "integration.md",
      "Integration notes",
      "# Integration notes\n\nKeep contracts and decisions together.",
    ],
    [
      "review.md",
      "Review checklist",
      "# Review checklist\n\n- Check the contract\n- Record the decision",
    ],
  ]) {
    const r = await context.request.post(
      `/api/v1/projects/${project.id}/resources`,
      {
        headers: { "X-CSRF-Token": csrf },
        multipart: {
          folder_id: folder.id,
          title,
          file: { name, mimeType: "text/markdown", buffer: Buffer.from(text) },
        },
      },
    );
    expect(r.status()).toBe(201);
  }
  await page.goto(`/projects/${project.id}/documentation?folder=${folder.id}`);
  await expect(
    page.getByRole("link", { name: /^Integration notes integration.md/ }),
  ).toBeVisible();
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      document.activeElement?.blur();
      scrollTo(0, 0);
    });
    expect(await page.evaluate(() => scrollY)).toBe(0);
    expect((await page.locator(".portal-header").boundingBox()).y).toBe(0);
    await page.screenshot({ path: `${root}/viewport-links-${width}.png` });
    await page.evaluate(() => {
      document.activeElement?.blur();
      const header = document
        .querySelector(".portal-header")
        .getBoundingClientRect();
      const files = document
        .querySelector(".file-explorer")
        .getBoundingClientRect();
      scrollTo(0, scrollY + files.top - header.height - 16);
    });
    expect((await page.locator(".portal-header").boundingBox()).y).toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `${root}/viewport-files-${width}.png` });
    await page
      .getByRole("button", { name: "Move Integration notes", exact: true })
      .click();
    await page.screenshot({ path: `${root}/viewport-move-${width}.png` });
    await page.keyboard.press("Escape");
    checks.push({
      width,
      topHeaderY: 0,
      scrolledHeaderY: 0,
      horizontalOverflow: false,
    });
  }
  writeFileSync(
    `${root}/viewport-checks.json`,
    JSON.stringify(checks, null, 2),
  );
  console.log(JSON.stringify(checks));
} finally {
  if (project) await api(`/projects/${project.id}`, "DELETE");
  if (csrf) await api("/auth/logout", "POST");
  await browser.close();
}
