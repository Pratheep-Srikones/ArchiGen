import axios from "axios";

const aiServiceUrl = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000";

export const axiosInstance = axios.create({
  baseURL: aiServiceUrl,
});
