// Use JavaScript ML service instead of Python service
const { predictRisk: jsPredictRisk } = require("./jsMlService");

/**
 * Call ML service to get risk prediction.
 * @param {Object} features attendance_rate, avg_grade, failing_count, days_overdue, attempts
 */
async function predictRisk(features) {
  try {
    console.log(`Calling JavaScript ML service with features:`, features);
    const result = await jsPredictRisk(features);
    console.log(`JavaScript ML service response:`, result);
    return result;
  } catch (err) {
    console.error("JavaScript ML service error:", err.message);
    console.error("JavaScript ML service error details:", err);
    // Fallback to low risk
    return { risk_level: "low", risk_score: 0, probabilities: {} };
  }
}

module.exports = { predictRisk };
