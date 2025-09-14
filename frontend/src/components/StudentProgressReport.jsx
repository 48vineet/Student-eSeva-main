import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';

const StudentProgressReport = ({ student, onClose }) => {
  const reportRef = useRef();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSimplePDF = () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Helper function to add a new page if needed
      const checkNewPage = (yPos, requiredSpace = 20) => {
        if (yPos > 250) {
          pdf.addPage();
          return 20;
        }
        return yPos;
      };
      
      // Helper function to draw a colored box
      const drawColoredBox = (x, y, width, height, color, text, textColor = '#000000') => {
        pdf.setFillColor(color);
        pdf.rect(x, y, width, height, 'F');
        pdf.setTextColor(textColor);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(text, x + 5, y + 7);
        pdf.setTextColor('#000000');
      };
      
      // Helper function to draw a section header
      const drawSectionHeader = (text, yPos) => {
        pdf.setFillColor(59, 130, 246); // Blue color
        pdf.rect(15, yPos - 5, 180, 8, 'F');
        pdf.setTextColor('#FFFFFF');
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(text, 20, yPos + 2);
        pdf.setTextColor('#000000');
        return yPos + 15;
      };
      
      let yPosition = 20;
      
      // Header with colored background
      pdf.setFillColor(30, 64, 175); // Dark blue
      pdf.rect(0, 0, 210, 40, 'F');
      
      pdf.setTextColor('#FFFFFF');
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('STUDENT PROGRESS REPORT', 105, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 25, { align: 'center' });
      pdf.text(`Academic Year: ${student.current_academic_year}`, 105, 32, { align: 'center' });
      
      yPosition = 50;
      
      // Student Information Section
      yPosition = drawSectionHeader('STUDENT INFORMATION', yPosition);
      
      // Student info in a nice box
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(15, yPosition, 180, 35);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Name: ${student.name}`, 20, yPosition + 8);
      pdf.text(`Student ID: ${student.student_id}`, 20, yPosition + 16);
      pdf.text(`Email: ${student.email}`, 20, yPosition + 24);
      pdf.text(`Parent Email: ${student.parent_email}`, 20, yPosition + 32);
      
      pdf.text(`Academic Year: ${student.current_academic_year}`, 110, yPosition + 8);
      pdf.text(`Semester: ${student.current_semester}`, 110, yPosition + 16);
      
      yPosition += 45;
      
      // Academic Performance Section
      yPosition = drawSectionHeader('ACADEMIC PERFORMANCE', yPosition);
      
      // Performance summary boxes
      const attendanceColor = student.attendance_rate >= 85 ? '#10B981' : student.attendance_rate >= 75 ? '#F59E0B' : '#EF4444';
      const failedColor = student.failed_subjects > 0 ? '#EF4444' : '#10B981';
      
      drawColoredBox(15, yPosition, 60, 20, attendanceColor, `Attendance: ${student.attendance_rate}%`, '#FFFFFF');
      drawColoredBox(80, yPosition, 60, 20, failedColor, `Failed: ${student.failed_subjects || 0}`, '#FFFFFF');
      drawColoredBox(145, yPosition, 50, 20, '#3B82F6', `Total: ${student.unit_test_1_grades?.length || 0}`, '#FFFFFF');
      
      yPosition += 30;
      
      // Unit Test 1 Results Table
      if (student.unit_test_1_grades && student.unit_test_1_grades.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Unit Test 1 Results:', 20, yPosition);
        yPosition += 10;
        
        // Table header
        pdf.setFillColor(240, 240, 240);
        pdf.rect(15, yPosition, 180, 8, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Subject', 20, yPosition + 6);
        pdf.text('Score', 120, yPosition + 6);
        pdf.text('Status', 160, yPosition + 6);
        yPosition += 10;
        
        // Table rows
        student.unit_test_1_grades.forEach((grade, index) => {
          yPosition = checkNewPage(yPosition, 8);
          
          const isEven = index % 2 === 0;
          if (isEven) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(15, yPosition - 2, 180, 8, 'F');
          }
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(grade.subject, 20, yPosition + 4);
          pdf.text(`${grade.unit_test_1}%`, 120, yPosition + 4);
          
          // Status with color
          const statusColor = grade.unit_test_1 >= 60 ? '#10B981' : '#EF4444';
          const statusText = grade.unit_test_1 >= 60 ? 'PASS' : 'FAIL';
          drawColoredBox(155, yPosition - 2, 35, 8, statusColor, statusText, '#FFFFFF');
          
          yPosition += 8;
        });
        
        yPosition += 10;
      }
      
      // Risk Assessment Section
      yPosition = drawSectionHeader('RISK ASSESSMENT', yPosition);
      
      // Risk level box
      const riskColor = student.risk_level === 'high' ? '#EF4444' : 
                       student.risk_level === 'medium' ? '#F59E0B' : '#10B981';
      drawColoredBox(15, yPosition, 80, 20, riskColor, `Risk: ${student.risk_level?.toUpperCase() || 'N/A'}`, '#FFFFFF');
      drawColoredBox(100, yPosition, 80, 20, '#6B7280', `Score: ${student.risk_score || 'N/A'}/100`, '#FFFFFF');
      
      yPosition += 30;
      
      // Risk factors
      if (student.risk_factors && student.risk_factors.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Risk Factors:', 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        student.risk_factors.forEach(factor => {
          yPosition = checkNewPage(yPosition, 6);
          pdf.text(`• ${factor.replace(/_/g, ' ').toUpperCase()}`, 25, yPosition);
          yPosition += 6;
        });
        yPosition += 5;
      }
      
      // Financial Status Section
      yPosition = drawSectionHeader('FINANCIAL STATUS', yPosition);
      
      // Financial info boxes
      const paidAmount = student.amount_paid || 0;
      const dueAmount = student.amount_due || 0;
      const isPaid = student.fees_status === 'Complete' || dueAmount === 0;
      
      drawColoredBox(15, yPosition, 60, 20, '#10B981', `Paid: ₹${paidAmount.toLocaleString()}`, '#FFFFFF');
      drawColoredBox(80, yPosition, 60, 20, isPaid ? '#10B981' : '#EF4444', `Due: ₹${dueAmount.toLocaleString()}`, '#FFFFFF');
      drawColoredBox(145, yPosition, 50, 20, isPaid ? '#10B981' : '#EF4444', isPaid ? 'PAID' : 'PENDING', '#FFFFFF');
      
      yPosition += 30;
      
      if (student.days_overdue > 0) {
        drawColoredBox(15, yPosition, 100, 20, '#EF4444', `Overdue: ${student.days_overdue} days`, '#FFFFFF');
        yPosition += 30;
      }
      
      // Recommendations Section
      if (student.recommendations && student.recommendations.length > 0) {
        yPosition = drawSectionHeader('RECOMMENDATIONS', yPosition);
        
        student.recommendations.forEach((rec, index) => {
          yPosition = checkNewPage(yPosition, 25);
          
          // Recommendation box
          pdf.setDrawColor(59, 130, 246);
          pdf.setLineWidth(1);
          pdf.rect(15, yPosition, 180, 20);
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${rec.action}`, 20, yPosition + 8);
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const priorityColor = rec.urgency === 'immediate' ? '#EF4444' : 
                               rec.urgency === 'high' ? '#F59E0B' : '#10B981';
          drawColoredBox(20, yPosition + 10, 50, 8, priorityColor, rec.urgency.toUpperCase(), '#FFFFFF');
          
          const statusColor = rec.completed ? '#10B981' : '#F59E0B';
          const statusText = rec.completed ? 'COMPLETED' : 'PENDING';
          drawColoredBox(75, yPosition + 10, 50, 8, statusColor, statusText, '#FFFFFF');
          
          yPosition += 25;
        });
      }
      
      // Footer
      pdf.setFillColor(30, 64, 175);
      pdf.rect(0, 270, 210, 30, 'F');
      
      pdf.setTextColor('#FFFFFF');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('This report was generated automatically by the Student eSeva System', 105, 280, { align: 'center' });
      pdf.text('For any queries, please contact your academic counselor', 105, 285, { align: 'center' });
      
      // Save the PDF
      const fileName = `Student_Progress_Report_${student.student_id}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      console.log('Enhanced PDF generated successfully');
      onClose();
    } catch (error) {
      console.error('Error generating enhanced PDF:', error);
      alert(`Error generating PDF: ${error.message}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };


  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getGradeColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Student Progress Report</h2>
          <div className="flex space-x-3">
            <button
              onClick={generateSimplePDF}
              disabled={isGenerating}
              className={`px-6 py-2 rounded-lg transition-colors duration-200 flex items-center ${
                isGenerating 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div 
          ref={reportRef} 
          data-ref="report-content" 
          className="bg-white p-8 space-y-8"
          style={{
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.4',
            color: '#000000'
          }}
        >
          {/* Header */}
          <div className="text-center border-b-2 border-gray-200 pb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Student Progress Report</h1>
            <p className="text-xl text-gray-600">Academic Performance & Risk Assessment</p>
            <p className="text-lg text-gray-500 mt-2">Generated on {formatDate(new Date())}</p>
          </div>

          {/* Student Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Student Name</p>
                <p className="text-lg font-semibold text-gray-900">{student.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Student ID</p>
                <p className="text-lg font-semibold text-gray-900">{student.student_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">{student.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Academic Year</p>
                <p className="text-lg font-semibold text-gray-900">{student.current_academic_year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Semester</p>
                <p className="text-lg font-semibold text-gray-900">{student.current_semester}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Parent Email</p>
                <p className="text-lg font-semibold text-gray-900">{student.parent_email}</p>
              </div>
            </div>
          </div>

          {/* Academic Performance */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Academic Performance</h2>
            
            {/* Unit Test 1 Grades */}
            {student.unit_test_1_grades && student.unit_test_1_grades.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Unit Test 1 Results</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Subject</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Score</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.unit_test_1_grades.map((grade, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-2">{grade.subject}</td>
                          <td className={`border border-gray-300 px-4 py-2 font-semibold ${getGradeColor(grade.unit_test_1)}`}>
                            {grade.unit_test_1}%
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              grade.unit_test_1 >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {grade.unit_test_1 >= 60 ? 'Pass' : 'Fail'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-blue-600">Total Subjects</p>
                <p className="text-2xl font-bold text-blue-800">
                  {student.unit_test_1_grades?.length || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-green-600">Passed Subjects</p>
                <p className="text-2xl font-bold text-green-800">
                  {student.unit_test_1_grades?.filter(g => g.unit_test_1 >= 60).length || 0}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-sm text-red-600">Failed Subjects</p>
                <p className="text-2xl font-bold text-red-800">
                  {student.failed_subjects || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Attendance */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Attendance</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-800">Current Attendance Rate</p>
                  <p className="text-sm text-gray-600">Based on recorded attendance data</p>
                </div>
                <div className="text-right">
                  <p className={`text-4xl font-bold ${
                    student.attendance_rate >= 85 ? 'text-green-600' :
                    student.attendance_rate >= 75 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {student.attendance_rate}%
                  </p>
                  <p className={`text-sm font-medium ${
                    student.attendance_rate >= 85 ? 'text-green-600' :
                    student.attendance_rate >= 75 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {student.attendance_rate >= 85 ? 'Excellent' :
                     student.attendance_rate >= 75 ? 'Good' : 'Needs Improvement'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fees Status */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Status</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold">₹{student.amount_paid?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Due:</span>
                    <span className="font-semibold">₹{student.amount_due?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold ${
                      student.fees_status === 'Complete' || student.amount_due === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {student.fees_status === 'Complete' || student.amount_due === 0 ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  {student.days_overdue > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Overdue:</span>
                      <span className="font-semibold text-red-600">{student.days_overdue} days</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Due Date</h3>
                <p className="text-lg text-gray-600">{formatDate(student.due_date)}</p>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Risk Assessment</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Risk Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-gray-600 w-24">Risk Level:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(student.risk_level)}`}>
                        {student.risk_level?.toUpperCase() || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 w-24">Risk Score:</span>
                      <span className="font-semibold text-gray-900">{student.risk_score || 'N/A'}/100</span>
                    </div>
                    {student.risk_factors && student.risk_factors.length > 0 && (
                      <div>
                        <span className="text-gray-600">Risk Factors:</span>
                        <div className="mt-1">
                          {student.risk_factors.map((factor, index) => (
                            <span key={index} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-2 mb-1">
                              {factor.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Assessment Details</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Data Complete:</strong> {student.data_complete ? 'Yes' : 'No'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Last Updated:</strong> {formatDate(student.last_updated)}
                    </p>
                    {student.explanation && student.explanation.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 font-semibold">Explanation:</p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {student.explanation.map((exp, index) => (
                            <li key={index}>{exp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {student.recommendations && student.recommendations.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommendations</h2>
              <div className="space-y-4">
                {student.recommendations.map((rec, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{rec.action}</h3>
                        {rec.description && (
                          <p className="text-gray-600 mb-3">{rec.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rec.urgency === 'immediate' ? 'bg-red-100 text-red-800' :
                            rec.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                            rec.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {rec.urgency} priority
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rec.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {rec.completed ? 'Completed' : 'Pending'}
                          </span>
                          <span>Created: {formatDate(rec.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-gray-200 pt-6 text-center text-gray-500">
            <p>This report was generated automatically by the Student eSeva System</p>
            <p className="text-sm mt-1">For any queries, please contact your academic counselor</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgressReport;
