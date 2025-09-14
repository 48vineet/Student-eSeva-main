import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import { api } from '../../api/api';
import { RefreshCw, Upload, FileText, Users, DollarSign, AlertTriangle, CheckCircle, Clock, Trash2, ArrowRight } from 'lucide-react';
import Navbar from '../Navbar';
import FeesUpload from '../FeesUpload';

const GuardianDashboard = () => {
  const { user } = useAuth();
  const { state, actions } = useStudents();
  const { students, loading, error } = state;
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFees, setFilterFees] = useState('all');
  const [localStudents, setLocalStudents] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  // Direct data fetching fallback
  const fetchStudentsDirect = useCallback(async () => {
    if (localLoading) return;
    
    setLocalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/students', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLocalStudents(data.students || []);
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLocalLoading(false);
    }
  }, [localLoading]);

  // Use context data if available, otherwise use local data
  const displayStudents = students && students.length > 0 ? students : localStudents;
  const displayLoading = loading || localLoading;

  // Fetch data if not available
  useEffect(() => {
    if (!hasFetchedRef.current && (!students || students.length === 0)) {
      fetchStudentsDirect();
      hasFetchedRef.current = true;
    }
  }, [students, fetchStudentsDirect]);

  // Calculate stats
  const stats = {
    total: displayStudents.length,
    withFees: displayStudents.filter(s => s.fees_status && s.fees_status !== 'pending').length,
    pendingFees: displayStudents.filter(s => !s.fees_status || s.fees_status === 'pending').length,
    complete: displayStudents.filter(s => s.fees_status === 'Complete').length,
    partial: displayStudents.filter(s => s.fees_status === 'Partial').length,
    due: displayStudents.filter(s => s.fees_status === 'Due').length,
    overdue: displayStudents.filter(s => s.fees_status === 'Overdue').length
  };

  // Filter students
  const filteredStudents = displayStudents.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFees = filterFees === 'all' || student.fees_status === filterFees || 
                       (filterFees === 'pending' && (!student.fees_status || student.fees_status === 'pending'));
    return matchesSearch && matchesFees;
  });

  const handleRefresh = useCallback(() => {
    if (actions?.refreshData) {
      actions.refreshData();
    } else {
      fetchStudentsDirect();
    }
  }, [actions, fetchStudentsDirect]);

  const handleDeleteAllFeesData = async () => {
    if (!confirm('Are you sure you want to delete ALL fees data for ALL students? This action cannot be undone.')) {
      return;
    }

    try {
      // Get all students first
      const allStudents = localStudents.length > 0 ? localStudents : (students || []);
      
      if (allStudents.length === 0) {
        alert('No students found to delete data from.');
        return;
      }

      // Delete fees data for each student
      const deletePromises = allStudents.map(student => 
        api.deleteFeesData(student.student_id)
      );

      await Promise.all(deletePromises);
      
      alert(`Successfully deleted fees data for ${allStudents.length} students.`);
      
      // Refresh the data
      handleRefresh();
    } catch (error) {
      console.error('Error deleting all fees data:', error);
      alert('Error occurred while deleting fees data. Please try again.');
    }
  };

  const handleUploadSuccess = () => {
    handleRefresh();
    setShowUpload(false);
  };

  const handleShowUpload = () => {
    setShowUpload(true);
  };

  const handleCloseUpload = () => {
    setShowUpload(false);
  };

  const getFeesStatusColor = (status) => {
    switch (status) {
      case 'Complete': return 'text-green-600 bg-green-100';
      case 'Partial': return 'text-yellow-600 bg-yellow-100';
      case 'Due': return 'text-blue-600 bg-blue-100';
      case 'Overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (displayLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h2>
          <p className="text-red-500">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100">
      {/* Modern Navbar */}
      <Navbar
        title="Local Guardian Dashboard"
        subtitle={`Welcome back, ${user.username}`}
        icon={DollarSign}
        onRefresh={handleRefresh}
        isLoading={displayLoading}
        additionalActions={
          <button
            onClick={handleShowUpload}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Fees</span>
          </button>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fees Complete</p>
                <p className="text-2xl font-bold text-gray-900">{stats.complete}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Fees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingFees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Information */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-6 h-6 text-green-600 mr-2" />
            Fees Management Workflow
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">1</div>
              <div>
                <p className="font-medium text-gray-900">Exam Department</p>
                <p className="text-sm text-gray-600">Uploads student data</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
              <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">2</div>
              <div>
                <p className="font-medium text-gray-900">Faculty</p>
                <p className="text-sm text-gray-600">Uploads attendance data</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">3</div>
              <div>
                <p className="font-medium text-gray-900">You (Local Guardian)</p>
                <p className="text-sm text-gray-600">Uploads fees status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Upload className="w-6 h-6 text-green-600 mr-2" />
              Fees Status Upload
            </h2>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{showUpload ? 'Hide Upload' : 'Upload Fees Data'}</span>
            </button>
          </div>
          
          {showUpload && (
            <div className="border-t border-gray-200 pt-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Upload Instructions:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Upload CSV or Excel files with fees status data</li>
                  <li>• Required columns: Student ID, Student Name, Fees Status, Amount Paid, Amount Due, Due Date</li>
                  <li>• Fees Status values: Complete, Partial, Due, Overdue</li>
                  <li>• Sample files are available in the backend directory</li>
                </ul>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setShowUpload(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Upload Fees Data</span>
                </button>
              </div>
            </div>
          )}
        </div>


        {/* Search and Filter */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by student name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={filterFees}
                onChange={(e) => setFilterFees(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Fees Status</option>
                <option value="Complete">Complete</option>
                <option value="Partial">Partial</option>
                <option value="Due">Due</option>
                <option value="Overdue">Overdue</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Student Fees Status ({filteredStudents.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fees Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{student.student_id || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFeesStatusColor(student.fees_status)}`}>
                        {student.fees_status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{student.amount_paid || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{student.amount_due || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.due_date || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                        student.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        student.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {student.risk_level || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete All Fees Data Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => handleDeleteAllFeesData()}
            className="group relative inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            <span>Delete All Fees Data</span>
          </button>
        </div>
      </div>

      {/* Fees Upload Modal */}
      {showUpload && (
        <FeesUpload
          onClose={() => setShowUpload(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};

export default GuardianDashboard;
