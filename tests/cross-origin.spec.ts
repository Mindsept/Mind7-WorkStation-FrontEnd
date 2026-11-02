import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import sharp from "sharp";

// A real HTTP server exercises browser CORS/preflight and credentials handling.
// It is test-only: no identity provider, production API or real data is contacted.
const origin = "http://127.0.0.1:4175";
const api = "http://127.0.0.1:4176/api/v1";
const pid = "10000000-0000-4000-8000-000000000001";
const uid = "30000000-0000-4000-8000-000000000001";
const stamp = "2026-11-02T09:00:00Z";
const project = {
  id: pid,
  title: "Cross origin project",
  description: "",
  creator_id: uid,
  created_at: stamp,
  updated_at: stamp,
};
const list = (items: unknown[]) => ({
  items,
  total: items.length,
  limit: 100,
  offset: 0,
});
const documents = [
  {
    type: "markdown",
    ext: "md",
    mime: "text/markdown",
    body: "# Cross origin notes",
  },
  {
    type: "html",
    ext: "html",
    mime: "text/html",
    body: "<h1>Cross origin slides</h1>",
  },
  { type: "pdf", ext: "pdf", mime: "application/pdf", body: "%PDF-1.4\n%%EOF" },
];
const resources = documents.map((doc, i) => ({
  id: `20000000-0000-4000-8000-00000000000${i + 1}`,
  project_id: pid,
  title: `${doc.type} document`,
  filename: `notes.${doc.ext}`,
  resource_type: doc.type,
  content_type: doc.mime,
  byte_size: doc.body.length,
  sha256: "a".repeat(64),
  folder_id: null,
  created_at: stamp,
  updated_at: stamp,
}));

test("separate API origin: login navigation, cookie/CSRF, uploads, previews, avatars, downloads and logout", async ({
  page,
}) => {
  const image = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "#47735c" },
  })
    .png()
    .toBuffer();
  const requests: {
    path: string;
    method: string;
    cookie: string;
    csrf: string;
    body: string;
    origin: string;
  }[] = [];
  const policyViolations: string[] = [];
  await page.exposeFunction("recordPolicyViolation", (directive: string) =>
    policyViolations.push(directive),
  );
  await page.addInitScript(() =>
    document.addEventListener("securitypolicyviolation", (e) => {
      if (e.effectiveDirective === "connect-src")
        (
          window as unknown as {
            recordPolicyViolation: (value: string) => void;
          }
        ).recordPolicyViolation(e.blockedURI);
    }),
  );
  const server = createServer(async (req, res) => {
    const path = new URL(req.url!, api).pathname.replace("/api/v1", "");
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString();
    requests.push({
      path,
      method: req.method!,
      cookie: req.headers.cookie ?? "",
      csrf: String(req.headers["x-csrf-token"] ?? ""),
      body,
      origin: req.headers.origin ?? "",
    });
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.setHeader("Access-Control-Allow-Headers", "content-type, x-csrf-token");
    const send = (value: unknown, status = 200) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(value));
    };
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (path === "/auth/login") {
      res.writeHead(303, {
        "Set-Cookie":
          "cross-session=authenticated; Path=/api; HttpOnly; SameSite=Lax",
        Location: `${origin}/projects`,
      });
      res.end();
      return;
    }
    if (!req.headers.cookie?.includes("cross-session=authenticated"))
      return send(
        { error: { code: "unauthenticated", message: "Sign in" } },
        401,
      );
    if (
      !["GET", "HEAD"].includes(req.method!) &&
      req.headers["x-csrf-token"] !== "cross-csrf"
    )
      return send(
        { error: { code: "csrf_invalid", message: "Missing CSRF" } },
        403,
      );
    const avatar = `/api/v1/members/${uid}/avatar?v=1`;
    if (path === "/auth/session")
      return send({
        user: {
          id: uid,
          display_name: "Cross Origin",
          email: "cross@example.test",
          role: "member",
          can_manage_attendance: false,
          avatar_url: avatar,
        },
        csrf_token: "cross-csrf",
      });
    if (path === "/auth/logout") {
      res.writeHead(204, {
        "Set-Cookie":
          "cross-session=; Path=/api; Max-Age=0; HttpOnly; SameSite=Lax",
      });
      res.end();
      return;
    }
    if (path === `/members/${uid}/avatar`) {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(image);
      return;
    }
    if (path === "/me/avatar")
      return send({
        avatar_url: `${api}/members/${uid}/avatar?v=2`,
        avatar_version: "2",
        content_type: "image/png",
        byte_size: image.length,
        width: 32,
        height: 32,
        updated_at: stamp,
      });
    if (path === "/projects") return send(list([project]));
    if (path === `/projects/${pid}`) return send(project);
    if (path.endsWith("/folders") || path.endsWith("/links"))
      return send(list([]));
    if (path.endsWith("/documentation"))
      return send({
        id: pid,
        project_id: pid,
        overview_markdown: "# Overview",
        created_at: stamp,
        updated_at: stamp,
      });
    if (path.endsWith("/resources"))
      return send(req.method === "POST" ? resources[0] : list(resources));
    if (path.endsWith("/context-export")) {
      res.writeHead(200, { "Content-Type": "application/zip" });
      res.end(
        Buffer.from("504b0506000000000000000000000000000000000000", "hex"),
      );
      return;
    }
    const index = resources.findIndex((resource) => path.includes(resource.id));
    if (index >= 0 && /\/(content|download)$/.test(path)) {
      res.writeHead(200, { "Content-Type": documents[index].mime });
      res.end(documents[index].body);
      return;
    }
    send(
      { error: { code: "not_found", message: "Unknown test endpoint" } },
      404,
    );
  });
  await new Promise<void>((resolve) =>
    server.listen(4176, "127.0.0.1", resolve),
  );
  try {
    await page.goto("/projects");
    const login = page.getByRole("link", { name: "Continue with Microsoft" });
    await expect(login).toHaveAttribute("href", `${api}/auth/login`);
    await login.click();
    await expect(
      page.locator(".user-trigger .profile-avatar img"),
    ).toBeVisible();
    await page.goto(`/projects/${pid}`);
    await page.getByRole("button", { name: "Upload", exact: true }).click();
    await page.getByLabel("Resource file").setInputFiles({
      name: "notes.md",
      mimeType: "text/markdown",
      buffer: Buffer.from(documents[0].body),
    });
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Upload files", exact: true })
      .click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const upload = requests.find(
      (r) => r.path.endsWith("/resources") && r.method === "POST",
    );
    expect(upload?.body).toContain('filename="notes.md"');
    expect(upload?.body).toContain(documents[0].body);
    for (const [index, resource] of resources.entries()) {
      await page.goto(`/projects/${pid}/resources/${resource.id}`);
      if (index === 0)
        await expect(
          page.getByRole("heading", { name: "Cross origin notes" }),
        ).toBeVisible();
      if (index === 1) {
        await expect(
          page
            .frameLocator("iframe")
            .getByRole("heading", { name: "Cross origin slides" }),
        ).toBeVisible();
        await expect(page.locator("iframe")).toHaveAttribute("sandbox", "");
      }
      if (index === 2)
        await expect(page.locator("iframe")).toHaveAttribute("src", /^blob:/);
      const pending = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download original" }).click();
      const file = await pending;
      expect(file.suggestedFilename()).toBe(resource.filename);
      expect(await readFile((await file.path())!, "utf8")).toBe(
        documents[index].body,
      );
    }
    await page.goto(`/projects/${pid}/documentation`);
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Extract context" }).click();
    expect((await pending).suggestedFilename()).toBe(
      "Cross origin project-context.zip",
    );
    await page.locator(".user-trigger").click();
    await page.getByRole("menuitem", { name: "Profile & appearance" }).click();
    await page
      .getByLabel("Choose profile photo", { exact: true })
      .setInputFiles({
        name: "profile.png",
        mimeType: "image/png",
        buffer: image,
      });
    await page.getByRole("button", { name: "Save photo", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Profile photo saved");
    await expect(
      page.getByLabel("Current profile photo").locator("img"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.locator(".user-trigger").click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(login).toBeVisible();
    for (const request of requests.filter((r) =>
      ["POST", "PUT", "DELETE"].includes(r.method),
    )) {
      expect(request.csrf).toBe("cross-csrf");
      expect(request.cookie).toContain("cross-session=authenticated");
      expect(request.origin).toBe(origin);
    }
    expect(
      requests.some(
        (r) => r.method === "OPTIONS" && r.path.endsWith("/resources"),
      ),
    ).toBe(true);
    expect(
      requests.some((r) => r.method === "PUT" && r.path === "/me/avatar"),
    ).toBe(true);
    expect(policyViolations).toEqual([]);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
