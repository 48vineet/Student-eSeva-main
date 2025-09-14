import React, { useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, AlertTriangle, TrendingUp, BookOpen, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

const StudentDetailsModal = ({ student, isOpen, onClose, showActions = true }) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !student) {
    return null;
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const readableFactors = student.risk_factors?.map(factor => {
    const factorMap = {
      'critical_attendance': 'Critical Attendance Issue',
      'low_attendance': 'Low Attendance',
      'multiple_failures': 'Multiple Subject Failures',
      'single_failure': 'Single Subject Failure',
      'financial_stress': 'Financial Stress',
      'pending_fees': 'Pending Fee Payment',
      // 'exhausted_attempts' removed from system
    };
    return factorMap[factor] || factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }) || [];

  // Helper function to get all grades from detailed fields
  const getAllGradesFromDetailedFields = (student) => {
    const allGrades = [];
    const gradeFields = [
      'unit_test_1_grades', 'unit_test_2_grades', 'mid_sem_grades', 'end_sem_grades'
    ];
    gradeFields.forEach(field => {
      if (student[field] && Array.isArray(student[field])) {
        student[field].forEach(grade => {
          if (grade.subject) {
            const examType = field.replace('_grades', '');
            let score = 0;
            let hasScore = false;
            
            // Extract score based on exam type
            if (examType === 'unit_test_1' && grade.unit_test_1 !== undefined) {
              score = grade.unit_test_1;
              hasScore = true;
            } else if (examType === 'unit_test_2' && grade.unit_test_2 !== undefined) {
              score = grade.unit_test_2;
              hasScore = true;
            } else if (examType === 'mid_sem' && grade.mid_sem !== undefined) {
              score = grade.mid_sem;
              hasScore = true;
            } else if (examType === 'end_sem' && grade.end_sem !== undefined) {
              score = grade.end_sem;
              hasScore = true;
            } else if (grade.score !== undefined) {
              // Fallback to old score field
              score = grade.score;
              hasScore = true;
            }
            
            allGrades.push({ 
              subject: grade.subject, 
              score: score, 
              examType: examType,
              status: score < 36 ? 'failing' : 'passing',
              hasScore: hasScore
            });
          }
        });
      }
    });
    // Fallback to old grades array if detailed fields are empty
    if (allGrades.length === 0 && student.grades && Array.isArray(student.grades)) {
      student.grades.forEach(grade => {
        if (grade.subject) {
          allGrades.push({ 
            subject: grade.subject, 
            score: grade.score || 0, 
            examType: 'basic',
            status: (grade.score || 0) < 36 ? 'failing' : 'passing',
            hasScore: grade.score !== undefined && grade.score !== null
          });
        }
      });
    }
    return allGrades;
  };

  // Get all grades from detailed fields
  const allGrades = getAllGradesFromDetailedFields(student);
  
  // Calculate failed subjects from all grades
  const failedSubjects = allGrades.filter(grade => grade.status === 'failing').length;
  
  // Calculate GPA from all grades
  const gpa = allGrades.length > 0 
    ? (allGrades.reduce((sum, grade) => sum + grade.score, 0) / allGrades.length).toFixed(2)
    : 'N/A';

  // Group grades by exam type
  const gradesByExamType = allGrades.reduce((acc, grade) => {
    if (!acc[grade.examType]) {
      acc[grade.examType] = [];
    }
    acc[grade.examType].push(grade);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" style={{zIndex: 9999}}>
      {/* Background Blur Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-modal-in transform transition-all duration-300 ease-out" style={{zIndex: 10000}}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold truncate">{student.name}</h2>
                <p className="text-blue-100 text-sm sm:text-base truncate">Student ID: {student.student_id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ml-2 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(80vh-100px)]">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Left Column */}
            <div className="space-y-3 sm:space-y-4">
              
              {/* Risk Status */}
              <div className={`p-4 rounded-xl border-2 ${getRiskColor(student.risk_level)}`}>
                <div className="flex items-center space-x-3 mb-3">
                  {getRiskIcon(student.risk_level)}
                  <h3 className="text-lg font-semibold">Risk Assessment</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Risk Level:</span>
                    <span className="font-bold text-lg uppercase">{student.risk_level}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Risk Score:</span>
                    <span className="font-bold text-lg">{student.risk_score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        student.risk_level === 'high' ? 'bg-red-500' : 
                        student.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${student.risk_score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Student Email</p>
                      <p className="font-medium">{student.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Parent Email</p>
                      <p className="font-medium">{student.parent_email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Performance */}
              <div className="bg-blue-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Academic Performance
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{student.attendance_rate || 0}%</p>
                    <p className="text-sm text-gray-600">Attendance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{gpa}</p>
                    <p className="text-sm text-gray-600">GPA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{failedSubjects}</p>
                    <p className="text-sm text-gray-600">Failed Subjects</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{student.class_year || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Class Year</p>
                  </div>
                </div>
                
                {/* Detailed Exam Grades */}
                {allGrades.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-blue-700 mb-3">Detailed Exam Results:</h4>
                    <div className="space-y-4">
                      {Object.entries(gradesByExamType).map(([examType, grades]) => (
                        <div key={examType} className="bg-white p-3 rounded-lg border">
                          <h5 className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wide">
                            {examType.replace(/_/g, ' ')} ({grades.length} subjects)
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {grades.map((grade, index) => (
                              <div 
                                key={index}
                                className={`flex justify-between items-center p-2 rounded-lg text-sm ${
                                  grade.status === 'failing' 
                                    ? 'bg-red-100 text-red-800 border border-red-200' 
                                    : 'bg-green-100 text-green-800 border border-green-200'
                                }`}
                              >
                                <span className="font-medium truncate">{grade.subject}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold">
                                    {grade.hasScore ? grade.score : 'No Score'}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    grade.hasScore 
                                      ? (grade.status === 'failing' 
                                          ? 'bg-red-200 text-red-700' 
                                          : 'bg-green-200 text-green-700')
                                      : 'bg-yellow-200 text-yellow-700'
                                  }`}>
                                    {grade.hasScore 
                                      ? (grade.status === 'failing' ? 'FAIL' : 'PASS')
                                      : 'PENDING'
                                    }
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Status */}
              <div className="bg-green-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Financial Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Fee Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      student.fees_status === 'Complete' || student.fee_status === 'current' 
                        ? 'bg-green-100 text-green-800' 
                        : student.fees_status === 'Overdue' || student.fee_status === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {student.fees_status || student.fee_status || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Days Overdue:</span>
                    <span className={`font-bold ${(student.days_overdue || 0) > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                      {student.days_overdue || 0} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Fees Due Days:</span>
                    <span className="font-bold text-gray-700">{student.fees_due_days || 0} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Data Complete:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.data_completion?.local_guardian 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {student.data_completion?.local_guardian ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3 sm:space-y-4">
              
              {/* Risk Factors */}
              <div className="bg-red-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Risk Factors
                </h3>
                {readableFactors.length > 0 ? (
                  <ul className="space-y-2">
                    {readableFactors.map((factor, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-gray-700">{factor}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No specific risk factors identified</p>
                )}
              </div>

              {/* Risk Explanation */}
              {student.explanation && student.explanation.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-xl">
                  <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Risk Explanation
                  </h3>
                  <ul className="space-y-2">
                    {student.explanation.map((explanation, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span className="text-gray-700">{explanation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-purple-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Recommendations
                </h3>
                {student.recommendations && student.recommendations.length > 0 ? (
                  <ul className="space-y-3">
                    {student.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-800">{rec.action}</p>
                          <p className="text-sm text-gray-600 capitalize">Priority: {rec.urgency}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-2">
                    <p className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-700">Schedule immediate meeting with student</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-700">Review academic progress</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-700">Provide additional support</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Data Completion Status */}
              <div className="bg-indigo-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Data Completion Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Exam Department:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.data_completion?.exam_department 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.data_completion?.exam_department ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Faculty (Attendance):</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.data_completion?.faculty 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.data_completion?.faculty ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Local Guardian (Fees):</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.data_completion?.local_guardian 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.data_completion?.local_guardian ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Overall Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.data_complete 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {student.data_complete ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Additional Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Major:</span>
                    <span className="text-gray-700">{student.major || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Class Year:</span>
                    <span className="text-gray-700">{student.class_year || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Last Updated:</span>
                    <span className="text-gray-700">{formatDate(student.last_updated)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Created:</span>
                    <span className="text-gray-700">{formatDate(student.createdAt)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
