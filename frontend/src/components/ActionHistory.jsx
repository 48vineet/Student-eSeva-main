import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ActionHistory = ({ student, onClose }) => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (student) {
      fetchActions();
    }
  }, [student]);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/students/${student.student_id}/actions`);
      setActions(response.data.actions);
    } catch (error) {
      console.error('Error fetching actions:', error);
      setMessage('Error loading actions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Action History</h3>
              <p className="text-sm text-gray-600">Student: {student.name} (ID: {student.student_id})</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {message && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800">
              {message}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading actions...</p>
            </div>
          ) : actions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No actions found for this student</p>
          ) : (
            <div className="space-y-4">
              {actions.map((action) => (
                <div key={action._id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{action.description}</h4>
                      <p className="text-sm text-gray-600 mt-1">{action.counselor_notes}</p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(action.status)}`}>
                        {action.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(action.priority)}`}>
                        {action.priority}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Created: {new Date(action.last_updated).toLocaleDateString()}</p>
                    {action.due_date && (
                      <p>Due: {new Date(action.due_date).toLocaleDateString()}</p>
                    )}
                    {action.approved_by && (
                      <p>Approved by: {action.approved_by}</p>
                    )}
                    {action.rejection_reason && (
                      <p className="text-red-600">Rejection reason: {action.rejection_reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionHistory;
