const EmailAlert = require('../models/EmailAlert');
const Student = require('../models/Student');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

/**
 * Send email alert to high/medium risk students
 */
async function sendEmailAlert(req, res, next) {
  try {
    const { 
      studentId, 
      studentName, 
      studentEmail, 
      alertType, 
      priority, 
      subject, 
      message, 
      actionRequired, 
      actionDeadline, 
      followUpRequired, 
      followUpDate,
      sentByName,
      sentByRole
    } = req.body;
    const { userId, role, name } = req.user;

    // Validate that only counselors and faculty can send alerts
    if (!['counselor', 'faculty'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Only counselors and faculty can send email alerts'
      });
    }

    // Get student information
    const student = await Student.findOne({ student_id: studentId })
      .select('student_id name email risk_level risk_score attendance_rate fees_status');
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Check if student has high or medium risk
    if (!['high', 'medium'].includes(student.risk_level)) {
      return res.status(400).json({
        success: false,
        error: 'Email alerts can only be sent to high or medium risk students'
      });
    }

    // Validate priority matches risk level
    if (student.risk_level === 'high' && priority !== 'high') {
      return res.status(400).json({
        success: false,
        error: 'High risk students must receive high priority alerts'
      });
    }

    // Create email alert record
    const emailAlert = new EmailAlert({
      student_id: studentId,
      student_name: studentName || student.name,
      student_email: studentEmail || student.email || `${student.student_id}@student.edu`, // Fallback email
      sent_by: userId,
      sent_by_name: sentByName || name,
      sent_by_role: sentByRole || role,
      alert_type: alertType,
      priority: priority,
      subject: subject,
      message: message,
      risk_level: student.risk_level,
      risk_score: student.risk_score,
      action_required: actionRequired || false,
      action_deadline: actionDeadline,
      follow_up_required: followUpRequired || false,
      follow_up_date: followUpDate,
      status: 'pending'
    });

    await emailAlert.save();

    // Send email
    try {
      const emailData = {
        to: emailAlert.student_email,
        subject: `[${priority.toUpperCase()} PRIORITY] ${subject}`,
        template: 'alert',
        data: {
          studentName: student.name,
          senderName: name,
          senderRole: role,
          alertType: alertType,
          priority: priority,
          subject: subject,
          message: message,
          riskLevel: student.risk_level,
          riskScore: student.risk_score,
          attendanceRate: student.attendance_rate || 0,
          feesStatus: student.fees_status || 'unknown',
          actionRequired: actionRequired,
          actionDeadline: actionDeadline,
          followUpRequired: followUpRequired,
          followUpDate: followUpDate,
          sentAt: new Date().toLocaleString()
        }
      };

      await sendEmail(emailData);
      
      // Update alert status
      emailAlert.status = 'sent';
      emailAlert.delivered_at = new Date();
      await emailAlert.save();

      res.json({
        success: true,
        message: 'Email alert sent successfully',
        alert: emailAlert
      });

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Update alert status
      emailAlert.status = 'failed';
      emailAlert.failure_reason = emailError.message;
      await emailAlert.save();

      res.status(500).json({
        success: false,
        error: 'Failed to send email alert',
        details: emailError.message
      });
    }

  } catch (error) {
    next(error);
  }
}

/**
 * Get all email alerts sent by a user
 */
async function getEmailAlerts(req, res, next) {
  try {
    const { userId, role } = req.user;
    const { page = 1, limit = 10, status, priority, riskLevel } = req.query;

    // Build query
    const query = { sent_by: userId };
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (riskLevel) query.risk_level = riskLevel;

    // Get alerts with pagination
    const alerts = await EmailAlert.find(query)
      .sort({ sent_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await EmailAlert.countDocuments(query);

    res.json({
      success: true,
      alerts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Get email alerts for a specific student
 */
async function getStudentEmailAlerts(req, res, next) {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const alerts = await EmailAlert.find({ student_id: studentId })
      .sort({ sent_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await EmailAlert.countDocuments({ student_id: studentId });

    res.json({
      success: true,
      alerts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Get high and medium risk students eligible for email alerts
 */
async function getEligibleStudents(req, res, next) {
  try {
    const { role } = req.user;
    const { riskLevel, page = 1, limit = 20 } = req.query;

    // Only counselors and faculty can access this
    if (!['counselor', 'faculty'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Build query for high/medium risk students
    const query = {
      risk_level: { $in: ['high', 'medium'] },
      data_complete: true
    };

    if (riskLevel) {
      query.risk_level = riskLevel;
    }

    const students = await Student.find(query)
      .select('student_id name email risk_level risk_score attendance_rate avg_grade fees_status')
      .sort({ risk_score: -1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      students,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Update email alert status (for tracking delivery)
 */
async function updateAlertStatus(req, res, next) {
  try {
    const { alertId } = req.params;
    const { status, responseMessage } = req.body;

    const alert = await EmailAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    // Update status
    alert.status = status;
    if (responseMessage) {
      alert.response_received = true;
      alert.response_message = responseMessage;
      alert.response_date = new Date();
    }

    await alert.save();

    res.json({
      success: true,
      message: 'Alert status updated successfully',
      alert
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Get email alert statistics
 */
async function getAlertStatistics(req, res, next) {
  try {
    const { userId, role } = req.user;

    if (!['counselor', 'faculty'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const stats = await EmailAlert.aggregate([
      { $match: { sent_by: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          highRisk: { $sum: { $cond: [{ $eq: ['$risk_level', 'high'] }, 1, 0] } },
          mediumRisk: { $sum: { $cond: [{ $eq: ['$risk_level', 'medium'] }, 1, 0] } },
          withResponse: { $sum: { $cond: ['$response_received', 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      highPriority: 0,
      mediumPriority: 0,
      highRisk: 0,
      mediumRisk: 0,
      withResponse: 0
    };

    res.json({
      success: true,
      statistics: result
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendEmailAlert,
  getEmailAlerts,
  getStudentEmailAlerts,
  getEligibleStudents,
  updateAlertStatus,
  getAlertStatistics
};
