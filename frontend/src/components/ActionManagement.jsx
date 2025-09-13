import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ActionManagement = ({ onClose }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionForm, setActionForm] = useState({
    description: '',
    counselor_notes: '',
    priority: 'medium',
    due_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students');
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setActionForm({
      description: '',
      counselor_notes: '',
      priority: 'medium',
      due_date: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setActionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setLoading(true);
    try {
      await axios.post(`/api/students/${selectedStudent.student_id}/actions`, actionForm);
      setMessage('Action created successfully');
      setActionForm({
        description: '',
        counselor_notes: '',
        priority: 'medium',
        due_date: ''
      });
      // Refresh student data
      fetchStudents();
    } catch (error) {
      setMessage('Error creating action: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Action Management</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Selection */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Select Student</h4>
              <div className="max-h-64 overflow-y-auto border rounded-md">
                {students.map((student) => (
                  <div
                    key={student.student_id}
                    onClick={() => handleStudentSelect(student)}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedStudent?.student_id === student.student_id ? 'bg-indigo-50 border-indigo-200' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">ID: {student.student_id}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        student.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                        student.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {student.risk_level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Form */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Create Action</h4>
              {selectedStudent ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student: {selectedStudent.name}
                    </label>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Action Description *
                    </label>
                    <input
                      type="text"
                      id="description"
                      name="description"
                      required
                      value={actionForm.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter action description"
                    />
                  </div>

                  <div>
                    <label htmlFor="counselor_notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Counselor Notes *
                    </label>
                    <textarea
                      id="counselor_notes"
                      name="counselor_notes"
                      required
                      rows={3}
                      value={actionForm.counselor_notes}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter detailed notes"
                    />
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={actionForm.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="due_date"
                      name="due_date"
                      value={actionForm.due_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Action'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-gray-500">Select a student to create an action</p>
              )}
            </div>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionManagement;
