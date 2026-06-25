/**
 * Route: "/not-authenticated" — shown when auth is required but missing.
 *
 * Friendly blocker that surfaces the value proposition and gives
 * the user a clear path to sign in.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { NavigationBar } from "@/components/architect/NavigationBar";
import { ArchButton } from "@/components/architect/Button";
import { LogIn, ArrowLeft, Lock } from "lucide-react";
import NotAuthenticated from "@/components/auth/NotAuthenticated";

export const Route = createFileRoute("/not-authenticated")({
  component: NotAuthenticatedPage,
  head: () => ({
    meta: [
      { title: "Sign In — ArchitectAI" },
      {
        name: "description",
        content: "Sign in to ArchitectAI to generate and manage software architecture documents.",
      },
    ],
  }),
});

function NotAuthenticatedPage() {
  return <NotAuthenticated />;
}
