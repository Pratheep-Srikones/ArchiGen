import { axiosInstance } from "@/config/axiosConfig";

export const getArchitectureResponse = async (prompt: string) => {
  try {
    const response = await axiosInstance.post("/ai/generate-architecture", {
      user_idea: prompt,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching architecture response:", error);
    throw error;
  }
};
