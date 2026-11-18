import pool from "../config/db.js";

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const Destination = {
  async findAll({ division, district, category, q } = {}) {
    let sql = "SELECT * FROM destinations WHERE 1=1";
    const params = [];

    if (division) {
      sql += ` AND division = $${params.length + 1}`;
      params.push(division);
    }
    if (district) {
      sql += ` AND district ILIKE $${params.length + 1}`;
      params.push(`%${district}%`);
    }
    if (category) {
      sql += ` AND category = $${params.length + 1}`;
      params.push(category);
    }
    if (q) {
      const start = params.length + 1;
      sql += ` AND (name ILIKE $${start} OR short_description ILIKE $${start + 1} OR description ILIKE $${start + 2})`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += " ORDER BY created_at DESC";

    const result = await pool.query(sql, params);
    return result.rows;
  },

  async findBySlug(slug) {
    const result = await pool.query(
      "SELECT * FROM destinations WHERE slug = $1",
      [slug],
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      "SELECT * FROM destinations WHERE id = $1",
      [id],
    );
    return result.rows[0];
  },

  async create(data, userId) {
    const slug = slugify(data.name);
    const result = await pool.query(
      `INSERT INTO destinations
        (name, slug, division, district, category, short_description, description, how_to_reach, best_time_to_visit, entry_fee, image_url, latitude, longitude, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [
        data.name,
        slug,
        data.division,
        data.district,
        data.category || "General",
        data.short_description || null,
        data.description || null,
        data.how_to_reach || null,
        data.best_time_to_visit || null,
        data.entry_fee || "Free",
        data.image_url || null,
        data.latitude || null,
        data.longitude || null,
        userId,
      ],
    );
    return this.findById(result.rows[0].id);
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = [
      "name",
      "division",
      "district",
      "category",
      "short_description",
      "description",
      "how_to_reach",
      "best_time_to_visit",
      "entry_fee",
      "image_url",
      "latitude",
      "longitude",
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${params.length + 1}`);
        params.push(data[key]);
      }
    }
    if (data.name) {
      fields.push(`slug = $${params.length + 1}`);
      params.push(slugify(data.name));
    }
    if (!fields.length) return this.findById(id);

    params.push(id);
    await pool.query(
      `UPDATE destinations SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${params.length}`,
      params,
    );
    return this.findById(id);
  },

  async remove(id) {
    await pool.query("DELETE FROM destinations WHERE id = $1", [id]);
  },
};
