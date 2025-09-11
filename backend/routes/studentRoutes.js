const express = require("express");
const {
  getStudents,
  getStudentById,
  dashboardSummary,
  recalculateRisk,
} = require("../controllers/studentController");

const router = express.Router();

router.get("/", getStudents);
router.get("/dashboard/summary", dashboardSummary);
router.get("/:studentId", getStudentById);
router.post("/:studentId/recalculate", recalculateRisk);

module.exports = router;
