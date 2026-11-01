// Adapted from Aceternity UI Images Badge, inspected 2026-11-01.
// https://ui.aceternity.com/components/images-badge
// Original folder geometry, spring and stagger retained; local type cards replace remote images.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
export function ImagesBadge({
  types,
  active = false,
}: {
  types: ("html" | "markdown" | "pdf" | "folder")[];
  active?: boolean;
}) {
  const [reduced, setReduced] = useState(true);
  const [finePointer, setFinePointer] = useState(false);
  useEffect(() => {
    const query = matchMedia("(hover: hover) and (pointer: fine)");
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduced(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    const update = () => setFinePointer(query.matches);
    update();
    query.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
      preference.removeEventListener("change", updatePreference);
    };
  }, []);
  const expanded = active && !reduced && finePointer;
  const papers = types.slice(0, 3);
  const spring = { type: "spring" as const, stiffness: 400, damping: 25 };
  return (
    <span className="images-badge" aria-hidden="true" data-expanded={expanded}>
      <span className="images-badge-folder">
        <span className="images-badge-back">
          <span className="images-badge-tab" />
        </span>
        {papers.map((type, index) => {
          const center =
            papers.length === 1
              ? 0
              : papers.length === 2
                ? index - 0.5
                : index - 1;
          const teaseY = -4 - (papers.length - 1 - index);
          return (
            <motion.span
              key={`${index}-${type}`}
              className={`images-badge-paper type-${type}`}
              initial={false}
              animate={{
                x: `calc(-50% + ${expanded ? center * 10 : 0}px)`,
                y: expanded ? -19 - (papers.length - 1 - index) * 3 : teaseY,
                rotate: center * (expanded ? 12 : 3),
                width: expanded ? 31 : 24,
                height: expanded ? 27 : 18,
              }}
              transition={
                reduced ? { duration: 0 } : { ...spring, delay: index * 0.03 }
              }
              style={{ zIndex: 10 + index }}
            >
              <span>
                {type === "markdown"
                  ? "MD"
                  : type === "folder"
                    ? "DIR"
                    : type.toUpperCase()}
              </span>
              <i />
              <i />
            </motion.span>
          );
        })}
        <motion.span
          className="images-badge-front"
          initial={false}
          animate={{
            rotateX: expanded ? -45 : -25,
            scaleY: expanded ? 0.8 : 1,
          }}
          transition={reduced ? { duration: 0 } : spring}
          style={{ transformStyle: "preserve-3d", zIndex: 20 }}
        >
          <i />
        </motion.span>
      </span>
    </span>
  );
}
