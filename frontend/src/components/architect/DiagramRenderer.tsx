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
        if (!cancelled) {
          setError(null);
          // Allow DOM update in next tick
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.innerHTML = svg;
            }
          }, 0);
        }
      } catch (e: any) {
        // Extract descriptive error details if possible
        if (!cancelled) {
          const errMsg = e?.message || (e && typeof e === "object" ? JSON.stringify(e) : String(e));
          setError(errMsg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, source]);

  if (error) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-error/20 bg-error/5 p-6 text-left w-full max-w-full overflow-hidden animate-fade-up">
        <div className="flex items-center gap-2 text-error font-semibold text-[15px]">
          <AlertTriangle size={18} strokeWidth={2} className="shrink-0" />
          Mermaid Syntax Error
        </div>
        <p className="text-caption text-charcoal-70">
          The diagram could not be rendered due to a syntax issue. You can edit the code source to
          fix it:
        </p>
        <pre className="p-4 bg-charcoal text-off-white rounded-lg font-mono text-[12px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 select-text border border-charcoal/10">
          {error}
        </pre>
        <p className="text-[12px] text-muted italic">
          Tip: Check for matching quotes, valid syntax connections (like `--&gt;`), and correct
          direction nodes.
        </p>
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
