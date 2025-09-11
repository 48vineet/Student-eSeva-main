const mongoose = require("mongoose");

const GradeSchema = new mongoose.Schema({
  subject: String,
  score: Number,
  status: { type: String, enum: ["passing", "failing"] },
  date: { type: Date, default: Date.now },
});

const RecommendationSchema = new mongoose.Schema({
  action: String,
  description: String,
  urgency: { type: String, enum: ["immediate", "high", "medium", "low"] },
  completed: { type: Boolean, default: false },
  notes: String,
  date: { type: Date, default: Date.now },
});

const StudentSchema = new mongoose.Schema(
  {
    student_id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    parent_email: { type: String, required: true, trim: true, lowercase: true },
    class_year: String,
    major: String,
    attendance_rate: { type: Number, min: 0, max: 100, default: 0 },
    grades: [GradeSchema],
    fee_status: {
      type: String,
      enum: ["current", "pending", "overdue"],
      default: "current",
    },
    days_overdue: { type: Number, default: 0 },
    // subject_attempts removed from system
    risk_level: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    risk_score: { type: Number, min: 0, max: 100, default: 0 },
    risk_factors: [String],
    explanation: [String],
    recommendations: [RecommendationSchema],
    last_updated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", StudentSchema);
