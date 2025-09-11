const express = require("express");
const { getConfig, updateConfig, resetConfig } = require("../controllers/configController");

const router = express.Router();

router.get("/", getConfig);
router.post("/", updateConfig);
router.post("/reset", resetConfig);

module.exports = router;
