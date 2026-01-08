import React, { useEffect, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  code: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code }) => {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "loose",
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (code) {
        try {
          setError(null);
          // Generate a unique ID for each render to avoid conflicts
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          // mermaid.render returns an object { svg: string } in v10+
          const { svg: svgContent } = await mermaid.render(id, code);
          setSvg(svgContent);
        } catch (err) {
          console.error("Failed to render mermaid diagram", err);
          setError("Failed to render diagram syntax.");
        }
      }
    };

    renderDiagram();
  }, [code]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded border border-red-200">
        {error}
      </div>
    );
  }

  return (
    <div
      className="mermaid-container w-full overflow-x-auto flex justify-center p-4 bg-white rounded-lg border border-gray-100 shadow-sm"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidDiagram;
