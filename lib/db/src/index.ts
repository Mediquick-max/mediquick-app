import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isSupabase =
  dbUrl.includes("supabase.com") || dbUrl.includes("supabase.co");

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  family: 4,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
