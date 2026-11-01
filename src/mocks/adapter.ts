import { COVER_KEYS } from "../api/project-covers";
import { ApiError } from "../api/client";
import { detectProvider, parseProjectUrl } from "../features/links/url";
import { validatePhoto } from "../features/profile/photo-validation";
import type {
  AvatarOut,
  Folder,
  ProjectLink,
  AttendanceEvent,
  AttendanceInput,
  Documentation,
  Member,
  Project,
  Resource,
  Session,
} from "../api/types";
const stamp = "2026-10-31T09:00:00Z";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const members: Member[] = [
  {
    id: id(1),
    display_name: "Alex Morgan",
    email: "alex@example.com",
    active: true,
    created_at: stamp,
    updated_at: stamp,
  },
  {
    id: id(2),
    display_name: "Camille Laurent",
    email: "camille@example.com",
    active: true,
    created_at: stamp,
    updated_at: stamp,
  },
  {
    id: id(3),
    display_name: "Sam Rivera",
    email: "sam@example.com",
    active: true,
    created_at: stamp,
    updated_at: stamp,
  },
  {
    id: id(4),
    display_name: "Noor Bennett",
    email: "noor@example.com",
    active: true,
    created_at: stamp,
    updated_at: stamp,
  },
];
// All fixture members have signed in; Sam and Noor have no attendance events.
let projects: Project[] = [
  {
    id: id(10),
    cover_key: "archive",
    title: "WorkStation",
    description:
      "One shared home for the team. Project knowledge, presentation decks and the details that keep us moving together.",
    creator_id: id(1),
    created_at: "2026-10-20T08:00:00Z",
    updated_at: stamp,
  },
  {
    id: id(11),
    cover_key: "gallery",
    title: "Brand & identity",
    description:
      "The MindSept visual language. Our foundations, design references and decisions in one place.",
    creator_id: id(2),
    created_at: "2026-10-16T10:00:00Z",
    updated_at: "2026-10-29T14:20:00Z",
  },
  {
    id: id(12),
    cover_key: "conservatory",
    title: "Team playbook",
    description:
      "How we work together, from the first day to the next release. A living collection of shared practices.",
    creator_id: id(1),
    created_at: "2026-10-12T08:00:00Z",
    updated_at: "2026-10-28T11:00:00Z",
  },
];
let documents: Documentation[] = projects.map((p) => ({
  id: crypto.randomUUID(),
  project_id: p.id,
  overview_markdown: `# ${p.title}\n\nThis is an **explicit demonstration workspace**. Changes reset when the page reloads.\n\n## Working together\n\nKeep project decisions and source files close to the work.\n\n- Upload a self-contained HTML presentation\n- Add Markdown notes or a PDF\n- Keep this overview up to date\n\n## Resource guide\n\n| Format | Use |\n| --- | --- |\n| HTML | Presentation decks |\n| Markdown | Decisions and notes |\n| PDF | Reference documents |\n\n\`\`\`text\nShared context makes the next step clearer.\n\`\`\``,
  created_at: stamp,
  updated_at: stamp,
}));
let resources: Resource[] = [];
let folders: Folder[] = [];
let links: ProjectLink[] = [];
const contents = new Map<string, Blob>();
const avatars = new Map<string, { blob: Blob; metadata: AvatarOut }>();
function avatarMetadata(memberId: string) {
  const stored = avatars.get(memberId)?.metadata;
  return {
    avatar_url: stored?.avatar_url ?? null,
    avatar_version: stored?.avatar_version ?? null,
  };
}
async function saveMockAvatar(file: File): Promise<AvatarOut> {
  await validatePhoto(file);
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const size = Math.min(512, bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "white";
  context.fillRect(0, 0, size, size);
  const sourceSize = Math.min(bitmap.width, bitmap.height);
  context.drawImage(
    bitmap,
    (bitmap.width - sourceSize) / 2,
    (bitmap.height - sourceSize) / 2,
    sourceSize,
    sourceSize,
    0,
    0,
    size,
    size,
  );
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("Could not prepare the demo photo.")),
      "image/webp",
      0.85,
    ),
  );
  const avatar_version = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
    ),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
  const metadata: AvatarOut = {
    avatar_url: `/api/v1/members/${id(1)}/avatar?v=${avatar_version}`,
    avatar_version,
    content_type: blob.type,
    byte_size: blob.size,
    width: size,
    height: size,
    updated_at: new Date().toISOString(),
  };
  avatars.set(id(1), { blob, metadata });
  return metadata;
}
function seedResource(
  n: number,
  title: string,
  resource_type: "html" | "markdown",
  body: string,
) {
  const content_type = resource_type === "html" ? "text/html" : "text/markdown";
  const blob = new Blob([body], { type: content_type });
  const rid = id(n);
  resources.push({
    id: rid,
    project_id: id(10),
    title,
    folder_id: null,
    filename:
      resource_type === "html" ? "project-brief.html" : "getting-started.md",
    original_filename:
      resource_type === "html" ? "project-brief.html" : "getting-started.md",
    resource_type,
    content_type,
    byte_size: blob.size,
    sha256: "demo",
    uploader_id: id(1),
    created_at: stamp,
    updated_at: stamp,
  });
  contents.set(rid, blob);
}
seedResource(
  20,
  "Project brief",
  "html",
  `<!doctype html><html lang="en"><head><style>body{background:#101321;color:#eee8dc;font-family:system-ui;padding:8vw}small{color:#cab080;letter-spacing:.2em}h1{font-size:7vw;font-weight:400}button{padding:14px 24px;background:#c6a66a;border:0;font-size:16px}p{line-height:1.7}</style></head><body><small>MINDSEPT / DEMO PRESENTATION</small><h1 id="title">A home for shared work</h1><p>Projects, documentation and the people behind them.</p><button onclick="document.getElementById('title').textContent='Make the next step clear'">Next slide</button></body></html>`,
);
seedResource(21, "Getting started", "markdown", documents[0].overview_markdown);
let events: AttendanceEvent[] = [
  {
    id: id(30),
    member_id: id(1),
    event_type: "late",
    event_date: "2026-10-29",
    minutes_late: 10,
    note: "Train delay",
    creator_id: id(1),
    editor_id: id(1),
    created_at: stamp,
    updated_at: stamp,
  },
  {
    id: id(31),
    member_id: id(2),
    event_type: "absent",
    event_date: "2026-10-27",
    note: "Recorded by a team member",
    creator_id: id(1),
    editor_id: id(1),
    created_at: stamp,
    updated_at: stamp,
  },
];
let identity: "member" | "signed-out" | "denied" | "expired" =
  new URLSearchParams(window.location.search).get("preview") === "signed-out"
    ? "signed-out"
    : "member";
export function setMockIdentity(value: typeof identity) {
  identity = value;
}
const missing = () => {
  throw new ApiError(404, "not_found", "This item no longer exists.");
};
export async function mockRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = new URL(path, "https://mock.invalid");
  const parts = url.pathname.split("/").filter(Boolean);
  const method = options.method || "GET";
  const data =
    typeof options.body === "string" ? JSON.parse(options.body) : undefined;
  const now = new Date().toISOString();
  const page = <V>(items: V[]) => {
    const offset = Number(url.searchParams.get("offset") || 0),
      limit = Number(url.searchParams.get("limit") || 100);
    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
      limit,
      offset,
    };
  };
  const result = await (async () => {
    if (parts[0] === "auth") {
      if (parts[1] === "logout") {
        identity = "signed-out";
        return undefined;
      }
      if (identity === "denied")
        throw new ApiError(
          403,
          "access_denied",
          "Your account is not on the active team whitelist.",
        );
      if (identity === "signed-out" || identity === "expired")
        throw new ApiError(
          401,
          identity === "expired" ? "session_expired" : "unauthenticated",
          "Sign in to continue.",
        );
      return {
        user: {
          id: id(1),
          display_name: "Alex Morgan",
          email: "alex@example.com",
          role: "member",
          can_manage_attendance: true,
          ...avatarMetadata(id(1)),
        },
        csrf_token: "development-only-csrf",
      } satisfies Session;
    }
    if (identity !== "member")
      throw new ApiError(401, "unauthenticated", "Sign in to continue.");
    if (parts[0] === "me" && parts[1] === "avatar") {
      if (method === "DELETE") {
        avatars.delete(id(1));
        return undefined;
      }
      if (method === "PUT" && options.body instanceof FormData) {
        const entries = [...options.body.entries()];
        if (
          entries.length !== 1 ||
          entries[0][0] !== "file" ||
          !(entries[0][1] instanceof File)
        )
          throw new ApiError(
            422,
            "invalid_multipart",
            "Choose exactly one profile photo.",
          );
        return saveMockAvatar(entries[0][1]);
      }
      return missing();
    }
    if (parts[0] === "members")
      return {
        ...page(
          members.map((member) => ({
            ...member,
            ...avatarMetadata(member.id),
          })),
        ),
        directory_status: {
          last_success_at: stamp,
          stale: false,
          error_code: null,
          max_age_seconds: 0,
        },
      };
    if (parts[0] === "projects") {
      if (parts.length === 1) {
        if (method === "GET") return page(projects);
        const project: Project = {
          ...data,
          cover_key:
            COVER_KEYS[crypto.getRandomValues(new Uint8Array(1))[0] % 8],
          id: crypto.randomUUID(),
          creator_id: id(1),
          created_at: now,
          updated_at: now,
        };
        projects.unshift(project);
        documents.push({
          id: crypto.randomUUID(),
          project_id: project.id,
          overview_markdown: "",
          created_at: now,
          updated_at: now,
        });
        return project;
      }
      const project = projects.find((p) => p.id === parts[1]);
      if (!project) return missing();
      if (parts.length === 2) {
        if (method === "PATCH") {
          Object.assign(project, data, { updated_at: now });
          return project;
        }
        if (method === "DELETE") {
          projects = projects.filter((p) => p.id !== project.id);
          documents = documents.filter((d) => d.project_id !== project.id);
          resources
            .filter((r) => r.project_id === project.id)
            .forEach((r) => contents.delete(r.id));
          resources = resources.filter((r) => r.project_id !== project.id);
          folders = folders.filter((f) => f.project_id !== project.id);
          links = links.filter((l) => l.project_id !== project.id);
          return undefined;
        }
        return project;
      }
      if (parts[2] === "documentation") {
        const doc = documents.find((d) => d.project_id === project.id)!;
        if (method === "PUT") Object.assign(doc, data, { updated_at: now });
        return doc;
      }
      const validParent = (parent: string | null) => {
        if (
          parent !== null &&
          !folders.some((f) => f.id === parent && f.project_id === project.id)
        )
          missing();
      };
      const checkName = (
        name: string,
        parent: string | null,
        skip?: string,
      ) => {
        if (
          typeof name !== "string" ||
          !name ||
          name.trim() !== name ||
          new TextEncoder().encode(name).length > 255 ||
          /[\\/<>:"|?*\p{Cc}\p{Cf}]/u.test(name) ||
          name.endsWith(".") ||
          /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)
        )
          throw new ApiError(
            422,
            "invalid_name",
            "Use a valid name without path separators or reserved characters.",
          );
        const normalized = (x: string) =>
          x
            .normalize("NFC")
            .toLowerCase()
            .replaceAll("ß", "ss")
            .replaceAll("ς", "σ");
        if (
          folders.some(
            (f) =>
              f.project_id === project.id &&
              f.parent_id === parent &&
              f.id !== skip &&
              normalized(f.name) === normalized(name),
          ) ||
          resources.some(
            (r) =>
              r.project_id === project.id &&
              r.folder_id === parent &&
              r.id !== skip &&
              normalized(r.filename) === normalized(name),
          )
        )
          throw new ApiError(
            409,
            "name_conflict",
            "An item with this name already exists in the destination folder.",
          );
      };
      if (parts[2] === "folders") {
        if (method === "GET")
          return page(folders.filter((f) => f.project_id === project.id));
        const folder = parts[3]
          ? folders.find(
              (f) => f.id === parts[3] && f.project_id === project.id,
            )
          : undefined;
        if (parts[3] && !folder) return missing();
        if (method === "DELETE") {
          if (
            folders.some((f) => f.parent_id === folder!.id) ||
            resources.some((r) => r.folder_id === folder!.id)
          )
            throw new ApiError(
              409,
              "folder_not_empty",
              "This folder is not empty. Move or delete its contents first.",
            );
          folders = folders.filter((f) => f.id !== folder!.id);
          return undefined;
        }
        const parent =
          data.parent_id !== undefined
            ? data.parent_id
            : (folder?.parent_id ?? null);
        validParent(parent);
        let ancestor = parent,
          depth = 1;
        while (ancestor) {
          if (ancestor === folder?.id)
            throw new ApiError(
              422,
              "folder_cycle",
              "A folder cannot be moved into itself or its descendants.",
            );
          depth++;
          ancestor = folders.find((f) => f.id === ancestor)?.parent_id ?? null;
        }
        const subtreeDepth = (id: string): number =>
          Math.max(
            0,
            ...folders
              .filter((f) => f.parent_id === id)
              .map((f) => 1 + subtreeDepth(f.id)),
          );
        if (depth + (folder ? subtreeDepth(folder.id) : 0) > 16)
          throw new ApiError(
            422,
            "folder_depth_exceeded",
            "Folders support at most 16 levels.",
          );
        if (
          !folder &&
          folders.filter((f) => f.project_id === project.id).length >= 1000
        )
          throw new ApiError(
            413,
            "folder_limit_exceeded",
            "This project has reached its folder limit.",
          );
        const name = data.name ?? folder?.name;
        checkName(name, parent, folder?.id);
        if (folder) {
          Object.assign(folder, {
            name: name.normalize("NFC"),
            parent_id: parent,
            updated_at: now,
          });
          return folder;
        }
        const created: Folder = {
          id: crypto.randomUUID(),
          project_id: project.id,
          name: name.normalize("NFC"),
          parent_id: parent,
          created_at: now,
          updated_at: now,
        };
        folders.push(created);
        return created;
      }
      if (parts[2] === "links") {
        if (method === "GET")
          return page(links.filter((l) => l.project_id === project.id));
        const link = parts[3]
          ? links.find((l) => l.id === parts[3] && l.project_id === project.id)
          : undefined;
        if (parts[3] && !link) return missing();
        if (method === "DELETE") {
          links = links.filter((l) => l.id !== link!.id);
          return undefined;
        }
        const title = data.title ?? link?.title,
          url = data.url ?? link?.url;
        if (
          !title?.trim() ||
          title.length > 200 ||
          !parseProjectUrl(url) ||
          url.length > 2048
        )
          throw new ApiError(
            422,
            "invalid_url",
            "Enter a valid label and absolute HTTP or HTTPS URL.",
          );
        if (
          !link &&
          links.filter((l) => l.project_id === project.id).length >= 100
        )
          throw new ApiError(
            413,
            "link_limit_exceeded",
            "This project has reached its link limit.",
          );
        if (link) {
          Object.assign(link, {
            title,
            url,
            provider: detectProvider(url),
            updated_at: now,
          });
          return link;
        }
        const created: ProjectLink = {
          id: crypto.randomUUID(),
          project_id: project.id,
          title,
          url,
          provider: detectProvider(url),
          created_at: now,
          updated_at: now,
        };
        links.push(created);
        return created;
      }
      if (parts[2] === "resources") {
        if (parts.length === 3) {
          if (method === "GET")
            return page(resources.filter((r) => r.project_id === project.id));
          const form = options.body as FormData;
          const file = form.get("file") as File;
          const folder_id = String(form.get("folder_id") || "") || null;
          validParent(folder_id);
          checkName(file.name, folder_id);
          const ext = file.name.split(".").pop()?.toLowerCase();
          const resource_type =
            ext === "pdf" ? "pdf" : ext === "html" ? "html" : "markdown";
          const resource: Resource = {
            id: crypto.randomUUID(),
            project_id: project.id,
            title: String(form.get("title") || file.name),
            original_filename: file.name,
            filename: file.name.normalize("NFC"),
            folder_id,
            resource_type,
            content_type: file.type,
            byte_size: file.size,
            sha256: "demo",
            uploader_id: id(1),
            created_at: now,
            updated_at: now,
          };
          resources.unshift(resource);
          contents.set(resource.id, file);
          return resource;
        }
        const resource = resources.find(
          (r) => r.project_id === project.id && r.id === parts[3],
        );
        if (!resource) return missing();
        if (method === "PUT" && parts[4] === "content") {
          if (resource.resource_type !== "markdown")
            throw new ApiError(
              415,
              "resource_not_editable",
              "Only Markdown files can be edited.",
            );
          const old = contents.get(resource.id)!;
          const digest = async (blob: Blob) =>
            Array.from(
              new Uint8Array(
                await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
              ),
            )
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");
          if (
            data.expected_sha256 &&
            data.expected_sha256 !== (await digest(old))
          )
            throw new ApiError(
              409,
              "content_conflict",
              "The file changed since you opened it. Compare the latest version before saving.",
            );
          if (
            typeof data.content_markdown !== "string" ||
            data.content_markdown.length > 500000
          )
            throw new ApiError(
              422,
              "validation_error",
              "Markdown must be at most 500,000 characters.",
            );
          const blob = new Blob([data.content_markdown], {
            type: resource.content_type,
          });
          contents.set(resource.id, blob);
          Object.assign(resource, {
            byte_size: blob.size,
            sha256: await digest(blob),
            updated_at: now,
          });
          return resource;
        }
        if (method === "PATCH") {
          const target =
            data.folder_id !== undefined ? data.folder_id : resource.folder_id;
          validParent(target);
          checkName(data.filename ?? resource.filename, target, resource.id);
          if (
            data.filename &&
            data.filename.split(".").pop()?.toLowerCase() !==
              resource.filename.split(".").pop()?.toLowerCase()
          )
            throw new ApiError(
              422,
              "invalid_name",
              "Keep the original file extension.",
            );
          Object.assign(resource, data, { updated_at: now });
          return resource;
        }
        if (method === "DELETE") {
          resources = resources.filter((r) => r.id !== resource.id);
          contents.delete(resource.id);
          return undefined;
        }
      }
    }
    if (parts[0] === "attendance") {
      const filtered = events.filter(
        (e) =>
          (!url.searchParams.get("member_id") ||
            e.member_id === url.searchParams.get("member_id")) &&
          (!url.searchParams.get("date_from") ||
            e.event_date >= url.searchParams.get("date_from")!) &&
          (!url.searchParams.get("date_to") ||
            e.event_date <= url.searchParams.get("date_to")!),
      );
      if (method === "GET" && parts[1] === "summary")
        return page(
          members
            .filter(
              (m) =>
                !url.searchParams.get("member_id") ||
                m.id === url.searchParams.get("member_id"),
            )
            .map((m) => ({
              member_id: m.id,
              display_name: m.display_name,
              active: true,
              late_count: filtered.filter(
                (e) => e.member_id === m.id && e.event_type === "late",
              ).length,
              absence_count: filtered.filter(
                (e) => e.member_id === m.id && e.event_type === "absent",
              ).length,
            })),
        );
      if (method === "GET")
        return page(
          filtered.sort((a, b) => b.event_date.localeCompare(a.event_date)),
        );
      const existing = parts[2]
        ? events.find((e) => e.id === parts[2])
        : undefined;
      if (parts[2] && !existing) return missing();
      if (method === "DELETE") {
        events = events.filter((e) => e.id !== parts[2]);
        return undefined;
      }
      const input = data as AttendanceInput;
      if (
        events.some(
          (e) =>
            e.id !== parts[2] &&
            e.member_id === input.member_id &&
            e.event_date === input.event_date,
        )
      )
        throw new ApiError(
          409,
          "attendance_conflict",
          "An event already exists for this member and date. Edit that event instead.",
        );
      if (existing) {
        Object.assign(existing, input, { updated_at: now });
        return existing;
      }
      const event: AttendanceEvent = {
        ...input,
        id: crypto.randomUUID(),
        creator_id: id(1),
        editor_id: id(1),
        created_at: now,
        updated_at: now,
      };
      events.push(event);
      return event;
    }
    return missing();
  })();
  return structuredClone(result) as T;
}
export async function mockContent(path: string): Promise<Blob> {
  if (identity !== "member")
    throw new ApiError(401, "unauthenticated", "Sign in to continue.");
  const url = new URL(path, "https://mock.invalid");
  const avatar = url.pathname.match(/^\/members\/([^/]+)\/avatar$/);
  if (avatar) {
    const stored = avatars.get(avatar[1]);
    if (
      !stored ||
      (url.searchParams.has("v") &&
        url.searchParams.get("v") !== stored.metadata.avatar_version)
    )
      throw new ApiError(
        404,
        "avatar_not_found",
        "This profile photo is no longer available.",
      );
    return stored.blob;
  }
  if (path.endsWith("/context-export"))
    throw new ApiError(
      501,
      "backend_required",
      "Context export requires the backend. No ZIP is generated in demo mode.",
    );
  const resourceId = path.split("/")[4];
  const blob = contents.get(resourceId);
  if (!blob) return missing();
  return blob;
}
