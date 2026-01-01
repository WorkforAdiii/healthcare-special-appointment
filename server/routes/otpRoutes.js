import express from "express";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

const router = express.Router();
const otpStore = new Map();

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email credentials (EMAIL_USER and EMAIL_PASS) are not configured in environment variables");
    }

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error("Transporter Error (EAUTH?):", error.message);
      } else {
        console.log("Email transporter ready ✓");
      }
    });
  }
  return transporter;
};
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const snapshot = await admin
      .firestore()
      .collection("users")
      .where("email", "==", email)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Email not registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const emailTransporter = getTransporter();

    await emailTransporter.sendMail({
      from: `"CareSync Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Password Reset Code",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset</h2>
          <p>You requested a password reset. Use the code below to proceed:</p>
          <h1 style="color: #1677FF;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("OTP Send Error:", err);
    
    if (err.message && err.message.includes("Email credentials")) {
      return res.status(500).json({ error: "Email service not configured. Please contact administrator." });
    }
    
    res.status(500).json({ error: "Failed to send OTP. Check server logs." });
  }
});

// 📌 VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore.get(email);

    if (!record)
      return res.status(400).json({ error: "No OTP found for this email" });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP expired" });
    }
    if (record.otp !== otp)
      return res.status(400).json({ error: "Invalid OTP" });

    res.json({ message: "OTP verified", resetToken: "verified-session" });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// 📌 UPDATE PASSWORD
router.post("/update-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const userRecord = await admin.auth().getUserByEmail(email);

    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword,
    });

    otpStore.delete(email);

    res.json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: "Failed to update password" });
  }
});

export default router;
