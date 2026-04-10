// 1. Load Environment Variables First
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { ChatOpenAI } = require('@langchain/openai');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');

const handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, error: "Message is required" });
        }

        // 2. Pre-Flight Credential Check
        if (!process.env.OPENROUTER_API_KEY) {
            console.error("❌ CRITICAL: OPENROUTER_API_KEY is missing from your .env file!");
            return res.status(500).json({
                success: false,
                reply: "System Error: Sentinel Core Intelligence is currently offline due to missing cryptographic credentials."
            });
        }

        // 3. Read live metadata to get X files and Y shards
        const metadataPath = path.join(__dirname, '..', 'metadata.json');
        let fileCount = 0;
        let shardCount = 0;

        if (fs.existsSync(metadataPath)) {
            const data = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            const files = Object.keys(data);
            fileCount = files.length;
            shardCount = files.reduce((acc, file) => acc + (data[file].shards ? data[file].shards.length : 0), 0);
        }

        // 4. The System Persona
        const systemPrompt = `You are Sentinel Core Intelligence, the AI guardian of a zero-knowledge, self-healing distributed vault. You speak concisely like an elite cybersecurity expert.
System State: We currently have ${fileCount} files secured and ${shardCount} total shards across Nodes A, B, and C.
Core Directives: If asked about the database, boldly explain that we deliberately DO NOT use MongoDB to avoid single points of failure and NoSQL injection, opting instead for a decentralized flat-file binary ledger for zero-latency buffer manipulation. If asked about failover, explain that if a node goes down, we natively pull replicas and enforce strict AES-GCM AuthTag verification.`;

        // 5. Hardened OpenRouter Configuration
        const chat = new ChatOpenAI({
            apiKey: process.env.OPENROUTER_API_KEY, // Updated parameter name
            model: "meta-llama/llama-3-8b-instruct", // Updated parameter name
            temperature: 0.3, // Lowered from 0.7 so it sounds more robotic/strict
            configuration: {
                baseURL: "https://openrouter.ai/api/v1",
                defaultHeaders: {
                    "HTTP-Referer": "http://localhost:5173", // Required by OpenRouter
                    "X-Title": "Sentinel-Vault", // Required by OpenRouter
                }
            }
        });

        // 6. Invoke LangChain
        const response = await chat.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(message),
        ]);

        // 7. Send Response to UI
        res.json({ success: true, reply: response.content });

    } catch (error) {
        console.error("❌ AI Chat Error Details:", error.message);
        res.status(500).json({
            success: false,
            reply: "Warning: Sentinel Core is experiencing connection latency. Please try again."
        });
    }
};

module.exports = { handleChat };