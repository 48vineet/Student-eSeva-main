import React, { useState } from "react";
import { useStudents } from "../context/StudentContext";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  Users,
  TrendingUp,
  Bell,
  Upload,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  ArrowRight,
} from "lucide-react";
import FileUpload from "./FileUpload";
import StudentTable from "./StudentTable";
import {
  preparePieChartData,
  prepareAttendanceData,
} from "../utils/chartData";
import { useNotification } from "../hooks/useNotification";

const Dashboard = () => {
  const { state, actions } = useStudents();
  const { students, summary, loading } = state;
  
  // Ensure summary has default values to prevent undefined errors
  const safeSummary = summary || { total: 0, high: 0, medium: 0, low: 0 };
  const [showUpload, setShowUpload] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const { notifications, showSuccess, showError, removeNotification } = useNotification();

  const handleSendNotifications = async () => {
    setSendingNotifications(true);
    try {
      const result = await actions.sendNotifications();
      showSuccess(`Notifications sent to ${result.sent} recipients (${result.successful} successful, ${result.failed} failed) in ${result.duration}`);
    } catch (error) {
      showError("Failed to send notifications");
    } finally {
      setSendingNotifications(false);
    }
  };

  const refreshData = async () => {
    // Small delay to ensure backend processing is complete
    await new Promise(resolve => setTimeout(resolve, 500));
    actions.fetchStudents();
    actions.fetchSummary();
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  // Chart data preparation
  const pieData = preparePieChartData(safeSummary);
  const attendanceData = prepareAttendanceData(students);

  if (loading && (!students || !Array.isArray(students) || students.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">Loading dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Preparing your student insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="animate-fade-in">
              <h1 
                onClick={handleBackToHome}
                className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
              >
                Student Early Warning Dashboard
              </h1>
              <p className="mt-1 text-gray-600">
                Monitor and support at-risk students proactively
              </p>
            </div>
            <div className="flex space-x-4 animate-fade-in-up">
              <button
                onClick={() => setShowUpload(true)}
                className="group relative inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 transform active:scale-95 transition-all duration-200 shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-active:opacity-100 transition-opacity duration-200"></div>
                <div className="relative flex items-center space-x-3">
                  <div className="p-1 bg-white/20 rounded-lg">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span>Upload Data</span>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                </div>
              </button>
              <button
                onClick={handleSendNotifications}
                disabled={sendingNotifications}
                className={`group relative inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-2xl text-white focus:outline-none focus:ring-4 focus:ring-offset-2 transform transition-all duration-200 shadow-2xl overflow-hidden ${
                  sendingNotifications 
                    ? 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 focus:ring-orange-500 active:scale-95 hover:shadow-2xl'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-active:opacity-100 transition-opacity duration-200"></div>
                <div className="relative flex items-center space-x-3">
                  <div className="p-1 bg-white/20 rounded-lg">
                    {sendingNotifications ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Bell className="w-6 h-6" />
                    )}
                  </div>
                  <span>{sendingNotifications ? 'Sending...' : 'Send Alerts'}</span>
                  {!sendingNotifications && (
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors duration-200">
                    <AlertTriangle className="h-8 w-8 text-red-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-600">
                    High Priority
                  </p>
                  <p className="text-3xl font-bold text-red-700 group-hover:scale-105 transition-transform duration-200">
                    {safeSummary.high}
                  </p>
                  <p className="text-xs text-red-500">
                    Need immediate attention
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors duration-200">
                    <TrendingUp className="h-8 w-8 text-yellow-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">
                    Watch Closely
                  </p>
                  <p className="text-3xl font-bold text-yellow-700 group-hover:scale-105 transition-transform duration-200">
                    {safeSummary.medium}
                  </p>
                  <p className="text-xs text-yellow-500">Monitor and support</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-200">
                    <Users className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">
                    Doing Well
                  </p>
                  <p className="text-3xl font-bold text-green-700 group-hover:scale-105 transition-transform duration-200">
                    {safeSummary.low}
                  </p>
                  <p className="text-xs text-green-500">Continue support</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                    <Users className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">
                    Total Students
                  </p>
                  <p className="text-3xl font-bold text-blue-700 group-hover:scale-105 transition-transform duration-200">
                    {safeSummary.total}
                  </p>
                  <p className="text-xs text-blue-500">In the system</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Call-to-Action Section */}
        {(!students || students.length === 0) && (
          <div className="mb-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-3xl p-8 animate-fade-in-up">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl">
                  <Upload className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  Get Started with Student Data
                </h3>
                <p className="text-xl text-gray-600 mb-6">
                  Upload your student data to begin monitoring and supporting at-risk students
                </p>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-lg font-bold rounded-2xl shadow-2xl transform active:scale-95 transition-all duration-200"
              >
                <Upload className="w-6 h-6" />
                <span>Upload Your First File</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* How It Works Info */}
        <div className="card mb-8 bg-blue-50 border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-blue-800">
                How the system works:
              </p>
              <div className="mt-2 text-sm text-blue-700 space-y-1">
                <p>
                  🚨 <strong>HIGH RISK:</strong> Attendance below 75% OR 2+
                  subjects failing OR fees overdue 30+ days
                </p>
                <p>
                  ⚠️ <strong>MEDIUM RISK:</strong> Attendance 75-85% OR 1
                  subject failing OR grades declining
                </p>
                <p>
                  ✅ <strong>LOW RISK:</strong> Attendance above 85% AND passing
                  all subjects AND fees current
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Risk Distribution
                </h3>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      animationBegin={0}
                      animationDuration={1000}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Attendance Distribution
                </h3>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="range" 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#6b7280' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#colorGradient)"
                      radius={[4, 4, 0, 0]}
                      animationBegin={0}
                      animationDuration={1000}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Students Overview
              </h3>
              <button
                onClick={refreshData}
                className="group flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
              >
                <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>
            <StudentTable students={students || []} />
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      {showUpload && (
        <FileUpload
          onClose={() => setShowUpload(false)}
          onSuccess={(result) => {
            setShowUpload(false);
            showSuccess(
              `Successfully uploaded ${result.students ? result.students.length : 0} students`
            );
            refreshData();
          }}
        />
      )}

      {/* Loading Overlay for Email Sending */}
      {sendingNotifications && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4 animate-modal-in">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 mb-4">
                <RefreshCw className="h-16 w-16 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sending Notifications
              </h3>
              <p className="text-gray-600 mb-4">
                Please wait while we send emails to students and parents...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`group px-6 py-4 rounded-xl shadow-lg backdrop-blur-sm border text-white transform transition-all duration-300 animate-slide-in-right hover:scale-105 ${
              notification.type === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 border-green-400"
                : notification.type === "error"
                ? "bg-gradient-to-r from-red-500 to-rose-600 border-red-400"
                : notification.type === "warning"
                ? "bg-gradient-to-r from-yellow-500 to-orange-600 border-yellow-400"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-400"
            }`}
            style={{animationDelay: `${index * 0.1}s`}}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {notification.type === "success" && <CheckCircle className="w-5 h-5" />}
                {notification.type === "error" && <XCircle className="w-5 h-5" />}
                {notification.type === "warning" && <AlertCircle className="w-5 h-5" />}
                {!notification.type && <Bell className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
