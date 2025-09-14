import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

const DeleteDataModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  student, 
  dataType, 
  role 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const getDataTypeInfo = () => {
    switch (dataType) {
      case 'exam':
        return {
          title: 'Delete Exam Data',
          description: 'This will permanently delete all exam data for this student including:',
          items: [
            'All grade records (Unit Tests, Mid-term, Final)',
            'Academic history',
            'Subject-wise performance data'
          ],
          warning: 'This action cannot be undone. The student will need to re-upload exam data.'
        };
      case 'attendance':
        return {
          title: 'Delete Attendance Data',
          description: 'This will permanently delete attendance data for this student including:',
          items: [
            'Attendance rate',
            'Attendance records'
          ],
          warning: 'This action cannot be undone. Faculty will need to re-upload attendance data.'
        };
      case 'fees':
        return {
          title: 'Delete Fees Data',
          description: 'This will permanently delete fees data for this student including:',
          items: [
            'Fees status',
            'Amount paid and due',
            'Due date information',
            'Overdue calculations'
          ],
          warning: 'This action cannot be undone. Local guardian will need to re-upload fees data.'
        };
      case 'student-record':
        return {
          title: 'Delete Student Record',
          description: 'This will permanently delete the ENTIRE student record including:',
          items: [
            'All personal information',
            'All academic records and grades',
            'All attendance data',
            'All fees information',
            'All risk assessments',
            'All action history',
            'Complete student profile'
          ],
          warning: '⚠️ CRITICAL: This will permanently remove the student from the database. This action cannot be undone and all data will be lost forever.'
        };
      default:
        return {
          title: 'Delete Data',
          description: 'This will permanently delete data for this student.',
          items: [],
          warning: 'This action cannot be undone.'
        };
    }
  };

  const dataInfo = getDataTypeInfo();

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm z-50 overflow-y-auto animate-fade-in">
      <div className="min-h-screen bg-white animate-slide-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-red-100 rounded-xl shadow-lg">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {dataInfo.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">Permanent Data Deletion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-4 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 border-2 border-transparent hover:border-red-200"
            disabled={isDeleting}
          >
            <X className="w-8 h-8 text-gray-500 hover:text-red-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Student Info */}
          <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3 text-lg">Student Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Student ID</p>
                <p className="text-lg font-bold text-gray-900">{student?.student_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Name</p>
                <p className="text-lg font-bold text-gray-900">{student?.name}</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-red-200 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-700 flex-shrink-0" />
              </div>
              <div>
                <h4 className="font-bold text-red-900 mb-3 text-lg">⚠️ Warning</h4>
                <p className="text-red-800 font-medium">{dataInfo.warning}</p>
              </div>
            </div>
          </div>

          {/* Data to be deleted */}
          <div className="mb-8">
            <h4 className="font-semibold text-gray-900 mb-4 text-lg">{dataInfo.description}</h4>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <ul className="space-y-3">
                {dataInfo.items.map((item, index) => (
                  <li key={index} className="flex items-center space-x-3 text-gray-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold text-lg"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isDeleting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteDataModal;
