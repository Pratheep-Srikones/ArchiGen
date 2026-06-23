/**
 * DiagramRenderer — thin wrapper around Mermaid.js.
 *
 * Mermaid mutates global state on initialize(), so we guard with a module-level
 * flag to ensure theme variables are only registered once per page load.
 * Theme colors mirror the cream / charcoal / blueprint palette in styles.css.
 *
 * Each render uses a randomized id to avoid collisions when multiple diagrams
 * are mounted simultaneously (e.g. the main diagram + user-generated extras).
 */
import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { AlertTriangle } from "lucide-react";

// Module-scoped guard: mermaid.initialize() is global and should run once.
let initialized = false;
function ensureInit() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    securityLevel: "loose",
    fontFamily: "Inter, ui-sans-serif, system-ui",
    themeVariables: {
      primaryColor: "#f7f4ed",
      primaryBorderColor: "#2563eb",
      primaryTextColor: "#1c1c1c",
      lineColor: "#5f5f5d",
      secondaryColor: "#f7f4ed",
      tertiaryColor: "#ffffff",
      background: "#ffffff",
    },
  });
  initialized = true;
}

interface DiagramRendererProps {
  id: string;
  source: string;
  className?: string;
}

export function DiagramRenderer({ id, source, className }: DiagramRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureInit();
    // `cancelled` prevents a stale async render from overwriting the DOM
    // after the component has unmounted or the source prop has changed.
    let cancelled = false;
    (async () => {
      try {
        // Suffix the id so re-renders don't collide with prior svg nodes.
        const renderId = `${id}-${Math.random().toString(36).slice(2, 8)}`;
        const { svg } = await mermaid.render(renderId, source);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        // Mermaid throws on malformed source — surface a friendly fallback
        // rather than letting the error bubble into the React tree.
        if (!cancelled) setError("Diagram could not be rendered");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, source]);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-charcoal-60 text-caption p-6">
        <AlertTriangle size={16} strokeWidth={1.5} />
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={"flex justify-center items-center w-full " + (className ?? "")}
    />
  );
}
