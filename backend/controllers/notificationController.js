const Student = require("../models/Student");
const Config = require("../models/Config");
const { sendEmail } = require("../services/emailService");

/**
 * Send emails to parents and/or advisors for at-risk students.
 */
async function sendNotifications(req, res, next) {
  try {
    // Get current configuration
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
      await config.save();
    }

    // Check if email notifications are enabled
    if (!config.emailNotifications) {
      return res.json({ 
        success: true, 
        sent: 0, 
        message: "Email notifications are disabled in system settings" 
      });
    }

    // Get risk levels to notify for students and parents
    const studentRiskLevels = config.emailStudentRiskLevels || ["medium", "high"];
    const parentRiskLevels = config.emailParentRiskLevels || ["medium", "high"];

    console.log(`Email notification settings: Students=${studentRiskLevels.join(',')}, Parents=${parentRiskLevels.join(',')}`);

    // Fetch students based on configured risk levels
    const allRiskLevels = [...new Set([...studentRiskLevels, ...parentRiskLevels])];
    const students = await Student.find({
      risk_level: { $in: allRiskLevels },
    });

    console.log(`Found ${students.length} students matching risk levels: ${allRiskLevels.join(', ')}`);

    // Prepare all email tasks
    const emailTasks = [];
    
    for (const student of students) {
      // Email to student if their risk level is configured for student notifications
      if (studentRiskLevels.includes(student.risk_level)) {
        const studentEmailTask = (async () => {
          try {
            const advisorHtml = generateAdvisorEmail(student, config);
            console.log(`Sending student email to: ${student.email} for student: ${student.name} (${student.risk_level})`);
            await sendEmail(
              student.email,
              `Student Alert: ${student.name} (${student.risk_level.toUpperCase()})`,
              advisorHtml
            );
            console.log(`Student email sent successfully to: ${student.email}`);
            return { to: student.email, type: "advisor", status: "success", risk_level: student.risk_level };
          } catch (error) {
            console.error(`Failed to send student email to ${student.email}:`, error);
            return { to: student.email, type: "advisor", status: "failed", error: error.message, risk_level: student.risk_level };
          }
        })();
        emailTasks.push(studentEmailTask);
      }

      // Email to parent if their risk level is configured for parent notifications
      if (parentRiskLevels.includes(student.risk_level)) {
        const parentEmailTask = (async () => {
          try {
            const parentHtml = generateParentEmail(student, config);
            const urgencyLevel = student.risk_level === "high" ? "URGENT" : "ALERT";
            console.log(`Sending parent email to: ${student.parent_email} for student: ${student.name} (${student.risk_level})`);
            await sendEmail(
              student.parent_email,
              `${urgencyLevel}: ${student.name} Needs Support`,
              parentHtml
            );
            console.log(`Parent email sent successfully to: ${student.parent_email}`);
            return { to: student.parent_email, type: "parent", status: "success", risk_level: student.risk_level };
          } catch (error) {
            console.error(`Failed to send parent email to ${student.parent_email}:`, error);
            return { to: student.parent_email, type: "parent", status: "failed", error: error.message, risk_level: student.risk_level };
          }
        })();
        emailTasks.push(parentEmailTask);
      }
    }

    // Send all emails in parallel with timeout
    console.log(`Sending ${emailTasks.length} emails in parallel...`);
    const startTime = Date.now();
    
    try {
      const results = await Promise.allSettled(emailTasks);
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`Email sending completed in ${duration} seconds`);
      
      // Process results
      const processedResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Email task ${index} failed:`, result.reason);
          return { 
            to: 'unknown', 
            type: 'unknown', 
            status: 'failed', 
            error: result.reason?.message || 'Unknown error' 
          };
        }
      });
      
      const successCount = processedResults.filter(r => r.status === 'success').length;
      const failureCount = processedResults.filter(r => r.status === 'failed').length;
      
      console.log(`Email results: ${successCount} successful, ${failureCount} failed`);
      
      res.json({ 
        success: true, 
        sent: processedResults.length, 
        successful: successCount,
        failed: failureCount,
        duration: `${duration}s`,
        details: processedResults,
        config: {
          emailNotifications: config.emailNotifications,
          studentRiskLevels: studentRiskLevels,
          parentRiskLevels: parentRiskLevels,
          emailFrequency: config.emailFrequency
        }
      });
    } catch (error) {
      console.error('Error in email sending process:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Email sending process failed',
        message: error.message 
      });
    }
  } catch (err) {
    next(err);
  }
}

/** Generate HTML content for advisor email */
function generateAdvisorEmail(student, config = {}) {
  // Convert risk factors to readable format
  const readableFactors = student.risk_factors.map(factor => {
    const factorMap = {
      'critical_attendance': 'Critical Attendance Issue',
      'low_attendance': 'Low Attendance',
      'multiple_failures': 'Multiple Subject Failures',
      'single_failure': 'Single Subject Failure',
      'financial_stress': 'Financial Stress',
      'pending_fees': 'Pending Fee Payment',
      'exhausted_attempts': 'Exhausted Subject Attempts'
    };
    return factorMap[factor] || factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  });

  // Generate recommendations based on config
  const recommendations = (config.includeRecommendations !== false && student.recommendations && student.recommendations.length > 0) 
    ? student.recommendations.map(rec => `<li><strong>${rec.action}</strong> - ${rec.urgency} priority</li>`).join('')
    : '<li>Schedule immediate meeting with student</li><li>Review academic progress</li><li>Provide additional support</li>';

  const institutionName = config.institutionName || "Student eSeva Institution";
  const academicYear = config.academicYear || new Date().getFullYear().toString();
  const semester = config.semester || "1";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Student Alert</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 10px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; line-height: 1.2;">🚨 Student Early Warning Alert</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">${institutionName}</p>
          <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 12px;">Academic Year ${academicYear} - Semester ${semester}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px; line-height: 1.3;">Student: ${student.name}</h2>
          
          <div style="background: ${student.risk_level === 'high' ? '#ffebee' : '#fff3e0'}; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${student.risk_level === 'high' ? '#f44336' : '#ff9800'};">
            <h3 style="margin: 0 0 10px 0; color: ${student.risk_level === 'high' ? '#d32f2f' : '#f57c00'}; font-size: 16px;">
              ${student.risk_level === 'high' ? '🔴 HIGH RISK' : '🟡 MEDIUM RISK'}
            </h3>
            <p style="margin: 0; font-size: 16px; font-weight: bold;">Risk Score: ${student.risk_score}/100</p>
          </div>

          <h3 style="color: #34495e; border-bottom: 2px solid #ecf0f1; padding-bottom: 8px; font-size: 16px; margin: 20px 0 10px 0;">📊 Identified Risk Factors:</h3>
          <ul style="color: #555; line-height: 1.6; margin: 0 0 20px 0; padding-left: 20px; font-size: 14px;">
            ${readableFactors.map(factor => `<li style="margin-bottom: 8px; word-wrap: break-word;">${factor}</li>`).join('')}
          </ul>

          <h3 style="color: #34495e; border-bottom: 2px solid #ecf0f1; padding-bottom: 8px; font-size: 16px; margin: 20px 0 10px 0;">💡 Recommended Actions:</h3>
          <ul style="color: #555; line-height: 1.6; margin: 0 0 20px 0; padding-left: 20px; font-size: 14px;">
            ${recommendations}
          </ul>

          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 14px;">📈 Student Performance Summary:</h4>
            <p style="margin: 5px 0; font-size: 14px; word-wrap: break-word;"><strong>Attendance Rate:</strong> ${student.attendance_rate || 'N/A'}%</p>
            <p style="margin: 5px 0; font-size: 14px; word-wrap: break-word;"><strong>Student ID:</strong> ${student.student_id}</p>
            <p style="margin: 5px 0; font-size: 14px; word-wrap: break-word;"><strong>Last Updated:</strong> ${new Date(student.last_updated).toLocaleString()}</p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 12px; line-height: 1.4;">
              This is an automated alert from the Student eSeva Early Warning System.<br>
              Please take immediate action to support this student.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/** Generate HTML content for parent email */
function generateParentEmail(student, config = {}) {
  // Convert risk factors to parent-friendly language
  const parentFriendlyFactors = student.risk_factors.map(factor => {
    const factorMap = {
      'critical_attendance': 'Frequent absences from classes',
      'low_attendance': 'Below expected attendance levels',
      'multiple_failures': 'Struggling in multiple subjects',
      'single_failure': 'Having difficulty in one subject',
      'financial_stress': 'Outstanding fee payments',
      'pending_fees': 'Fee payment pending',
      'exhausted_attempts': 'Reached maximum attempts in subjects'
    };
    return factorMap[factor] || factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  });

  const institutionName = config.institutionName || "Student eSeva Institution";
  const academicYear = config.academicYear || new Date().getFullYear().toString();
  const semester = config.semester || "1";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Parent Notification</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 10px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; line-height: 1.2;">👨‍👩‍👧‍👦 Parent Notification</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">${institutionName} Early Warning System</p>
          <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 12px;">Academic Year ${academicYear} - Semester ${semester}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px; line-height: 1.3;">Dear Parent/Guardian,</h2>
          
          <p style="color: #555; font-size: 14px; line-height: 1.6; word-wrap: break-word;">
            We are writing to inform you about your child <strong>${student.name}</strong> (Student ID: ${student.student_id}) 
            who may need additional support at this time.
          </p>

          <div style="background: ${student.risk_level === 'high' ? '#ffebee' : '#fff3e0'}; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${student.risk_level === 'high' ? '#f44336' : '#ff9800'};">
            <h3 style="margin: 0 0 10px 0; color: ${student.risk_level === 'high' ? '#d32f2f' : '#f57c00'}; font-size: 16px;">
              ${student.risk_level === 'high' ? '🔴 URGENT ATTENTION NEEDED' : '🟡 MONITORING REQUIRED'}
            </h3>
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #2c3e50;">
              Risk Level: ${student.risk_level.toUpperCase()}
            </p>
          </div>

          <h3 style="color: #34495e; border-bottom: 2px solid #ecf0f1; padding-bottom: 8px; font-size: 16px; margin: 20px 0 10px 0;">📋 Areas of Concern:</h3>
          <ul style="color: #555; line-height: 1.6; margin: 0 0 20px 0; padding-left: 20px; font-size: 14px;">
            ${parentFriendlyFactors.map(factor => `<li style="margin-bottom: 8px; word-wrap: break-word;">${factor}</li>`).join('')}
          </ul>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1976d2; font-size: 16px;">🤝 How You Can Help:</h3>
            <ul style="color: #555; line-height: 1.6; margin: 0; padding-left: 20px; font-size: 14px;">
              <li style="margin-bottom: 8px; word-wrap: break-word;"><strong>Schedule a meeting</strong> with your child's academic advisor</li>
              <li style="margin-bottom: 8px; word-wrap: break-word;"><strong>Discuss challenges</strong> your child may be facing</li>
              <li style="margin-bottom: 8px; word-wrap: break-word;"><strong>Review study habits</strong> and time management</li>
              <li style="margin-bottom: 8px; word-wrap: break-word;"><strong>Consider additional support</strong> such as tutoring or counseling</li>
              <li style="margin-bottom: 8px; word-wrap: break-word;"><strong>Stay in regular contact</strong> with the academic team</li>
            </ul>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #dee2e6;">
            <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">📞 Next Steps:</h4>
            <p style="margin: 0; color: #6c757d; font-size: 13px; line-height: 1.4; word-wrap: break-word;">
              Our academic team will be reaching out to schedule a meeting. 
              In the meantime, please feel free to contact us if you have any questions or concerns.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 12px; line-height: 1.4;">
              This notification is sent with the best interests of your child in mind.<br>
              We believe that with proper support, every student can succeed.
            </p>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">
              Generated on ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = { sendNotifications };
