import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../db.js";
import { generateOTP } from "../services/otpService.js";
import { normalizePhone } from "../utils/normalizePhone.js";

/* =========================
   REQUEST OTP
========================= */

export async function requestOTP(req, res) {

  try {

    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: "Phone number required"
      });
    }

    phone = normalizePhone(phone);

    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    /* delete previous otp */

    await pool.query(
      "DELETE FROM otp_codes WHERE phone=$1",
      [phone]
    );

    /* insert new otp */

    await pool.query(
      `
      INSERT INTO otp_codes (phone, code, expires_at)
      VALUES ($1,$2,$3)
      `,
      [phone, otp, expires]
    );

    console.log("OTP:", otp);

    res.json({
      message: "OTP sent"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}


/* =========================
   VERIFY OTP
========================= */

export async function verifyOTP(req, res) {

  try {

    let { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        error: "Phone and OTP required"
      });
    }

    phone = normalizePhone(phone);

    const result = await pool.query(
      `
      SELECT *
      FROM otp_codes
      WHERE phone=$1
      ORDER BY expires_at DESC
      LIMIT 1
      `,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "Invalid OTP"
      });
    }

    const otpRecord = result.rows[0];

    if (otpRecord.code !== code) {
      return res.status(400).json({
        error: "Invalid OTP"
      });
    }

    if (new Date() > otpRecord.expires_at) {
      return res.status(400).json({
        error: "OTP expired"
      });
    }

    /* delete otp */

    await pool.query(
      "DELETE FROM otp_codes WHERE phone=$1",
      [phone]
    );

    /* find user */

    let user = await pool.query(
      "SELECT * FROM users WHERE phone=$1",
      [phone]
    );

    /* create user if not exists */

    if (user.rows.length === 0) {

      const id = crypto.randomUUID();

      await pool.query(
        `
        INSERT INTO users (id, phone)
        VALUES ($1,$2)
        `,
        [id, phone]
      );

      user = await pool.query(
        "SELECT * FROM users WHERE phone=$1",
        [phone]
      );

    }

    const token = jwt.sign(
      { id: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login success",
      token
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}


/* =========================
   CURRENT USER
========================= */

export async function getMe(req, res) {

  try {

    const result = await pool.query(
      `
      SELECT id, phone, username, display_name
      FROM users
      WHERE id=$1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}