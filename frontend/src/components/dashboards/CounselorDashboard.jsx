import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import StudentTable from '../StudentTable';
import FileUpload from '../FileUpload';
import StudentDetailsModal from '../StudentDetailsModal';
import ActionManagement from '../ActionManagement';
import UserMenu from '../UserMenu';

const CounselorDashboard = () => {
  const { user } = useAuth();
  const { students, loading, error, fetchStudents } = useStudents();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // Data will be automatically fetched by StudentContext when user is authenticated

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
    setShowUpload(false);
    // Refresh students data
    fetchStudents();
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
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="group">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Counselor Dashboard</h1>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Welcome back, {user.username}</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleShowActions}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
              >
                Manage Actions
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
    </div>
  );
};

export default CounselorDashboard;
