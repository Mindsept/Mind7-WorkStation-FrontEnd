import { projectCover } from "../api/project-covers";
import { useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  FolderKanban,
  Layers3,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { api, download } from "../api/client";
import type { Project } from "../api/types";
import {
  Confirm,
  dateTime,
  Empty,
  ErrorNotice,
  Field,
  Loading,
  Markdown,
  Modal,
} from "../components/ui";
import { ResourceCollection } from "./resources";
import { ProjectLinks } from "../features/links/project-links";
import { ActionButton, useOperationGuard } from "../components/action-button";
import { FluidAction } from "../components/fluid-action";
import { IllustratedCard } from "../components/illustrated-card";
import { Avatar } from "../features/profile/avatar";
function ProjectEditor({
  project,
  onClose,
  onSaved,
}: {
  project?: Project;
  onClose: () => void;
  onSaved: (p: Project) => void;
}) {
  const [title, setTitle] = useState(project?.title || "");
  const [description, setDescription] = useState(project?.description || "");
  const [busy, setBusy] = useState(false);
  const guard = useOperationGuard();
  const [error, setError] = useState<unknown>();
  return (
    <Modal
      title={project ? "Edit project" : "Create a project"}
      description="Give your team a shared space for ideas, documents and source files."
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim() || !guard.start()) return;
          setBusy(true);
          setError(undefined);
          try {
            const savedProject = await api.saveProject(
              { title: title.trim(), description: description.trim() },
              project?.id,
            );
            if (guard.active()) onSaved(savedProject);
          } catch (e) {
            if (guard.active()) setError(e);
          } finally {
            guard.finish();
            if (guard.active()) setBusy(false);
          }
        }}
      >
        <Field label="Project title">
          {(id) => (
            <input
              id={id}
              autoFocus
              required
              maxLength={200}
              value={title}
              disabled={busy}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A name for your next idea"
            />
          )}
        </Field>
        <Field
          label="Description"
          hint="Optional. Help the team understand what this project is about."
        >
          {(id) => (
            <textarea
              id={id}
              rows={4}
              maxLength={20000}
              value={description}
              disabled={busy}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are we working on?"
            />
          )}
        </Field>
        <ErrorNotice error={error} />
        <div className="form-actions">
          <button
            className="button secondary"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <ActionButton pending={busy} disabled={!title.trim()}>
            {project ? "Save changes" : "Create project"}
            <ArrowRight size={16} />
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}
export function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const client = useQueryClient();
  const navigate = useNavigate();
  const projects = useQuery({ queryKey: ["projects"], queryFn: api.projects });
  const members = useQuery({ queryKey: ["members"], queryFn: api.members });
  const filtered = projects.data?.items.filter((p) =>
    `${p.title} ${p.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <section className="portal-page projects-view" aria-label="Project library">
      <div className="library-tools">
        <div className="page-heading library-heading">
          <div>
            <span className="eyebrow">MINDSEPT WORKSTATION</span>
            <h1>
              Your projects{" "}
              <span className="count">{projects.data?.total ?? "—"}</span>
            </h1>
            <p>Open a project to find its resources and documentation.</p>
          </div>
          <ActionButton
            className="button primary"
            onClick={() => setCreating(true)}
          >
            <Plus size={18} />
            New project
          </ActionButton>
        </div>
        <div className="list-toolbar">
          <label className="search-input">
            <Search size={18} />
            <input
              type="search"
              aria-label="Search projects"
              placeholder="Find a project…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <span className="muted toolbar-note">
            <Users size={16} />
            Shared with the whole team
          </span>
        </div>
      </div>
      {projects.isPending ? (
        <Loading label="Loading projects…" />
      ) : projects.isError ? (
        <ErrorNotice
          error={projects.error}
          retry={() => void projects.refetch()}
        />
      ) : filtered?.length ? (
        <div className="project-grid cover-project-grid">
          {filtered.map((project, index) => {
            const creator = members.data?.items.find(
              (m) => m.id === project.creator_id,
            );
            return (
              <Link
                to={`/projects/${project.id}`}
                className="project-card cover-project-link"
                key={project.id}
              >
                <IllustratedCard image={projectCover(project)}>
                  <div className="card-top">
                    <span className={`project-icon tone-${index % 3}`}>
                      <FolderKanban size={23} />
                    </span>
                    <ArrowRight size={19} />
                  </div>
                  <h3>{project.title}</h3>
                  <p>
                    {project.description ||
                      "A new space for the team’s documents, ideas and decisions."}
                  </p>
                  <div className="project-card-footer">
                    <span className="creator">
                      <Avatar
                        name={creator?.display_name || "Team member"}
                        url={creator?.avatar_url}
                        className="small"
                      />
                      {creator?.display_name || "Team member"}
                    </span>
                    <span>{dateTime(project.updated_at)}</span>
                  </div>
                </IllustratedCard>
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty
          title={
            search ? "No matching projects" : "Your next project starts here"
          }
          action={
            <button
              className="button secondary"
              onClick={() => (search ? setSearch("") : setCreating(true))}
            >
              {search ? "Clear search" : "Create a project"}
            </button>
          }
        >
          {search
            ? "Try another title or a word from the description."
            : "Create a project to bring its documentation and resources together."}
        </Empty>
      )}
      {creating && (
        <ProjectEditor
          onClose={() => setCreating(false)}
          onSaved={(p) => {
            void client.invalidateQueries({ queryKey: ["projects"] });
            setCreating(false);
            navigate(`/projects/${p.id}`);
          }}
        />
      )}
    </section>
  );
}
function DocumentationEditor({
  projectId,
  text,
}: {
  projectId: string;
  text: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const guard = useOperationGuard();
  const [error, setError] = useState<unknown>();
  const [saved, setSaved] = useState(false);
  const client = useQueryClient();
  return (
    <section className="panel overview">
      <div className="section-heading">
        <div>
          <span className="eyebrow">DOCUMENTATION</span>
          <h2>Project overview</h2>
        </div>
        {!editing && (
          <button
            className="button secondary compact"
            onClick={() => {
              setDraft(text);
              setEditing(true);
              setSaved(false);
            }}
          >
            <Pencil size={15} />
            Edit overview
          </button>
        )}
      </div>
      {editing ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!guard.start()) return;
            setBusy(true);
            setError(undefined);
            try {
              await api.saveDocumentation(projectId, draft);
              await client.invalidateQueries({
                queryKey: ["documentation", projectId],
              });
              if (guard.active()) {
                setEditing(false);
                setSaved(true);
              }
            } catch (e) {
              if (guard.active()) setError(e);
            } finally {
              guard.finish();
              if (guard.active()) setBusy(false);
            }
          }}
        >
          <div className="editor-tabs">
            <button
              type="button"
              className={!preview ? "selected" : ""}
              onClick={() => setPreview(false)}
            >
              Write
            </button>
            <button
              type="button"
              className={preview ? "selected" : ""}
              onClick={() => setPreview(true)}
            >
              Preview
            </button>
            <span>Markdown supported</span>
          </div>
          {preview ? (
            <Markdown text={draft || "*Nothing to preview yet.*"} />
          ) : (
            <label className="sr-only-container">
              <span className="sr-only">Overview Markdown</span>
              <textarea
                className="markdown-editor"
                value={draft}
                disabled={busy}
                onChange={(e) => setDraft(e.target.value)}
                rows={14}
                autoFocus
                maxLength={500000}
              />
            </label>
          )}
          <ErrorNotice error={error} />
          <div className="form-actions">
            <button
              type="button"
              disabled={busy}
              className="button secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <ActionButton pending={busy}>Save overview</ActionButton>
          </div>
        </form>
      ) : text ? (
        <Markdown text={text} />
      ) : (
        <Empty
          title="Start with the bigger picture"
          action={
            <button
              className="button secondary"
              onClick={() => {
                setDraft("");
                setEditing(true);
              }}
            >
              <Pencil size={16} />
              Write an overview
            </button>
          }
        >
          Capture the purpose, decisions and useful links behind this project.
        </Empty>
      )}
      {saved && (
        <p className="success" role="status">
          <Check size={15} />
          Overview saved
        </p>
      )}
    </section>
  );
}
export function ProjectPage({
  documentation = false,
}: {
  documentation?: boolean;
}) {
  const { projectId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const overview = params.get("view") === "overview";
  const navigate = useNavigate();
  const client = useQueryClient();
  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.project(projectId),
  });
  const doc = useQuery({
    queryKey: ["documentation", projectId],
    queryFn: () => api.documentation(projectId),
  });
  const members = useQuery({ queryKey: ["members"], queryFn: api.members });
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  if (project.isPending) return <Loading label="Opening project…" />;
  if (project.isError)
    return (
      <ErrorNotice error={project.error} retry={() => void project.refetch()} />
    );
  const p = project.data;
  const creator = members.data?.items.find((m) => m.id === p.creator_id);
  return (
    <section className="portal-page project-view">
      <div className="project-cover">
        <img className="project-cover-art" src={projectCover(p)} alt="" />
        <nav className="sub-breadcrumb" aria-label="Project breadcrumb">
          <Link to="/projects">Projects</Link>
          <ChevronRight size={14} />
          <span>{p.title}</span>
          {documentation && (
            <>
              <ChevronRight size={14} />
              <span>Documentation</span>
            </>
          )}
        </nav>
        <div className="page-heading project-heading">
          <div>
            <span className="eyebrow">SHARED PROJECT</span>
            <h1>{p.title}</h1>
            <p>{p.description || "A shared space for project knowledge."}</p>
          </div>
          <div className="actions">
            <button
              className="button secondary compact"
              onClick={() => setEditing(true)}
            >
              <Pencil size={15} />
              Edit project
            </button>
            <button
              className="icon-button"
              aria-label="Delete project"
              onClick={() => setDeleting(true)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        <ProjectLinks projectId={projectId} />
        <div className="project-meta">
          <span>
            <Users size={15} />
            Created by {creator?.display_name || p.creator_id}
          </span>
          <span>
            <Clock3 size={15} />
            Created {dateTime(p.created_at)}
          </span>
          <span>Updated {dateTime(p.updated_at)}</span>
        </div>
        <nav className="project-tabs" aria-label="Project views">
          <NavLink
            end
            to={`/projects/${projectId}${params.get("folder") ? `?folder=${params.get("folder")}` : ""}`}
          >
            <Layers3 size={17} />
            Resources
          </NavLink>
          <NavLink
            to={`/projects/${projectId}/documentation${params.get("folder") ? `?folder=${params.get("folder")}` : ""}`}
          >
            <BookOpen size={17} />
            Documentation hub
          </NavLink>
        </nav>
      </div>
      {documentation && (
        <>
          <div className="export-panel">
            <div className="export-icon">
              <ArrowDownToLine size={24} />
            </div>
            <div>
              <h3>Project context</h3>
              <p>
                Download project documentation and source files as a ZIP, ready
                to use as LLM context.
              </p>
              <small>
                Files stay in your control. Nothing is sent to an external LLM.
              </small>
            </div>
            <FluidAction
              key={projectId}
              label="Extract context"
              description="Preparing project documentation and source files."
              onAction={() =>
                download(
                  `/projects/${projectId}/context-export`,
                  `${p.title}-context.zip`,
                )
              }
              success="Archive downloaded. Check your browser downloads."
            />
          </div>
          <div className="hub-views" aria-label="Documentation areas">
            <button
              className={`button ${!overview ? "primary" : "secondary"}`}
              aria-pressed={!overview}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("view");
                setParams(next);
              }}
            >
              Files
            </button>
            <button
              className={`button ${overview ? "primary" : "secondary"}`}
              aria-pressed={overview}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("view", "overview");
                setParams(next);
              }}
            >
              Overview
            </button>
          </div>
          {overview &&
            (doc.isPending ? (
              <Loading label="Loading documentation…" />
            ) : doc.isError ? (
              <ErrorNotice error={doc.error} retry={() => void doc.refetch()} />
            ) : (
              <DocumentationEditor
                key={projectId}
                projectId={projectId}
                text={doc.data.overview_markdown}
              />
            ))}
        </>
      )}
      {(!documentation || !overview) && (
        <ResourceCollection
          key={projectId}
          projectId={projectId}
          documentation={documentation}
        />
      )}
      {editing && (
        <ProjectEditor
          project={p}
          onClose={() => setEditing(false)}
          onSaved={() => {
            void client.invalidateQueries({ queryKey: ["project", projectId] });
            void client.invalidateQueries({ queryKey: ["projects"] });
            setEditing(false);
          }}
        />
      )}
      {deleting && (
        <Confirm
          title="Delete this project?"
          description={`“${p.title}”, its documentation and all its resources will be permanently deleted. This cannot be undone.`}
          label="Delete project"
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await api.deleteProject(projectId);
            client.removeQueries({ queryKey: ["project", projectId] });
            await client.invalidateQueries({ queryKey: ["projects"] });
            navigate("/projects");
          }}
        />
      )}
    </section>
  );
}
