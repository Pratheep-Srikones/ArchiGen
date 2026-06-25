import React from "react";
import { NavigationBar } from "../architect/NavigationBar";
import { ArchButton } from "../architect/Button";
import { LogIn, Lock, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

function NotAuthenticated() {
  const { login } = useAuth();
  return (
    <div className="min-h-screen bg-cream">
      <NavigationBar showNewButton={false} />

      <main className="pt-14">
        <section className="max-w-140 mx-auto px-6 pt-32 pb-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-charcoal-04 flex items-center justify-center text-charcoal mx-auto">
            <Lock size={28} strokeWidth={1.5} />
          </div>

          <h1 className="text-subsection text-charcoal mt-8">Authentication required</h1>

          <p className="mt-4 text-body-lg text-muted max-w-100 mx-auto">
            Sign in to build architectures, save projects, and access your workspace.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <ArchButton variant="primary" size="default" onClick={() => login()}>
              <LogIn size={16} strokeWidth={1.5} />
              Sign In
            </ArchButton>

            <Link to="/">
              <ArchButton variant="ghost" size="default">
                <ArrowLeft size={16} strokeWidth={1.5} />
                Back to Home
              </ArchButton>
            </Link>
          </div>
        </section>

        <section className="max-w-180 mx-auto px-6 pb-24">
          <div className="rounded-xl border border-border-passive bg-cream p-8">
            <h2 className="text-card-title text-charcoal text-center">
              What you get when you sign in
            </h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <span className="text-caption text-charcoal font-medium">
                  Unlimited generations
                </span>
                <p className="text-caption text-muted mt-1">
                  Create as many architecture documents as you need.
                </p>
              </div>
              <div>
                <span className="text-caption text-charcoal font-medium">Saved projects</span>
                <p className="text-caption text-muted mt-1">
                  Revisit and iterate on past architectures anytime.
                </p>
              </div>
              <div>
                <span className="text-caption text-charcoal font-medium">Export & share</span>
                <p className="text-caption text-muted mt-1">
                  Download diagrams and share plans with your team.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default NotAuthenticated;
