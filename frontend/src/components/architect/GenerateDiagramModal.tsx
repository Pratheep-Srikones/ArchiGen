import { useState } from "react";
import { generateDiagram } from "@/services/ai";
import { InteractiveDiagramCard } from "./InteractiveDiagramCard";
import { ArchButton } from "./Button";
import { ArchitectureOutput } from "@/lib/mock-data";
import { X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DIAGRAM_TYPES = [
  { label: "Use Case", value: "usecase" },
  { label: "Sequence", value: "sequence" },
  { label: "ER Diagram", value: "er" },
  { label: "Class Diagram", value: "class" },
  { label: "Flowchart", value: "flowchart" },
  { label: "State Machine", value: "state" },
] as const;

type DiagramLabel = (typeof DIAGRAM_TYPES)[number]["label"];

export interface GenerateDiagramModalProps {
  context: ArchitectureOutput;
  isOpen: boolean;
  onClose: () => void;
}

export function GenerateDiagramModal({ context, isOpen, onClose }: GenerateDiagramModalProps) {
  const [selectedType, setSelectedType] = useState<DiagramLabel>("Use Case");
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [generatedSource, setGeneratedSource] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  if (!isOpen) return null;

  const selectedValue = DIAGRAM_TYPES.find((t) => t.label === selectedType)?.value ?? "usecase";

  const handleGenerate = async () => {
    setStatus("generating");
    setErrorMessage("");
    try {
      const diagram = await generateDiagram({
        context: {
          title: context.title,
          requirements: context.requirements,
          architecture: context.architecture,
          mermaid_code: context.mermaid_code,
          micro: context.micro,
          tech_stack: context.tech_stack,
          repo: context.repo,
        },
        diagram_type: selectedValue,
        prompt,
      });
      if (typeof diagram !== "string") {
        throw new Error("Unexpected response from diagram service");
      }
      setGeneratedSource(diagram);
      setStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate diagram";
      setErrorMessage(message);
      setStatus("error");
      toast.error(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-cream border border-border-passive rounded-2xl shadow-modal w-full max-w-225 max-h-[90vh] overflow-y-auto p-7 animate-modal-in">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.5px] text-charcoal">
              Generate a Diagram
            </h2>
            <p className="text-caption text-muted mt-1">
              Describe the diagram you need for this architecture
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md border border-charcoal-40 p-1.5 text-charcoal hover:bg-charcoal-04"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {DIAGRAM_TYPES.map((t) => {
            const active = t.label === selectedType;
            return (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.label)}
                disabled={status === "generating"}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[14px] transition-colors",
                  active
                    ? "bg-charcoal text-off-white border-charcoal"
                    : "bg-cream text-charcoal border-border-passive hover:border-charcoal-40",
                  status === "generating" && "opacity-60 cursor-not-allowed",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-charcoal-40 bg-cream px-4 py-3">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={status === "generating"}
            className="w-full bg-transparent outline-none text-[16px] text-charcoal placeholder:text-muted disabled:opacity-60"
            placeholder="e.g. Use case diagram for the viewer authentication and stream access flow…"
          />
        </div>

        <div className="mt-5 flex justify-end">
          <ArchButton
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            disabled={status === "generating"}
          >
            {status === "generating" ? (
              <>
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                Generating…
              </>
            ) : (
              "Generate"
            )}
          </ArchButton>
        </div>

        <div className="mt-5">
          {status === "idle" && (
            <div className="rounded-xl border border-border-passive bg-cream p-8 min-h-[300px] flex items-center justify-center text-center">
              <p className="text-caption text-muted">
                Select a diagram type, describe what you need, and click Generate.
              </p>
            </div>
          )}

          {status === "generating" && (
            <div className="rounded-xl border border-blueprint-border bg-white p-8 min-h-[300px] flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted text-caption">
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                Generating diagram…
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-red-800">Diagram generation failed</p>
                  <p className="text-[14px] text-red-700 mt-1">{errorMessage}</p>
                  <div className="mt-4">
                    <ArchButton variant="ghost" size="sm" onClick={handleGenerate}>
                      Retry
                    </ArchButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === "success" && (
            <InteractiveDiagramCard
              id="generated-diagram"
              title={`${selectedType} — ${prompt || "Generated diagram"}`}
              initialSource={generatedSource}
              description={`AI-generated ${selectedType.toLowerCase()}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
