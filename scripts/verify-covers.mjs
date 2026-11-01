import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const runPrefix = `Final covers ${Date.now()}`;
const base = process.env.E2E_BASE_URL || "http://localhost:5173";
const keys = [
  "archive",
  "atelier",
  "observatory",
  "library",
  "gallery",
  "conservatory",
  "salon",
  "vault",
];
const asset = (key) =>
  key === "archive"
    ? "/assets/card-archive-v5.webp"
    : key === "salon"
      ? "/assets/card-team-v5.webp"
      : `/assets/covers/${key}-v6.webp`;
const browser = await chromium.launch();
const context = await browser.newContext({
  baseURL: base,
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
const ids = [],
  results = [],
  errors = [];
let csrf;
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    message.text().includes("Cannot update a component")
  )
    errors.push(message.text());
});
const request = async (path, method = "GET", data) => {
  const r = await context.request.fetch("/api/v1" + path, {
    method,
    data,
    headers: { "X-CSRF-Token": csrf ?? "" },
  });
  expect(r.ok()).toBe(true);
  return r.status() === 204 ? null : r.json();
};
await mkdir("artifacts/final-acceptance/covers", { recursive: true });
try {
  await page.goto("/api/v1/auth/login?dev_user=admin");
  await expect(
    page.getByRole("heading", { name: "Your projects" }),
  ).toBeVisible();
  csrf = (await request("/auth/session")).csrf_token;
  for (let i = 0; i < 2; i++) {
    await page.goto("/projects");
    await page
      .getByRole("button", { name: "New project", exact: true })
      .click();
    const title = `${runPrefix} ${i + 1}`;
    await page.getByLabel("Project title", { exact: true }).fill(title);
    await page
      .getByLabel("Description", { exact: true })
      .fill("Temporary frontend cover acceptance record.");
    const createdResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/v1/projects") && r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Create project", exact: true })
      .click();
    const response = await createdResponse;
    const project = await response.json();
    ids.push(project.id);
    expect(Object.keys(response.request().postDataJSON()).sort()).toEqual([
      "description",
      "title",
    ]);
    expect(keys).toContain(project.cover_key);
    await expect(page.locator(".project-cover-art")).toHaveAttribute(
      "src",
      asset(project.cover_key),
    );
    await page.reload();
    await expect(page.locator(".project-cover-art")).toHaveAttribute(
      "src",
      asset(project.cover_key),
    );
    await page
      .getByRole("button", { name: "Edit project", exact: true })
      .click();
    await page
      .getByLabel("Project title", { exact: true })
      .fill(title + " edited");
    const updated = page.waitForResponse(
      (r) =>
        r.url().endsWith("/projects/" + project.id) &&
        r.request().method() === "PATCH",
    );
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    const update = await updated;
    expect((await update.json()).cover_key).toBe(project.cover_key);
    expect(Object.keys(update.request().postDataJSON()).sort()).toEqual([
      "description",
      "title",
    ]);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.reload();
    expect((await request("/projects/" + project.id)).cover_key).toBe(
      project.cover_key,
    );
    await expect(page.locator(".project-cover-art")).toHaveAttribute(
      "src",
      asset(project.cover_key),
    );
    await page.goto("/projects");
    await expect(
      page.locator(`a.project-card[href="/projects/${project.id}"] img`),
    ).toHaveAttribute("src", asset(project.cover_key));
    expect(
      (await request("/projects")).items.find((p) => p.id === project.id)
        .cover_key,
    ).toBe(project.cover_key);
    await page.goto(`/projects/${project.id}/documentation`);
    const dl = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Extract context", exact: true })
      .click();
    const zip = `artifacts/final-acceptance/covers/context-${i}.zip`;
    await (await dl).saveAs(zip);
    const exported = execFileSync(
      "python3",
      [
        "-c",
        'import zipfile,json,sys; print(json.loads(zipfile.ZipFile(sys.argv[1]).read("project.json"))["cover_key"])',
        zip,
      ],
      { encoding: "utf8" },
    ).trim();
    expect(exported).toBe(project.cover_key);
    results.push({
      id: project.id,
      cover_key: project.cover_key,
      creationReloadEditListDetailExportStable: true,
    });
  }
  await page.goto("/projects");
  await page
    .getByRole("searchbox", { name: "Search projects" })
    .fill(runPrefix);
  await page.screenshot({
    path: "artifacts/final-acceptance/covers/real-project-covers.png",
  });
  expect(errors).toEqual([]);
} finally {
  for (const id of ids) await request("/projects/" + id, "DELETE");
  if (csrf) await request("/auth/logout", "POST");
  await context.close();
  await browser.close();
  await writeFile(
    "artifacts/final-acceptance/covers/live-verification.json",
    JSON.stringify(
      {
        executed_at: new Date().toISOString(),
        results,
        cleanedIds: ids,
        errors,
      },
      null,
      2,
    ),
  );
}
console.log(results);
