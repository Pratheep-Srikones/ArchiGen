/**
 * Route: "/processing" — Real-Time Agentic Pipeline Stream.
 *
 * Connects to the SSE endpoint /ai/generate-architecture/stream,
 * visualizes the multi-agent collaboration graph in real time,
 * captures validator reflection loops & scores, and displays live
 * system telemetry before handing off to /result.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { NavigationBar } from "@/components/architect/NavigationBar";
import type { ArchitectureOutput } from "@/lib/mock-data";
import {
  streamArchitectureResponse,
  type StreamEvent,
} from "@/services/ai";
import {
  Check,
  Terminal,
  Layout,
  Layers,
  Cpu,
  GitBranch,
  FolderGit,
  ShieldCheck,
  Clock,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Activity,
  Wrench,
  CheckCircle2,
  Copy,
  Zap,
  ArrowRight,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ prompt: z.string().optional() });

export const Route = createFileRoute("/processing")({
  validateSearch: searchSchema,
  component: ProcessingPage,
  head: () => ({
    meta: [{ title: "Generating Architecture — ArchiGen" }],
  }),
});

interface PipelineStep {
  id: string;
  agentName: string;
  label: string;
  role: string;
  subMessage: string;
  icon: React.ComponentType<any>;
  status: "pending" | "active" | "completed" | "retry";
  phase: "macro" | "micro" | "specialist" | "synthesis";
  verdict?: {
    verdict: "ok" | "retry";
    score: number;
    issues: string[];
  };
}

interface TraceLog {
  id: string;
  time: string;
  agent: string;
  type: "start" | "output" | "verdict_ok" | "verdict_retry" | "tool_call" | "tool_result" | "final" | "error" | "init";
  message: string;
}

const INITIAL_STEPS: PipelineStep[] = [
  {
    id: "macro_gen",
    agentName: "ArchitectureGenerator",
    label: "Macro Architecture Synthesis",
    role: "Lead Systems Architect",
    subMessage: "Designing core subsystems, high-level topology, and service boundaries",
    icon: Layout,
    status: "active",
    phase: "macro",
  },
  {
    id: "macro_val",
    agentName: "ArchitectureAtLargeValidator",
    label: "Macro Feasibility & Quality Gate",
    role: "Principal Architectural Reviewer",
    subMessage: "Evaluating scalability, security boundaries, and architectural soundness",
    icon: ShieldCheck,
    status: "pending",
    phase: "macro",
  },
  {
    id: "micro_gen",
    agentName: "ArchitectureAtSmallGenerator",
    label: "Micro Technical Specification",
    role: "Senior Systems Engineer",
    subMessage: "Specifying subsystem internals, API contracts, and communication protocols",
    icon: Layers,
    status: "pending",
    phase: "micro",
  },
  {
    id: "micro_val",
    agentName: "ArchitectureAtSmallValidator",
    label: "Micro Soundness & Contract Review",
    role: "Technical Reviewer",
    subMessage: "Auditing internal subsystem contracts, edge conditions, and error recovery",
    icon: ShieldCheck,
    status: "pending",
    phase: "micro",
  },
  {
    id: "tech_stack",
    agentName: "TechStackSelector",
    label: "Domain-Tailored Stack Selection",
    role: "Technology Specialist",
    subMessage: "Selecting optimal databases, frameworks, messaging, and cloud primitives",
    icon: Cpu,
    status: "pending",
    phase: "specialist",
  },
  {
    id: "diagram",
    agentName: "MermaidArchitect",
    label: "System Flowchart Synthesis",
    role: "Visual System Designer",
    subMessage: "Compiling verified Mermaid.js flowchart and component relationship graph",
    icon: GitBranch,
    status: "pending",
    phase: "specialist",
  },
  {
    id: "repo",
    agentName: "RepoBuilder",
    label: "Repository Tree Structuring",
    role: "Lead Developer",
    subMessage: "Constructing hierarchical monorepo layout and service directory structures",
    icon: FolderGit,
    status: "pending",
    phase: "specialist",
  },
  {
    id: "packager",
    agentName: "JSONPackager",
    label: "Final Specification Synthesis",
    role: "Packaging Engine",
    subMessage: "Validating schema compliance and compiling full ArchitectureData package",
    icon: Terminal,
    status: "pending",
    phase: "synthesis",
  },
];

type LogFilter = "all" | "verdicts" | "tools" | "output";

function ProcessingPage() {
  const { prompt } = Route.useSearch();
  const navigate = useNavigate();

  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [activeAgent, setActiveAgent] = useState<string>("ArchitectureGenerator");
  const [currentThought, setCurrentThought] = useState<string>(
    "Deconstructing system requirements and establishing subsystem boundaries..."
  );
  const [iteration, setIteration] = useState<number>(0);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState<number>(0);
  const [toolCallsCount, setToolCallsCount] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [architecture, setArchitecture] = useState<ArchitectureOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [traceLogs, setTraceLogs] = useState<TraceLog[]>([]);
  const [activeFilter, setActiveFilter] = useState<LogFilter>("all");
  const [isDone, setIsDone] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Bounce if prompt is missing
  useEffect(() => {
    if (!prompt) {
      navigate({ to: "/" });
    }
  }, [prompt, navigate]);

  // Live stopwatch timer
  useEffect(() => {
    if (isDone || error) return;
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);
    return () => clearInterval(interval);
  }, [isDone, error]);

  // Auto-scroll terminal logs to bottom unless scrolled up
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [traceLogs, activeFilter]);

  // Main SSE Stream Consumer
  useEffect(() => {
    if (!prompt) return;

    abortControllerRef.current = new AbortController();
    startTimeRef.current = Date.now();

    const addLog = (
      agent: string,
      type: TraceLog["type"],
      message: string
    ) => {
      const nowOffset = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
      setTraceLogs((prev) => [
        ...prev.slice(-60), // keep recent 60 logs
        {
          id: `${Date.now()}-${Math.random()}`,
          time: `+${nowOffset}s`,
          agent: agent || "Orchestrator",
          type,
          message,
        },
      ]);
    };

    addLog("Orchestrator", "init", "Initialized Google ADK workflow runner and session context");

    streamArchitectureResponse(
      prompt,
      (event: StreamEvent) => {
        setEventCount((prev) => prev + 1);

        if (event.iteration !== undefined && event.iteration > 0) {
          setIteration(event.iteration);
        }

        switch (event.type) {
          case "agent_start": {
            const agentName = event.agent || "";
            setActiveAgent(agentName);
            addLog(agentName, "start", `Agent activated: ${agentName}`);

            setSteps((prev) => {
              const targetIdx = prev.findIndex((s) => s.agentName === agentName);
              if (targetIdx === -1) return prev;

              return prev.map((step, idx) => {
                if (idx < targetIdx) {
                  return step.status === "completed"
                    ? step
                    : { ...step, status: "completed" };
                } else if (idx === targetIdx) {
                  return { ...step, status: "active" };
                } else {
                  return step.status === "retry" ? step : { ...step, status: "pending" };
                }
              });
            });
            break;
          }

          case "agent_output": {
            const preview = event.data?.preview;
            if (preview) {
              setCurrentThought(preview);
              addLog(event.agent || "", "output", preview);
            }
            break;
          }

          case "verdict": {
            const verdictData = event.data;
            const agentName = event.agent || "";
            const isRetry = verdictData?.verdict === "retry";
            const score = verdictData?.score ?? 10;
            const issues = verdictData?.issues || [];

            if (verdictData?.score !== undefined) {
              setQualityScore(score);
            }

            if (isRetry) {
              addLog(
                agentName,
                "verdict_retry",
                `Review REJECTED (Score: ${score}/10) — Loop triggered: ${issues.join("; ")}`
              );
            } else {
              addLog(
                agentName,
                "verdict_ok",
                `Review PASSED (Score: ${score}/10) — Output approved for downstream execution`
              );
            }

            setSteps((prev) =>
              prev.map((step) => {
                if (step.agentName === agentName) {
                  return {
                    ...step,
                    status: isRetry ? "retry" : "completed",
                    verdict: {
                      verdict: isRetry ? "retry" : "ok",
                      score,
                      issues,
                    },
                  };
                }
                return step;
              })
            );
            break;
          }

          case "tool_call": {
            setToolCallsCount((prev) => prev + 1);
            const tool = event.data?.tool || "tool";
            addLog(event.agent || "", "tool_call", `Tool Invocation: ${tool}`);
            break;
          }

          case "tool_result": {
            const tool = event.data?.tool || "tool";
            addLog(event.agent || "", "tool_result", `Tool Result: ${tool} succeeded`);
            break;
          }

          case "final": {
            setIsDone(true);
            const finalData = event.data as ArchitectureOutput;
            setArchitecture(finalData);
            addLog("JSONPackager", "final", "Full architecture specification validated and compiled successfully!");

            setSteps((prev) =>
              prev.map((s) => ({ ...s, status: "completed" }))
            );
            break;
          }

          case "error": {
            const errMsg = event.data?.error || "Unknown stream error occurred";
            setError(errMsg);
            addLog(event.agent || "Error", "error", errMsg);
            break;
          }
        }
      },
      abortControllerRef.current.signal
    ).catch((err: Error) => {
      if (err.name === "AbortError") {
        addLog("Client", "start", "Generation cancelled by user");
        return;
      }
      console.error("Stream generation failed:", err);
      setError(err.message ?? "Generation failed. Please try again.");
    });

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [prompt]);

  // Navigate to result page on completion with smooth delay
  useEffect(() => {
    if (architecture) {
      const timer = setTimeout(() => {
        navigate({
          to: "/result",
          state: { architecture } as Record<string, unknown>,
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [architecture, navigate]);

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progressPercent = isDone
    ? 100
    : Math.min(96, Math.round((completedCount / steps.length) * 100));

  // Format elapsed time MM:SS.s
  const formattedTime = useMemo(() => {
    const totalSec = elapsedMs / 1000;
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(1);
    return `${mins.toString().padStart(2, "0")}:${secs.padStart(4, "0")}s`;
  }, [elapsedMs]);

  const activeStep = steps.find((s) => s.status === "active");

  const filteredLogs = useMemo(() => {
    if (activeFilter === "verdicts") {
      return traceLogs.filter((l) => l.type === "verdict_ok" || l.type === "verdict_retry");
    }
    if (activeFilter === "tools") {
      return traceLogs.filter((l) => l.type === "tool_call" || l.type === "tool_result");
    }
    if (activeFilter === "output") {
      return traceLogs.filter((l) => l.type === "output" || l.type === "final");
    }
    return traceLogs;
  }, [traceLogs, activeFilter]);

  const copyTraceToClipboard = () => {
    const fullText = traceLogs
      .map((l) => `[${l.time}] [${l.agent}] [${l.type.toUpperCase()}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(fullText);
    toast.success("Execution trace copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-cream bg-[radial-gradient(rgba(28,28,28,0.04)_1px,transparent_1px)] [background-size:24px_24px] flex flex-col font-sans selection:bg-blueprint/20">
      <NavigationBar showNewButton={false} />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Top Header Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blueprint-light border border-blueprint-border/30 text-caption font-semibold text-blueprint shadow-xs mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blueprint opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blueprint" />
            </span>
            <span>Multi-Agent Swarm Orchestrator · Real-Time ADK Trace</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight">
            Autonomous System Architecture
          </h1>
          <p className="text-sm text-muted max-w-xl mx-auto mt-1.5">
            Real-time reflection, specialist tool execution, and structured verification across 8 collaborative agents.
          </p>
        </div>

        {/* Real-Time Telemetry HUD Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
          {/* 1. Active Agent Card */}
          <div className="rounded-xl border border-border-passive bg-off-white/90 backdrop-blur-sm p-4 shadow-xs hover:border-charcoal-20 transition-all">
            <div className="flex items-center justify-between text-caption font-medium text-muted">
              <span className="flex items-center gap-1.5">
                <Activity size={13} className="text-blueprint animate-pulse" />
                ACTIVE AGENT
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blueprint-light text-blueprint font-semibold">
                Turn
              </span>
            </div>
            <div className="mt-2 font-semibold text-charcoal truncate text-[15px]" title={activeAgent}>
              {isDone ? "Workflow Complete" : activeStep?.role || activeAgent}
            </div>
            <div className="text-xs text-muted font-mono truncate mt-0.5">
              {isDone ? "All artifacts sealed" : activeAgent}
            </div>
          </div>

          {/* 2. Latency Stopwatch */}
          <div className="rounded-xl border border-border-passive bg-off-white/90 backdrop-blur-sm p-4 shadow-xs hover:border-charcoal-20 transition-all">
            <div className="flex items-center justify-between text-caption font-medium text-muted">
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-charcoal-40" />
                EXECUTION TIME
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-charcoal-04 text-charcoal-70 font-medium">
                Live
              </span>
            </div>
            <div className="mt-2 font-mono font-bold text-charcoal text-[17px] tracking-tight">
              {formattedTime}
            </div>
            <div className="text-xs text-muted truncate mt-0.5">
              {isDone ? "Total latency captured" : "High-precision timer"}
            </div>
          </div>

          {/* 3. Reflection Loops / Revisions */}
          <div className="rounded-xl border border-border-passive bg-off-white/90 backdrop-blur-sm p-4 shadow-xs hover:border-charcoal-20 transition-all">
            <div className="flex items-center justify-between text-caption font-medium text-muted">
              <span className="flex items-center gap-1.5">
                <RotateCcw size={13} className={iteration > 0 ? "text-amber-500 animate-spin" : "text-charcoal-40"} />
                REFLECTION LOOPS
              </span>
              {iteration > 0 && (
                <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">
                  Active
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-semibold text-charcoal text-[17px]">
                {iteration}
              </span>
              <span className="text-xs text-muted font-normal">/ 2 max allowed</span>
            </div>
            <div className="text-xs text-muted truncate mt-0.5">
              {iteration > 0 ? "Self-correction applied" : "Clean initial passes"}
            </div>
          </div>

          {/* 4. Quality Score & Telemetry */}
          <div className="rounded-xl border border-border-passive bg-off-white/90 backdrop-blur-sm p-4 shadow-xs hover:border-charcoal-20 transition-all">
            <div className="flex items-center justify-between text-caption font-medium text-muted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-success" />
                QUALITY VERDICT
              </span>
              {qualityScore !== null && (
                <span className="text-[10px] bg-success/10 text-success border border-success/30 px-1.5 py-0.5 rounded-full font-medium">
                  Audited
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              {qualityScore !== null ? (
                <>
                  <span className="font-bold text-charcoal text-[17px]">
                    {qualityScore}
                  </span>
                  <span className="text-xs text-muted font-normal">/ 10 points</span>
                </>
              ) : (
                <span className="text-muted text-sm italic">In review...</span>
              )}
            </div>
            <div className="text-xs text-muted truncate mt-0.5 font-mono">
              {eventCount} events · {toolCallsCount} tools
            </div>
          </div>
        </div>

        {/* User Prompt Specification Box */}
        <div className="rounded-xl border border-border-passive bg-off-white/80 p-4 shadow-xs mb-8 flex items-start gap-3">
          <Terminal size={16} className="text-charcoal-40 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-charcoal-40 uppercase tracking-wider block mb-1">
              INPUT REQUIREMENT SPECIFICATION
            </span>
            <p className="text-sm italic text-charcoal pl-3 border-l-2 border-blueprint/60 line-clamp-2">
              "{prompt}"
            </p>
          </div>
        </div>

        {/* Main 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 Cols): Multi-Agent Stepper */}
          <div className="lg:col-span-7 rounded-xl border border-border-passive bg-off-white/90 backdrop-blur-sm p-6 shadow-sm">
            {/* Pipeline Header and Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-caption mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-charcoal text-sm">
                    Multi-Agent Pipeline
                  </span>
                  <span className="text-muted text-xs font-mono">
                    ({completedCount}/{steps.length} completed)
                  </span>
                </div>
                <span className="font-bold font-mono text-blueprint text-sm">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 bg-border-passive rounded-full overflow-hidden">
                <div
                  className="h-full bg-blueprint transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stepper Timeline */}
            <ol role="list" className="space-y-1">
              {steps.map((step, idx) => (
                <PipelineStepRow
                  key={step.id}
                  step={step}
                  isFirst={idx === 0}
                  isLast={idx === steps.length - 1}
                  prevStatus={idx > 0 ? steps[idx - 1].status : undefined}
                />
              ))}
            </ol>
          </div>

          {/* Right Column (5 Cols): Live Activity & Trace Console */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Agent Thought Card */}
            <div className="rounded-xl border border-border-passive bg-off-white/95 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-blueprint animate-bounce" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                    Live Agent Reasoning
                  </span>
                </div>
                <span className="text-[11px] text-muted font-mono">
                  {activeStep?.role || "Synthesizing"}
                </span>
              </div>

              <div className="bg-cream/60 rounded-lg p-3.5 border border-border-passive/60 text-xs text-charcoal-70 leading-relaxed min-h-[4.5rem] flex items-center">
                <p className="line-clamp-3 italic">
                  "{currentThought}"
                  <span className="inline-block w-1.5 h-3 bg-blueprint animate-pulse ml-1 align-middle" />
                </p>
              </div>
            </div>

            {/* Live Terminal Trace Console */}
            <div className="rounded-xl border border-charcoal-20 bg-[#14161B] text-gray-200 shadow-md overflow-hidden">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#1C1F26] border-b border-charcoal-20">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                  </div>
                  <span className="text-xs font-mono font-medium text-gray-300 ml-1.5 flex items-center gap-1.5">
                    <Terminal size={12} className="text-blueprint" />
                    Agent Trace Console
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={copyTraceToClipboard}
                    title="Copy full execution trace"
                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 px-4 py-1.5 bg-[#171920] border-b border-charcoal-20/60 text-[11px] font-mono">
                <Filter size={11} className="text-gray-500 mr-1" />
                {(["all", "verdicts", "tools", "output"] as LogFilter[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={cn(
                      "px-2 py-0.5 rounded capitalize transition-colors",
                      activeFilter === tab
                        ? "bg-blueprint/20 text-blueprint font-semibold border border-blueprint/30"
                        : "text-gray-400 hover:text-gray-200"
                    )}
                  >
                    {tab}
                  </button>
                ))}
                <span className="ml-auto text-[10px] text-gray-500">
                  {filteredLogs.length} entries
                </span>
              </div>

              {/* Terminal Output Body */}
              <div
                ref={logsContainerRef}
                className="p-4 font-mono text-[11.5px] leading-relaxed h-[360px] overflow-y-auto space-y-2 bg-[#0E1014] select-text"
              >
                {filteredLogs.length === 0 ? (
                  <div className="text-gray-500 italic py-4 text-center">
                    No logs matching selected filter
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 hover:bg-white/[0.02] py-0.5 rounded px-1 transition-colors">
                      <span className="text-gray-500 select-none shrink-0 font-light">{log.time}</span>
                      <span className={cn(
                        "px-1.5 py-0.2 rounded text-[9.5px] font-semibold uppercase tracking-wider shrink-0",
                        log.type === "verdict_ok" && "bg-emerald-950/80 text-emerald-400 border border-emerald-800",
                        log.type === "verdict_retry" && "bg-amber-950/80 text-amber-300 border border-amber-800 animate-pulse",
                        log.type.startsWith("tool") && "bg-purple-950/80 text-purple-300 border border-purple-800",
                        log.type === "final" && "bg-blue-950/80 text-blue-300 border border-blue-800",
                        log.type === "error" && "bg-red-950/80 text-red-300 border border-red-800",
                        log.type === "start" && "bg-cyan-950/80 text-cyan-300 border border-cyan-800",
                        log.type === "init" && "bg-gray-800 text-gray-300",
                        log.type === "output" && "bg-gray-800/80 text-gray-300"
                      )}>
                        {log.agent}
                      </span>
                      <span className="text-gray-300 break-words flex-1">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Success Completion Toast Card */}
            {isDone && (
              <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success font-medium flex items-center justify-between animate-fade-up shadow-xs">
                <span className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span>Architecture synthesized! Forwarding to preview...</span>
                </span>
                <Sparkles size={16} className="animate-spin text-success" />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error font-medium flex items-center gap-2.5 shadow-xs">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-10 text-center">
          <button
            onClick={() => {
              abortControllerRef.current?.abort();
              navigate({ to: "/" });
            }}
            className="text-caption text-muted hover:text-charcoal underline underline-offset-4 decoration-border-passive transition-colors"
          >
            Cancel generation and return home
          </button>
        </div>
      </main>
    </div>
  );
}

interface StepRowProps {
  step: PipelineStep;
  isFirst: boolean;
  isLast: boolean;
  prevStatus?: PipelineStep["status"];
}

function PipelineStepRow({ step, isFirst, isLast, prevStatus }: StepRowProps) {
  const isActive = step.status === "active";
  const isCompleted = step.status === "completed";
  const isRetry = step.status === "retry";
  const isPending = step.status === "pending";

  const IconComponent = step.icon;

  const topLineClass = !isFirst
    ? prevStatus === "completed"
      ? "bg-success w-[2px]"
      : isActive
        ? "bg-blueprint w-[2px] animate-pulse"
        : isRetry
          ? "bg-amber-500 w-[2px]"
          : "bg-border-passive w-[2px]"
    : "";

  const bottomLineClass = !isLast
    ? isCompleted
      ? "bg-success w-[2px]"
      : isRetry
        ? "bg-amber-500 w-[2px]"
        : "bg-border-passive w-[2px]"
    : "";

  return (
    <li
      role="listitem"
      aria-label={`${step.label} — ${step.status}`}
      className={cn(
        "relative flex items-start gap-4 px-4 py-3.5 transition-all duration-300 rounded-xl border border-transparent",
        isActive && "bg-blueprint-light/60 border-blueprint-border/40 shadow-xs",
        isRetry && "bg-amber-500/10 border-amber-500/30 shadow-xs",
        isCompleted && "bg-charcoal-03/10",
      )}
    >
      {/* Timeline Circle and Connecting Lines */}
      <div className="relative flex flex-col items-center shrink-0 self-stretch min-h-[3.8rem]">
        {!isFirst && (
          <div className={cn("absolute top-0 bottom-1/2 left-1/2 -translate-x-1/2 z-0", topLineClass)} />
        )}

        <div className="relative z-10 my-auto flex items-center justify-center">
          {isPending && (
            <div className="w-8 h-8 rounded-full border border-border-passive bg-cream flex items-center justify-center text-charcoal-30">
              <IconComponent size={15} strokeWidth={1.5} />
            </div>
          )}

          {isActive && (
            <div className="relative w-8 h-8 rounded-full bg-blueprint-light flex items-center justify-center text-blueprint border border-blueprint/30">
              <div
                className="absolute inset-[-3px] rounded-full border border-dashed border-blueprint animate-spin"
                style={{ animationDuration: "6s" }}
              />
              <IconComponent size={15} strokeWidth={2} className="animate-pulse" />
            </div>
          )}

          {isRetry && (
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 animate-pulse">
              <RotateCcw size={15} strokeWidth={2.5} />
            </div>
          )}

          {isCompleted && (
            <div className="w-8 h-8 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success animate-fade-up">
              <Check size={16} strokeWidth={2.5} />
            </div>
          )}
        </div>

        {!isLast && (
          <div className={cn("absolute top-1/2 bottom-0 left-1/2 -translate-x-1/2 z-0", bottomLineClass)} />
        )}
      </div>

      {/* Step Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "text-[14px] font-semibold transition-colors duration-200",
                isActive && "text-charcoal",
                isRetry && "text-amber-700",
                isCompleted && "text-charcoal-40",
                isPending && "text-muted",
              )}
            >
              {step.label}
            </h3>
            <span className="text-[11px] font-medium text-muted">
              · {step.role}
            </span>
          </div>

          {/* Verdict Status Pills */}
          {step.verdict && (
            <span
              className={cn(
                "text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1",
                step.verdict.verdict === "ok"
                  ? "bg-success/10 text-success border-success/30"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/30",
              )}
            >
              {step.verdict.verdict === "ok" ? (
                <>✓ Quality: {step.verdict.score}/10</>
              ) : (
                <>⚠ Revision Loop ({step.verdict.score}/10)</>
              )}
            </span>
          )}
        </div>

        <p className="text-caption text-muted mt-0.5 text-xs">{step.subMessage}</p>

        {/* Retry Issues Details Accordion */}
        {step.verdict && step.verdict.verdict === "retry" && step.verdict.issues?.length > 0 && (
          <div className="mt-2 text-xs bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-amber-900 shadow-xs">
            <span className="font-semibold block mb-1 text-[11.5px] text-amber-950 flex items-center gap-1">
              <AlertTriangle size={12} className="text-amber-600" />
              Validator Reflection Feedback:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800">
              {step.verdict.issues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
}
