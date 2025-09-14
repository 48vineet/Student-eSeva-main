const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { jwtSecret } = require("../config/env");

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided."
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Invalid token or user inactive"
      });
    }

    req.user = {
      userId: user._id,
      role: user.role,
      name: user.username, // Use username as the name
      student_id: user.student_id || null,
      ward_student_id: user.ward_student_id || null,
      department: user.department || null
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token"
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired"
      });
    }
    next(error);
  }
};

// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    // Flatten the roles array in case it's nested
    const flatRoles = roles.flat();
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    if (!flatRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Insufficient permissions."
      });
    }

    next();
  };
};

// Student data access control - students can only access their own data
const authorizeStudentData = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    const { role, student_id, ward_student_id } = req.user;
    const targetStudentId = req.params.studentId || req.body.student_id || req.query.student_id;
    
    // Ensure student_id and ward_student_id are properly defined
    const safeStudentId = student_id || null;
    const safeWardStudentId = ward_student_id || null;

    // Counselors can access all data
    if (role === "counselor") {
      return next();
    }

    // Students can only access their own data
    if (role === "student") {
      if (!safeStudentId) {
        return res.status(400).json({
          success: false,
          error: "Student ID not found in user profile"
        });
      }
      if (targetStudentId && targetStudentId !== safeStudentId) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You can only view your own data."
        });
      }
      return next();
    }

    // Parents can only access their child's data
    if (role === "parent") {
      if (!safeStudentId) {
        return res.status(400).json({
          success: false,
          error: "Child's Student ID not found in user profile"
        });
      }
      if (targetStudentId && targetStudentId !== safeStudentId) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You can only view your child's data."
        });
      }
      return next();
    }

    // Local guardians can access all student data (institution-level role)
    if (role === "local-guardian") {
      return next();
    }

    // Faculty and exam department have limited access
    if (role === "faculty" || role === "exam-department") {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: "Access denied. Insufficient permissions."
    });
  } catch (error) {
    next(error);
  }
};

// Faculty upload access control
const authorizeFacultyUpload = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required"
    });
  }

  if (req.user.role !== "faculty") {
    return res.status(403).json({
      success: false,
      error: "Only faculty members can upload attendance data"
    });
  }

  next();
};

// Exam department upload access control
const authorizeExamDeptUpload = (req, res, next) => {
  console.log("we are here");
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required"
    });
  }

  if (req.user.role !== "exam-department") {
    console.log("we are here 2");
    
    return res.status(403).json({
      success: false,
      error: "Only exam department can upload exam data"
    });
   
  }

  next();
};

// Action management access control
const authorizeActionManagement = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required"
    });
  }

  const { role } = req.user;
  if (!["counselor", "local-guardian", "parent"].includes(role)) {
    return res.status(403).json({
      success: false,
      error: "Only counselors, guardians, and parents can manage actions"
    });
  }

  next();
};

/**
 * Authorize email alert operations
 * Only counselors and faculty can send email alerts
 */
const authorizeEmailAlerts = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required"
    });
  }

  const { role } = req.user;
  if (!["counselor", "faculty"].includes(role)) {
    return res.status(403).json({
      success: false,
      error: "Only counselors and faculty can send email alerts"
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  authorizeStudentData,
  authorizeFacultyUpload,
  authorizeExamDeptUpload,
  authorizeActionManagement,
  authorizeEmailAlerts
};
