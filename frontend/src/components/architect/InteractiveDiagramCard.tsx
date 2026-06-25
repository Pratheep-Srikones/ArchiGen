import { useRef, useState, useEffect } from "react";
import { DiagramRenderer } from "./DiagramRenderer";
import { ArchButton } from "./Button";
import { downloadPng, downloadSvg } from "@/lib/diagram-utils";
import { Download, Code, Eye, Copy, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveDiagramCardProps {
  id: string;
  title: string;
  initialSource: string;
  description?: string;
  className?: string;
}

export function InteractiveDiagramCard({
  id,
  title,
  initialSource,
  description = "Architecture diagram flow",
  className,
}: InteractiveDiagramCardProps) {
  const [source, setSource] = useState(initialSource);
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep source in sync if the initialSource prop changes
  useEffect(() => {
    setSource(initialSource);
  }, [initialSource]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy source:", err);
    }
  };

  const handleDownloadPng = () => {
    downloadPng(containerRef.current, title);
  };

  const handleDownloadSvg = () => {
    downloadSvg(containerRef.current, title);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="rounded-xl border border-blueprint-border overflow-hidden bg-off-white shadow-sm flex flex-col">
        {/* Main Display Area */}
        {showSource ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[450px]">
            {/* Editor Pane (Column 1-5) */}
            <div className="lg:col-span-5 flex flex-col border-b lg:border-b-0 lg:border-r border-border-passive bg-charcoal-03/40">
              <div className="flex items-center justify-between px-4 py-2.5 bg-cream/70 border-b border-border-passive">
                <span className="text-caption font-semibold text-charcoal flex items-center gap-1.5">
                  <Code size={14} className="text-charcoal-60" />
                  MERMAID SOURCE
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-charcoal-04 text-charcoal-60 hover:text-charcoal transition-colors flex items-center gap-1 text-[12px]"
                  title="Copy code to clipboard"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-success" />
                      <span className="text-success font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={source}
                onChange={(e) => setSource(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full p-4 font-mono text-[13px] bg-transparent text-charcoal resize-none outline-none focus:ring-0 leading-relaxed min-h-[250px] lg:min-h-0"
                placeholder="Enter Mermaid diagram code here..."
              />
              <div className="px-4 py-2 border-t border-border-passive bg-cream/30 text-[11px] text-muted flex items-center gap-1.5 shrink-0">
                <Info size={12} />
                <span>Edits render in the preview in real-time.</span>
              </div>
            </div>

            {/* Rendering Preview Pane (Column 6-12) */}
            <div className="lg:col-span-7 flex flex-col bg-white">
              <div className="flex items-center px-4 py-2.5 bg-cream/70 border-b border-border-passive lg:border-b">
                <span className="text-caption font-semibold text-charcoal flex items-center gap-1.5">
                  <Eye size={14} className="text-charcoal-60" />
                  PREVIEW
                </span>
              </div>
              <div
                ref={containerRef}
                className="flex-1 p-6 flex items-center justify-center overflow-auto min-h-[300px]"
              >
                <DiagramRenderer id={`edit-${id}`} source={source} className="max-w-full" />
              </div>
            </div>
          </div>
        ) : (
          /* Normal Display Box (Editor hidden) */
          <div className="bg-white p-6 flex justify-center items-center min-h-[350px] overflow-auto">
            <div ref={containerRef} className="w-full flex items-center justify-center">
              <DiagramRenderer id={`view-${id}`} source={source} />
            </div>
          </div>
        )}

        {/* Footer Actions Panel */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-cream border-t border-border-passive px-5 py-3 gap-3">
          <p className="text-caption text-muted font-medium truncate">{description}</p>
          <div className="flex flex-wrap items-center gap-2">
            <ArchButton
              variant="cream"
              size="sm"
              onClick={handleDownloadPng}
              className="flex-1 sm:flex-initial"
            >
              <Download size={14} strokeWidth={1.5} />
              Download PNG
            </ArchButton>
            <ArchButton
              variant="cream"
              size="sm"
              onClick={handleDownloadSvg}
              className="flex-1 sm:flex-initial"
            >
              <Download size={14} strokeWidth={1.5} />
              Download SVG
            </ArchButton>
            <ArchButton
              variant={showSource ? "primary" : "cream"}
              size="sm"
              onClick={() => setShowSource(!showSource)}
              className="flex-1 sm:flex-initial"
            >
              {showSource ? (
                <>
                  <Eye size={14} strokeWidth={1.5} />
                  Hide Source
                </>
              ) : (
                <>
                  <Code size={14} strokeWidth={1.5} />
                  View Source
                </>
              )}
            </ArchButton>
          </div>
        </div>
      </div>
    </div>
  );
}
