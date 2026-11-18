import pool from '../config/db.js';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

export const Blog = {
  async findAll({ userId, destinationId } = {}) {
    let sql = `
      SELECT b.*, u.name AS author_name, u.avatar_url AS author_avatar, d.name AS destination_name
      FROM blogs b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN destinations d ON d.id = b.destination_id
      WHERE b.status = 'published'`;
    const params = [];

    if (userId) {
      sql += ` AND b.user_id = $${params.length + 1}`;
      params.push(userId);
    }
    if (destinationId) {
      sql += ` AND b.destination_id = $${params.length + 1}`;
      params.push(destinationId);
    }
    sql += ' ORDER BY b.created_at DESC';

    const result = await pool.query(sql, params);
    return result.rows;
  },

  async findBySlug(slug) {
    const result = await pool.query(
      `SELECT b.*, u.name AS author_name, u.avatar_url AS author_avatar, d.name AS destination_name, d.slug AS destination_slug
       FROM blogs b
       JOIN users u ON u.id = b.user_id
       LEFT JOIN destinations d ON d.id = b.destination_id
      WHERE b.slug = $1`,
      [slug]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM blogs WHERE id = $1', [id]);
    return result.rows[0];
  },

  async create({ userId, title, content, destinationId, coverImageUrl }) {
    const slug = slugify(title);
     const result = await pool.query(
      `INSERT INTO blogs (user_id, destination_id, title, slug, cover_image_url, content)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, destinationId || null, title, slug, coverImageUrl || null, content]
    );
    return this.findById(result.rows[0].id);
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = ['title', 'content', 'cover_image_url', 'status'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${params.length + 1}`);
        params.push(data[key]);
      }
    }
    if (!fields.length) return this.findById(id);
    params.push(id);
    params.push(id);
    await pool.query(`UPDATE blogs SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params);
    return this.findById(id);
  },

  async remove(id) {
    await pool.query('DELETE FROM blogs WHERE id = $1', [id]);
  },
};
