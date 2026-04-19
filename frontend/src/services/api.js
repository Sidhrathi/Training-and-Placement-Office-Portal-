import axios from "axios";

// Create axios instance with base URL
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 60000, // 60 seconds timeout (increased for large data)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add request interceptor to set Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log("Adding auth token to request:", config.url);
      console.log("User role:", role);
      console.log(
        "Auth token (first 10 chars):",
        token.substring(0, 10) + "..."
      );
    } else {
      console.warn("No auth token found for request:", config.url);
      // For debugging purposes, check if we're in exam creation to provide guidance
      if (
        config.url &&
        config.url.includes("/exams") &&
        config.method === "post"
      ) {
        console.error(
          "AUTH ERROR: No token available for exam creation. User may not be logged in or session expired."
        );
      }
    }

    // Special handling for form data requests
    if (config.data instanceof FormData) {
      // Remove default content-type so browser sets it with boundary
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    console.error("API request error interceptor:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle auth errors globally
    if (error.response && error.response.status === 401) {
      console.warn("Authentication error detected in API response");
      // Could trigger logout here if needed
    }
    return Promise.reject(error);
  }
);

export default api;
