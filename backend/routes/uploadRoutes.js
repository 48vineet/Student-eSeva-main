const express = require("express");
const multer = require("multer");
const { uploadController } = require("../controllers/uploadController");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Add debugging middleware
router.post("/", (req, res, next) => {
  console.log("Upload route hit:", {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    files: req.files
  });
  next();
}, upload.single("file"), uploadController);

module.exports = router;
