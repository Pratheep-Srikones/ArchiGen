/**
 * Route: "/profile" — authenticated user profile page.
 *
 * Displays the current user's account details and provides
 * a clear path to sign out. Only accessible when authenticated.
 */
import { createFileRoute } from "@tanstack/react-router";
import { NavigationBar } from "@/components/architect/NavigationBar";
import { CheckingAuthentication } from "@/components/auth/CheckingAuthentication";
import { Loading } from "@/components/Loading";
import { useAuthStore } from "@/store/useAuthStore";
import { User, Mail, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { ArchButton } from "@/components/architect/Button";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile — ArchitectAI" },
      {
        name: "description",
        content: "Manage your ArchitectAI account and view your profile details.",
      },
    ],
  }),
});

function ProfilePage() {
  const { isAuthenticated, loading, user } = useAuthStore();
  const { logout } = useAuth();

  if (loading) {
    return <CheckingAuthentication />;
  }

  if (!isAuthenticated) {
    return <Loading fullScreen label="Redirecting to sign in…" />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <NavigationBar showNewButton={true} />

      <main className="pt-14">
        <section className="max-w-140 mx-auto px-6 pt-24 pb-24">
          <h1 className="text-display text-charcoal text-center">Your Profile</h1>
          <p className="mt-4 text-body-lg text-muted text-center max-w-100 mx-auto">
            Manage your account details and preferences.
          </p>

          <div className="mt-12 rounded-xl border border-border-passive bg-cream p-8">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-charcoal-04 border border-border-passive flex items-center justify-center text-charcoal overflow-hidden">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.username || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={32} strokeWidth={1.5} />
                )}
              </div>

              <h2 className="mt-5 text-card-title text-charcoal">
                {user?.fullName || user?.username || "User"}
              </h2>

              <div className="mt-6 w-full space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-border-passive px-4 py-3">
                  <User size={18} strokeWidth={1.5} className="text-charcoal-60 shrink-0" />
                  <div>
                    <p className="text-caption text-muted">Username</p>
                    <p className="text-body text-charcoal">{user?.username || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border-passive px-4 py-3">
                  <Mail size={18} strokeWidth={1.5} className="text-charcoal-60 shrink-0" />
                  <div>
                    <p className="text-caption text-muted">User ID</p>
                    <p className="text-body text-charcoal break-all">{user?.id || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                <ArchButton variant="ghost" size="default" onClick={() => logout()}>
                  <LogOut size={16} strokeWidth={1.5} />
                  Sign Out
                </ArchButton>

                <Link to="/dashboard" className="w-full sm:w-auto">
                  <ArchButton variant="primary" size="default">
                    <ArrowLeft size={16} strokeWidth={1.5} />
                    Back to Dashboard
                  </ArchButton>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
