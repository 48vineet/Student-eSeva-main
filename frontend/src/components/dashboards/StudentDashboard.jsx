import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import StudentDetailsModal from '../StudentDetailsModal';
import ActionHistory from '../ActionHistory';
import UserMenu from '../UserMenu';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { students, loading, error, fetchStudents } = useStudents();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Data will be automatically fetched by StudentContext when user is authenticated

  // Get the student's own data
  const studentData = students.find(s => s.student_id === user.student_id);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Data Not Found</h2>
          <p className="text-gray-600">Your student record could not be found.</p>
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
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="group">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Student Dashboard</h1>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Welcome back, {user.username}</p>
                <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">Student ID: {user.student_id}</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleShowActions}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
              >
                View Actions
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
              >
                Refresh Data
              </button>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Student Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Risk Level Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRiskColor(studentData.risk_level)}`}>
                      <span className="text-sm font-medium">
                        {studentData.risk_level?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Risk Level
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 capitalize">
                        {studentData.risk_level}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">%</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Attendance Rate
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {studentData.attendance_rate}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Score Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">#</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Risk Score
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {studentData.risk_score}/100
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex space-x-4">
              <button
                onClick={handleViewDetails}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                View Full Details
              </button>
              <button
                onClick={handleShowActions}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                View Action History
              </button>
            </div>
          </div>

          {/* Recent Recommendations */}
          {studentData.recommendations && studentData.recommendations.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Recommendations</h2>
              <div className="space-y-3">
                {studentData.recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="border-l-4 border-indigo-400 pl-4 py-2">
                    <p className="text-sm font-medium text-gray-900">{rec.action}</p>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rec.urgency === 'immediate' ? 'bg-red-100 text-red-800' :
                      rec.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                      rec.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rec.urgency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
