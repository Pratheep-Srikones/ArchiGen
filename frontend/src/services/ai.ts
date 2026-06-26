import { api } from "@/config/axiosConfig";
import { MicroSection, RepoNode, TechItem } from "@/lib/mock-data";

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
}

export const sendMessage = async (payload: ChatRequest) => {
  try {
    const response = await api.post("/ai/chat", payload);
    const ai_response = response.data.data?.response;
    return ai_response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}
