const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { updateAction } = require('../controllers/studentController');

// All routes require authentication
router.use(authenticate);

// Action update route for parents
router.put("/:actionId", authorize(["parent"]), updateAction);

module.exports = router;
