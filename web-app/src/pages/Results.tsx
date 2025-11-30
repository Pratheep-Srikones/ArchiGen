import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Cpu, Code, Layers, Network, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArchitectureAgentRespose } from "@/types/resposes";
import HTMLTextBox from "@/components/HTMLTextBox";
import MermaidDiagram from "@/components/MermaidDiagram";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const requirement = location.state?.requirement || "";
  const architectureData: ArchitectureAgentRespose =
    location.state?.architectureData;

  if (!architectureData) {
    navigate("/home");
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
              <HTMLTextBox content={architectureData.architecture} />
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
                <HTMLTextBox content={architectureData.techstack} />
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
              <div className="bg-surface rounded-lg border-2 border-dashed border-border w-full h-full flex items-stretch">
                <div className="w-full h-full">
                  <MermaidDiagram chart={architectureData.mermaidDiagram} />
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
                <HTMLTextBox content={architectureData.explanation} />
              </div>
            </CardContent>
          </Card>

          {/* Components Breakdown */}
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
