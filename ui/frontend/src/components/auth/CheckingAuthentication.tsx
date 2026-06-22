/**
 * CheckingAuthentication — polished gate screen shown while the auth
 * provider is resolving the session.
 *
 * Unlike the generic Loading spinner, this component tells a short story:
 * a three-step timeline (contacting identity provider → verifying session
 * → confirming access) so the user understands *why* we’re waiting.
 */
import { useEffect, useState } from "react";
import { ShieldCheck, Shield, Loader2 } from "lucide-react";

const STEPS = [
  { label: "Contacting identity provider", delay: 0 },
  { label: "Verifying session", delay: 350 },
  { label: "Confirming access", delay: 700 },
];

export function CheckingAuthentication() {
  const [visibleSteps, setVisibleSteps] = useState<number>(0);

  useEffect(() => {
    STEPS.forEach((step, i) => {
      const timer = setTimeout(() => {
        setVisibleSteps((prev) => Math.max(prev, i + 1));
      }, step.delay);
      return () => clearTimeout(timer);
    });
  }, []);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        {/* Animated lock badge */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-2xl bg-charcoal-04" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield
              size={28}
              strokeWidth={1.5}
              className="text-charcoal-30 transition-colors duration-500"
              style={{
                color: visibleSteps >= 3 ? "rgba(28,28,28,0.83)" : undefined,
              }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            {visibleSteps >= 3 && (
              <ShieldCheck
                size={28}
                strokeWidth={1.5}
                className="text-charcoal opacity-0 animate-fade-up"
              />
            )}
          </div>
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 rounded-full bg-blueprint animate-step-pulse" />
          </div>
        </div>

        <h1 className="mt-6 text-card-title text-charcoal">Checking authentication</h1>
        <p className="mt-1 text-caption text-muted">Hold on — we’re making sure it’s really you.</p>

        {/* Timeline */}
        <div className="mt-8 text-left space-y-4">
          {STEPS.map((step, i) => {
            const isVisible = i < visibleSteps;
            const isCurrent = i === visibleSteps - 1;
            const isDone = i < visibleSteps - 1 || visibleSteps >= 3;

            return (
              <div
                key={step.label}
                className={
                  "flex items-center gap-3 transition-all duration-500 " +
                  (isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2")
                }
              >
                {/* Dot */}
                <div className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {isDone ? (
                    <div className="w-2 h-2 rounded-full bg-charcoal" />
                  ) : isCurrent ? (
                    <Loader2 size={14} strokeWidth={2} className="text-charcoal animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-border-passive" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={
                    "text-caption transition-colors duration-300 " +
                    (isDone
                      ? "text-charcoal-60 line-through"
                      : isCurrent
                        ? "text-charcoal"
                        : "text-muted")
                  }
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-8 h-0.5 bg-border-passive rounded-full overflow-hidden">
          <div
            className="h-full bg-charcoal rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(visibleSteps / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
