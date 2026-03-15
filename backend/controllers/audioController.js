import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { pool } from "../db.js";

/* ─────────────────────────────
   Cloudinary config
   Make sure these are in your .env:
     CLOUDINARY_CLOUD_NAME
     CLOUDINARY_API_KEY
     CLOUDINARY_API_SECRET
───────────────────────────── */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ─────────────────────────────
   Helper — stream buffer → Cloudinary
───────────────────────────── */
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",   // Cloudinary uses "video" for audio files
        folder: "rchat_audio",
        format: "webm",
        // Optional: auto-delete after 30 days to save storage
        // invalidate: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/* ─────────────────────────────
   POST /audio/upload
   — Uploads the audio blob to Cloudinary
   — Saves a message row with content = "audio:<url>"
   — Returns the full message object (same shape as sendMessage)
───────────────────────────── */
export async function uploadAudio(req, res) {
  try {
    // multer puts the file on req.file
    if (!req.file) {
      return res.status(400).json({ error: "No audio file received" });
    }

    const { conversation_id } = req.body;
    if (!conversation_id) {
      return res.status(400).json({ error: "conversation_id is required" });
    }

    const senderId = req.user.id;

    /* 1. Upload to Cloudinary */
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
    const audioUrl = cloudinaryResult.secure_url;

    /* 2. Save message to DB with "audio:" prefix so the frontend can detect it */
    const content = `audio:${audioUrl}`;

    const { rows } = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content, status)
       VALUES ($1, $2, $3, 'sent')
       RETURNING id, conversation_id, sender_id, content, status, created_at`,
      [conversation_id, senderId, content]
    );

    const message = rows[0];

    /* 3. Update conversation's updated_at so it bubbles to top of sidebar */
    await pool.query(
      `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
      [conversation_id]
    );

    return res.status(201).json(message);

  } catch (err) {
    console.error("Audio upload error:", err);
    return res.status(500).json({ error: "Audio upload failed" });
  }
}
