const storage = require("../utils/storage");
const handleUpload = (req, res) => {
  try {
    console.log("🔥 UPLOAD CONTROLLER HIT");
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("📄 File received:", file.originalname);

    // Encryption
    const encryptedData = file.buffer.toString("base64");
    console.log("🔐 File encrypted (base64)");

    // Sharding
    const TOTAL_SHARDS = 5;
    const BACKUP_SHARDS = 2;

    const shardSize = Math.ceil(encryptedData.length / TOTAL_SHARDS);
    const shards = [];

    for (let i = 0; i < TOTAL_SHARDS; i++) {
      const start = i * shardSize;
      const end = start + shardSize;

      shards.push({
        id: `shard-${i + 1}`,
        data: encryptedData.slice(start, end)
      });
    }

    const backup = shards.slice(0, BACKUP_SHARDS).map((s, i) => ({
      id: `backup-${i + 1}`,
      data: s.data
    }));

    const allShards = [...shards, ...backup];
    console.log(`🧩 Shards created: ${allShards.length}`);

    // Node Simulation
    const nodes = {
      node1: [],
      node2: [],
      node3: [],
      node4: [],
      node5: []
    };

    // Distribute shards across nodes (round-robin)
    allShards.forEach((shard, index) => {
      const nodeKeys = Object.keys(nodes);
      const nodeIndex = index % nodeKeys.length;
      const nodeName = nodeKeys[nodeIndex];

      nodes[nodeName].push(shard);
    });

    console.log("Shards distributed across nodes");

    // 🆔 create fileId
const fileId = `file-${Date.now()}`;

// store in memory
storage.files[fileId] = {
  fileName: file.originalname,
  nodes,
  shards: allShards
};

console.log("💾 File stored in memory:", fileId);

    res.json({
  message: "File processed successfully",
  fileId, 
  fileName: file.originalname,
  totalShards: allShards.length,
  nodes: Object.keys(nodes).map(node => ({
    node,
    shardCount: nodes[node].length
  }))
});

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
};

module.exports = { handleUpload };
