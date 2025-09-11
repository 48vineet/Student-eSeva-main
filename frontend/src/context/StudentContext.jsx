import React, { createContext, useContext, useReducer, useEffect } from "react";
import { api } from "../api/api";

const StudentContext = createContext();

const initialState = {
  students: [],
  summary: { total: 0, high: 0, medium: 0, low: 0 },
  loading: false,
  error: null,
  filters: { risk_level: "", page: 1, limit: 50 },
};

function studentReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_STUDENTS":
      return { ...state, students: action.payload, loading: false };

    case "SET_SUMMARY":
      return { ...state, summary: action.payload };

    case "ADD_STUDENTS":
      return {
        ...state,
        students: [...action.payload, ...state.students],
        loading: false,
      };

    case "UPDATE_STUDENT":
      return {
        ...state,
        students: state.students.map((s) =>
          s.student_id === action.payload.student_id ? action.payload : s
        ),
      };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };

    default:
      return state;
  }
}

export function StudentProvider({ children }) {
  const [state, dispatch] = useReducer(studentReducer, initialState);

  const actions = {
    setLoading: (loading) =>
      dispatch({ type: "SET_LOADING", payload: loading }),

    fetchStudents: async (filters = {}) => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        const response = await api.getStudents(filters);
        dispatch({ type: "SET_STUDENTS", payload: response.students });
        return response;
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },

    fetchSummary: async () => {
      try {
        const response = await api.getDashboardSummary();
        dispatch({ type: "SET_SUMMARY", payload: response.summary });
        return response;
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },

    uploadStudents: async (file) => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.uploadFile(formData);
        // Use SET_STUDENTS to replace all students (since backend clears data)
        dispatch({ type: "SET_STUDENTS", payload: response.students });
        dispatch({ type: "SET_SUMMARY", payload: response.summary });
        return response;
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },

    recalculateStudent: async (studentId) => {
      try {
        const response = await api.recalculateRisk(studentId);
        dispatch({ type: "UPDATE_STUDENT", payload: response.student });
        return response;
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },

    sendNotifications: async () => {
      try {
        return await api.sendNotifications();
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },
  };

  // Initial data fetch
  useEffect(() => {
    actions.fetchSummary();
    actions.fetchStudents();
  }, []);

  return (
    <StudentContext.Provider value={{ state, actions }}>
      {children}
    </StudentContext.Provider>
  );
}

export const useStudents = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error("useStudents must be used within StudentProvider");
  }
  return context;
};
