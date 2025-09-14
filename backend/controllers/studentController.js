const Student = require("../models/Student");
const User = require("../models/User");
const riskCalculator = require("../services/riskCalculator");
const { predictRisk } = require("../services/mlService");
const Config = require("../models/Config");
const { sendActionApprovalEmail, sendActionStatusUpdateEmail } = require("../services/emailService");

/**
 * Get all grades from detailed grade fields for risk analysis
 * @param {Object} data Student data
 * @returns {Array} Array of grade objects with subject and score
 */
function getAllGradesFromDetailedFields(data) {
  const allGrades = [];
  
  // Check all detailed grade fields
  const gradeFields = [
    'unit_test_1_grades',
    'unit_test_2_grades', 
    'mid_sem_grades',
    'end_sem_grades'
  ];
  
  gradeFields.forEach(field => {
    if (data[field] && Array.isArray(data[field])) {
      data[field].forEach(grade => {
        if (grade.subject) {
          const examType = field.replace('_grades', '');
          let score = 0;
          let hasScore = false;
          
          // Check for specific exam type score fields
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
            // Fallback for old 'score' field
            score = grade.score;
            hasScore = true;
          }
          
          if (hasScore) {
            allGrades.push({
              subject: grade.subject,
              score: score,
              examType: examType
            });
          }
        }
      });
    }
  });
  
  // If no detailed grades found, fall back to basic grades array
  if (allGrades.length === 0 && data.grades && Array.isArray(data.grades)) {
    data.grades.forEach(grade => {
      if (grade.subject && grade.score !== undefined) {
        allGrades.push({
          subject: grade.subject,
          score: grade.score,
          examType: 'basic'
        });
      }
    });
  }
  
  return allGrades;
}

/**
 * Get paginated list of students with role-based filtering and risk visibility.
 */
async function getStudents(req, res, next) {
  try {
    const { risk_level, page = 1, limit = 50 } = req.query;
    const { role, student_id, ward_student_id } = req.user;
    
    let filter = {};
    
    // Apply role-based filtering
    if (role === "student") {
      filter.student_id = student_id;
    }
    // Local guardians, counselors, faculty, and exam-department can see all students
    
    if (risk_level) filter.risk_level = risk_level;

    const skip = (page - 1) * limit;
    let students = await Student.find(filter)
      .sort({ last_updated: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    // Filter risk assessment visibility based on role
    students = students.map(student => {
      const filteredStudent = { ...student };
      
      // Only Faculty, Counselor, Local Guardian, and Exam Department can see risk assessment
      if (!["faculty", "counselor", "local-guardian", "exam-department"].includes(role)) {
        // Remove risk assessment data for students and parents
        delete filteredStudent.risk_level;
        delete filteredStudent.risk_score;
        delete filteredStudent.risk_factors;
        delete filteredStudent.explanation;
        delete filteredStudent.recommendations;
      }
      
      return filteredStudent;
    });

    const total = await Student.countDocuments(filter);

    res.json({
      success: true,
      students,
      pagination: {
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a single student by student_id.
 */
async function getStudentById(req, res, next) {
  try {
    const { studentId } = req.params;
    const student = await Student.findOne({ student_id: studentId }).lean();
    if (!student)
      return res.status(404).json({ success: false, error: "Not found" });
    
    console.log('getStudentById - student data:', {
      risk_level: student.risk_level,
      risk_score: student.risk_score,
      risk_factors: student.risk_factors,
      explanation: student.explanation,
      recommendations: student.recommendations
    });
    
    console.log('getStudentById - full student object keys:', Object.keys(student));
    
    res.json({ success: true, student });
  } catch (err) {
    next(err);
  }
}

/**
 * Dashboard summary: counts and average attendance with role-based visibility.
 */
async function dashboardSummary(req, res, next) {
  try {
    const { role } = req.user;
    
    // Only Faculty, Counselor, Local Guardian, and Exam Department can see risk assessment summary
    if (!["faculty", "counselor", "local-guardian", "exam-department"].includes(role)) {
      // For students and parents, return basic summary without risk data
      const totalStudents = await Student.countDocuments();
      const avgAttendance = await Student.aggregate([
        { $group: { _id: null, avgAttendance: { $avg: "$attendance_rate" } } }
      ]);
      
      return res.json({ 
        success: true, 
        summary: { 
          total: totalStudents, 
          avgAttendance: avgAttendance[0]?.avgAttendance?.toFixed(1) || 0 
        } 
      });
    }

    // Get data completion statistics
    const dataCompletionStats = await Student.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          examComplete: { $sum: { $cond: ["$data_completion.exam_department", 1, 0] } },
          facultyComplete: { $sum: { $cond: ["$data_completion.faculty", 1, 0] } },
          guardianComplete: { $sum: { $cond: ["$data_completion.local_guardian", 1, 0] } },
          allComplete: { $sum: { $cond: ["$data_complete", 1, 0] } },
          avgAttendance: { $avg: "$attendance_rate" }
        }
      }
    ]);

    const stats = dataCompletionStats[0] || { total: 0, examComplete: 0, facultyComplete: 0, guardianComplete: 0, allComplete: 0, avgAttendance: 0 };

    // Get risk level distribution for completed students only
    const riskAgg = await Student.aggregate([
      { $match: { data_complete: true } },
      {
        $group: {
          _id: "$risk_level",
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = { 
      total: stats.total, 
      high: 0, 
      medium: 0, 
      low: 0, 
      avgAttendance: stats.avgAttendance?.toFixed(1) || 0,
      // Data completion status
      dataCompletion: {
        exam_department: { completed: stats.examComplete, pending: stats.total - stats.examComplete },
        faculty: { completed: stats.facultyComplete, pending: stats.total - stats.facultyComplete },
        local_guardian: { completed: stats.guardianComplete, pending: stats.total - stats.guardianComplete },
        all_complete: stats.allComplete,
        pending_calculation: stats.total - stats.allComplete
      }
    };

    riskAgg.forEach((item) => {
      summary[item._id] = item.count;
    });

    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
}

/**
 * Recalculate risk for a student.
 */
async function recalculateRisk(req, res, next) {
  try {
    const { studentId } = req.params;
    console.log(`=== RECALCULATE RISK START ===`);
    console.log(`Recalculating risk for student: ${studentId}`);
    
    const student = await Student.findOne({ student_id: studentId });
    if (!student) {
      console.log(`Student ${studentId} not found`);
      return res.status(404).json({ success: false, error: "Not found" });
    }
    
    console.log(`Found student: ${student.name}, current risk: ${student.risk_level}`);

    const data = student.toObject();
    
    // Rule-based risk calculation
    const baseRisk = await riskCalculator.calculateRisk(data);

    // Get current config for pass criteria
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
      await config.save();
    }
    
    // Get all grades from detailed grade fields
    const allGrades = getAllGradesFromDetailedFields(data);
    const passCriteria = config.passCriteria || 60;
    
    // Prepare ML features with dynamic pass criteria
    const mlFeatures = {
      attendance_rate: data.attendance_rate || 0,
      avg_grade: allGrades.length > 0
        ? allGrades.reduce((sum, g) => sum + g.score, 0) / allGrades.length
        : 0,
      failing_count: allGrades.filter((g) => g.score < passCriteria).length,
      days_overdue: data.days_overdue || 0,
      attempts: 0, // Attempts removed from system
    };

    console.log(`Prepared ML features for ${data.student_id}:`, mlFeatures);

    // ML risk prediction
    let mlResult = { risk_level: "low", risk_score: 0 };
    try {
      console.log(`Recalculating ML risk for ${data.student_id} with features:`, mlFeatures);
      mlResult = await predictRisk(mlFeatures);
      console.log(`ML recalculation result for ${data.student_id}:`, mlResult);
      
      // Validate ML result
      if (!mlResult || !mlResult.risk_level) {
        console.error(`Invalid ML result for ${data.student_id}:`, mlResult);
        throw new Error("Invalid ML result");
      }
    } catch (error) {
      console.error(`ML recalculation failed for ${data.student_id}:`, error.message);
      console.error(`ML recalculation error details:`, error);
      // Use rule-based as fallback
      mlResult = { risk_level: baseRisk.risk_level, risk_score: baseRisk.risk_score };
    }

    // Combine ML and rule-based results
    const finalRisk = {
      risk_level: mlResult.risk_level || baseRisk.risk_level,
      risk_score: mlResult.risk_score || baseRisk.risk_score,
      risk_factors: baseRisk.risk_factors,
      explanation: baseRisk.explanation,
      recommendations: baseRisk.recommendations,
    };

    console.log(`Final recalculated risk for ${data.student_id}:`, finalRisk);

    // Update student with new risk data
    console.log(`Updating student ${data.student_id} with risk data:`, finalRisk);
    student.risk_level = finalRisk.risk_level;
    student.risk_score = finalRisk.risk_score;
    student.risk_factors = finalRisk.risk_factors;
    student.explanation = finalRisk.explanation;
    student.recommendations = finalRisk.recommendations;
    student.failed_subjects = mlFeatures.failing_count; // Add failed subjects count
    student.last_updated = new Date();
    
    console.log(`Student before save - risk_score: ${student.risk_score}`);
    await student.save();
    console.log(`Student after save - risk_score: ${student.risk_score}`);

    res.json({ success: true, student });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new action for a student
 */
async function createAction(req, res, next) {
  try {
    const { studentId } = req.params;
    const { description, counselor_notes, priority = "medium", due_date } = req.body;
    const { userId, role } = req.user;

    // Only counselors can create actions
    if (role !== "counselor") {
      return res.status(403).json({
        success: false,
        error: "Only counselors can create actions"
      });
    }

    const student = await Student.findOne({ student_id: studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    const action = {
      description,
      counselor_notes,
      priority,
      due_date: due_date ? new Date(due_date) : undefined,
      created_by: userId,
      status: "pending"
    };

    student.actions.push(action);
    await student.save();

    // Send email notification to parent/guardian
    try {
      await sendActionApprovalEmail(action, student, student.parent_email);
    } catch (emailError) {
      console.error('Failed to send action approval email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: "Action created successfully",
      action: student.actions[student.actions.length - 1]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an action (approve/reject by guardian)
 */
async function updateAction(req, res, next) {
  try {
    const { studentId, actionId } = req.params;
    const { status, rejection_reason } = req.body;
    const { userId, role } = req.user;

    // Only guardians can approve/reject actions
    if (role !== "local-guardian") {
      return res.status(403).json({
        success: false,
        error: "Only guardians can approve or reject actions"
      });
    }

    const student = await Student.findOne({ student_id: studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    const action = student.actions.id(actionId);
    if (!action) {
      return res.status(404).json({
        success: false,
        error: "Action not found"
      });
    }

    if (action.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Action has already been processed"
      });
    }

    action.status = status;
    action.approved_by = userId;
    action.last_updated = new Date();

    if (status === "rejected" && rejection_reason) {
      action.rejection_reason = rejection_reason;
    }

    await student.save();

    // Send email notification to counselor
    try {
      const counselor = await User.findById(action.created_by);
      if (counselor) {
        await sendActionStatusUpdateEmail(action, student, counselor.email);
      }
    } catch (emailError) {
      console.error('Failed to send action status update email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: `Action ${status} successfully`,
      action
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get actions for a student
 */
async function getActions(req, res, next) {
  try {
    const { studentId } = req.params;
    const { role, ward_student_id } = req.user;

    const student = await Student.findOne({ student_id: studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    // Guardians can only see actions for their ward
    if (role === "local-guardian" && studentId !== ward_student_id) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    res.json({
      success: true,
      actions: student.actions
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete exam data for a student (Exam Department only)
 */
async function deleteExamData(req, res, next) {
  try {
    const { studentId } = req.params;
    const { role } = req.user;

    // Only exam department can delete exam data
    if (role !== "exam-department") {
      return res.status(403).json({
        success: false,
        error: "Only exam department can delete exam data"
      });
    }

    const student = await Student.findOne({ student_id: studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    // Clear exam-related data
    student.grades = [];
    student.unit_test_1_grades = [];
    student.unit_test_2_grades = [];
    student.mid_sem_grades = [];
    student.end_sem_grades = [];
    student.academic_history = [];
    
    // Reset data completion status
    student.data_completion.exam_department = false;
    student.data_completion.last_updated = new Date();
    
    // Reset overall completion status
    student.data_complete = false;
    
    // Reset risk assessment since exam data is removed
    student.risk_level = "pending";
    student.risk_score = 0;
    student.risk_factors = [];
    student.explanation = [];
    student.recommendations = [];
    
    student.last_updated = new Date();
    await student.save();

    res.json({
      success: true,
      message: "Exam data deleted successfully",
      student: {
        student_id: student.student_id,
        name: student.name,
        data_completion: student.data_completion,
        data_complete: student.data_complete
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete attendance data for a student (Faculty only)
 */
async function deleteAttendanceData(req, res, next) {
  try {
    const { studentId } = req.params;
    const { role } = req.user;

    // Only faculty can delete attendance data
    if (role !== "faculty") {
      return res.status(403).json({
        success: false,
        error: "Only faculty can delete attendance data"
      });
    }

    const student = await Student.findOne({ student_id: studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    // Clear attendance data
    student.attendance_rate = 0;
    
    // Reset data completion status
    student.data_completion.faculty = false;
    student.data_completion.last_updated = new Date();
    
    // Reset overall completion status
    student.data_complete = false;
    
    // Reset risk assessment since attendance data is removed
    student.risk_level = "pending";
    student.risk_score = 0;
    student.risk_factors = [];
    student.explanation = [];
    student.recommendations = [];
    
    student.last_updated = new Date();
    await student.save();

    res.json({
      success: true,
      message: "Attendance data deleted successfully",
      student: {
        student_id: student.student_id,
        name: student.name,
        data_completion: student.data_completion,
        data_complete: student.data_complete
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete fees data for a student (Local Guardian only)
 */
async function deleteFeesData(req, res, next) {
  try {
    const { studentId } = req.params;
    const { role } = req.user;

    // Only local guardian can delete fees data
    if (role !== "local-guardian") {
      return res.status(403).json({
        success: false,
        error: "Only local guardian can delete fees data"
      });
    }

    const student = await Student.findOne({ student_id: studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    // Clear fees-related data
    student.fees_status = "Pending";
    student.amount_paid = 0;
    student.amount_due = 0;
    student.due_date = "";
    student.days_overdue = 0;
    
    // Reset data completion status
    student.data_completion.local_guardian = false;
    student.data_completion.last_updated = new Date();
    
    // Reset overall completion status
    student.data_complete = false;
    
    // Reset risk assessment since fees data is removed
    student.risk_level = "pending";
    student.risk_score = 0;
    student.risk_factors = [];
    student.explanation = [];
    student.recommendations = [];
    
    student.last_updated = new Date();
    await student.save();

    res.json({
      success: true,
      message: "Fees data deleted successfully",
      student: {
        student_id: student.student_id,
        name: student.name,
        data_completion: student.data_completion,
        data_complete: student.data_complete
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete entire student record - Only accessible by counselors
 */
async function deleteStudentRecord(req, res, next) {
  try {
    const { studentId } = req.params;
    const { role } = req.user;

    // Only counselors can delete entire student records
    if (role !== "counselor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only counselors can delete entire student records."
      });
    }

    // Find the student
    const student = await Student.findOne({ student_id: studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Store student info for response before deletion
    const deletedStudentInfo = {
      student_id: student.student_id,
      name: student.name,
      email: student.email
    };

    // Delete the entire student record
    await Student.deleteOne({ student_id: studentId });

    res.json({
      success: true,
      message: "Student record deleted successfully",
      deletedStudent: deletedStudentInfo
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete ALL student records - Only accessible by counselors
 */
async function deleteAllStudentRecords(req, res, next) {
  try {
    const { role } = req.user;

    // Only counselors can delete all student records
    if (role !== "counselor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only counselors can delete all student records."
      });
    }

    // Get count of students before deletion
    const studentCount = await Student.countDocuments();

    if (studentCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found to delete"
      });
    }

    // Delete all student records
    const result = await Student.deleteMany({});

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} student records`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete ALL student records from the database
 * Only accessible by counselors and exam-department
 */
async function deleteAllStudentRecords(req, res, next) {
  try {
    const result = await Student.deleteMany({});
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount || 0} student records`,
      deletedCount: result.deletedCount || 0
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Manually recalculate risk for all students (for testing)
 */
async function recalculateAllRisks(req, res, next) {
  try {
    console.log('🔄 Manual risk recalculation triggered...');
    
    // Find all students
    const students = await Student.find({});
    console.log(`Found ${students.length} students to recalculate`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const student of students) {
      try {
        console.log(`🔄 Processing ${student.student_id} (${student.name}) - Data Complete: ${student.data_complete}`);
        
        if (student.data_complete) {
          // Calculate new risk using updated settings
          const riskAssessment = await riskCalculator.calculateRisk(student.toObject());
          
          if (riskAssessment) {
            // Calculate failed subjects count
            const allGrades = getAllGradesFromDetailedFields(student.toObject());
            const config = await Config.findOne();
            const passCriteria = config?.passCriteria || 60;
            const failingCount = allGrades.filter(grade => grade.score < passCriteria).length;
            
            // Update student with new risk data
            student.risk_level = riskAssessment.risk_level;
            student.risk_score = riskAssessment.risk_score;
            student.risk_factors = riskAssessment.risk_factors;
            student.explanation = riskAssessment.explanation;
            student.recommendations = riskAssessment.recommendations;
            student.failed_subjects = failingCount; // Add failed subjects count
            student.last_updated = new Date();
            
            await student.save();
            successCount++;
            
            console.log(`✅ Updated risk for ${student.student_id}: ${riskAssessment.risk_level} (${riskAssessment.risk_score})`);
          } else {
            console.log(`⚠️ No risk assessment returned for ${student.student_id}`);
          }
        } else {
          // Clear risk data for incomplete students
          student.risk_level = "pending";
          student.risk_score = 0;
          student.risk_factors = [];
          student.explanation = [];
          student.recommendations = [];
          student.last_updated = new Date();
          
          await student.save();
          successCount++;
          
          console.log(`⏳ Cleared risk data for ${student.student_id} - data incomplete`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${student.student_id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`🔄 Manual risk recalculation completed: ${successCount} successful, ${errorCount} errors`);
    
    res.json({
      success: true,
      message: `Risk recalculation completed: ${successCount} successful, ${errorCount} errors`,
      results: { successCount, errorCount, total: students.length }
    });
    
  } catch (error) {
    console.error('❌ Error in recalculateAllRisks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getStudents,
  getStudentById,
  dashboardSummary,
  recalculateRisk,
  createAction,
  updateAction,
  getActions,
  deleteExamData,
  deleteAttendanceData,
  deleteFeesData,
  deleteStudentRecord,
  deleteAllStudentRecords,
  recalculateAllRisks,
};
