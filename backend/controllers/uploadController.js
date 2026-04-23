const { parseFile } = require("../utils/parseExcel");
const Student = require("../models/Student");
const riskCalculator = require("../services/riskCalculator");
const Config = require("../models/Config");
const {
  sendStudentNotificationEmail,
  sendParentNotificationEmail,
} = require("../services/emailService");

/**
 * Handle file upload with role-based data processing
 */
async function uploadController(req, res, next) {
  try {
    const { role } = req.user;
    console.log("Upload request received:", {
      role,
      hasFile: !!req.file,
      fileInfo: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : null,
      body: req.body,
      headers: req.headers,
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
        error: "Insufficient permissions for file upload",
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

      const student_id = extractTextValue(
        row["Student ID"] || row["student_id"],
      );
      const name = extractTextValue(row["Student Name"] || row["name"]);
      const attendance_rate = parseAttendanceRate(
        extractTextValue(row["Attendance"]) || 0,
      );
      const email = extractTextValue(row["Student Email"] || row["email"]);
      const parent_email = extractTextValue(
        row["Parent Email"] || row["parent_email"],
      );

      if (student_id && name && email && parent_email) {
        // Check if student already exists
        const existingStudent = await Student.findOne({ student_id });

        let student;

        if (existingStudent) {
          // Update existing student - preserve exam data and other flags
          console.log(`🔍 Faculty updating existing student ${student_id}`);
          console.log(
            `🔍 Current exam_department flag:`,
            existingStudent.data_completion.exam_department,
          );

          const updateData = {
            $set: {
              name,
              email,
              parent_email,
              attendance_rate,
              last_updated: new Date(),
              "data_completion.faculty": true,
              "data_completion.last_updated": new Date(),
            },
          };

          student = await Student.findOneAndUpdate({ student_id }, updateData, {
            new: true,
            runValidators: true,
          });

          console.log(`🔍 After faculty update for ${student_id}:`, {
            exam_department: student.data_completion.exam_department,
            faculty: student.data_completion.faculty,
            local_guardian: student.data_completion.local_guardian,
          });
        } else {
          // Create new student if doesn't exist
          console.log(`📝 Faculty creating new student ${student_id}`);
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
              last_updated: new Date(),
            },
            data_complete: false,
            last_updated: new Date(),
          };

          student = await Student.create(studentData);
        }

        // Check if all data is complete
        student.data_complete =
          student.data_completion.exam_department &&
          student.data_completion.faculty &&
          student.data_completion.local_guardian;

        console.log(
          `🔍 Data completion check for ${student_id} (student data upload):`,
          {
            exam_department: student.data_completion.exam_department,
            faculty: student.data_completion.faculty,
            local_guardian: student.data_completion.local_guardian,
            data_complete: student.data_complete,
          },
        );

        // Only calculate risk if ALL data is complete (exam + faculty + guardian)
        if (student.data_complete) {
          try {
            console.log(
              `All data complete for ${student_id}. Calculating risk assessment...`,
            );

            const riskAssessment = await riskCalculator.calculateRisk(student);
            if (riskAssessment) {
              student.risk_level = riskAssessment.risk_level;
              student.risk_score = riskAssessment.risk_score;
              student.risk_factors = riskAssessment.risk_factors;
              student.explanation = riskAssessment.explanation;
              student.recommendations = riskAssessment.recommendations;
              student.failed_subjects = riskAssessment.failed_subjects || 0;
              student.risk_calculation_log =
                riskAssessment.calculation_log || [];
              student.risk_missing_data_reasons =
                riskAssessment.missing_data_reasons || [];
              student.risk_ai_meta = riskAssessment.ai_meta || {
                provider: "none",
                model: null,
                status: "not-used",
              };

              console.log(`Risk calculated for ${student_id}:`, {
                risk_level: riskAssessment.risk_level,
                risk_score: riskAssessment.risk_score,
                factors: riskAssessment.risk_factors,
              });
            }
          } catch (riskError) {
            console.error(
              `Failed to calculate risk for student ${student_id}:`,
              riskError,
            );
            // Continue processing even if risk calculation fails
          }
        } else {
          console.log(
            `⏳ Risk calculation pending for ${student_id}. Missing data from:`,
            {
              exam_department: student.data_completion.exam_department,
              faculty: student.data_completion.faculty,
              local_guardian: student.data_completion.local_guardian,
            },
          );
          // Ensure risk level is set to pending when data is incomplete
          student.risk_level = "pending";
          student.risk_score = 0;
          student.risk_factors = [];
          student.explanation = [];
          student.recommendations = [];
          student.failed_subjects = 0;
          student.risk_calculation_log = [];
          student.risk_missing_data_reasons = [];
          student.risk_ai_meta = {
            provider: "none",
            model: null,
            status: "not-calculated",
          };
        }

        // Save the student with all updates
        await student.save();

        createdStudents.push(student);

        // Only send emails if explicitly requested via send_emails parameter
        const sendEmails =
          req.body.send_emails === "true" || req.body.send_emails === true;

        if (sendEmails) {
          try {
            // Send email to student
            await sendStudentNotificationEmail({
              studentEmail: email,
              studentName: name,
              studentId: student_id,
              attendanceRate: attendance_rate,
              message: `Your attendance rate is ${attendance_rate}%. Please review the actions taken by the faculty.`,
            });
            emailCount++;

            // Send email to parent
            await sendParentNotificationEmail({
              parentEmail: parent_email,
              studentName: name,
              studentId: student_id,
              attendanceRate: attendance_rate,
              message: `Your child ${name}'s attendance rate is ${attendance_rate}%. Please review and take necessary action.`,
            });
            emailCount++;
          } catch (emailError) {
            console.error(
              `Failed to send emails for student ${student_id}:`,
              emailError,
            );
            // Continue processing other students even if email fails
          }
        }
      }
    }

    const emailStatus =
      req.body.send_emails === "true" || req.body.send_emails === true
        ? ` and sent emails to ${emailCount} recipients`
        : " (emails not sent)";

    res.json({
      success: true,
      createdCount: createdStudents.length,
      emailCount: emailCount,
      emailsSent:
        req.body.send_emails === "true" || req.body.send_emails === true,
    });
  } catch (error) {
    console.error("Error in processStudentDataUpload:", error);
    next(error);
  }
}

/**
 * Process attendance upload (Faculty only) - Updates attendance for existing students
 */
async function processAttendanceUpload(req, res, next) {
  try {
    const rows = await parseFile(req.file.buffer, req.file.originalname);
    const updatedStudents = [];

    for (const row of rows) {
      if (!row["Student ID"] && !row["student_id"]) {
        continue;
      }

      const student_id = extractTextValue(
        row["Student ID"] || row["student_id"],
      );
      const attendance_rate = parseAttendanceRate(
        extractTextValue(row["Attendance"]) || 0,
      );

      if (student_id) {
        const student = await Student.findOne({ student_id });
        console.log(
          `🔍 Faculty looking for student ${student_id}:`,
          student ? "Found" : "Not found",
        );
        if (student) {
          console.log(`🔍 Student ${student_id} BEFORE faculty update:`, {
            exam_department: student.data_completion.exam_department,
            faculty: student.data_completion.faculty,
            local_guardian: student.data_completion.local_guardian,
          });
          student.attendance_rate = attendance_rate;

          // Mark faculty data as complete
          student.data_completion.faculty = true;
          student.data_completion.last_updated = new Date();

          console.log(`🔍 Faculty data completion status for ${student_id}:`, {
            exam_department: student.data_completion.exam_department,
            faculty: student.data_completion.faculty,
            local_guardian: student.data_completion.local_guardian,
          });

          // Check if all data is complete
          student.data_complete =
            student.data_completion.exam_department &&
            student.data_completion.faculty &&
            student.data_completion.local_guardian;

          // Only calculate risk if ALL data is complete (exam + faculty + guardian)
          if (student.data_complete) {
            try {
              console.log(
                `All data complete for ${student_id}. Calculating risk assessment...`,
              );

              const riskAssessment =
                await riskCalculator.calculateRisk(student);
              if (riskAssessment) {
                student.risk_level = riskAssessment.risk_level;
                student.risk_score = riskAssessment.risk_score;
                student.risk_factors = riskAssessment.risk_factors;
                student.explanation = riskAssessment.explanation;
                student.recommendations = riskAssessment.recommendations;
                student.failed_subjects = riskAssessment.failed_subjects || 0;
                student.risk_calculation_log =
                  riskAssessment.calculation_log || [];
                student.risk_missing_data_reasons =
                  riskAssessment.missing_data_reasons || [];
                student.risk_ai_meta = riskAssessment.ai_meta || {
                  provider: "none",
                  model: null,
                  status: "not-used",
                };

                console.log(`Risk calculated for ${student_id}:`, {
                  risk_level: riskAssessment.risk_level,
                  risk_score: riskAssessment.risk_score,
                  factors: riskAssessment.risk_factors,
                });
              }
            } catch (riskError) {
              console.error(
                `Failed to calculate risk for student ${student_id}:`,
                riskError,
              );
              // Continue processing even if risk calculation fails
            }
          } else {
            console.log(
              `⏳ Risk calculation pending for ${student_id}. Missing data from:`,
              {
                exam_department: student.data_completion.exam_department,
                faculty: student.data_completion.faculty,
                local_guardian: student.data_completion.local_guardian,
              },
            );
            // Ensure risk level is set to pending when data is incomplete
            student.risk_level = "pending";
            student.risk_score = 0;
            student.risk_factors = [];
            student.explanation = [];
            student.recommendations = [];
            student.failed_subjects = 0;
            student.risk_calculation_log = [];
            student.risk_missing_data_reasons = [];
            student.risk_ai_meta = {
              provider: "none",
              model: null,
              status: "not-calculated",
            };
          }

          student.last_updated = new Date();
          await student.save();

          // Only calculate risk if data is complete
          if (student.data_complete) {
            try {
              console.log(
                `🔄 Calculating risk for ${student_id} - data is complete`,
              );
              const riskAssessment = await riskCalculator.calculateRisk(
                student.toObject(),
              );
              if (riskAssessment) {
                student.risk_level = riskAssessment.risk_level;
                student.risk_score = riskAssessment.risk_score;
                student.risk_factors = riskAssessment.risk_factors;
                student.explanation = riskAssessment.explanation;
                student.recommendations = riskAssessment.recommendations;
                student.failed_subjects = riskAssessment.failed_subjects || 0;
                student.risk_calculation_log =
                  riskAssessment.calculation_log || [];
                student.risk_missing_data_reasons =
                  riskAssessment.missing_data_reasons || [];
                student.risk_ai_meta = riskAssessment.ai_meta || {
                  provider: "none",
                  model: null,
                  status: "not-used",
                };
                student.last_updated = new Date();

                await student.save();

                console.log(`✅ Calculated risk for ${student_id}:`, {
                  risk_level: riskAssessment.risk_level,
                  risk_score: riskAssessment.risk_score,
                  factors: riskAssessment.risk_factors,
                });
              }
            } catch (riskError) {
              console.error(
                `❌ Failed to calculate risk for student ${student_id}:`,
                riskError,
              );
            }
          } else {
            // Clear risk data for incomplete students
            student.risk_level = "pending";
            student.risk_score = 0;
            student.risk_factors = [];
            student.explanation = [];
            student.recommendations = [];
            student.failed_subjects = 0;
            student.risk_calculation_log = [];
            student.risk_missing_data_reasons = [];
            student.risk_ai_meta = {
              provider: "none",
              model: null,
              status: "not-calculated",
            };
            await student.save();

            console.log(
              `⏳ Risk calculation pending for ${student_id}. Missing data from:`,
              {
                exam_department: student.data_completion.exam_department,
                faculty: student.data_completion.faculty,
                local_guardian: student.data_completion.local_guardian,
              },
            );
          }

          updatedStudents.push(student);
        } else {
          console.log(
            `Student with ID ${student_id} not found. Please ensure exam department has uploaded student data first.`,
          );
        }
      }
    }

    res.json({
      success: true,
      message: "Attendance data updated successfully",
      updatedCount: updatedStudents.length,
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
      size: req.file.size,
    });

    const rows = await parseFile(req.file.buffer, req.file.originalname);
    console.log("Parsed rows:", rows.length);
    console.log("First few rows:", rows.slice(0, 3));
    const updatedStudents = [];

    const processedStudents = new Set(); // Track processed students

    for (const row of rows) {
      if (!row["Student ID"] && !row["student_id"]) {
        continue;
      }

      const student_id = extractTextValue(
        row["Student ID"] || row["student_id"],
      );
      const student_name = extractTextValue(
        row["Student Name"] || row["name"] || row["Name"],
      );
      // Get exam type from form data or Excel file, default to unit_test_1
      const examType =
        req.body.exam_type ||
        extractTextValue(row["Exam Type"] || row["exam_type"]) ||
        "unit_test_1";

      console.log(
        `🔄 Processing student ${student_id} (${student_name}) - Exam Type: ${examType}`,
      );

      // Check if we've already processed this student
      if (processedStudents.has(student_id)) {
        console.log(
          `⚠️ WARNING: Student ${student_id} already processed! Skipping duplicate.`,
        );
        continue;
      }
      processedStudents.add(student_id);

      if (student_id) {
        // Process detailed grades based on exam type
        const detailedGrades = extractDetailedGrades(row, examType);

        // Check if student exists
        const existingStudent = await Student.findOne({ student_id });
        console.log(
          `🔍 Looking for student ${student_id}:`,
          existingStudent ? "Found" : "Not found",
        );
        if (existingStudent) {
          console.log(`🔍 Existing student data completion:`, {
            exam_department: existingStudent.data_completion.exam_department,
            faculty: existingStudent.data_completion.faculty,
            local_guardian: existingStudent.data_completion.local_guardian,
          });
        }
        let student;

        if (existingStudent) {
          console.log(
            `🔍 Updating existing student ${student_id} with exam data`,
          );
          console.log(
            `🔍 Current exam_department flag:`,
            existingStudent.data_completion.exam_department,
          );

          // Update existing student - only update specific fields to avoid conflicts
          const updateData = {
            $set: {
              name: student_name || existingStudent.name || "Unknown Student",
              email: existingStudent.email || `${student_id}@example.com`,
              parent_email:
                existingStudent.parent_email ||
                `${student_id}_parent@example.com`,
              last_updated: new Date(),
              "data_completion.exam_department": true,
              "data_completion.last_updated": new Date(),
            },
          };

          console.log(`🔍 Update data being sent:`, updateData);

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

          // Try direct update first
          const updateResult = await Student.updateOne(
            { student_id },
            updateData,
          );

          console.log(`🔍 Update result for ${student_id}:`, updateResult);

          // Verify the update by fetching the student again
          student = await Student.findOne({ student_id });
          console.log(`🔍 After exam data update for ${student_id}:`, {
            exam_department: student?.data_completion?.exam_department,
            faculty: student?.data_completion?.faculty,
            local_guardian: student?.data_completion?.local_guardian,
            data_complete: student?.data_complete,
          });

          if (!student) {
            console.log(
              `❌ ERROR: Student ${student_id} not found after update!`,
            );
            continue;
          }

          updatedStudents.push(student);
        } else {
          // Student doesn't exist - CREATE NEW STUDENT with exam data
          console.log(
            `📝 Creating new student ${student_id} with exam data...`,
          );

          const newStudentData = {
            student_id,
            name: student_name || "Unknown Student",
            email: `${student_id}@example.com`,
            parent_email: `${student_id}_parent@example.com`,
            attendance_rate: 0, // Default, will be updated by faculty
            fee_status: "pending", // Default, will be updated by guardian
            fees_status: "Pending",
            amount_paid: 0,
            amount_due: 0,
            due_date: "",
            days_overdue: 0,
            grades: [],
            risk_level: "pending",
            risk_score: 0,
            risk_factors: [],
            explanation: [],
            recommendations: [],
            data_completion: {
              exam_department: true, // Exam department data is provided
              faculty: false, // Will be updated by faculty
              local_guardian: false, // Will be updated by guardian
              last_updated: new Date(),
            },
            data_complete: false,
            last_updated: new Date(),
          };

          // Add exam-specific grades to new student
          if (examType === "unit_test_1") {
            newStudentData.unit_test_1_grades = detailedGrades;
          } else if (examType === "unit_test_2") {
            newStudentData.unit_test_2_grades = detailedGrades;
          } else if (examType === "mid_sem") {
            newStudentData.mid_sem_grades = detailedGrades;
          } else if (examType === "end_sem") {
            newStudentData.end_sem_grades = detailedGrades;
          }

          // Create the new student
          student = new Student(newStudentData);
          await student.save();

          console.log(`✅ Created new student ${student_id} successfully`);
          console.log(`🔍 New student data completion status:`, {
            exam_department: student.data_completion.exam_department,
            faculty: student.data_completion.faculty,
            local_guardian: student.data_completion.local_guardian,
            data_complete: student.data_complete,
          });
          updatedStudents.push(student);
        }

        // Update basic grades array for compatibility (only if we have grade data)
        if (detailedGrades && detailedGrades.length > 0) {
          student.grades = calculateBasicGrades(student);
        } else {
          student.grades = [];
        }

        // Check if all data is complete
        student.data_complete =
          student.data_completion.exam_department &&
          student.data_completion.faculty &&
          student.data_completion.local_guardian;

        console.log(`🔍 Data completion check for ${student_id}:`, {
          exam_department: student.data_completion.exam_department,
          faculty: student.data_completion.faculty,
          local_guardian: student.data_completion.local_guardian,
          data_complete: student.data_complete,
        });

        // Only calculate risk if ALL data is complete (exam + faculty + guardian)
        if (student.data_complete) {
          try {
            console.log(
              `All data complete for ${student_id}. Calculating risk assessment...`,
            );

            const riskAssessment = await riskCalculator.calculateRisk(student);
            if (riskAssessment) {
              student.risk_level = riskAssessment.risk_level;
              student.risk_score = riskAssessment.risk_score;
              student.risk_factors = riskAssessment.risk_factors;
              student.explanation = riskAssessment.explanation;
              student.recommendations = riskAssessment.recommendations;
              student.failed_subjects = riskAssessment.failed_subjects || 0;
              student.risk_calculation_log =
                riskAssessment.calculation_log || [];
              student.risk_missing_data_reasons =
                riskAssessment.missing_data_reasons || [];
              student.risk_ai_meta = riskAssessment.ai_meta || {
                provider: "none",
                model: null,
                status: "not-used",
              };

              console.log(`Risk calculated for ${student_id}:`, {
                risk_level: riskAssessment.risk_level,
                risk_score: riskAssessment.risk_score,
                factors: riskAssessment.risk_factors,
              });
            }
          } catch (riskError) {
            console.error(
              `Failed to calculate risk for student ${student_id}:`,
              riskError,
            );
            // Continue processing even if risk calculation fails
          }
        } else {
          console.log(
            `⏳ Risk calculation pending for ${student_id}. Missing data from:`,
            {
              exam_department: student.data_completion.exam_department,
              faculty: student.data_completion.faculty,
              local_guardian: student.data_completion.local_guardian,
            },
          );
          // Ensure risk level is set to pending when data is incomplete
          student.risk_level = "pending";
          student.risk_score = 0;
          student.risk_factors = [];
          student.explanation = [];
          student.recommendations = [];
          student.failed_subjects = 0;
          student.risk_calculation_log = [];
          student.risk_missing_data_reasons = [];
          student.risk_ai_meta = {
            provider: "none",
            model: null,
            status: "not-calculated",
          };
        }

        await student.save();

        // Only calculate risk if data is complete
        if (student.data_complete) {
          try {
            console.log(
              `🔄 Calculating risk for ${student_id} - data is complete`,
            );
            const riskAssessment = await riskCalculator.calculateRisk(
              student.toObject(),
            );
            if (riskAssessment) {
              student.risk_level = riskAssessment.risk_level;
              student.risk_score = riskAssessment.risk_score;
              student.risk_factors = riskAssessment.risk_factors;
              student.explanation = riskAssessment.explanation;
              student.recommendations = riskAssessment.recommendations;
              student.failed_subjects = riskAssessment.failed_subjects || 0;
              student.risk_calculation_log =
                riskAssessment.calculation_log || [];
              student.risk_missing_data_reasons =
                riskAssessment.missing_data_reasons || [];
              student.risk_ai_meta = riskAssessment.ai_meta || {
                provider: "none",
                model: null,
                status: "not-used",
              };
              student.last_updated = new Date();

              await student.save();

              console.log(`✅ Calculated risk for ${student_id}:`, {
                risk_level: riskAssessment.risk_level,
                risk_score: riskAssessment.risk_score,
                factors: riskAssessment.risk_factors,
              });
            }
          } catch (riskError) {
            console.error(
              `❌ Failed to calculate risk for student ${student_id}:`,
              riskError,
            );
          }
        } else {
          // Clear risk data for incomplete students
          student.risk_level = "pending";
          student.risk_score = 0;
          student.risk_factors = [];
          student.explanation = [];
          student.recommendations = [];
          student.failed_subjects = 0;
          student.risk_calculation_log = [];
          student.risk_missing_data_reasons = [];
          student.risk_ai_meta = {
            provider: "none",
            model: null,
            status: "not-calculated",
          };
          await student.save();

          console.log(
            `⏳ Risk calculation pending for ${student_id}. Missing data from:`,
            {
              exam_department: student.data_completion.exam_department,
              faculty: student.data_completion.faculty,
              local_guardian: student.data_completion.local_guardian,
            },
          );
        }

        updatedStudents.push(student);
      }
    }

    console.log(
      "Upload completed successfully. Processed students:",
      updatedStudents.length,
    );
    res.json({
      success: true,
      message:
        "Exam data processed successfully. Students created/updated with exam grades. Risk assessment will be calculated after Faculty and Guardian upload their data.",
      updatedCount: updatedStudents.length,
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
    const config = await Config.findOne();
    const configuredCollegeFees = Number(config?.collegeFees);
    const hasConfiguredCollegeFees =
      Number.isFinite(configuredCollegeFees) && configuredCollegeFees > 0;

    for (const row of rows) {
      if (!row["Student ID"] && !row["student_id"]) {
        continue;
      }

      const student_id = extractTextValue(
        row["Student ID"] || row["student_id"],
      );
      const fees_status = extractTextValue(
        row["Fees Status"] ||
          row["fees_status"] ||
          row["Fee Status"] ||
          row["fee_status"],
      );
      const amountPaidRaw = extractTextValue(
        row["Amount Paid"] || row["amount_paid"],
      );
      const amountDueRaw = extractTextValue(
        row["Amount Due"] || row["amount_due"],
      );
      const parsedAmountPaid = parseFloat(amountPaidRaw || 0);
      const parsedAmountDue = parseFloat(amountDueRaw || 0);
      const amount_paid =
        Number.isFinite(parsedAmountPaid) && parsedAmountPaid >= 0
          ? parsedAmountPaid
          : 0;
      const hasExplicitAmountDue = amountDueRaw !== "";
      let amount_due =
        Number.isFinite(parsedAmountDue) && parsedAmountDue >= 0
          ? parsedAmountDue
          : 0;
      if (!hasExplicitAmountDue && hasConfiguredCollegeFees) {
        amount_due = Math.max(configuredCollegeFees - amount_paid, 0);
      }
      const dueDateInfo = parseDueDateValue(row["Due Date"] || row["due_date"]);
      const due_date = dueDateInfo.text;

      if (student_id) {
        const student = await Student.findOne({ student_id });
        console.log(
          `🔍 Guardian looking for student ${student_id}:`,
          student ? "Found" : "Not found",
        );
        if (student) {
          console.log(`🔍 Student ${student_id} current data completion:`, {
            exam_department: student.data_completion.exam_department,
            faculty: student.data_completion.faculty,
            local_guardian: student.data_completion.local_guardian,
            data_complete: student.data_complete,
          });
          // Update fees-related fields
          student.amount_paid = amount_paid;
          student.amount_due = amount_due;
          student.due_date = due_date;

          // Calculate days overdue based on parsed due date
          const daysOverdue = Number.isFinite(dueDateInfo.daysOverdue)
            ? dueDateInfo.daysOverdue
            : 0;
          student.days_overdue = daysOverdue;

          let resolvedFeesStatus = fees_status;
          if (!resolvedFeesStatus) {
            if (amount_due <= 0) {
              resolvedFeesStatus = "Complete";
            } else if (daysOverdue > 0) {
              resolvedFeesStatus = "Overdue";
            } else if (amount_paid > 0) {
              resolvedFeesStatus = "Partial";
            } else {
              resolvedFeesStatus = "Due";
            }
          }

          student.fees_status = resolvedFeesStatus || "Pending";
          student.fee_status = normalizeFeeStatus(resolvedFeesStatus);

          // Mark local guardian data as complete
          student.data_completion.local_guardian = true;
          student.data_completion.last_updated = new Date();

          console.log(`🔍 Guardian data completion status for ${student_id}:`, {
            exam_department: student.data_completion.exam_department,
            faculty: student.data_completion.faculty,
            local_guardian: student.data_completion.local_guardian,
          });

          // Check if all data is complete
          student.data_complete =
            student.data_completion.exam_department &&
            student.data_completion.faculty &&
            student.data_completion.local_guardian;

          console.log(
            `🔍 Data completion check for ${student_id} (fees upload):`,
            {
              exam_department: student.data_completion.exam_department,
              faculty: student.data_completion.faculty,
              local_guardian: student.data_completion.local_guardian,
              data_complete: student.data_complete,
            },
          );

          // Now calculate risk since all data is complete
          if (student.data_complete) {
            console.log(
              `✅ All data complete for ${student_id}. Calculating risk assessment...`,
            );
            await calculateAndUpdateRisk(student);
            console.log(
              `Risk calculation completed for ${student_id}. All data is now available.`,
            );
          } else {
            console.log(
              `⏳ Risk calculation pending for ${student_id}. Missing data from:`,
              {
                exam_department: student.data_completion.exam_department,
                faculty: student.data_completion.faculty,
                local_guardian: student.data_completion.local_guardian,
              },
            );
            // Ensure risk level is set to pending when data is incomplete
            student.risk_level = "pending";
            student.risk_score = 0;
            student.risk_factors = [];
            student.explanation = [];
            student.recommendations = [];
            student.failed_subjects = 0;
            student.risk_calculation_log = [];
            student.risk_missing_data_reasons = [];
            student.risk_ai_meta = {
              provider: "none",
              model: null,
              status: "not-calculated",
            };
          }

          student.last_updated = new Date();
          await student.save();

          // Only calculate risk if data is complete
          if (student.data_complete) {
            try {
              console.log(
                `🔄 Calculating risk for ${student_id} - data is complete`,
              );
              const riskAssessment = await riskCalculator.calculateRisk(
                student.toObject(),
              );
              if (riskAssessment) {
                student.risk_level = riskAssessment.risk_level;
                student.risk_score = riskAssessment.risk_score;
                student.risk_factors = riskAssessment.risk_factors;
                student.explanation = riskAssessment.explanation;
                student.recommendations = riskAssessment.recommendations;
                student.failed_subjects = riskAssessment.failed_subjects || 0;
                student.risk_calculation_log =
                  riskAssessment.calculation_log || [];
                student.risk_missing_data_reasons =
                  riskAssessment.missing_data_reasons || [];
                student.risk_ai_meta = riskAssessment.ai_meta || {
                  provider: "none",
                  model: null,
                  status: "not-used",
                };
                student.last_updated = new Date();

                await student.save();

                console.log(`✅ Calculated risk for ${student_id}:`, {
                  risk_level: riskAssessment.risk_level,
                  risk_score: riskAssessment.risk_score,
                  factors: riskAssessment.risk_factors,
                });
              }
            } catch (riskError) {
              console.error(
                `❌ Failed to calculate risk for student ${student_id}:`,
                riskError,
              );
            }
          } else {
            // Clear risk data for incomplete students
            student.risk_level = "pending";
            student.risk_score = 0;
            student.risk_factors = [];
            student.explanation = [];
            student.recommendations = [];
            student.failed_subjects = 0;
            student.risk_calculation_log = [];
            student.risk_missing_data_reasons = [];
            student.risk_ai_meta = {
              provider: "none",
              model: null,
              status: "not-calculated",
            };
            await student.save();

            console.log(
              `⏳ Risk calculation pending for ${student_id}. Missing data from:`,
              {
                exam_department: student.data_completion.exam_department,
                faculty: student.data_completion.faculty,
                local_guardian: student.data_completion.local_guardian,
              },
            );
          }

          updatedStudents.push(student);
        } else {
          console.log(
            `Student with ID ${student_id} not found. Please ensure exam department has uploaded student data first.`,
          );
        }
      }
    }

    res.json({
      success: true,
      message: "Fees data updated successfully",
      updatedCount: updatedStudents.length,
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

    const riskAssessment = await riskCalculator.calculateRisk(data);

    // Update student with deterministic risk data
    student.risk_level = riskAssessment.risk_level;
    student.risk_score = riskAssessment.risk_score;
    student.risk_factors = riskAssessment.risk_factors;
    student.explanation = riskAssessment.explanation;
    student.recommendations = riskAssessment.recommendations;
    student.failed_subjects = riskAssessment.failed_subjects || 0;
    student.risk_calculation_log = riskAssessment.calculation_log || [];
    student.risk_missing_data_reasons =
      riskAssessment.missing_data_reasons || [];
    student.risk_ai_meta = riskAssessment.ai_meta || {
      provider: "none",
      model: null,
      status: "not-used",
    };

    console.log(
      `Updated risk for ${data.student_id}: ${riskAssessment.risk_level} (${riskAssessment.risk_score})`,
    );
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
    ...(student.end_sem_grades || []),
  ];

  // If no grades available, return empty array
  if (allGrades.length === 0) {
    return [];
  }

  // Group by subject and calculate average
  const subjectGrades = {};
  allGrades.forEach((grade) => {
    if (grade && grade.subject && !isNaN(grade.score) && grade.score !== null) {
      if (!subjectGrades[grade.subject]) {
        subjectGrades[grade.subject] = [];
      }
      subjectGrades[grade.subject].push(Number(grade.score));
    }
  });

  // Calculate average for each subject
  const grades = Object.entries(subjectGrades)
    .map(([subject, scores]) => {
      if (scores.length === 0) return null;

      const avgScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const roundedScore = Math.round(avgScore);

      // Ensure score is a valid number
      if (isNaN(roundedScore) || roundedScore < 0 || roundedScore > 100) {
        return null;
      }

      return {
        subject,
        score: roundedScore,
        status: roundedScore >= 60 ? "passing" : "failing",
      };
    })
    .filter((grade) => grade !== null);

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
      if (
        !row["Student ID"] &&
        !row["student_id"] &&
        !row["Student Name"] &&
        !row["name"]
      ) {
        console.log("Skipping row with missing essential data:", row);
        continue;
      }

      console.log("Processing row:", row);

      // Map row fields to student model keys with flexible column names
      const student_id =
        extractTextValue(
          row["Student ID"] || row["student_id"] || row["ID"] || row["id"],
        ) || `ST${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const name =
        extractTextValue(
          row["Student Name"] || row["name"] || row["Name"] || row["Student"],
        ) || "Unknown Student";
      const email =
        extractTextValue(
          row["Email"] ||
            row["email"] ||
            row["Student Email"] ||
            row["student_email"],
        ) || `${student_id}@example.com`;
      const parent_email =
        extractTextValue(
          row["Parent Email"] ||
            row["parent_email"] ||
            row["Parent"] ||
            row["parent"],
        ) || `${student_id}_parent@example.com`;
      const attendance_rate = parseAttendanceRate(
        extractTextValue(
          row["Attendance Rate"] ||
            row["attendance_rate"] ||
            row["Attendance"] ||
            row["attendance"] ||
            row["Attendance %"],
        ) || 0,
      );
      const fee_status = normalizeFeeStatus(
        extractTextValue(
          row["Fee Status"] || row["fee_status"] || row["Fees"] || row["fees"],
        ) || "current",
      );
      const days_overdue = parseInt(
        extractTextValue(
          row["Days Overdue"] ||
            row["days_overdue"] ||
            row["Overdue"] ||
            row["overdue"],
        ) || 0,
      );
      const grades = extractGrades(row, config.passCriteria);
      const class_year = extractTextValue(
        row["Class Year"] ||
          row["class_year"] ||
          row["Year"] ||
          row["year"] ||
          row["Grade"] ||
          row["grade"],
      );
      const major = extractTextValue(
        row["Major"] ||
          row["major"] ||
          row["Subject"] ||
          row["subject"] ||
          row["Course"] ||
          row["course"],
      );

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

      const riskAssessment = await riskCalculator.calculateRisk(data);

      const finalRisk = {
        risk_level: riskAssessment.risk_level,
        risk_score: riskAssessment.risk_score,
        risk_factors: riskAssessment.risk_factors,
        explanation: riskAssessment.explanation,
        recommendations: riskAssessment.recommendations,
        failed_subjects: riskAssessment.failed_subjects || 0,
        risk_calculation_log: riskAssessment.calculation_log || [],
        risk_missing_data_reasons: riskAssessment.missing_data_reasons || [],
        risk_ai_meta: riskAssessment.ai_meta || {
          provider: "none",
          model: null,
          status: "not-used",
        },
      };

      console.log(
        `Final deterministic risk for ${data.student_id}:`,
        finalRisk,
      );

      // Save or update student
      const saved = await Student.findOneAndUpdate(
        { student_id: data.student_id },
        { ...data, ...finalRisk, last_updated: new Date() },
        { upsert: true, new: true },
      );

      console.log(
        `Saved student ${data.student_id} with risk_level: ${saved.risk_level}, risk_score: ${saved.risk_score}`,
      );
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

// Helper function to detect absent markers in uploaded cells
function isAbsentValue(value) {
  if (value === null || value === undefined) return false;

  const normalized = value.toString().trim().toLowerCase();
  return ["ab", "abs", "absent", "a", "na", "n/a", "-"].includes(normalized);
}

// Helper function to extract detailed grades for exam data
function extractDetailedGrades(row, examType) {
  const grades = [];
  const excludedKeys = [
    "Student ID",
    "Student Name",
    "Email",
    "Parent Email",
    "student id",
    "student_id",
    "student name",
    "name",
    "email",
    "parent email",
    "parent",
  ];

  // Iterate through all keys in the row
  for (const [key, value] of Object.entries(row)) {
    // Skip excluded keys
    if (
      excludedKeys.some((excluded) =>
        key.toLowerCase().includes(excluded.toLowerCase()),
      )
    ) {
      continue;
    }

    // Treat explicit absent markers as 0 so they are included as failing.
    const isAbsent = isAbsentValue(value);
    const score = isAbsent ? 0 : parseFloat(value);
    if (!isNaN(score) && score >= 0 && score <= 100) {
      const grade = {
        subject: key,
        semester: row["Semester"] || "1",
        academic_year:
          row["Academic Year"] || new Date().getFullYear().toString(),
        last_updated: new Date(),
      };

      // Set the appropriate exam type field based on examType
      if (examType === "unit_test_1") {
        grade.unit_test_1 = score;
      } else if (examType === "unit_test_2") {
        grade.unit_test_2 = score;
      } else if (examType === "mid_sem") {
        grade.mid_sem = score;
      } else if (examType === "end_sem") {
        grade.end_sem = score;
      }

      grades.push(grade);
    }
  }

  return grades;
}

// Helpers inside this module
function extractGrades(row, passCriteria = 60) {
  // Exclude non-grade columns to find all subject columns dynamically
  const excludedColumns = [
    "student id",
    "student name",
    "name",
    "email",
    "parent email",
    "parent",
    "attendance rate",
    "attendance",
    "fee status",
    "fees",
    "days overdue",
    "overdue",
    "class year",
    "year",
    "grade",
    "major",
    "subject",
    "course",
    "id",
  ];

  // Find all columns that look like subjects (contain numbers and are not excluded)
  const gradeColumns = Object.keys(row).filter((key) => {
    const lowerKey = key.toLowerCase().trim();

    // Skip excluded columns
    if (excludedColumns.some((excluded) => lowerKey.includes(excluded))) {
      return false;
    }

    // Skip empty or very short keys
    if (lowerKey.length < 2) {
      return false;
    }

    // Accept numeric grades and explicit absent markers.
    const rawValue = row[key];
    if (isAbsentValue(rawValue)) {
      return true;
    }

    const value = parseFloat(rawValue);
    return !isNaN(value) && value >= 0 && value <= 100;
  });

  const grades = gradeColumns
    .map((subject) => {
      const rawValue = row[subject];
      const score = isAbsentValue(rawValue) ? 0 : parseFloat(rawValue || 0);

      if (isNaN(score) || score < 0 || score > 100) {
        return null;
      }

      return {
        subject: subject,
        score,
        status: score >= passCriteria ? "passing" : "failing",
      };
    })
    .filter(Boolean);

  return grades;
}

// Helper function to extract text value from Excel cells (handles hyperlinks)
function extractTextValue(value) {
  if (!value) return null;

  // If it's already a string, return it
  if (typeof value === "string") return value.trim();

  // If it's an object (like hyperlink), extract the text property
  if (typeof value === "object" && value !== null) {
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

  // Treat absent markers as 0% attendance.
  if (isAbsentValue(str)) {
    return 0;
  }

  // If it contains % symbol, it's a percentage
  if (str.includes("%")) {
    return parseFloat(str.replace("%", ""));
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
    completed: "current",
    complete: "current",
    paid: "current",
    done: "current",
    finished: "current",
    pending: "pending",
    waiting: "pending",
    due: "pending",
    incomplete: "overdue",
    overdue: "overdue",
    late: "overdue",
    unpaid: "overdue",
    default: "overdue",
  };

  return statusMap[normalized] || "current";
}

function parseDueDateValue(value) {
  if (value === null || value === undefined || value === "") {
    return { text: "", daysOverdue: 0 };
  }

  const today = new Date();
  let parsedDate = null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    parsedDate = value;
  } else if (typeof value === "number" && Number.isFinite(value)) {
    // Excel stores dates as serial day numbers in many sheets.
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    parsedDate = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
  } else {
    const text = value.toString().trim();
    const slashMatch = text.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/);
    const dashMatch = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
    } else if (dashMatch) {
      const [, day, month, year] = dashMatch;
      parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
    } else if (isoMatch) {
      const [, year, month, day] = isoMatch;
      parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
    } else {
      const candidate = new Date(text);
      if (!Number.isNaN(candidate.getTime())) {
        parsedDate = candidate;
      }
    }
  }

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return { text: value.toString().trim(), daysOverdue: 0 };
  }

  parsedDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today - parsedDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return {
    text: value.toString().trim(),
    daysOverdue: Number.isFinite(diffDays) ? Math.max(0, diffDays) : 0,
  };
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
    allStudents.forEach((student) => {
      if (studentMap.has(student.student_id)) {
        duplicates.push(student);
      } else {
        studentMap.set(student.student_id, student);
      }
    });

    if (duplicates.length > 0) {
      console.log(
        `Found ${duplicates.length} duplicate students. Removing duplicates...`,
      );

      // Delete duplicate students (keep the ones in studentMap)
      const duplicateIds = duplicates.map((student) => student._id);
      const result = await Student.deleteMany({ _id: { $in: duplicateIds } });

      console.log(
        `Cleaned up ${result.deletedCount} duplicate student records.`,
      );
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
  cleanupDuplicateStudents,
};
