/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram = ({ chart }: MermaidDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      mermaid.initialize({ startOnLoad: true, theme: "neutral" });
      (async () => {
        try {
          // mermaid.render's return type varies between versions; use any to avoid TS signature mismatch
          const result = await (mermaid as any).render("mermaidChart", chart);
          const svgCode =
            typeof result === "string"
              ? result
              : (result && (result as any).svg) ?? "";
          if (containerRef.current) {
            containerRef.current.innerHTML = svgCode;
          }
        } catch (err) {
          console.error("Error rendering mermaid diagram:", err);
        }
      })();
    }
  }, [chart]);

  return <div ref={containerRef} className="w-full overflow-auto" />;
};

export default MermaidDiagram;
