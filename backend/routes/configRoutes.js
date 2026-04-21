const express = require("express");
const {
  getConfig,
  updateConfig,
  resetConfig,
} = require("../controllers/configController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);
router.use(
  authorize(["counselor", "faculty", "exam-department", "local-guardian"]),
);

router.get("/", getConfig);
router.post("/", updateConfig);
router.post("/reset", resetConfig);

module.exports = router;
