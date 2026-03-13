import crypto from "crypto";
import { pool } from "../db.js";

/* =========================
   SEND MESSAGE
========================= */

export async function sendMessage(req, res) {

  try {

    const { conversation_id, content } = req.body;

    if (!conversation_id || !content) {
      return res.status(400).json({
        error: "conversation_id and content required"
      });
    }

    const messageId = crypto.randomUUID();

    await pool.query(
      `
      INSERT INTO messages
      (id, conversation_id, sender_id, content, status)
      VALUES ($1,$2,$3,$4,'sent')
      `,
      [messageId, conversation_id, req.user.id, content]
    );

    res.json({
      message: "Message sent",
      id: messageId
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}


/* =========================
   GET MESSAGES
   CURSOR PAGINATION
========================= */

export async function getMessages(req, res) {

  try {

    const { conversationId } = req.params;

    const limit = parseInt(req.query.limit) || 20;
    const before = req.query.before;

    let result;

    if (!before) {

      result = await pool.query(
        `
        SELECT id, sender_id, content, status, created_at
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        `,
        [conversationId, limit]
      );

    } else {

      result = await pool.query(
        `
        SELECT id, sender_id, content, status, created_at
        FROM messages
        WHERE conversation_id = $1
        AND created_at < $2
        ORDER BY created_at DESC
        LIMIT $3
        `,
        [conversationId, before, limit]
      );

    }

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}


/* =========================
   UPDATE MESSAGE STATUS
========================= */

export async function updateMessageStatus(req, res) {

  try {

    const { message_id, status } = req.body;

    if (!message_id || !status) {
      return res.status(400).json({
        error: "message_id and status required"
      });
    }

    await pool.query(
      `
      UPDATE messages
      SET status = $1
      WHERE id = $2
      `,
      [status, message_id]
    );

    res.json({
      message: "Status updated"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}


/* =========================
   MARK CONVERSATION READ
========================= */

export async function markConversationRead(req, res) {

  try {

    const { conversationId } = req.params;
    const { message_id } = req.body;

    await pool.query(
      `
      UPDATE conversation_members
      SET last_read_message_id = $1
      WHERE conversation_id = $2
      AND user_id = $3
      `,
      [message_id, conversationId, req.user.id]
    );

    res.json({
      message: "Conversation marked as read"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}