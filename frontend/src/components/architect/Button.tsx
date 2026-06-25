/**
 * ArchButton — themed button used across the ArchitectAI surface.
 *
 * Variants map to design-system tokens defined in `src/styles.css`:
 *   - primary: filled charcoal CTA (default action on every screen)
 *   - ghost:   outlined neutral, used for secondary actions
 *   - cream:   subtle inline action used inside cards / toolbars
 *
 * Keep this presentation-only — it must not own any business state.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "cream";
type Size = "default" | "sm";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const ArchButton = React.forwardRef<HTMLButtonElement, ButtonProps>(function ArchButton(
  { variant = "primary", size = "default", className, ...props },
  ref,
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-sans transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
  const sizes: Record<Size, string> = {
    default: "px-5 py-2 text-[15px]",
    sm: "px-3 py-1.5 text-caption",
  };
  const variants: Record<Variant, string> = {
    primary: "bg-charcoal text-off-white shadow-button-inset hover:bg-charcoal-82 hover:shadow-md",
    ghost:
      "bg-transparent text-charcoal border border-border-interactive hover:border-charcoal hover:bg-charcoal-04 hover:shadow-sm",
    cream:
      "bg-cream text-charcoal border border-border-passive hover:border-border-interactive hover:bg-charcoal-04 hover:shadow-sm",
  };
  return (
    <button ref={ref} className={cn(base, sizes[size], variants[variant], className)} {...props} />
  );
});
