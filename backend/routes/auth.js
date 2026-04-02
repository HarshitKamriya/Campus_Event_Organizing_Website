// ============================================================
// Authentication Routes — Register & Login
// ============================================================

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

const router = express.Router();

// ──────────────────────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────────────────────
// 1. Validate input
// 2. Check if email or username already taken
// 3. Hash the password with bcrypt
// 4. Insert the new user into PostgreSQL
// 5. Generate a JWT and return it
// ──────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ── Input validation ───────────────────────────────────
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are all required." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters." });
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email." });
    }

    // ── Check for existing user ────────────────────────────
    // We query with LOWER() so the uniqueness check is case-insensitive
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "A user with that email or username already exists." });
    }

    // ── Hash the password ──────────────────────────────────
    // bcrypt.hash(password, saltRounds)
    // saltRounds = 10 is a good balance of security vs speed.
    // Each increment roughly doubles the computation time:
    //   10 → ~100 ms,  12 → ~300 ms,  14 → ~1 s
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ── Insert into database ───────────────────────────────
    const newUser = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, role, created_at`,
      [username, email.toLowerCase(), passwordHash]
    );

    const user = newUser.rows[0];

    // ── Generate JWT ───────────────────────────────────────
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      message: "Registration successful!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────────────────
// 1. Find user by email
// 2. Compare submitted password against stored hash
// 3. Generate JWT with 1-hour expiry
// ──────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Input validation ───────────────────────────────────
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    // ── Find user by email ─────────────────────────────────
    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (result.rows.length === 0) {
      // Deliberately vague message to prevent email enumeration attacks:
      // don't reveal whether the email exists or not.
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = result.rows[0];

    // ── Compare password against stored hash ───────────────
    // bcrypt.compare() hashes the incoming password with the
    // same salt that was used during registration and checks
    // if the result matches the stored hash.
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // ── Generate JWT ───────────────────────────────────────
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
});

module.exports = router;
