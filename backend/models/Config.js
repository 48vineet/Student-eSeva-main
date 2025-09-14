const mongoose = require("mongoose");

const configSchema = new mongoose.Schema({
  // Attendance thresholds
  attendanceCritical: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 75
  },
  attendanceWarning: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 85
  },
  
  // Academic performance thresholds
  passCriteria: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 60
  },
  failingHigh: {
    type: Number,
    required: true,
    min: 1,
    max: 20,
    default: 2
  },
  failingMedium: {
    type: Number,
    required: true,
    min: 1,
    max: 20,
    default: 1
  },
  
  // Financial thresholds
  overdueDays: {
    type: Number,
    required: true,
    min: 1,
    max: 365,
    default: 30
  },
  
  
  // Additional configurable fields
  institutionName: {
    type: String,
    default: "Student eSeva Institution"
  },
  
  academicYear: {
    type: String,
    default: new Date().getFullYear().toString()
  },
  
  semester: {
    type: String,
    enum: ["1", "2", "3", "4", "5", "6", "7", "8", "Summer", "Winter"],
    default: "1"
  },
  
  // Notification settings
  emailNotifications: {
    type: Boolean,
    default: true
  },
  
  smsNotifications: {
    type: Boolean,
    default: false
  },
  
  // Email notification thresholds
  emailStudentRiskLevels: {
    type: [String],
    enum: ["low", "medium", "high"],
    default: ["medium", "high"]
  },
  
  emailParentRiskLevels: {
    type: [String],
    enum: ["low", "medium", "high"],
    default: ["medium", "high"]
  },
  
  // Email frequency settings
  emailFrequency: {
    type: String,
    enum: ["immediate", "daily", "weekly"],
    default: "immediate"
  },
  
  // Email content settings
  includeDetailedGrades: {
    type: Boolean,
    default: true
  },
  
  includeRecommendations: {
    type: Boolean,
    default: true
  },
  
  // Risk calculation weights (for advanced configuration)
  attendanceWeight: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.4
  },
  
  academicWeight: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.4
  },
  
  financialWeight: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.2
  },
  
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  updatedBy: {
    type: String,
    default: "system"
  }
}, {
  timestamps: true
});

// Ensure only one configuration document exists
configSchema.index({}, { unique: true });

module.exports = mongoose.model("Config", configSchema);
