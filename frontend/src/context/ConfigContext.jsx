import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/api"; 
 
const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    attendanceCritical: 75,
    attendanceWarning: 85,
    failingHigh: 2,
    failingMedium: 1,
    overdueDays: 30,
    maxAttempts: 3,
    institutionName: "Student eSeva Institution",
    academicYear: new Date().getFullYear().toString(),
    semester: "1",
    emailNotifications: true,
    smsNotifications: false,
    attendanceWeight: 0.4,
    academicWeight: 0.4,
    financialWeight: 0.2,
    lastUpdated: new Date(),
    updatedBy: "system"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getConfig();
      setConfig(response.config);
    } catch (err) {
      // Handle CORS and network errors gracefully
      if (err.message.includes('CORS') || err.message.includes('Network Error') || err.message.includes('Failed to fetch')) {
        console.warn('Config API not available, using default configuration');
        setError('Config service unavailable, using default settings');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig) => {
    try {
      setLoading(true);
      const response = await api.updateConfig(newConfig);
      setConfig(response.config);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetConfig = async () => {
    try {
      setLoading(true);
      const response = await api.resetConfig();
      setConfig(response.config);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Don't automatically fetch config on mount to avoid CORS issues
  // Config will be fetched when needed by components
  // useEffect(() => {
  //   fetchConfig();
  // }, []);

  return (
    <ConfigContext.Provider
      value={{
        config,
        loading,
        error,
        updateConfig,
        fetchConfig,
        resetConfig,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within ConfigProvider");
  }
  return context;
};
