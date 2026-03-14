import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {

    const users = await pool.query("SELECT COUNT(*) FROM users");
    const messages = await pool.query("SELECT COUNT(*) FROM messages");
    const conversations = await pool.query("SELECT COUNT(*) FROM conversations");
    const groups = await pool.query("SELECT COUNT(*) FROM groups");

    res.json({
      users: users.rows[0].count,
      messages: messages.rows[0].count,
      conversations: conversations.rows[0].count,
      groups: groups.rows[0].count
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;