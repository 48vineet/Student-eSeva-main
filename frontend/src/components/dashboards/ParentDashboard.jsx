import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/api';
import Navbar from '../Navbar';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar, 
  MessageSquare, 
  Phone, 
  Mail, 
  FileText, 
  Eye, 
  ThumbsUp, 
  ThumbsDown,
  RefreshCw,
  TrendingUp,
  BookOpen,
  DollarSign,
  UserCheck
} from 'lucide-react';

const ParentDashboard = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === 'parent' && user.student_id) {
        try {
          setLoading(true);
          setError(null);
          
          // Fetch student data
          const studentResponse = await api.getStudentById(user.student_id);
          setStudentData(studentResponse.student);
          
          // Fetch actions for the student
          const actionsResponse = await api.getStudentActions(user.student_id);
          setActions(actionsResponse.actions || []);
          
        } catch (error) {
          console.error('ParentDashboard - error fetching data:', error);
          setError(error.message || 'Failed to fetch data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user]);

  const handleActionApproval = async (actionId, status, reason = '') => {
    try {
      setActionLoading(true);
      await api.updateAction(actionId, { status, reason });
      
      // Refresh actions
      const actionsResponse = await api.getStudentActions(user.student_id);
      setActions(actionsResponse.actions || []);
      
      setShowActionModal(false);
      setSelectedAction(null);
    } catch (error) {
      console.error('Error updating action:', error);
      setError(error.message || 'Failed to update action');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <ThumbsDown className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getActionTypeIcon = (type) => {
    switch (type) {
      case 'meeting': return <Calendar className="h-5 w-5" />;
      case 'counseling': return <MessageSquare className="h-5 w-5" />;
      case 'academic_support': return <BookOpen className="h-5 w-5" />;
      case 'attendance': return <UserCheck className="h-5 w-5" />;
      case 'fees': return <DollarSign className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          title="Parent Dashboard"
          subtitle="Loading your child's information..."
          onRefresh={() => window.location.reload()}
          isLoading={true}
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          title="Parent Dashboard"
          subtitle="Error loading data"
          onRefresh={() => window.location.reload()}
          isLoading={false}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          title="Parent Dashboard"
          subtitle="No student data found"
          onRefresh={() => window.location.reload()}
          isLoading={false}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No student data available</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingActions = actions.filter(action => action.status === 'pending');
  const approvedActions = actions.filter(action => action.status === 'approved');
  const rejectedActions = actions.filter(action => action.status === 'rejected');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        title="Parent Dashboard"
        subtitle={`Managing actions for ${studentData.name}`}
        onRefresh={() => window.location.reload()}
        isLoading={loading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Student Info Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Student</p>
                <p className="text-lg font-semibold text-gray-900">{studentData.name}</p>
                <p className="text-sm text-gray-500">ID: {studentData.student_id}</p>
              </div>
            </div>
          </div>

          {/* Risk Level Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Risk Level</p>
                <p className="text-lg font-semibold text-orange-700 capitalize">{studentData.risk_level}</p>
                <p className="text-sm text-gray-500">Current Status</p>
              </div>
            </div>
          </div>

          {/* Pending Actions Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Actions</p>
                <p className="text-lg font-semibold text-yellow-700">{pendingActions.length}</p>
                <p className="text-sm text-gray-500">Awaiting Approval</p>
              </div>
            </div>
          </div>

          {/* Total Actions Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Actions</p>
                <p className="text-lg font-semibold text-green-700">{actions.length}</p>
                <p className="text-sm text-gray-500">All Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Action Management</h3>
            <p className="text-sm text-gray-600">Review and approve actions taken by teachers and counselors</p>
          </div>

          <div className="p-6">
            {actions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No actions available</p>
                <p className="text-gray-500">Actions will appear here when teachers or counselors take steps to help your child</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actions.map((action) => (
                  <div key={action._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getActionTypeIcon(action.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 capitalize">
                              {action.type ? action.type.replace('_', ' ') : 'Action'}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                              {getStatusIcon(action.status)}
                              <span className="ml-1 capitalize">{action.status}</span>
                            </span>
                          </div>
                          
                          <p className="text-gray-700 mb-2">{action.description}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(action.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {action.created_by_name || 'Staff Member'}
                            </span>
                            {action.priority && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                action.priority === 'high' ? 'bg-red-100 text-red-800' :
                                action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {action.priority} priority
                              </span>
                            )}
                          </div>

                          {action.reason && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-700">
                                <strong>Reason:</strong> {action.reason}
                              </p>
                            </div>
                          )}

                          {action.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedAction(action);
                                  setShowActionModal(true);
                                }}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review Action
                              </button>
                            </div>
                          )}

                          {action.status === 'approved' && action.approved_at && (
                            <p className="text-sm text-green-600">
                              ✓ Approved on {new Date(action.approved_at).toLocaleDateString()}
                            </p>
                          )}

                          {action.status === 'rejected' && action.rejected_at && (
                            <p className="text-sm text-red-600">
                              ✗ Rejected on {new Date(action.rejected_at).toLocaleDateString()}
                              {action.rejection_reason && ` - ${action.rejection_reason}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Approval Modal */}
      {showActionModal && selectedAction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Review Action</h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 capitalize mb-2">
                  {selectedAction.type ? selectedAction.type.replace('_', ' ') : 'Action'}
                </h4>
                <p className="text-gray-700 mb-3">{selectedAction.description || 'No description available'}</p>
                
                {selectedAction.reason && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700">
                      <strong>Reason:</strong> {selectedAction.reason}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => selectedAction._id && handleActionApproval(selectedAction._id, 'approved')}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Please provide a reason for rejection (optional):');
                    selectedAction._id && handleActionApproval(selectedAction._id, 'rejected', reason);
                  }}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
