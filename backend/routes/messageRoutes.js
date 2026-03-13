import express from "express";
import {
  sendMessage,
  getMessages,
  updateMessageStatus,
  markConversationRead,
} from "../controllers/messageController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Static routes MUST be declared before dynamic /:param routes
// to prevent Express from matching "status" as a conversationId.
router.post("/status", authMiddleware, updateMessageStatus);

router.post("/", authMiddleware, sendMessage);
router.get("/:conversationId", authMiddleware, getMessages);
router.post("/:conversationId/read", authMiddleware, markConversationRead);

export default router;