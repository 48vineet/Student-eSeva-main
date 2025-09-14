const mongoose = require("mongoose");

const GradeSchema = new mongoose.Schema({
  subject: String,
  score: Number,
  status: { type: String, enum: ["passing", "failing"] },
  date: { type: Date, default: Date.now },
});

// Enhanced grade schema for detailed academic tracking
const DetailedGradeSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  unit_test_1: { type: Number, min: 0, max: 100 },
  unit_test_2: { type: Number, min: 0, max: 100 },
  mid_sem: { type: Number, min: 0, max: 100 },
  end_sem: { type: Number, min: 0, max: 100 },
  final_grade: { type: Number, min: 0, max: 100 },
  semester: { type: String, required: true },
  academic_year: { type: String, required: true },
  last_updated: { type: Date, default: Date.now },
});

// Academic history schema for semester-wise tracking
const AcademicHistorySchema = new mongoose.Schema({
  semester: { type: String, required: true },
  academic_year: { type: String, required: true },
  subjects: [DetailedGradeSchema],
  overall_gpa: { type: Number, min: 0, max: 10 },
  attendance_rate: { type: Number, min: 0, max: 100 },
  risk_level: { type: String, enum: ["low", "medium", "high"], default: "low" },
  created_at: { type: Date, default: Date.now },
});

const RecommendationSchema = new mongoose.Schema({
  action: String,
  description: String,
  urgency: { type: String, enum: ["immediate", "high", "medium", "low"] },
  completed: { type: Boolean, default: false },
  notes: String,
  date: { type: Date, default: Date.now },
});

// Action tracking schema for parent/guardian approval workflow
const ActionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ["meeting", "counseling", "academic_support", "attendance", "fees", "general"], 
    default: "general" 
  },
  description: { type: String, required: true },
  counselor_notes: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  },
  rejection_reason: { type: String, default: "" },
  created_by: { type: String, required: true }, // counselor user_id
  approved_by: { type: String, default: "" }, // parent/guardian user_id
  last_updated: { type: Date, default: Date.now },
  due_date: { type: Date },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"], 
    default: "medium" 
  },
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
    // Enhanced academic tracking
    academic_history: [AcademicHistorySchema],
    current_semester: { type: String, default: "1" },
    current_academic_year: { type: String, default: new Date().getFullYear().toString() },
    // Grade progression tracking for current semester
    unit_test_1_grades: [DetailedGradeSchema],
    unit_test_2_grades: [DetailedGradeSchema],
    mid_sem_grades: [DetailedGradeSchema],
    end_sem_grades: [DetailedGradeSchema],
    fee_status: {
      type: String,
      enum: ["current", "pending", "overdue"],
      default: "current",
    },
    // New fees status fields for local guardian
    fees_status: {
      type: String,
      enum: ["Complete", "Partial", "Due", "Overdue", "Pending"],
      default: "Pending",
    },
    amount_paid: { type: Number, default: 0 },
    amount_due: { type: Number, default: 0 },
    due_date: { type: String, default: "" },
    days_overdue: { type: Number, default: 0 },
    // subject_attempts removed from system
    risk_level: {
      type: String,
      enum: ["low", "medium", "high", "pending"],
      default: "pending",
    },
    risk_score: { type: Number, min: 0, max: 100, default: 0 },
    risk_factors: [String],
    explanation: [String],
    recommendations: [RecommendationSchema],
    // Action tracking for parent/guardian approval workflow
    actions: [ActionSchema],
    // Data completion tracking
    data_completion: {
      exam_department: { type: Boolean, default: false },
      faculty: { type: Boolean, default: false },
      local_guardian: { type: Boolean, default: false },
      last_updated: { type: Date, default: Date.now }
    },
    // Overall data completion status
    data_complete: { type: Boolean, default: false },
    last_updated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", StudentSchema);
