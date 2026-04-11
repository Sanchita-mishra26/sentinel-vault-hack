require('dotenv').config(); // 🚨 THE MAGIC FIX: This loads your keys before Twilio boots
const express = require("express");
const router = express.Router();
const twilio = require('twilio');

// Grabbing credentials from the .env file for security
const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Existing intrusion mock for wrong passwords inside /login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === 'junior@sentinel.com') {
    if (password === 'junior123') return res.json({ success: true, role: 'junior', email });
    req.io.emit('security_breach', { level: 'warning', message: 'Unauthorized Junior access attempt detected.' });

    console.log("=========================================");
    console.log("🚨 [SENDGRID API] Dispatching threat email to: admin@sentinel.com");
    console.log("🚨 [TWILIO API] Dispatching SMS warning to Admin Phone: 8377891315");
    console.log("=========================================");

    return res.json({ success: false, triggerMFA: true, alertType: 'dual_alert_triggered' });
  }

  if (email === 'admin@sentinel.com') {
    if (password === 'admin123') return res.json({ success: true, role: 'admin', email });
    req.io.emit('security_breach', { level: 'critical', message: 'CRITICAL: Admin credentials compromised.' });

    if (process.env.MY_REAL_PHONE_NUMBER && process.env.TWILIO_PHONE_NUMBER) {
      client.messages.create({
        body: '🚨 SENTINEL VAULT CRITICAL: Admin credentials failed. Geographic anomaly detected by AI. Immediate lockdown initiated.',
        to: process.env.MY_REAL_PHONE_NUMBER, // The phone in your hand
        from: process.env.TWILIO_PHONE_NUMBER // Your Twilio virtual number
      })
        .then(message => console.log(`[REAL SMS SENT SUCCESS] SID: ${message.sid}`))
        .catch(error => console.error(`[SMS DISPATCH FAILED] ${error.message}`));
    } else {
      console.log("🚨 [TWILIO OFFLINE] Simulated dispatch: 'Admin credentials failed. Geographic anomaly detected.'");
      console.log("ℹ️ ADD 'MY_REAL_PHONE_NUMBER' AND 'TWILIO_PHONE_NUMBER' TO .env TO ENABLE LIVE SMS.");
    }

    return res.json({ success: false, triggerMFA: true, alertType: 'sms_sent' });
  }

  return res.json({ success: false, triggerMFA: true, alertType: 'unknown' });
});

// We keep the old intrusion-alert for backward compatibility mostly 
// (or could remove if Auth now purely uses /login)
router.post("/intrusion-alert", (req, res) => {
  const { email } = req.body;
  if (email === 'junior@sentinel.com') {
    console.log("[EMAIL ALERT] Junior access denied. Alerting admin@sentinel.com");
    if (req.io) req.io.emit('security_breach', { level: 'warning', message: 'Unauthorized access attempt by Junior account.' });
    return res.json({ success: true, triggerMFA: true, alertType: 'admin_notified' });
  }

  if (email === 'admin@sentinel.com') {
    console.log("[SMS ALERT] Admin breach attempt. Sending OTP to 8377891315");
    if (req.io) req.io.emit('security_breach', { level: 'critical', message: 'CRITICAL: Admin credentials compromised.' });
    return res.json({ success: true, triggerMFA: true, alertType: 'sms_sent' });
  }

  return res.json({ success: true, triggerMFA: true, alertType: 'unknown' });
});

module.exports = router;