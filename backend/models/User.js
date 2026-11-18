import pool from "../config/db.js";

export const User = {
  async create({ name, email, hashedPassword }) {
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
      [name, email, hashedPassword],
    );
    return result.rows[0].id;
  },

  async findByEmail(email) {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      "SELECT id, name, email, role, bio, avatar_url, created_at FROM users WHERE id = $1",
      [id],
    );
    return result.rows[0];
  },

  async updateProfile(id, { name, bio, avatar_url }) {
    await pool.query(
      "UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio), avatar_url = COALESCE($3, avatar_url), updated_at = NOW() WHERE id = $4",
      [name, bio, avatar_url, id],
    );
    return this.findById(id);
  },
};
