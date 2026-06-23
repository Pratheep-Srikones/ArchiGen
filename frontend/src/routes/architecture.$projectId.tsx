/**
 * Route: "/architecture/$projectId" — saved architecture detail view.
 *
 * Fetches the project by ID from the backend (currently falls back to
 * MOCK_ARCHITECTURE). Uses the shared ArchitectureView presentational
 * component to render the full architecture document.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { NavigationBar } from "@/components/architect/NavigationBar";
import { ArchitectureView } from "@/components/architect/ArchitectureView";
import { MOCK_ARCHITECTURE } from "@/lib/mock-data";
import type { ArchitectureOutput } from "@/lib/mock-data";
import { Loading } from "@/components/Loading";

export const Route = createFileRoute("/architecture/$projectId")({
  component: ArchitecturePage,
  head: () => ({
    meta: [
      { title: "Live Streaming Service Architecture — ArchitectAI" },
      {
        name: "description",
        content:
          "Complete architecture for a live streaming platform: macro design, micro components, tech stack, Mermaid diagram, and repository structure.",
      },
    ],
  }),
});

function useProject(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async (): Promise<ArchitectureOutput> => {
      // TODO: replace with real backend fetch
      // import { axiosInstance } from "@/config/axiosConfig";
      // const res = await axiosInstance.get(`/projects/${projectId}`);
      // return res.data;
      return MOCK_ARCHITECTURE;
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

  if (query.isError) {
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
      <ArchitectureView data={query.data!} isTemporary={false} />
    </div>
  );
}
