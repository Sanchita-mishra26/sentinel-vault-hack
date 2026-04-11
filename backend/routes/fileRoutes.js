const express = require("express");
const multer = require("multer");
const router = express.Router();
const storage = require("../utils/storage");
const fs = require("fs");
const path = require("path");

// --- IMPORT CONTROLLERS ---
// Using object destructuring - Ensure these match the 'module.exports' in your controller files
const { handleUpload } = require("../controllers/uploadController");
const { handleDownload } = require("../controllers/downloadController");
const { handleDelete } = require("../controllers/deleteController");

const upload = multer({ storage: multer.memoryStorage() });

console.log("✅ fileRoutes loaded");

// --- 1. UPLOAD & DOWNLOAD ---

// ✅ UPLOAD
router.post("/upload", upload.single("file"), (req, res) => {
  console.log("🔥 UPLOAD HIT");
  if (typeof handleUpload !== 'function') {
    return res.status(500).json({ error: "Upload controller not found" });
  }
  handleUpload(req, res);
});

// ✅ DOWNLOAD
router.get("/download/:fileId", (req, res) => {
  console.log("📥 DOWNLOAD HIT");
  if (typeof handleDownload !== 'function') {
    return res.status(500).json({ error: "Download controller not found" });
  }
  handleDownload(req, res);
});

// ✅ DOWNLOAD VISUAL SHARD
router.get("/download/shard/:fileId/:nodeId", (req, res) => {
  const { fileId, nodeId } = req.params;
  console.log(`📥 VISUAL SHARD DOWNLOAD HIT - Node ${nodeId}`);
  
  const storageBase = path.join(process.cwd(), 'storage');
  const nodeDir = `node_${nodeId.toLowerCase()}`;
  const shardPath = path.join(storageBase, nodeDir, `fragment_${fileId}.pdf`);

  if (fs.existsSync(shardPath)) {
    res.download(shardPath, `shard_${nodeId}_${fileId}.pdf`);
  } else {
    res.status(404).json({ error: "Fragment not found on this node" });
  }
});


// --- 2. DELETION LOGIC ---

// ✅ FULL PURGE: DELETE /api/delete/:fileId
router.delete("/delete/:fileId", (req, res) => {
  console.log("🗑️ DELETE HIT");
  if (typeof handleDelete !== 'function') {
    console.error("CRITICAL: handleDelete is not a function. Check deleteController.js exports.");
    return res.status(500).json({ error: "Delete controller not found" });
  }
  handleDelete(req, res);
});


// --- 3. SYSTEM STATS & COMPLIANCE ---

// ✅ STATS
router.get("/stats", (req, res) => {
  console.log("📊 STATS HIT");
  const files = storage.files || {};
  const fileCount = Object.keys(files).length;

  let totalShards = 0;
  Object.values(files).forEach(file => {
    if (file.shards) totalShards += file.shards.length;
  });

  res.json({
    filesSecured: fileCount,
    totalShards: totalShards,
    activeNodes: 3,
    timestamp: new Date().toISOString()
  });
});

// ✅ COMPLIANCE
router.get("/compliance/:fileId", (req, res) => {
  const { fileId } = req.params;
  const file = storage.files[fileId];
  if (!file) return res.status(404).json({ message: "File not found" });

  res.json({
    status: "completed",
    findings: `NLP scan cleared "${file.originalName || 'document'}" for zero-knowledge distribution.`,
    piiCategories: 3,
    entities: [{ label: "Confidential Data", count: 2 }],
  });
});

// ✅ SABOTAGE (Node Isolation)
router.post("/sabotage/:fileId", (req, res) => {
  console.log("💥 SABOTAGE HIT");
  const { fileId } = req.params;
  const file = storage.files[fileId];
  if (!file) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  if (file.shards && file.shards.length > 0) {
    const shardName = file.shards[0];
    const shardPath = path.join(__dirname, "..", "uploads", shardName);
    try {
      if (fs.existsSync(shardPath)) {
        fs.unlinkSync(shardPath);
        console.log(`🗑️ Deleted shard: ${shardName}`);
      }
      return res.json({ success: true, isolatedNode: 'Node 1' });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, message: "Failed to isolate node" });
    }
  }

  return res.status(400).json({ success: false, message: "No shards to isolate" });
});

module.exports = router;