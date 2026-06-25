/**
 * Route: "/result" — temporary post-generation preview page.
 *
 * Receives the generated architecture via TanStack Router location state,
 * renders it with ArchitectureView, and offers a "Save Project" action that
 * persists it to the workspace. After saving, navigates back to /dashboard.
 */
import { createFileRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { toast } from "sonner";
import { NavigationBar } from "@/components/architect/NavigationBar";
import { ArchitectureView } from "@/components/architect/ArchitectureView";
import { MOCK_ARCHITECTURE } from "@/lib/mock-data";
import type { ArchitectureOutput } from "@/lib/mock-data";
import { CheckingAuthentication } from "@/components/auth/CheckingAuthentication";
import { useAuthStore } from "@/store/useAuthStore";
import NotAuthenticated from "@/components/auth/NotAuthenticated";
import { useAuth } from "@/hooks/use-auth";
import { createProject, CreateProjectRequest } from "@/services/project";
import { useEffect } from "react";
import { InvalidAccess } from "@/components/architect/InvalidAccess";

export interface ArchitectureLocationState {
  architecture?: ArchitectureOutput;
}

export const Route = createFileRoute("/result")({
  component: ResultPage,
  head: () => ({
    meta: [{ title: "Generated Architecture — ArchitectAI" }],
  }),
});

function ResultPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuthStore();

  const state = location.state as ArchitectureLocationState | undefined;
  const data = state?.architecture ?? MOCK_ARCHITECTURE;

  if (loading) {
    return <CheckingAuthentication />;
  }

  if (!isAuthenticated) {
    return <NotAuthenticated />;
  }

  if (!state?.architecture) {
    return <InvalidAccess />;
  }

  const handleSave = async () => {
    const user_id = user?.id ?? "";
    if (!user_id) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    const projectData: CreateProjectRequest = {
      user_id,
      project_id: data?.projectId!,
      title: data?.title ?? "Untitled Project",
      requirements: data?.requirements ?? "",
      architecture: data?.architecture ?? "",
      mermaid_code: data?.mermaid_code ?? "",
      micro: data?.micro ?? [],
      tech_stack: data?.tech_stack ?? [],
      repo: data?.repo ?? [],
    };
    try {
      await createProject(projectData);
    } catch (error) {
      toast.error("Failed to save project.");
      return;
    }
    toast.success("Project saved");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-cream">
      <NavigationBar showNewButton={false} />
      <ArchitectureView data={data} isTemporary={true} onSave={handleSave} />
    </div>
  );
}
