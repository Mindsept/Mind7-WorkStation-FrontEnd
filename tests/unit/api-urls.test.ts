import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeApiBase, resolveAvatarPath } from "../../src/api/urls.ts";

const api = "https://api-ws.mindsept.fr/api/v1";
const front = "https://workstation.mindsept.fr";
const path = "/members/30000000-0000-4000-8000-000000000001/avatar?v=abc";

test("API configuration supports local proxy and explicit production origin", () => {
  assert.equal(normalizeApiBase(), "/api/v1");
  assert.equal(normalizeApiBase(` ${api}/ `), api);
  assert.equal(
    normalizeApiBase("http://127.0.0.1:4176/api/v1"),
    "http://127.0.0.1:4176/api/v1",
  );
  for (const invalid of [
    "https://api-ws.mindsept.fr",
    "//evil.test/api/v1",
    "http://api-ws.mindsept.fr/api/v1",
    `${api}?token=x`,
    `${api}#hash`,
    "https://user:secret@api-ws.mindsept.fr/api/v1",
    "javascript:alert(1)",
  ])
    assert.throws(() => normalizeApiBase(invalid), invalid);
});

test("avatars resolve relative and absolute backend URLs, never third-party or frontend URLs", () => {
  assert.equal(resolveAvatarPath(`/api/v1${path}`, api, front), path);
  assert.equal(resolveAvatarPath(`${api}${path}`, api, front), path);
  assert.equal(resolveAvatarPath(`/api/v1${path}`, "/api/v1", front), path);
  for (const invalid of [
    `${front}/api/v1${path}`,
    `https://evil.test/api/v1${path}`,
    `//evil.test/api/v1${path}`,
    `${api}/auth/logout`,
    `https://user:secret@api-ws.mindsept.fr/api/v1${path}`,
    "data:image/png;base64,abc",
    null,
  ])
    assert.equal(resolveAvatarPath(invalid, api, front), null, String(invalid));
});
