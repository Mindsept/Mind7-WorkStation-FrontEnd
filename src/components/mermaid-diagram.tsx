import { useEffect, useState } from "react";
import { GitBranch } from "lucide-react";
import "./mermaid-diagram.css";

type Diagram = { source: string; url: string; label: string };

export function MermaidDiagram({ source }: { source: string }) {
  const [diagram, setDiagram] = useState<Diagram>();
  const [failedSource, setFailedSource] = useState<string>();
  const [fullSize, setFullSize] = useState(false);
  const tooLarge = source.length > 20_000;
  const failed = tooLarge || failedSource === source;
  const current = diagram?.source === source ? diagram : undefined;

  useEffect(() => {
    if (tooLarge) return;
    let cancelled = false;
    let url: string | undefined;
    void import("./mermaid-renderer")
      .then(async ({ renderDiagram }) => {
        if (cancelled) return;
        const rendered = await renderDiagram(source);
        if (cancelled) return;
        // An image keeps diagram SVG, CSS and links out of the application's DOM.
        url = URL.createObjectURL(
          new Blob([rendered.svg], { type: "image/svg+xml" }),
        );
        setDiagram({ source, url, label: rendered.label });
        setFailedSource(undefined);
      })
      .catch(() => {
        if (!cancelled) setFailedSource(source);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [source, tooLarge]);

  return (
    <figure className="mermaid-diagram">
      <figcaption className="mermaid-heading">
        <span>
          <GitBranch size={15} aria-hidden="true" />
          Diagram
        </span>
        {current && !failed && (
          <button
            type="button"
            aria-pressed={fullSize}
            onClick={() => setFullSize(!fullSize)}
          >
            {fullSize ? "Fit to width" : "Full size"}
          </button>
        )}
      </figcaption>
      {failed ? (
        <p className="mermaid-error" role="status">
          {tooLarge
            ? "This diagram is too large to preview. Split it into smaller diagrams (20,000 characters maximum)."
            : "This diagram could not be rendered. Check the Mermaid syntax in the source below."}
        </p>
      ) : current ? (
        <div
          className={`mermaid-canvas${fullSize ? " mermaid-full-size" : ""}`}
          role="region"
          aria-label="Diagram preview"
          tabIndex={0}
        >
          <img
            src={current.url}
            alt={current.label}
            onError={() => setFailedSource(source)}
          />
        </div>
      ) : (
        <p className="mermaid-loading" role="status">
          Rendering diagram…
        </p>
      )}
      <details className="mermaid-source" open={failed || undefined}>
        <summary>Mermaid source</summary>
        <pre tabIndex={0}>
          <code>{source}</code>
        </pre>
      </details>
    </figure>
  );
}
