import express from "express";
import {
  createGroup,
  addGroupMember,
  removeGroupMember,
  promoteToAdmin,
  getGroupMembers
} from "../controllers/groupController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createGroup);
router.post("/:conversationId/add", authMiddleware, addGroupMember);
router.post("/:conversationId/remove", authMiddleware, removeGroupMember);
router.post("/:conversationId/promote", authMiddleware, promoteToAdmin);

/* new endpoint */

router.get("/:conversationId/members", authMiddleware, getGroupMembers);

export default router;