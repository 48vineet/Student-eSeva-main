import React from 'react';
import { useAuth } from '../context/AuthContext';
import CounselorDashboard from './dashboards/CounselorDashboard';
import FacultyDashboard from './dashboards/FacultyDashboard';
import ExamDepartmentDashboard from './dashboards/ExamDepartmentDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import GuardianDashboard from './dashboards/GuardianDashboard';

const RoleDashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user.role) {
      case 'counselor':
        return <CounselorDashboard />;
      case 'faculty':
        return <FacultyDashboard />;
      case 'exam-department':
        return <ExamDepartmentDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'local-guardian':
        return <GuardianDashboard />;
      default:
        return (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900">Unknown Role</h2>
            <p className="text-gray-600">Your role is not recognized.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderDashboard()}
    </div>
  );
};

export default RoleDashboard;
