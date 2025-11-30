import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generate_architecture } from "@/services/agent";
import { normalizeMermaid } from "@/utils/clean_text";

const Home = () => {
  const [requirement, setRequirement] = useState("");
  const navigate = useNavigate();

  const handleGenerate = async () => {
    const res = await generate_architecture(requirement);
    if (res) {
      const results = res.data;
      const mermaid = results[3];
      console.log(normalizeMermaid(mermaid));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div
            className="p-2 bg-primary/10 rounded-lg cursor-pointer"
            onClick={() => navigate("/")}
          >
            <Cpu className="h-6 w-6 text-primary" />
          </div>
          <h1
            className="text-xl font-semibold text-foreground cursor-pointer"
            onClick={() => navigate("/")}
          >
            ArchiGen
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-accent rounded-2xl mb-4">
              <Sparkles className="h-8 w-8 text-accent-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              AI-Powered Software Design
            </h2>
            <p className="text-lg text-muted-foreground">
              Describe your software requirements and get a complete
              architecture design
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8">
            <label
              htmlFor="requirement"
              className="block text-sm font-medium text-foreground mb-3"
            >
              Describe your software project
            </label>
            <Textarea
              id="requirement"
              placeholder="E.g., I need a real-time chat application with video calling, file sharing, and user authentication. It should support up to 10,000 concurrent users..."
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              className="min-h-[200px] text-base resize-none"
            />
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleGenerate}
                disabled={!requirement.trim()}
                className="flex-1 h-12 text-base font-medium"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Architecture
              </Button>
            </div>
          </div>
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

export default Home;
