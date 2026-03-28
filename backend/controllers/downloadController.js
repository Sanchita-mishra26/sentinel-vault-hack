const storage = require("../utils/storage");

const handleDownload = (req, res) => {
  try {
    const { fileId } = req.params;

    const file = storage.files[fileId];

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const { nodes } = file;

    // 🔥 Collect all shards from all nodes
    let collectedShards = [];

    Object.values(nodes).forEach(nodeShards => {
      collectedShards.push(...nodeShards);
    });

    // ❗ Remove duplicates (backup shards)
    const uniqueShardsMap = {};
    collectedShards.forEach(shard => {
      if (!uniqueShardsMap[shard.id]) {
        uniqueShardsMap[shard.id] = shard.data;
      }
    });

    const uniqueShards = Object.entries(uniqueShardsMap)
      .filter(([id]) => id.startsWith("shard")) // only main shards
      .sort((a, b) => a[0].localeCompare(b[0]));

    console.log("🧩 Available shards:", uniqueShards.length);

    if (uniqueShards.length < 3) {
      return res.status(500).json({
        message: "Not enough shards to reconstruct file"
      });
    }

    // 🔥 Reconstruct base64 string
    const reconstructedBase64 = uniqueShards
      .map(([_, data]) => data)
      .join("");

    const fileBuffer = Buffer.from(reconstructedBase64, "base64");

    console.log("♻️ File reconstructed successfully");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${file.fileName}`
    );

    res.send(fileBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Download failed" });
  }
};

module.exports = { handleDownload };