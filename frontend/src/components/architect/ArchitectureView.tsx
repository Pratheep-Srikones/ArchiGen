/**
 * ArchitectureView — presentational component rendering the full architecture
 * document: sticky project header, section tabs, and all content sections.
 *
 * Used by both the persisted `/architecture/$projectId` route and the
 * temporary `/result` post-generation route.
 */
import { useEffect, useRef, useState } from "react";
import { ArchButton } from "./Button";
import {
  type ArchitectureOutput,
  type MicroSection,
  type RepoNode,
  type TechItem,
} from "@/lib/mock-data";
import { Copy, Folder, File as FileIcon, Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { InteractiveDiagramCard } from "./InteractiveDiagramCard";
import { AskAIButton } from "./AskAIButton";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { GenerateDiagramModal } from "./GenerateDiagramModal";
import { toast } from "sonner";

export interface ExtraDiagram {
  id: string;
  title: string;
  source: string;
}

export interface ArchitectureViewProps {
  data: ArchitectureOutput;
  isTemporary?: boolean;
  isLoading?: boolean;
  onSave?: () => void;
  projectId?: string;
  onUpdateMermaidCode?: (projectId: string, mermaidCode: string) => Promise<void>;
}

const SECTIONS = [
  { id: "macro", label: "Macro Architecture" },
  { id: "micro", label: "Micro Architecture" },
  { id: "stack", label: "Tech Stack" },
  { id: "diagram", label: "Diagram" },
  { id: "repo", label: "Repository" },
] as const;

export function ArchitectureView({
  data,
  isTemporary = false,
  isLoading = false,
  onSave,
  projectId,
  onUpdateMermaidCode,
}: ArchitectureViewProps) {
  const [activeSection, setActiveSection] = useState<string>("macro");
  const [modalOpen, setModalOpen] = useState(false);
  const [extraDiagrams, setExtraDiagrams] = useState<ExtraDiagram[]>([]);
  const [dirtyMermaidCode, setDirtyMermaidCode] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-200px 0px -60% 0px", threshold: [0.1, 0.5] },
    );
    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleMainDiagramChange = (newSource: string) => {
    if (newSource !== data.mermaid_code) {
      setDirtyMermaidCode(newSource);
    } else {
      setDirtyMermaidCode(null);
    }
  };

  const handleUpdate = async () => {
    if (!projectId || !dirtyMermaidCode || !onUpdateMermaidCode) return;
    setIsUpdating(true);
    try {
      await onUpdateMermaidCode(projectId, dirtyMermaidCode);
      setDirtyMermaidCode(null);
    } catch {
      toast.error("Failed to update diagram");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="fixed top-14 left-0 right-0 z-30 bg-cream border-b border-border-passive">
        <div className="max-w-300 mx-auto px-6 py-3 flex items-center justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-card-title text-charcoal truncate">{data.title}</h1>
            <p className="text-caption text-muted italic truncate">{data.requirements}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isTemporary && (
              <ArchButton variant="primary" size="sm" onClick={onSave}>
                Save Project
              </ArchButton>
            )}
            {!isTemporary && projectId && (
              <>
                <ArchButton variant="ghost" size="sm">
                  Share
                </ArchButton>
                <AskAIButton projectId={projectId} architecture={data} />
                {dirtyMermaidCode !== null && (
                  <ArchButton
                    variant="primary"
                    size="sm"
                    onClick={handleUpdate}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                        Updating…
                      </>
                    ) : (
                      <>
                        <Pencil size={14} strokeWidth={1.5} />
                        Update
                      </>
                    )}
                  </ArchButton>
                )}
              </>
            )}
          </div>
        </div>

        {isTemporary && (
          <div className="border-t border-border-passive bg-blueprint-light px-6 py-2">
            <p className="text-caption text-charcoal-70 max-w-300 mx-auto">
              This is a generated preview. Save it to your workspace to keep it.
            </p>
          </div>
        )}

        <div className="border-t border-border-passive">
          <div
            className="max-w-300 mx-auto px-6 flex items-center gap-6 overflow-x-auto"
            role="tablist"
          >
            {SECTIONS.map((s) => {
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    "py-3 text-[14px] whitespace-nowrap border-b-2 -mb-px transition-colors",
                    active
                      ? "text-charcoal border-blueprint"
                      : "text-muted border-transparent hover:text-charcoal",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="pt-45 pb-32 px-6">
        <div className="max-w-225 mx-auto flex flex-col gap-10">
          <section
            id="macro"
            ref={(el) => {
              sectionRefs.current.macro = el;
            }}
            className="opacity-0 animate-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            <div className="rounded-xl border border-border-passive bg-cream p-8 border-l-[3px] border-l-blueprint">
              <p className="text-caption text-muted">High-level system overview</p>
              <h2 className="text-subsection text-charcoal mt-1">Architecture at Large</h2>
              <div className="mt-5 space-y-4 text-[16px] leading-[1.6] text-charcoal-82 whitespace-pre-line">
                {data.architecture}
              </div>
              <div className="mt-6">
                <ArchButton variant="cream" size="sm">
                  <Copy size={14} strokeWidth={1.5} /> Copy
                </ArchButton>
              </div>
            </div>
          </section>

          <section
            id="micro"
            ref={(el) => {
              sectionRefs.current.micro = el;
            }}
            className="opacity-0 animate-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            <div className="rounded-xl border border-border-passive bg-cream p-8">
              <p className="text-caption text-muted">Component internals & service boundaries</p>
              <h2 className="text-subsection text-charcoal mt-1">Architecture at Small</h2>
              <div className="mt-6 space-y-6">
                {data.micro.map((sub) => (
                  <div key={sub.title}>
                    <h3 className="text-card-title text-charcoal pb-2 border-b border-border-passive">
                      {sub.title}
                    </h3>
                    <p className="mt-3 text-[16px] leading-[1.6] text-charcoal-82">{sub.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="stack"
            ref={(el) => {
              sectionRefs.current.tech_stack = el;
            }}
            className="opacity-0 animate-fade-up"
            style={{ animationDelay: "160ms" }}
          >
            <h2 className="text-subsection text-charcoal mb-5">Technology Stack</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.tech_stack.map((t) => (
                <TechCard key={t.name} item={t} />
              ))}
            </div>
          </section>

          <section
            id="diagram"
            ref={(el) => {
              sectionRefs.current.diagram = el;
            }}
            className="opacity-0 animate-fade-up"
            style={{ animationDelay: "240ms" }}
          >
            <h2 className="text-subsection text-charcoal mb-5">High-Level Architecture</h2>
            <InteractiveDiagramCard
              id="main-diagram"
              title={data.title}
              initialSource={data.mermaid_code}
              description={
                dirtyMermaidCode !== null
                  ? "Unsaved changes — click Update to save"
                  : "High-level system flow"
              }
              onSourceChange={handleMainDiagramChange}
              isDirty={dirtyMermaidCode !== null}
            />

            {extraDiagrams.map((d) => (
              <InteractiveDiagramCard
                key={d.id}
                id={d.id}
                title={d.title}
                initialSource={d.source}
                description={d.title}
                className="mt-5"
              />
            ))}
          </section>

          <section
            id="repo"
            ref={(el) => {
              sectionRefs.current.repo = el;
            }}
            className="opacity-0 animate-fade-up"
            style={{ animationDelay: "320ms" }}
          >
            <h2 className="text-subsection text-charcoal mb-5">Code Repository Structure</h2>
            <div className="flex justify-end mb-2">
              <ArchButton variant="cream" size="sm">
                <Copy size={14} strokeWidth={1.5} /> Copy Structure
              </ArchButton>
            </div>
            <div className="rounded-lg border border-border-passive bg-charcoal-03 p-6 font-mono text-[14px] leading-[1.8]">
              {data.repo.map((node) => (
                <FileTreeNode key={node.name} node={node} depth={0} />
              ))}
            </div>
          </section>

          <div className="flex justify-center mt-12">
            <div className="max-w-140 w-full text-center rounded-xl border border-dashed border-charcoal-20 p-8">
              <h3 className="text-card-title text-charcoal">Need a specific diagram?</h3>
              <p className="text-[16px] text-muted mt-2">
                Generate use case diagrams, sequence diagrams, ER diagrams, and more.
              </p>
              <div className="mt-5 flex justify-center">
                <ArchButton variant="primary" size="sm" onClick={() => setModalOpen(true)}>
                  Generate Diagram
                </ArchButton>
              </div>
            </div>
          </div>
        </div>
      </main>

      {modalOpen && (
        <GenerateDiagramModal
          context={data}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
      {projectId && <ChatDrawer projectId={projectId} />}
    </div>
  );
}

function TechCard({ item }: { item: TechItem }) {
  return (
    <div className="rounded-lg border border-border-passive bg-cream p-4">
      <span className="inline-block rounded-full bg-charcoal-04 px-2.5 py-0.5 text-[12px] text-charcoal">
        {item.layer}
      </span>
      <h4 className="text-[16px] text-charcoal mt-2">{item.name}</h4>
      <p className="text-caption text-muted mt-0.5">{item.role}</p>
      <p className="text-caption text-charcoal-60 italic mt-1">{item.justification}</p>
    </div>
  );
}

function FileTreeNode({ node, depth }: { node: RepoNode; depth: number }) {
  return (
    <div>
      <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
        {node.type === "directory" ? (
          <Folder size={14} strokeWidth={1.5} className="text-muted shrink-0" />
        ) : (
          <FileIcon size={14} strokeWidth={1.5} className="text-charcoal-40 shrink-0" />
        )}
        <span className={node.type === "directory" ? "text-charcoal" : "text-charcoal-70"}>
          {node.name}
          {node.type === "directory" ? "/" : ""}
        </span>
        {node.annotation && <span className="text-muted italic">// {node.annotation}</span>}
      </div>
      {node.children?.map((c) => (
        <FileTreeNode key={c.name} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}
