import { pool } from "../db.js";

/* =========================
   SET USERNAME
========================= */

export async function setUsername(req, res) {

  try {

    const { username, display_name } = req.body;

    if (!username) {
      return res.status(400).json({
        error: "username required"
      });
    }

    await pool.query(
      `UPDATE users
       SET username=$1, display_name=$2
       WHERE id=$3`,
      [username, display_name, req.user.id]
    );

    res.json({
      message: "Profile updated"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}


/* =========================
   SEARCH USERS
========================= */

export async function searchUsers(req, res) {

  try {

    const { username } = req.query;

    if (!username) {
      return res.json([]);
    }

    const result = await pool.query(
      `
      SELECT id, username, display_name
      FROM users
      WHERE username ILIKE $1
      LIMIT 10
      `,
      [`%${username}%`]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

}