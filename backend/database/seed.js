// Seeds the database with an admin user and starter destinations across all 8 divisions.
// Run with: npm run seed
import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const destinations = [
  {
    name: "Cox's Bazar Beach",
    division: "Chattogram",
    district: "Cox's Bazar",
    category: "Beach",
    short_description:
      "The world's longest natural sea beach, stretching over 120km.",
    description:
      "Cox's Bazar is one of the most popular tourist destinations in Bangladesh and is famous for its long natural sandy sea beach. Visitors can enjoy beautiful sunsets, relaxing walks along the coastline, and the scenic beauty of the Bay of Bengal.",
    how_to_reach:
      "Cox's Bazar can be reached by air, bus, or private vehicle from Dhaka and other major cities. Direct flights are available from Dhaka to Cox's Bazar Airport, and several bus services operate between Dhaka and Cox's Bazar. From the airport or bus terminal, local transport can take visitors to the beach and nearby hotels.",
    best_time_to_visit: "November to March",
    entry_fee: "Free",
  },
  {
    name: "Sajek Valley",
    division: "Chattogram",
    district: "Rangamati",
    category: "Hill",
    short_description:
      'A hill valley known as the "roof of Rangamati" for its sea of clouds.',
    description:
      "Sajek Valley is a beautiful hill destination in the Chattogram Hill Tracts, surrounded by green mountains and clouds. It is known for its breathtaking landscapes, peaceful environment, sunrise and sunset views, and unique indigenous culture.",
    how_to_reach:
      "Travelers usually reach Khagrachhari from Dhaka or Chattogram by bus or private vehicle, then continue to Sajek by reserved jeep or Chander Gari. The road journey from Khagrachhari passes through the hills, so arrange local transport and check current travel guidance before setting out.",
    best_time_to_visit: "October to March",
    entry_fee: "Free",
  },
  {
    name: "Sundarbans",
    division: "Khulna",
    district: "Bagerhat",
    category: "Forest",
    short_description:
      "The largest mangrove forest in the world, home to the Royal Bengal Tiger.",
    description:
      "The Sundarbans is the largest mangrove forest in the world and a UNESCO World Heritage Site. It is home to the Royal Bengal Tiger and many species of birds, deer, reptiles, and fish. Visitors explore the forest and its waterways on guided boat tours.",
    how_to_reach:
      "Travelers can reach an entry point through Mongla or Khulna by bus, train, or private vehicle, then join an organized boat tour. Boat travel is the main way to explore the forest. Arrange required permits and travel with an authorized tour operator or guide.",
    best_time_to_visit: "November to February",
    entry_fee: "Permit required",
  },
  {
    name: "Ratargul Swamp Forest",
    division: "Sylhet",
    district: "Sylhet",
    category: "Forest",
    short_description: "One of the few freshwater swamp forests in the world.",
    description:
      "Ratargul Swamp Forest is one of the few freshwater swamp forests in Bangladesh. Located near Sylhet, it is especially attractive during the monsoon when much of the forest is covered with water. Visitors can explore the flooded forest by boat.",
    how_to_reach:
      "From Sylhet city, travel by road toward Goainghat and continue to Ratargul by local CNG, auto-rickshaw, or hired vehicle. A boat ride is needed to explore the forest; local boat services are available near the entrance.",
    best_time_to_visit: "July to September",
    entry_fee: "৳20",
  },
  {
    name: "Srimangal Tea Gardens",
    division: "Sylhet",
    district: "Moulvibazar",
    category: "Nature",
    short_description:
      "Rolling tea estates known as the tea capital of Bangladesh.",
    description:
      "Sreemangal is widely known as the tea capital of Bangladesh and is surrounded by green tea gardens. The area offers peaceful landscapes, rolling hills, forests, and numerous tea estates. Visitors can explore the gardens and enjoy the natural scenery around town.",
    how_to_reach:
      "Sreemangal can be reached from Dhaka by train or bus. From Sreemangal town, visitors can use CNGs, auto-rickshaws, or hired vehicles to reach nearby tea gardens and other attractions.",
    best_time_to_visit: "Year-round",
    entry_fee: "Free",
  },
  {
    name: "Paharpur Buddhist Vihara",
    division: "Rajshahi",
    district: "Naogaon",
    category: "Heritage",
    short_description:
      "A UNESCO World Heritage archaeological site from the 8th century.",
    description:
      "Paharpur Buddhist Vihara, also known as Somapura Mahavihara, is an important archaeological site in Bangladesh and a UNESCO World Heritage Site. Built during the Pala period, the ancient monastery was a major center of Buddhist learning.",
    how_to_reach:
      "Travel by road toward Naogaon or Joypurhat from Dhaka, Rajshahi, or another major city, then continue to Paharpur by local transport or private vehicle. Bus and train services are available to nearby towns.",
    best_time_to_visit: "October to March",
    entry_fee: "৳20",
  },
  {
    name: "Sixty Dome Mosque",
    division: "Khulna",
    district: "Bagerhat",
    category: "Heritage",
    short_description:
      "A 15th-century UNESCO-listed mosque with sixty stone pillars.",
    description:
      "The Sixty Dome Mosque is a remarkable historical monument in Bangladesh and a UNESCO World Heritage Site. Built during the Bengal Sultanate period, it is known for its distinctive architecture, many domes, and historic significance.",
    how_to_reach:
      "Travel by bus or private vehicle to Bagerhat from Dhaka, Khulna, or another major city. From Bagerhat town, local CNGs, auto-rickshaws, or other local transport can take visitors to the mosque.",
    best_time_to_visit: "October to March",
    entry_fee: "৳20",
  },
  {
    name: "Kuakata Sea Beach",
    division: "Barishal",
    district: "Patuakhali",
    category: "Beach",
    short_description:
      'The "Daughter of the Sea" — one of the few beaches to view both sunrise and sunset.',
    description:
      "Kuakata is a scenic sea beach in southern Bangladesh, known as a place where visitors can enjoy both sunrise and sunset over the Bay of Bengal. Its long sandy coastline and surrounding natural beauty make it a popular destination.",
    how_to_reach:
      "Kuakata can be reached from Dhaka by bus or private vehicle, travelling through Barishal or Patuakhali. Direct bus services are also available from Dhaka and other cities. Local transport can be used to reach the beach from town.",
    best_time_to_visit: "November to February",
    entry_fee: "Free",
  },
  {
    name: "Ahsan Manzil",
    division: "Dhaka",
    district: "Dhaka",
    category: "Heritage",
    short_description:
      "The Pink Palace, former residence of the Nawab of Dhaka.",
    description:
      "Ahsan Manzil, popularly known as the Pink Palace, is a historic palace in Old Dhaka beside the Buriganga River. It was the residence of the Nawabs of Dhaka and today operates as a museum.",
    how_to_reach:
      "Ahsan Manzil is in Old Dhaka and can be reached by road from other parts of the city. Visitors can use buses, CNGs, auto-rickshaws, taxis, or ride-sharing services to reach the Kumartoli area near the Buriganga River.",
    best_time_to_visit: "Year-round",
    entry_fee: "৳20",
  },
  {
    name: "Vinnojagat Prangon",
    division: "Rangpur",
    district: "Rangpur",
    category: "Park",
    short_description: "A themed leisure park mixing local craft and greenery.",
    description:
      "Vinnojogot Prangon is a recreational destination in the Rangpur region with attractions and activities for visitors and families. It is known for its leisure facilities and green surroundings.",
    how_to_reach:
      "Travel to Rangpur city by bus or train, then continue to Vinnojogot Prangon by local transport, CNG, auto-rickshaw, or private vehicle.",
    best_time_to_visit: "Year-round",
    entry_fee: "৳50",
  },
  {
    name: "Madhutila Eco Park",
    division: "Mymensingh",
    district: "Sherpur",
    category: "Nature",
    short_description:
      "A forested eco park at the foothills of the Garo Hills.",
    description:
      "Madhutila Eco Park is an eco-tourism destination in Sherpur, surrounded by green forests and hills. Visitors can enjoy natural scenery, walking areas, a lake, and recreational facilities.",
    how_to_reach:
      "Travel by bus or private vehicle to Sherpur town from Dhaka or Mymensingh, then continue toward Nalitabari and Madhutila by local transport or hired vehicle.",
    best_time_to_visit: "October to March",
    entry_fee: "৳10",
  },
];

async function seed() {
  try {
    console.log("Seeding admin user...");
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name`,
      ["TreXplore Admin", "admin@trexplore.com", passwordHash],
    );
    const adminResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      ["admin@trexplore.com"],
    );
    const admin = adminResult.rows[0];

    console.log("Seeding destinations...");
    for (const d of destinations) {
      const slug = slugify(d.name);
      await pool.query(
        `INSERT INTO destinations (name, slug, division, district, category, short_description, description, how_to_reach, best_time_to_visit, entry_fee, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (slug) DO UPDATE SET
          short_description = EXCLUDED.short_description,
          description = EXCLUDED.description,
          how_to_reach = EXCLUDED.how_to_reach,
          best_time_to_visit = EXCLUDED.best_time_to_visit,
          entry_fee = EXCLUDED.entry_fee`,
        [
          d.name,
          slug,
          d.division,
          d.district,
          d.category,
          d.short_description,
          d.description,
          d.how_to_reach,
          d.best_time_to_visit,
          d.entry_fee,
          admin.id,
        ],
      );
    }
    console.log("Seed complete. Admin login: admin@trexplore.com / Admin@123");
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
