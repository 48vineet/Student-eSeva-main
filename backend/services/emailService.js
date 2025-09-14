const transporter = require("../config/mailer");
const { emailConfig } = require("../config/env");

/**
 * Get responsive email styles for modern design
 */
function getResponsiveStyles() {
  return `
    <style>
      /* Reset and base styles */
      * { box-sizing: border-box; }
      body { 
        margin: 0; 
        padding: 0; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6; 
        color: #1f2937;
        background-color: #f9fafb;
      }
      
      /* Container and layout */
      .email-container { 
        max-width: 600px; 
        margin: 0 auto; 
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      /* Header styles */
      .email-header { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white; 
        padding: 32px 24px; 
        text-align: center;
        position: relative;
      }
      
      .email-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        opacity: 0.3;
      }
      
      .email-header h1 { 
        margin: 0 0 8px 0; 
        font-size: 28px; 
        font-weight: 700;
        position: relative;
        z-index: 1;
      }
      
      .email-header p { 
        margin: 0; 
        font-size: 16px; 
        opacity: 0.9;
        position: relative;
        z-index: 1;
      }
      
      /* Content area */
      .email-content { 
        padding: 32px 24px; 
      }
      
      /* Alert boxes */
      .alert-box { 
        padding: 24px; 
        border-radius: 12px; 
        margin: 24px 0;
        border-left: 4px solid;
        position: relative;
        overflow: hidden;
      }
      
      .alert-box::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.05;
        background: currentColor;
      }
      
      .alert-box .content {
        position: relative;
        z-index: 1;
      }
      
      .alert-high { 
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border-left-color: #ef4444;
        color: #991b1b;
      }
      
      .alert-medium { 
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        border-left-color: #f59e0b;
        color: #92400e;
      }
      
      .alert-low { 
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border-left-color: #22c55e;
        color: #166534;
      }
      
      .alert-info { 
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border-left-color: #3b82f6;
        color: #1e40af;
      }
      
      /* Risk level badges */
      .risk-badge { 
        display: inline-block; 
        padding: 8px 16px; 
        border-radius: 20px; 
        font-size: 14px; 
        font-weight: 700; 
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .risk-high { background: #ef4444; color: white; }
      .risk-medium { background: #f59e0b; color: white; }
      .risk-low { background: #22c55e; color: white; }
      
      /* Stats grid */
      .stats-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
        gap: 16px; 
        margin: 24px 0; 
      }
      
      .stat-card { 
        background: #f8fafc; 
        padding: 20px; 
        border-radius: 12px; 
        text-align: center;
        border: 1px solid #e2e8f0;
        transition: transform 0.2s ease;
      }
      
      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .stat-value { 
        font-size: 32px; 
        font-weight: 700; 
        margin: 8px 0;
        line-height: 1;
      }
      
      .stat-label { 
        font-size: 14px; 
        color: #64748b; 
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      /* Buttons */
      .btn { 
        display: inline-block; 
        padding: 14px 28px; 
        text-decoration: none; 
        border-radius: 8px; 
        font-weight: 600;
        font-size: 16px;
        text-align: center;
        transition: all 0.2s ease;
        border: none;
        cursor: pointer;
        margin: 8px;
        min-width: 140px;
      }
      
      .btn-primary { 
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white; 
        box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);
      }
      
      .btn-success { 
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white; 
        box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.3);
      }
      
      .btn-danger { 
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white; 
        box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.3);
      }
      
      .btn:hover { 
        transform: translateY(-2px);
        box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.2);
      }
      
      .btn-container { 
        text-align: center; 
        margin: 32px 0; 
      }
      
      /* Lists */
      .risk-factors { 
        background: #f8fafc; 
        padding: 20px; 
        border-radius: 12px; 
        margin: 20px 0;
        border: 1px solid #e2e8f0;
      }
      
      .risk-factors ul { 
        margin: 0; 
        padding-left: 20px; 
      }
      
      .risk-factors li { 
        margin: 8px 0; 
        color: #374151;
      }
      
      /* Recommendations */
      .recommendations { 
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border: 1px solid #93c5fd; 
        padding: 24px; 
        border-radius: 12px; 
        margin: 24px 0; 
      }
      
      .recommendations h4 {
        color: #1e40af;
        margin-top: 0;
      }
      
      /* Footer */
      .email-footer { 
        background: #f8fafc; 
        padding: 24px; 
        text-align: center; 
        border-top: 1px solid #e2e8f0;
        color: #64748b;
        font-size: 14px;
      }
      
      .email-footer p { 
        margin: 8px 0; 
      }
      
      /* Mobile responsiveness */
      @media only screen and (max-width: 600px) {
        .email-container { 
          margin: 0; 
          border-radius: 0; 
        }
        
        .email-header { 
          padding: 24px 16px; 
        }
        
        .email-header h1 { 
          font-size: 24px; 
        }
        
        .email-content { 
          padding: 24px 16px; 
        }
        
        .stats-grid { 
          grid-template-columns: 1fr; 
          gap: 12px; 
        }
        
        .stat-card { 
          padding: 16px; 
        }
        
        .stat-value { 
          font-size: 28px; 
        }
        
        .btn { 
          display: block; 
          width: 100%; 
          margin: 8px 0; 
          padding: 16px 24px;
        }
        
        .btn-container { 
          margin: 24px 0; 
        }
        
        .alert-box { 
          padding: 20px; 
          margin: 20px 0; 
        }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .email-container { 
          background-color: #1f2937; 
          color: #f9fafb; 
        }
        
        .stat-card { 
          background: #374151; 
          border-color: #4b5563; 
        }
        
        .risk-factors { 
          background: #374151; 
          border-color: #4b5563; 
        }
        
        .email-footer { 
          background: #111827; 
          border-color: #374151; 
        }
      }
      
      /* Print styles */
      @media print {
        .email-container { 
          box-shadow: none; 
          border: 1px solid #e2e8f0; 
        }
        
        .btn { 
          background: #f3f4f6 !important; 
          color: #374151 !important; 
          border: 1px solid #d1d5db !important;
        }
      }
    </style>
  `;
}

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
  const priorityClass = action.priority === 'high' ? 'alert-high' : action.priority === 'medium' ? 'alert-medium' : 'alert-low';
  const priorityIcon = action.priority === 'high' ? '🚨' : action.priority === 'medium' ? '⚠️' : 'ℹ️';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Action Approval Required</title>
      ${getResponsiveStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>📋 Action Approval Required</h1>
          <p>Student: ${student.name} (ID: ${student.student_id})</p>
        </div>
        
        <div class="email-content">
          <h2>Dear Parent/Guardian,</h2>
          
          <p>A new action has been recommended for your ward and requires your approval. Please review the details below carefully.</p>
          
          <div class="alert-box ${priorityClass}">
            <div class="content">
              <h3>${priorityIcon} Action Details</h3>
              <p><strong>Description:</strong> ${action.description}</p>
              <p><strong>Counselor Notes:</strong> ${action.counselor_notes}</p>
              <p><strong>Priority:</strong> <span class="risk-badge risk-${action.priority}">${action.priority.toUpperCase()}</span></p>
              ${action.due_date ? `<p><strong>Due Date:</strong> ${new Date(action.due_date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>` : ''}
            </div>
          </div>
          
          <div class="btn-container">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn btn-primary">
              🔍 Review Action
            </a>
          </div>
          
          <div class="alert-box alert-info">
            <div class="content">
              <h4>📝 Important Note</h4>
              <p>This action is currently pending your approval. Please review it carefully and take appropriate action as soon as possible.</p>
            </div>
          </div>
        </div>
        
        <div class="email-footer">
          <p><strong>Student eSeva System</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
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
  const statusClass = action.status === 'approved' ? 'alert-low' : 'alert-high';
  const statusIcon = action.status === 'approved' ? '✅' : '❌';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Action Status Update</title>
      ${getResponsiveStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>📋 Action Status Update</h1>
          <p>Student: ${student.name} (ID: ${student.student_id})</p>
        </div>
        
        <div class="email-content">
          <h2>Dear Counselor,</h2>
          
          <p>The following action for student <strong>${student.name}</strong> has been <span class="risk-badge risk-${action.status === 'approved' ? 'low' : 'high'}">${action.status.toUpperCase()}</span> by the parent/guardian.</p>
          
          <div class="alert-box ${statusClass}">
            <div class="content">
              <h3>${statusIcon} Action Details</h3>
              <p><strong>Description:</strong> ${action.description}</p>
              <p><strong>Status:</strong> <span class="risk-badge risk-${action.status === 'approved' ? 'low' : 'high'}">${action.status.toUpperCase()}</span></p>
              <p><strong>Updated:</strong> ${new Date(action.last_updated).toLocaleString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              ${action.rejection_reason ? `<p><strong>Rejection Reason:</strong> ${action.rejection_reason}</p>` : ''}
            </div>
          </div>
          
          <div class="btn-container">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn btn-primary">
              📊 View Complete Details
            </a>
          </div>
          
          <div class="alert-box alert-info">
            <div class="content">
              <h4>📝 Next Steps</h4>
              <p>Please log in to the system to view the complete details and take any necessary follow-up actions based on the parent/guardian's response.</p>
            </div>
          </div>
        </div>
        
        <div class="email-footer">
          <p><strong>Student eSeva System</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
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
  const riskClass = riskLevel === 'high' ? 'alert-high' : riskLevel === 'medium' ? 'alert-medium' : 'alert-low';
  const riskIcon = riskLevel === 'high' ? '🚨' : riskLevel === 'medium' ? '⚠️' : '✅';
  
  const subject = `Student Risk Alert: ${student.name} - ${riskLevel.toUpperCase()} RISK`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Student Risk Alert</title>
      ${getResponsiveStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>${riskIcon} Risk Assessment Alert</h1>
          <p>Student: ${student.name} (ID: ${student.student_id})</p>
        </div>
        
        <div class="email-content">
          <div class="alert-box ${riskClass}">
            <div class="content">
              <h2>${riskIcon} ${riskLevel.toUpperCase()} RISK</h2>
              <p><strong>Risk Score:</strong> ${student.risk_score}/100</p>
              <p><strong>Assessment Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Attendance Rate</div>
              <div class="stat-value" style="color: ${student.attendance_rate < 75 ? '#ef4444' : student.attendance_rate < 85 ? '#f59e0b' : '#22c55e'};">
                ${student.attendance_rate}%
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Failed Subjects</div>
              <div class="stat-value" style="color: ${student.failed_subjects > 2 ? '#ef4444' : student.failed_subjects > 0 ? '#f59e0b' : '#22c55e'};">
                ${student.failed_subjects || 0}
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Days Overdue</div>
              <div class="stat-value" style="color: ${student.days_overdue > 30 ? '#ef4444' : student.days_overdue > 0 ? '#f59e0b' : '#22c55e'};">
                ${student.days_overdue || 0}
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Fee Status</div>
              <div class="stat-value" style="color: ${student.fee_status === 'overdue' ? '#ef4444' : student.fee_status === 'pending' ? '#f59e0b' : '#22c55e'}; font-size: 18px;">
                ${student.fee_status || 'Unknown'}
              </div>
            </div>
          </div>
          
          ${student.risk_factors && student.risk_factors.length > 0 ? `
            <div class="risk-factors">
              <h4>🔍 Risk Factors Identified</h4>
              <ul>
                ${student.risk_factors.map(factor => `<li>${factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${student.recommendations && student.recommendations.length > 0 ? `
            <div class="recommendations">
              <h4>💡 Recommended Actions</h4>
              <ul>
                ${student.recommendations.map(rec => `<li><strong>${rec.action}:</strong> ${rec.description || 'No description provided'}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="btn-container">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn btn-primary">
              📊 View Detailed Report
            </a>
          </div>
        </div>
        
        <div class="email-footer">
          <p><strong>Student eSeva System</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
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
  const attendanceClass = attendanceRate < 75 ? 'alert-high' : attendanceRate < 85 ? 'alert-medium' : 'alert-low';
  const attendanceIcon = attendanceRate < 75 ? '🚨' : attendanceRate < 85 ? '⚠️' : '✅';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Attendance Update</title>
      ${getResponsiveStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>📚 Attendance Update</h1>
          <p>Student: ${studentName} (ID: ${studentId})</p>
        </div>
        
        <div class="email-content">
          <h2>Hello ${studentName}!</h2>
          <p>This is an automated notification regarding your attendance status. Please review the details below.</p>
          
          <div class="alert-box ${attendanceClass}">
            <div class="content">
              <h3>${attendanceIcon} Your Attendance Details</h3>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Student ID</div>
                  <div class="stat-value" style="font-size: 18px;">${studentId}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Attendance Rate</div>
                  <div class="stat-value" style="color: ${attendanceRate < 75 ? '#ef4444' : attendanceRate < 85 ? '#f59e0b' : '#22c55e'};">
                    ${attendanceRate}%
                  </div>
                </div>
              </div>
              <p><strong>Message:</strong> ${message}</p>
            </div>
          </div>
          
          <div class="alert-box alert-info">
            <div class="content">
              <h4>📝 Action Required</h4>
              <p>Please review the actions taken by the faculty and respond accordingly. Your response is important for maintaining your academic record.</p>
            </div>
          </div>
          
          <div class="btn-container">
            <a href="mailto:faculty@school.edu?subject=Action Taken - ${studentId}&body=I have taken the necessary action regarding my attendance." class="btn btn-success">
              ✅ Action Taken
            </a>
            <a href="mailto:faculty@school.edu?subject=Action Rejected - ${studentId}&body=I disagree with the action taken. Please provide more information." class="btn btn-danger">
              ❌ Reject Action
            </a>
          </div>
          
          <div class="alert-box alert-info">
            <div class="content">
              <h4>💡 Important Note</h4>
              <p>Please click one of the buttons above to respond to the faculty's action. You can also reply directly to this email or contact the faculty office for more information.</p>
            </div>
          </div>
        </div>
        
        <div class="email-footer">
          <p><strong>Student eSeva System</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>If you have any questions, please contact the faculty office.</p>
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
  const attendanceClass = attendanceRate < 75 ? 'alert-high' : attendanceRate < 85 ? 'alert-medium' : 'alert-low';
  const attendanceIcon = attendanceRate < 75 ? '🚨' : attendanceRate < 85 ? '⚠️' : '✅';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Student Attendance Update</title>
      ${getResponsiveStyles()}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>👨‍👩‍👧‍👦 Parent Notification</h1>
          <p>Student: ${studentName} (ID: ${studentId})</p>
        </div>
        
        <div class="email-content">
          <h2>Dear Parent/Guardian,</h2>
          <p>This is an automated notification regarding your child's attendance status. Please review the details below and take appropriate action.</p>
          
          <div class="alert-box ${attendanceClass}">
            <div class="content">
              <h3>${attendanceIcon} Student Details</h3>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Student Name</div>
                  <div class="stat-value" style="font-size: 18px;">${studentName}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Student ID</div>
                  <div class="stat-value" style="font-size: 18px;">${studentId}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Attendance Rate</div>
                  <div class="stat-value" style="color: ${attendanceRate < 75 ? '#ef4444' : attendanceRate < 85 ? '#f59e0b' : '#22c55e'};">
                    ${attendanceRate}%
                  </div>
                </div>
              </div>
              <p><strong>Message:</strong> ${message}</p>
            </div>
          </div>
          
          <div class="alert-box alert-info">
            <div class="content">
              <h4>📝 Action Required</h4>
              <p>Please review the actions taken by the faculty and respond accordingly. Your approval or feedback is important for your child's academic progress.</p>
            </div>
          </div>
          
          <div class="btn-container">
            <a href="mailto:faculty@school.edu?subject=Action Approved - ${studentId}&body=I approve the action taken for my child ${studentName}'s attendance." class="btn btn-success">
              ✅ Approve Action
            </a>
            <a href="mailto:faculty@school.edu?subject=Action Rejected - ${studentId}&body=I disagree with the action taken for my child ${studentName}. Please provide more information." class="btn btn-danger">
              ❌ Reject Action
            </a>
          </div>
          
          <div class="alert-box alert-info">
            <div class="content">
              <h4>💡 Important Note</h4>
              <p>Please click one of the buttons above to respond to the faculty's action. You can also reply directly to this email or contact the school office for more information.</p>
            </div>
          </div>
        </div>
        
        <div class="email-footer">
          <p><strong>Student eSeva System</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>If you have any questions, please contact the school office.</p>
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
