const express = require("express");
const {
  getStudents,
  getStudentById,
  dashboardSummary,
  recalculateRisk,
  createAction,
  updateAction,
  getActions,
  deleteExamData,
  deleteAttendanceData,
  deleteFeesData,
  deleteStudentRecord,
  deleteAllStudentRecords,
  recalculateAllRisks,
} = require("../controllers/studentController");
const { cleanupDuplicateStudents } = require("../controllers/uploadController");
const { 
  authenticate, 
  authorize, 
  authorizeStudentData,
  authorizeActionManagement 
} = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Student data access with role-based filtering
router.get("/", authorize(["counselor", "faculty", "exam-department", "local-guardian"]), getStudents);
router.get("/dashboard/summary", authorize(["counselor", "faculty", "exam-department", "local-guardian"]), dashboardSummary);
router.get("/:studentId", authorizeStudentData, getStudentById);
router.post("/:studentId/recalculate", authorize(["counselor", "faculty", "exam-department"]), recalculateRisk);

// Action management routes
router.post("/:studentId/actions", authorizeActionManagement, createAction);
router.put("/:studentId/actions/:actionId", authorizeActionManagement, updateAction);
router.get("/:studentId/actions", authorizeStudentData, getActions);

// Data deletion routes (role-specific)
router.delete("/:studentId/exam-data", authenticate, deleteExamData);
router.delete("/:studentId/attendance-data", authenticate, deleteAttendanceData);
router.delete("/:studentId/fees-data", authenticate, deleteFeesData);

// Delete ALL student records (counselor and exam-department)
router.delete("/", authorize(["counselor", "exam-department"]), deleteAllStudentRecords);

// Complete student record deletion (counselor only)
router.delete("/:studentId", authorize(["counselor"]), deleteStudentRecord);

// Cleanup duplicate students (counselor only)
router.post("/cleanup-duplicates", authorize(["counselor"]), async (req, res, next) => {
  try {
    const deletedCount = await cleanupDuplicateStudents();
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} duplicate student records`,
      deletedCount
    });
  } catch (error) {
    next(error);
  }
});

// Manual risk recalculation for all students (temporarily open for testing)
router.post("/recalculate-all-risks", authorize(["counselor", "faculty", "exam-department", "local-guardian"]), recalculateAllRisks);

module.exports = router;
