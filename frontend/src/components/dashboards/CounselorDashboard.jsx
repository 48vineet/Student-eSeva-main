import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import StudentTable from '../StudentTable';
import FileUpload from '../FileUpload';
import StudentDetailsModal from '../StudentDetailsModal';
import DeleteDataModal from '../DeleteDataModal';
import ActionManagement from '../ActionManagement';
import EmailAlerts from '../EmailAlerts';
import Navbar from '../Navbar';
import { api } from '../../api/api';
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
import { X, Trash2, AlertTriangle } from 'lucide-react';
import {
  preparePieChartData,
  prepareAttendanceData,
} from "../../utils/chartData";

const CounselorDashboard = () => {
  const { user } = useAuth();
  const { state, actions } = useStudents();
  const { students, loading, error, summary } = state;
  const { fetchStudents } = actions;
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showEmailAlerts, setShowEmailAlerts] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalStudent, setDeleteModalStudent] = useState(null);

  // Chart data preparation
  const safeSummary = summary || { total: 0, high: 0, medium: 0, low: 0 };
  const pieData = preparePieChartData(safeSummary);
  const attendanceData = prepareAttendanceData(students || []);

  // Fetch students data when component mounts
  useEffect(() => {
    if (user && user.role === 'counselor') {
      fetchStudents();
    }
  }, [user, fetchStudents]);

  // Debug: Log students data
  useEffect(() => {
    console.log('CounselorDashboard - students:', students);
    console.log('CounselorDashboard - loading:', loading);
    console.log('CounselorDashboard - error:', error);
  }, [students, loading, error]);

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
  };

  const handleShowActions = () => {
    setShowActions(true);
  };

  const handleCloseActions = () => {
    setShowActions(false);
  };

  const handleShowUpload = () => {
    setShowUpload(true);
  };

  const handleCloseUpload = () => {
    setShowUpload(false);
  };

  const handleUploadSuccess = () => {
    console.log('🔄 Upload success - refreshing all data...');
    setShowUpload(false);
    // Refresh both students and summary data
    actions.refreshData();
    console.log('✅ Upload data refresh completed');
  };

  const handleCleanupDuplicates = async () => {
    if (!confirm('Are you sure you want to clean up duplicate students? This will remove duplicate records and keep the most recent ones.')) {
      return;
    }

    try {
      const response = await api.cleanupDuplicateStudents();
      alert(`Successfully cleaned up ${response.deletedCount} duplicate student records.`);
      fetchStudents(); // Refresh the data
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      alert('Error occurred while cleaning up duplicates. Please try again.');
    }
  };

  const handleShowEmailAlerts = () => {
    setShowEmailAlerts(true);
  };

  const handleCloseEmailAlerts = () => {
    setShowEmailAlerts(false);
  };

  // Handle student record deletion
  const handleDeleteStudentRecord = (student) => {
    setDeleteModalStudent(student);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalStudent) return;
    
    try {
      console.log('🗑️ Deleting student record:', deleteModalStudent.student_id);
      // Use context delete function which automatically refreshes data
      await actions.deleteStudent(deleteModalStudent.student_id);
      setShowDeleteModal(false);
      setDeleteModalStudent(null);
      console.log('✅ Student deleted and data refreshed');
    } catch (error) {
      console.error('Error deleting student record:', error);
      alert('Error occurred while deleting student record. Please try again.');
    }
  };

  // Handle delete all students
  const handleDeleteAllStudents = async () => {
    // First confirmation
    if (!confirm('⚠️ CRITICAL WARNING: Are you absolutely sure you want to delete ALL student records? This will permanently remove every student from the database and cannot be undone!')) {
      return;
    }
    
    // Second confirmation with specific text requirement
    const confirmationText = prompt('🚨 FINAL CONFIRMATION: This will delete ALL student data permanently.\n\nType "DELETE ALL STUDENTS" exactly as shown to confirm:');
    if (confirmationText !== "DELETE ALL STUDENTS") {
      alert('Confirmation text did not match. Operation cancelled.');
      return;
    }
    
    try {
      console.log('🗑️ Deleting ALL student records...');
      // Use context delete function which automatically refreshes data
      const result = await actions.deleteAllStudents();
      alert(`✅ Successfully deleted all student records from the database.`);
      console.log('✅ All students deleted and data refreshed');
    } catch (error) {
      console.error('Error deleting all student records:', error);
      alert('❌ Error occurred while deleting all student records. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Navbar */}
      <Navbar
        title="Counselor Dashboard"
        subtitle={`Welcome back, ${user.username}`}
        onRefresh={() => window.location.reload()}
        isLoading={loading}
        additionalActions={
          <div className="flex space-x-3">
            {user?.role === 'counselor' && (
              <button
                onClick={handleShowEmailAlerts}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span>Email Alerts</span>
              </button>
            )}
            <button
              onClick={handleShowActions}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span>Manage Actions</span>
            </button>
          </div>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors duration-200">
                      <svg className="h-8 w-8 text-red-600 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-red-600">High Priority</p>
                    <p className="text-3xl font-bold text-red-700 group-hover:scale-105 transition-transform duration-200">
                      {safeSummary.high}
                    </p>
                    <p className="text-xs text-red-500">Need immediate attention</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors duration-200">
                      <svg className="h-8 w-8 text-yellow-600 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-yellow-600">Watch Closely</p>
                    <p className="text-3xl font-bold text-yellow-700 group-hover:scale-105 transition-transform duration-200">
                      {safeSummary.medium}
                    </p>
                    <p className="text-xs text-yellow-500">Monitor and support</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-200">
                      <svg className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">Doing Well</p>
                    <p className="text-3xl font-bold text-green-700 group-hover:scale-105 transition-transform duration-200">
                      {safeSummary.low}
                    </p>
                    <p className="text-xs text-green-500">Continue support</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                      <svg className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Total Students</p>
                    <p className="text-3xl font-bold text-blue-700 group-hover:scale-105 transition-transform duration-200">
                      {safeSummary.total}
                    </p>
                    <p className="text-xs text-blue-500">In the system</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
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

            <div className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
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

          {/* File Upload Section */}
          <div className="mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Upload Student Data</h2>
                <button
                  onClick={handleShowUpload}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                >
                  Upload File
                </button>
              </div>
              <p className="text-gray-600 text-sm">
                Upload Excel or CSV files containing student data to update the system.
              </p>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Student Risk Assessment</h2>
              {error ? (
                <div className="text-red-600 text-center py-4">
                  Error loading students: {error}
                </div>
              ) : (
                <StudentTable 
                  students={students} 
                  onStudentSelect={handleStudentSelect}
                  showActions={true}
                  onDeleteClick={handleDeleteStudentRecord}
                />
              )}
            </div>
          </div>
        </div>

        {/* Delete All Students Section */}
        {students && students.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 border-2 border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete All Students</h3>
                  <p className="text-sm text-gray-600">Permanently remove all student records from the database</p>
                </div>
              </div>
              <button
                onClick={handleDeleteAllStudents}
                className="group relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white text-lg font-bold rounded-xl shadow-2xl transform active:scale-95 transition-all duration-200 overflow-hidden hover:shadow-3xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-active:opacity-100 transition-opacity duration-200"></div>
                <div className="relative flex items-center space-x-3">
                  <Trash2 className="w-6 h-6" />
                  <span>Delete All Students</span>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </button>
              
              <button
                onClick={handleCleanupDuplicates}
                className="group relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white text-lg font-bold rounded-xl shadow-2xl transform active:scale-95 transition-all duration-200 overflow-hidden hover:shadow-3xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-active:opacity-100 transition-opacity duration-200"></div>
                <div className="relative flex items-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Cleanup Duplicates</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showModal && selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          isOpen={showModal}
          onClose={handleCloseModal}
          showActions={true}
        />
      )}

      {/* Action Management Modal */}
      {showActions && (
        <ActionManagement
          onClose={handleCloseActions}
        />
      )}

      {/* File Upload Modal */}
      {showUpload && (
        <FileUpload onClose={handleCloseUpload} onSuccess={handleUploadSuccess} />
      )}

      {/* Email Alerts Modal */}
      {showEmailAlerts && user?.role === 'counselor' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Email Alerts</h2>
              <button
                onClick={handleCloseEmailAlerts}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <EmailAlerts />
          </div>
        </div>
      )}

      {/* Delete Student Record Modal */}
      {showDeleteModal && deleteModalStudent && (
        <DeleteDataModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteModalStudent(null);
          }}
          onConfirm={handleDeleteConfirm}
          student={deleteModalStudent}
          dataType="student-record"
          role="counselor"
        />
      )}
    </div>
  );
};

export default CounselorDashboard;
