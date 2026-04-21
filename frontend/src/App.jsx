import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleDashboard from "./components/RoleDashboard";
import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";
import { StudentProvider } from "./context/StudentContext";
import Home from "./views/Home";
import Login from "./views/Login";
import Settings from "./views/Settings";
import Signup from "./views/Signup";

const SETTINGS_ALLOWED_ROLES = [
  "counselor",
  "faculty",
  "exam-department",
  "local-guardian",
];

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <Router>
          <StudentProvider>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <RoleDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute allowedRoles={SETTINGS_ALLOWED_ROLES}>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/unauthorized"
                  element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                          Unauthorized Access
                        </h1>
                        <p className="text-gray-600">
                          You don't have permission to access this page.
                        </p>
                      </div>
                    </div>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </StudentProvider>
        </Router>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
