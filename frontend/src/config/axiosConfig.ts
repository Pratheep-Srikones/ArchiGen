import { useAuthStore } from "@/store/useAuthStore";
import axios, { AxiosInstance } from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api"

const attachAuthInterceptor = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });
};

export const api = axios.create({
  baseURL: apiUrl,
});

attachAuthInterceptor(api)
