/**
 * Route: "/processing" — simulated agent timeline.
 *
 * Reads the user prompt from search params, walks through AGENT_STEPS one at
 * a time with a randomized delay per step, and finally redirects to the
 * architecture detail page. If the prompt is missing we bounce back home.
 *
 * Replace the timed reducer with real progress events once the backend is in
 * place — the StepRow visuals are driven entirely by step.status, so swapping
 * the source of truth requires no UI changes.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useReducer, useRef, useState } from "react";
import { z } from "zod";
import { NavigationBar } from "@/components/architect/NavigationBar";
import { AGENT_STEPS, type AgentStep, type StepStatus, type ArchitectureOutput } from "@/lib/mock-data";
import { getArchitectureResponse } from "@/services/ai";
import { Check } from "lucide-react";
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

/**
 * Marks the currently-active step as completed and promotes the next one.
 * If all steps are completed, keeps the last one active so the UI shows
 * a pulsing "still working" state while the backend finishes.
 */
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

  // Advance the UI timeline on a timer. If every step has cycled through,
  // reset the last step to "active" so the spinner keeps going until the
  // backend response arrives (which can take up to a minute).
  useEffect(() => {
    const allDone = steps.every((s) => s.status === "completed");
    if (allDone) {
      if (architecture) {
        // Backend finished before the animation cycled; show a brief pause
        // then navigate.
        const t = setTimeout(() => {
          const projectId = architecture.projectId ?? crypto.randomUUID();
          const navState = { architecture: { ...architecture, projectId } };
          navigate({
            to: "/architecture/$projectId",
            params: { projectId },
            state: navState as Record<string, unknown>,
          });
        }, 600);
        return () => clearTimeout(t);
      }
      // Animation finished first — keep the last step pulsing.
      const t = setTimeout(() => dispatch({ type: "activate_last" }), 800);
      return () => clearTimeout(t);
    }
    const dur = 1200 + Math.random() * 1600;
    const t = setTimeout(() => dispatch({ type: "advance" }), dur);
    return () => clearTimeout(t);
  }, [steps, architecture, navigate]);

  return (
    <div className="min-h-screen bg-cream">
      <NavigationBar showNewButton={false} />
      <main className="pt-28 pb-24 px-6">
        <div className="max-w-160 mx-auto">
          <p className="text-caption text-muted">Generating architecture for</p>
          <div className="mt-2 rounded-xl border border-border-passive bg-cream px-4 py-3 italic text-charcoal text-[16px] line-clamp-3">
            {prompt}
          </div>

          <ol role="list" className="mt-10 rounded-xl overflow-hidden">
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

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate({ to: "/" })}
              className="text-caption text-muted hover:text-charcoal"
            >
              Cancel generation
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

  const topLineClass = !isFirst
    ? prevStatus === "completed"
      ? isActive
        ? "bg-blueprint w-[2px]"
        : "bg-success w-[1px]"
      : "bg-border-passive w-[1px]"
    : "";
  const bottomLineClass = !isLast
    ? isCompleted
      ? "bg-success w-[1px]"
      : "bg-border-passive w-[1px]"
    : "";

  return (
    <li
      role="listitem"
      aria-label={`${step.label} — ${step.status}`}
      className={cn(
        "relative flex items-stretch px-4",
        isActive && "bg-blueprint-light border-l-[3px] border-blueprint pl-3.25",
      )}
    >
      <div className="w-6 flex flex-col items-center shrink-0">
        <div className={cn("flex-1", topLineClass)} />
        <div className="my-1 flex items-center justify-center">
          {step.status === "pending" && (
            <div className="w-2.5 h-2.5 rounded-full border border-charcoal-20" />
          )}
          {isActive && <div className="w-2.5 h-2.5 rounded-full bg-blueprint animate-step-pulse" />}
          {isCompleted && (
            <div className="w-3.5 h-3.5 rounded-full bg-success flex items-center justify-center">
              <Check size={9} strokeWidth={3} className="text-white" />
            </div>
          )}
        </div>
        <div className={cn("flex-1", bottomLineClass)} />
      </div>
      <div className="flex-1 ml-4 py-3.5">
        <p
          className={cn(
            "text-[16px]",
            isActive && "text-charcoal",
            isCompleted && "text-charcoal-60",
            step.status === "pending" && "text-muted",
          )}
        >
          {step.label}
        </p>
        {isActive && <p className="text-caption text-muted mt-1">{step.subMessage}</p>}
      </div>
    </li>
  );
}
