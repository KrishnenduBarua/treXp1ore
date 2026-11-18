import pool from "../config/db.js";

export const Favorite = {
  async add(userId, destinationId) {
    await pool.query(
      "INSERT INTO favorites (user_id, destination_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, destinationId],
    );
  },

  async remove(userId, destinationId) {
    await pool.query(
      "DELETE FROM favorites WHERE user_id = $1 AND destination_id = $2",
      [userId, destinationId],
    );
  },

  async ids(userId) {
    const result = await pool.query(
      "SELECT destination_id FROM favorites WHERE user_id = $1",
      [userId],
    );
    return result.rows.map((r) => r.destination_id);
  },

  async listDestinations(userId) {
    const result = await pool.query(
      `SELECT d.* FROM favorites f
         JOIN destinations d ON d.id = f.destination_id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC`,
      [userId],
    );
    return result.rows;
  },
};
