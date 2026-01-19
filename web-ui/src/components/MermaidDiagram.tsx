import React, { useEffect, useState, useCallback } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  code: string;
  saveEditedCode?: (newCode: string) => void;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  code,
  saveEditedCode,
}) => {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [codeEditModalOpen, setCodeEditModalOpen] = useState(false);
  const [renderedCode, setRenderedCode] = useState(code);
  const [editingCode, setEditingCode] = useState(code);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "loose",
    });
  }, []);

  const renderDiagram = useCallback(async (codeToRender: string) => {
    if (!codeToRender || codeToRender.trim() === "") {
      setError("No diagram code provided");
      return;
    }

    try {
      // Generate a unique ID for each render to avoid conflicts
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

      // First validate the syntax before rendering
      const isValid = await mermaid.parse(codeToRender).catch(() => false);
      if (!isValid) {
        setError("Invalid Mermaid syntax. Please check your diagram code.");
        return;
      }

      // mermaid.render returns an object { svg: string } in v10+
      const { svg: svgContent } = await mermaid.render(id, codeToRender);
      setSvg(svgContent);
      setError(null);
    } catch (err) {
      console.error("Failed to render mermaid diagram", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to render diagram: ${errorMessage}`);
    }
  }, []);

  useEffect(() => {
    renderDiagram(renderedCode);
  }, [renderedCode, renderDiagram]);

  // Sync editingCode when modal opens
  useEffect(() => {
    if (codeEditModalOpen) {
      setEditingCode(renderedCode);
    }
  }, [codeEditModalOpen, renderedCode]);

  const handleModalClose = useCallback(() => {
    setCodeEditModalOpen(false);
  }, []);

  const handleSave = useCallback(() => {
    setRenderedCode(editingCode);
    if (saveEditedCode) {
      saveEditedCode(editingCode);
    }
    setCodeEditModalOpen(false);
  }, [editingCode, saveEditedCode, handleModalClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleModalClose();
      }
    },
    [handleModalClose]
  );

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && codeEditModalOpen) {
        handleModalClose();
      }
    };

    if (codeEditModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [codeEditModalOpen, handleModalClose]);

  // Modal component
  const Modal = () => {
    if (!codeEditModalOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        style={{ zIndex: 9999 }}
        onClick={handleBackdropClick}
      >
        <div
          className="bg-white rounded-lg p-6 w-11/12 max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Edit Mermaid Code
          </h2>
          <textarea
            className="w-full h-64 p-2 border border-gray-300 rounded mb-4 font-mono resize-none text-gray-800"
            value={editingCode}
            onChange={(e) => setEditingCode(e.target.value)}
            placeholder="Enter your Mermaid diagram code here..."
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleModalClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Edit button component
  const EditButton = () => (
    <button
      onClick={() => setCodeEditModalOpen(true)}
      className="ml-4 p-2 bg-red-100 rounded cursor-pointer hover:bg-red-200"
      title="Edit Mermaid Code"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
        />
      </svg>
    </button>
  );

  if (error) {
    return (
      <>
        <div className="p-4 bg-red-50 text-red-500 rounded border border-red-200 flex items-center">
          <span className="flex-1">{error}</span>
          <EditButton />
        </div>
        <Modal />
      </>
    );
  }

  return (
    <>
      <div
        className="mermaid-container w-full overflow-x-auto flex justify-center p-4 bg-white rounded-lg border border-gray-100 shadow-sm"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <EditButton />
      <Modal />
    </>
  );
};

export default MermaidDiagram;
