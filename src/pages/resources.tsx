import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowLeft,
  Check,
  ChevronRight,
  Maximize2,
  Pencil,
} from "lucide-react";
import { api, download, getContent } from "../api/client";
import type { Resource, ResourceType } from "../api/types";
import {
  bytes,
  dateTime,
  Empty,
  ErrorNotice,
  Loading,
  Markdown,
} from "../components/ui";
import { ActionButton, useOperationGuard } from "../components/action-button";
import { MarkdownFileEditor } from "../features/explorer/editors";
export { ResourceCollection } from "../features/explorer/explorer";
export const labels: Record<ResourceType, string> = {
  html: "HTML slides",
  markdown: "Markdown",
  pdf: "PDF document",
};
export function htmlPreview(source: string, scripts: boolean) {
  const policy = `default-src 'none'; script-src ${scripts ? "'unsafe-inline'" : "'none'"}; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'`;
  return `<!doctype html><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer">${source}`;
}
function ContentPreview({ resource }: { resource: Resource }) {
  const [scripts, setScripts] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<unknown>();
  const container = useRef<HTMLDivElement>(null);
  const content = useQuery({
    queryKey: ["content", resource.id],
    queryFn: async () => {
      const blob = await getContent(
        `/projects/${resource.project_id}/resources/${resource.id}/content`,
      );
      return resource.resource_type === "pdf" ? blob : blob.text();
    },
    gcTime: 0,
    staleTime: 0,
  });
  useEffect(() => {
    if (!(content.data instanceof Blob)) return;
    const objectUrl = URL.createObjectURL(
      new Blob([content.data], { type: "application/pdf" }),
    );
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [content.data]);
  if (content.isPending) return <Loading label="Opening resource…" />;
  if (content.isError)
    return (
      <ErrorNotice error={content.error} retry={() => void content.refetch()} />
    );
  if (resource.resource_type === "markdown")
    return (
      <article className="panel document-reader">
        <Markdown text={String(content.data)} />
      </article>
    );
  return (
    <>
      <div className="viewer-toolbar">
        {resource.resource_type === "html" ? (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={scripts}
              onChange={(e) => setScripts(e.target.checked)}
            />
            Enable slide navigation scripts
          </label>
        ) : (
          <span className="muted">
            PDF preview · Use Download if your browser cannot display this file.
          </span>
        )}
        <button
          className="button secondary compact"
          onClick={async () => {
            try {
              if (!container.current?.requestFullscreen)
                throw new Error("Fullscreen is not supported by this browser.");
              await container.current.requestFullscreen();
            } catch (e) {
              setError(e);
            }
          }}
        >
          <Maximize2 size={16} />
          Present fullscreen
        </button>
      </div>
      <ErrorNotice error={error} />
      <div ref={container} className="viewer-frame">
        {resource.resource_type === "html" ? (
          <iframe
            key={scripts ? "scripts" : "static"}
            title={`${resource.title} preview`}
            sandbox={scripts ? "allow-scripts" : ""}
            srcDoc={htmlPreview(String(content.data), scripts)}
            referrerPolicy="no-referrer"
          />
        ) : url ? (
          <iframe title={`${resource.title} PDF preview`} src={url} />
        ) : (
          <Loading label="Preparing PDF reader…" />
        )}
      </div>
      {resource.resource_type === "html" && (
        <p className="viewer-note">
          Embedded assets only. Enable scripts if this deck needs them for slide
          controls. Use Escape to leave fullscreen.
        </p>
      )}
    </>
  );
}
export function ResourceViewer() {
  const { projectId = "", resourceId = "" } = useParams();
  const resources = useQuery({
    queryKey: ["resources", projectId],
    queryFn: () => api.resources(projectId),
  });
  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.project(projectId),
  });
  const [busy, setBusy] = useState(false);
  const guard = useOperationGuard();
  const currentResource = useRef(resourceId);
  currentResource.current = resourceId;
  const [done, setDone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<unknown>();
  const resource = resources.data?.items.find((r) => r.id === resourceId);
  if (resources.isPending) return <Loading label="Loading resource…" />;
  if (resources.isError)
    return (
      <ErrorNotice
        error={resources.error}
        retry={() => void resources.refetch()}
      />
    );
  if (!resource)
    return (
      <Empty
        title="Resource not found"
        action={
          <Link to={`/projects/${projectId}`} className="button secondary">
            Back to project
          </Link>
        }
      >
        The file may have been removed from this project.
      </Empty>
    );
  return (
    <>
      <div className="sub-breadcrumb">
        <Link to="/projects">Projects</Link>
        <ChevronRight size={14} />
        <Link to={`/projects/${projectId}`}>
          {project.data?.title || "Project"}
        </Link>
        <ChevronRight size={14} />
        <span>{resource.title}</span>
      </div>
      <div className="page-heading">
        <div>
          <Link
            className="back-link"
            to={`/projects/${projectId}/documentation${resource.folder_id ? `?folder=${resource.folder_id}` : ""}`}
          >
            <ArrowLeft size={15} />
            Back to resources
          </Link>
          <h1 className="resource-heading">{resource.title}</h1>
          <p>
            {labels[resource.resource_type]} · {bytes(resource.byte_size)} ·
            Uploaded {dateTime(resource.created_at)}
          </p>
        </div>
        <div className="actions">
          {resource.resource_type === "markdown" && (
            <button
              className="button secondary"
              onClick={() => setEditing(true)}
            >
              <Pencil size={16} />
              Edit Markdown
            </button>
          )}
          <ActionButton
            pending={busy}
            onClick={async () => {
              if (!guard.start()) return;
              const requestedResource = resourceId;
              setBusy(true);
              setDone(false);
              setError(undefined);
              try {
                await download(
                  `/projects/${projectId}/resources/${resourceId}/download`,
                  resource.filename,
                );
                if (
                  guard.active() &&
                  currentResource.current === requestedResource
                )
                  setDone(true);
              } catch (e) {
                if (
                  guard.active() &&
                  currentResource.current === requestedResource
                )
                  setError(e);
              } finally {
                guard.finish();
                if (guard.active()) setBusy(false);
              }
            }}
          >
            <ArrowDownToLine size={17} />
            Download original
          </ActionButton>
        </div>
      </div>
      {editing && (
        <MarkdownFileEditor
          projectId={projectId}
          resource={resource}
          onClose={() => setEditing(false)}
        />
      )}
      <ErrorNotice error={error} />
      {done && (
        <p className="success" role="status">
          <Check size={15} />
          File downloaded
        </p>
      )}
      <ContentPreview key={resource.id} resource={resource} />
    </>
  );
}
