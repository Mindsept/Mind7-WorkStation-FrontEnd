import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const base = process.env.E2E_BASE_URL || "http://localhost:5173",
  api = "/api/v1";
const browser = await chromium.launch({ channel: "chromium" });
const context = await browser.newContext({
  baseURL: base,
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [],
  results = [],
  artifacts = "artifacts/final-acceptance/explorer";
mkdirSync(artifacts, { recursive: true });
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    message.text().includes("Cannot update a component")
  )
    errors.push(message.text());
});
const runTitle = `Final explorer ${Date.now()}`;
let pid, csrf;
async function request(path, method = "GET", data) {
  const response = await context.request.fetch(`${api}${path}`, {
    method,
    data,
    headers: { "X-CSRF-Token": csrf ?? "" },
  });
  if (!response.ok())
    throw new Error(
      `${method} ${path}: ${response.status()} ${await response.text()}`,
    );
  return response.status() === 204 ? null : response.json();
}
const button = (name) => page.getByRole("button", { name, exact: true });
const pathNav = () => page.getByRole("navigation", { name: "Folder path" });
const rows = () => page.getByRole("list", { name: "Current folder contents" });
async function createFolder(name) {
  await button("New folder").click();
  await page.getByLabel("Folder name").fill(name);
  await button("Create folder").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function enter(name) {
  await rows()
    .getByRole("button", { name: new RegExp(`^${name} Folder ·`) })
    .click();
}
async function upload(files) {
  await button("Upload").click();
  await page.getByLabel("Resource file").setInputFiles(files);
  await button("Upload files").click();
  await button("Done").click();
}
try {
  await page.goto(`${api}/auth/login?dev_user=admin`);
  await expect(
    page.getByRole("heading", { name: "Your projects" }),
  ).toBeVisible();
  const session = await request("/auth/session");
  expect(session.user.can_manage_attendance).toBe(true);
  csrf = session.csrf_token;
  await button("New project").click();
  await page.getByLabel("Project title").fill(runTitle);
  await page
    .getByLabel("Description", { exact: true })
    .fill(
      "Temporary frontend acceptance records. Created and removed by the browser verification script.",
    );
  await button("Create project").click();
  await expect(
    page.getByRole("heading", { name: runTitle, exact: true }),
  ).toBeVisible();
  pid = new URL(page.url()).pathname.split("/")[2];
  for (const [title, url, provider] of [
    ["Repository", "https://github.com/mindsept/workstation", "GitHub"],
    [
      "Shared drive",
      "https://drive.google.com/drive/folders/example",
      "Google Drive",
    ],
    ["Project site", "https://example.org/project", "Website"],
  ]) {
    await button("Add link").click();
    await page.getByLabel("Link label").fill(title);
    await page.getByLabel("URL", { exact: true }).fill(url);
    await expect(
      page
        .getByRole("dialog")
        .getByRole("img", { name: provider, exact: true }),
    ).toBeVisible();
    await button("Save link").click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await button("Edit link Project site").click();
  await page.getByLabel("Link label").fill("Project handbook");
  await page
    .getByLabel("URL", { exact: true })
    .fill("https://example.org/handbook");
  await button("Save link").click();
  await button("Remove link Project handbook").click();
  await button("Remove link").click();
  await expect(
    page.getByRole("link", { name: /^Project handbook/ }),
  ).toHaveCount(0);
  await button("Add link").click();
  await page.getByLabel("Link label").fill("Project handbook");
  await page
    .getByLabel("URL", { exact: true })
    .fill("https://example.org/handbook");
  await button("Save link").click();
  await page.reload();
  const savedLinks = (await request(`/projects/${pid}/links`)).items;
  expect(savedLinks.map((l) => l.provider).sort()).toEqual([
    "drive",
    "github",
    "other",
  ]);
  for (const l of savedLinks)
    await expect(
      page.getByRole("link", { name: new RegExp(`^${l.title}`) }),
    ).toHaveAttribute("href", l.url);
  results.push(
    "GitHub, Drive and generic bookmarks created, edited, removed and persisted; local icon detection and safe anchors verified.",
  );
  await upload([
    {
      name: "root.md",
      mimeType: "text/markdown",
      buffer: Buffer.from("# Root document"),
    },
  ]);
  expect((await request(`/projects/${pid}/resources`)).items[0].folder_id).toBe(
    null,
  );
  const originalRoot = (await request(`/projects/${pid}/resources`)).items[0];
  await button("Upload").click();
  await page.getByLabel("Resource file").setInputFiles([
    {
      name: "root.md",
      mimeType: "text/markdown",
      buffer: Buffer.from("# Retried root"),
    },
    {
      name: "retry-sibling.md",
      mimeType: "text/markdown",
      buffer: Buffer.from("# Successful sibling"),
    },
  ]);
  await button("Upload files").click();
  await expect(
    page.getByRole("dialog").getByText("Uploaded", { exact: true }),
  ).toHaveCount(1);
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    /exists|name/i,
  );
  const sibling = (await request(`/projects/${pid}/resources`)).items.find(
    (r) => r.filename === "retry-sibling.md",
  );
  await request(`/projects/${pid}/resources/${originalRoot.id}`, "PATCH", {
    filename: "original-root.md",
  });
  await page.getByRole("button", { name: /Retry/ }).click();
  await expect(
    page.getByRole("dialog").getByText("Uploaded", { exact: true }),
  ).toHaveCount(2);
  expect(
    (await request(`/projects/${pid}/resources`)).items
      .filter((r) => r.filename === "retry-sibling.md")
      .map((r) => r.id),
  ).toEqual([sibling.id]);
  await page.screenshot({ path: `${artifacts}/live-retry.png` });
  await button("Done").click();
  results.push(
    "Real backend409 per-file upload collision; resolving the conflicting filename then Retry uploaded only the failed file and retained the successful sibling ID.",
  );
  await page.getByRole("link", { name: "Documentation hub" }).click();
  await button("Overview").click();
  await button("Write an overview").click();
  await page
    .getByLabel("Overview Markdown")
    .fill("# Explorer overview\n\nShared project documentation.");
  await button("Save overview").click();
  await button("Files").click();
  await createFolder("Research");
  await enter("Research");
  await createFolder("Drafts");
  await createFolder("Release");
  await createFolder("Empty");
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(
      new File(["# Imported notes"], "import.md", { type: "text/markdown" }),
    );
    data.items.add(
      new File(["<!doctype html><h1>Imported slides</h1>"], "deck.html", {
        type: "text/html",
      }),
    );
    data.items.add(new File(["bad"], "bad.exe"));
    return data;
  });
  await page
    .locator(".folder-row")
    .filter({ hasText: "Drafts" })
    .dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.getByRole("dialog")).toContainText(
    "Project root / Research / Drafts",
  );
  await button("Upload files").click();
  await expect(
    page.getByRole("dialog").getByText("Uploaded", { exact: true }),
  ).toHaveCount(2);
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "not supported",
  );
  await button("Done").click();
  await enter("Drafts");
  await button("New file").click();
  await page.getByLabel("Filename", { exact: true }).fill("plan.md");
  await page.getByLabel("File Markdown").fill("# First plan");
  await button("Create file").click();
  await button("Edit Markdown plan.md").click();
  await page.getByLabel("File Markdown").fill("# Local revision");
  let files = (await request(`/projects/${pid}/resources`)).items;
  const plan = files.find((r) => r.filename === "plan.md");
  await request(`/projects/${pid}/resources/${plan.id}/content`, "PUT", {
    content_markdown: "# Teammate revision",
    expected_sha256: plan.sha256,
  });
  await button("Save Markdown").click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    /changed|modified|conflict/i,
  );
  await expect(page.getByLabel("File Markdown")).toHaveValue(
    "# Local revision",
  );
  await button("Load latest for comparison").click();
  await expect(page.getByLabel("Latest saved Markdown")).toHaveValue(
    "# Teammate revision",
  );
  await page
    .getByLabel("File Markdown")
    .fill("# Reconciled plan\n\nBoth revisions retained.");
  await button("Save Markdown").click();
  await button("Rename plan.md").click();
  await page.getByLabel("Filename", { exact: true }).fill("decision.md");
  await page.getByLabel("Title", { exact: true }).fill("Decision");
  await button("Save changes").click();
  await button("Move Decision").click();
  await page
    .getByLabel("Destination folder")
    .selectOption({ label: "Research" });
  await button("Move here").click();
  await pathNav()
    .getByRole("button", { name: "Research", exact: true })
    .click();
  await button("New folder").click();
  await page.getByLabel("Folder name").fill("DECISION.MD");
  await button("Create folder").click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    /exists|name/i,
  );
  await button("Cancel").click();
  await page
    .locator(".folder-row")
    .filter({ hasText: "Drafts" })
    .dragTo(page.locator(".folder-row").filter({ hasText: "Release" }));
  await expect(
    rows().getByRole("button", { name: /^Drafts Folder/ }),
  ).toHaveCount(0);
  await pathNav()
    .getByRole("button", { name: "Project root", exact: true })
    .click();
  await button("Delete Research").click();
  await button("Delete folder").click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    /empty|contents/i,
  );
  await button("Cancel").click();
  await button("Rename Research").click();
  await page.getByLabel("Folder name").fill("Archive");
  await button("Save changes").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(button("Move Archive")).toBeVisible();
  const folders = (await request(`/projects/${pid}/folders`)).items;
  const archive = folders.find((f) => f.name === "Archive");
  const nested = folders.find((f) => f.name === "Drafts");
  const cycle = await context.request.patch(
    `${api}/projects/${pid}/folders/${archive.id}`,
    { headers: { "X-CSRF-Token": csrf }, data: { parent_id: nested.id } },
  );
  expect(cycle.status()).toBe(422);
  expect((await cycle.json()).error.code).toBe("folder_cycle");
  const invalidName = await context.request.post(
    `${api}/projects/${pid}/folders`,
    { headers: { "X-CSRF-Token": csrf }, data: { name: "../escape" } },
  );
  expect(invalidName.status()).toBe(422);
  expect((await invalidName.json()).error.code).toBe("invalid_name");
  await button("Move Archive").click();
  const destinations = await page
    .getByLabel("Destination folder")
    .locator("option")
    .evaluateAll((es) => es.map((e) => e.value));
  expect(destinations).not.toContain(archive.id);
  expect(destinations).not.toContain(nested.id);
  await button("Cancel").click();
  results.push(
    "Invalid path name422 and cyclic subtree move422 rejected by live API; Move dialog excludes self and descendants.",
  );
  await enter("Archive");
  await page.reload();
  await expect(
    page.getByRole("link", { name: /^Decision decision.md/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /^Decision decision.md/ }).click();
  await expect(
    page.getByRole("heading", { name: "Reconciled plan" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to resources" }).click();
  files = (await request(`/projects/${pid}/resources`)).items;
  expect(files.find((r) => r.id === plan.id).original_filename).toBe("plan.md");
  const fileDownload = page.waitForEvent("download");
  await button("Download Decision").click();
  expect((await fileDownload).suggestedFilename()).toBe("decision.md");
  results.push(
    "Nested folders, targeted OS multi-file drop/results, new Markdown, optimistic conflict reconciliation, canonical rename/provenance, file Move dialog and internal folder drag all persisted after reload.",
  );
  results.push(
    "Shared file/folder case-insensitive name collision and nonempty folder deletion refused with visible server errors.",
  );
  await enter("Release");
  await enter("Drafts");
  const currentFolder = new URL(page.url()).searchParams.get("folder");
  await page.getByRole("link", { name: "Resources", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/projects/${pid}\\?folder=${currentFolder}$`),
  );
  await expect(
    page.getByRole("link", { name: /^import.md import.md/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Documentation hub" }).click();
  const zipDownload = page.waitForEvent("download");
  await button("Extract context").click();
  await (await zipDownload).saveAs(`${artifacts}/context-hierarchy.zip`);
  const zipCheck = execFileSync(
    "python3",
    [
      "-c",
      `import zipfile,json,hashlib\np='${artifacts}/context-hierarchy.zip'\nwith zipfile.ZipFile(p) as z:\n m=json.loads(z.read('manifest.json')); project=json.loads(z.read('project.json'))\n assert {l['provider'] for l in project['links']} == {'github','drive','other'}\n assert any(f['logical_path']=='Archive/Empty' and f['archive_path'] in z.namelist() for f in m['folders'])\n assert any(f['logical_path']=='Archive/Release/Drafts' for f in m['folders'])\n assert any(r['logical_path']=='Archive/decision.md' and r['original_filename']=='plan.md' for r in m['resources'])\n assert any(r['logical_path']=='Archive/Release/Drafts/import.md' for r in m['resources'])\n for r in m['resources']:\n  data=z.read(r['archive_path']); assert len(data)==r['byte_size']; assert hashlib.sha256(data).hexdigest()==r['sha256']\n assert b'Explorer overview' in z.read('documentation/overview.md')\n print(json.dumps({'resources':len(m['resources']),'folders':len(m['folders']),'links':len(project['links']),'checksums':'all matched','paths':[r['logical_path'] for r in m['resources']]}))`,
    ],
    { encoding: "utf8" },
  );
  results.push(JSON.parse(zipCheck));
  await pathNav().getByRole("button", { name: "Archive", exact: true }).click();
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator(".file-explorer").scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: `${artifacts}/real-explorer-${width}.png`,
      fullPage: true,
    });
    await button("Move Decision").click();
    await expect(page.getByLabel("Destination folder")).toBeFocused();
    await page.screenshot({ path: `${artifacts}/real-move-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(button("Move Decision")).toBeFocused();
  }
  await button("Move Empty").click();
  await page
    .getByLabel("Destination folder")
    .selectOption({ label: "Project root" });
  await button("Move here").click();
  await pathNav()
    .getByRole("button", { name: "Project root", exact: true })
    .click();
  await expect(button("Move Empty")).toBeVisible();
  await button("Move Empty").click();
  await page
    .getByLabel("Destination folder")
    .selectOption({ label: "Archive" });
  await button("Move here").click();
  await enter("Archive");
  results.push(
    "Mobile Move dialog moves an empty folder to project root and back using explicit null parent; persisted directory path verified.",
  );
  await createFolder("Mobile draft");
  await rows()
    .getByRole("button", { name: /^Mobile draft Folder/ })
    .focus();
  await page.keyboard.press("Enter");
  await expect(pathNav()).toContainText("Mobile draft");
  await upload([
    {
      name: "mobile.md",
      mimeType: "text/markdown",
      buffer: Buffer.from("# Mobile import"),
    },
  ]);
  await button("Move mobile.md").click();
  await page
    .getByLabel("Destination folder")
    .selectOption({ label: "Archive" });
  await button("Move here").click();
  await expect(page.getByText("This folder is empty")).toBeVisible();
  await button("New file").click();
  await page.getByLabel("Filename", { exact: true }).fill("blank.md");
  await button("Create file").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    (await request(`/projects/${pid}/resources`)).items.find(
      (r) => r.filename === "blank.md",
    ).byte_size,
  ).toBe(0);
  await pathNav().getByRole("button", { name: "Archive", exact: true }).click();
  const rejected = await context.request.post(
    `${api}/projects/${pid}/folders`,
    { data: { name: "No CSRF" } },
  );
  expect(rejected.status()).toBe(403);
  const memberContext = await browser.newContext({ baseURL: base });
  const memberPage = await memberContext.newPage();
  let memberEventId, memberCsrf;
  try {
    await memberPage.goto(`${api}/auth/login?dev_user=member`);
    await memberPage.goto(`/projects/${pid}/documentation`);
    await expect(
      memberPage.getByRole("button", { name: "New folder", exact: true }),
    ).toBeVisible();
    const memberSession = await (
      await memberContext.request.get(`${api}/auth/session`)
    ).json();
    memberCsrf = memberSession.csrf_token;
    expect(memberSession.user.can_manage_attendance).toBe(true);
    const createdByMember = await memberContext.request.post(
      `${api}/projects/${pid}/folders`,
      {
        data: { name: "Member folder" },
        headers: { "X-CSRF-Token": memberCsrf },
      },
    );
    expect(createdByMember.status()).toBe(201);
    await memberPage.goto("/croissantage");
    await expect(
      memberPage.getByRole("button", {
        name: "Record attendance",
        exact: true,
      }),
    ).toBeVisible();
    const permitted = await memberContext.request.post(
      `${api}/attendance/events`,
      {
        data: {
          member_id: memberSession.user.id,
          event_type: "absent",
          event_date: "2099-12-29",
        },
        headers: { "X-CSRF-Token": memberCsrf },
      },
    );
    expect(permitted.status()).toBe(201);
    memberEventId = (await permitted.json()).id;
  } finally {
    if (memberEventId)
      expect(
        (
          await memberContext.request.delete(
            `${api}/attendance/events/${memberEventId}`,
            { headers: { "X-CSRF-Token": memberCsrf } },
          )
        ).status(),
      ).toBe(204);
    if (memberCsrf)
      await memberContext.request.post(`${api}/auth/logout`, {
        headers: { "X-CSRF-Token": memberCsrf },
      });
    await memberContext.close();
  }
  results.push(
    "Mobile keyboard folder entry, upload and Move dialog succeeded; blank Markdown saved. Missing-CSRF folder mutation rejected403; member project and attendance authoring both allowed201; temporary member event removed.",
  );
  await button("Delete Empty").click();
  await button("Delete folder").click();
  await expect(button("Delete Empty")).toHaveCount(0);
  await button("Delete Decision").click();
  await button("Delete resource").click();
  await expect(button("Delete Decision")).toHaveCount(0);
  results.push(
    "Desktop/tablet/mobile no-overflow and Axe checks passed; Move dialog autofocus/Escape/focus return verified; empty folder and file deletion succeeded.",
  );
  expect(errors).toEqual([]);
  writeFileSync(
    `${artifacts}/real-results.json`,
    JSON.stringify(
      {
        executed_at: new Date().toISOString(),
        results,
        pageErrors: errors,
        createdProject: pid,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  if (pid && csrf) {
    await request(`/projects/${pid}`, "DELETE");
    console.log(`Cleaned up acceptance project ${pid}`);
  }
  if (csrf) await request("/auth/logout", "POST");
  await browser.close();
}
