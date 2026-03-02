const pool = require("../config/db");

const saveMessage = async ({ roomId, content, sender }) => {
  const query = `
    INSERT INTO messages (room_id, content, sender)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [roomId, content, sender];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getMessagesByRoom = async (roomId) => {
  const result = await pool.query(
    `SELECT * FROM messages
     WHERE room_id = $1
     ORDER BY created_at ASC`,
    [roomId]
  );
  return result.rows;
};

module.exports = {
  saveMessage,
  getMessagesByRoom,
};