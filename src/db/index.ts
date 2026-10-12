import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const rawDatabaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!rawDatabaseUrl) {
  throw new Error(
    "DATABASE_URL (or the Supabase-provided POSTGRES_URL) is required",
  );
}

// node-postgres treats `sslmode=require` as full certificate verification,
// which fails against Supabase's pooler certificate chain. Strip it and
// configure TLS explicitly instead.
const parsedUrl = new URL(rawDatabaseUrl);
parsedUrl.searchParams.delete("sslmode");
parsedUrl.searchParams.delete("supa");
const isLocalDatabase = ["localhost", "127.0.0.1"].includes(parsedUrl.hostname);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: parsedUrl.toString(),
    ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
