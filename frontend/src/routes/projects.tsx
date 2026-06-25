/**
 * Route: "/projects" — full project list with search and pagination.
 *
 * Fetches paginated projects from the backend and supports keyword search.
 * Falls back to mock data when the API is unreachable so the UI stays usable.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { NavigationBar } from "@/components/architect/NavigationBar";
import { ArchButton } from "@/components/architect/Button";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import {
  ArrowUpRight,
  Search,  FolderOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CheckingAuthentication } from "@/components/auth/CheckingAuthentication";
import { Loading } from "@/components/Loading";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuth } from "@/hooks/use-auth";
import { readProjects } from "@/services/project";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
  head: () => ({
    meta: [
      { title: "Your Projects — ArchitectAI" },
      {
        name: "description",
        content: "Browse, search, and manage all your generated architecture projects.",
      },
    ],
  }),
});

const DEFAULT_PAGE_SIZE = 10;

function ProjectsPage() {
  const { isAuthenticated, loading } = useAuthStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const start = (page - 1) * pageSize;

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["projects", "list", user?.id, submittedSearch, start, pageSize],
    queryFn: async () => {
      if (!user?.id) return { projects: [], total_count: 0 };
      const result = await readProjects(start, pageSize, submittedSearch);
      return result;
    },
    enabled: !!user?.id && isAuthenticated,
    placeholderData: keepPreviousData,
  });

  const totalCount = isError || !data ? MOCK_PROJECTS.length : data.total_count;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const displayProjects =
    isError || !data ? MOCK_PROJECTS.slice(start, start + pageSize) : data.projects;
  const showSkeleton = isLoading;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSubmittedSearch(searchTerm.trim());
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  if (loading) return <CheckingAuthentication />;
  if (!isAuthenticated) return <Loading fullScreen label="Redirecting to sign in…" />;

  return (
    <div className="min-h-screen bg-cream">
      <NavigationBar showNewButton />
      <main className="pt-28 pb-24 px-6 max-w-300 mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-section text-charcoal">Your Projects</h1>
            <p className="text-caption text-muted mt-1">
              {isError
                ? "Showing sample projects (backend unavailable)"
                : totalCount + " project" + (totalCount !== 1 ? "s" : "") + " in your workspace"}
            </p>
          </div>
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto mt-4 md:mt-0"
          >
            <div className="relative flex-1 md:w-64">
              <Search
                size={16}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects…"
                className="w-full rounded-lg border border-border-passive bg-cream pl-9 pr-3 py-2 text-[14px] text-charcoal placeholder:text-muted outline-none focus:border-charcoal focus:ring-2 focus:ring-charcoal/20 focus:shadow-focus transition-all"
              />
            </div>
            <ArchButton
              variant="primary"
              size="sm"
              type="submit"
              disabled={isFetching}
              className="w-full sm:w-auto h-full"
            >
              Search
            </ArchButton>
          </form>
        </div>

        {showSkeleton ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
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
        ) : displayProjects.length === 0 ? (
          <div className="text-center py-24">
            <FolderOpen size={48} strokeWidth={1} className="mx-auto text-charcoal-20" />
            <h2 className="text-card-title text-charcoal mt-4">No projects yet</h2>
            <p className="text-caption text-muted mt-1 max-w-md mx-auto">
              {submittedSearch
                ? `No projects matched your search for "${submittedSearch}". Try a different search term.`
                : "Start by generating an architecture from your dashboard. Your projects will appear here automatically."}
            </p>
            <div className="mt-6">
              <ArchButton
                variant="primary"
                size="sm"
                onClick={() => {
                  if (submittedSearch) {
                    setSearchTerm("");
                    setSubmittedSearch("");
                    setPage(1);
                  } else {
                    navigate({ to: "/dashboard" });
                  }
                }}
              >
                {submittedSearch ? "Clear Search" : "Go to Dashboard"}
              </ArchButton>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className="text-left bg-cream border border-border-passive hover:border-charcoal-40 hover:shadow-md rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 group animate-fade-up"
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
            </div>

            {/* Pagination Controls */}
            <div className="mt-12 pt-6 border-t border-border-passive flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-up">
              {/* Items per page dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-caption text-muted">Items per page:</span>
                <div className="relative flex items-center">
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="appearance-none rounded-lg border border-border-passive bg-cream pl-3 pr-8 py-1.5 text-caption text-charcoal outline-none focus:border-charcoal-40 focus:shadow-focus transition-all cursor-pointer"
                  >
                    {[5, 10, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    strokeWidth={1.5}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-40 pointer-events-none"
                  />
                </div>
              </div>

              {/* Page Indicator */}
              <div className="text-caption text-muted">
                Showing <span className="font-semibold text-charcoal">{start + 1}</span> to{" "}
                <span className="font-semibold text-charcoal">
                  {Math.min(start + pageSize, totalCount)}
                </span>{" "}
                of <span className="font-semibold text-charcoal">{totalCount}</span> projects
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-2">
                <ArchButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="border border-border-passive bg-cream disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} strokeWidth={1.5} />
                  Prev
                </ArchButton>

                <span className="text-caption text-charcoal px-2">
                  Page <span className="font-semibold">{page}</span> of {totalPages}
                </span>

                <ArchButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="border border-border-passive bg-cream disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} strokeWidth={1.5} />
                </ArchButton>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
