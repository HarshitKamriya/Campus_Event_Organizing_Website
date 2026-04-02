// ============================================================
// Express Server — Entry Point
// ============================================================

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
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

// CORS: in production the frontend is served from the same origin,
// so we only need CORS for local dev (Vite on port 5173).
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
// After `npm run build` in /frontend, the built files live in
// frontend/dist/. Express serves them as static assets, and
// the catch-all route returns index.html so React Router can
// handle client-side navigation (e.g. /dashboard, /register).
if (isProduction) {
  const frontendPath = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(frontendPath));

  // Catch-all: any route not matched by API → serve React app
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// ── Auto-create tables & seed dummy data on startup ────────
async function initDB() {
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    await pool.query(schema);
    console.log("✅ Database schema initialized");

    // Migration: add 'role' column if it doesn't exist
    // (needed when the users table was created before we added roles)
    const colCheck = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = 'users' AND column_name = 'role'`
    );
    if (colCheck.rows.length === 0) {
      await pool.query(
        `ALTER TABLE users ADD COLUMN role VARCHAR(10) NOT NULL DEFAULT 'user'`
      );
      console.log("✅ Added 'role' column to existing users table");
    }

    // Create default admin account if no admin exists
    const adminCheck = await pool.query(
      "SELECT 1 FROM users WHERE role = 'admin'"
    );
    if (adminCheck.rows.length === 0) {
      const bcrypt = require("bcryptjs");
      const adminHash = await bcrypt.hash("admin123", 10);
      await pool.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')
         ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
        ["admin", "admin@nitsri.ac.in", adminHash]
      );
      console.log("👑 Default admin account created:");
      console.log("   Email:    admin@nitsri.ac.in");
      console.log("   Password: admin123");
    }

    // Seed dummy events if table is empty
    const { rows } = await pool.query("SELECT COUNT(*) FROM events");
    if (parseInt(rows[0].count) === 0) {
      const dummyEvents = [
        {
          title: "TechFest 2026 — Hackathon",
          description: "A 24-hour national-level hackathon open to all engineering students. Build innovative solutions to real-world problems. Top 3 teams win cash prizes up to ₹50,000. Mentors from Google, Microsoft, and Amazon will be available throughout the event. Meals and refreshments provided.",
          event_date: "2026-04-10T09:00:00",
          location: "Computer Science Block, Main Campus",
          category: "Tech",
        },
        {
          title: "Rang-e-Kashmir — Annual Cultural Fest",
          description: "Celebrate the vibrant culture of Kashmir and India! Featuring live music performances, traditional dance competitions, poetry recitals, and an art exhibition. Open to all students and faculty. Food stalls with authentic Kashmiri cuisine including Rogan Josh and Dum Aloo.",
          event_date: "2026-04-15T16:00:00",
          location: "Open Air Theatre",
          category: "Cultural",
        },
        {
          title: "Inter-Department Cricket Tournament",
          description: "The annual T20 cricket tournament between all departments kicks off! Register your department team (minimum 11 players). Matches held daily from 3 PM onwards. Semifinal and Final on the last two days. Trophy and medals for the winning team.",
          event_date: "2026-04-12T15:00:00",
          location: "NIT Srinagar Cricket Ground",
          category: "Sports",
        },
        {
          title: "AI & Machine Learning Workshop",
          description: "Hands-on 2-day workshop covering fundamentals of AI/ML using Python, TensorFlow, and scikit-learn. Build your first neural network from scratch. No prior ML experience required — basic Python knowledge is sufficient. Certificates provided to all participants.",
          event_date: "2026-04-18T10:00:00",
          location: "Seminar Hall, IT Block",
          category: "Workshop",
        },
        {
          title: "Guest Lecture: Future of Quantum Computing",
          description: "Prof. Anil Sharma from IIT Delhi presents on the latest breakthroughs in quantum computing and its implications for cryptography, drug discovery, and optimization problems. Interactive Q&A session follows. All faculty and students are encouraged to attend.",
          event_date: "2026-04-20T14:00:00",
          location: "Auditorium, Main Building",
          category: "Seminar",
        },
        {
          title: "Campus Clean-Up Drive & Tree Plantation",
          description: "Join the NSS unit for a campus-wide clean-up and tree plantation drive. Help make our campus greener and cleaner! Saplings and equipment will be provided. Participation certificates and community service hours awarded to all volunteers.",
          event_date: "2026-04-08T08:00:00",
          location: "Assembly Point: Main Gate",
          category: "General",
        },
      ];

      for (const ev of dummyEvents) {
        await pool.query(
          `INSERT INTO events (title, description, event_date, location, category)
           VALUES ($1, $2, $3, $4, $5)`,
          [ev.title, ev.description, ev.event_date, ev.location, ev.category]
        );
      }
      console.log("🌱 Seeded 6 dummy events into database");
    }
  } catch (err) {
    console.error("⚠️  Database init error:", err.message);
    console.error("   Make sure PostgreSQL is running and credentials are correct.");
  }
}

// ── Start Server ───────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
