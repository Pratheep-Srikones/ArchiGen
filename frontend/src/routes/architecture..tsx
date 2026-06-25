/**
 * Route: "/architecture/$projectId" — saved architecture detail view.
 *
 * Fetches the project by ID from the backend, falling back to mock data
 * when the API is unreachable so the UI remains usable in dev/offline mode.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { NavigationBar } from "@/components/architect/NavigationBar";
import { ArchitectureView } from "@/components/architect/ArchitectureView";
import { MOCK_ARCHITECTURE } from "@/lib/mock-data";
import type { ArchitectureOutput } from "@/lib/mock-data";
import { getArchitecture } from "@/services/project";
import { Loading } from "@/components/Loading";

export const Route = createFileRoute("/architecture/$projectId")({
  component: ArchitecturePage,
  head: () => ({
    meta: [
      { title: "Project Architecture — ArchitectAI" },
      {
        name: "description",
        content:
          "Complete architecture for your project: macro design, micro components, tech stack, Mermaid diagram, and repository structure.",
      },
    ],
  }),
});

function useProject(projectId: string) {
  return useQuery({
    queryKey: ["project", "architecture", projectId],
    queryFn: async (): Promise<ArchitectureOutput> => {
      try {
        return await getArchitecture(projectId);
      } catch (error) {
        console.warn("Backend unreachable, falling back to mock architecture:", error);
        return MOCK_ARCHITECTURE;
      }
    },
  });
}

function ArchitecturePage() {
  const { projectId } = Route.useParams();
  const query = useProject(projectId);

  if (query.isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <NavigationBar showNewButton />
        <Loading fullScreen label="Loading project…" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="min-h-screen bg-cream">
        <NavigationBar showNewButton />
        <div className="pt-28 pb-24 px-6 text-center">
          <p className="text-[16px] text-charcoal">Failed to load project. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <NavigationBar showNewButton />
      <ArchitectureView data={query.data} isTemporary={false} />
    </div>
  );
}
