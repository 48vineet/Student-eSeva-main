const User = require("../models/User");
const Student = require("../models/Student");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });
};

// Register new user
const register = async (req, res, next) => {
  try {
    const { username, email, password, role, student_id, ward_student_id, department } = req.body;

    // Validate required fields based on role
    if (role === "student" && !student_id) {
      return res.status(400).json({
        success: false,
        error: "Student ID is required for student role"
      });
    }

    if (role === "local-guardian" && !ward_student_id) {
      return res.status(400).json({
        success: false,
        error: "Ward Student ID is required for guardian role"
      });
    }

    if (role === "faculty" && !department) {
      return res.status(400).json({
        success: false,
        error: "Department is required for faculty role"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email or username already exists"
      });
    }

    // For students and guardians, verify the student exists
    if (role === "student" || role === "local-guardian") {
      const studentId = role === "student" ? student_id : ward_student_id;
      const student = await Student.findOne({ student_id: studentId });
      
      if (!student) {
        return res.status(400).json({
          success: false,
          error: `Student with ID ${studentId} not found`
        });
      }

      // For guardians, verify the email matches
      if (role === "local-guardian" && student.parent_email !== email) {
        return res.status(400).json({
          success: false,
          error: "Email does not match the parent email on record"
        });
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role,
      student_id: role === "student" ? student_id : undefined,
      ward_student_id: role === "local-guardian" ? ward_student_id : undefined,
      department: role === "faculty" ? department : undefined,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: user.toJSON(),
      token
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      user: user.toJSON(),
      token
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const { username, email, department } = req.body;
    const userId = req.user.userId;

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (department && req.user.role === "faculty") updateData.department = department;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect"
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
