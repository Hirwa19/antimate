import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://brooder-backend.onrender.com";

const API = axios.create({
  baseURL: `${API_URL}/api`,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;