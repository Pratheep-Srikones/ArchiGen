import axios from "axios";

const aiServiceUrl = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000";
const projectServiceUrl = import.meta.env.VITE_PROJECT_SERVICE_URL || "http://localhost:8001";

export const aiApi = axios.create({
  baseURL: aiServiceUrl,
});

export const projectApi = axios.create({
  baseURL: projectServiceUrl,
});
