import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL_POOLING) {
    throw new Error("DATABASE_URL_POOLING is not set in the .env file");
}

const sql = neon(process.env.DATABASE_URL_POOLING);
export const db = drizzle(sql);
