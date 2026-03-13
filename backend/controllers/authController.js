import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../db.js";
import { generateOTP } from "../services/otpService.js";
import { normalizePhone } from "../utils/normalizePhone.js";

/* =========================
   OTP rate-limit store (in-memory).
   For production, replace with Redis.
========================= */

const otpRateLimit = new Map(); // phone → { count, windowStart }
const OTP_MAX_REQUESTS = 5;     // max OTP requests per window
const OTP_WINDOW_MS = 10 * 60 * 1000; // 10-minute window

function checkRateLimit(phone) {
  const now = Date.now();
  const entry = otpRateLimit.get(phone);

  if (!entry || now - entry.windowStart > OTP_WINDOW_MS) {
    otpRateLimit.set(phone, { count: 1, windowStart: now });
    return true; // allowed
  }

  if (entry.count >= OTP_MAX_REQUESTS) {
    return false; // blocked
  }

  entry.count += 1;
  return true;
}

/* =========================
   REQUEST OTP
========================= */

export async function requestOTP(req, res) {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number required" });
    }

    phone = normalizePhone(phone);

    if (!phone) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    if (!checkRateLimit(phone)) {
      return res.status(429).json({
        error: "Too many OTP requests. Please wait before requesting again.",
      });
    }

    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTP for this phone
    await pool.query("DELETE FROM otp_codes WHERE phone = $1", [phone]);

    // Insert new OTP
    await pool.query(
      `INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)`,
      [phone, otp, expires]
    );

    // TODO: Integrate a real SMS provider (Twilio, AWS SNS, etc.)
    // sendSMS(phone, `Your Chatty OTP is: ${otp}`)
    //
    // DO NOT log the OTP — it is a secret credential.
    console.log(`[OTP] Sent to ${phone} (integrate SMS provider)`);

    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("requestOTP error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/* =========================
   VERIFY OTP
========================= */

export async function verifyOTP(req, res) {
  try {
    let { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: "Phone and OTP required" });
    }

    phone = normalizePhone(phone);

    if (!phone) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    const result = await pool.query(
      `SELECT * FROM otp_codes WHERE phone = $1 ORDER BY expires_at DESC LIMIT 1`,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "No OTP found. Please request a new one." });
    }

    const otpRecord = result.rows[0];

    // 1. Check expiry FIRST (before deleting)
    if (new Date() > new Date(otpRecord.expires_at)) {
      await pool.query("DELETE FROM otp_codes WHERE phone = $1", [phone]);
      return res.status(400).json({ error: "OTP expired. Please request a new one." });
    }

    // 2. Verify code
    if (otpRecord.code !== code) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // 3. Delete OTP (consumed)
    await pool.query("DELETE FROM otp_codes WHERE phone = $1", [phone]);

    // Find or create user
    let userResult = await pool.query(
      "SELECT * FROM users WHERE phone = $1",
      [phone]
    );

    if (userResult.rows.length === 0) {
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO users (id, phone) VALUES ($1, $2)`,
        [id, phone]
      );
      userResult = await pool.query(
        "SELECT * FROM users WHERE phone = $1",
        [phone]
      );
    }

    const user = userResult.rows[0];

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login success",
      token,
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        display_name: user.display_name,
      },
    });
  } catch (err) {
    console.error("verifyOTP error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/* =========================
   CURRENT USER
========================= */

export async function getMe(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, phone, username, display_name FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ error: "Server error" });
  }
}