const express = require("express");
const router = express.Router();

const storage = require("../utils/storage");
const { createShards } = require("../controllers/shardController");

// POST / Endpoint (Disabled as createShards is now internal)
// router.post("/", createShards);

router.delete("/delete-shard", (req, res) => {
  const { fileId, shardId } = req.body;

  const file = storage.files[fileId];

  if (!file) {
    return res.status(404).json({ message: "File not found" });
  }

  let deleted = false;

  Object.keys(file.nodes).forEach(node => {
    file.nodes[node] = file.nodes[node].filter(shard => {
      if (shard.id === shardId) {
        deleted = true;
        return false;
      }
      return true;
    });
  });

  if (!deleted) {
    return res.status(404).json({ message: "Shard not found" });
  }

  console.log(`Shard deleted: ${shardId}`);

  res.json({
    message: "Shard deleted successfully",
    shardId
  });
});

module.exports = router;