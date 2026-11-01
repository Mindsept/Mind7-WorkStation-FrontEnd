import { chromium, expect } from "@playwright/test";
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";
mkdirSync("artifacts/final-acceptance", { recursive: true });
const runTitle = `Final acceptance ${Date.now()}`;
const checks = [];
const browser = await chromium.launch({ channel: "chromium" });
const context = await browser.newContext({
  baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    message.text().includes("Cannot update a component")
  )
    errors.push(message.text());
});
const created = { project: null, event: null };
let csrf;
const api = "/api/v1";
try {
  await page.goto(`${api}/auth/login?dev_user=admin`);
  await expect(
    page.getByRole("heading", { name: "Your projects" }),
  ).toBeVisible();
  const response = await context.request.get(`${api}/auth/session`);
  const initialSession = await response.json();
  expect(initialSession.user.can_manage_attendance).toBe(true);
  expect(initialSession.user.role).toBe("admin");
  csrf = initialSession.csrf_token;
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByLabel("Project title").fill(runTitle);
  await page
    .getByLabel("Description", { exact: true })
    .fill(
      "Temporary project created by the frontend browser acceptance script.",
    );
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: runTitle,
      exact: true,
    }),
  ).toBeVisible();
  created.project = page.url().split("/projects/")[1];
  await page.getByRole("link", { name: "Documentation hub" }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Write an overview" }).click();
  await page
    .getByLabel("Overview Markdown")
    .fill("# Acceptance overview\n\nBackend persistence and ZIP verification.");
  await page.getByRole("button", { name: "Save overview" }).click();
  await expect(
    page.getByRole("heading", { name: "Acceptance overview" }),
  ).toBeVisible();
  const files = [
    {
      name: "acceptance.md",
      mimeType: "text/markdown",
      buffer: Buffer.from("# Acceptance notes\n\nA shared resource."),
    },
    {
      name: "acceptance.html",
      mimeType: "text/html",
      buffer: Buffer.from(
        "<!doctype html><html><body><h1 id=\"s\">Deck one</h1><button onclick=\"document.querySelector('#s').textContent='Deck two'\">Next slide</button></body></html>",
      ),
    },
  ];
  // A minimal one-page PDF fixture with a correct cross-reference table.
  const objects = [
    "<</Type /Catalog /Pages 2 0 R>>",
    "<</Type /Pages /Kids [3 0 R] /Count 1>>",
    "<</Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>>",
    "<</Length 52>>\nstream\nBT /F1 18 Tf 30 250 Td (Acceptance PDF) Tj ET\nendstream",
    "<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>",
  ];
  let pdf = "%PDF-1.4\n",
    offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => String(n).padStart(10, "0") + " 00000 n \n")
    .join("")}trailer\n<</Size 6 /Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  files.push({
    name: "acceptance.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(pdf),
  });
  await page.getByRole("button", { name: "Files", exact: true }).click();
  for (const file of files) {
    await page.getByRole("button", { name: "Upload", exact: true }).click();
    await page.getByLabel("Resource file").setInputFiles(file);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Upload files", exact: true })
      .click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await expect(page.locator(".explorer-row")).toHaveCount(3);
  await page.reload();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Acceptance overview" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Files", exact: true }).click();
  await expect(page.locator(".explorer-row")).toHaveCount(3);
  await page.screenshot({
    path: "artifacts/documentation-real-backend.png",
    fullPage: true,
  });
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Extract context" }).click();
  await (await dl).saveAs("artifacts/context-real.zip");
  await page
    .locator(".explorer-name")
    .filter({ hasText: "acceptance.html" })
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("sandbox", "");
  await page.getByLabel("Enable slide navigation scripts").check();
  await expect(page.locator("iframe")).toHaveAttribute(
    "sandbox",
    "allow-scripts",
  );
  await page.getByRole("button", { name: "Present fullscreen" }).click();
  expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await page.evaluate(() => document.exitFullscreen());
  await page
    .frameLocator("iframe")
    .getByRole("button", { name: "Next slide" })
    .click();
  await expect(
    page.frameLocator("iframe").getByRole("heading", { name: "Deck two" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to resources" }).click();
  await page
    .locator(".explorer-name")
    .filter({ hasText: "acceptance.pdf" })
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /^blob:/);
  await page.waitForTimeout(800);
  await page.screenshot({ path: "artifacts/pdf-real-backend.png" });
  const pdfDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download original" }).click();
  expect((await pdfDownload).suggestedFilename()).toBe("acceptance.pdf");
  await page.goto(`/projects/${created.project}`);
  await page
    .locator(".explorer-name")
    .filter({ hasText: "acceptance.md" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Acceptance notes" }),
  ).toBeVisible();
  const mdDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download original" }).click();
  expect((await mdDownload).suggestedFilename()).toBe("acceptance.md");
  await page.goto("/croissantage");
  await page
    .getByRole("button", { name: "Record attendance", exact: true })
    .click();
  const members = (await (await context.request.get(`${api}/members`)).json())
    .items;
  const target =
    members.find((m) => m.id === initialSession.user.id) ?? members.at(-1);
  await page.getByLabel("Team member", { exact: true }).selectOption(target.id);
  await page.getByLabel("Event date").fill("2099-12-30");
  await page.getByLabel("Minutes late").fill("7");
  await page
    .getByLabel("Note", { exact: true })
    .fill("Temporary frontend acceptance event");
  const eventResponse = page.waitForResponse(
    (r) =>
      r.url().endsWith("/attendance/events") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Record event" }).click();
  const er = await eventResponse;
  expect(er.status()).toBe(201);
  created.event = (await er.json()).id;
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("From date").fill("2099-12-30");
  await page.getByLabel("To date").fill("2099-12-30");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(
    page.locator(".attendance-summary").getByText("1", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `View history for ${target.display_name}` })
    .click();
  await expect(page.getByText("Late arrival · 7 min")).toBeVisible();
  await page.getByRole("button", { name: "Edit event on 2099-12-30" }).click();
  await page.getByLabel("Event type").selectOption("absent");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".event-row")).toContainText("Absence");
  await page
    .getByRole("button", { name: "Delete event on 2099-12-30" })
    .click();
  await page.getByRole("button", { name: "Delete event", exact: true }).click();
  await expect(page.locator(".event-row")).toHaveCount(0);
  created.event = null;
  await page.goto(`/projects/${created.project}`);
  await page
    .getByRole("button", { name: "Delete project", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete project", exact: true })
    .click();
  created.project = null;
  await expect(
    page.getByRole("heading", { name: "Your projects" }),
  ).toBeVisible();
  await page.locator(".user-trigger").click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(
    page.getByRole("link", { name: "Continue with Microsoft" }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/login-desktop.png" });
  await page.goto(`${api}/auth/login?dev_user=member`);
  await page.goto("/croissantage");
  await expect(
    page.getByRole("button", { name: "Record attendance", exact: true }),
  ).toBeVisible();
  const memberSession = await (
    await context.request.get(`${api}/auth/session`)
  ).json();
  expect(memberSession.user.role).toBe("member");
  expect(memberSession.user.can_manage_attendance).toBe(true);
  csrf = memberSession.csrf_token;
  const memberEvent = await context.request.post(`${api}/attendance/events`, {
    headers: { "X-CSRF-Token": memberSession.csrf_token },
    data: {
      member_id: memberSession.user.id,
      event_type: "late",
      event_date: "2099-12-31",
    },
  });
  expect(memberEvent.status()).toBe(201);
  created.event = (await memberEvent.json()).id;
  expect(
    (
      await context.request.patch(`${api}/attendance/events/${created.event}`, {
        headers: { "X-CSRF-Token": csrf },
        data: { event_type: "absent", minutes_late: null },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await context.request.delete(
        `${api}/attendance/events/${created.event}`,
        { headers: { "X-CSRF-Token": csrf } },
      )
    ).status(),
  ).toBe(204);
  created.event = null;
  // Never replace an existing personal photo during acceptance.
  expect(memberSession.user.avatar_url ?? null).toBe(null);
  let photoCreated = false;
  const openProfile = async () => {
    await page.locator(".user-trigger").click();
    await page.getByRole("menuitem", { name: "Profile & appearance" }).click();
  };
  try {
    await openProfile();
    for (const [index, color] of ["#a88a50", "#42634b"].entries()) {
      const buffer = await sharp({
        create: { width: 120, height: 80, channels: 3, background: color },
      })
        .png()
        .toBuffer();
      await page
        .getByLabel("Choose profile photo", { exact: true })
        .setInputFiles({
          name: `acceptance-${index}.png`,
          mimeType: "image/png",
          buffer,
        });
      await expect(page.getByAltText("Selected photo preview")).toBeVisible();
      const saved = page.waitForResponse(
        (r) => r.url().endsWith("/me/avatar") && r.request().method() === "PUT",
      );
      await page
        .getByRole("button", { name: "Save photo", exact: true })
        .click();
      expect((await saved).status()).toBe(200);
      photoCreated = true;
      await expect(page.getByRole("status")).toContainText(
        "Profile photo saved",
      );
      await page.getByRole("button", { name: "Close dialog" }).click();
      await page.reload();
      await expect(
        page.locator(".user-trigger .profile-avatar img"),
      ).toBeVisible();
      await openProfile();
    }
    const existing = (
      await (await context.request.get(`${api}/auth/session`)).json()
    ).user.avatar_version;
    const invalid = await context.request.put(`${api}/me/avatar`, {
      headers: { "X-CSRF-Token": csrf },
      multipart: {
        file: {
          name: "bad.png",
          mimeType: "image/png",
          buffer: Buffer.from("invalid"),
        },
      },
    });
    expect(invalid.status()).toBe(415);
    expect(
      (await (await context.request.get(`${api}/auth/session`)).json()).user
        .avatar_version,
    ).toBe(existing);
    await expect(
      page.getByLabel("Current profile photo").locator("img"),
    ).toBeVisible();
    await page.screenshot({
      path: "artifacts/final-acceptance/live-avatar.png",
    });
    await page
      .getByRole("button", { name: "Remove photo", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Profile photo removed",
    );
    photoCreated = false;
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.reload();
    await expect(page.locator(".user-trigger .profile-avatar img")).toHaveCount(
      0,
    );
    expect(
      (await (await context.request.get(`${api}/auth/session`)).json()).user
        .avatar_url,
    ).toBe(null);
    checks.push(
      "Real member avatar preview/save/reload/replace/remove; malformed API replacement415 retained saved version; preexisting photo absent and final state restored. Delayed UI failure retention covered separately by production fixtures.",
    );
  } finally {
    if (photoCreated)
      expect(
        (
          await context.request.delete(`${api}/me/avatar`, {
            headers: { "X-CSRF-Token": csrf },
          })
        ).status(),
      ).toBe(204);
  }
  expect(errors).toEqual([]);
  writeFileSync(
    "artifacts/final-acceptance/backend-verification.json",
    JSON.stringify(
      {
        passed: true,
        executed_at: new Date().toISOString(),
        additionalChecks: checks,
        checks: [
          "backend-managed dev login",
          "project creation/deletion",
          "documentation persistence",
          "HTML/Markdown/PDF upload",
          "shared resource collection",
          "actual backend ZIP download",
          "HTML inline navigation",
          "PDF blob preview",
          "attendance create/edit/delete/aggregation",
          "logout",
          "member capability permits attendance create/edit/delete",
        ],
        browserErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Real backend integration passed. ZIP saved for independent inspection.",
  );
} finally {
  if (created.event && csrf)
    await context.request.delete(`${api}/attendance/events/${created.event}`, {
      headers: { "X-CSRF-Token": csrf },
    });
  if (created.project && csrf)
    await context.request.delete(`${api}/projects/${created.project}`, {
      headers: { "X-CSRF-Token": csrf },
    });
  if (csrf) {
    const session = await context.request.get(`${api}/auth/session`);
    if (session.ok())
      await context.request.post(`${api}/auth/logout`, {
        headers: { "X-CSRF-Token": (await session.json()).csrf_token },
      });
  }
  await browser.close();
}
