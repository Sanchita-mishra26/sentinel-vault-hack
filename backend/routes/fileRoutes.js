console.log("✅ fileRoutes loaded");
const express = require("express");
const multer = require("multer");
const { handleUpload } = require("../controllers/uploadController");
const storage = require("../utils/storage");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const REQUIRED_SHARDS = 3;

// ✅ UPLOAD ROUTE
router.post("/upload", upload.single("file"), (req, res) => {
  console.log("🔥 UPLOAD HIT");
  handleUpload(req, res);
});


// ✅ DELETE SHARD ROUTE
    router.delete("/delete-shard", (req, res) => {
    const { fileId, shardId } = req.body;
        console.log("🔥 DELETE HIT");

  if (!storage.files[fileId]) {
    return res.status(404).json({ message: "File not found" });
  }

  let file = storage.files[fileId];

  Object.keys(file.nodes).forEach(node => {
    file.nodes[node] = file.nodes[node].filter(
      shard => shard.id !== shardId
    );
  });

  console.log(`🗑️ Deleted ${shardId} from ${fileId}`);

  res.json({
    message: "Shard deleted",
    fileId,
    shardId
  });
});


// ✅ DOWNLOAD ROUTE (STEP 3 FIX)
router.get("/download/:fileId", (req, res) => {
  const { fileId } = req.params;
  console.log("🔥 DOWNLOAD HIT");
  

  if (!storage.files[fileId]) {
    return res.status(404).send("File not found");
  }

  const file = storage.files[fileId];

  let collectedShards = [];

  Object.values(file.nodes).forEach(node => {
    node.forEach(shard => {
      if (!collectedShards.find(s => s.id === shard.id)) {
        collectedShards.push(shard);
      }
    });
  });

  console.log(`🧩 Available shards: ${collectedShards.length}`);

if (collectedShards.length < REQUIRED_SHARDS) {
  console.log("⚠️ Missing shards detected. Attempting recovery...");

  // simulate recovery using backup shards
  const missingCount = REQUIRED_SHARDS - collectedShards.length;

  for (let i = 0; i < missingCount; i++) {
    const backupShard = file.shards.find(s => s.id.startsWith("backup"));

    if (backupShard) {
      collectedShards.push(backupShard);
      console.log("♻️ Recovered from backup:", backupShard.id);
    }
  }
}
if (collectedShards.length < REQUIRED_SHARDS) {
  return res.status(500).send("❌ Not enough shards to reconstruct file");
}
  // sort shards
  collectedShards.sort((a, b) => a.id.localeCompare(b.id));

  const combinedData = collectedShards.map(s => s.data).join("");

  const buffer = Buffer.from(combinedData, "base64");

  console.log("🔓 File reconstructed:", file.fileName);

  res.setHeader("Content-Disposition", `attachment; filename=${file.fileName}`);
  res.send(buffer);
});

module.exports = router;
