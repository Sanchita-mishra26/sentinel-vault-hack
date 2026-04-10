const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const storage = require("../utils/storage"); // 1. REQUIRE YOUR STORAGE UTIL
const { createShardsInternal } = require("./shardController");

const handleUpload = async (req, res) => {
  try {
    console.log("🔥 UPLOAD CONTROLLER HIT");
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    console.log("📄 File received:", file.originalname);

    let piiResult = null;
    let piiStatus = "success";

    // PII Scanning Block
    try {
      const data = await pdfParse(file.buffer);
      const text = data.text || "";
      const emails = (text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/ig) || []).length;
      const phones = (text.match(/\b\d{10}\b/g) || []).length;
      const creditCards = (text.match(/\b\d{16}\b/g) || []).length;

      const totalMatches = emails + phones + creditCards;
      let threatLevel = "Low";
      if (totalMatches > 3) threatLevel = "High";
      else if (totalMatches >= 1) threatLevel = "Medium";

      piiResult = { emails, phones, creditCards, threatLevel };
    } catch (scanError) {
      console.error("PII Scan Error (Skipping):", scanError.message);
      piiStatus = "skipped_or_failed";
    }

    // Encryption Block
    const algorithm = "aes-256-gcm";
    const secretKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encryptedBuffer = Buffer.concat([cipher.update(file.buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const uploadDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fileId = `file-${Date.now()}`; // 2. CREATE A UNIQUE ID FOR THE FILE
    const encryptedFileName = `enc-${Date.now()}-${file.originalname}`;
    const encryptedFilePath = path.join(uploadDir, encryptedFileName);

    fs.writeFileSync(encryptedFilePath, Buffer.concat([encryptedBuffer, authTag]));
    console.log("🔐 File encrypted and stored at:", encryptedFilePath);

    // --- AUTOMATIC SHARDING & REDUNDANCY ---
    console.log("🔪 Triggering Automatic Sharding...");
    let shardPaths = [];
    try {
      shardPaths = await createShardsInternal(encryptedFilePath, 3);
      console.log("✅ Sharding & Redundancy Complete.");
    } catch (shardErr) {
      console.error("❌ Auto-Sharding Failed:", shardErr.message);
    }

    // 3. SAVE METADATA TO STORAGE (Crucial for Part 3)
    // We save the keys so we can reconstruct the file later
    storage.files[fileId] = {
      originalName: file.originalname,
      encryptedPath: encryptedFilePath,
      secretKey: secretKey.toString("hex"),
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
      shards: shardPaths.map(p => path.basename(p)),
      piiStatus: piiStatus,
      threatLevel: piiResult ? piiResult.threatLevel : "N/A"
    };

    console.log(`💾 Metadata saved for File ID: ${fileId}`);

    // Success Response Payload
    res.json({
      success: true,
      fileId: fileId,
      message: "File processed, encrypted, and distributed.",
      metadata: storage.files[fileId]
    });

  } catch (error) {
    console.error("Encryption/Upload Error:", error);
    res.status(500).json({ success: false, message: "Encryption and Upload failed" });
  }
};

module.exports = { handleUpload };