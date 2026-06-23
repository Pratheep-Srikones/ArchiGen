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
import { Loading } from "@/components/Loading";
import { useAuthStore } from "@/store/useAuthStore";

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
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuthStore();

  const state = location.state as ArchitectureLocationState | undefined;
  const data = state?.architecture ?? MOCK_ARCHITECTURE;

  if (loading) {
    return <CheckingAuthentication />;
  }

  if (!isAuthenticated) {
    return <Loading fullScreen label="Redirecting to sign in…" />;
  }

  if (!state?.architecture) {
    // No architecture data in state — bounce to workspace.
    navigate({ to: "/dashboard" });
    return null;
  }

  const handleSave = () => {
    // TODO: wire up real save endpoint. For now, show a success toast
    // and navigate to /dashboard. In a later iteration this navigates to
    // the newly saved project's /architecture/$projectId page.
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
