/**
 * Route: "/architecture/$projectId" — saved architecture detail view.
 *
 * Fetches the project architecture by ID from the backend.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NavigationBar } from "@/components/architect/NavigationBar";
import { ArchitectureView } from "@/components/architect/ArchitectureView";
import type { ArchitectureOutput } from "@/lib/mock-data";
import {
  getArchitecture,
  getDiagrams,
  saveDiagram,
  type Diagram,
  type SaveDiagramRequest,
  updateArchitectureMermaidCode,
} from "@/services/project";
import { Loading } from "@/components/Loading";
import { toast } from "sonner";

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
      return await getArchitecture(projectId);
    },
  });
}

function useDiagrams(projectId: string) {
  return useQuery<Diagram[], Error>({
    queryKey: ["project", "diagrams", projectId],
    queryFn: async () => {
      return await getDiagrams(projectId);
    },
  });
}

function useSaveDiagram(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, SaveDiagramRequest>({
    mutationFn: async (payload) => {
      return await saveDiagram(projectId, payload);
    },
    onSuccess: () => {
      toast.success("Diagram saved successfully");
      queryClient.invalidateQueries({
        queryKey: ["project", "diagrams", projectId],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save diagram");
    },
  });
}

function ArchitecturePage() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const query = useProject(projectId);
  const diagramsQuery = useDiagrams(projectId);
  const saveDiagramMutation = useSaveDiagram(projectId);

  const handleUpdateMermaidCode = async (_projectId: string, mermaidCode: string) => {
    await updateArchitectureMermaidCode(_projectId, mermaidCode);
    toast.success("Diagram updated successfully");
    await queryClient.invalidateQueries({ queryKey: ["project", "architecture", _projectId] });
  };

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
      <ArchitectureView
        data={query.data}
        isTemporary={false}
        projectId={projectId}
        onUpdateMermaidCode={handleUpdateMermaidCode}
        diagrams={diagramsQuery.data ?? []}
        diagramsLoading={diagramsQuery.isLoading}
        diagramsError={diagramsQuery.error}
        onDiagramsRetry={() => diagramsQuery.refetch()}
        onSaveDiagram={async (payload) => {
          await saveDiagramMutation.mutateAsync(payload);
        }}
        isSavingDiagram={saveDiagramMutation.isPending}
      />
    </div>
  );
}
