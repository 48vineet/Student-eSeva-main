const Student = require("../models/Student");
const riskCalculator = require("../services/riskCalculator");
const { predictRisk } = require("../services/mlService");
const Config = require("../models/Config");

/**
 * Get paginated list of students, optional risk_level filter.
 */
async function getStudents(req, res, next) {
  try {
    const { risk_level, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (risk_level) filter.risk_level = risk_level;

    const skip = (page - 1) * limit;
    const students = await Student.find(filter)
      .sort({ last_updated: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

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
 * Dashboard summary: counts and average attendance.
 */
async function dashboardSummary(req, res, next) {
  try {
    const summaryAgg = await Student.aggregate([
      {
        $group: {
          _id: "$risk_level",
          count: { $sum: 1 },
          avgAttendance: { $avg: "$attendance_rate" },
        },
      },
    ]);

    const summary = { total: 0, high: 0, medium: 0, low: 0, avgAttendance: 0 };
    let totalAttendance = 0;

    summaryAgg.forEach((item) => {
      summary[item._id] = item.count;
      summary.total += item.count;
      totalAttendance += item.avgAttendance * item.count;
    });

    summary.avgAttendance =
      summary.total > 0 ? (totalAttendance / summary.total).toFixed(1) : 0;

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

module.exports = {
  getStudents,
  getStudentById,
  dashboardSummary,
  recalculateRisk,
};
