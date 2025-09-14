const transporter = require("../config/mailer");
const { emailConfig } = require("../config/env");

/**
 * Send an email
 * @param {string|Object} to Recipient email or email data object
 * @param {string} subject Email subject (if to is string)
 * @param {string} html HTML content (if to is string)
 */
async function sendEmail(to, subject, html) {
  // Support both old format and new object format
  if (typeof to === 'object') {
    const { to: recipient, subject: emailSubject, template, data } = to;
    
    if (template === 'alert') {
      return sendAlertEmail(recipient, emailSubject, data);
    }
    
    return transporter.sendMail({
      from: emailConfig.user,
      to: recipient,
      subject: emailSubject,
      html: data.html || '',
    });
  }
  
  return transporter.sendMail({
    from: emailConfig.user,
    to,
    subject,
    html,
  });
}

/**
 * Send action approval request email to parent/guardian
 * @param {Object} action Action object
 * @param {Object} student Student object
 * @param {string} parentEmail Parent/guardian email
 */
async function sendActionApprovalEmail(action, student, parentEmail) {
  const subject = `Action Required: ${action.description}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Action Approval Required</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .action-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .priority-high { border-left: 4px solid #dc3545; }
        .priority-medium { border-left: 4px solid #ffc107; }
        .priority-low { border-left: 4px solid #28a745; }
        .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .btn-danger { background: #dc3545; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Student Early Warning System</h2>
          <p>Action Approval Required for ${student.name}</p>
        </div>
        
        <div class="content">
          <h3>Dear Parent/Guardian,</h3>
          
          <p>A new action has been recommended for your ward <strong>${student.name}</strong> (Student ID: ${student.student_id}) and requires your approval.</p>
          
          <div class="action-box priority-${action.priority}">
            <h4>Action Details:</h4>
            <p><strong>Description:</strong> ${action.description}</p>
            <p><strong>Counselor Notes:</strong> ${action.counselor_notes}</p>
            <p><strong>Priority:</strong> <span style="text-transform: capitalize;">${action.priority}</span></p>
            ${action.due_date ? `<p><strong>Due Date:</strong> ${new Date(action.due_date).toLocaleDateString()}</p>` : ''}
          </div>
          
          <p>Please log in to the system to review and approve or reject this action:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn">Login to Review Action</a>
          </div>
          
          <p><strong>Note:</strong> This action is currently pending your approval. Please review it carefully and take appropriate action.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from the Student Early Warning System. Please do not reply to this email.</p>
          <p>If you have any questions, please contact the counseling department.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(parentEmail, subject, html);
}

/**
 * Send action status update email to counselor
 * @param {Object} action Action object
 * @param {Object} student Student object
 * @param {string} counselorEmail Counselor email
 */
async function sendActionStatusUpdateEmail(action, student, counselorEmail) {
  const subject = `Action ${action.status}: ${action.description}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Action Status Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .status-approved { color: #28a745; font-weight: bold; }
        .status-rejected { color: #dc3545; font-weight: bold; }
        .action-box { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Student Early Warning System</h2>
          <p>Action Status Update</p>
        </div>
        
        <div class="content">
          <h3>Dear Counselor,</h3>
          
          <p>The following action for student <strong>${student.name}</strong> (Student ID: ${student.student_id}) has been <span class="status-${action.status}">${action.status}</span> by the parent/guardian.</p>
          
          <div class="action-box">
            <h4>Action Details:</h4>
            <p><strong>Description:</strong> ${action.description}</p>
            <p><strong>Status:</strong> <span class="status-${action.status}">${action.status.toUpperCase()}</span></p>
            <p><strong>Updated:</strong> ${new Date(action.last_updated).toLocaleString()}</p>
            ${action.rejection_reason ? `<p><strong>Rejection Reason:</strong> ${action.rejection_reason}</p>` : ''}
          </div>
          
          <p>Please log in to the system to view the complete details and take any necessary follow-up actions.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from the Student Early Warning System. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(counselorEmail, subject, html);
}

/**
 * Send enhanced risk notification email
 * @param {Object} student Student object
 * @param {string} recipientEmail Recipient email
 * @param {string} recipientType Type of recipient (parent, student, counselor)
 */
async function sendEnhancedRiskNotificationEmail(student, recipientEmail, recipientType = 'parent') {
  const riskLevel = student.risk_level;
  const riskColor = riskLevel === 'high' ? '#dc3545' : riskLevel === 'medium' ? '#ffc107' : '#28a745';
  
  const subject = `Student Risk Alert: ${student.name} - ${riskLevel.toUpperCase()} RISK`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Student Risk Alert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .risk-alert { background: ${riskColor}15; border: 2px solid ${riskColor}; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .risk-level { color: ${riskColor}; font-size: 24px; font-weight: bold; text-transform: uppercase; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .stat-box { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .recommendations { background: #e3f2fd; border: 1px solid #bbdefb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Student Early Warning System</h2>
          <p>Risk Assessment Alert</p>
        </div>
        
        <div class="content">
          <div class="risk-alert">
            <h2 class="risk-level">${riskLevel} Risk</h2>
            <p><strong>Student:</strong> ${student.name} (ID: ${student.student_id})</p>
            <p><strong>Risk Score:</strong> ${student.risk_score}/100</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-box">
              <h4>Attendance</h4>
              <p style="font-size: 24px; font-weight: bold; color: ${student.attendance_rate < 75 ? '#dc3545' : student.attendance_rate < 85 ? '#ffc107' : '#28a745'};">${student.attendance_rate}%</p>
            </div>
            <div class="stat-box">
              <h4>Fee Status</h4>
              <p style="font-size: 18px; font-weight: bold; color: ${student.fee_status === 'overdue' ? '#dc3545' : student.fee_status === 'pending' ? '#ffc107' : '#28a745'};">${student.fee_status}</p>
            </div>
          </div>
          
          ${student.risk_factors && student.risk_factors.length > 0 ? `
            <h4>Risk Factors Identified:</h4>
            <ul>
              ${student.risk_factors.map(factor => `<li>${factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>`).join('')}
            </ul>
          ` : ''}
          
          ${student.recommendations && student.recommendations.length > 0 ? `
            <div class="recommendations">
              <h4>Recommended Actions:</h4>
              <ul>
                ${student.recommendations.map(rec => `<li><strong>${rec.action}:</strong> ${rec.description || 'No description provided'}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <p>Please log in to the system to view detailed information and take appropriate action.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from the Student Early Warning System. Please do not reply to this email.</p>
          <p>If you have any questions, please contact the counseling department.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(recipientEmail, subject, html);
}

/**
 * Send email alert to student
 * @param {string} recipientEmail Student email
 * @param {string} subject Email subject
 * @param {Object} data Alert data
 */
async function sendAlertEmail(recipientEmail, subject, data) {
  const {
    studentName,
    senderName,
    senderRole,
    alertType,
    priority,
    message,
    riskLevel,
    riskScore,
    attendanceRate,
    feesStatus,
    actionRequired,
    actionDeadline,
    followUpRequired,
    followUpDate,
    sentAt
  } = data;

  const priorityColor = priority === 'high' ? '#dc3545' : '#ffc107';
  const riskColor = riskLevel === 'high' ? '#dc3545' : '#ffc107';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Student Alert - ${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .alert-box { background: ${priorityColor}15; border: 2px solid ${priorityColor}; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .priority-badge { background: ${priorityColor}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .risk-info { background: ${riskColor}15; border: 1px solid ${riskColor}; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .action-required { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .follow-up { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .message-content { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 15px 0; white-space: pre-line; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
        .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Student eSeva - Academic Alert</h2>
          <p>Important communication from your ${senderRole}</p>
        </div>
        
        <div class="alert-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="margin: 0; color: ${priorityColor};">${subject}</h2>
            <span class="priority-badge">${priority} Priority</span>
          </div>
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>From:</strong> ${senderName} (${senderRole})</p>
          <p><strong>Sent:</strong> ${sentAt}</p>
        </div>
        
        <div class="risk-info">
          <h4>Risk Assessment Information</h4>
          <p><strong>Current Risk Level:</strong> <span style="color: ${riskColor}; font-weight: bold; text-transform: uppercase;">${riskLevel}</span></p>
          <p><strong>Risk Score:</strong> ${riskScore}/100</p>
          <p><strong>Alert Type:</strong> ${alertType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">
            <h4 style="margin: 0 0 10px 0;">Attendance</h4>
            <p style="font-size: 24px; font-weight: bold; color: ${(attendanceRate || 0) < 75 ? '#dc3545' : (attendanceRate || 0) < 85 ? '#ffc107' : '#28a745'}; margin: 0;">${attendanceRate || 'N/A'}%</p>
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">
            <h4 style="margin: 0 0 10px 0;">Fee Status</h4>
            <p style="font-size: 18px; font-weight: bold; color: ${feesStatus === 'overdue' ? '#dc3545' : feesStatus === 'pending' ? '#ffc107' : '#28a745'}; margin: 0; text-transform: capitalize;">${feesStatus || 'Unknown'}</p>
          </div>
        </div>
        
        <div class="message-content">
          <h4>Message from ${senderName}:</h4>
          <p>${message}</p>
        </div>
        
        ${actionRequired ? `
          <div class="action-required">
            <h4>⚠️ Action Required</h4>
            <p>This alert requires immediate attention and action on your part.</p>
            ${actionDeadline ? `<p><strong>Action Deadline:</strong> ${new Date(actionDeadline).toLocaleDateString()}</p>` : ''}
            <p>Please contact your ${senderRole} or visit the counseling office as soon as possible.</p>
          </div>
        ` : ''}
        
        ${followUpRequired ? `
          <div class="follow-up">
            <h4>📅 Follow-up Required</h4>
            <p>A follow-up meeting has been scheduled to discuss this matter further.</p>
            ${followUpDate ? `<p><strong>Follow-up Date:</strong> ${new Date(followUpDate).toLocaleDateString()}</p>` : ''}
            <p>Please ensure you are available for this important discussion.</p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn">Login to Student Portal</a>
        </div>
        
        <div class="footer">
          <p>This is an official communication from the Student eSeva system.</p>
          <p>If you have any questions or concerns, please contact your ${senderRole} or visit the counseling office.</p>
          <p>Please do not reply to this email. Use the student portal or contact the office directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return transporter.sendMail({
    from: emailConfig.user,
    to: recipientEmail,
    subject: `[${priority.toUpperCase()}] ${subject}`,
    html,
  });
}

/**
 * Send notification email to student with action buttons
 * @param {Object} data Student data and message
 */
async function sendStudentNotificationEmail(data) {
  const { studentEmail, studentName, studentId, attendanceRate, message } = data;
  const subject = `Attendance Update - Action Required`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Attendance Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .btn-success { background: #10b981; color: white; }
        .btn-danger { background: #ef4444; color: white; }
        .btn:hover { opacity: 0.9; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 Student Attendance Update</h1>
        </div>
        <div class="content">
          <h2>Hello ${studentName}!</h2>
          <p>This is an automated notification regarding your attendance status.</p>
          
          <div class="alert">
            <h3>📊 Your Attendance Details:</h3>
            <p><strong>Student ID:</strong> ${studentId}</p>
            <p><strong>Attendance Rate:</strong> ${attendanceRate}%</p>
            <p><strong>Message:</strong> ${message}</p>
          </div>
          
          <p>Please review the actions taken by the faculty and respond accordingly:</p>
          
          <div class="button-container">
            <a href="mailto:faculty@school.edu?subject=Action Taken - ${studentId}&body=I have taken the necessary action regarding my attendance." class="btn btn-success">
              ✅ Action Taken
            </a>
            <a href="mailto:faculty@school.edu?subject=Action Rejected - ${studentId}&body=I disagree with the action taken. Please provide more information." class="btn btn-danger">
              ❌ Reject Action
            </a>
          </div>
          
          <p><strong>Note:</strong> Please click one of the buttons above to respond to the faculty's action. You can also reply directly to this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Student eSeva System</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return transporter.sendMail({
    from: emailConfig.user,
    to: studentEmail,
    subject,
    html,
  });
}

/**
 * Send notification email to parent with action buttons
 * @param {Object} data Student data and message
 */
async function sendParentNotificationEmail(data) {
  const { parentEmail, studentName, studentId, attendanceRate, message } = data;
  const subject = `Your Child's Attendance Update - Action Required`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Student Attendance Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert { background: #fee2e2; border: 1px solid #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .btn-success { background: #10b981; color: white; }
        .btn-danger { background: #ef4444; color: white; }
        .btn:hover { opacity: 0.9; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👨‍👩‍👧‍👦 Parent Notification</h1>
        </div>
        <div class="content">
          <h2>Dear Parent/Guardian,</h2>
          <p>This is an automated notification regarding your child's attendance status.</p>
          
          <div class="alert">
            <h3>📊 Student Details:</h3>
            <p><strong>Student Name:</strong> ${studentName}</p>
            <p><strong>Student ID:</strong> ${studentId}</p>
            <p><strong>Attendance Rate:</strong> ${attendanceRate}%</p>
            <p><strong>Message:</strong> ${message}</p>
          </div>
          
          <p>Please review the actions taken by the faculty and respond accordingly:</p>
          
          <div class="button-container">
            <a href="mailto:faculty@school.edu?subject=Action Approved - ${studentId}&body=I approve the action taken for my child ${studentName}'s attendance." class="btn btn-success">
              ✅ Approve Action
            </a>
            <a href="mailto:faculty@school.edu?subject=Action Rejected - ${studentId}&body=I disagree with the action taken for my child ${studentName}. Please provide more information." class="btn btn-danger">
              ❌ Reject Action
            </a>
          </div>
          
          <p><strong>Note:</strong> Please click one of the buttons above to respond to the faculty's action. You can also reply directly to this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Student eSeva System</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return transporter.sendMail({
    from: emailConfig.user,
    to: parentEmail,
    subject,
    html,
  });
}

module.exports = { 
  sendEmail, 
  sendActionApprovalEmail, 
  sendActionStatusUpdateEmail, 
  sendEnhancedRiskNotificationEmail,
  sendAlertEmail,
  sendStudentNotificationEmail,
  sendParentNotificationEmail
};
