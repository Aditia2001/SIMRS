import axios from "axios";

export const yiiApi = axios.create({
  baseURL: import.meta.env.VITE_YII_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const nodeApi = axios.create({
  baseURL: import.meta.env.VITE_NODE_API_URL || "http://localhost:3001/api",
});

yiiApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("simrs_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
