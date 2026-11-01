import type { LinkProvider } from "../../api/types";
export function parseProjectUrl(value: string): URL | undefined {
  if (
    !/^https?:\/\//i.test(value) ||
    /[\s\\\u0000-\u001f\u007f]/.test(value) ||
    /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value)
  )
    return;
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    )
      return;
    return url;
  } catch {
    return;
  }
}
export function detectProvider(value: string): LinkProvider {
  const host = parseProjectUrl(value)
    ?.hostname.toLowerCase()
    .replace(/\.$/, "");
  return host === "github.com"
    ? "github"
    : host === "drive.google.com" || host === "docs.google.com"
      ? "drive"
      : "other";
}
