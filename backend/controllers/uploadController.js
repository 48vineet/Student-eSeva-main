const { parseFile } = require("../utils/parseExcel");
const Student = require("../models/Student");
const riskCalculator = require("../services/riskCalculator");
const { predictRisk } = require("../services/mlService");
const Config = require("../models/Config");

/**
 * Handle file upload, parse rows, calculate combined risk, save students.
 */
async function uploadController(req, res, next) {
  try {
    console.log("Upload request received:", {
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

module.exports = { uploadController };
