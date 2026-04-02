// ============================================================
// Express Server — Entry Point
// ============================================================

const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const authenticateToken = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

// ── Middleware ──────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));

app.use(
  cors({
    origin: isProduction ? false : "http://localhost:5173",
    credentials: true,
  })
);

// ── API Routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

app.get("/api/dashboard", authenticateToken, (req, res) => {
  res.json({
    message: `Welcome to your dashboard, ${req.user.username}!`,
    user: req.user,
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Serve React frontend in production ─────────────────────
if (isProduction) {
  const frontendPath = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// ── Database initialization ────────────────────────────────
// Run each SQL statement individually for reliability.
// pool.query() with multiple statements can fail on some hosts.
async function initDB() {
  try {
    // 1. Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        username      VARCHAR(50)   NOT NULL UNIQUE,
        email         VARCHAR(255)  NOT NULL UNIQUE,
        password_hash VARCHAR(255)  NOT NULL,
        role          VARCHAR(10)   NOT NULL DEFAULT 'user',
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✅ Users table ready");

    // 2. Add 'role' column if missing (migration for old tables)
    const colCheck = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = 'users' AND column_name = 'role'`
    );
    if (colCheck.rows.length === 0) {
      await pool.query(`ALTER TABLE users ADD COLUMN role VARCHAR(10) NOT NULL DEFAULT 'user'`);
      console.log("✅ Added 'role' column to users table");
    }

    // 3. Fix UUID default if table was created with old uuid_generate_v4()
    await pool.query(`ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()`);

    // 4. Create events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        title         VARCHAR(200)  NOT NULL,
        description   TEXT          NOT NULL,
        event_date    TIMESTAMPTZ   NOT NULL,
        location      VARCHAR(200)  NOT NULL,
        category      VARCHAR(50)   NOT NULL DEFAULT 'General',
        created_by    UUID          REFERENCES users(id) ON DELETE SET NULL,
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✅ Events table ready");

    // 5. Fix UUID default on events table too
    await pool.query(`ALTER TABLE events ALTER COLUMN id SET DEFAULT gen_random_uuid()`);

    // 6. Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_date ON events (event_date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_category ON events (category)`);
    console.log("✅ Indexes ready");

    // 7. Create default admin account if none exists
    const adminCheck = await pool.query("SELECT 1 FROM users WHERE role = 'admin'");
    if (adminCheck.rows.length === 0) {
      const adminHash = await bcrypt.hash("admin123", 10);
      await pool.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')
         ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
        ["admin", "admin@nitsri.ac.in", adminHash]
      );
      console.log("👑 Default admin created: admin@nitsri.ac.in / admin123");
    }

    // 8. Seed dummy events if table is empty
    const { rows } = await pool.query("SELECT COUNT(*) FROM events");
    if (parseInt(rows[0].count) === 0) {
      const events = [
        ["TechFest 2026 — Hackathon", "A 24-hour national-level hackathon. Top 3 teams win cash prizes up to ₹50,000. Mentors from Google, Microsoft, and Amazon. Meals provided.", "2026-04-10T09:00:00", "Computer Science Block, Main Campus", "Tech"],
        ["Rang-e-Kashmir — Annual Cultural Fest", "Live music, traditional dance competitions, poetry recitals, art exhibition. Food stalls with authentic Kashmiri cuisine.", "2026-04-15T16:00:00", "Open Air Theatre", "Cultural"],
        ["Inter-Department Cricket Tournament", "Annual T20 cricket tournament between all departments. Register your team (min 11 players). Trophy and medals for winners.", "2026-04-12T15:00:00", "NIT Srinagar Cricket Ground", "Sports"],
        ["AI & Machine Learning Workshop", "2-day hands-on workshop: Python, TensorFlow, scikit-learn. Build your first neural network. Certificates provided.", "2026-04-18T10:00:00", "Seminar Hall, IT Block", "Workshop"],
        ["Guest Lecture: Future of Quantum Computing", "Prof. Anil Sharma from IIT Delhi on quantum computing breakthroughs. Interactive Q&A session follows.", "2026-04-20T14:00:00", "Auditorium, Main Building", "Seminar"],
        ["Campus Clean-Up Drive & Tree Plantation", "NSS campus-wide clean-up and tree plantation. Saplings provided. Participation certificates awarded.", "2026-04-08T08:00:00", "Assembly Point: Main Gate", "General"],
      ];
      for (const [title, desc, date, loc, cat] of events) {
        await pool.query(
          `INSERT INTO events (title, description, event_date, location, category) VALUES ($1,$2,$3,$4,$5)`,
          [title, desc, date, loc, cat]
        );
      }
      console.log("🌱 Seeded 6 dummy events");
    }

    console.log("🚀 Database fully initialized!");
  } catch (err) {
    console.error("❌ DATABASE INIT ERROR:", err.message);
    console.error("Full error:", err);
  }
}

// ── Start Server ───────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
