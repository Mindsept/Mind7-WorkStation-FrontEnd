import { useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ChevronRight,
  FileText,
  FolderInput,
  FolderPlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { ActionButton } from "../../components/action-button";
import { ImagesBadge } from "../../components/images-badge";
import { api, download } from "../../api/client";
import type { Folder, Resource } from "../../api/types";
import {
  bytes,
  Confirm,
  dateTime,
  Empty,
  ErrorNotice,
  Loading,
} from "../../components/ui";
import {
  folderPath,
  MarkdownFileEditor,
  MoveDialog,
  NameDialog,
  refreshFiles,
} from "./editors";
import { droppedFiles, UploadDialog } from "./uploads";
type Item =
  { kind: "folder"; value: Folder } | { kind: "file"; value: Resource };
const dragType = "application/x-workstation-item";
export function ResourceCollection({
  projectId,
}: {
  projectId: string;
  documentation?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const folderId = params.get("folder");
  const resources = useQuery({
    queryKey: ["resources", projectId],
    queryFn: () => api.resources(projectId),
  });
  const folders = useQuery({
    queryKey: ["folders", projectId],
    queryFn: () => api.folders(projectId),
  });
  const [search, setSearch] = useState("");
  const [upload, setUpload] = useState<{
    target: string | null;
    files?: File[];
  }>();
  const [naming, setNaming] = useState<{
    folder?: Folder;
    resource?: Resource;
  }>();
  const [editing, setEditing] = useState<{ resource?: Resource }>();
  const [moving, setMoving] = useState<Item>();
  const [removing, setRemoving] = useState<Item>();
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [dropTarget, setDropTarget] = useState<string>();
  const [activeFolder, setActiveFolder] = useState<string>();
  const [pendingItems, setPendingItems] = useState<
    Map<string, "move" | "download">
  >(() => new Map());
  const inFlight = useRef(new Map<string, "move" | "download">());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const start = (key: string, kind: "move" | "download") => {
    if (!mounted.current || inFlight.current.has(key)) return false;
    inFlight.current.set(key, kind);
    setPendingItems(new Map(inFlight.current));
    return true;
  };
  const finish = (key: string) => {
    inFlight.current.delete(key);
    if (mounted.current) setPendingItems(new Map(inFlight.current));
  };
  const heading = useRef<HTMLHeadingElement>(null);
  const client = useQueryClient();
  const allFolders = folders.data?.items ?? [],
    allFiles = resources.data?.items ?? [];
  const path = folderPath(allFolders, folderId);
  const missing =
    !!folderId && !!folders.data && !allFolders.some((f) => f.id === folderId);
  const locationName = (target: string | null) =>
    ["Project root", ...folderPath(allFolders, target).map((f) => f.name)].join(
      " / ",
    );
  const enter = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("folder", id);
    else next.delete("folder");
    setParams(next);
    setSearch("");
    setNotice("");
    requestAnimationFrame(() => heading.current?.focus());
  };
  const startDrag = (e: DragEvent, item: Item) => {
    if (inFlight.current.has(`${item.kind}:${item.value.id}`)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(
      dragType,
      JSON.stringify({ projectId, kind: item.kind, id: item.value.id }),
    );
    e.dataTransfer.effectAllowed = "move";
  };
  const drop = async (e: DragEvent, target: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(undefined);
    setError(undefined);
    if (missing) return;
    if (e.dataTransfer.types.includes("Files")) {
      try {
        const files = droppedFiles(e.dataTransfer);
        if (files.length) setUpload({ target, files });
      } catch (err) {
        setError(err);
      }
      return;
    }
    const data = e.dataTransfer.getData(dragType);
    if (!data) return;
    let operationKey: string | undefined;
    try {
      const item = JSON.parse(data) as {
        projectId: string;
        kind: string;
        id: string;
      };
      if (item.projectId !== projectId)
        throw new Error("Move items within the same project.");
      if (item.kind !== "folder" && item.kind !== "file")
        throw new Error("This item cannot be moved.");
      const key = `${item.kind}:${item.id}`;
      if (!start(key, "move")) return;
      operationKey = key;
      if (item.kind === "folder")
        await api.saveFolder(projectId, { parent_id: target }, item.id);
      else if (item.kind === "file")
        await api.patchResource(projectId, item.id, { folder_id: target });
      else throw new Error("This item cannot be moved.");
      await refreshFiles(client, projectId);
      if (mounted.current) setNotice(`Moved to ${locationName(target)}.`);
    } catch (err) {
      if (mounted.current) setError(err);
    } finally {
      if (operationKey) finish(operationKey);
    }
  };
  const dropProps = (target: string | null) => ({
    onDragOver: (e: DragEvent) => {
      if (
        e.dataTransfer.types.includes("Files") ||
        e.dataTransfer.types.includes(dragType)
      ) {
        e.preventDefault();
        e.stopPropagation();
        setDropTarget(target ?? "root");
      }
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node))
        setDropTarget(undefined);
    },
    onDrop: (e: DragEvent) => void drop(e, target),
  });
  const visibleFolders = allFolders
    .filter(
      (f) =>
        f.parent_id === folderId &&
        f.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const visibleFiles = allFiles
    .filter(
      (f) =>
        (f.folder_id ?? null) === folderId &&
        `${f.filename} ${f.title}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => a.filename.localeCompare(b.filename));
  const total =
    allFolders.filter((f) => f.parent_id === folderId).length +
    allFiles.filter((f) => (f.folder_id ?? null) === folderId).length;
  const actions = (item: Item) => {
    const name = item.kind === "folder" ? item.value.name : item.value.title;
    const key = `${item.kind}:${item.value.id}`;
    const pending = pendingItems.has(key);
    return (
      <div className="explorer-actions">
        {item.kind === "file" && item.value.resource_type === "markdown" && (
          <button
            className="icon-button"
            aria-label={`Edit Markdown ${name}`}
            disabled={pending}
            onClick={() => setEditing({ resource: item.value as Resource })}
          >
            <FileText size={16} />
          </button>
        )}
        <button
          className="icon-button"
          aria-label={`Rename ${name}`}
          disabled={pending}
          onClick={() =>
            setNaming(
              item.kind === "folder"
                ? { folder: item.value }
                : { resource: item.value },
            )
          }
        >
          <Pencil size={16} />
        </button>
        <ActionButton
          className="icon-button"
          aria-label={`Move ${name}`}
          pending={pendingItems.get(key) === "move"}
          disabled={pendingItems.get(key) === "download"}
          onClick={() => setMoving(item)}
        >
          <FolderInput size={16} />
        </ActionButton>
        {item.kind === "file" && (
          <ActionButton
            className="icon-button"
            pending={pendingItems.get(key) === "download"}
            disabled={pendingItems.get(key) === "move"}
            aria-label={`Download ${name}`}
            onClick={async () => {
              if (!start(key, "download")) return;
              setError(undefined);
              try {
                await download(
                  `/projects/${projectId}/resources/${item.value.id}/download`,
                  (item.value as Resource).filename,
                );
                if (mounted.current) setNotice("File downloaded.");
              } catch (err) {
                if (mounted.current) setError(err);
              } finally {
                finish(key);
              }
            }}
          >
            <ArrowDownToLine size={16} />
          </ActionButton>
        )}
        <button
          className="icon-button"
          aria-label={`Delete ${name}`}
          disabled={pending}
          onClick={() => setRemoving(item)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  };
  return (
    <section className="file-explorer" aria-label="Project files">
      <div className="explorer-heading">
        <div>
          <h2 ref={heading} tabIndex={-1}>
            Files
          </h2>
          <p>One shared collection for this project and its documentation.</p>
        </div>
        <div className="explorer-tools">
          <button
            className="button secondary compact"
            disabled={missing}
            onClick={() => setNaming({})}
          >
            <FolderPlus size={16} />
            New folder
          </button>
          <button
            className="button secondary compact"
            disabled={missing}
            onClick={() => setEditing({})}
          >
            <Plus size={16} />
            New file
          </button>
          <button
            className="button primary compact"
            disabled={missing}
            onClick={() => setUpload({ target: folderId })}
          >
            <UploadCloud size={16} />
            Upload
          </button>
        </div>
      </div>
      <div className="explorer-location">
        <nav aria-label="Folder path">
          <button
            aria-current={!folderId ? "location" : undefined}
            onClick={() => enter(null)}
            {...dropProps(null)}
          >
            Project root
          </button>
          {path.map((f) => (
            <span key={f.id}>
              <ChevronRight size={14} />
              <button
                aria-current={f.id === folderId ? "location" : undefined}
                onClick={() => enter(f.id)}
                {...dropProps(f.id)}
              >
                {f.name}
              </button>
            </span>
          ))}
        </nav>
        <label className="search-input">
          <Search size={16} />
          <input
            type="search"
            aria-label="Search current folder"
            placeholder="Search this folder…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <ErrorNotice error={error} />
      {notice && (
        <p className="success" role="status">
          {notice}
        </p>
      )}
      {resources.isPending || folders.isPending ? (
        <Loading label="Loading files…" />
      ) : resources.isError || folders.isError ? (
        <ErrorNotice
          error={resources.error || folders.error}
          retry={() => {
            void resources.refetch();
            void folders.refetch();
          }}
        />
      ) : missing ? (
        <Empty
          title="Folder not found"
          action={
            <button className="button secondary" onClick={() => enter(null)}>
              Back to project root
            </button>
          }
        >
          This folder may have been removed or moved to another project.
        </Empty>
      ) : (
        <>
          <div
            className={`explorer-drop ${dropTarget === (folderId ?? "root") ? "drop-active" : ""}`}
            {...dropProps(folderId)}
          >
            <span>
              <UploadCloud size={18} />
              Drop files here to add to {path.at(-1)?.name ?? "Project root"}
            </span>
            <small>
              {search
                ? `${visibleFolders.length + visibleFiles.length} of ${total}`
                : total}{" "}
              items in this folder
            </small>
          </div>
          <div
            role="list"
            aria-label="Current folder contents"
            className="explorer-list"
            {...dropProps(folderId)}
          >
            {visibleFolders.map((f) => (
              <div
                key={f.id}
                className={`explorer-row folder-row ${dropTarget === f.id ? "drop-active" : ""}`}
                role="listitem"
                draggable
                onDragStart={(e) => startDrag(e, { kind: "folder", value: f })}
                onDragEnd={() => setDropTarget(undefined)}
                {...dropProps(f.id)}
              >
                <button
                  className="explorer-name"
                  onClick={() => enter(f.id)}
                  onMouseEnter={() => setActiveFolder(f.id)}
                  onMouseLeave={() => setActiveFolder(undefined)}
                  onFocus={() => setActiveFolder(f.id)}
                  onBlur={() => setActiveFolder(undefined)}
                >
                  <ImagesBadge
                    active={activeFolder === f.id}
                    types={[
                      ...allFiles
                        .filter((x) => x.folder_id === f.id)
                        .map((x) => x.resource_type),
                      ...allFolders
                        .filter((x) => x.parent_id === f.id)
                        .map(() => "folder" as const),
                    ]}
                  />
                  <span>
                    <strong>{f.name}</strong>
                    <small>
                      Folder ·{" "}
                      {allFolders.filter((x) => x.parent_id === f.id).length +
                        allFiles.filter((x) => x.folder_id === f.id)
                          .length}{" "}
                      items
                    </small>
                  </span>
                </button>
                <span className="explorer-date">{dateTime(f.updated_at)}</span>
                {actions({ kind: "folder", value: f })}
              </div>
            ))}
            {visibleFiles.map((r) => (
              <div
                key={r.id}
                className="explorer-row"
                role="listitem"
                draggable
                onDragStart={(e) => startDrag(e, { kind: "file", value: r })}
                onDragEnd={() => setDropTarget(undefined)}
              >
                <Link
                  className="explorer-name"
                  to={`/projects/${projectId}/resources/${r.id}`}
                >
                  <FileText size={23} />
                  <span>
                    <strong>{r.title}</strong>
                    <small>
                      {r.filename} · {bytes(r.byte_size)} ·{" "}
                      {r.resource_type === "html"
                        ? "HTML slides"
                        : r.resource_type === "pdf"
                          ? "PDF"
                          : "Markdown"}
                    </small>
                  </span>
                </Link>
                <span className="explorer-date">{dateTime(r.created_at)}</span>
                {actions({ kind: "file", value: r })}
              </div>
            ))}
          </div>
          {!visibleFiles.length && !visibleFolders.length && (
            <Empty
              title={
                search ? "No matching files or folders" : "This folder is empty"
              }
              action={
                search ? (
                  <button
                    className="button secondary"
                    onClick={() => setSearch("")}
                  >
                    Clear search
                  </button>
                ) : undefined
              }
            >
              {search
                ? "Search only covers the current folder. Try another name."
                : "Create a folder, write a Markdown file, or upload HTML, Markdown and PDF files using the actions above."}
            </Empty>
          )}
        </>
      )}
      {upload && (
        <UploadDialog
          projectId={projectId}
          folderId={upload.target}
          destination={locationName(upload.target)}
          initialFiles={upload.files}
          onClose={() => setUpload(undefined)}
        />
      )}
      {naming && (
        <NameDialog
          projectId={projectId}
          parentId={folderId}
          {...naming}
          onClose={() => setNaming(undefined)}
        />
      )}
      {editing && (
        <MarkdownFileEditor
          projectId={projectId}
          folderId={folderId}
          resource={editing.resource}
          onClose={() => setEditing(undefined)}
        />
      )}
      {moving && (
        <MoveDialog
          projectId={projectId}
          folders={allFolders}
          item={moving}
          onClose={() => {
            setMoving(undefined);
          }}
        />
      )}
      {removing && (
        <Confirm
          title={
            removing.kind === "folder"
              ? "Delete this folder?"
              : "Delete this resource?"
          }
          description={
            removing.kind === "folder"
              ? `Only empty folders can be deleted. “${removing.value.name}” will not be removed if it contains any files or folders.`
              : `“${removing.value.title}” will be permanently removed from both Resources and Documentation.`
          }
          label={
            removing.kind === "folder" ? "Delete folder" : "Delete resource"
          }
          onClose={() => setRemoving(undefined)}
          onConfirm={async () => {
            if (removing.kind === "folder")
              await api.deleteFolder(projectId, removing.value.id);
            else await api.deleteResource(projectId, removing.value.id);
            await refreshFiles(client, projectId);
            if (mounted.current) setNotice("Item deleted.");
          }}
        />
      )}
    </section>
  );
}
