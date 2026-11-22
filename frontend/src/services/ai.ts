import { api } from "@/config/axiosConfig";
import {
  ArchitectureOutput,
  MicroSection,
  RepoNode,
  TechItem,
} from "@/lib/mock-data";
import { useAuthStore } from "@/store/useAuthStore";

export interface StreamEvent {
  run_id: string;
  type:
    | "agent_start"
    | "agent_output"
    | "verdict"
    | "tool_call"
    | "tool_result"
    | "final"
    | "error";
  agent?: string;
  iteration?: number;
  data?: any;
  timestamp?: number;
  ms?: number;
}

export type StreamEventCallback = (event: StreamEvent) => void;

export const streamArchitectureResponse = async (
  prompt: string,
  onEvent: StreamEventCallback,
  signal?: AbortSignal,
): Promise<ArchitectureOutput> => {
  const token = useAuthStore.getState().token;
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
  const url = `${apiUrl}/ai/generate-architecture/stream`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ user_idea: prompt }),
    signal,
  });

  if (!response.ok) {
    let errorDetail = "Failed to start architecture stream";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  if (!response.body) {
    throw new Error("ReadableStream not supported on this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalArchitecture: ArchitectureOutput | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        for (const line of trimmed.split("\n")) {
          if (line.startsWith("data: ")) {
            const jsonText = line.slice(6).trim();
            if (!jsonText) continue;
            try {
              const event = JSON.parse(jsonText) as StreamEvent;
              onEvent(event);
              if (event.type === "final" && event.data) {
                finalArchitecture = event.data as ArchitectureOutput;
              } else if (event.type === "error" && event.data?.error) {
                throw new Error(event.data.error);
              }
            } catch (err) {
              if (err instanceof Error && err.message !== "Unexpected token") {
                throw err;
              }
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!finalArchitecture) {
    throw new Error("Stream closed before receiving final architecture specification.");
  }

  return finalArchitecture;
};

type CreateChatRequest = {
  architecture: {
    title: string;
    requirements: string;
    architecture: string;
    mermaid_code: string;
    micro: MicroSection[];
    tech_stack: TechItem[];
    repo: RepoNode[];
  };
};

type ChatRequest = {
  session_id: string;
  user_question: string;
};

export type DiagramType =
  | "sequence"
  | "class"
  | "component"
  | "deployment"
  | "usecase"
  | "activity"
  | "state"
  | "flowchart"
  | "er";
type CreateDiagramRequest = {
  context: {
    title: string;
    requirements: string;
    architecture: string;
    mermaid_code: string;
    micro: MicroSection[];
    tech_stack: TechItem[];
    repo: RepoNode[];
  };
  diagram_type: DiagramType;
  prompt: string;
};

export const getArchitectureResponse = async (prompt: string) => {
  try {
    const response = await api.post("/ai/generate-architecture", {
      user_idea: prompt,
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching architecture response:", error);
    throw error;
  }
};

export const createChat = async (payload: CreateChatRequest) => {
  try {
    const response = await api.post("/ai/chat/new", payload);
    const session_id = response.data.data?.session_id;
    return session_id;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
};

export const sendMessage = async (payload: ChatRequest) => {
  try {
    const response = await api.post("/ai/chat", payload);
    const ai_response = response.data.data?.response;
    return ai_response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const generateDiagram = async (payload: CreateDiagramRequest) => {
  try {
    const response = await api.post("/ai/diagram", payload);
    const diagram = response.data.data?.diagram;
    return diagram;
  } catch (error) {
    console.error("Error generating diagram:", error);
    throw error;
  }
};
