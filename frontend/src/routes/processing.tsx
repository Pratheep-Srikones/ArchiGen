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
import { NavigationBar } from "@/components/architect/NavigationBar";
import {
  type ArchitectureOutput,
} from "@/lib/mock-data";
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
  type: string;
  message: string;
}

const INITIAL_STEPS: PipelineStep[] = [
  {
    id: "macro_gen",
    agentName: "ArchitectureGenerator",
    label: "Macro Architecture Synthesis",
    role: "Lead Architect",
    subMessage: "Designing core subsystems, high-level topology, and service boundaries",
    icon: Layout,
    status: "active",
  },
  {
    id: "macro_val",
    agentName: "ArchitectureAtLargeValidator",
    label: "Macro Quality & Feasibility Gate",
    role: "Principal Reviewer",
    subMessage: "Evaluating architectural feasibility, security boundaries, and scalability",
    icon: ShieldCheck,
    status: "pending",
  },
  {
    id: "micro_gen",
    agentName: "ArchitectureAtSmallGenerator",
    label: "Micro Technical Specification",
    role: "Senior Systems Engineer",
    subMessage: "Specifying subsystem internals, API contracts, and communication protocols",
    icon: Layers,
    status: "pending",
  },
  {
    id: "micro_val",
    agentName: "ArchitectureAtSmallValidator",
    label: "Micro Soundness & Contract Review",
    role: "Technical Reviewer",
    subMessage: "Auditing internal subsystem contracts, edge conditions, and error recovery",
    icon: ShieldCheck,
    status: "pending",
  },
  {
    id: "tech_stack",
    agentName: "TechStackSelector",
    label: "Domain-Tailored Stack Selection",
    role: "Technology Specialist",
    subMessage: "Selecting optimal databases, frameworks, messaging, and cloud primitives",
    icon: Cpu,
    status: "pending",
  },
  {
    id: "diagram",
    agentName: "MermaidArchitect",
    label: "System Flowchart Synthesis",
    role: "Visual Designer",
    subMessage: "Generating verified Mermaid.js flowchart and component relationship graph",
    icon: GitBranch,
    status: "pending",
  },
  {
    id: "repo",
    agentName: "RepoBuilder",
    label: "Repository Tree Structuring",
    role: "Lead Developer",
    subMessage: "Constructing hierarchical monorepo layout and service directory structures",
    icon: FolderGit,
    status: "pending",
  },
  {
    id: "packager",
    agentName: "JSONPackager",
    label: "Final Specification Synthesis",
    role: "Packaging Engine",
    subMessage: "Validating schema compliance and compiling complete ArchitectureData package",
    icon: Terminal,
    status: "pending",
  },
];

function ProcessingPage() {
  const { prompt } = Route.useSearch();
  const navigate = useNavigate();

  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [activeAgent, setActiveAgent] = useState<string>("ArchitectureGenerator");
  const [iteration, setIteration] = useState<number>(0);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState<number>(0);
  const [toolCallsCount, setToolCallsCount] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [architecture, setArchitecture] = useState<ArchitectureOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [traceLogs, setTraceLogs] = useState<TraceLog[]>([]);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState<boolean>(true);
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

  // Auto-scroll terminal logs
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [traceLogs]);

  // Main SSE Stream Consumer
  useEffect(() => {
    if (!prompt) return;

    abortControllerRef.current = new AbortController();
    startTimeRef.current = Date.now();

    const addLog = (agent: string, type: string, message: string) => {
      const nowOffset = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
      setTraceLogs((prev) => [
        ...prev.slice(-40), // keep recent 40 logs
        {
          id: `${Date.now()}-${Math.random()}`,
          time: `+${nowOffset}s`,
          agent: agent || "Orchestrator",
          type,
          message,
        },
      ]);
    };

    addLog("Orchestrator", "init", "Connecting to ArchiGen multi-agent event stream...");

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
            addLog(agentName, "start", `Agent active: ${agentName}`);

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
                `Validation REJECTED (Score: ${score}/10) — Issues: ${issues.join("; ")}`
              );
            } else {
              addLog(
                agentName,
                "verdict_ok",
                `Validation PASSED (Score: ${score}/10) — Ready for next stage`
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
            addLog(event.agent || "", "tool_call", `Tool call: ${tool}`);
            break;
          }

          case "tool_result": {
            const tool = event.data?.tool || "tool";
            addLog(event.agent || "", "tool_result", `Tool completed: ${tool}`);
            break;
          }

          case "final": {
            setIsDone(true);
            const finalData = event.data as ArchitectureOutput;
            setArchitecture(finalData);
            addLog("JSONPackager", "final", "Full architecture payload synthesized successfully!");

            setSteps((prev) =>
              prev.map((s) => ({ ...s, status: "completed" }))
            );
            break;
          }

          case "error": {
            const errMsg = event.data?.error || "Unknown stream error";
            setError(errMsg);
            addLog(event.agent || "Error", "error", errMsg);
            break;
          }
        }
      },
      abortControllerRef.current.signal
    ).catch((err: Error) => {
      if (err.name === "AbortError") {
        addLog("Client", "cancel", "Generation aborted by user");
        return;
      }
      console.error("Stream generation failed:", err);
      setError(err.message ?? "Generation failed. Please try again.");
    });

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [prompt]);

  // Navigate to result page on completion
  useEffect(() => {
    if (architecture) {
      const timer = setTimeout(() => {
        navigate({
          to: "/result",
          state: { architecture } as Record<string, unknown>,
        });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [architecture, navigate]);

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progressPercent = isDone
    ? 100
    : Math.min(95, Math.round((completedCount / steps.length) * 100));

  // Format elapsed time MM:SS.s
  const formattedTime = useMemo(() => {
    const totalSec = elapsedMs / 1000;
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(1);
    return `${mins.toString().padStart(2, "0")}:${secs.padStart(4, "0")}s`;
  }, [elapsedMs]);

  const activeStep = steps.find((s) => s.status === "active");

  return (
    <div className="min-h-screen bg-cream bg-[radial-gradient(rgba(28,28,28,0.04)_1px,transparent_1px)] [background-size:20px_20px] flex flex-col font-sans">
      <NavigationBar showNewButton={false} />

      <main className="flex-1 pt-24 pb-20 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          {/* Header Title & Network Badge */}
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blueprint-light border border-blueprint-border/30 text-caption font-semibold text-blueprint shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blueprint opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blueprint" />
              </span>
              ArchiGen Multi-Agent Swarm · Live SSE
            </span>

            <h1 className="text-subsection font-bold text-charcoal mt-2 tracking-tight">
              Autonomous Architecture Generation
            </h1>
            <p className="text-caption text-muted max-w-md mx-auto mt-1">
              8 collaborative agents analyzing constraints, synthesizing subsystems, and enforcing architectural quality gates.
            </p>
          </div>

          {/* Real-Time Telemetry Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {/* 1. Active Agent */}
            <div className="rounded-xl border border-border-passive bg-off-white/90 p-3.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-caption font-medium text-muted">
                <Activity size={13} className="text-blueprint animate-pulse" />
                ACTIVE AGENT
              </div>
              <div className="mt-1 font-semibold text-charcoal truncate text-sm" title={activeAgent}>
                {isDone ? "Completed" : activeStep?.role || activeAgent}
              </div>
              <div className="text-[11px] text-muted truncate">
                {isDone ? "All checks passed" : activeAgent}
              </div>
            </div>

            {/* 2. Latency / Stopwatch */}
            <div className="rounded-xl border border-border-passive bg-off-white/90 p-3.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-caption font-medium text-muted">
                <Clock size={13} className="text-charcoal-40" />
                ELAPSED TIME
              </div>
              <div className="mt-1 font-mono font-bold text-charcoal text-base">
                {formattedTime}
              </div>
              <div className="text-[11px] text-muted">
                {isDone ? "Stream finalized" : "Real-time execution"}
              </div>
            </div>

            {/* 3. Reflection / Retry Loops */}
            <div className="rounded-xl border border-border-passive bg-off-white/90 p-3.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-caption font-medium text-muted">
                <RotateCcw size={13} className={iteration > 0 ? "text-amber-500 animate-spin" : "text-charcoal-40"} />
                REVISIONS (LOOPS)
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="font-semibold text-charcoal text-base">
                  {iteration} <span className="text-xs text-muted font-normal">/ 2 max</span>
                </span>
                {iteration > 0 && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">
                    Self-Correction
                  </span>
                )}
              </div>
              <div className="text-[11px] text-muted">
                {iteration > 0 ? "Feedback applied" : "Zero retries so far"}
              </div>
            </div>

            {/* 4. Quality Score / Telemetry */}
            <div className="rounded-xl border border-border-passive bg-off-white/90 p-3.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-caption font-medium text-muted">
                <ShieldCheck size={13} className="text-success" />
                QUALITY VERDICT
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                {qualityScore !== null ? (
                  <>
                    <span className="font-bold text-charcoal text-base">
                      {qualityScore}
                    </span>
                    <span className="text-xs text-muted font-normal">/ 10</span>
                    <span className="text-[10px] bg-success/10 text-success border border-success/30 px-1.5 py-0.5 rounded-full font-medium">
                      Passed
                    </span>
                  </>
                ) : (
                  <span className="text-muted text-sm font-normal">Evaluating...</span>
                )}
              </div>
              <div className="text-[11px] text-muted">
                {eventCount} stream events · {toolCallsCount} tools
              </div>
            </div>
          </div>

          {/* User Prompt Specification Box */}
          <div className="rounded-xl border border-border-passive bg-off-white/80 p-4 shadow-sm mb-6">
            <span className="text-caption text-muted font-medium flex items-center gap-2">
              <Terminal size={14} className="text-charcoal-40" />
              GIVEN USER REQUIREMENT
            </span>
            <div className="mt-2 text-[14px] italic text-charcoal line-clamp-2 pl-3 border-l-2 border-blueprint/50">
              "{prompt}"
            </div>
          </div>

          {/* Stepper Card */}
          <div className="rounded-xl border border-border-passive bg-off-white/90 backdrop-blur-sm p-6 shadow-sm mb-6">
            {/* Progress Bar & Header */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-caption mb-2">
                <span className="font-medium text-charcoal flex items-center gap-2">
                  <span>Pipeline Execution</span>
                  <span className="text-muted text-xs">
                    ({completedCount} of {steps.length} agents finished)
                  </span>
                </span>
                <span className="font-bold font-mono text-blueprint text-sm">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-border-passive rounded-full overflow-hidden">
                <div
                  className="h-full bg-blueprint transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* List of Steps */}
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

          {/* Live Agent Terminal Trace (Collapsible) */}
          <div className="rounded-xl border border-charcoal-20 bg-[#16181D] text-gray-200 shadow-md overflow-hidden mb-6">
            <div
              onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}
              className="flex items-center justify-between px-4 py-2.5 bg-[#1E2128] border-b border-charcoal-20 cursor-pointer select-none hover:bg-[#252831] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                </div>
                <span className="text-xs font-mono font-medium text-gray-400 ml-2 flex items-center gap-1.5">
                  <Terminal size={12} />
                  Live Agent Execution Trace
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                <span>{traceLogs.length} events</span>
                {isTerminalExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>

            {isTerminalExpanded && (
              <div
                ref={logsContainerRef}
                className="p-4 font-mono text-[12px] leading-relaxed max-h-52 overflow-y-auto space-y-1.5 bg-[#121418]"
              >
                {traceLogs.length === 0 ? (
                  <div className="text-gray-500 italic">Connecting to agent streaming events...</div>
                ) : (
                  traceLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-gray-500 select-none shrink-0">{log.time}</span>
                      <span className={cn(
                        "px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0",
                        log.type.includes("verdict_ok") && "bg-green-950 text-green-400 border border-green-800",
                        log.type.includes("verdict_retry") && "bg-amber-950 text-amber-400 border border-amber-800",
                        log.type.includes("tool") && "bg-purple-950 text-purple-300 border border-purple-800",
                        log.type === "final" && "bg-blue-950 text-blue-400 border border-blue-800",
                        log.type === "error" && "bg-red-950 text-red-400 border border-red-800",
                        !["verdict_ok", "verdict_retry", "tool_call", "tool_result", "final", "error"].includes(log.type) && "bg-gray-800 text-gray-300"
                      )}>
                        {log.agent}
                      </span>
                      <span className="text-gray-300 break-words">{log.message}</span>
                    </div>
                  ))
                )}
                <div className="inline-block w-2 h-3.5 bg-blueprint animate-pulse align-middle ml-1" />
              </div>
            )}
          </div>

          {/* Success Banner */}
          {isDone && (
            <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3.5 text-sm text-success font-medium flex items-center justify-between animate-fade-up mb-6">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} />
                Architecture synthesized successfully! Transitioning to preview...
              </span>
              <Sparkles size={16} className="animate-spin" />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3.5 text-sm text-error font-medium flex items-center gap-2 mb-6">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Cancel button */}
          <div className="text-center">
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
        "relative flex items-start gap-4 px-4 py-3 transition-all duration-300 rounded-xl border border-transparent",
        isActive && "bg-blueprint-light/50 border-blueprint-border/30 shadow-xs",
        isRetry && "bg-amber-500/10 border-amber-500/30 shadow-xs",
        isCompleted && "bg-charcoal-03/10",
      )}
    >
      {/* Timeline Circle and Connecting Lines */}
      <div className="relative flex flex-col items-center shrink-0 self-stretch min-h-[3.5rem]">
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
      <div className="flex-1 min-w-0 py-1">
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
                <>⚠ Revise (Score: {step.verdict.score}/10)</>
              )}
            </span>
          )}
        </div>

        <p className="text-caption text-muted mt-0.5 text-xs">{step.subMessage}</p>

        {/* Retry Issues Details Accordion */}
        {step.verdict && step.verdict.verdict === "retry" && step.verdict.issues?.length > 0 && (
          <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-800">
            <span className="font-semibold block mb-0.5">Reflection Feedback:</span>
            <ul className="list-disc list-inside space-y-0.5">
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
