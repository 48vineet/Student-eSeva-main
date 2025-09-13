const express = require("express");
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);

module.exports = router;
