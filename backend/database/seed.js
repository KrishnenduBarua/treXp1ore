// Seeds the database with an admin user and starter destinations across all 8 divisions.
// Run with: npm run seed
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const destinations = [
  { name: 'Cox\'s Bazar Beach', division: 'Chattogram', district: 'Cox\'s Bazar', category: 'Beach', short_description: 'The world\'s longest natural sea beach, stretching over 120km.', best_time_to_visit: 'November to March', entry_fee: 'Free' },
  { name: 'Sajek Valley', division: 'Chattogram', district: 'Rangamati', category: 'Hill', short_description: 'A hill valley known as the "roof of Rangamati" for its sea of clouds.', best_time_to_visit: 'October to March', entry_fee: 'Free' },
  { name: 'Sundarbans', division: 'Khulna', district: 'Bagerhat', category: 'Forest', short_description: 'The largest mangrove forest in the world, home to the Royal Bengal Tiger.', best_time_to_visit: 'November to February', entry_fee: 'Permit required' },
  { name: 'Ratargul Swamp Forest', division: 'Sylhet', district: 'Sylhet', category: 'Forest', short_description: 'One of the few freshwater swamp forests in the world.', best_time_to_visit: 'July to September', entry_fee: '৳20' },
  { name: 'Srimangal Tea Gardens', division: 'Sylhet', district: 'Moulvibazar', category: 'Nature', short_description: 'Rolling tea estates known as the tea capital of Bangladesh.', best_time_to_visit: 'Year-round', entry_fee: 'Free' },
  { name: 'Paharpur Buddhist Vihara', division: 'Rajshahi', district: 'Naogaon', category: 'Heritage', short_description: 'A UNESCO World Heritage archaeological site from the 8th century.', best_time_to_visit: 'October to March', entry_fee: '৳20' },
  { name: 'Sixty Dome Mosque', division: 'Khulna', district: 'Bagerhat', category: 'Heritage', short_description: 'A 15th-century UNESCO-listed mosque with sixty stone pillars.', best_time_to_visit: 'October to March', entry_fee: '৳20' },
  { name: 'Kuakata Sea Beach', division: 'Barishal', district: 'Patuakhali', category: 'Beach', short_description: 'The "Daughter of the Sea" — one of the few beaches to view both sunrise and sunset.', best_time_to_visit: 'November to February', entry_fee: 'Free' },
  { name: 'Ahsan Manzil', division: 'Dhaka', district: 'Dhaka', category: 'Heritage', short_description: 'The Pink Palace, former residence of the Nawab of Dhaka.', best_time_to_visit: 'Year-round', entry_fee: '৳20' },
  { name: 'Vinnojagat Prangon', division: 'Rangpur', district: 'Rangpur', category: 'Park', short_description: 'A themed leisure park mixing local craft and greenery.', best_time_to_visit: 'Year-round', entry_fee: '৳50' },
  { name: 'Madhutila Eco Park', division: 'Mymensingh', district: 'Sherpur', category: 'Nature', short_description: 'A forested eco park at the foothills of the Garo Hills.', best_time_to_visit: 'October to March', entry_fee: '৳10' },
];

async function seed() {
  try {
    console.log('Seeding admin user...');
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name`,
      ['TreXplore Admin', 'admin@trexplore.com', passwordHash]
    );
    const adminResult = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@trexplore.com']);
    const admin = adminResult.rows[0];

    console.log('Seeding destinations...');
    for (const d of destinations) {
      const slug = slugify(d.name);
      await pool.query(
        `INSERT INTO destinations (name, slug, division, district, category, short_description, best_time_to_visit, entry_fee, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (slug) DO UPDATE SET short_description = EXCLUDED.short_description`,
        [d.name, slug, d.division, d.district, d.category, d.short_description, d.best_time_to_visit, d.entry_fee, admin.id]
      );
    }
    console.log('Seed complete. Admin login: admin@trexplore.com / Admin@123');
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  pool.end().finally(() => process.exit(1));
});
