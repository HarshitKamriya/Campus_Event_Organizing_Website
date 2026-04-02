// ============================================================
// PostgreSQL Connection Pool
// ============================================================
// We use pg.Pool instead of pg.Client for connection pooling.
// A pool maintains a set of open connections and hands them out
// on demand, so multiple concurrent requests (e.g. many users
// logging in at the same time) don't have to wait for a single
// connection to become free. Each query borrows a connection,
// uses it, and returns it to the pool automatically.
// ============================================================

const { Pool } = require("pg");
require("dotenv").config();

// ── Connection config ──────────────────────────────────────
// Render provides a single DATABASE_URL. For local dev we
// fall back to individual env vars (DB_USER, DB_HOST, etc.)
const isProduction = process.env.NODE_ENV === "production";

const poolConfig = process.env.DATABASE_URL
  ? {
      // Production: Render provides a connection string
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required by Render's managed PG
    }
  : {
      // Local: individual env vars
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT, 10) || 5432,
    };

const pool = new Pool({
  ...poolConfig,
  max: isProduction ? 10 : 20, // Render free tier has limited connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log once when the pool successfully connects
pool.on("connect", () => {
  console.log("📦 New client connected to PostgreSQL pool");
});

// Log pool-level errors (e.g. unexpected disconnects)
pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle PostgreSQL client:", err);
  process.exit(-1);
});

module.exports = pool;
