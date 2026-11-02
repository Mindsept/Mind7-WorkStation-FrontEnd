import type {
  AvatarOut,
  Folder,
  FolderInput,
  ResourcePatch,
  ProjectLink,
  LinkInput,
  AttendanceEvent,
  AttendanceFilters,
  AttendanceInput,
  Documentation,
  ErrorBody,
  MembersPage,
  Page,
  Project,
  ProjectInput,
  Resource,
  Session,
  Summary,
} from "./types";
import { normalizeApiBase } from "./urls";
export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE);
export const maxUploadBytes =
  (Number(import.meta.env.VITE_MAX_UPLOAD_MB) || 20) * 1024 * 1024;
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
let csrfToken = "";
export function clearSession() {
  csrfToken = "";
}
function authFailure(error: ApiError) {
  if (error.status === 401)
    window.dispatchEvent(new CustomEvent("session-expired"));
  if (
    error.status === 403 &&
    [
      "access_denied",
      "not_whitelisted",
      "member_inactive",
      "whitelist_denied",
    ].includes(error.code)
  )
    window.dispatchEvent(new CustomEvent("access-denied"));
}
async function responseError(response: Response): Promise<never> {
  const body = (await response.json().catch(() => null)) as ErrorBody | null;
  const error = new ApiError(
    response.status,
    body?.error?.code || "request_failed",
    body?.error?.message ||
      `Request failed (${response.status}). Please try again.`,
    body?.error?.details,
  );
  authFailure(error);
  throw error;
}
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method || "GET";
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method))
    headers.set("X-CSRF-Token", csrfToken);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });
  if (!response.ok) return responseError(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
function query(params: object) {
  const values = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  return new URLSearchParams(values.map(([k, v]) => [k, String(v)])).toString();
}
async function all<T, P extends Page<T> = Page<T>>(
  path: string,
  filters: object = {},
): Promise<P> {
  const first = await request<P>(
    `${path}?${query({ ...filters, limit: 100, offset: 0 })}`,
  );
  const items = [...first.items];
  while (items.length < first.total) {
    const next = await request<Page<T>>(
      `${path}?${query({ ...filters, limit: 100, offset: items.length })}`,
    );
    if (!next.items.length) break;
    items.push(...next.items);
  }
  return { ...first, items };
}
const json = (method: string, data: unknown) => ({
  method,
  body: JSON.stringify(data),
});
export const api = {
  session: async () => {
    const session = await request<Session>("/auth/session");
    csrfToken = session.csrf_token;
    return session;
  },
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  saveAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<AvatarOut>("/me/avatar", { method: "PUT", body: form });
  },
  removeAvatar: () => request<void>("/me/avatar", { method: "DELETE" }),
  projects: () => all<Project>("/projects"),
  project: (id: string) => request<Project>(`/projects/${id}`),
  saveProject: (data: ProjectInput, id?: string) =>
    request<Project>(
      id ? `/projects/${id}` : "/projects",
      json(id ? "PATCH" : "POST", data),
    ),
  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, { method: "DELETE" }),
  documentation: (id: string) =>
    request<Documentation>(`/projects/${id}/documentation`),
  saveDocumentation: (id: string, overview_markdown: string) =>
    request<Documentation>(
      `/projects/${id}/documentation`,
      json("PUT", { overview_markdown }),
    ),
  folders: (id: string) => all<Folder>(`/projects/${id}/folders`),
  saveFolder: (pid: string, data: FolderInput, id?: string) =>
    request<Folder>(
      `/projects/${pid}/folders${id ? `/${id}` : ""}`,
      json(id ? "PATCH" : "POST", data),
    ),
  deleteFolder: (pid: string, id: string) =>
    request<void>(`/projects/${pid}/folders/${id}`, { method: "DELETE" }),
  patchResource: (pid: string, id: string, data: ResourcePatch) =>
    request<Resource>(`/projects/${pid}/resources/${id}`, json("PATCH", data)),
  saveMarkdown: (
    pid: string,
    id: string,
    content_markdown: string,
    expected_sha256: string,
  ) =>
    request<Resource>(
      `/projects/${pid}/resources/${id}/content`,
      json("PUT", { content_markdown, expected_sha256 }),
    ),
  links: (pid: string) => all<ProjectLink>(`/projects/${pid}/links`),
  saveLink: (pid: string, data: LinkInput, id?: string) =>
    request<ProjectLink>(
      `/projects/${pid}/links${id ? `/${id}` : ""}`,
      json(id ? "PATCH" : "POST", data),
    ),
  deleteLink: (pid: string, id: string) =>
    request<void>(`/projects/${pid}/links/${id}`, { method: "DELETE" }),
  resources: (id: string) => all<Resource>(`/projects/${id}/resources`),
  renameResource: (pid: string, rid: string, title: string) =>
    request<Resource>(
      `/projects/${pid}/resources/${rid}`,
      json("PATCH", { title }),
    ),
  deleteResource: (pid: string, rid: string) =>
    request<void>(`/projects/${pid}/resources/${rid}`, { method: "DELETE" }),
  members: () => all<MembersPage["items"][number], MembersPage>("/members"),
  events: (filters: AttendanceFilters) =>
    all<AttendanceEvent>("/attendance/events", filters),
  summary: (filters: AttendanceFilters) =>
    all<Summary>("/attendance/summary", filters),
  saveEvent: (data: AttendanceInput, id?: string) =>
    request<AttendanceEvent>(
      id ? `/attendance/events/${id}` : "/attendance/events",
      json(id ? "PATCH" : "POST", data),
    ),
  deleteEvent: (id: string) =>
    request<void>(`/attendance/events/${id}`, { method: "DELETE" }),
};
export async function getContent(
  path: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    signal,
  });
  if (!response.ok) return responseError(response);
  return response.blob();
}
export async function download(path: string, filename: string) {
  const blob = await getContent(path);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/[/\\]/g, "-");
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
export function uploadResource(
  projectId: string,
  file: File,
  title: string,
  onProgress: (value: number) => void,
  folderId: string | null = null,
): Promise<Resource> {
  const form = new FormData();
  form.append("file", file);
  if (folderId) form.append("folder_id", folderId);
  if (title.trim()) form.append("title", title.trim());
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/projects/${projectId}/resources`);
    xhr.withCredentials = true;
    xhr.timeout = 120_000;
    xhr.setRequestHeader("X-CSRF-Token", csrfToken);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () =>
      reject(
        new Error("Upload interrupted. Check your connection and try again."),
      );
    xhr.ontimeout = () =>
      reject(
        new Error(
          "Upload timed out. Refresh the resource list before trying again.",
        ),
      );
    xhr.onload = () => {
      let body: Resource | ErrorBody;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("The server returned an unreadable upload response."));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as Resource);
      else {
        const err = body as ErrorBody;
        const error = new ApiError(
          xhr.status,
          err.error?.code || "upload_failed",
          err.error?.message || "Upload failed.",
          err.error?.details,
        );
        authFailure(error);
        reject(error);
      }
    };
    xhr.send(form);
  });
}
