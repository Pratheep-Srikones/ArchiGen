/**
 * Loading — generic skeleton screen used while data is in flight.
 *
 * Follows the ArchitectAI design system: cream surface, charcoal chrome,
 * and a polite step-pulse so the user knows the app is alive.
 */
import { Loader2 } from "lucide-react";

interface LoadingProps {
  /** Short line of context, e.g. "Generating architecture…" */
  label?: string;
  /** Constrain height to fill a parent or the whole viewport. */
  fullScreen?: boolean;
}

export function Loading({ label = "Loading…", fullScreen = false }: LoadingProps) {
  return (
    <div
      className={
        fullScreen
          ? "min-h-screen bg-cream flex flex-col items-center justify-center px-6"
          : "flex flex-col items-center justify-center py-16 px-6"
      }
    >
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={24} strokeWidth={1.5} className="text-charcoal-40 animate-spin" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-charcoal animate-step-pulse" />
        </div>
      </div>
      <p className="mt-4 text-caption text-muted">{label}</p>
    </div>
  );
}
