import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const output = "artifacts/local-access";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "chromium" });
const contexts = [];
const owned = new Set();
const checks = [];
const errors = [];
const api = "/api/v1";
let member;
const dates = ["2099-12-27", "2099-12-28"];
try {
  for (const alias of ["member", "admin"]) {
    const context = await browser.newContext({
      baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${api}/auth/login?dev_user=${alias}`);
    const sessionResponse = await context.request.get(`${api}/auth/session`);
    expect(sessionResponse.status()).toBe(200);
    const session = await sessionResponse.json();
    contexts.push({ context, page, session });
    expect(session.user.can_manage_attendance).toBe(true);
    expect(session.user.role).toBe(alias);
  }
  member = contexts[0];
  const other = contexts[1];
  expect(member.session.user.id).not.toBe(other.session.user.id);
  const headers = { "X-CSRF-Token": member.session.csrf_token };
  const filtered = async (date) => {
    const response = await member.context.request.get(
      `${api}/attendance/events?member_id=${member.session.user.id}&date_from=${date}&date_to=${date}`,
    );
    expect(response.status()).toBe(200);
    return (await response.json()).items;
  };
  for (const date of dates) expect(await filtered(date)).toEqual([]);
  const { page } = member;
  await page.goto("/croissantage");
  await expect(
    page.getByRole("button", { name: "Record attendance", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Record attendance", exact: true })
    .click();
  await page
    .getByLabel("Team member", { exact: true })
    .selectOption(member.session.user.id);
  await page.getByLabel("Event date").fill(dates[0]);
  await page.getByLabel("Minutes late").fill("7");
  await page
    .getByLabel("Note", { exact: true })
    .fill("Temporary local-access frontend acceptance");
  const created = page.waitForResponse(
    (r) =>
      r.url().endsWith("/attendance/events") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Record event", exact: true }).click();
  const createResponse = await created;
  expect(createResponse.status()).toBe(201);
  const ownId = (await createResponse.json()).id;
  owned.add(ownId);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("From date").fill(dates[0]);
  await page.getByLabel("To date").fill(dates[0]);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page
    .getByRole("button", {
      name: `View history for ${member.session.user.display_name}`,
    })
    .click();
  await expect(page.getByText("Late arrival · 7 min")).toBeVisible();
  await page.getByRole("button", { name: `Edit event on ${dates[0]}` }).click();
  await page.getByLabel("Event type").selectOption("absent");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".event-row")).toContainText("Absence");
  expect((await filtered(dates[0]))[0].event_type).toBe("absent");
  await page.screenshot({
    path: `${output}/member-attendance-real.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: `Delete event on ${dates[0]}` })
    .click();
  await page.getByRole("button", { name: "Delete event", exact: true }).click();
  await expect(page.locator(".event-row")).toHaveCount(0);
  expect(await filtered(dates[0])).toEqual([]);
  owned.delete(ownId);
  checks.push(
    "Real dev member session: role member, explicit capability true; browser create/edit/delete and filtered history persisted successfully.",
  );
  const otherResponse = await other.context.request.post(
    `${api}/attendance/events`,
    {
      headers: { "X-CSRF-Token": other.session.csrf_token },
      data: {
        member_id: member.session.user.id,
        event_type: "late",
        event_date: dates[1],
        note: "Temporary cross-user local-access acceptance",
      },
    },
  );
  expect(otherResponse.status()).toBe(201);
  const otherId = (await otherResponse.json()).id;
  owned.add(otherId);
  const patch = await member.context.request.patch(
    `${api}/attendance/events/${otherId}`,
    { headers, data: { event_type: "absent", minutes_late: null } },
  );
  expect(patch.status()).toBe(200);
  expect((await patch.json()).event_type).toBe("absent");
  const deleted = await member.context.request.delete(
    `${api}/attendance/events/${otherId}`,
    { headers },
  );
  expect(deleted.status()).toBe(204);
  owned.delete(otherId);
  expect(await filtered(dates[1])).toEqual([]);
  checks.push(
    "Member successfully PATCHed (200) and DELETEd (204) an event created by a different authorized development identity (legacy admin alias).",
  );
  const hashes = JSON.parse(
    readFileSync("tests/fixtures/approved-login-hashes.json", "utf8"),
  );
  for (const [file, hash] of Object.entries(hashes))
    expect(createHash("sha256").update(readFileSync(file)).digest("hex")).toBe(
      hash,
    );
  checks.push("All five approved login source/style/asset hashes unchanged.");
  expect(errors).toEqual([]);
} finally {
  if (member)
    for (const id of owned) {
      const response = await member.context.request.delete(
        `${api}/attendance/events/${id}`,
        { headers: { "X-CSRF-Token": member.session.csrf_token } },
      );
      expect([204, 404]).toContain(response.status());
    }
  for (const { context, session } of contexts) {
    const response = await context.request.post(`${api}/auth/logout`, {
      headers: { "X-CSRF-Token": session.csrf_token },
    });
    expect(response.status()).toBe(204);
    expect((await context.request.get(`${api}/auth/session`)).status()).toBe(
      401,
    );
    await context.close();
  }
  await browser.close();
}
checks.push(
  "Only two owned attendance fixtures removed; both created sessions logged out and confirmed 401. No project/avatar mutations.",
);
writeFileSync(
  `${output}/live-results.json`,
  JSON.stringify(
    {
      checks,
      runtime_errors: errors,
      limitation:
        "Development identities only. Real Microsoft OIDC has not been validated.",
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ checks }, null, 2));
