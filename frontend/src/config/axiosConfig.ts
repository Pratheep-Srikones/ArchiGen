import { useAuthStore } from "@/store/useAuthStore";
import axios, { AxiosInstance } from "axios";

const aiServiceUrl = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000";
const projectServiceUrl = import.meta.env.VITE_PROJECT_SERVICE_URL || "http://localhost:8001";

const attachAuthInterceptor = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });
};

export const aiApi = axios.create({
  baseURL: aiServiceUrl,
});

export const projectApi = axios.create({
  baseURL: projectServiceUrl,
});

attachAuthInterceptor(aiApi);
attachAuthInterceptor(projectApi);
