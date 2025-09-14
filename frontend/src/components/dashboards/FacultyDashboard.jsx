import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import { api } from '../../api/api';
import StudentTable from '../StudentTable';
import StudentDataUpload from '../StudentDataUpload';
import StudentDetailsModal from '../StudentDetailsModal';
import DeleteDataModal from '../DeleteDataModal';
import EmailAlerts from '../EmailAlerts';
import Navbar from '../Navbar';
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
  preparePieChartData,
  prepareAttendanceData,
} from "../../utils/chartData";
import {
  Mail,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Eye,
  Filter,
  Search,
  Calendar,
  Award,
  BookOpen,
  Target,
  Zap,
  Shield,
  ArrowRight,
  Settings,
  Bell,
  Activity,
  X,
  UserCheck,
  Clock,
  FileText,
  Trash2
} from 'lucide-react';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const { state, actions } = useStudents();
  const { students, loading, error, summary } = state;
  const { refreshData } = actions;
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showStudentDataUpload, setShowStudentDataUpload] = useState(false);
  const [showEmailAlerts, setShowEmailAlerts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalStudent, setDeleteModalStudent] = useState(null);
  const [localStudents, setLocalStudents] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const hasMountedRef = useRef(false);

  // Chart data preparation will be done after data loading

  // Direct data fetching function
  const fetchStudentsDirect = useCallback(async () => {
    if (!user) return;
    
    try {
      setLocalLoading(true);
      const response = await api.getStudents();
      setLocalStudents(response.data.students || []);
    } catch (error) {
      console.error('Direct fetch error:', error);
    } finally {
      setLocalLoading(false);
    }
  }, [user]);

  // Fetch data when component mounts (only once)
  useEffect(() => {
    if (user && !hasMountedRef.current) {
      hasMountedRef.current = true;
      fetchStudentsDirect();
    }
  }, [user, fetchStudentsDirect]);

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
  };

  const handleRefresh = async () => {
    await fetchStudentsDirect();
    await refreshData();
  };

  const handleDeleteAllAttendanceData = async () => {
    if (!confirm('Are you sure you want to delete ALL attendance data for ALL students? This action cannot be undone.')) {
      return;
    }

    try {
      // Get all students first
      const allStudents = localStudents.length > 0 ? localStudents : (students || []);
      
      if (allStudents.length === 0) {
        alert('No students found to delete data from.');
        return;
      }

      // Delete attendance data for each student
      const deletePromises = allStudents.map(student => 
        api.deleteAttendanceData(student.student_id)
      );

      await Promise.all(deletePromises);
      
      alert(`Successfully deleted attendance data for ${allStudents.length} students.`);
      
      // Refresh the data
      await fetchStudentsDirect();
      await refreshData();
    } catch (error) {
      console.error('Error deleting all attendance data:', error);
      alert('Error occurred while deleting attendance data. Please try again.');
    }
  };

  // Handle individual student delete modal
  const handleDeleteStudentAttendanceData = (student) => {
    setDeleteModalStudent(student);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalStudent) return;
    
    try {
      await api.deleteAttendanceData(deleteModalStudent.student_id);
      setShowDeleteModal(false);
      setDeleteModalStudent(null);
      await fetchStudentsDirect();
      await refreshData();
    } catch (error) {
      console.error('Error deleting attendance data:', error);
      alert('Error occurred while deleting attendance data. Please try again.');
    }
  };

  const onUploadSuccess = () => {
    console.log('🔄 Faculty upload success - refreshing data...');
    fetchStudentsDirect();
    refreshData();
    console.log('✅ Faculty upload data refresh completed');
  };


  const handleShowEmailAlerts = () => {
    setShowEmailAlerts(true);
  };

  const handleCloseEmailAlerts = () => {
    setShowEmailAlerts(false);
  };

  const handleShowStudentDataUpload = () => {
    setShowStudentDataUpload(true);
  };

  const handleCloseStudentDataUpload = () => {
    console.log('Closing StudentDataUpload modal');
    setShowStudentDataUpload(false);
  };

  // Use local students as fallback if context students is undefined
  const displayStudents = students || localStudents;
  const displayLoading = loading || localLoading;

  // Chart data preparation
  const safeSummary = summary || { total: 0, high: 0, medium: 0, low: 0 };
  const pieData = preparePieChartData(safeSummary);
  const attendanceData = prepareAttendanceData(displayStudents || []);

  // Filter students based on search and risk level
  const filteredStudents = displayStudents?.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' || student.risk_level === filterRisk;
    return matchesSearch && matchesRisk;
  }) || [];

  // Calculate statistics
  const stats = {
    total: displayStudents?.length || 0,
    high: displayStudents?.filter(s => s.risk_level === 'high').length || 0,
    medium: displayStudents?.filter(s => s.risk_level === 'medium').length || 0,
    low: displayStudents?.filter(s => s.risk_level === 'low').length || 0,
    withAttendance: displayStudents?.filter(s => s.attendance_rate !== undefined).length || 0,
    pendingAttendance: displayStudents?.filter(s => s.attendance_rate === undefined).length || 0,
    avgAttendance: displayStudents?.filter(s => s.attendance_rate !== undefined)
      .reduce((sum, s) => sum + (s.attendance_rate || 0), 0) / 
      (displayStudents?.filter(s => s.attendance_rate !== undefined).length || 1) || 0
  };

  if (displayLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading Faculty Dashboard...</p>
          <p className="text-gray-500 mt-2">Please wait while we fetch student data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Modern Navbar */}
      <Navbar
        title="Faculty Dashboard"
        subtitle={`Welcome back, ${user.username}`}
        icon={UserCheck}
        onRefresh={handleRefresh}
        isLoading={displayLoading}
        additionalActions={
          <div className="flex space-x-3">
            {user?.role === 'faculty' && (
              <button
                onClick={handleShowEmailAlerts}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Email Alerts</span>
              </button>
            )}
            <button
              onClick={handleShowStudentDataUpload}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Student Data</span>
            </button>
          </div>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                    <Users className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Total Students</p>
                  <p className="text-3xl font-bold text-blue-700 group-hover:scale-105 transition-transform duration-200">
                    {stats.total}
                  </p>
                  <p className="text-xs text-blue-500">In system</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-200">
                    <UserCheck className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">With Attendance</p>
                  <p className="text-3xl font-bold text-green-700 group-hover:scale-105 transition-transform duration-200">
                    {stats.withAttendance}
                  </p>
                  <p className="text-xs text-green-500">Updated</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors duration-200">
                    <Clock className="h-8 w-8 text-yellow-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-700 group-hover:scale-105 transition-transform duration-200">
                    {stats.pendingAttendance}
                  </p>
                  <p className="text-xs text-yellow-500">Need attendance</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                    <BarChart3 className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">Avg Attendance</p>
                  <p className="text-3xl font-bold text-purple-700 group-hover:scale-105 transition-transform duration-200">
                    {Math.round(stats.avgAttendance)}%
                  </p>
                  <p className="text-xs text-purple-500">Overall</p>
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
                {pieData && pieData.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No risk assessment data available</p>
                      <p className="text-gray-400 text-xs">Complete risk assessment to see the chart</p>
                    </div>
                  </div>
                )}
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
                {attendanceData && attendanceData.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No attendance data available</p>
                      <p className="text-gray-400 text-xs">Upload attendance data to see the chart</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Information */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Faculty Workflow</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Step 1:</strong> Exam Department uploads student exam data (creates student records)</p>
                <p><strong>Step 2 (You):</strong> Upload attendance data for existing students</p>
                <p><strong>Step 3:</strong> Local Guardian adds fees status to existing students</p>
                <p><strong>Step 4:</strong> Risk assessment is calculated after all departments provide data</p>
              </div>
            </div>
          </div>
        </div>



        {/* Search and Filter */}
        <div className="mb-6 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search students by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="low">Low Risk</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="animate-fade-in-up" style={{animationDelay: '0.7s'}}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Student Attendance Overview</h2>
                    <p className="text-sm text-gray-600">Showing {filteredStudents.length} students</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {stats.withAttendance} with attendance
                  </div>
                  <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {stats.pendingAttendance} pending
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {error ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Students</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
                  <p className="text-gray-600">No students match your current search criteria.</p>
                </div>
              ) : (
                <StudentTable 
                  students={filteredStudents} 
                  onStudentSelect={handleStudentSelect}
                  showActions={true}
                  filterByAttendance={true}
                  onDeleteClick={handleDeleteStudentAttendanceData}
                />
              )}
            </div>
          </div>
        </div>

        {/* Delete All Attendance Data Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => handleDeleteAllAttendanceData()}
            className="group relative inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            <span>Delete All Attendance Data</span>
          </button>
        </div>
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


      {showStudentDataUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Upload Student Data with Emails</h2>
              <button
                onClick={handleCloseStudentDataUpload}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <StudentDataUpload
                onUploadSuccess={() => {
                  console.log('StudentDataUpload success callback received');
                  handleRefresh();
                  handleCloseStudentDataUpload();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Data Modal */}
      {showDeleteModal && deleteModalStudent && (
        <DeleteDataModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteModalStudent(null);
          }}
          onConfirm={handleDeleteConfirm}
          student={deleteModalStudent}
          dataType="attendance"
          role="faculty"
        />
      )}

      {/* Email Alerts Modal */}
      {showEmailAlerts && user?.role === 'faculty' && (
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
    </div>
  );
};

export default FacultyDashboard;
