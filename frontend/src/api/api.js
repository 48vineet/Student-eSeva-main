import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ML_API_URL = import.meta.env.VITE_ML_API_URL || "http://localhost:5002";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Don't log 403 errors as they're handled gracefully in components
    if (error.response?.status !== 403) {
      console.error("API Error:", error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// API methods matching your backend routes
export const api = {
  // File upload - POST /api/upload/exam-data
  uploadFile: (formData) =>
    apiClient.post("/api/upload/exam-data", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Students - GET /api/students
  getStudents: (params = {}) => apiClient.get("/api/students", { params }),

  // Student by ID - GET /api/students/:studentId
  getStudentById: (studentId) => apiClient.get(`/api/students/${studentId}`),

  // Dashboard summary - GET /api/students/dashboard/summary
  getDashboardSummary: () => apiClient.get("/api/students/dashboard/summary"),

  // Recalculate risk - POST /api/students/:studentId/recalculate
  recalculateRisk: (studentId) =>
    apiClient.post(`/api/students/${studentId}/recalculate`),

  // Send notifications - POST /api/notifications
  sendNotifications: () => apiClient.post("/api/notifications", {}, {
    timeout: 30000, // 30 seconds timeout for email sending
  }),

  // Get config - GET /api/config
  getConfig: () => apiClient.get("/api/config"),

  // Update config - POST /api/config
  updateConfig: (config) => apiClient.post("/api/config", config),

  // Reset config - POST /api/config/reset
  resetConfig: () => apiClient.post("/api/config/reset"),

  // Health check
  healthCheck: () => apiClient.get("/health"),
};

// ML API calls
export const mlApi = {
  predict: (studentData) => axios.post(`${ML_API_URL}/predict`, studentData),

  batchPredict: (studentsArray) =>
    axios.post(`${ML_API_URL}/predict/batch`, { students: studentsArray }),

  healthCheck: () => axios.get(`${ML_API_URL}/health`),
};
