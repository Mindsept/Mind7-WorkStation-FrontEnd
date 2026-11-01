import { checkFluidButton, captureFluid } from "./fluid-button-checks";
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";

const uid = "30000000-0000-4000-8000-000000000001";
const version = "a".repeat(64);
const photoUrl = `/api/v1/members/${uid}/avatar?v=${version}`;
const collection = (items: unknown[]) => ({
  items,
  total: items.length,
  limit: 100,
  offset: 0,
});

async function profileFixture(
  page: Page,
  options: {
    saved?: boolean;
    missingImage?: boolean;
    role?: "admin" | "member";
  } = {},
) {
  let saved = options.saved ?? false;
  let rejectNext = false;
  let release: (() => void) | undefined;
  let blocked = false;
  let reads = 0;
  const writes: {
    method: string;
    body: string;
    csrf?: string;
    cookie?: string;
  }[] = [];
  const image = await sharp({
    create: { width: 96, height: 64, channels: 3, background: "#47735c" },
  })
    .png()
    .toBuffer();
  const delivered = await sharp(image)
    .resize(64, 64, { fit: "cover" })
    .webp()
    .toBuffer();
  await page.context().addCookies([
    {
      name: "workstation",
      value: "profile-session",
      url: "http://127.0.0.1:4173",
    },
  ]);
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname.replace("/api/v1", "");
    const metadata = {
      avatar_url: saved ? photoUrl : null,
      avatar_version: saved ? version : null,
    };
    if (path === "/auth/session")
      return route.fulfill({
        json: {
          user: {
            id: uid,
            display_name: "Profile Tester",
            email: "profile@example.com",
            role: options.role ?? "member",
            can_manage_attendance: true,
            ...metadata,
          },
          csrf_token: "profile-csrf",
        },
      });
    if (path === "/projects") return route.fulfill({ json: collection([]) });
    if (path === "/members")
      return route.fulfill({
        json: collection([
          {
            id: uid,
            display_name: "Profile Tester",
            email: "profile@example.com",
            active: true,
            created_at: "2026-11-01T09:00:00Z",
            updated_at: "2026-11-01T09:00:00Z",
            ...metadata,
          },
        ]),
      });
    if (path === "/attendance/summary")
      return route.fulfill({
        json: collection([{ member_id: uid, late_count: 0, absence_count: 0 }]),
      });
    if (path === "/attendance/events")
      return route.fulfill({ json: collection([]) });
    if (path === `/members/${uid}/avatar`) {
      reads++;
      if (!saved || options.missingImage)
        return route.fulfill({
          status: 404,
          json: {
            error: { code: "avatar_not_found", message: "Photo unavailable" },
          },
        });
      return route.fulfill({ contentType: "image/webp", body: delivered });
    }
    if (path === "/me/avatar") {
      writes.push({
        method: request.method(),
        body: request.postData() ?? "",
        csrf: request.headers()["x-csrf-token"],
        cookie: request.headers().cookie,
      });
      if (blocked)
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      if (rejectNext) {
        rejectNext = false;
        return route.fulfill({
          status: 503,
          json: {
            error: {
              code: "avatar_busy",
              message: "Photo processing is busy. Please try again.",
            },
          },
        });
      }
      if (request.method() === "DELETE") {
        saved = false;
        return route.fulfill({ status: 204 });
      }
      saved = true;
      return route.fulfill({
        json: {
          avatar_url: photoUrl,
          avatar_version: version,
          content_type: "image/webp",
          byte_size: delivered.length,
          width: 64,
          height: 64,
          updated_at: "2026-11-01T09:00:00Z",
        },
      });
    }
    return route.fulfill({
      status: 404,
      json: {
        error: { code: "not_found", message: "Unknown profile fixture route" },
      },
    });
  });
  return {
    image,
    writes,
    failNext: () => {
      rejectNext = true;
    },
    block: () => {
      blocked = true;
    },
    release: () => {
      blocked = false;
      release?.();
    },
    reads: () => reads,
  };
}
async function openProfile(page: Page) {
  await page.locator(".user-trigger").click();
  await page.getByRole("menuitem", { name: "Profile & appearance" }).click();
  await expect(
    page.getByRole("dialog", { name: "Profile & appearance" }),
  ).toBeVisible();
}

for (const width of [1440, 390]) {
  test(`profile preview, multipart CSRF, pending duplicate guard, failure retention, retry and reload persistence ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({
      reducedMotion: width === 390 ? "reduce" : "no-preference",
    });
    const fixture = await profileFixture(page, { saved: true });
    await page.goto("/projects");
    await expect(
      page.locator(".user-trigger .profile-avatar img"),
    ).toBeVisible();
    await openProfile(page);
    await page
      .getByLabel("Choose profile photo", { exact: true })
      .setInputFiles({
        name: "selected.png",
        mimeType: "image/png",
        buffer: fixture.image,
      });
    await expect(page.getByAltText("Selected photo preview")).toBeVisible();
    await expect(
      page.getByText(/center-cropped to a square, up to 512/),
    ).toBeVisible();
    fixture.failNext();
    fixture.block();
    const save = page.getByRole("button", { name: "Save photo", exact: true });
    await checkFluidButton(save, false);
    await captureFluid(page, `profile-${width}-idle`);
    await save.focus();
    const size = await save.boundingBox();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await expect(save).toHaveAttribute("aria-busy", "true");
    await expect(save).toBeFocused();
    await expect(save.locator(".action-loader")).toBeVisible();
    await checkFluidButton(save, true, size);
    await captureFluid(page, `profile-${width}-pending`);
    const busySize = await save.boundingBox();
    expect(busySize?.width).toBe(size?.width);
    expect(busySize?.height).toBe(size?.height);
    await expect.poll(() => fixture.writes.length).toBe(1);
    await expect(page.getByAltText("Selected photo preview")).toBeVisible();
    await expect(
      page.getByLabel("Current profile photo").locator("img"),
    ).toBeVisible();
    await page.screenshot({ path: "artifacts/profile/profile-busy.png" });
    fixture.release();
    await expect(page.getByRole("alert")).toContainText(
      "Photo processing is busy",
    );
    await expect(save).toBeEnabled();
    await checkFluidButton(save, false);
    await captureFluid(page, `profile-${width}-error`);
    await expect(page.getByAltText("Selected photo preview")).toBeVisible();
    await expect(
      page.getByLabel("Current profile photo").locator("img"),
    ).toBeVisible();
    await save.click();
    await expect(page.getByRole("status")).toContainText("Profile photo saved");
    await checkFluidButton(save, false);
    await captureFluid(page, `profile-${width}-success`);
    expect(fixture.writes).toHaveLength(2);
    for (const request of fixture.writes) {
      expect(request.method).toBe("PUT");
      expect(request.csrf).toBe("profile-csrf");
      expect(request.cookie).toContain("profile-session");
      expect(request.body).toContain('name="file"; filename="selected.png"');
      expect(
        request.body.match(/Content-Disposition: form-data/g) ?? [],
      ).toHaveLength(1);
      expect(request.body).not.toContain('name="member_id"');
    }
    await page.getByRole("button", { name: "Close dialog" }).click();
    await expect(page.locator(".user-trigger")).toBeFocused();
    await page.reload();
    await expect(
      page.locator(".user-trigger .profile-avatar img"),
    ).toBeVisible();
    await openProfile(page);
    fixture.block();
    await page
      .getByRole("button", { name: "Remove photo", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Remove photo", exact: true }),
    ).toHaveAttribute("aria-busy", "true");
    fixture.release();
    await expect(page.getByRole("status")).toContainText(
      "Profile photo removed",
    );
    await expect(page.locator(".user-trigger .profile-avatar img")).toHaveCount(
      0,
    );
    await expect(page.getByLabel("Current profile photo")).toHaveText("PT");
    await page.reload();
    await expect(page.locator(".user-trigger .profile-avatar")).toHaveText(
      "PT",
    );
    expect(fixture.writes.at(-1)?.method).toBe("DELETE");
  });
}

test("invalid photos never upload and missing saved photo falls back without retry loops", async ({
  page,
}) => {
  const fixture = await profileFixture(page, {
    saved: true,
    missingImage: true,
    role: "admin",
  });
  await page.goto("/projects");
  await expect(page.locator(".user-trigger .profile-avatar")).toHaveText("PT");
  await openProfile(page);
  const input = page.getByLabel("Choose profile photo", { exact: true });
  const excessiveDimensions = Buffer.from(fixture.image);
  excessiveDimensions.writeUInt32BE(9000, 16);
  const animationChunk = Buffer.alloc(20);
  animationChunk.writeUInt32BE(8, 0);
  animationChunk.write("acTL", 4);
  const animatedPng = Buffer.concat([
    fixture.image.subarray(0, 33),
    animationChunk,
    fixture.image.subarray(33),
  ]);
  for (const file of [
    {
      name: "unsafe.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    },
    { name: "spoof.jpg", mimeType: "image/jpeg", buffer: fixture.image },
    {
      name: "excessive.png",
      mimeType: "image/png",
      buffer: excessiveDimensions,
    },
    { name: "animated.png", mimeType: "image/png", buffer: animatedPng },
    {
      name: "huge.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    },
  ]) {
    await input.setInputFiles(file);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save photo", exact: true }),
    ).toBeDisabled();
  }
  expect(fixture.writes).toHaveLength(0);
  expect(fixture.reads()).toBeLessThanOrEqual(2);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.locator(".user-trigger")).toBeFocused();
});

test("profile dialog remains keyboard accessible and fits tablet/mobile with reduced motion", async ({
  page,
}) => {
  await profileFixture(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/projects");
    await page.locator(".user-trigger").focus();
    await page.keyboard.press("Enter");
    await page
      .getByRole("menuitem", { name: "Profile & appearance" })
      .press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(page.locator(".user-trigger")).toBeFocused();
  }
});
