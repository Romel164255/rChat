import express from "express";
import {
  createConversation,
  getUserConversations
} from "../controllers/conversationController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   CREATE PRIVATE CHAT
========================= */

router.post("/", authMiddleware, createConversation);

/* =========================
   GET USER CONVERSATIONS
========================= */

router.get("/", authMiddleware, getUserConversations);

export default router;