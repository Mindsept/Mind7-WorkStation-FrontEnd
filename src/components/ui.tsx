import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, ArrowRight, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ActionButton, LoaderOne, useOperationGuard } from "./action-button";
export function Loading({ label = "Loading workspace…" }: { label?: string }) {
  return (
    <div className="state-box" role="status">
      <LoaderOne />
      <span>{label}</span>
    </div>
  );
}
export function ErrorNotice({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  if (!error) return null;
  return (
    <div className="error-notice" role="alert">
      <AlertCircle size={19} />
      <div>
        {error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."}
        {retry && (
          <button className="text-button" onClick={retry}>
            Try again <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="deco-mark" aria-hidden="true">
        ◇
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  description,
  children,
  onClose,
  wide = false,
  busy = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  busy?: boolean;
}) {
  const previousFocus = useRef(document.activeElement as HTMLElement | null);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className={`dialog-content ${wide ? "wide" : ""}`}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            previousFocus.current?.focus();
          }}
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="dialog-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close
              className="icon-button"
              aria-label="Close dialog"
              disabled={busy}
            >
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Confirm({
  title,
  description,
  label = "Delete",
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  label?: string;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const guard = useOperationGuard();
  const [error, setError] = useState<unknown>();
  return (
    <Modal
      title={title}
      description={description}
      onClose={onClose}
      busy={busy}
    >
      <ErrorNotice error={error} />
      <div className="form-actions">
        <button
          className="button secondary"
          onClick={onClose}
          disabled={busy}
          autoFocus
        >
          Cancel
        </button>
        <ActionButton
          className="button danger"
          pending={busy}
          onClick={async () => {
            if (!guard.start()) return;
            setBusy(true);
            setError(undefined);
            try {
              await onConfirm();
              if (guard.active()) onClose();
            } catch (e) {
              if (guard.active()) setError(e);
            } finally {
              guard.finish();
              if (guard.active()) setBusy(false);
            }
          }}
        >
          {label}
        </ActionButton>
      </div>
    </Modal>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: (id: string) => ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function safeLink(url: string) {
  return /^(https?:|mailto:|#)/i.test(url) ? url : "";
}
export function Markdown({ text }: { text: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={safeLink}
        components={{
          pre: ({ children }) => <pre tabIndex={0}>{children}</pre>,
          a: ({ href, children }) => (
            <a
              href={href || undefined}
              target={href?.startsWith("#") ? undefined : "_blank"}
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ alt }) => (
            <span className="muted">[Image: {alt || "embedded image"}]</span>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
export function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}
export function calendarDate(value: string) {
  const [y, m, d] = value.split("-");
  return `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1]} ${y}`;
}
export function todayParis() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function bytes(value: number) {
  return value < 1024
    ? `${value} B`
    : value < 1024 * 1024
      ? `${(value / 1024).toFixed(1)} KB`
      : `${(value / 1024 / 1024).toFixed(1)} MB`;
}
export function initials(name: string) {
  return name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
