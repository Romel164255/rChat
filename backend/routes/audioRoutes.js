import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadAudio } from "../controllers/audioController.js";

const router = express.Router();

/* ─────────────────────────────
   Multer — store file in memory
   (we stream it straight to Cloudinary)
   Limit: 10MB per audio file
───────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    // Accept common audio MIME types recorded by browsers
    const allowed = [
      "audio/webm",
      "audio/ogg",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
      "video/webm", // Chrome labels MediaRecorder output as video/webm
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio type: ${file.mimetype}`));
    }
  },
});

/* ─────────────────────────────
   POST /audio/upload
   Body: multipart/form-data
     - audio  (file)          the recorded blob
     - conversation_id (text) target conversation
   Returns: message object { id, conversation_id, sender_id, content, status, created_at }
───────────────────────────── */
router.post(
  "/upload",
  authMiddleware,
  upload.single("audio"),
  uploadAudio
);

export default router;
