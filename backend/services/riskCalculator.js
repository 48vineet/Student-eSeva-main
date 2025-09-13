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
   * Calculate risk assessment for a student with enhanced grade progression analysis
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

    // Enhanced academic performance analysis with grade progression
    const academicAnalysis = this.analyzeAcademicPerformance(data);
    score += academicAnalysis.score;
    factors.push(...academicAnalysis.factors);
    explanation.push(...academicAnalysis.explanations);
    recs.push(...academicAnalysis.recommendations);

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

  /**
   * Analyze academic performance with grade progression tracking
   * @param {Object} data Student data
   * @returns {Object} Analysis results
   */
  analyzeAcademicPerformance(data) {
    let score = 0;
    const factors = [];
    const explanations = [];
    const recommendations = [];

    // Traditional failing count analysis
    const failingCount = (data.grades || []).filter(
      (g) => g.score < (this.thresholds.passCriteria || 60)
    ).length;

    if (failingCount >= this.thresholds.failingSubjectsHigh) {
      score += 35;
      factors.push("multiple_failures");
      explanations.push(`Failing ${failingCount} subjects`);
      recommendations.push({ action: "Create academic plan", urgency: "immediate" });
    } else if (failingCount >= this.thresholds.failingSubjectsMedium) {
      score += 15;
      factors.push("single_failure");
      explanations.push(`Failing ${failingCount} subject`);
      recommendations.push({ action: "Provide tutoring", urgency: "high" });
    }

    // Enhanced grade progression analysis
    const progressionAnalysis = this.analyzeGradeProgression(data);
    score += progressionAnalysis.score;
    factors.push(...progressionAnalysis.factors);
    explanations.push(...progressionAnalysis.explanations);
    recommendations.push(...progressionAnalysis.recommendations);

    return {
      score,
      factors,
      explanations,
      recommendations
    };
  }

  /**
   * Analyze grade progression across different exams
   * @param {Object} data Student data
   * @returns {Object} Progression analysis results
   */
  analyzeGradeProgression(data) {
    let score = 0;
    const factors = [];
    const explanations = [];
    const recommendations = [];

    // Check if we have detailed grade progression data
    const hasDetailedGrades = data.unit_test_1_grades && data.unit_test_2_grades && 
                             data.mid_sem_grades && data.end_sem_grades;

    if (!hasDetailedGrades) {
      return { score: 0, factors: [], explanations: [], recommendations: [] };
    }

    // Analyze progression for each subject
    const subjects = this.getUniqueSubjects(data);
    let decliningSubjects = 0;
    let improvingSubjects = 0;

    subjects.forEach(subject => {
      const progression = this.calculateSubjectProgression(data, subject);
      
      if (progression.trend === 'declining') {
        decliningSubjects++;
        factors.push(`declining_performance_${subject}`);
        explanations.push(`${subject}: Declining from ${progression.start} to ${progression.end} (${progression.decline}% drop)`);
      } else if (progression.trend === 'improving') {
        improvingSubjects++;
      }
    });

    // Risk scoring based on declining performance
    if (decliningSubjects > 0) {
      const declineRatio = decliningSubjects / subjects.length;
      
      if (declineRatio >= 0.5) { // 50% or more subjects declining
        score += 30;
        factors.push("severe_grade_decline");
        explanations.push(`${decliningSubjects} out of ${subjects.length} subjects showing declining performance`);
        recommendations.push({ 
          action: "Immediate academic intervention required", 
          urgency: "immediate" 
        });
      } else if (declineRatio >= 0.25) { // 25% or more subjects declining
        score += 20;
        factors.push("moderate_grade_decline");
        explanations.push(`${decliningSubjects} out of ${subjects.length} subjects showing declining performance`);
        recommendations.push({ 
          action: "Schedule academic counseling session", 
          urgency: "high" 
        });
      } else {
        score += 10;
        factors.push("mild_grade_decline");
        explanations.push(`${decliningSubjects} out of ${subjects.length} subjects showing declining performance`);
        recommendations.push({ 
          action: "Monitor academic performance closely", 
          urgency: "medium" 
        });
      }
    }

    // Bonus for improving performance
    if (improvingSubjects > decliningSubjects && improvingSubjects > 0) {
      score = Math.max(0, score - 5); // Slight reduction for overall improvement
      factors.push("improving_performance");
      explanations.push(`${improvingSubjects} subjects showing improvement`);
    }

    return {
      score,
      factors,
      explanations,
      recommendations
    };
  }

  /**
   * Get unique subjects from grade data
   * @param {Object} data Student data
   * @returns {Array} List of unique subjects
   */
  getUniqueSubjects(data) {
    const subjects = new Set();
    
    [data.unit_test_1_grades, data.unit_test_2_grades, 
     data.mid_sem_grades, data.end_sem_grades].forEach(gradeSet => {
      if (gradeSet) {
        gradeSet.forEach(grade => {
          if (grade.subject) {
            subjects.add(grade.subject);
          }
        });
      }
    });
    
    return Array.from(subjects);
  }

  /**
   * Calculate progression trend for a specific subject
   * @param {Object} data Student data
   * @param {String} subject Subject name
   * @returns {Object} Progression analysis
   */
  calculateSubjectProgression(data, subject) {
    const grades = [
      this.getSubjectGrade(data.unit_test_1_grades, subject),
      this.getSubjectGrade(data.unit_test_2_grades, subject),
      this.getSubjectGrade(data.mid_sem_grades, subject),
      this.getSubjectGrade(data.end_sem_grades, subject)
    ].filter(grade => grade !== null);

    if (grades.length < 2) {
      return { trend: 'insufficient_data', start: 0, end: 0, decline: 0 };
    }

    const start = grades[0];
    const end = grades[grades.length - 1];
    const decline = start - end;
    const declinePercentage = (decline / start) * 100;

    let trend = 'stable';
    if (declinePercentage > 15) { // More than 15% decline
      trend = 'declining';
    } else if (declinePercentage < -10) { // More than 10% improvement
      trend = 'improving';
    }

    return {
      trend,
      start,
      end,
      decline: declinePercentage
    };
  }

  /**
   * Get grade for a specific subject from a grade set
   * @param {Array} gradeSet Array of grades
   * @param {String} subject Subject name
   * @returns {Number|null} Grade score or null if not found
   */
  getSubjectGrade(gradeSet, subject) {
    if (!gradeSet) return null;
    
    const grade = gradeSet.find(g => g.subject === subject);
    return grade ? grade.score : null;
  }
}

module.exports = new RiskCalculator();
