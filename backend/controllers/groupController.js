import crypto from "crypto";
import { pool } from "../db.js";

/* =========================
   CREATE GROUP
========================= */

export async function createGroup(req, res) {

  try {

    const { title, members } = req.body;

    if (!title || !members || members.length === 0) {
      return res.status(400).json({
        error: "title and members required"
      });
    }

    const conversationId = crypto.randomUUID();

    /* create conversation */

    await pool.query(
      `INSERT INTO conversations (id, title, is_group, created_by)
       VALUES ($1,$2,true,$3)`,
      [conversationId, title, req.user.id]
    );

    /* creator becomes owner */

    await pool.query(
      `INSERT INTO conversation_members (conversation_id, user_id, role)
       VALUES ($1,$2,'owner')
       ON CONFLICT DO NOTHING`,
      [conversationId, req.user.id]
    );

    /* add other members */

    for (const userId of members) {

      await pool.query(
        `INSERT INTO conversation_members (conversation_id, user_id, role)
         VALUES ($1,$2,'member')
         ON CONFLICT DO NOTHING`,
        [conversationId, userId]
      );

    }

    res.json({
      message: "Group created",
      conversation_id: conversationId
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}


/* =========================
   ADD MEMBER
========================= */

export async function addGroupMember(req, res) {

  try {

    const { conversationId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        error: "user_id required"
      });
    }

    /* permission check */

    const roleCheck = await pool.query(
      `SELECT role
       FROM conversation_members
       WHERE conversation_id = $1
       AND user_id = $2`,
      [conversationId, req.user.id]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(403).json({
        error: "Not a group member"
      });
    }

    const role = roleCheck.rows[0].role;

    if (role !== "owner" && role !== "admin") {
      return res.status(403).json({
        error: "Only admins can add members"
      });
    }

    await pool.query(
      `INSERT INTO conversation_members (conversation_id, user_id, role)
       VALUES ($1,$2,'member')
       ON CONFLICT DO NOTHING`,
      [conversationId, user_id]
    );

    res.json({
      message: "Member added"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}


/* =========================
   REMOVE MEMBER
========================= */

export async function removeGroupMember(req, res) {

  try {

    const { conversationId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        error: "user_id required"
      });
    }

    /* permission check */

    const roleCheck = await pool.query(
      `SELECT role
       FROM conversation_members
       WHERE conversation_id = $1
       AND user_id = $2`,
      [conversationId, req.user.id]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(403).json({
        error: "Not a group member"
      });
    }

    const role = roleCheck.rows[0].role;

    if (role !== "owner" && role !== "admin") {
      return res.status(403).json({
        error: "Only admins can remove members"
      });
    }

    await pool.query(
      `DELETE FROM conversation_members
       WHERE conversation_id = $1
       AND user_id = $2`,
      [conversationId, user_id]
    );

    res.json({
      message: "Member removed"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}


/* =========================
   PROMOTE MEMBER TO ADMIN
========================= */

export async function promoteToAdmin(req, res) {

  try {

    const { conversationId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        error: "user_id required"
      });
    }

    /* only owner can promote */

    const roleCheck = await pool.query(
      `SELECT role
       FROM conversation_members
       WHERE conversation_id = $1
       AND user_id = $2`,
      [conversationId, req.user.id]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(403).json({
        error: "Not a group member"
      });
    }

    const role = roleCheck.rows[0].role;

    if (role !== "owner") {
      return res.status(403).json({
        error: "Only owner can promote admins"
      });
    }

    await pool.query(
      `UPDATE conversation_members
       SET role = 'admin'
       WHERE conversation_id = $1
       AND user_id = $2`,
      [conversationId, user_id]
    );

    res.json({
      message: "User promoted to admin"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}

/* =========================
   GET GROUP MEMBERS
========================= */

export async function getGroupMembers(req, res) {

  try {

    const { conversationId } = req.params;

    const result = await pool.query(
      `SELECT
        u.id,
        u.username,
        u.display_name,
        cm.role
       FROM conversation_members cm
       JOIN users u
       ON cm.user_id = u.id
       WHERE cm.conversation_id = $1`,
      [conversationId]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}