import type { ReactNode } from "react";
import "../cards-motion.css";

// Static art keeps text, focus and work surfaces stationary on every input type.
export function IllustratedCard({
  children,
  image,
  className = "",
}: {
  children: ReactNode;
  image: string;
  className?: string;
}) {
  return (
    <div className={`illustrated-card ${className}`}>
      <div className="illustrated-surface" aria-hidden="true">
        <img src={image} alt="" loading="lazy" decoding="async" />
      </div>
      <div className="illustrated-content">{children}</div>
    </div>
  );
}
