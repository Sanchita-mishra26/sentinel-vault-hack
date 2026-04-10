const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const storage = require("../utils/storage");

const handleDownload = async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileMeta = storage.files[fileId];

    if (!fileMeta) {
      return res.status(404).json({ success: false, message: "File metadata not found" });
    }

    const { originalName, secretKey, iv, authTag, shards } = fileMeta;
    const storageBase = path.join(__dirname, '..', 'storage');

    const collectedBuffers = [];

    // 1. COLLECT: Guaranteed 0 -> 1 -> 2 order
    for (let i = 0; i < 3; i++) {
      const shardName = shards[i];
      let shardPath;

      if (i === 0) shardPath = path.join(storageBase, 'node_a', shardName);
      else if (i === 1) shardPath = path.join(storageBase, 'node_b', shardName);
      else if (i === 2) shardPath = path.join(storageBase, 'node_c', shardName);

      // Simple Failover check
      if (!fs.existsSync(shardPath)) {
        // Check replica logic here if needed, but for now we assume nodes are healthy
        throw new Error(`Shard ${shardName} missing at ${shardPath}`);
      }
      collectedBuffers.push(fs.readFileSync(shardPath));
    }

    const encryptedBuffer = Buffer.concat(collectedBuffers);

    // 2. DECRYPT: AES-256-GCM
    const keyBuffer = Buffer.from(secretKey, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    // Strip the 16-byte AuthTag appended during upload
    const actualCipherText = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);

    const decryptedBuffer = Buffer.concat([
      decipher.update(actualCipherText),
      decipher.final()
    ]);

    // 3. SEND: Pure Binary Stream
    console.log(`📥 [SENTINEL-VAULT] Reconstructed: ${originalName}`);

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${originalName}"`,
      'Content-Length': decryptedBuffer.length
    });

    res.end(decryptedBuffer);

  } catch (error) {
    console.error("❌ Decryption Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { handleDownload };