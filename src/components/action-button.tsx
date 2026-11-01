import { useEffect, useRef, type ButtonHTMLAttributes } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import "./interaction-motion.css";

// Adapted from Aceternity UI LoaderOne, public Manual source, 2026-11-01.
// https://ui.aceternity.com/components/loader — see design/ACETERNITY.md.
export function LoaderOne() {
  const reduced = useReducedMotion();
  return (
    <span className="action-loader" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={false}
          animate={{ y: reduced ? 0 : [0, 5, 0] }}
          transition={
            reduced
              ? { duration: 0 }
              : {
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "loop",
                  delay: i * 0.2,
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </span>
  );
}

export function ActionButton({
  pending = false,
  children,
  className = "button primary",
  disabled,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean }) {
  const reduced = useReducedMotion();
  // Original compact Fluid Notch-inspired treatment, not paid source code.
  // Only the decorative surface morphs; the native button target never moves.
  const fluid = className.split(/\s+/).includes("primary");
  return (
    <button
      {...props}
      className={`${className} action-button${fluid ? " fluid-primary" : ""}`}
      data-action-state={pending ? "pending" : "idle"}
      disabled={disabled}
      aria-disabled={disabled || pending || undefined}
      aria-busy={pending}
      onClick={(event) => {
        if (pending || disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {fluid && (
        <motion.span
          className="action-surface"
          aria-hidden="true"
          initial={false}
          animate={{
            width: pending ? "64px" : "100%",
            height: pending ? "32px" : "100%",
            borderRadius: pending ? "22px" : "14px",
          }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 360, damping: 30 }
          }
        />
      )}
      <span className="action-label" style={{ opacity: pending ? 0 : 1 }}>
        {children}
      </span>
      <AnimatePresence initial={false}>
        {pending && (
          <motion.span
            className="action-pending"
            aria-hidden="true"
            initial={{ opacity: 0, scale: reduced ? 1 : 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.16 }}
          >
            <LoaderOne />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// Synchronous locking also covers Enter submission before React has rendered.
export function useOperationGuard() {
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return {
    start: () => {
      if (inFlight.current || !mounted.current) return false;
      inFlight.current = true;
      return true;
    },
    finish: () => {
      inFlight.current = false;
    },
    active: () => mounted.current,
  };
}
