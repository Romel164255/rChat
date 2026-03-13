import express from "express";
import { setUsername, searchUsers } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   USER PROFILE
========================= */

router.post("/username", authMiddleware, setUsername);
router.get("/search", authMiddleware, searchUsers);

export default router;



