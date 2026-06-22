/**
 * Route: "/" — marketing homepage.
 *
 * Introduces ArchitectAI, surfaces the value proposition, and
 * provides clear entry points (sign in or start generating).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { NavigationBar } from "@/components/architect/NavigationBar";
import { ArchButton } from "@/components/architect/Button";
import { useAuthContext } from "@asgardeo/auth-react";
import { Layers, Zap, Shield, ArrowRight, LogIn, LogOut, User } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "ArchitectAI — Design system architecture in plain language" },
      {
        name: "description",
        content:
          "ArchitectAI generates complete software architecture documents — macro design, tech stack, diagrams, and repository structure — from a single prompt.",
      },
    ],
  }),
});

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Generation",
    description:
      "Go from idea to full architecture document in seconds. No templates, no blanks — just describe what you're building.",
  },
  {
    icon: Layers,
    title: "Complete Stack",
    description:
      "Get macro design, tech stack recommendations, visual diagrams, and repository structure in one coherent output.",
  },
  {
    icon: Shield,
    title: "Production-Ready",
    description:
      "Architectures designed with scalability, security, and maintainability in mind from day one.",
  },
];

function HomePage() {
  const { signIn, signOut, state } = useAuthContext();
  const isAuthenticated = state?.isAuthenticated;

  return (
    <div className="min-h-screen bg-cream">
      <NavigationBar showNewButton={false} />

      <main className="pt-14">
        {/* Hero */}
        <section className="max-w-180 mx-auto text-center px-6 pt-24 pb-20">
          <h1 className="text-display text-charcoal">
            Design system architecture
            <br />
            in plain language
          </h1>
          <p className="mt-6 text-body-lg text-muted max-w-140 mx-auto">
            Describe your system and get a complete architecture document — macro design, tech
            stack, diagrams, and repository structure — generated instantly.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <ArchButton variant="primary" size="default">
                    Go to Dashboard
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </ArchButton>
                </Link>
                <ArchButton variant="ghost" size="default" onClick={() => signOut()}>
                  <LogOut size={16} strokeWidth={1.5} />
                  Sign Out
                </ArchButton>
              </>
            ) : (
              <>
                <ArchButton variant="primary" size="default" onClick={() => signIn()}>
                  <LogIn size={16} strokeWidth={1.5} />
                  Sign In
                </ArchButton>
              </>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-300 mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border-passive bg-cream p-6 transition-colors hover:border-charcoal-30"
              >
                <div className="w-10 h-10 rounded-lg bg-charcoal-04 flex items-center justify-center text-charcoal">
                  <feature.icon size={20} strokeWidth={1.5} />
                </div>
                <h3 className="text-card-title text-charcoal mt-4">{feature.title}</h3>
                <p className="text-caption text-muted mt-2 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA bottom */}
        <section className="border-t border-border-passive">
          <div className="max-w-180 mx-auto px-6 py-16 text-center">
            <h2 className="text-section text-charcoal">Ready to architect?</h2>
            <p className="mt-4 text-body-lg text-muted max-w-120 mx-auto">
              Join thousands of engineers who use ArchitectAI to move from idea to implementation
              plan in minutes.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <ArchButton variant="primary" size="default">
                    Start Building
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </ArchButton>
                </Link>
              ) : (
                <>
                  <ArchButton variant="primary" size="default" onClick={() => signIn()}>
                    <User size={16} strokeWidth={1.5} />
                    Sign In & Get Started
                  </ArchButton>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border-passive">
          <div className="max-w-300 mx-auto px-6 py-6 flex items-center justify-between">
            <span className="text-caption text-muted">
              © {new Date().getFullYear()} ArchitectAI
            </span>
            <div className="flex items-center gap-4">
              {isAuthenticated && state.displayName && (
                <span className="text-caption text-charcoal-60 flex items-center gap-1.5">
                  <User size={14} strokeWidth={1.5} />
                  {state.displayName}
                </span>
              )}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
