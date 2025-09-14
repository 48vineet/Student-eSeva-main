const mongoose = require('mongoose');

const EmailAlertSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: true,
    ref: 'Student'
  },
  student_name: {
    type: String,
    required: true
  },
  student_email: {
    type: String,
    required: true
  },
  sent_by: {
    type: String,
    required: true,
    ref: 'User'
  },
  sent_by_name: {
    type: String,
    required: true
  },
  sent_by_role: {
    type: String,
    required: true,
    enum: ['counselor', 'faculty']
  },
  alert_type: {
    type: String,
    required: true,
    enum: ['risk_alert', 'academic_concern', 'attendance_issue', 'behavioral_concern', 'general']
  },
  priority: {
    type: String,
    required: true,
    enum: ['high', 'medium'],
    default: 'medium'
  },
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  risk_level: {
    type: String,
    required: true,
    enum: ['high', 'medium']
  },
  risk_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed', 'pending'],
    default: 'pending'
  },
  sent_at: {
    type: Date,
    default: Date.now
  },
  delivered_at: {
    type: Date
  },
  failure_reason: {
    type: String
  },
  action_required: {
    type: Boolean,
    default: false
  },
  action_deadline: {
    type: Date
  },
  follow_up_required: {
    type: Boolean,
    default: false
  },
  follow_up_date: {
    type: Date
  },
  response_received: {
    type: Boolean,
    default: false
  },
  response_message: {
    type: String
  },
  response_date: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
EmailAlertSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Index for efficient queries
EmailAlertSchema.index({ student_id: 1, sent_at: -1 });
EmailAlertSchema.index({ sent_by: 1, sent_at: -1 });
EmailAlertSchema.index({ status: 1, sent_at: -1 });
EmailAlertSchema.index({ risk_level: 1, priority: 1 });

module.exports = mongoose.model('EmailAlert', EmailAlertSchema);
