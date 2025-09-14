import React from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../api/api';

const DeleteDataButton = ({ student, role, onSuccess, onDeleteClick }) => {

  const getDeleteConfig = () => {
    switch (role) {
      case 'exam-department':
        return {
          dataType: 'exam',
          apiCall: () => api.deleteExamData(student.student_id),
          title: 'Delete Exam Data'
        };
      case 'faculty':
        return {
          dataType: 'attendance',
          apiCall: () => api.deleteAttendanceData(student.student_id),
          title: 'Delete Attendance Data'
        };
      case 'local-guardian':
        return {
          dataType: 'fees',
          apiCall: () => api.deleteFeesData(student.student_id),
          title: 'Delete Fees Data'
        };
      case 'counselor':
        return {
          dataType: 'student-record',
          apiCall: () => api.deleteStudentRecord(student.student_id),
          title: 'Delete Student Record'
        };
      default:
        return null;
    }
  };

  const config = getDeleteConfig();

  if (!config) {
    return null;
  }

  const handleDeleteClick = () => {
    if (onDeleteClick) {
      onDeleteClick(student);
    }
  };

  const getButtonStyle = () => {
    if (role === 'counselor') {
      return "group relative p-2 text-white hover:text-red-100 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg transition-all duration-200 transform hover:scale-110 hover:shadow-lg border-2 border-red-500";
    }
    return "group relative p-2 text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 transform hover:scale-110 hover:shadow-md";
  };

  return (
    <button
      onClick={handleDeleteClick}
      className={getButtonStyle()}
      title={config.title}
    >
      <Trash2 className="w-4 h-4 group-hover:animate-pulse" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
    </button>
  );
};

export default DeleteDataButton;
