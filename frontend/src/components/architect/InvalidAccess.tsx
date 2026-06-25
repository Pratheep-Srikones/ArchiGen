import React from "react";
import { NavigationBar } from "./NavigationBar";
import { ArchButton } from "./Button";
import { AlertCircle, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function InvalidAccess() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <NavigationBar showNewButton={false} />

      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-md w-full text-center">
          {/* Visual Alert Badge */}
          <div className="relative w-20 h-20 mx-auto mb-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-charcoal-04 border border-border-passive" />
            <AlertCircle size={36} strokeWidth={1.5} className="text-charcoal-40 animate-pulse" />
          </div>

          {/* Heading */}
          <h1 className="text-subsection text-charcoal font-semibold tracking-tight">
            No Architecture Found
          </h1>

          {/* Explanation */}
          <p className="mt-4 text-body-lg text-muted">
            You've reached the result page, but there's no active generation session in progress or
            architecture data loaded.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" className="w-full sm:w-auto">
              <ArchButton variant="primary" className="w-full">
                <LayoutDashboard size={16} strokeWidth={1.5} />
                Go to Dashboard
              </ArchButton>
            </Link>

            <Link to="/" className="w-full sm:w-auto">
              <ArchButton variant="ghost" className="w-full">
                <ArrowLeft size={16} strokeWidth={1.5} />
                Back to Home
              </ArchButton>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default InvalidAccess;
