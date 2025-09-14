const express = require("express");
const multer = require("multer");
const { uploadController } = require("../controllers/uploadController");
const { 
  authenticate, 
  authorizeFacultyUpload, 
  authorizeExamDeptUpload,
  authorize 
} = require("../middleware/auth");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// All upload routes require authentication
router.use(authenticate);

// Faculty attendance upload
router.post("/attendance", authorizeFacultyUpload, upload.single("file"), uploadController);

// Faculty student data upload (with emails)
router.post("/", authorize(["faculty"]), upload.single("file"), uploadController);

// Exam department data upload
router.post("/exam-data", authorizeExamDeptUpload, upload.single("file"), uploadController);

// Local guardian fees upload
router.post("/fees", authorize(["local-guardian"]), upload.single("file"), uploadController);

// Full data upload (counselor only)
router.post("/", authorize(["counselor"]), upload.single("file"), uploadController);

module.exports = router;
