import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../api/client";
import { detectProvider, parseProjectUrl } from "./url";
import type { LinkProvider, ProjectLink } from "../../api/types";
import {
  Confirm,
  ErrorNotice,
  Field,
  Loading,
  Modal,
} from "../../components/ui";
import {
  ActionButton,
  useOperationGuard,
} from "../../components/action-button";
const providerNames = {
  github: "GitHub",
  drive: "Google Drive",
  other: "Website",
};
export function ProviderIcon({ provider }: { provider: LinkProvider }) {
  return (
    <span
      className={`provider-icon provider-${provider}`}
      role="img"
      aria-label={providerNames[provider]}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        {provider === "github" ? (
          <path
            fill="currentColor"
            d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.1c-3.12.68-3.78-1.32-3.78-1.32-.51-1.29-1.25-1.63-1.25-1.63-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.72 2.62 1.22 3.26.93.1-.72.39-1.22.71-1.5-2.49-.28-5.11-1.25-5.11-5.54 0-1.22.44-2.22 1.16-3-.12-.28-.5-1.42.11-2.96 0 0 .95-.3 3.08 1.15A10.7 10.7 0 0 1 12 6.21c.95 0 1.9.13 2.79.38 2.13-1.45 3.07-1.15 3.07-1.15.61 1.54.23 2.68.12 2.96.72.78 1.15 1.78 1.15 3 0 4.3-2.62 5.25-5.12 5.53.4.35.76 1.03.76 2.08v3.08c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z"
          />
        ) : provider === "drive" ? (
          <>
            <path fill="#0F9D58" d="M8 2h8L5 21 1 14z" />
            <path fill="#F4B400" d="m8 2 8 0 7 12-8 0z" />
            <path fill="#4285F4" d="M5 21h14l4-7H9z" />
          </>
        ) : (
          <g fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="9" />
            <ellipse cx="12" cy="12" rx="4" ry="9" />
            <path d="M3 12h18M5 6h14M5 18h14" />
          </g>
        )}
      </svg>
    </span>
  );
}
function LinkEditor({
  projectId,
  link,
  onClose,
}: {
  projectId: string;
  link?: ProjectLink;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(link?.title ?? ""),
    [url, setUrl] = useState(link?.url ?? "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const client = useQueryClient();
  const guard = useOperationGuard();
  const provider = detectProvider(url);
  return (
    <Modal
      title={link ? "Edit link" : "Add link"}
      description="Save a project bookmark. No account connection or external metadata request is made."
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(undefined);
          if (!parseProjectUrl(url)) {
            setError(
              new Error(
                "Enter an absolute HTTP or HTTPS URL without credentials, spaces or control characters.",
              ),
            );
            return;
          }
          if (!guard.start()) return;
          setBusy(true);
          try {
            await api.saveLink(
              projectId,
              { title: title.trim(), url },
              link?.id,
            );
            await client.invalidateQueries({ queryKey: ["links", projectId] });
            if (guard.active()) onClose();
          } catch (err) {
            if (guard.active()) setError(err);
          } finally {
            guard.finish();
            if (guard.active()) setBusy(false);
          }
        }}
      >
        <Field label="Link label">
          {(id) => (
            <input
              id={id}
              required
              autoFocus
              maxLength={200}
              value={title}
              disabled={busy}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Source repository"
            />
          )}
        </Field>
        <Field label="URL">
          {(id) => (
            <input
              id={id}
              required
              type="text"
              inputMode="url"
              maxLength={2048}
              value={url}
              disabled={busy}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/team/project"
            />
          )}
        </Field>
        <div className="link-provider-preview">
          <ProviderIcon provider={provider} />
          <span>Detected icon: {providerNames[provider]}</span>
        </div>
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
          <ActionButton pending={busy} disabled={!title.trim()}>
            Save link
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}
export function ProjectLinks({ projectId }: { projectId: string }) {
  const links = useQuery({
    queryKey: ["links", projectId],
    queryFn: () => api.links(projectId),
  });
  const [editing, setEditing] = useState<{ link?: ProjectLink }>();
  const [removing, setRemoving] = useState<ProjectLink>();
  const client = useQueryClient();
  return (
    <section className="project-links" aria-label="Important links">
      <div className="links-heading">
        <h2>Important links</h2>
        <button
          className="button secondary compact"
          onClick={() => setEditing({})}
        >
          <Plus size={15} />
          Add link
        </button>
      </div>
      {links.isPending ? (
        <Loading label="Loading links…" />
      ) : links.isError ? (
        <ErrorNotice error={links.error} retry={() => void links.refetch()} />
      ) : links.data.items.length ? (
        <ul>
          {links.data.items.map((link) => (
            <li key={link.id}>
              <ProviderIcon provider={link.provider} />
              <a
                href={parseProjectUrl(link.url) ? link.url : undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                <strong>{link.title}</strong>
                <small>{link.url}</small>
                <ExternalLink size={14} />
              </a>
              <button
                className="icon-button"
                aria-label={`Edit link ${link.title}`}
                onClick={() => setEditing({ link })}
              >
                <Pencil size={15} />
              </button>
              <button
                className="icon-button"
                aria-label={`Remove link ${link.title}`}
                onClick={() => setRemoving(link)}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          Keep repositories, shared drives and useful project pages here.
        </p>
      )}
      {editing && (
        <LinkEditor
          projectId={projectId}
          link={editing.link}
          onClose={() => setEditing(undefined)}
        />
      )}
      {removing && (
        <Confirm
          title="Remove this link?"
          description={`Remove “${removing.title}” from this project. The linked page is unaffected.`}
          label="Remove link"
          onClose={() => setRemoving(undefined)}
          onConfirm={async () => {
            await api.deleteLink(projectId, removing.id);
            await client.invalidateQueries({ queryKey: ["links", projectId] });
          }}
        />
      )}
    </section>
  );
}
