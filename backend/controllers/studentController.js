const Student = require("../models/Student");
const User = require("../models/User");
const riskCalculator = require("../services/riskCalculator");
const { predictRisk } = require("../services/mlService");
const Config = require("../models/Config");
const { sendActionApprovalEmail, sendActionStatusUpdateEmail } = require("../services/emailService");

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
      
      // Only Faculty, Counselor, and Local Guardian can see risk assessment
      if (!["faculty", "counselor", "local-guardian"].includes(role)) {
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
    
    // Only Faculty, Counselor, and Local Guardian can see risk assessment summary
    if (!["faculty", "counselor", "local-guardian"].includes(role)) {
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
    
    // Prepare ML features with dynamic pass criteria
    const mlFeatures = {
      attendance_rate: data.attendance_rate || 0,
      avg_grade: data.grades && data.grades.length
        ? data.grades.reduce((sum, g) => sum + g.score, 0) / data.grades.length
        : 0,
      failing_count: data.grades ? data.grades.filter((g) => g.score < (config.passCriteria || 60)).length : 0,
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
      mlResult = { risk_level: baseRisk.risk_level, risk_score: baseRisk.score };
    }

    // Combine ML and rule-based results
    const finalRisk = {
      risk_level: mlResult.risk_level || baseRisk.risk_level,
      risk_score: mlResult.risk_score || baseRisk.score,
      risk_factors: baseRisk.risk_factors,
      explanation: baseRisk.explanation,
      recommendations: baseRisk.recommendations,
    };

    console.log(`Final recalculated risk for ${data.student_id}:`, finalRisk);

    // Update student with new risk data
    student.risk_level = finalRisk.risk_level;
    student.risk_score = finalRisk.risk_score;
    student.risk_factors = finalRisk.risk_factors;
    student.explanation = finalRisk.explanation;
    student.recommendations = finalRisk.recommendations;
    student.last_updated = new Date();
    await student.save();

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

module.exports = {
  getStudents,
  getStudentById,
  dashboardSummary,
  recalculateRisk,
  createAction,
  updateAction,
  getActions,
};
