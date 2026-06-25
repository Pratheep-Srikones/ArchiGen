/**
 * NavigationBar — fixed top chrome shared by every page.
 *
 * The `showNewButton` flag is hidden on routes where it would be redundant
 * (e.g. the homepage prompt input is itself the "new architecture" entry).
 * `rightSlot` lets specific pages inject contextual actions without forking
 * this component.
 */
import { Link } from "@tanstack/react-router";
import { ArchButton } from "./Button";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
interface NavigationBarProps {
  /** Hide the "New Architecture" CTA on screens where it isn't useful. */
  showNewButton?: boolean;
  /** Optional contextual actions injected to the left of the account button. */
  rightSlot?: React.ReactNode;
}

export function NavigationBar({ showNewButton = true, rightSlot }: NavigationBarProps) {
  const { logout, isAuthenticated, user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-cream border-b border-border-passive h-14">
      <div className="h-full max-w-300 mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="text-[18px] font-semibold tracking-tight text-charcoal">
          ArchitectAI
        </Link>
        <div className="flex items-center gap-3">
          {rightSlot}
          {showNewButton && (
            <Link to="/">
              <ArchButton variant="primary" size="sm">
                New Architecture
              </ArchButton>
            </Link>
          )}
          {isAuthenticated && (
            <>
              <Link
                to="/profile"
                aria-label="Account"
                className="w-8 h-8 rounded-full bg-cream border border-border-passive flex items-center justify-center text-charcoal-60 hover:border-charcoal-40 transition-colors overflow-hidden"
              >
                {user?.picture ? (
                  <img src={user.picture} alt="Account" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} strokeWidth={1.5} />
                )}
              </Link>
              <button
                aria-label="Logout"
                className="w-8 h-8 rounded-full bg-cream border border-border-passive flex items-center justify-center text-charcoal-60 hover:border-charcoal-40 transition-colors"
                onClick={() => logout()}
              >
                <LogOut size={14} strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
