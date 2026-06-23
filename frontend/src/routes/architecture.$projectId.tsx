/**
 * Route: "/architecture/$projectId" — generated architecture detail view.
 *
 * Layout:
 *   - Sticky project header + section tabs (Macro, Micro, Stack, Diagram, Repo)
 *   - Long-form content sections, each registered with an IntersectionObserver
 *     so the active tab tracks the scroll position
 *   - "Generate Diagram" CTA opens a modal that appends additional Mermaid
 *     diagrams to the Diagram section
 *
 * Currently every projectId renders the same MOCK_ARCHITECTURE fixture; once
 * the backend lands, fetch by params.projectId from a server function.
 */
import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { NavigationBar } from "@/components/architect/NavigationBar";
import { ArchButton } from "@/components/architect/Button";
import { DiagramRenderer } from "@/components/architect/DiagramRenderer";
import {
  MOCK_ARCHITECTURE,
  MOCK_GENERATED_DIAGRAM,
  type ArchitectureOutput,
  type RepoNode,
  type TechItem,
} from "@/lib/mock-data";
import { Copy, Folder, File as FileIcon, X, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/architecture/$projectId")({
  component: ArchitecturePage,
  head: () => ({
    meta: [
      { title: "Live Streaming Service Architecture — ArchitectAI" },
      {
        name: "description",
        content:
          "Complete architecture for a live streaming platform: macro design, micro components, tech stack, Mermaid diagram, and repository structure.",
      },
    ],
  }),
});

const SECTIONS = [
  { id: "macro", label: "Macro Architecture" },
  { id: "micro", label: "Micro Architecture" },
  { id: "stack", label: "Tech Stack" },
  { id: "diagram", label: "Diagram" },
  { id: "repo", label: "Repository" },
] as const;

interface ExtraDiagram {
  id: string;
  title: string;
  source: string;
}

interface ArchitectureLocationState {
  architecture?: ArchitectureOutput;
}

function ArchitecturePage() {
  const location = useLocation();
  const state = location.state as ArchitectureLocationState | undefined;
  const data = state?.architecture ?? MOCK_ARCHITECTURE;
  const [activeSection, setActiveSection] = useState<string>("macro");
  const [modalOpen, setModalOpen] = useState(false);
  const [extraDiagrams, setExtraDiagrams] = useState<ExtraDiagram[]>([]);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Sync the highlighted tab with whichever section is most prominently in
  // view. The negative top rootMargin offsets the sticky header so a section
  // is only "active" once it scrolls past the header band.
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

  return (
    <div className="min-h-screen bg-cream">
      <NavigationBar showNewButton />
      {/* Project header */}
      <div className="fixed top-14 left-0 right-0 z-30 bg-cream border-b border-border-passive">
        <div className="max-w-300 mx-auto px-6 py-3 flex items-center justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-card-title text-charcoal truncate">{data.title}</h1>
            <p className="text-caption text-muted italic truncate">{data.requirements}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ArchButton variant="ghost" size="sm">
              Share
            </ArchButton>
            <ArchButton variant="primary" size="sm">
              Save Project
            </ArchButton>
          </div>
        </div>
        {/* Section tabs */}
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
          {/* Macro */}
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

          {/* Micro */}
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

          {/* Tech Stack */}
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

          {/* Diagram */}
          <section
            id="diagram"
            ref={(el) => {
              sectionRefs.current.diagram = el;
            }}
            className="opacity-0 animate-fade-up"
            style={{ animationDelay: "240ms" }}
          >
            <h2 className="text-subsection text-charcoal mb-5">High-Level Architecture</h2>
            <div className="rounded-xl border border-blueprint-border overflow-hidden">
              <div className="bg-white p-6">
                <DiagramRenderer id="main-diagram" source={data.mermaid_code} />
              </div>
              <div className="flex items-center justify-between bg-cream border-t border-border-passive px-5 py-3">
                <p className="text-caption text-muted">High-level system flow</p>
                <div className="flex items-center gap-2">
                  <ArchButton variant="cream" size="sm">
                    Download PNG
                  </ArchButton>
                  <ArchButton variant="cream" size="sm">
                    Download SVG
                  </ArchButton>
                  <ArchButton variant="cream" size="sm">
                    View Source
                  </ArchButton>
                </div>
              </div>
            </div>

            {extraDiagrams.map((d) => (
              <div
                key={d.id}
                className="mt-5 rounded-xl border border-blueprint-border overflow-hidden opacity-0 animate-fade-up"
              >
                <div className="bg-white p-6">
                  <DiagramRenderer id={d.id} source={d.source} />
                </div>
                <div className="bg-cream border-t border-border-passive px-5 py-3">
                  <p className="text-caption text-muted">{d.title}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Repo */}
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

          {/* CTA */}
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
        <DiagramModal
          onClose={() => setModalOpen(false)}
          onAdd={(d) => {
            setExtraDiagrams((prev) => [...prev, d]);
            setModalOpen(false);
          }}
        />
      )}
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

const DIAGRAM_TYPES = [
  "Use Case",
  "Sequence",
  "ER Diagram",
  "Class Diagram",
  "Flowchart",
  "State Machine",
] as const;

function DiagramModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (d: ExtraDiagram) => void;
}) {
  const [selectedType, setSelectedType] = useState<string>("Use Case");
  const [prompt, setPrompt] = useState(
    "Use case diagram for viewer authentication and stream joining flow",
  );
  const [state, setState] = useState<"idle" | "generating" | "generated">("idle");
  const [iteration, setIteration] = useState(0);

  // Auto-kick the simulated generation when the modal first opens so the
  // user sees a result without having to press a button.
  useEffect(() => {
    setState("generating");
    const t = setTimeout(() => {
      setState("generated");
      setIteration(1);
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  const regenerate = () => {
    setState("generating");
    setTimeout(() => {
      setState("generated");
      setIteration((i) => i + 1);
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-cream border border-border-passive rounded-2xl shadow-modal w-full max-w-180 max-h-[90vh] overflow-y-auto p-7 animate-modal-in">
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
            const active = t === selectedType;
            return (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[14px] transition-colors",
                  active
                    ? "bg-charcoal text-off-white border-charcoal"
                    : "bg-cream text-charcoal border-border-passive hover:border-charcoal-40",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-charcoal-40 bg-cream px-4 py-3">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-transparent outline-none text-[16px] text-charcoal placeholder:text-muted"
            placeholder="e.g. Use case diagram for the viewer authentication and stream access flow…"
          />
        </div>

        <div className="mt-5">
          <p className="text-caption text-muted mb-2">Generated Diagram</p>
          <div className="rounded-xl border border-blueprint-border overflow-hidden bg-white">
            <div className="p-5 min-h-60 flex items-center justify-center">
              {state === "generating" ? (
                <div className="flex items-center gap-2 text-muted text-caption">
                  <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                  Generating diagram…
                </div>
              ) : state === "generated" ? (
                <DiagramRenderer id={`gen-${iteration}`} source={MOCK_GENERATED_DIAGRAM} />
              ) : null}
            </div>
          </div>
        </div>

        {state === "generated" && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-caption text-muted">Modify:</span>
            <input
              placeholder="e.g. Add an admin actor with moderation use cases…"
              className="flex-1 rounded-md border border-border-passive bg-charcoal-03 px-3 py-1.5 text-[14px] text-charcoal outline-none focus:shadow-focus"
            />
            <ArchButton variant="ghost" size="sm" onClick={regenerate}>
              Apply
            </ArchButton>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-border-passive flex items-center justify-between gap-3">
          <ArchButton
            variant="primary"
            size="sm"
            disabled={state !== "generated"}
            onClick={() =>
              onAdd({
                id: `extra-${Date.now()}`,
                title: `${selectedType} — ${prompt}`,
                source: MOCK_GENERATED_DIAGRAM,
              })
            }
          >
            Add to Project
          </ArchButton>
          <div className="flex items-center gap-2">
            <ArchButton variant="cream" size="sm">
              <Download size={14} strokeWidth={1.5} /> Download SVG
            </ArchButton>
            <ArchButton variant="ghost" size="sm">
              Suggest Modifications
            </ArchButton>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-muted text-right">Iteration {iteration} of 3</p>
      </div>
    </div>
  );
}
