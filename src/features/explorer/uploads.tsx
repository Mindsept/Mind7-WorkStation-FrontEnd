import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw, X } from "lucide-react";
import { FileUploadSurface } from "../../components/file-upload";
import {
  ActionButton,
  useOperationGuard,
} from "../../components/action-button";
import { maxUploadBytes, uploadResource } from "../../api/client";
import { bytes, ErrorNotice, Field, Modal } from "../../components/ui";
import { refreshFiles } from "./editors";
export function validateFile(file: File): string | undefined {
  if (!/\.(html|md|pdf)$/i.test(file.name))
    return "Choose a .html, .md or .pdf file. Other formats are not supported.";
  if (file.size > maxUploadBytes)
    return `This file is too large. The per-file limit is ${bytes(maxUploadBytes)}.`;
  if (!file.size && !/\.md$/i.test(file.name))
    return "This file is empty. Only Markdown files may be blank.";
}
export function droppedFiles(data: DataTransfer): File[] {
  if (
    Array.from(data.items).some(
      (item) => item.webkitGetAsEntry?.()?.isDirectory,
    )
  )
    throw new Error(
      "Directory import is not supported. Create a folder, then select or drop individual files.",
    );
  return Array.from(data.files);
}
type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: "ready" | "uploading" | "done" | "error";
  retryable?: boolean;
  error?: string;
};
const itemsFor = (files: File[]): UploadItem[] =>
  files.map((file) => {
    const error = validateFile(file);
    return {
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: error ? "error" : "ready",
      error,
      retryable: false,
    };
  });
export function UploadDialog({
  projectId,
  folderId,
  destination,
  initialFiles = [],
  onClose,
}: {
  projectId: string;
  folderId: string | null;
  destination: string;
  initialFiles?: File[];
  onClose: () => void;
}) {
  const [items, setItems] = useState(() => itemsFor(initialFiles));
  const currentItems = useRef(items);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const operation = useOperationGuard();
  const client = useQueryClient();
  const change = (fn: (items: UploadItem[]) => UploadItem[]) => {
    if (!operation.active()) return;
    currentItems.current = fn(currentItems.current);
    setItems(currentItems.current);
  };
  const update = (id: string, patch: Partial<UploadItem>) =>
    change((old) =>
      old.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  const run = async (retryId?: string) => {
    if (!operation.start()) return;
    const queue = currentItems.current.filter((item) =>
      retryId
        ? item.id === retryId && item.status === "error" && item.retryable
        : item.status === "ready",
    );
    if (!queue.length) {
      operation.finish();
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      for (const item of queue) {
        if (!operation.active()) break;
        update(item.id, { status: "uploading", progress: 0, error: undefined });
        try {
          await uploadResource(
            projectId,
            item.file,
            currentItems.current.length === 1 ? title : "",
            (progress) => update(item.id, { progress }),
            folderId,
          );
          update(item.id, { status: "done", progress: 100, retryable: false });
        } catch (err) {
          update(item.id, {
            status: "error",
            retryable: true,
            error:
              err instanceof Error ? err.message : "Upload failed. Try again.",
          });
        }
      }
      await refreshFiles(client, projectId);
    } catch (err) {
      if (operation.active()) setError(err);
    } finally {
      operation.finish();
      if (operation.active()) setBusy(false);
    }
  };
  const ready = items.some((item) => item.status === "ready");
  return (
    <Modal
      title="Upload files"
      description={`Destination: ${destination}. Each file is uploaded separately; existing names are never overwritten.`}
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <FileUploadSurface
          label="Resource file"
          description="Choose files or drop them here. HTML slides, Markdown or PDF."
          accept=".html,.md,.pdf"
          multiple
          disabled={busy}
          onFiles={(files) => {
            change((old) => [...old, ...itemsFor(files)]);
            setError(undefined);
          }}
        />
        <p className="upload-guidance">
          Up to {bytes(maxUploadBytes)} per file. HTML must include embedded
          assets; remote assets and network access are blocked. Select files,
          not directories. Project storage limits apply.
        </p>
        {items.length === 1 && (
          <Field
            label="Resource title"
            hint="Optional display title. The filename stays unchanged."
          >
            {(id) => (
              <input
                id={id}
                maxLength={200}
                value={title}
                disabled={busy || items[0].status === "done"}
                onChange={(e) => setTitle(e.target.value)}
              />
            )}
          </Field>
        )}
        <ul className="upload-results" aria-live="polite">
          {items.map((item) => (
            <li key={item.id} data-upload-state={item.status}>
              <strong>{item.file.name}</strong>
              <span>
                {item.status === "done"
                  ? "Uploaded"
                  : item.status === "uploading"
                    ? item.progress === 100
                      ? "Processing…"
                      : `${item.progress}%`
                    : item.status === "ready"
                      ? bytes(item.file.size)
                      : "Not uploaded"}
              </span>
              <div className="upload-progress-slot">
                {item.status === "uploading" && (
                  <progress
                    max={100}
                    value={item.progress}
                    aria-label={`Upload progress for ${item.file.name}`}
                  />
                )}
              </div>
              {item.error && (
                <div className="upload-result-error" role="alert">
                  {item.error}
                </div>
              )}
              {item.status === "error" && item.retryable && (
                <ActionButton
                  type="button"
                  className="button secondary compact upload-retry"
                  disabled={busy}
                  onClick={() => void run(item.id)}
                  aria-label={`Retry ${item.file.name}`}
                >
                  <RotateCcw size={14} />
                  Retry failed file
                </ActionButton>
              )}
              {(item.status === "ready" || item.status === "error") && (
                <button
                  type="button"
                  className="icon-button upload-remove"
                  disabled={busy}
                  aria-label={`Remove ${item.file.name} from upload queue`}
                  onClick={() =>
                    change((old) => old.filter((row) => row.id !== item.id))
                  }
                >
                  <X size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
        <ErrorNotice error={error} />
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onClose}
          >
            {items.some((i) => i.status === "done") ? "Done" : "Cancel"}
          </button>
          <ActionButton pending={busy} disabled={!busy && !ready}>
            Upload files
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}
