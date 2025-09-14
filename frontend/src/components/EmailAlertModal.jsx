import React, { useState, useEffect } from 'react';
import { X, Send, AlertTriangle, User, Mail, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';

const EmailAlertModal = ({ isOpen, onClose, student, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    alertType: 'risk_alert',
    priority: student?.risk_level === 'high' ? 'high' : 'medium',
    subject: '',
    message: '',
    actionRequired: false,
    actionDeadline: '',
    followUpRequired: false,
    followUpDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (student) {
      setFormData(prev => ({
        ...prev,
        priority: student.risk_level === 'high' ? 'high' : 'medium',
        subject: `Academic Alert - ${student.name}`,
        message: `Dear ${student.name},\n\nWe are writing to inform you about your current academic status and risk assessment.\n\nYour current risk level is ${student.risk_level.toUpperCase()} with a risk score of ${student.risk_score}/100.\n\nPlease review the following areas that may need attention:\n\n- Academic Performance\n- Attendance\n- Overall Engagement\n\nWe encourage you to take immediate action to improve your academic standing.\n\nBest regards,\nAcademic Team`
      }));
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const alertData = {
        studentId: student.student_id,
        studentName: student.name,
        studentEmail: student.email,
        alertType: formData.alertType,
        priority: formData.priority,
        subject: formData.subject,
        message: formData.message,
        actionRequired: formData.actionRequired,
        actionDeadline: formData.actionDeadline || null,
        followUpRequired: formData.followUpRequired,
        followUpDate: formData.followUpDate || null,
        sentByName: user?.username || 'Unknown',
        sentByRole: user?.role || 'counselor'
      };

      const response = await api.sendEmailAlert(alertData);
      
      if (response.data.success) {
        onSuccess?.(response.data.alert);
        onClose();
        setFormData({
          alertType: 'risk_alert',
          priority: 'medium',
          subject: '',
          message: '',
          actionRequired: false,
          actionDeadline: '',
          followUpRequired: false,
          followUpDate: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send email alert');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Mail className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Send Email Alert</h3>
                <p className="text-sm text-gray-600">Send alert to {student.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Student Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{student.name}</h4>
                  <p className="text-sm text-gray-600">ID: {student.student_id}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  student.risk_level === 'high' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {student.risk_level.toUpperCase()} RISK
                </div>
                <p className="text-sm text-gray-600 mt-1">Score: {student.risk_score}/100</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alert Type and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Type
                </label>
                <select
                  name="alertType"
                  value={formData.alertType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="risk_alert">Risk Alert</option>
                  <option value="academic_concern">Academic Concern</option>
                  <option value="attendance_issue">Attendance Issue</option>
                  <option value="behavioral_concern">Behavioral Concern</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email subject"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your message to the student"
                required
              />
            </div>

            {/* Action Required */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="actionRequired"
                  name="actionRequired"
                  checked={formData.actionRequired}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="actionRequired" className="ml-2 block text-sm text-gray-700">
                  Action Required
                </label>
              </div>

              {formData.actionRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Deadline
                  </label>
                  <input
                    type="datetime-local"
                    name="actionDeadline"
                    value={formData.actionDeadline}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="followUpRequired"
                  name="followUpRequired"
                  checked={formData.followUpRequired}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="followUpRequired" className="ml-2 block text-sm text-gray-700">
                  Follow-up Required
                </label>
              </div>

              {formData.followUpRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Date
                  </label>
                  <input
                    type="datetime-local"
                    name="followUpDate"
                    value={formData.followUpDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Alert
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailAlertModal;
