/** Public build configuration, shared with Vite so CSP matches the API client. */
export function normalizeApiBase(value?: string): string {
  const base = value?.trim().replace(/\/+$/, "") || "/api/v1";
  if (base === "/api/v1") return base;
  const url = new URL(base);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/api/v1"
  )
    throw new Error(
      "VITE_API_BASE must be /api/v1 or an HTTPS URL ending in /api/v1",
    );
  return `${url.origin}/api/v1`;
}

/** Resolve backend-relative avatars without sending credentials to arbitrary URLs. */
export function resolveAvatarPath(
  value: string | null | undefined,
  apiBase: string,
  pageOrigin: string,
): string | null {
  if (!value) return null;
  try {
    const api = new URL(apiBase, pageOrigin);
    const url = new URL(value, api.origin);
    if (
      url.origin !== api.origin ||
      url.username ||
      url.password ||
      !/^\/api\/v1\/members\/[a-f\d-]{36}\/avatar$/.test(url.pathname)
    )
      return null;
    return `${url.pathname.slice(api.pathname.length)}${url.search}`;
  } catch {
    return null;
  }
}
