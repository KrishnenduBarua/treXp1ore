import pool from "../config/db.js";

// "I've been here" marks.
export const Visit = {
  async add(userId, destinationId) {
    await pool.query(
      "INSERT INTO visited_places (user_id, destination_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, destinationId],
    );
  },

  async remove(userId, destinationId) {
    await pool.query(
      "DELETE FROM visited_places WHERE user_id = $1 AND destination_id = $2",
      [userId, destinationId],
    );
  },

  async ids(userId) {
    const result = await pool.query(
      "SELECT destination_id FROM visited_places WHERE user_id = $1",
      [userId],
    );
    return result.rows.map((r) => r.destination_id);
  },
};
