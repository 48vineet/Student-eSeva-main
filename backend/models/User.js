const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      required: true,
      enum: ["counselor", "faculty", "exam-department", "student", "local-guardian", "parent"],
      default: "student",
    },
    // For students - link to student records
    student_id: {
      type: String,
      required: function() {
        return this.role === "student";
      },
      trim: true,
    },
    // For parents - link to their child's student record
    ward_student_id: {
      type: String,
      required: function() {
        return this.role === "parent";
      },
      trim: true,
    },
    // For faculty - department information
    department: {
      type: String,
      required: function() {
        return this.role === "faculty";
      },
      trim: true,
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Last login tracking
    lastLogin: {
      type: Date,
      default: null,
    },
    // Password reset fields
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

// Index for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ student_id: 1 });

module.exports = mongoose.model("User", UserSchema);
