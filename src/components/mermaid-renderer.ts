import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  suppressErrorRendering: true,
  maxTextSize: 20_000,
  maxEdges: 200,
  htmlLabels: false,
  theme: "base",
  look: "classic",
  fontFamily: "Arial, sans-serif",
  secure: [
    "secure",
    "securityLevel",
    "startOnLoad",
    "maxTextSize",
    "maxEdges",
    "suppressErrorRendering",
    "dompurifyConfig",
    "htmlLabels",
    "flowchart",
    "theme",
    "look",
    "themeVariables",
    "themeCSS",
    "fontFamily",
  ],
  flowchart: { htmlLabels: false, curve: "linear" },
  themeVariables: {
    darkMode: true,
    background: "#141b17",
    fontFamily: "Arial, sans-serif",
    fontSize: "15px",
    primaryColor: "#273b30",
    primaryTextColor: "#f1e9d5",
    primaryBorderColor: "#b69b65",
    secondaryColor: "#34352a",
    secondaryTextColor: "#f1e9d5",
    secondaryBorderColor: "#a39774",
    tertiaryColor: "#202923",
    tertiaryTextColor: "#f1e9d5",
    tertiaryBorderColor: "#6e806b",
    lineColor: "#dac18d",
    textColor: "#f1e9d5",
    mainBkg: "#273b30",
    nodeBorder: "#b69b65",
    clusterBkg: "#1c2821",
    clusterBorder: "#6e806b",
    edgeLabelBackground: "#141b17",
    actorBkg: "#273b30",
    actorBorder: "#b69b65",
    actorTextColor: "#f1e9d5",
    actorLineColor: "#6e806b",
    signalColor: "#dac18d",
    signalTextColor: "#f1e9d5",
    noteBkgColor: "#34352a",
    noteTextColor: "#f1e9d5",
    noteBorderColor: "#b69b65",
    labelBoxBkgColor: "#202923",
    labelBoxBorderColor: "#6e806b",
    labelTextColor: "#f1e9d5",
    loopTextColor: "#f1e9d5",
    activationBkgColor: "#34352a",
    activationBorderColor: "#b69b65",
  },
});

let nextDiagram = 0;

export async function renderDiagram(source: string) {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.inert = true;
  host.style.cssText =
    "position:absolute;left:-100000px;top:0;pointer-events:none";
  document.body.append(host);
  try {
    await document.fonts.ready;
    // Mermaid queues concurrent renders; every request gets its own temporary DOM.
    const { svg } = await mermaid.render(
      `workstation-diagram-${++nextDiagram}`,
      source,
      host,
    );
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const root = doc.documentElement;
    // Preserve link-wrapper geometry while removing navigation from the SVG itself.
    for (const link of doc.querySelectorAll("a")) {
      const group = doc.createElementNS("http://www.w3.org/2000/svg", "g");
      const transform = link.getAttribute("transform");
      if (transform) group.setAttribute("transform", transform);
      group.append(...link.childNodes);
      link.replaceWith(group);
    }
    const viewBox = root
      .getAttribute("viewBox")
      ?.split(/[\s,]+/)
      .map(Number);
    if (viewBox?.length === 4 && viewBox.every(Number.isFinite)) {
      root.setAttribute("width", String(viewBox[2]));
      root.setAttribute("height", String(viewBox[3]));
    }
    const title = doc.querySelector("title")?.textContent;
    const description = doc.querySelector("desc")?.textContent;
    return {
      svg: new XMLSerializer().serializeToString(root),
      label: [title || "Mermaid diagram", description]
        .filter(Boolean)
        .join(". "),
    };
  } finally {
    host.remove();
  }
}
