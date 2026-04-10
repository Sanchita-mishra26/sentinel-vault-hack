const express = require("express");
const router = express.Router();
const { handleChat } = require("../controllers/aiController");

router.post("/", handleChat);

module.exports = router;
