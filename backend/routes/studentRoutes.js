const express = require("express");
const {
  getStudents,
  getStudentById,
  dashboardSummary,
  recalculateRisk,
  createAction,
  updateAction,
  getActions,
} = require("../controllers/studentController");
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
router.get("/:studentId/actions", authorizeActionManagement, getActions);

module.exports = router;
