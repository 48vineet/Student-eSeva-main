const express = require("express");
const { sendNotifications } = require("../controllers/notificationController");

const router = express.Router();

router.post("/", sendNotifications);

module.exports = router;
