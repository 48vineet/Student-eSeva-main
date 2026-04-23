const Config = require("../models/Config");
const { generateForStudent } = require("./aiRecommendationService");

class RiskCalculator {
  constructor() {
    this.thresholds = {
      attendance: { critical: 75, warning: 85 },
      passCriteria: 60,
      failingSubjectsHigh: 2,
      failingSubjectsMedium: 1,
      overdueDaysHigh: 30,
    };
  }

  async loadConfig() {
    try {
      const config = await Config.findOne();
      if (config) {
        this.thresholds = {
          attendance: {
            critical: config.attendanceCritical,
            warning: config.attendanceWarning,
          },
          passCriteria: config.passCriteria,
          failingSubjectsHigh: config.failingHigh,
          failingSubjectsMedium: config.failingMedium,
          overdueDaysHigh: config.overdueDays,
        };
      }
    } catch (error) {
      console.error("Error loading config for risk calculator:", error);
    }
  }

  getAllGradesFromDetailedFields(data) {
    const allGrades = [];
    const gradeFields = [
      "unit_test_1_grades",
      "unit_test_2_grades",
      "mid_sem_grades",
      "end_sem_grades",
    ];

    gradeFields.forEach((field) => {
      if (data[field] && Array.isArray(data[field])) {
        data[field].forEach((grade) => {
          if (!grade.subject) return;

          const examType = field.replace("_grades", "");
          let score = null;

          if (examType === "unit_test_1" && grade.unit_test_1 !== undefined) {
            score = Number(grade.unit_test_1);
          } else if (
            examType === "unit_test_2" &&
            grade.unit_test_2 !== undefined
          ) {
            score = Number(grade.unit_test_2);
          } else if (examType === "mid_sem" && grade.mid_sem !== undefined) {
            score = Number(grade.mid_sem);
          } else if (examType === "end_sem" && grade.end_sem !== undefined) {
            score = Number(grade.end_sem);
          } else if (grade.score !== undefined) {
            score = Number(grade.score);
          }

          if (score !== null && !Number.isNaN(score)) {
            allGrades.push({ subject: grade.subject, score, examType });
          }
        });
      }
    });

    if (allGrades.length === 0 && data.grades && Array.isArray(data.grades)) {
      data.grades.forEach((grade) => {
        if (grade.subject && grade.score !== undefined) {
          const score = Number(grade.score);
          if (!Number.isNaN(score)) {
            allGrades.push({
              subject: grade.subject,
              score,
              examType: "basic",
            });
          }
        }
      });
    }

    return allGrades;
  }

  validateCompleteness(data, allGrades) {
    const reasons = [];

    const attendance = Number(data.attendance_rate);
    if (!Number.isFinite(attendance) || attendance < 0 || attendance > 100) {
      reasons.push("Attendance rate is missing or invalid");
    }

    if (!Array.isArray(allGrades) || allGrades.length === 0) {
      reasons.push("Academic grades are missing");
    }

    const feeStatus = data.fees_status || data.fee_status;
    if (!feeStatus) {
      reasons.push("Fee status is missing");
    }

    const overdueDays = Number(data.days_overdue);
    if (!Number.isFinite(overdueDays) || overdueDays < 0) {
      reasons.push("Days overdue is missing or invalid");
    }

    if (data.data_completion) {
      if (!data.data_completion.exam_department) {
        reasons.push("Exam department data not complete");
      }
      if (!data.data_completion.faculty) {
        reasons.push("Faculty data not complete");
      }
      if (!data.data_completion.local_guardian) {
        reasons.push("Local guardian data not complete");
      }
    }

    return reasons;
  }

  async calculateRisk(data) {
    await this.loadConfig();

    const allGrades = this.getAllGradesFromDetailedFields(data);
    const missingReasons = this.validateCompleteness(data, allGrades);

    if (missingReasons.length > 0) {
      return {
        risk_level: "pending",
        risk_score: 0,
        risk_factors: ["incomplete_data"],
        explanation: [
          "Risk calculation skipped because required data is incomplete.",
          ...missingReasons,
        ],
        recommendations: [
          {
            action: "Complete missing uploads",
            description:
              "Upload attendance, exam, and fees data before risk scoring.",
            urgency: "high",
          },
        ],
        failed_subjects: 0,
        data_complete_for_risk: false,
        missing_data_reasons: missingReasons,
        calculation_log: [
          {
            step: "completeness_check",
            points: 0,
            running_total: 0,
            details: `Missing data: ${missingReasons.join("; ")}`,
          },
        ],
      };
    }

    let score = 0;
    const factors = [];
    const calculationLog = [];

    const addStep = (step, points, details, factor = null) => {
      score += points;
      if (factor) {
        factors.push(factor);
      }
      calculationLog.push({
        step,
        points,
        running_total: Math.min(score, 100),
        details,
      });
    };

    const attendance = Number(data.attendance_rate);
    if (attendance < this.thresholds.attendance.critical) {
      addStep(
        "attendance_critical",
        40,
        `Attendance ${attendance}% < critical threshold ${this.thresholds.attendance.critical}%`,
        "critical_attendance",
      );
    } else if (attendance < this.thresholds.attendance.warning) {
      addStep(
        "attendance_warning",
        20,
        `Attendance ${attendance}% < warning threshold ${this.thresholds.attendance.warning}%`,
        "low_attendance",
      );
    } else {
      addStep(
        "attendance_ok",
        0,
        `Attendance ${attendance}% is within safe range`,
      );
    }

    const passCriteria = this.thresholds.passCriteria || 60;
    const failingCount = allGrades.filter(
      (grade) => Number(grade.score) < passCriteria,
    ).length;

    if (failingCount >= this.thresholds.failingSubjectsHigh) {
      addStep(
        "academic_multiple_failures",
        35,
        `Failing ${failingCount}/${allGrades.length} subjects (>= ${this.thresholds.failingSubjectsHigh})`,
        "multiple_failures",
      );
    } else if (failingCount >= this.thresholds.failingSubjectsMedium) {
      addStep(
        "academic_single_failure",
        15,
        `Failing ${failingCount}/${allGrades.length} subjects (>= ${this.thresholds.failingSubjectsMedium})`,
        "single_failure",
      );
    } else {
      addStep(
        "academic_ok",
        0,
        `Failing ${failingCount}/${allGrades.length} subjects below risk thresholds`,
      );
    }

    const feeStatus = String(
      data.fees_status || data.fee_status || "",
    ).toLowerCase();
    const overdueDays = Number(data.days_overdue);

    if (
      feeStatus === "overdue" &&
      overdueDays >= this.thresholds.overdueDaysHigh
    ) {
      addStep(
        "fees_overdue_high",
        25,
        `Fees overdue for ${overdueDays} days (>= ${this.thresholds.overdueDaysHigh})`,
        "financial_stress",
      );
    } else if (feeStatus === "pending" || feeStatus === "due") {
      addStep(
        "fees_pending",
        10,
        `Fee status is ${feeStatus} with ${overdueDays} overdue days`,
        "pending_fees",
      );
    } else {
      addStep(
        "fees_ok",
        0,
        `Fee status is ${feeStatus || "unknown"} with ${overdueDays} overdue days`,
      );
    }

    const finalScore = Math.min(Math.max(score, 0), 100);
    const level =
      finalScore >= 60 ? "high" : finalScore >= 30 ? "medium" : "low";

    addStep(
      "final_classification",
      0,
      `Final score ${finalScore} mapped to ${level.toUpperCase()} risk`,
    );

    const aiContent = await generateForStudent({
      student: data,
      risk: {
        risk_level: level,
        risk_score: finalScore,
        risk_factors: factors,
        failed_subjects: failingCount,
        calculation_log: calculationLog,
      },
    });

    return {
      risk_level: level,
      risk_score: finalScore,
      risk_factors: factors,
      explanation: aiContent.explanation,
      recommendations: aiContent.recommendations,
      failed_subjects: failingCount,
      data_complete_for_risk: true,
      missing_data_reasons: [],
      calculation_log: calculationLog,
      ai_meta: aiContent.ai_meta,
    };
  }
}

module.exports = new RiskCalculator();
