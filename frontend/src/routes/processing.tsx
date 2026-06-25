/**
 * Route: "/processing" — simulated agent timeline.
 *
 * Reads the user prompt from search params, walks through AGENT_STEPS one at
 * a time with a randomized delay per step, and finally redirects to the
 * architecture detail page. If the prompt is missing we bounce back home.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useReducer, useRef, useState } from "react";
import { z } from "zod";
import { NavigationBar } from "@/components/architect/NavigationBar";
import {
  AGENT_STEPS,
  type AgentStep,
  type StepStatus,
  type ArchitectureOutput,
} from "@/lib/mock-data";
import { getArchitectureResponse } from "@/services/ai";
import { Check, Terminal, Layout, Layers, Cpu, GitBranch, FolderGit } from "lucide-react";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ prompt: z.string().optional() });

export const Route = createFileRoute("/processing")({
  validateSearch: searchSchema,
  component: ProcessingPage,
  head: () => ({
    meta: [{ title: "Generating architecture — ArchitectAI" }],
  }),
});

type State = AgentStep[];
type Action = { type: "advance" } | { type: "activate_last" };

const initialState: State = AGENT_STEPS.map((s, i) => ({
  ...s,
  status: (i === 0 ? "active" : "pending") as StepStatus,
}));

function reducer(state: State, action: Action): State {
  if (action.type === "advance") {
    const activeIdx = state.findIndex((s) => s.status === "active");
    if (activeIdx === -1) return state;
    const next = [...state];
    next[activeIdx] = { ...next[activeIdx], status: "completed" };
    if (activeIdx + 1 < next.length) {
      next[activeIdx + 1] = { ...next[activeIdx + 1], status: "active" };
    }
    return next;
  }
  if (action.type === "activate_last") {
    const lastIdx = state.length - 1;
    if (lastIdx < 0) return state;
    const next = state.map((s, i) => ({
      ...s,
      status: (i === lastIdx ? "active" : "completed") as StepStatus,
    }));
    return next;
  }
  return state;
}

const STEP_ICONS: Record<string, React.ComponentType<any>> = {
  analyze: Terminal,
  macro: Layout,
  micro: Layers,
  stack: Cpu,
  diagram: GitBranch,
  repo: FolderGit,
};

function ProcessingPage() {
  const { prompt } = Route.useSearch();
  const navigate = useNavigate();
  const [steps, dispatch] = useReducer(reducer, initialState);
  const [architecture, setArchitecture] = useState<ArchitectureOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!prompt) {
      navigate({ to: "/" });
    }
  }, [prompt, navigate]);

  // Kick off the backend call as soon as we have a prompt.
  useEffect(() => {
    if (!prompt || hasFetched.current) return;
    hasFetched.current = true;

    getArchitectureResponse(prompt)
      .then((data) => setArchitecture(data as ArchitectureOutput))
      .catch((err: Error) => {
        console.error("Generation failed:", err);
        setError(err.message ?? "Something went wrong. Please try again.");
      });
  }, [prompt]);

  // Redirect immediately once the backend response is fetched
  useEffect(() => {
    if (architecture) {
      navigate({
        to: "/result",
        state: { architecture } as Record<string, unknown>,
      });
    }
  }, [architecture, navigate]);

  // Advance the UI timeline on a timer
  useEffect(() => {
    if (architecture) return;

    const allDone = steps.every((s) => s.status === "completed");
    if (allDone) {
      // Animation finished first — keep the last step pulsing.
      const t = setTimeout(() => dispatch({ type: "activate_last" }), 1000);
      return () => clearTimeout(t);
    }
    
    // Total of 6 steps. 60 seconds / 6 steps = ~10 seconds per step.
    const dur = 9000 + Math.random() * 2000;
    const t = setTimeout(() => dispatch({ type: "advance" }), dur);
    return () => clearTimeout(t);
  }, [steps, architecture]);

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="min-h-screen bg-cream bg-[radial-gradient(rgba(28,28,28,0.04)_1px,transparent_1px)] [background-size:20px_20px] flex flex-col">
      <NavigationBar showNewButton={false} />
      <main className="flex-1 pt-28 pb-24 px-6 flex items-center justify-center">
        <div className="max-w-xl w-full">
          {/* Headline section */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blueprint-light border border-blueprint-border/30 text-caption font-medium text-blueprint animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blueprint" />
              Agent Network Active
            </span>
            <h1 className="text-subsection font-bold text-charcoal mt-3">
              Structuring Architecture
            </h1>
            <p className="text-caption text-muted mt-1 max-w-sm mx-auto">
              Our multi-agent pipeline is analyzing requirements, selecting technologies, and drafting diagram layouts.
            </p>
          </div>

          {/* User Prompt specification card */}
          <div className="rounded-xl border border-border-passive bg-off-white/80 backdrop-blur-sm p-5 shadow-sm mb-6">
            <span className="text-caption text-muted font-medium flex items-center gap-2">
              <Terminal size={14} className="text-charcoal-40" />
              SYSTEM INPUT PROMPT
            </span>
            <div className="mt-3 text-[15px] italic text-charcoal line-clamp-3 pl-3 border-l border-charcoal-20">
              "{prompt}"
            </div>
          </div>

          {/* Pipeline Progress and Steps card */}
          <div className="rounded-xl border border-border-passive bg-off-white/80 backdrop-blur-sm p-6 shadow-sm">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-caption mb-2">
                <span className="text-muted font-medium">Pipeline Progress</span>
                <span className="font-semibold text-blueprint">{progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-border-passive rounded-full overflow-hidden">
                <div
                  className="h-full bg-blueprint transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* List of Steps */}
            <ol role="list" className="space-y-2">
              {steps.map((step, idx) => (
                <StepRow
                  key={step.id}
                  step={step}
                  isFirst={idx === 0}
                  isLast={idx === steps.length - 1}
                  prevStatus={idx > 0 ? steps[idx - 1].status : undefined}
                />
              ))}
            </ol>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-[14px] text-error font-medium">
              {error}
            </div>
          )}

          {/* Cancel button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate({ to: "/" })}
              className="text-caption text-muted hover:text-charcoal underline underline-offset-4 decoration-border-passive transition-colors"
            >
              Cancel generation and return
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

interface StepRowProps {
  step: AgentStep;
  isFirst: boolean;
  isLast: boolean;
  prevStatus?: StepStatus;
}

function StepRow({ step, isFirst, isLast, prevStatus }: StepRowProps) {
  const isActive = step.status === "active";
  const isCompleted = step.status === "completed";
  const isPending = step.status === "pending";

  const IconComponent = STEP_ICONS[step.id] || Terminal;

  // Timeline line styles
  const topLineClass = !isFirst
    ? prevStatus === "completed"
      ? "bg-success w-[2px]"
      : isActive
      ? "bg-blueprint w-[2px] animate-pulse"
      : "bg-border-passive w-[2px]"
    : "";

  const bottomLineClass = !isLast
    ? isCompleted
      ? "bg-success w-[2px]"
      : "bg-border-passive w-[2px]"
    : "";

  return (
    <li
      role="listitem"
      aria-label={`${step.label} — ${step.status}`}
      className={cn(
        "relative flex items-start gap-6 px-6 py-4 transition-all duration-500 rounded-xl border border-transparent",
        isActive && "bg-blueprint-light/40 border-blueprint-border/30 shadow-sm",
        isCompleted && "bg-charcoal-03/20",
      )}
    >
      {/* Timeline Circle and Lines */}
      <div className="relative flex flex-col items-center shrink-0 self-stretch min-h-[4.5rem]">
        {/* Top Connecting Line */}
        {!isFirst && (
          <div className={cn("absolute top-0 bottom-1/2 left-1/2 -translate-x-1/2 z-0", topLineClass)} />
        )}

        {/* The Icon Container */}
        <div className="relative z-10 my-auto flex items-center justify-center">
          {isPending && (
            <div className="w-10 h-10 rounded-full border border-border-passive bg-cream flex items-center justify-center text-charcoal-30">
              <IconComponent size={18} strokeWidth={1.5} />
            </div>
          )}
          {isActive && (
            <div className="relative w-10 h-10 rounded-full bg-blueprint-light flex items-center justify-center text-blueprint border border-blueprint/30">
              {/* Spinning outer dotted ring */}
              <div className="absolute inset-[-4px] rounded-full border border-dashed border-blueprint animate-spin" style={{ animationDuration: '8s' }} />
              <IconComponent size={18} strokeWidth={2} className="animate-pulse" />
            </div>
          )}
          {isCompleted && (
            <div className="w-10 h-10 rounded-full bg-success/10 border border-success/30 flex items-center justify-center text-success animate-fade-up">
              <Check size={18} strokeWidth={2.5} />
            </div>
          )}
        </div>

        {/* Bottom Connecting Line */}
        {!isLast && (
          <div className={cn("absolute top-1/2 bottom-0 left-1/2 -translate-x-1/2 z-0", bottomLineClass)} />
        )}
      </div>

      {/* Step Description */}
      <div className="flex-1 min-w-0 py-2">
        <h3
          className={cn(
            "text-[16px] font-medium transition-colors duration-300",
            isActive && "text-charcoal",
            isCompleted && "text-charcoal-40",
            isPending && "text-muted",
          )}
        >
          {step.label}
        </h3>
        {/* Expand explanation when active */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-500 ease-in-out",
            isActive ? "max-h-20 mt-1 opacity-100 animate-fade-up" : "max-h-0 opacity-0",
          )}
        >
          <p className="text-caption text-muted">{step.subMessage}</p>
        </div>
      </div>
    </li>
  );
}
