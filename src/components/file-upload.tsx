// Adapted from Aceternity UI File Upload, inspected 2026-11-01.
// https://ui.aceternity.com/components/file-upload (original design credit: Natko Hasic).
// Retains the alternating grid, raised paper and 300/20 spring. Native input/drop handling
// adds accessible keyboard operation, disabled state and directory rejection.
import { useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { Upload } from "lucide-react";
export interface FileUploadSurfaceProps {
  onFiles: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  label: string;
  description: string;
}
export function FileUploadSurface({
  onFiles,
  accept,
  multiple = false,
  disabled = false,
  label,
  description,
}: FileUploadSurfaceProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  const [hover, setHover] = useState(false),
    [focused, setFocused] = useState(false),
    [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const raised = !disabled && (hover || focused || over);
  const receive = (files: File[]) => {
    if (disabled || !files.length) return;
    if (!multiple && files.length > 1) {
      setError("Choose one file at a time.");
      return;
    }
    setError("");
    onFiles(files);
  };
  return (
    <div className="file-upload-control">
      <motion.div
        className={`file-upload-surface ${over ? "is-dragging" : ""} ${disabled ? "is-disabled" : ""}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) {
            e.dataTransfer.dropEffect = "copy";
            setOver(true);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node))
            setOver(false);
        }}
        onDrop={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          e.stopPropagation();
          setOver(false);
          if (disabled) return;
          if (
            Array.from(e.dataTransfer.items).some(
              (item) => item.webkitGetAsEntry?.()?.isDirectory,
            )
          ) {
            setError(
              "Directory import is not supported. Select individual files.",
            );
            return;
          }
          receive(Array.from(e.dataTransfer.files));
        }}
      >
        <div className="file-upload-grid" aria-hidden="true">
          {Array.from({ length: 11 }, (_, row) =>
            Array.from({ length: 41 }, (_, col) => (
              <i
                key={`${row}-${col}`}
                className={(row * 41 + col) % 2 ? "inset-cell" : undefined}
              />
            )),
          )}
        </div>
        <label htmlFor={id} className="file-upload-label">
          <strong>{label}</strong>
          <span id={`${id}-hint`}>{description}</span>
        </label>
        <input
          ref={input}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-label={label}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            receive(Array.from(e.target.files ?? []));
            e.currentTarget.value = "";
          }}
        />
        <span className="file-upload-stage" aria-hidden="true">
          <motion.span
            className="file-upload-paper"
            initial={false}
            animate={{
              x: raised && !reduced ? 20 : 0,
              y: raised && !reduced ? -20 : 0,
              opacity: raised ? 0.9 : 1,
            }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 300, damping: 20 }
            }
          >
            <Upload size={24} />
            {over && <span>Drop files</span>}
          </motion.span>
          <motion.span
            className="file-upload-outline"
            initial={false}
            animate={{ opacity: raised ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
          />
        </span>
        <span className="file-upload-choice" aria-hidden="true">
          {multiple ? "Choose files" : "Choose a file"}
        </span>
      </motion.div>
      {error && (
        <p id={`${id}-error`} className="upload-result-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
