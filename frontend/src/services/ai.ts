import { api } from "@/config/axiosConfig";

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
