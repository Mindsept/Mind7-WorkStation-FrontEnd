import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseProjectUrl,
  detectProvider,
} from "../../src/features/links/url.ts";
import { projectCover } from "../../src/api/project-covers.ts";
import { validatePhoto } from "../../src/features/profile/photo-validation.ts";

test("project links preserve valid HTTPS paths, query parameters and fragments", () => {
  const value = "https://example.org/docs?q=team%20notes#decisions";
  assert.equal(parseProjectUrl(value)?.href, value);
  assert.equal(
    parseProjectUrl("http://localhost:8000/docs")?.protocol,
    "http:",
  );
});

test("project links reject scripts, credentials and ambiguous separators", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,test",
    "//github.com/repo",
    "https://user:password@example.org",
    "https://example.org\\@evil.org",
    "https://example.org/white space",
    "https://example.org/%0aheader",
    "https://example.org/\u0000",
    "https://",
  ])
    assert.equal(parseProjectUrl(value), undefined, value);
});

test("provider detection uses exact hosts and handles DNS casing", () => {
  assert.equal(detectProvider("https://GITHUB.COM./Mindsept/repo"), "github");
  assert.equal(
    detectProvider("https://docs.google.com/document/d/example"),
    "drive",
  );
  assert.equal(
    detectProvider("https://drive.google.com/drive/folders/example"),
    "drive",
  );
  for (const value of [
    "https://github.com.evil.org",
    "https://evilgithub.com",
    "https://evil.org/github.com",
    "https://github.com@evil.org",
    "https://sub.github.com",
  ]) {
    assert.equal(detectProvider(value), "other");
  }
});

test("persisted cover selection takes priority over legacy ID fallback", () => {
  assert.equal(
    projectCover({
      id: "00000000-0000-4000-8000-000000000000",
      cover_key: "vault",
    }),
    "/assets/covers/vault-v6.webp",
  );
});

test("missing or unknown cover metadata has a stable legacy fallback", () => {
  const id = "00000000-0000-4000-8000-00000000000a";
  const expected = "/assets/covers/observatory-v6.webp";
  assert.equal(projectCover({ id }), expected);
  assert.equal(projectCover({ id, cover_key: "future-cover" }), expected);
  assert.equal(projectCover({ id, cover_key: "__proto__" }), expected);
  assert.equal(projectCover({ id: "invalid" }), "/assets/card-archive-v5.webp");
});

test("photo validation rejects empty, oversized and non-photo files before decoding", async () => {
  await assert.rejects(validatePhoto(new File([], "empty.png")), /5 MiB/);
  await assert.rejects(
    validatePhoto(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png")),
    /5 MiB/,
  );
  await assert.rejects(
    validatePhoto(new File(["<svg></svg>"], "image.svg")),
    /still JPEG/,
  );
  await assert.rejects(
    validatePhoto(new File(["not a PNG"], "fake.png", { type: "image/png" })),
    /still JPEG/,
  );
});

// One static 1x1 PNG; browser pixel decoding is injected at its API boundary.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9d8AAAAASUVORK5CYII=",
  "base64",
);

test("photo validation rejects extension spoofing and excessive dimensions", async () => {
  await assert.rejects(
    validatePhoto(new File([png], "spoof.jpg")),
    /still JPEG/,
  );
  const huge = Buffer.from(png);
  huge.writeUInt32BE(8193, 16);
  await assert.rejects(validatePhoto(new File([huge], "huge.png")), /8,192/);
});

test("valid photo decoding releases the bitmap and requests orientation", async (t) => {
  let closed = false;
  const file = new File([png], "photo.png");
  t.mock.method(
    globalThis,
    "createImageBitmap",
    async (received: File, options: unknown) => {
      assert.equal(received, file);
      assert.deepEqual(options, { imageOrientation: "from-image" });
      return {
        close() {
          closed = true;
        },
      };
    },
  );
  await validatePhoto(file);
  assert.equal(closed, true);
});

test("photo decoder failure returns an actionable validation error", async (t) => {
  t.mock.method(globalThis, "createImageBitmap", async () => {
    throw new Error("decode failed");
  });
  await assert.rejects(
    validatePhoto(new File([png], "photo.png")),
    /still JPEG/,
  );
});

// Node has File/Blob but no browser image decoder. Tests replace this stub only.
Object.defineProperty(globalThis, "createImageBitmap", {
  value: async () => {
    throw new Error("Unexpected image decoding");
  },
  configurable: true,
  writable: true,
});
