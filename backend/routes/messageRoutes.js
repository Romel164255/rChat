import express from "express";
import {
  sendMessage,
  getMessages,
  updateMessageStatus,
  markConversationRead
} from "../controllers/messageController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   MESSAGE ROUTES
========================= */

router.post("/", authMiddleware, sendMessage);

router.get("/:conversationId", authMiddleware, getMessages);

router.post("/status", authMiddleware, updateMessageStatus);

router.post("/:conversationId/read", authMiddleware, markConversationRead);

export default router;