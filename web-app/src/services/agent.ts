import axios from "axios";
const agentUrl = import.meta.env.VITE_AGENT_URL || "http://localhost:8000";

export const generate_architecture = async (user_prompt: string) => {
  if (!user_prompt) {
    alert("User prompt is required");
    return;
  }
  try {
    const response = await axios.post(`${agentUrl}/query`, {
      user_prompt: user_prompt,
      user_id: "user_123", // Example user ID
    });
    if (response.status !== 200) {
      console.error("Error response from agent:", response);
      alert("Failed to get a valid response from the agent.");
      return;
    }
    if (response.data.error) {
      console.error("Error in agent response data:", response.data.error);
      alert(`Agent Error: ${response.data.error}`);
      return;
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching details from agent:", error);
    throw error;
  }
};
