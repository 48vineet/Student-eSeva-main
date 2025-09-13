const transporter = require("../config/mailer");
const { emailConfig } = require("../config/env");

/**
 * Send an email
 * @param {string} to Recipient email
 * @param {string} subject Email subject
 * @param {string} html HTML content
 */
async function sendEmail(to, subject, html) {
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

module.exports = { 
  sendEmail, 
  sendActionApprovalEmail, 
  sendActionStatusUpdateEmail, 
  sendEnhancedRiskNotificationEmail 
};
