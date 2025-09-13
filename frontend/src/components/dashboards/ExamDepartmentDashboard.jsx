import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import { api } from '../../api/api';
import StudentTable from '../StudentTable';
import ExamDataUpload from '../ExamDataUpload';
import StudentDetailsModal from '../StudentDetailsModal';
import ModalUserMenu from '../ModalUserMenu';
import {
  Upload,
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Download,
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
  Activity
} from 'lucide-react';

const ExamDepartmentDashboard = () => {
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
      console.log('Fetching students directly...');
      const response = await api.getStudents();
      console.log('Direct fetch response:', response);
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

  // Debug: Log students data
  console.log('ExamDepartmentDashboard - students:', students);
  console.log('ExamDepartmentDashboard - localStudents:', localStudents);
  console.log('ExamDepartmentDashboard - displayStudents:', displayStudents);
  console.log('ExamDepartmentDashboard - filteredStudents:', filteredStudents);

  // Calculate statistics
  const stats = {
    total: displayStudents?.length || 0,
    high: displayStudents?.filter(s => s.risk_level === 'high').length || 0,
    medium: displayStudents?.filter(s => s.risk_level === 'medium').length || 0,
    low: displayStudents?.filter(s => s.risk_level === 'low').length || 0,
    uploaded: displayStudents?.filter(s => s.examData?.length > 0).length || 0,
    // Data completion status
    examComplete: displayStudents?.filter(s => s.data_completion?.exam_department).length || 0,
    facultyComplete: displayStudents?.filter(s => s.data_completion?.faculty).length || 0,
    guardianComplete: displayStudents?.filter(s => s.data_completion?.local_guardian).length || 0,
    allComplete: students?.filter(s => s.data_complete).length || 0
  };

  if (displayLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">Loading exam data...</p>
          <p className="mt-2 text-sm text-gray-500">Preparing student performance insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white via-green-50 to-emerald-50 backdrop-blur-sm shadow-lg border-b border-green-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="animate-fade-in">
              <Link to="/" className="group">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:from-green-700 group-hover:to-emerald-700 transition-all duration-300">
                      Exam Department Dashboard
                    </h1>
                    <p className="text-gray-700 mt-1">
                      Welcome back, <span className="font-semibold text-gray-900">{user.username}</span>
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4 animate-fade-in-up">
              <button
                onClick={handleRefresh}
                className="group flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white hover:bg-gray-100 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 border border-gray-200 shadow-md hover:shadow-lg"
              >
                <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <div className="flex items-center space-x-3 bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-white/50">
                  <span className="text-white font-bold text-sm">{user.username?.charAt(0)?.toUpperCase() || 'E'}</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

          <div className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors duration-200">
                    <AlertTriangle className="h-8 w-8 text-red-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-600">High Risk</p>
                  <p className="text-3xl font-bold text-red-700 group-hover:scale-105 transition-transform duration-200">
                    {stats.high}
                  </p>
                  <p className="text-xs text-red-500">Need attention</p>
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
                    <TrendingUp className="h-8 w-8 text-yellow-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">Medium Risk</p>
                  <p className="text-3xl font-bold text-yellow-700 group-hover:scale-105 transition-transform duration-200">
                    {stats.medium}
                  </p>
                  <p className="text-xs text-yellow-500">Monitor closely</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-200">
                    <CheckCircle className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Low Risk</p>
                  <p className="text-3xl font-bold text-green-700 group-hover:scale-105 transition-transform duration-200">
                    {stats.low}
                  </p>
                  <p className="text-xs text-green-500">Doing well</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                    <FileText className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">With Exam Data</p>
                  <p className="text-3xl font-bold text-purple-700 group-hover:scale-105 transition-transform duration-200">
                    {stats.uploaded}
                  </p>
                  <p className="text-xs text-purple-500">Uploaded</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Information */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Data Collection Workflow</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Step 1 (You):</strong> Upload student exam data - creates student records</p>
                <p><strong>Step 2 (Faculty):</strong> Add attendance data to existing students</p>
                <p><strong>Step 3 (Guardian):</strong> Add fees status to existing students</p>
                <p><strong>Step 4 (System):</strong> Calculate risk assessment automatically</p>
                <p><strong>Step 5 (Faculty/Counselor/Guardian):</strong> View final risk assessments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Completion Status */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-8 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Activity className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4">Data Collection Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Exam Department</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">{stats.examComplete}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Faculty</span>
                    {stats.facultyComplete === stats.total ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{stats.facultyComplete}</div>
                  <div className="text-xs text-gray-500">
                    {stats.facultyComplete === stats.total ? 'All Complete' : `${stats.total - stats.facultyComplete} Pending`}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Local Guardian</span>
                    {stats.guardianComplete === stats.total ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{stats.guardianComplete}</div>
                  <div className="text-xs text-gray-500">
                    {stats.guardianComplete === stats.total ? 'All Complete' : `${stats.total - stats.guardianComplete} Pending`}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Risk Assessment</span>
                    {stats.allComplete === stats.total ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">{stats.allComplete}</div>
                  <div className="text-xs text-gray-500">
                    {stats.allComplete === stats.total ? 'All Calculated' : `${stats.total - stats.allComplete} Pending`}
                  </div>
                </div>
              </div>
              
              {stats.allComplete < stats.total && (
                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Risk assessment will be calculated automatically once all departments provide their data.
                    Currently waiting for {stats.total - stats.allComplete} student(s) to have complete data.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upload Section */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <div className="p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Upload Exam Data
                  </h3>
                  <p className="text-gray-600">Create student records with exam results</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Required Excel Format:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Student ID (required)</li>
                    <li>• Student Name (required)</li>
                    <li>• Subject grades (Math, Science, English, etc.)</li>
                    <li>• Exam type (Unit Test, Mid-term, Final, etc.)</li>
                  </ul>
                </div>
                
                <button
                  onClick={() => setShowUpload(true)}
                  className="w-full group relative inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-lg font-bold rounded-xl shadow-2xl transform active:scale-95 transition-all duration-200 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-active:opacity-100 transition-opacity duration-200"></div>
                  <div className="relative flex items-center space-x-3">
                    <Upload className="w-6 h-6" />
                    <span>Upload Exam Data</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <div className="p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Performance Overview
                  </h3>
                  <p className="text-gray-600">Current academic status</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-red-700 font-medium">High Risk Students</span>
                  <span className="text-2xl font-bold text-red-600">{stats.high}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-700 font-medium">Medium Risk Students</span>
                  <span className="text-2xl font-bold text-yellow-600">{stats.medium}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-medium">Low Risk Students</span>
                  <span className="text-2xl font-bold text-green-600">{stats.low}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 animate-fade-in-up" style={{animationDelay: '0.7s'}}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search students by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
              <button
                onClick={handleRefresh}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Student Academic Performance
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{filteredStudents.length} students</span>
              </div>
            </div>
            
            {error ? (
              <div className="text-center py-12">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg inline-block">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-red-600 font-medium">Error loading students</p>
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg inline-block">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">No students found</p>
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? 'Try adjusting your search terms' : 'Upload exam data to get started'}
                  </p>
                </div>
              </div>
            ) : (
              <StudentTable 
                students={filteredStudents} 
                onStudentSelect={handleStudentSelect}
                showActions={false}
                filterByGrades={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-custom flex items-center justify-center z-50 p-4" style={{ zIndex: 999999 }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <ExamDataUpload 
                onClose={() => setShowUpload(false)} 
                onUploadSuccess={() => {
                  // Refresh the data after successful upload
                  fetchStudentsDirect();
                  refreshData();
                }}
              />
            </div>
          </div>
        </div>
      )}

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

export default ExamDepartmentDashboard;
