/**
 * Route: "/dashboard" — authenticated workspace.
 *
 * Two responsibilities:
 *  1. Capture a free-form prompt and forward it to /processing via search params.
 *  2. Surface previously generated projects fetched from the backend, with mock
 *     data as a fallback when the API is unreachable.
 *
 * No business logic lives here — generation is simulated on /processing.
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavigationBar } from "@/components/architect/NavigationBar";
import { ArchButton } from "@/components/architect/Button";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { ArrowUpRight, AlertCircle, RefreshCw, FolderOpen } from "lucide-react";
import { CheckingAuthentication } from "@/components/auth/CheckingAuthentication";
import { Loading } from "@/components/Loading";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuth } from "@/hooks/use-auth";
import { readProjects } from "@/services/project";

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
  const { user } = useAuth();

  const {
    data: projectsData,
    isLoading: projectsLoading,
    isError: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ["projects", "dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) return { projects: [], total_count: 0 };
      return await readProjects(user.id, 0, 6, "");
    },
    enabled: !!user?.id && isAuthenticated,
  });

  const displayProjects = projectsData?.projects || [];

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
          <h1 className="text-4xl md:text-display text-charcoal">What are you building?</h1>
          <p className="mt-5 text-base md:text-body-lg text-muted max-w-140 mx-auto">
            Describe your system and get a complete architecture — macro design, tech stack,
            diagrams, and repository structure.
          </p>

          <div className="mt-10 text-left rounded-xl border border-charcoal-40 bg-cream focus-within:shadow-focus focus-within:border-charcoal focus-within:ring-2 focus-within:ring-charcoal/20 transition-all">
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
                className="rounded-full border border-border-passive bg-cream px-3.5 py-1.5 text-[14px] text-charcoal hover:border-charcoal-40 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <section className="max-w-300 mx-auto mt-32">
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-card-title text-charcoal">Your Projects</h2>
            {projectsData && projectsData.total_count > 6 && (
              <Link
                to="/projects"
                className="text-caption text-muted underline underline-offset-2 hover:text-charcoal"
              >
                View all
              </Link>
            )}
          </div>

          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-cream border border-border-passive rounded-xl p-5 min-h-45 animate-pulse"
                >
                  <div className="h-4 bg-charcoal-04 rounded w-1/4" />
                  <div className="mt-3 h-5 bg-charcoal-04 rounded w-3/4" />
                  <div className="mt-2 h-3 bg-charcoal-04 rounded w-1/3" />
                  <div className="mt-5 pt-3 border-t border-border-passive flex gap-3">
                    <div className="h-3 bg-charcoal-04 rounded w-10" />
                    <div className="h-3 bg-charcoal-04 rounded w-10" />
                    <div className="h-3 bg-charcoal-04 rounded w-10" />
                  </div>
                </div>
              ))}
            </div>
          ) : projectsError ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-error/30 rounded-xl p-8 bg-error/5 text-center min-h-45 animate-fade-up">
              <AlertCircle className="w-10 h-10 text-error mb-3" strokeWidth={1.5} />
              <h3 className="text-[16px] font-semibold text-charcoal">Failed to load projects</h3>
              <p className="text-caption text-muted mt-1 max-w-md">
                There was a problem reaching the server. Please check your connection or try again.
              </p>
              <ArchButton
                variant="ghost"
                size="sm"
                className="mt-4 border border-border-passive hover:border-charcoal-40 bg-cream"
                onClick={() => refetchProjects()}
              >
                <RefreshCw size={14} className="mr-1.5" />
                Retry
              </ArchButton>
            </div>
          ) : displayProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-border-passive rounded-xl p-10 bg-cream text-center min-h-64 animate-fade-up">
              <FolderOpen size={48} strokeWidth={1} className="mx-auto text-charcoal-20 mb-4" />
              <h3 className="text-card-title text-charcoal">No projects yet</h3>
              <p className="text-caption text-muted mt-1 max-w-sm">
                Describe your system in the prompt box above to generate your first software
                architecture document.
              </p>
              <div className="mt-6">
                <ArchButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const ta = document.querySelector("textarea");
                    ta?.focus();
                  }}
                >
                  Generate a Project
                </ArchButton>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up">
              {displayProjects.map((p) => {
                const projectDate = p.createdAt || p.created_at;
                const formattedDate = projectDate
                  ? projectDate.includes("ago") || projectDate.includes("week")
                    ? projectDate
                    : new Date(projectDate).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                  : "";
                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      navigate({ to: "/architecture/$projectId", params: { projectId: p.id } })
                    }
                    className="text-left bg-cream border border-border-passive hover:border-charcoal-40 hover:shadow-md rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div className="flex items-start justify-between">
                      <ArrowUpRight
                        size={16}
                        strokeWidth={1.5}
                        className="text-charcoal-40 group-hover:text-charcoal group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
                      />
                    </div>
                    <h3 className="text-card-title text-charcoal mt-3 line-clamp-2">{p.title}</h3>
                    <p className="text-caption text-muted mt-2">{formattedDate}</p>
                    <div className="mt-5 pt-3 border-t border-border-passive flex items-center gap-3 text-[12px] text-charcoal-30">
                      <span>Macro</span>
                      <span>·</span>
                      <span>Stack</span>
                      <span>·</span>
                      <span>Diagram</span>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  const ta = document.querySelector("textarea");
                  ta?.focus();
                }}
                className="rounded-xl border-2 border-dashed border-border-interactive hover:border-charcoal-60 hover:bg-charcoal-03 transition-all duration-300 hover:-translate-y-1 hover:shadow-md p-5 flex items-center justify-center min-h-45 text-caption text-charcoal-60 hover:text-charcoal"
              >
                Start a new architecture →
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
