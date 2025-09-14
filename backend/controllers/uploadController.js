const { parseFile } = require("../utils/parseExcel");
const Student = require("../models/Student");
const riskCalculator = require("../services/riskCalculator");
const { predictRisk } = require("../services/mlService");
const Config = require("../models/Config");
const { sendStudentNotificationEmail, sendParentNotificationEmail } = require("../services/emailService");

/**
 * Handle file upload with role-based data processing
 */
async function uploadController(req, res, next) {
  try {
    const { role } = req.user;
    console.log("Upload request received:", {
      role,
      hasFile: !!req.file,
      fileInfo: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null,
      body: req.body,
      headers: req.headers
    });
    
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });

    // Role-based processing
    if (role === "faculty") {
      // Check if this is a student data upload with emails
      if (req.body.type === "student-data") {
        return await processStudentDataUpload(req, res, next);
      }
      return await processAttendanceUpload(req, res, next);
    } else if (role === "exam-department") {
      return await processExamDataUpload(req, res, next);
    } else if (role === "local-guardian") {
      return await processFeesUpload(req, res, next);
    } else if (role === "counselor") {
      return await processFullDataUpload(req, res, next);
    } else {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions for file upload"
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Process student data upload (Faculty only) - Creates students with emails and sends notifications
 */
async function processStudentDataUpload(req, res, next) {
  try {
    console.log("Processing student data upload with emails...");
    
    const rows = await parseFile(req.file.buffer, req.file.originalname);
    const createdStudents = [];
    let emailCount = 0;

    for (const row of rows) {
      if (!row["Student ID"] && !row["student_id"]) {
        continue;
      }

      const student_id = extractTextValue(row["Student ID"] || row["student_id"]);
      const name = extractTextValue(row["Student Name"] || row["name"]);
      const attendance_rate = parseAttendanceRate(
        extractTextValue(row["Attendance Rate"] || row["attendance_rate"] || row["Attendance"] || row["attendance"] || row["Attendance %"]) || 0
      );
      const email = extractTextValue(row["Student Email"] || row["email"]);
      const parent_email = extractTextValue(row["Parent Email"] || row["parent_email"]);

      if (student_id && name && email && parent_email) {
        // Use upsert to update existing student or create new one
        const studentData = {
          student_id,
          name,
          email,
          parent_email,
          attendance_rate,
          fee_status: "pending",
          days_overdue: 0,
          grades: [],
          risk_level: "pending",
          risk_score: 0,
          risk_factors: [],
          explanation: [],
          recommendations: [],
          data_completion: {
            exam_department: false,
            faculty: true, // Faculty data is provided
            local_guardian: false,
            last_updated: new Date()
          },
          data_complete: false,
          last_updated: new Date()
        };

        const student = await Student.findOneAndUpdate(
          { student_id },
          studentData,
          { upsert: true, new: true, runValidators: true }
        );
        
        // Calculate risk assessment for the student
        try {
          console.log(`Calculating risk for student ${student_id} (student data upload):`, {
            attendance_rate: student.attendance_rate,
            fee_status: student.fee_status,
            days_overdue: student.days_overdue,
            hasGrades: student.grades && student.grades.length > 0,
            data_completion: student.data_completion
          });
          
          const riskAssessment = await riskCalculator.calculateRisk(student);
          if (riskAssessment) {
            student.risk_level = riskAssessment.risk_level;
            student.risk_score = riskAssessment.risk_score;
            student.risk_factors = riskAssessment.risk_factors;
            student.explanation = riskAssessment.explanation;
            student.recommendations = riskAssessment.recommendations;
            await student.save();
            
            console.log(`Risk calculated for ${student_id} (student data upload):`, {
              risk_level: riskAssessment.risk_level,
              risk_score: riskAssessment.risk_score,
              factors: riskAssessment.risk_factors
            });
          }
        } catch (riskError) {
          console.error(`Failed to calculate risk for student ${student_id}:`, riskError);
          // Continue processing even if risk calculation fails
        }
        
        createdStudents.push(student);

        // Only send emails if explicitly requested via send_emails parameter
        const sendEmails = req.body.send_emails === 'true' || req.body.send_emails === true;
        
        if (sendEmails) {
          try {
            // Send email to student
            await sendStudentNotificationEmail({
              studentEmail: email,
              studentName: name,
              studentId: student_id,
              attendanceRate: attendance_rate,
              message: `Your attendance rate is ${attendance_rate}%. Please review the actions taken by the faculty.`
            });
            emailCount++;

            // Send email to parent
            await sendParentNotificationEmail({
              parentEmail: parent_email,
              studentName: name,
              studentId: student_id,
              attendanceRate: attendance_rate,
              message: `Your child ${name}'s attendance rate is ${attendance_rate}%. Please review and take necessary action.`
            });
            emailCount++;

          } catch (emailError) {
            console.error(`Failed to send emails for student ${student_id}:`, emailError);
            // Continue processing other students even if email fails
          }
        }
      }
    }

    const emailStatus = req.body.send_emails === 'true' || req.body.send_emails === true ? 
      ` and sent emails to ${emailCount} recipients` : ' (emails not sent)';
    
    res.json({
      success: true,
      message: `Student data uploaded successfully${emailStatus}`,
      createdCount: createdStudents.length,
      emailCount: emailCount,
      emailsSent: req.body.send_emails === 'true' || req.body.send_emails === true
    });
  } catch (error) {
    console.error("Error in processStudentDataUpload:", error);
    next(error);
  }
}

/**
 * Process attendance data upload (Faculty only) - Adds attendance to existing students
 */
async function processAttendanceUpload(req, res, next) {
  try {
    console.log("Processing attendance data upload...");
    
    const rows = await parseFile(req.file.buffer, req.file.originalname);
    const updatedStudents = [];

    for (const row of rows) {
      if (!row["Student ID"] && !row["student_id"]) {
        continue;
      }

      const student_id = extractTextValue(row["Student ID"] || row["student_id"]);
      const attendance_rate = parseAttendanceRate(
        extractTextValue(row["Attendance Rate"] || row["attendance_rate"] || row["Attendance"] || row["attendance"] || row["Attendance %"]) || 0
      );

      if (student_id) {
        const student = await Student.findOne({ student_id });
        if (student) {
          student.attendance_rate = attendance_rate;
          
          // Mark faculty data as complete
          student.data_completion.faculty = true;
          student.data_completion.last_updated = new Date();
          
          // Check if all data is complete
          student.data_complete = student.data_completion.exam_department && 
                                 student.data_completion.faculty && 
                                 student.data_completion.local_guardian;
          
          // Calculate risk assessment for the student
          try {
            console.log(`Calculating risk for student ${student_id} (attendance upload):`, {
              attendance_rate: student.attendance_rate,
              fee_status: student.fee_status,
              days_overdue: student.days_overdue,
              hasGrades: student.grades && student.grades.length > 0,
              data_completion: student.data_completion
            });
            
            const riskAssessment = await riskCalculator.calculateRisk(student);
            if (riskAssessment) {
              student.risk_level = riskAssessment.risk_level;
              student.risk_score = riskAssessment.risk_score;
              student.risk_factors = riskAssessment.risk_factors;
              student.explanation = riskAssessment.explanation;
              student.recommendations = riskAssessment.recommendations;
              
              console.log(`Risk calculated for ${student_id} (attendance upload):`, {
                risk_level: riskAssessment.risk_level,
                risk_score: riskAssessment.risk_score,
                factors: riskAssessment.risk_factors
              });
            }
          } catch (riskError) {
            console.error(`Failed to calculate risk for student ${student_id}:`, riskError);
            // Continue processing even if risk calculation fails
          }
          
          student.last_updated = new Date();
          await student.save();
          updatedStudents.push(student);
        } else {
          console.log(`Student with ID ${student_id} not found. Please ensure exam department has uploaded student data first.`);
        }
      }
    }

    res.json({
      success: true,
      message: "Attendance data updated successfully",
      updatedCount: updatedStudents.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Process exam data upload (Exam Department only) - Only saves exam data, no risk calculation
 */
async function processExamDataUpload(req, res, next) {
  try {
    console.log("Processing exam data upload...");
    console.log("File info:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    const rows = await parseFile(req.file.buffer, req.file.originalname);
    console.log("Parsed rows:", rows.length);
    const updatedStudents = [];

    for (const row of rows) {
      if (!row["Student ID"] && !row["student_id"]) {
        continue;
      }

      const student_id = extractTextValue(row["Student ID"] || row["student_id"]);
      const student_name = extractTextValue(row["Student Name"] || row["name"] || row["Name"]);
      const examType = extractTextValue(row["Exam Type"] || row["exam_type"] || "end_sem");
      
      if (student_id) {
        // Process detailed grades based on exam type
        const detailedGrades = extractDetailedGrades(row, examType);
        
        // Check if student exists
        const existingStudent = await Student.findOne({ student_id });
        let student;
        
        if (existingStudent) {
          // Update existing student - only update specific fields to avoid conflicts
          const updateData = {
            $set: {
              name: student_name || existingStudent.name || "Unknown Student",
              email: existingStudent.email || `${student_id}@example.com`,
              parent_email: existingStudent.parent_email || `${student_id}_parent@example.com`,
              last_updated: new Date(),
              "data_completion.exam_department": true,
              "data_completion.last_updated": new Date()
            }
          };

          // Add exam-specific grades
          if (examType === "unit_test_1") {
            updateData.$set.unit_test_1_grades = detailedGrades;
          } else if (examType === "unit_test_2") {
            updateData.$set.unit_test_2_grades = detailedGrades;
          } else if (examType === "mid_sem") {
            updateData.$set.mid_sem_grades = detailedGrades;
          } else if (examType === "end_sem") {
            updateData.$set.end_sem_grades = detailedGrades;
          }

          student = await Student.findOneAndUpdate(
            { student_id },
            updateData,
            { new: true, runValidators: true }
          );
          
          updatedStudents.push(student);
        } else {
          // Student doesn't exist - skip this student and log a warning
          console.log(`⚠️ Student ${student_id} not found. Please upload student data first before uploading exam data.`);
          continue;
        }

        // Update basic grades array for compatibility (only if we have grade data)
        if (detailedGrades && detailedGrades.length > 0) {
          student.grades = calculateBasicGrades(student);
        } else {
          student.grades = [];
        }

        // Calculate risk assessment for the student after updating grades
        try {
          console.log(`Calculating risk for student ${student_id}:`, {
            attendance_rate: student.attendance_rate,
            fee_status: student.fee_status,
            days_overdue: student.days_overdue,
            hasGrades: student.grades && student.grades.length > 0,
            data_completion: student.data_completion
          });
          
          const riskAssessment = await riskCalculator.calculateRisk(student);
          if (riskAssessment) {
            student.risk_level = riskAssessment.risk_level;
            student.risk_score = riskAssessment.risk_score;
            student.risk_factors = riskAssessment.risk_factors;
            student.explanation = riskAssessment.explanation;
            student.recommendations = riskAssessment.recommendations;
            await student.save();
            
            console.log(`Risk calculated for ${student_id}:`, {
              risk_level: riskAssessment.risk_level,
              risk_score: riskAssessment.risk_score,
              factors: riskAssessment.risk_factors
            });
          }
        } catch (riskError) {
          console.error(`Failed to calculate risk for student ${student_id}:`, riskError);
          // Continue processing even if risk calculation fails
        }
        
        // Check if all data is complete
        student.data_complete = student.data_completion.exam_department && 
                               student.data_completion.faculty && 
                               student.data_completion.local_guardian;
        
        await student.save();
        updatedStudents.push(student);
      }
    }

    console.log("Upload completed successfully. Updated students:", updatedStudents.length);
    res.json({
      success: true,
      message: "Exam data saved successfully. Risk assessment will be calculated after all departments provide their data.",
      updatedCount: updatedStudents.length
    });
  } catch (error) {
    console.error("Error in processExamDataUpload:", error);
    next(error);
  }
}

/**
 * Process fees data upload (Local Guardian only) - Adds fees status to existing students
 */
async function processFeesUpload(req, res, next) {
  try {
    console.log("Processing fees data upload...");
    
    const rows = await parseFile(req.file.buffer, req.file.originalname);
    const updatedStudents = [];

    for (const row of rows) {
      if (!row["Student ID"] && !row["student_id"]) {
        continue;
      }

      const student_id = extractTextValue(row["Student ID"] || row["student_id"]);
      const fees_status = extractTextValue(row["Fees Status"] || row["fees_status"] || row["Fee Status"] || row["fee_status"]);
      const amount_paid = parseFloat(extractTextValue(row["Amount Paid"] || row["amount_paid"]) || 0);
      const amount_due = parseFloat(extractTextValue(row["Amount Due"] || row["amount_due"]) || 0);
      const due_date = extractTextValue(row["Due Date"] || row["due_date"]);

      if (student_id) {
        const student = await Student.findOne({ student_id });
        if (student) {
          // Update fees-related fields
          student.fees_status = fees_status || "Pending";
          student.amount_paid = amount_paid;
          student.amount_due = amount_due;
          student.due_date = due_date;
          
          // Calculate days overdue based on due date
          if (due_date) {
            const dueDate = new Date(due_date);
            const today = new Date();
            const diffTime = today - dueDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            student.days_overdue = Math.max(0, diffDays);
          }
          
          // Mark local guardian data as complete
          student.data_completion.local_guardian = true;
          student.data_completion.last_updated = new Date();
          
          // Check if all data is complete
          student.data_complete = student.data_completion.exam_department && 
                                 student.data_completion.faculty && 
                                 student.data_completion.local_guardian;
          
          // Now calculate risk since all data is complete
          if (student.data_complete) {
            await calculateAndUpdateRisk(student);
            console.log(`Risk calculation completed for ${student_id}. All data is now available.`);
          }
          
          student.last_updated = new Date();
          await student.save();
          updatedStudents.push(student);
        } else {
          console.log(`Student with ID ${student_id} not found. Please ensure exam department has uploaded student data first.`);
        }
      }
    }

    res.json({
      success: true,
      message: "Fees data updated successfully",
      updatedCount: updatedStudents.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Calculate and update risk assessment for a student
 */
async function calculateAndUpdateRisk(student) {
  try {
    const data = student.toObject();
    
    // Rule-based risk calculation
    const baseRisk = await riskCalculator.calculateRisk(data);
    
    // Get current config for pass criteria
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
      await config.save();
    }
    
    // Prepare ML features
    const mlFeatures = {
      attendance_rate: data.attendance_rate || 0,
      avg_grade: data.grades && data.grades.length
        ? data.grades.reduce((sum, g) => sum + g.score, 0) / data.grades.length
        : 0,
      failing_count: data.grades ? data.grades.filter((g) => g.score < (config.passCriteria || 60)).length : 0,
      days_overdue: data.days_overdue || 0,
      attempts: 0,
    };

    // ML risk prediction
    let mlResult = { risk_level: "low", risk_score: 0 };
    try {
      mlResult = await predictRisk(mlFeatures);
    } catch (error) {
      console.error(`ML prediction failed for ${data.student_id}:`, error.message);
      mlResult = { risk_level: baseRisk.risk_level, risk_score: baseRisk.score };
    }

    // Combine ML and rule-based results
    const finalRisk = {
      risk_level: mlResult.risk_level || baseRisk.risk_level,
      risk_score: mlResult.risk_score || baseRisk.score,
      risk_factors: baseRisk.risk_factors,
      explanation: baseRisk.explanation,
      recommendations: baseRisk.recommendations,
    };

    // Update student with new risk data
    student.risk_level = finalRisk.risk_level;
    student.risk_score = finalRisk.risk_score;
    student.risk_factors = finalRisk.risk_factors;
    student.explanation = finalRisk.explanation;
    student.recommendations = finalRisk.recommendations;
    
    console.log(`Updated risk for ${data.student_id}: ${finalRisk.risk_level} (${finalRisk.risk_score})`);
  } catch (error) {
    console.error(`Error calculating risk for ${student.student_id}:`, error);
  }
}

/**
 * Calculate basic grades from detailed grade data
 */
function calculateBasicGrades(student) {
  const allGrades = [
    ...(student.unit_test_1_grades || []),
    ...(student.unit_test_2_grades || []),
    ...(student.mid_sem_grades || []),
    ...(student.end_sem_grades || [])
  ];

  // If no grades available, return empty array
  if (allGrades.length === 0) {
    return [];
  }

  // Group by subject and calculate average
  const subjectGrades = {};
  allGrades.forEach(grade => {
    if (grade && grade.subject && !isNaN(grade.score) && grade.score !== null) {
      if (!subjectGrades[grade.subject]) {
        subjectGrades[grade.subject] = [];
      }
      subjectGrades[grade.subject].push(Number(grade.score));
    }
  });

  // Calculate average for each subject
  const grades = Object.entries(subjectGrades).map(([subject, scores]) => {
    if (scores.length === 0) return null;
    
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const roundedScore = Math.round(avgScore);
    
    // Ensure score is a valid number
    if (isNaN(roundedScore) || roundedScore < 0 || roundedScore > 100) {
      return null;
    }
    
    return {
      subject,
      score: roundedScore,
      status: roundedScore >= 60 ? "passing" : "failing"
    };
  }).filter(grade => grade !== null);

  return grades;
}

/**
 * Process full data upload (Counselor only)
 */
async function processFullDataUpload(req, res, next) {
  try {
    console.log("Processing full data upload...");
    
    // Clear existing data before uploading new data
    console.log("Clearing existing student data...");
    await Student.deleteMany({});
    console.log("Existing data cleared successfully");

    console.log("About to call parseFile with:", req.file.originalname);
    const rows = await parseFile(req.file.buffer, req.file.originalname);
    console.log("Parsed rows:", rows);
    
    // Get current configuration for pass criteria
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
      await config.save();
    }
    
    const students = [];

    for (const row of rows) {
      // Skip rows that don't have essential data
      if (!row["Student ID"] && !row["student_id"] && !row["Student Name"] && !row["name"]) {
        console.log("Skipping row with missing essential data:", row);
        continue;
      }
      
      console.log("Processing row:", row);

      // Map row fields to student model keys with flexible column names
      const student_id = extractTextValue(row["Student ID"] || row["student_id"] || row["ID"] || row["id"]) || `ST${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const name = extractTextValue(row["Student Name"] || row["name"] || row["Name"] || row["Student"]) || "Unknown Student";
      const email = extractTextValue(row["Email"] || row["email"] || row["Student Email"] || row["student_email"]) || `${student_id}@example.com`;
      const parent_email = extractTextValue(row["Parent Email"] || row["parent_email"] || row["Parent"] || row["parent"]) || `${student_id}_parent@example.com`;
      const attendance_rate = parseAttendanceRate(
        extractTextValue(row["Attendance Rate"] || row["attendance_rate"] || row["Attendance"] || row["attendance"] || row["Attendance %"]) || 0
      );
      const fee_status = normalizeFeeStatus(extractTextValue(row["Fee Status"] || row["fee_status"] || row["Fees"] || row["fees"]) || "current");
      const days_overdue = parseInt(extractTextValue(row["Days Overdue"] || row["days_overdue"] || row["Overdue"] || row["overdue"]) || 0);
      const grades = extractGrades(row, config.passCriteria);
      const class_year = extractTextValue(row["Class Year"] || row["class_year"] || row["Year"] || row["year"] || row["Grade"] || row["grade"]);
      const major = extractTextValue(row["Major"] || row["major"] || row["Subject"] || row["subject"] || row["Course"] || row["course"]);
      
      console.log("Extracted grades:", grades);
      
      const data = {
        student_id,
        name,
        email,
        parent_email,
        attendance_rate,
        fee_status,
        days_overdue,
        grades,
        class_year,
        major,
      };

      // Rule-based risk calculation
      const baseRisk = await riskCalculator.calculateRisk(data);

      // Prepare ML features
      const mlFeatures = {
        attendance_rate: data.attendance_rate,
        avg_grade: data.grades.length
          ? data.grades.reduce((sum, g) => sum + g.score, 0) /
            data.grades.length
          : 0,
        failing_count: baseRisk.risk_factors.includes("multiple_failures")
          ? data.grades.filter((g) => g.status === "failing").length
          : 0,
        days_overdue: data.days_overdue,
        attempts: 0, // Attempts removed from system
      };

      // ML risk prediction
      let mlResult = { risk_level: "low", risk_score: 0 };
      try {
        console.log(`Calling ML service for ${data.student_id} with features:`, mlFeatures);
        mlResult = await predictRisk(mlFeatures);
        console.log(`ML prediction for ${data.student_id}:`, mlResult);
      } catch (error) {
        console.error(`ML prediction failed for ${data.student_id}:`, error.message);
        console.error(`ML prediction error details:`, error);
        // Use rule-based as fallback
        mlResult = { risk_level: baseRisk.risk_level, risk_score: baseRisk.score };
      }

      // Combine ML and rule-based results intelligently
      const finalRisk = {
        risk_level: mlResult.risk_level || baseRisk.risk_level,
        risk_score: mlResult.risk_score || baseRisk.score,
        risk_factors: baseRisk.risk_factors,
        explanation: baseRisk.explanation,
        recommendations: baseRisk.recommendations,
      };

      console.log(`Final risk for ${data.student_id}:`, finalRisk);

      // Save or update student
      const saved = await Student.findOneAndUpdate(
        { student_id: data.student_id },
        { ...data, ...finalRisk, last_updated: new Date() },
        { upsert: true, new: true }
      );

      console.log(`Saved student ${data.student_id} with risk_level: ${saved.risk_level}, risk_score: ${saved.risk_score}`);
      students.push(saved);
    }

    // Compute summary
    const summary = {
      total: students.length,
      high: students.filter((s) => s.risk_level === "high").length,
      medium: students.filter((s) => s.risk_level === "medium").length,
      low: students.filter((s) => s.risk_level === "low").length,
    };

    res.json({ success: true, students, summary });
  } catch (error) {
    next(error);
  }
}

// Helper function to extract detailed grades for exam data
function extractDetailedGrades(row, examType) {
  const excludedColumns = [
    'student id', 'student_id', 'student name', 'name', 'email', 'parent email', 'parent',
    'attendance rate', 'attendance', 'fee status', 'fees', 'days overdue', 'overdue',
    'class year', 'year', 'grade', 'major', 'subject', 'course', 'id', 'exam type', 'exam_type'
  ];
  
  const gradeColumns = Object.keys(row).filter(key => {
    const lowerKey = key.toLowerCase().trim();
    
    if (excludedColumns.some(excluded => lowerKey.includes(excluded))) {
      return false;
    }
    
    if (lowerKey.length < 2) {
      return false;
    }
    
    const value = parseFloat(row[key] || 0);
    return !isNaN(value) && value >= 0 && value <= 100;
  });

  return gradeColumns.map((subject) => {
    const score = parseFloat(row[subject] || 0);
    // Include all valid scores (including 0) but exclude NaN or invalid values
    if (!isNaN(score) && score >= 0 && score <= 100) {
      return {
        subject: subject,
        score: score,
        semester: row["Semester"] || "1",
        academic_year: row["Academic Year"] || new Date().getFullYear().toString(),
        last_updated: new Date()
      };
    }
    return null;
  }).filter(Boolean);
}

// Helpers inside this module
function extractGrades(row, passCriteria = 60) {
  // Exclude non-grade columns to find all subject columns dynamically
  const excludedColumns = [
    'student id', 'student name', 'name', 'email', 'parent email', 'parent',
    'attendance rate', 'attendance', 'fee status', 'fees', 'days overdue', 'overdue',
    'class year', 'year', 'grade', 'major', 'subject', 'course', 'id'
  ];
  
  // Find all columns that look like subjects (contain numbers and are not excluded)
  const gradeColumns = Object.keys(row).filter(key => {
    const lowerKey = key.toLowerCase().trim();
    
    // Skip excluded columns
    if (excludedColumns.some(excluded => lowerKey.includes(excluded))) {
      return false;
    }
    
    // Skip empty or very short keys
    if (lowerKey.length < 2) {
      return false;
    }
    
    // Check if the value is a number (indicating it's a grade)
    const value = parseFloat(row[key] || 0);
    return !isNaN(value) && value >= 0 && value <= 100;
  });

  const grades = gradeColumns
    .map((subject) => {
      const score = parseFloat(row[subject] || 0);
      return score > 0
        ? { subject: subject, score, status: score >= passCriteria ? "passing" : "failing" }
        : null;
    })
    .filter(Boolean);

  return grades;
}


// Helper function to extract text value from Excel cells (handles hyperlinks)
function extractTextValue(value) {
  if (!value) return null;
  
  // If it's already a string, return it
  if (typeof value === 'string') return value.trim();
  
  // If it's an object (like hyperlink), extract the text property
  if (typeof value === 'object' && value !== null) {
    if (value.text) return value.text.trim();
    if (value.value) return value.value.toString().trim();
    if (value.hyperlink) return value.hyperlink.trim();
  }
  
  // Convert to string as fallback
  return value.toString().trim();
}

// Helper function to parse attendance rate (handles both percentage and decimal formats)
function parseAttendanceRate(value) {
  if (!value) return 0;
  
  const str = value.toString().trim();
  
  // If it contains % symbol, it's a percentage
  if (str.includes('%')) {
    return parseFloat(str.replace('%', ''));
  }
  
  // If it's a decimal between 0 and 1, convert to percentage
  const num = parseFloat(str);
  if (num >= 0 && num <= 1) {
    return num * 100;
  }
  
  // If it's already a percentage (0-100), return as is
  if (num >= 0 && num <= 100) {
    return num;
  }
  
  // Default fallback
  return 0;
}

// Helper function to normalize fee status values
function normalizeFeeStatus(status) {
  if (!status) return "current";
  
  const normalized = status.toString().toLowerCase().trim();
  
  // Map various fee status values to the accepted enum values
  const statusMap = {
    "completed": "current",
    "complete": "current", 
    "paid": "current",
    "done": "current",
    "finished": "current",
    "pending": "pending",
    "waiting": "pending",
    "due": "pending",
    "incomplete": "overdue",
    "overdue": "overdue",
    "late": "overdue",
    "unpaid": "overdue",
    "default": "overdue"
  };
  
  return statusMap[normalized] || "current";
}

/**
 * Clean up duplicate students by keeping the most recent one
 */
async function cleanupDuplicateStudents() {
  try {
    console.log("Starting duplicate student cleanup...");
    
    // Find all students
    const allStudents = await Student.find({});
    const studentMap = new Map();
    const duplicates = [];
    
    // Group students by student_id
    allStudents.forEach(student => {
      if (studentMap.has(student.student_id)) {
        duplicates.push(student);
      } else {
        studentMap.set(student.student_id, student);
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate students. Removing duplicates...`);
      
      // Delete duplicate students (keep the ones in studentMap)
      const duplicateIds = duplicates.map(student => student._id);
      const result = await Student.deleteMany({ _id: { $in: duplicateIds } });
      
      console.log(`Cleaned up ${result.deletedCount} duplicate student records.`);
      return result.deletedCount;
    } else {
      console.log("No duplicate students found.");
      return 0;
    }
  } catch (error) {
    console.error("Error cleaning up duplicate students:", error);
    throw error;
  }
}

module.exports = { 
  uploadController,
  processStudentDataUpload,
  processAttendanceUpload,
  processExamDataUpload,
  processFeesUpload,
  processFullDataUpload,
  cleanupDuplicateStudents
};
