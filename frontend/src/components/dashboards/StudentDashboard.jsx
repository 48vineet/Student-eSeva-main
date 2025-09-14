import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import { api } from '../../api/api';
import StudentDetailsModal from '../StudentDetailsModal';
import ActionHistory from '../ActionHistory';
import Navbar from '../Navbar';
import {
  BookOpen,
  DollarSign,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Award,
  Calendar,
  FileText,
  Eye,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { state, actions } = useStudents();
  const { students, loading, error } = state;
  const { fetchStudents } = actions;
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState(null);

  // Fetch student's own data when component mounts
  useEffect(() => {
    const fetchStudentData = async () => {
      if (user && user.role === 'student' && user.student_id) {
        try {
          setStudentLoading(true);
          setStudentError(null);
          
          // Use the specific student endpoint
          const response = await api.getStudentById(user.student_id);
          setStudentData(response.student);
          
          console.log('StudentDashboard - fetched student data:', response.student);
        } catch (error) {
          console.error('StudentDashboard - error fetching student data:', error);
          setStudentError(error.message || 'Failed to fetch student data');
        } finally {
          setStudentLoading(false);
        }
      }
    };

    fetchStudentData();
  }, [user]);

  // Debug: Log data
  useEffect(() => {
    console.log('StudentDashboard - studentData:', studentData);
    console.log('StudentDashboard - studentLoading:', studentLoading);
    console.log('StudentDashboard - studentError:', studentError);
    console.log('StudentDashboard - user:', user);
  }, [studentData, studentLoading, studentError, user]);

  const handleViewDetails = () => {
    if (studentData) {
      setSelectedStudent(studentData);
      setShowModal(true);
    }
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

  if (studentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Your Data</h2>
          <p className="text-gray-600">Please wait while we fetch your academic information...</p>
        </div>
      </div>
    );
  }

  if (studentError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Data</h2>
          <p>{studentError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Data Not Found</h2>
          <p className="text-gray-600 mb-4">Your student record could not be found.</p>
          <p className="text-sm text-gray-500">Please contact your institution administrator.</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Navbar */}
      <Navbar
        title="Student Dashboard"
        subtitle={`Welcome back, ${user.username}`}
        onRefresh={() => window.location.reload()}
        isLoading={studentLoading}
        additionalActions={
          <button
            onClick={handleShowActions}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <span>View Actions</span>
          </button>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Student Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Risk Level Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors duration-200">
                      <AlertTriangle className="h-8 w-8 text-red-600 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-red-600">Risk Level</p>
                    <p className="text-2xl font-bold text-red-700 group-hover:scale-105 transition-transform duration-200 capitalize">
                      {studentData.risk_level}
                    </p>
                    <p className="text-xs text-red-500">Current Status</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                      <UserCheck className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Attendance</p>
                    <p className="text-2xl font-bold text-blue-700 group-hover:scale-105 transition-transform duration-200">
                      {studentData.attendance_rate}%
                    </p>
                    <p className="text-xs text-blue-500">Current Rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Score Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                      <Target className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-600">Risk Score</p>
                    <p className="text-2xl font-bold text-purple-700 group-hover:scale-105 transition-transform duration-200">
                      {studentData.risk_score}/100
                    </p>
                    <p className="text-xs text-purple-500">Assessment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fees Status Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-200">
                      <DollarSign className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">Fees Status</p>
                    <p className="text-lg font-bold text-green-700 group-hover:scale-105 transition-transform duration-200">
                      {studentData.fees_status || 'Current'}
                    </p>
                    <p className="text-xs text-green-500">Payment Status</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comprehensive Student Data Table */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FileText className="w-6 h-6 mr-3" />
                Your Complete Academic Profile
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Personal Information */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <UserCheck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Personal Info</div>
                          <div className="text-sm text-gray-500">Student ID: {studentData.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{studentData.name}</div>
                      <div className="text-sm text-gray-500">{studentData.email}</div>
                      <div className="text-sm text-gray-500">{studentData.major} - {studentData.class_year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                    </td>
                  </tr>

                  {/* Academic Performance */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                          <BookOpen className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Academic Performance</div>
                          <div className="text-sm text-gray-500">Subject-wise Grades</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {studentData.grades && studentData.grades.length > 0 ? (
                          studentData.grades.map((grade, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-900">{grade.subject}</span>
                              <span className={`text-sm font-medium px-2 py-1 rounded ${
                                grade.status === 'passing' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {grade.score}% ({grade.status})
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No grades available</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        studentData.grades && studentData.grades.some(g => g.status === 'failing') 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {studentData.grades && studentData.grades.some(g => g.status === 'failing') ? 'Needs Attention' : 'Good'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-indigo-600 hover:text-indigo-900">View Grades</button>
                    </td>
                  </tr>

                  {/* Attendance */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Attendance</div>
                          <div className="text-sm text-gray-500">Current Semester</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className={`h-2 rounded-full ${
                                studentData.attendance_rate >= 85 ? 'bg-green-500' :
                                studentData.attendance_rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${studentData.attendance_rate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{studentData.attendance_rate}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        studentData.attendance_rate >= 85 ? 'bg-green-100 text-green-800' :
                        studentData.attendance_rate >= 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {studentData.attendance_rate >= 85 ? 'Excellent' :
                         studentData.attendance_rate >= 75 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                    </td>
                  </tr>

                  {/* Fees Status */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Fees Status</div>
                          <div className="text-sm text-gray-500">Financial Information</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Status: {studentData.fees_status || 'Current'}</div>
                        <div className="text-sm text-gray-500">
                          Paid: ₹{studentData.amount_paid?.toLocaleString() || 0} | 
                          Due: ₹{studentData.amount_due?.toLocaleString() || 0}
                        </div>
                        {studentData.days_overdue > 0 && (
                          <div className="text-sm text-red-600">
                            Overdue: {studentData.days_overdue} days
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        studentData.fees_status === 'Complete' || studentData.amount_due === 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {studentData.fees_status === 'Complete' || studentData.amount_due === 0 ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                    </td>
                  </tr>

                  {/* Risk Assessment */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg mr-3">
                          <Target className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Risk Assessment</div>
                          <div className="text-sm text-gray-500">AI-Powered Analysis</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            studentData.risk_level === 'high' ? 'bg-red-500' :
                            studentData.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <span className="capitalize font-medium">{studentData.risk_level} Risk</span>
                          <span className="ml-2 text-gray-500">({studentData.risk_score}/100)</span>
                        </div>
                        {studentData.risk_factors && studentData.risk_factors.length > 0 && (
                          <div className="text-sm text-gray-500 mt-1">
                            Factors: {studentData.risk_factors.join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        studentData.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                        studentData.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {studentData.risk_level === 'high' ? 'High Priority' :
                         studentData.risk_level === 'medium' ? 'Monitor' : 'Low Risk'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-indigo-600 hover:text-indigo-900">View Analysis</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Recommendations */}
          {studentData.recommendations && studentData.recommendations.length > 0 && (
            <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
              <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Zap className="w-6 h-6 mr-3" />
                  Recommended Actions to Overcome Challenges
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {studentData.recommendations.map((rec, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className={`p-2 rounded-lg mr-3 ${
                              rec.urgency === 'immediate' ? 'bg-red-100' :
                              rec.urgency === 'high' ? 'bg-orange-100' :
                              rec.urgency === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                            }`}>
                              <Target className={`w-5 h-5 ${
                                rec.urgency === 'immediate' ? 'text-red-600' :
                                rec.urgency === 'high' ? 'text-orange-600' :
                                rec.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'
                              }`} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">{rec.action}</h3>
                            <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              rec.urgency === 'immediate' ? 'bg-red-100 text-red-800' :
                              rec.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                              rec.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {rec.urgency} priority
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{rec.description}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>Created: {new Date(rec.date).toLocaleDateString()}</span>
                            {rec.completed && (
                              <span className="ml-4 text-green-600 font-medium flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleViewDetails}
                className="group flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                <span>View Full Details</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              <button
                onClick={handleShowActions}
                className="group flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <FileText className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                <span>Action History</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              <button
                className="group flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <TrendingUp className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                <span>Progress Report</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
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

      {/* Action History Modal */}
      {showActions && studentData && (
        <ActionHistory
          student={studentData}
          onClose={handleCloseActions}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
