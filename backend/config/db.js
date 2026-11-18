import pg from "pg";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Set it to your Supabase PostgreSQL connection string in the backend environment.",
  );
}

let databaseProtocol;
try {
  databaseProtocol = new URL(databaseUrl).protocol;
} catch {
  throw new Error(
    "DATABASE_URL must be a valid PostgreSQL connection URL (postgres:// or postgresql://).",
  );
}
if (databaseProtocol !== "postgres:" && databaseProtocol !== "postgresql:") {
  throw new Error(
    "DATABASE_URL must use the postgres:// or postgresql:// protocol.",
  );
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

export default pool;
