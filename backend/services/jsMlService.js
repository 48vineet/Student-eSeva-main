const { Matrix } = require('ml-matrix');
const Config = require("../models/Config");

/**
 * JavaScript ML Service - Replaces Python ML service
 * Implements the same risk prediction logic as the Python version with dynamic configuration
 */

class JSRiskPredictor {
  constructor() {
    this.weights = {
      attendance: 0.4,
      grade: 0.3,
      failures: 25,
      overdue: 0.1
    };
    
    this.thresholds = {
      high: 25,
      medium: 10
    };
  }

  /**
   * Load configuration from database
   */
  async loadConfig() {
    try {
      const config = await Config.findOne();
      if (config) {
        this.weights = {
          attendance: config.attendanceWeight || 0.4,
          grade: config.academicWeight || 0.3,
          failures: 25,
          overdue: config.financialWeight || 0.1
        };
        
        // Set thresholds to match rule-based calculator structure
        this.thresholds = {
          attendance: { 
            critical: config.attendanceCritical, 
            warning: config.attendanceWarning 
          },
          passCriteria: config.passCriteria,
          failingSubjectsHigh: config.failingHigh,
          failingSubjectsMedium: config.failingMedium,
          overdueDaysHigh: config.overdueDays,
        };
        
        console.log('JS ML Service loaded dynamic config:', { weights: this.weights, thresholds: this.thresholds });
        return config;
      }
    } catch (error) {
      console.error('Error loading config for JS ML service:', error);
    }
    return null;
  }

  /**
   * Calculate risk score based on features
   * @param {Object} features - Student features
   * @returns {Object} Risk prediction result
   */
  async predictRisk(features) {
    try {
      // Load latest configuration before predicting
      const config = await this.loadConfig();
      const { attendance_rate, avg_grade, failing_count, days_overdue, attempts } = features;
      
      // Calculate risk score using rule-based logic with dynamic weights
      let score = 0;
      
      // Attendance scoring (same as rule-based calculator)
      if (attendance_rate < this.thresholds.attendance.critical) {
        score += 40 * this.weights.attendance;
      } else if (attendance_rate < this.thresholds.attendance.warning) {
        score += 20 * this.weights.attendance;
      }
      
      // Academic performance scoring
      if (failing_count >= this.thresholds.failingSubjectsHigh) {
        score += 35 * this.weights.grade;
      } else if (failing_count >= this.thresholds.failingSubjectsMedium) {
        score += 15 * this.weights.grade;
      }
      
      // Financial scoring
      if (days_overdue >= this.thresholds.overdueDaysHigh) {
        score += 25 * this.weights.overdue;
      } else if (days_overdue > 0) {
        score += 10 * this.weights.overdue;
      }
      
      // Attempt exhaustion scoring removed from system
      
      // Determine risk level based on score (same as rule-based calculator)
      let risk_level;
      let probabilities;
      
      if (score >= 60) {
        risk_level = 'high';
        probabilities = {
          high: Math.min(0.99, score / 100),
          medium: Math.max(0.01, (score - 60) / 40 * 0.3),
          low: Math.max(0.01, 1 - (score / 100))
        };
      } else if (score >= 30) {
        risk_level = 'medium';
        probabilities = {
          medium: Math.min(0.95, (score - 30) / 30),
          high: Math.max(0.05, (score - 30) / 30 * 0.3),
          low: Math.max(0.05, 1 - (score / 60))
        };
      } else {
        risk_level = 'low';
        probabilities = {
          low: Math.min(0.95, 1 - (score / 30)),
          medium: Math.max(0.05, score / 30 * 0.3),
          high: Math.max(0.01, score / 60 * 0.1)
        };
      }
      
      // Ensure probabilities sum to 1
      const totalProb = Object.values(probabilities).reduce((sum, prob) => sum + prob, 0);
      Object.keys(probabilities).forEach(key => {
        probabilities[key] = Math.round((probabilities[key] / totalProb) * 100) / 100;
      });
      
      const risk_score = Math.round(score * 100) / 100;
      
      return {
        risk_level,
        risk_score,
        probabilities
      };
      
    } catch (error) {
      console.error('JS ML Service error:', error);
      return {
        risk_level: 'low',
        risk_score: 0,
        probabilities: { low: 1.0, high: 0.0 }
      };
    }
  }
}

// Create singleton instance
const jsRiskPredictor = new JSRiskPredictor();

/**
 * Predict risk using JavaScript ML service
 * @param {Object} features - Student features
 * @returns {Object} Risk prediction result
 */
async function predictRisk(features) {
  try {
    console.log('JS ML Service received features:', features);
    
    const result = await jsRiskPredictor.predictRisk(features);
    
    console.log('JS ML Service prediction:', result);
    
    return result;
    
  } catch (error) {
    console.error('JS ML Service error:', error);
    return {
      risk_level: 'low',
      risk_score: 0,
      probabilities: { low: 1.0, high: 0.0 }
    };
  }
}

module.exports = { predictRisk };
