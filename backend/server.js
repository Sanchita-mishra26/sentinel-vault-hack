const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const fileRoutes = require("./routes/fileRoutes");
const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }
});

app.use((req, res, next) => { req.io = io; next(); });

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());



// Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: { success: false, message: "🚨 Security Protocol: Too many requests. IP throttled for 15 minutes." }
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 5,
  message: { success: false, message: "🚨 Security Protocol: Too many requests. IP throttled for 60 seconds." }
});

// Apply Limiters
app.use("/api", globalLimiter);
app.use("/api/auth/login", strictLimiter);
app.use("/api/upload", strictLimiter);

// Main Routes
app.use("/api", fileRoutes);
app.use("/api/chat", aiRoutes);
app.use("/api/auth", authRoutes);
const shardRoutes = require("./routes/shard");
app.use("/api", shardRoutes);


server.listen(5000, () => {
  console.log("Server running on port 5000");
});