const Config = require("../models/Config");

/**
 * Transparent rule-based risk calculator with dynamic configuration
 */

class RiskCalculator {
  constructor() {
    this.thresholds = {
      attendance: { critical: 75, warning: 85 },
      failingSubjectsHigh: 2,
      failingSubjectsMedium: 1,
      overdueDaysHigh: 30,
      maxAttempts: 3,
    };
  }

  /**
   * Load configuration from database
   */
  async loadConfig() {
    try {
      const config = await Config.findOne();
      if (config) {
        this.thresholds = {
          attendance: { 
            critical: config.attendanceCritical, 
            warning: config.attendanceWarning 
          },
          passCriteria: config.passCriteria,
          failingSubjectsHigh: config.failingHigh,
          failingSubjectsMedium: config.failingMedium,
          overdueDaysHigh: config.overdueDays,
          maxAttempts: config.maxAttempts,
        };
        console.log('Risk calculator loaded dynamic config:', this.thresholds);
      }
    } catch (error) {
      console.error('Error loading config for risk calculator:', error);
    }
  }

  /**
   * Calculate risk assessment for a student
   * @param {Object} data Student data
   * @returns {Object} risk_level, risk_score, risk_factors, explanation, recommendations
   */
  async calculateRisk(data) {
    // Load latest configuration before calculating
    await this.loadConfig();
    let score = 0;
    const factors = [];
    const explanation = [];
    const recs = [];

    // Attendance rules
    if (data.attendance_rate < this.thresholds.attendance.critical) {
      score += 40;
      factors.push("critical_attendance");
      explanation.push(
        `Attendance ${data.attendance_rate}% below ${this.thresholds.attendance.critical}%`
      );
      recs.push({
        action: "Schedule attendance meeting",
        urgency: "immediate",
      });
    } else if (data.attendance_rate < this.thresholds.attendance.warning) {
      score += 20;
      factors.push("low_attendance");
      explanation.push(
        `Attendance ${data.attendance_rate}% below ${this.thresholds.attendance.warning}%`
      );
      recs.push({ action: "Monitor attendance", urgency: "high" });
    }

    // Academic performance rules - recalculate failing count with dynamic pass criteria
    const failingCount = (data.grades || []).filter(
      (g) => g.score < (this.thresholds.passCriteria || 60)
    ).length;
    if (failingCount >= this.thresholds.failingSubjectsHigh) {
      score += 35;
      factors.push("multiple_failures");
      explanation.push(`Failing ${failingCount} subjects`);
      recs.push({ action: "Create academic plan", urgency: "immediate" });
    } else if (failingCount >= this.thresholds.failingSubjectsMedium) {
      score += 15;
      factors.push("single_failure");
      explanation.push(`Failing ${failingCount} subject`);
      recs.push({ action: "Provide tutoring", urgency: "high" });
    }

    // Fee payment rules
    if (
      data.fee_status === "overdue" &&
      data.days_overdue >= this.thresholds.overdueDaysHigh
    ) {
      score += 25;
      factors.push("financial_stress");
      explanation.push(`Fees overdue ${data.days_overdue} days`);
      recs.push({ action: "Financial counseling", urgency: "immediate" });
    } else if (data.fee_status === "pending") {
      score += 10;
      factors.push("pending_fees");
      explanation.push("Fees pending");
      recs.push({ action: "Send fee reminder", urgency: "medium" });
    }

    // Attempt exhaustion rules removed from system

    // Determine level
    const level = score >= 60 ? "high" : score >= 30 ? "medium" : "low";

    return {
      risk_level: level,
      risk_score: Math.min(score, 100),
      risk_factors: factors,
      explanation,
      recommendations: recs,
    };
  }
}

module.exports = new RiskCalculator();
