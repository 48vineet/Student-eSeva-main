import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { StudentProvider } from "./context/StudentContext";
import { ConfigProvider } from "./context/ConfigContext";
import Dashboard from "./components/Dashboard";
import Settings from "./views/Settings";
import Home from "./views/Home";

function App() {
  return (
    <StudentProvider>
      <ConfigProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </Router>
      </ConfigProvider>
    </StudentProvider>
  );
}

export default App;
