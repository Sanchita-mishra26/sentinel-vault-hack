const express = require("express");
const router = express.Router();
const { handleChat, handleIpAnalysis } = require("../controllers/aiController");

router.post("/", handleChat);
router.post("/analyze-ip", handleIpAnalysis);

module.exports = router;
