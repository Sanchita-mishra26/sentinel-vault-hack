#Sentinel-Vault
*A Zero-Trust, AI-Driven Decentralized Storage Network

"The global average cost of a data breach is $4.44M. The problem isn't the attacks—it's the centralized architecture. Sentinel-Vault fixes the architecture."

*Sentinel-Vault is a highly resilient, decentralized storage platform built for enterprise security. It abandons traditional centralized databases, opting instead for a cryptographic sharding architecture paired with an AI-driven threat intelligence layer. Even if the system is breached, the attacker gets nothing but mathematical garbage.

Enterprise-Grade Features
1. Cryptographic Sharding & Erasure Coding
Zero-Knowledge Architecture: Files are encrypted via AES-256 before being shattered into discrete binary fragments.

Self-Healing Reconstruction: Utilizing advanced Erasure Coding, the system can perfectly mathematically reconstruct the original file even if an entire storage node is destroyed or taken offline.
Visual Sharding Demo: Capable of isolating and downloading single pdf-lib generated fragments to visually prove data decentralization.
  Run `npm run dev` to start the development server.

  ## Demo

![Sebtinel-vault-hack](assets/recent-gif.gif)
  
=======
2. AI Threat Intelligence (LangChain)
*Real-Time IP Forensics: Uses a low-temperature LLM inference engine to analyze login metadata, differentiating between internal credential failure and geographic session-hijacking anomalies.
*Pre-Ingestion Compliance Scanning: Scans document payloads for sensitive PII (like Aadhaar or phone numbers) prior to encryption to ensure DPDP/GDPR compliance.

3. Active Perimeter Defense
*Live Twilio SMS Dispatch: Bypasses standard email alerts by pinging the Lead Engineer's physical device via Twilio API the exact second a critical geographic anomaly is detected.
*WebSocket Lockdown: Instantly freezes the frontend UI via Socket.io during active breach attempts.
Adaptive Rate Limiting: Hardened express routes to mitigate DDoS and credential-stuffing attacks.

4. The Purge Protocol
*Mathematical Garbage Fallback: If an unauthorized user attempts decryption with an invalid AES key, the system actively deceives them by serving a .bin file of cryptographically generated gibberish.
*Absolute Extinction: A global kill-switch that physically shreds all binary shards across the network and neutralizes the metadata ledger, rendering the data digitally extinct.

Tech Stack
*Frontend Interface:
*React.js + Vite
*Tailwind CSS
*Socket.io-client (Real-time Threat UI)
*Backend Infrastructure:
*Node.js & Express
*File System (Decentralized Node Simulation)
*Web Crypto API (AES-256 Encryption/Decryption)
*pdf-lib (Binary PDF Sharding)
*Intelligence & APIs:
*LangChain & OpenRouter (Gemini / AI Inference)
*Twilio SDK (Live SMS Alarms)
*Socket.io (WebSocket Event Emitting).

