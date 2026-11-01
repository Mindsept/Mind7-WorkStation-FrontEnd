import { useEffect, useState } from "react";
import {
  ActionButton,
  useOperationGuard,
} from "../../components/action-button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api, getContent, uploadResource } from "../../api/client";
import type { Folder, Resource } from "../../api/types";
import {
  ErrorNotice,
  Field,
  Loading,
  Markdown,
  Modal,
} from "../../components/ui";

export async function refreshFiles(
  client: ReturnType<typeof useQueryClient>,
  pid: string,
) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ["resources", pid] }),
    client.invalidateQueries({ queryKey: ["folders", pid] }),
  ]);
}
export function folderPath(folders: Folder[], id: string | null): Folder[] {
  const path: Folder[] = [],
    seen = new Set<string>();
  while (id && !seen.has(id)) {
    seen.add(id);
    const folder = folders.find((f) => f.id === id);
    if (!folder) break;
    path.unshift(folder);
    id = folder.parent_id;
  }
  return path;
}
export function NameDialog({
  projectId,
  parentId,
  folder,
  resource,
  onClose,
}: {
  projectId: string;
  parentId: string | null;
  folder?: Folder;
  resource?: Resource;
  onClose: () => void;
}) {
  const [name, setName] = useState(folder?.name ?? resource?.filename ?? "");
  const [title, setTitle] = useState(resource?.title ?? "");
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const client = useQueryClient();
  const operation = useOperationGuard();
  return (
    <Modal
      title={
        resource ? "Rename resource" : folder ? "Rename folder" : "New folder"
      }
      description={
        resource
          ? "Change the filename or display title. Keep the file extension. Upload provenance stays unchanged."
          : "Folder names must be unique within their parent folder."
      }
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!operation.start()) return;
          setBusy(true);
          setError(undefined);
          try {
            if (resource)
              await api.patchResource(projectId, resource.id, {
                filename: name,
                title: title.trim(),
              });
            else
              await api.saveFolder(
                projectId,
                folder ? { name } : { name, parent_id: parentId },
                folder?.id,
              );
            await refreshFiles(client, projectId);
            if (operation.active()) onClose();
          } catch (err) {
            if (operation.active()) setError(err);
          } finally {
            operation.finish();
            if (operation.active()) setBusy(false);
          }
        }}
      >
        <Field label={resource ? "Filename" : "Folder name"}>
          {(id) => (
            <input
              id={id}
              autoFocus
              required
              maxLength={255}
              value={name}
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </Field>
        {resource && (
          <Field label="Title">
            {(id) => (
              <input
                id={id}
                required
                maxLength={200}
                value={title}
                disabled={busy}
                onChange={(e) => setTitle(e.target.value)}
              />
            )}
          </Field>
        )}
        <ErrorNotice error={error} />
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <ActionButton pending={busy} disabled={!name.trim()}>
            {folder || resource ? "Save changes" : "Create folder"}
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}
export function MoveDialog({
  projectId,
  folders,
  item,
  onClose,
}: {
  projectId: string;
  folders: Folder[];
  item: { kind: "folder"; value: Folder } | { kind: "file"; value: Resource };
  onClose: () => void;
}) {
  const current =
    item.kind === "folder" ? item.value.parent_id : item.value.folder_id;
  const [target, setTarget] = useState(current ?? "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const client = useQueryClient();
  const operation = useOperationGuard();
  const options = folders
    .filter(
      (f) =>
        item.kind !== "folder" ||
        !folderPath(folders, f.id).some((p) => p.id === item.value.id),
    )
    .map((f) => ({
      id: f.id,
      path: folderPath(folders, f.id)
        .map((p) => p.name)
        .join(" / "),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
  return (
    <Modal
      title="Move item"
      description={`Choose a destination for ${item.kind === "folder" ? item.value.name : item.value.filename}. Existing files are never overwritten.`}
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!operation.start()) return;
          setBusy(true);
          setError(undefined);
          try {
            if (item.kind === "folder")
              await api.saveFolder(
                projectId,
                { parent_id: target || null },
                item.value.id,
              );
            else
              await api.patchResource(projectId, item.value.id, {
                folder_id: target || null,
              });
            await refreshFiles(client, projectId);
            if (operation.active()) onClose();
          } catch (err) {
            if (operation.active()) setError(err);
          } finally {
            operation.finish();
            if (operation.active()) setBusy(false);
          }
        }}
      >
        <Field label="Destination folder">
          {(id) => (
            <select
              id={id}
              autoFocus
              value={target}
              disabled={busy}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Project root</option>
              {options.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.path}
                </option>
              ))}
            </select>
          )}
        </Field>
        <ErrorNotice error={error} />
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <ActionButton pending={busy} disabled={target === (current ?? "")}>
            Move here
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}
export function MarkdownFileEditor({
  projectId,
  folderId = null,
  resource,
  onClose,
}: {
  projectId: string;
  folderId?: string | null;
  resource?: Resource;
  onClose: () => void;
}) {
  const [filename, setFilename] = useState("untitled.md");
  const [draft, setDraft] = useState<string>();
  const [preview, setPreview] = useState(false),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [expectedHash, setExpectedHash] = useState<string>();
  const [latest, setLatest] = useState<string>();
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [comparisonError, setComparisonError] = useState<unknown>();
  const client = useQueryClient();
  const operation = useOperationGuard();
  const content = useQuery({
    queryKey: ["edit-content", resource?.id],
    enabled: !!resource && expectedHash === undefined,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const blob = await getContent(
        `/projects/${projectId}/resources/${resource!.id}/content`,
      );
      const hash = Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
        ),
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return { text: await blob.text(), hash };
    },
  });
  useEffect(() => {
    if (content.data && expectedHash === undefined) {
      setExpectedHash(content.data.hash);
      setDraft((previous) => previous ?? content.data.text);
    }
  }, [content.data, expectedHash]);
  const value = draft ?? content.data?.text ?? "";
  const hash = expectedHash ?? content.data?.hash ?? "";
  const conflict =
    error instanceof ApiError && error.code === "content_conflict";
  return (
    <Modal
      wide
      title={resource ? "Edit Markdown" : "New Markdown file"}
      description={
        resource
          ? `Editing ${resource.filename}. Saving checks the version you opened.`
          : "Create a Markdown document in the current folder. Blank documents are supported."
      }
      onClose={onClose}
      busy={busy || loadingLatest}
    >
      {resource && content.isPending ? (
        <Loading label="Loading Markdown…" />
      ) : resource && content.isError && !content.data ? (
        <ErrorNotice
          error={content.error}
          retry={() => void content.refetch()}
        />
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!operation.start()) return;
            setBusy(true);
            setError(undefined);
            try {
              if (resource)
                await api.saveMarkdown(projectId, resource.id, value, hash);
              else {
                if (!/\.md$/i.test(filename))
                  throw new Error("Use a filename ending in .md.");
                await uploadResource(
                  projectId,
                  new File([value], filename, {
                    type: "text/markdown;charset=utf-8",
                  }),
                  filename,
                  () => {},
                  folderId,
                );
              }
              await refreshFiles(client, projectId);
              if (resource)
                await client.invalidateQueries({
                  queryKey: ["content", resource.id],
                });
              if (operation.active()) onClose();
            } catch (err) {
              if (operation.active()) setError(err);
            } finally {
              operation.finish();
              if (operation.active()) setBusy(false);
            }
          }}
        >
          {!resource && (
            <Field label="Filename">
              {(id) => (
                <input
                  id={id}
                  autoFocus
                  required
                  maxLength={255}
                  value={filename}
                  disabled={busy}
                  onChange={(e) => setFilename(e.target.value)}
                />
              )}
            </Field>
          )}
          <div className="editor-tabs">
            <button
              type="button"
              aria-pressed={!preview}
              className={!preview ? "selected" : ""}
              onClick={() => setPreview(false)}
            >
              Write
            </button>
            <button
              type="button"
              aria-pressed={preview}
              className={preview ? "selected" : ""}
              onClick={() => setPreview(true)}
            >
              Preview
            </button>
            <span>Markdown</span>
          </div>
          {preview ? (
            <div className="file-editor-preview">
              <Markdown text={value || "*Nothing to preview yet.*"} />
            </div>
          ) : (
            <Field label="File Markdown">
              {(id) => (
                <textarea
                  id={id}
                  className="markdown-editor"
                  rows={14}
                  maxLength={500000}
                  value={value}
                  disabled={busy}
                  onChange={(e) => setDraft(e.target.value)}
                />
              )}
            </Field>
          )}
          <ErrorNotice error={error} />
          {conflict && (
            <div className="conflict-panel">
              <p>
                Your draft is preserved. Load the latest saved version to
                compare, then reconcile your draft before saving again.
              </p>
              <ActionButton
                type="button"
                className="button secondary"
                pending={loadingLatest}
                disabled={busy}
                onClick={async () => {
                  if (!operation.start()) return;
                  setLoadingLatest(true);
                  setComparisonError(undefined);
                  try {
                    const result = await content.refetch();
                    if (!operation.active()) return;
                    if (result.error) throw result.error;
                    if (result.data) {
                      setDraft(value);
                      setLatest(result.data.text);
                      setExpectedHash(result.data.hash);
                    }
                  } catch (err) {
                    if (operation.active()) setComparisonError(err);
                  } finally {
                    operation.finish();
                    if (operation.active()) setLoadingLatest(false);
                  }
                }}
              >
                Load latest for comparison
              </ActionButton>
              <ErrorNotice error={comparisonError} />
              {latest !== undefined && (
                <>
                  <Field label="Latest saved Markdown">
                    {(id) => (
                      <textarea id={id} readOnly rows={8} value={latest} />
                    )}
                  </Field>
                  <p>
                    Review both versions and update your draft above. The next
                    save checks against this loaded version.
                  </p>
                </>
              )}
            </div>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <ActionButton pending={busy} disabled={loadingLatest}>
              {resource ? "Save Markdown" : "Create file"}
            </ActionButton>
          </div>
        </form>
      )}
    </Modal>
  );
}
