const express = require('express');
const router = express.Router();
const { authenticate, authorizeEmailAlerts } = require('../middleware/auth');
const {
  sendEmailAlert,
  getEmailAlerts,
  getStudentEmailAlerts,
  getEligibleStudents,
  updateAlertStatus,
  getAlertStatistics
} = require('../controllers/emailAlertController');

// Apply authentication to all routes
router.use(authenticate);

// Send email alert to student
router.post('/send', authorizeEmailAlerts, sendEmailAlert);

// Get email alerts sent by current user
router.get('/my-alerts', authorizeEmailAlerts, getEmailAlerts);

// Get email alerts for a specific student
router.get('/student/:studentId', getStudentEmailAlerts);

// Get high/medium risk students eligible for email alerts
router.get('/eligible-students', authorizeEmailAlerts, getEligibleStudents);

// Update alert status (for tracking)
router.put('/:alertId/status', updateAlertStatus);

// Get email alert statistics
router.get('/statistics', authorizeEmailAlerts, getAlertStatistics);

module.exports = router;
