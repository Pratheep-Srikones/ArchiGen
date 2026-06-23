/**
 * Route: "/dashboard" — authenticated workspace.
 *
 * Two responsibilities:
 *  1. Capture a free-form prompt and forward it to /processing via search params.
 *  2. Surface previously generated projects (mock data) for quick re-entry.
 *
 * No business logic lives here — generation is simulated on /processing.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { NavigationBar } from "@/components/architect/NavigationBar";
import { ArchButton } from "@/components/architect/Button";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { ArrowUpRight } from "lucide-react";
import { CheckingAuthentication } from "@/components/auth/CheckingAuthentication";
import { Loading } from "@/components/Loading";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "ArchitectAI — Dashboard" },
      {
        name: "description",
        content: "Your ArchitectAI workspace — create and manage software architecture documents.",
      },
    ],
  }),
});

const SUGGESTIONS = [
  "Live streaming service",
  "Microservices e-commerce",
  "Real-time collaborative editor",
  "ML model serving platform",
  "Multi-tenant SaaS CRM",
];

function DashboardPage() {
  const { isAuthenticated, loading } = useAuthStore();

  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const submit = () => {
    if (!prompt.trim()) return;
    navigate({ to: "/processing", search: { prompt } });
  };

  if (loading) {
    return <CheckingAuthentication />;
  }

  if (!isAuthenticated) {
    return <Loading fullScreen label="Redirecting to sign in…" />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <NavigationBar showNewButton={false} />
      <main className="pt-24 pb-24 px-6">
        <section className="max-w-180 mx-auto text-center pt-16">
          <h1 className="text-display text-charcoal">What are you building?</h1>
          <p className="mt-5 text-body-lg text-muted max-w-140 mx-auto">
            Describe your system and get a complete architecture — macro design, tech stack,
            diagrams, and repository structure.
          </p>

          <div className="mt-10 text-left rounded-xl border border-charcoal-40 bg-cream focus-within:shadow-focus transition-shadow">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
              }}
              placeholder="e.g. Architecture for a real-time live streaming service with 100k concurrent viewers…"
              className="w-full bg-transparent resize-none outline-none px-6 pt-5 pb-3 text-[18px] placeholder:text-muted text-charcoal min-h-24 font-sans"
              rows={3}
            />
            <div className="flex items-center justify-between border-t border-border-passive px-4 py-2.5">
              <span className="text-caption text-muted">{prompt.length} / 500</span>
              <ArchButton variant="primary" size="sm" onClick={submit} disabled={!prompt.trim()}>
                Generate Architecture
              </ArchButton>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-caption text-muted mr-1">Try:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="rounded-full border border-border-passive bg-cream px-3.5 py-1.5 text-[14px] text-charcoal hover:border-charcoal-40 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <section className="max-w-300 mx-auto mt-32">
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-card-title text-charcoal">Your Projects</h2>
            <a
              href="#"
              className="text-caption text-muted underline underline-offset-2 hover:text-charcoal"
            >
              View all
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_PROJECTS.map((p) => (
              <button
                key={p.id}
                onClick={() =>
                  navigate({ to: "/architecture/$projectId", params: { projectId: p.id } })
                }
                className="text-left bg-cream border border-border-passive hover:border-charcoal-30 rounded-xl p-5 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <span className="inline-block rounded-full bg-charcoal-04 px-2.5 py-0.5 text-[12px] text-charcoal">
                    {p.architectureType}
                  </span>
                  <ArrowUpRight
                    size={16}
                    strokeWidth={1.5}
                    className="text-charcoal-40 group-hover:text-charcoal transition-colors"
                  />
                </div>
                <h3 className="text-card-title text-charcoal mt-3 line-clamp-2">{p.title}</h3>
                <p className="text-caption text-muted mt-2">{p.createdAt}</p>
                <div className="mt-5 pt-3 border-t border-border-passive flex items-center gap-3 text-[12px] text-charcoal-30">
                  <span>Macro</span>
                  <span>·</span>
                  <span>Stack</span>
                  <span>·</span>
                  <span>Diagram</span>
                </div>
              </button>
            ))}
            <button
              onClick={() => {
                const ta = document.querySelector("textarea");
                ta?.focus();
              }}
              className="rounded-xl border border-dashed border-border-passive hover:border-charcoal-40 hover:bg-charcoal-03 transition-colors p-5 flex items-center justify-center min-h-45 text-caption text-muted"
            >
              Start a new architecture →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
