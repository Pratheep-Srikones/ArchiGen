import { aiApi } from "@/config/axiosConfig";

export const getArchitectureResponse = async (prompt: string) => {
  try {
    const response = await aiApi.post("/ai/generate-architecture", {
      user_idea: prompt,
    });
    console.log("Architecture response received:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching architecture response:", error);
    throw error;
  }
};
