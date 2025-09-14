import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "./AuthContext";

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
  const { isAuthenticated, token, loading: authLoading, user } = useAuth();
  const location = useLocation(); // Get current route
  const hasFetchedRef = useRef(false); // Track if we've already fetched data
  const fetchTimeoutRef = useRef(null); // For debouncing

  const fetchStudents = useCallback(async (filters = {}) => {
    
    if (!isAuthenticated || !token) {
      return;
    }
    
    // Double-check that we're on a protected route
    const currentPath = location.pathname;
    const isProtectedRoute = currentPath === '/dashboard' || currentPath === '/settings' || currentPath === '/';
    
    if (!isProtectedRoute) {
      return;
    }
    
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await api.getStudents(filters);
      console.log('fetchStudents response:', response);
      
      // Handle the response structure - check both possible formats
      if ((response?.data?.success && response.data.students) || (response?.success && response.students)) {
        const students = response.data?.students || response.students;
        dispatch({ type: "SET_STUDENTS", payload: students });
        return response.data || response;
      } else {
        dispatch({ type: "SET_STUDENTS", payload: [] });
        dispatch({ type: "SET_ERROR", payload: "No student data available." });
        return response;
      }
    } catch (error) {
      console.error('fetchStudents: API error:', error);
      // Handle 403 errors gracefully - might be no data or permission issue
      if (error.response?.status === 403) {
        dispatch({ type: "SET_STUDENTS", payload: [] });
        dispatch({ type: "SET_ERROR", payload: "No student data available. Please upload student data first." });
        return; // Don't throw error for 403
      } else if (error.response?.status === 401) {
        dispatch({ type: "SET_STUDENTS", payload: [] });
        dispatch({ type: "SET_ERROR", payload: "Session expired. Please log in again." });
        return;
      } else {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    }
  }, [isAuthenticated, token, location.pathname]);

  const fetchSummary = useCallback(async () => {
    if (!isAuthenticated || !token) {
      return;
    }
    
    // Double-check that we're on a protected route
    const currentPath = location.pathname;
    const isProtectedRoute = currentPath === '/dashboard' || currentPath === '/settings' || currentPath === '/';
    
    if (!isProtectedRoute) {
      return;
    }
    
    try {
      const response = await api.getDashboardSummary();
      console.log('fetchSummary response:', response);
      
      // Handle the response structure - check both possible formats
      if ((response?.data?.success && response.data.summary) || (response?.success && response.summary)) {
        const summary = response.data?.summary || response.summary;
        dispatch({ type: "SET_SUMMARY", payload: summary });
        return response.data || response;
      } else {
        dispatch({ type: "SET_SUMMARY", payload: { total: 0, high: 0, medium: 0, low: 0, avgAttendance: 0 } });
        return response;
      }
    } catch (error) {
      console.error('fetchSummary: API error:', error);
      // Handle 403 errors gracefully - might be no data or permission issue
      if (error.response?.status === 403) {
        dispatch({ type: "SET_SUMMARY", payload: { total: 0, high: 0, medium: 0, low: 0, avgAttendance: 0 } });
        return; // Don't throw error for 403
      } else if (error.response?.status === 401) {
        dispatch({ type: "SET_SUMMARY", payload: { total: 0, high: 0, medium: 0, low: 0, avgAttendance: 0 } });
        return;
      } else {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    }
  }, [isAuthenticated, token, location.pathname]);

  const actions = {
    setLoading: (loading) =>
      dispatch({ type: "SET_LOADING", payload: loading }),
    fetchStudents,
    fetchSummary,

    uploadStudents: async (file) => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.uploadFile(formData);
        console.log('uploadStudents response:', response);
        
        // Handle the response structure - check both possible formats
        if (response?.data?.success || response?.success) {
          const students = response.data?.students || response.students || [];
          const summary = response.data?.summary || response.summary || { total: 0, high: 0, medium: 0, low: 0, avgAttendance: 0 };
          dispatch({ type: "SET_STUDENTS", payload: students });
          dispatch({ type: "SET_SUMMARY", payload: summary });
          return response.data || response;
        } else {
          dispatch({ type: "SET_ERROR", payload: "Upload failed" });
          return response;
        }
      } catch (error) {
        console.error('uploadStudents error:', error);
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },

    recalculateStudent: async (studentId) => {
      try {
        const response = await api.recalculateRisk(studentId);
        console.log('recalculateStudent response:', response);
        
        // Handle the response structure - check both possible formats
        if ((response?.data?.success && response.data.student) || (response?.success && response.student)) {
          const student = response.data?.student || response.student;
          dispatch({ type: "UPDATE_STUDENT", payload: student });
          return response.data || response;
        } else {
          dispatch({ type: "SET_ERROR", payload: "Recalculation failed" });
          return response;
        }
      } catch (error) {
        console.error('recalculateStudent error:', error);
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },

    // Manual refresh method for when user wants to try loading data
    refreshData: async () => {
      
      if (!isAuthenticated || !token) {
        return;
      }
      
      const currentPath = location.pathname;
      const isProtectedRoute = currentPath === '/dashboard' || currentPath === '/settings' || currentPath === '/';
      
      
      if (isProtectedRoute) {
        // Clear any existing timeout to prevent multiple calls
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        
        // Use a small timeout to prevent rapid successive calls
        fetchTimeoutRef.current = setTimeout(async () => {
          hasFetchedRef.current = false; // Reset fetch flag to allow refetch
          await fetchStudents();
          await fetchSummary();
        }, 100); // Very short delay to batch rapid calls
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

    // Delete student function
    deleteStudent: async (studentId) => {
      try {
        const response = await api.deleteStudentRecord(studentId);
        console.log('deleteStudent response:', response);
        
        // Refresh data after deletion
        await fetchStudents();
        await fetchSummary();
        
        return response;
      } catch (error) {
        console.error('deleteStudent error:', error);
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },

    // Delete all students function
    deleteAllStudents: async () => {
      try {
        const response = await api.deleteAllStudentRecords();
        console.log('deleteAllStudents response:', response);
        
        // Clear data after deletion
        dispatch({ type: "SET_STUDENTS", payload: [] });
        dispatch({ type: "SET_SUMMARY", payload: { total: 0, high: 0, medium: 0, low: 0, avgAttendance: 0 } });
        
        return response;
      } catch (error) {
        console.error('deleteAllStudents error:', error);
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },
  };

  // Clear data when user logs out
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      hasFetchedRef.current = false; // Reset when user logs out
      dispatch({ type: "SET_STUDENTS", payload: [] });
      dispatch({ type: "SET_SUMMARY", payload: null });
    }
  }, [authLoading, isAuthenticated]);

  // Auto-fetch data when user is authenticated and on protected routes
  useEffect(() => {
    if (isAuthenticated && !authLoading && !hasFetchedRef.current) {
      const currentPath = location.pathname;
      const isProtectedRoute = currentPath === '/dashboard' || currentPath === '/settings' || currentPath === '/';
      
      // Only fetch data for roles that need bulk student data (exclude student and parent roles)
      if (isProtectedRoute && user?.role !== 'student' && user?.role !== 'parent') {
        hasFetchedRef.current = true;
        fetchStudents();
        fetchSummary();
      }
    }
  }, [isAuthenticated, authLoading, location.pathname, fetchStudents, fetchSummary, user?.role]);

  // Debug: Log current state
  console.log('StudentContext - students:', state.students);
  console.log('StudentContext - loading:', state.loading);
  console.log('StudentContext - error:', state.error);

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
