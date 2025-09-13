import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import { api } from '../../api/api';
import StudentTable from '../StudentTable';
import AttendanceUpload from '../AttendanceUpload';
import StudentDetailsModal from '../StudentDetailsModal';
import ModalUserMenu from '../ModalUserMenu';
import {
  Upload,
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
  Plus,
  Settings,
  Bell,
  Activity,
  UserCheck,
  Clock,
  FileText
} from 'lucide-react';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const { students, loading, error, summary, actions } = useStudents();
  const { refreshData } = actions;
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [localStudents, setLocalStudents] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const hasMountedRef = useRef(false);

  // Direct data fetching function
  const fetchStudentsDirect = useCallback(async () => {
    if (!user) return;
    
    try {
      setLocalLoading(true);
      const response = await api.getStudents();
      setLocalStudents(response.students || []);
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

  const onUploadSuccess = () => {
    fetchStudentsDirect();
    refreshData();
  };

  // Use local students as fallback if context students is undefined
  const displayStudents = students || localStudents;
  const displayLoading = loading || localLoading;

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
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="group">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300">
                    Faculty Dashboard
                  </h1>
                  <p className="text-gray-700 mt-1">
                    Welcome back, <span className="font-semibold text-gray-900">{user.username}</span>
                  </p>
                  <p className="text-sm text-gray-500">Department: {user.department}</p>
                </div>
              </div>
            </Link>
            <div className="flex items-center space-x-4 animate-fade-in-up">
              <button
                onClick={handleRefresh}
                className="group flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white hover:bg-gray-100 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 border border-gray-200 shadow-md hover:shadow-lg"
              >
                <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${displayLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <div className="flex items-center space-x-3 bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-white/50">
                  <span className="text-white font-bold text-sm">{user.username?.charAt(0)?.toUpperCase() || 'F'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-black font-semibold text-sm">{user.username}</span>
                  <span className="text-gray-600 text-xs capitalize">{user.role?.replace('-', ' ')}</span>
                </div>
                <ModalUserMenu />
              </div>
            </div>
          </div>
        </div>
      </div>

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

        {/* Attendance Upload Section */}
        <div className="mb-8 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Upload Attendance Data</h2>
                  <p className="text-sm text-gray-600">Add attendance records for students</p>
                </div>
              </div>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>{showUpload ? 'Hide Upload' : 'Show Upload'}</span>
              </button>
            </div>
            
            {showUpload && (
              <div className="border-t border-gray-200 pt-6">
                <AttendanceUpload onUploadSuccess={onUploadSuccess} />
              </div>
            )}
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
                  showActions={false}
                  filterByAttendance={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      {showModal && selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={handleCloseModal}
          showActions={false}
        />
      )}
    </div>
  );
};

export default FacultyDashboard;
