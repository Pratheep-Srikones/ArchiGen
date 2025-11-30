import { Cpu, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingState = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">ArchiGen</h1>
          </div>
        </div>
      </header>

      {/* Loading Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center animate-fade-in">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-accent rounded-full mb-4">
            <Loader2 className="h-5 w-5 text-accent-foreground animate-spin" />
            <span className="text-sm font-medium text-accent-foreground">
              Generating architecture...
            </span>
          </div>
          <p className="text-muted-foreground">
            Analyzing requirements and designing optimal solution
          </p>
        </div>

        <div className="grid gap-6">
          {/* Summary Skeleton */}
          <Card className="border-border">
            <CardHeader>
              <Skeleton className="h-6 w-48 animate-shimmer" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full animate-shimmer" />
              <Skeleton className="h-4 w-5/6 animate-shimmer" />
              <Skeleton className="h-4 w-4/6 animate-shimmer" />
            </CardContent>
          </Card>

          {/* Tech Stack Skeleton */}
          <Card className="border-border">
            <CardHeader>
              <Skeleton className="h-6 w-56 animate-shimmer" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-l-2 border-muted pl-4 space-y-2">
                  <Skeleton className="h-5 w-32 animate-shimmer" />
                  <Skeleton className="h-4 w-full animate-shimmer" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Diagram Skeleton */}
          <Card className="border-border">
            <CardHeader>
              <Skeleton className="h-6 w-64 animate-shimmer" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-96 w-full rounded-lg animate-shimmer" />
            </CardContent>
          </Card>

          {/* Components Skeleton */}
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-border">
                <CardHeader>
                  <Skeleton className="h-5 w-40 animate-shimmer" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full animate-shimmer" />
                  <Skeleton className="h-4 w-5/6 animate-shimmer" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 animate-shimmer" />
                    <Skeleton className="h-6 w-24 animate-shimmer" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoadingState;
