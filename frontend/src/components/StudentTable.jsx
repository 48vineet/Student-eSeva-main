import React, { useState } from "react";
import { Search, RefreshCw, Mail, Eye, Filter, Users } from "lucide-react";
import { formatDate, timeAgo } from "../utils/formatDate";
import { getRiskBadgeClass } from "../utils/chartData";
import { useStudents } from "../context/StudentContext";
import StudentDetailsModal from "./StudentDetailsModal";

const StudentTable = ({ students }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [sortBy, setSortBy] = useState("risk_level");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { actions } = useStudents();

  // Filter and search students
  const filteredStudents = (students || []).filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterRisk === "" || student.risk_level === filterRisk;
    return matchesSearch && matchesFilter;
  });

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "attendance_rate":
        aValue = a.attendance_rate || 0;
        bValue = b.attendance_rate || 0;
        break;
      case "risk_level":
        // Sort by risk level (high, medium, low)
        const riskOrder = { high: 3, medium: 2, low: 1 };
        aValue = riskOrder[a.risk_level] || 0;
        bValue = riskOrder[b.risk_level] || 0;
        break;
      case "risk_score":
        // Sort by numeric risk score
        aValue = a.risk_score || 0;
        bValue = b.risk_score || 0;
        break;
      case "last_updated":
        aValue = new Date(a.last_updated || 0);
        bValue = new Date(b.last_updated || 0);
        break;
      default:
        aValue = a[sortBy];
        bValue = b[sortBy];
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = sortedStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );
  const totalPages = Math.ceil(sortedStudents.length / studentsPerPage);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handleRecalculateRisk = async (studentId) => {
    try {
      await actions.recalculateStudent(studentId);
    } catch (error) {
      console.error("Failed to recalculate risk:", error);
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const getRiskBadge = (riskLevel) => {
    const baseClasses =
      "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider";
    const riskClasses = getRiskBadgeClass(riskLevel);
    return `${baseClasses} ${riskClasses}`;
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case "high":
        return "🚨";
      case "medium":
        return "⚠️";
      case "low":
        return "✅";
      default:
        return "❓";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and Filter Controls */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-blue-500 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 focus:bg-white w-64"
              />
            </div>

            {/* Risk Filter */}
            <div className="relative group">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-blue-500 transition-colors duration-200" />
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 focus:bg-white"
              >
                <option value="">All Risk Levels</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {currentStudents.length} of {sortedStudents.length} students
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Student</span>
                    {sortBy === "name" && (
                      <span className="text-primary-600">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("attendance_rate")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Attendance</span>
                    {sortBy === "attendance_rate" && (
                      <span className="text-primary-600">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("risk_level")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Risk Level</span>
                    {sortBy === "risk_level" && (
                      <span className="text-primary-600">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Factors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Status
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("last_updated")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Updated</span>
                    {sortBy === "last_updated" && (
                      <span className="text-primary-600">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentStudents.map((student, index) => (
                <tr 
                  key={student.student_id} 
                  className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 transform hover:scale-[1.01] animate-fade-in-up cursor-pointer"
                  style={{animationDelay: `${index * 0.1}s`}}
                  onClick={() => handleStudentClick(student)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                          <span className="text-sm font-bold text-white">
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.student_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.attendance_rate}%
                    </div>
                    <div
                      className={`text-xs ${
                        student.attendance_rate >= 85
                          ? "text-success-600"
                          : student.attendance_rate >= 75
                          ? "text-warning-600"
                          : "text-danger-600"
                      }`}
                    >
                      {student.attendance_rate >= 85
                        ? "Good"
                        : student.attendance_rate >= 75
                        ? "Fair"
                        : "Poor"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getRiskIcon(student.risk_level)}
                      </span>
                      <span className={getRiskBadge(student.risk_level)}>
                        {student.risk_level}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Score: {student.risk_score}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {student.risk_factors &&
                      student.risk_factors.length > 0 ? (
                        <div className="space-y-1">
                          {student.risk_factors
                            .slice(0, 2)
                            .map((factor, index) => (
                              <div
                                key={index}
                                className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-700"
                              >
                                {factor.replace("_", " ")}
                              </div>
                            ))}
                          {student.risk_factors.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{student.risk_factors.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.fee_status === "current"
                          ? "bg-success-100 text-success-800"
                          : student.fee_status === "pending"
                          ? "bg-warning-100 text-warning-800"
                          : "bg-danger-100 text-danger-800"
                      }`}
                    >
                      {student.fee_status}
                    </span>
                    {student.days_overdue > 0 && (
                      <div className="text-xs text-danger-600 mt-1">
                        {student.days_overdue} days overdue
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {timeAgo(student.last_updated)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() =>
                          handleRecalculateRisk(student.student_id)
                        }
                        className="group relative p-2 text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 transform hover:scale-110 hover:shadow-md"
                        title="Recalculate Risk"
                      >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      </button>
                      <button
                        className="group relative p-2 text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 rounded-lg transition-all duration-200 transform hover:scale-110 hover:shadow-md"
                        title="Email Parent"
                      >
                        <Mail className="w-4 h-4 group-hover:animate-bounce" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      </button>
                      <button
                        onClick={() => handleStudentClick(student)}
                        className="group relative p-2 text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 transform hover:scale-110 hover:shadow-md"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 group-hover:animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((page) => Math.min(page + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">{indexOfFirstStudent + 1}</span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastStudent, sortedStudents.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{sortedStudents.length}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      setCurrentPage((page) => Math.max(page - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === i + 1
                          ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setCurrentPage((page) => Math.min(page + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {currentStudents.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <Users className="h-24 w-24" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No students found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterRisk
              ? "Try adjusting your search or filter criteria."
              : "Get started by uploading student data."}
          </p>
        </div>
      )}

      {/* Student Details Modal */}
      <StudentDetailsModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default StudentTable;
