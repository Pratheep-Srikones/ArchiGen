import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Cpu, Code, Layers, Network, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingState from "@/components/LoadingState";
import { dummyArchitecture } from "@/data/dummyData";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const requirement = location.state?.requirement || "";

  useEffect(() => {
    // Simulate architecture generation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/design")}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">ArchiGen</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Requirement Display */}
        <div className="mb-8 animate-fade-in">
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Your Requirement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{requirement}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 animate-slide-up">
          {/* High-Level Summary */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Architecture Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {dummyArchitecture.summary}
              </p>
            </CardContent>
          </Card>

          {/* Tech Stack */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Recommended Tech Stack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dummyArchitecture.techStack.map((tech, index) => (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <h4 className="font-semibold text-foreground mb-1">
                      {tech.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {tech.reason}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Diagram Placeholder */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                System Architecture Diagram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-surface rounded-lg border-2 border-dashed border-border h-96 flex items-center justify-center">
                <div className="text-center">
                  <Network className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">
                    Architecture diagram placeholder
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Visual representation coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Design Reasoning */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Design Justification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground leading-relaxed">
                  {dummyArchitecture.reasoning}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Components Breakdown */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              System Components
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {dummyArchitecture.components.map((component, index) => (
                <Card
                  key={index}
                  className="border-border hover:border-primary/50 transition-colors"
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      {component.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {component.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {component.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded-md font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate("/")} variant="outline" size="lg">
            Generate New Architecture
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Results;
