import { useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Download, X } from "lucide-react";
import { ActionButton, useOperationGuard } from "./action-button";

// Original implementation inspired by the publicly observed Fluid Notch demo.
// No Aceternity All-Access source used. See design/ACETERNITY.md.
export function FluidAction({
  label,
  description,
  onAction,
  success,
}: {
  label: string;
  description: string;
  onAction: () => Promise<unknown>;
  success: string;
}) {
  const [state, setState] = useState<"idle" | "pending" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const guard = useOperationGuard();
  const reduced = useReducedMotion();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const open = state !== "idle";
  const close = () => {
    if (state === "pending") return;
    setState("idle");
    root.current?.querySelector<HTMLButtonElement>(".action-button")?.focus();
  };
  return (
    <div
      ref={root}
      className={`fluid-action ${open ? "is-open" : ""}`}
      data-fluid-state={state}
      onKeyDown={(e) => {
        if (e.key === "Escape" && state !== "pending") {
          e.stopPropagation();
          close();
        }
      }}
    >
      <div className="fluid-action-top">
        <ActionButton
          type="button"
          className="button primary fluid-trigger"
          pending={state === "pending"}
          aria-expanded={open}
          aria-controls={id}
          onClick={async () => {
            if (!guard.start()) return;
            setState("pending");
            setMessage(description);
            try {
              await onAction();
              if (guard.active()) {
                setMessage(success);
                setState("success");
              }
            } catch (error) {
              if (guard.active()) {
                setMessage(
                  error instanceof Error
                    ? error.message
                    : "The request failed. Try again.",
                );
                setState("error");
              }
            } finally {
              guard.finish();
            }
          }}
        >
          <Download size={16} />
          {label}
        </ActionButton>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            className="fluid-action-detail"
            initial={{
              height: 0,
              opacity: 0,
              filter: reduced ? "none" : "blur(5px)",
            }}
            animate={{ height: "auto", opacity: 1, filter: "blur(0px)" }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.24 }}
          >
            {state !== "pending" && (
              <button
                type="button"
                className="icon-button fluid-dismiss"
                aria-label="Dismiss export status"
                onClick={close}
              >
                <X size={16} />
              </button>
            )}
            <div role={state === "error" ? "alert" : "status"}>
              <strong>
                {state === "pending" ? (
                  "Preparing archive"
                ) : state === "success" ? (
                  <>
                    <Check size={15} /> Archive downloaded
                  </>
                ) : (
                  "Export interrupted"
                )}
              </strong>
              <p>{message}</p>
              {state === "error" && (
                <small>Select {label.toLowerCase()} to retry.</small>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
