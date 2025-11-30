import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, Loader2, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const loadingSteps = [
  { id: 1, text: "Analyzing requirements" },
  { id: 2, text: "Building architecture" },
  { id: 3, text: "Elaborating architecture" },
  { id: 4, text: "Choosing tech stack" },
  { id: 5, text: "Generating architecture diagrams" },
];

const STEP_INTERVAL = 12000; // 12 seconds per step

const LoadingState = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, STEP_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            <div
              className="p-2 bg-primary/10 rounded-lg cursor-pointer"
              onClick={() => navigate("/")}
            >
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <h1
              className="text-lg font-semibold text-foreground cursor-pointer"
              onClick={() => navigate("/")}
            >
              ArchiGen
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-accent rounded-2xl mb-6">
              <Loader2 className="h-10 w-10 text-accent-foreground animate-spin" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Generating Your Architecture
            </h2>
            <p className="text-muted-foreground">
              Please wait while we analyze and design your solution
            </p>
          </div>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                {loadingSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-500 ${
                      index < currentStep
                        ? "bg-primary/10"
                        : index === currentStep
                        ? "bg-accent"
                        : "bg-muted/30"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center h-8 w-8 rounded-full transition-all duration-500 ${
                        index < currentStep
                          ? "bg-primary text-primary-foreground"
                          : index === currentStep
                          ? "bg-accent-foreground/20"
                          : "bg-muted"
                      }`}
                    >
                      {index < currentStep ? (
                        <Check className="h-4 w-4" />
                      ) : index === currentStep ? (
                        <Loader2 className="h-4 w-4 animate-spin text-accent-foreground" />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {step.id}
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-medium transition-all duration-500 ${
                        index < currentStep
                          ? "text-primary"
                          : index === currentStep
                          ? "text-accent-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            This may take up to a minute...
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            AI-Powered Software Design Workbench
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LoadingState;
