// ============================================================
// Event Routes — CRUD for campus events
// ============================================================

const express = require("express");
const pool = require("../config/db");
const authenticateToken = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

// ──────────────────────────────────────────────────────────
// GET /api/events — List all events (any logged-in user)
// ──────────────────────────────────────────────────────────
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;

    let query = `
      SELECT e.*, u.username AS author
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
    `;
    const params = [];

    if (category && category !== "All") {
      query += " WHERE e.category = $1";
      params.push(category);
    }

    query += " ORDER BY e.event_date DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch events error:", err.message);
    res.status(500).json({ error: "Failed to fetch events." });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/events/:id — Single event detail
// ──────────────────────────────────────────────────────────
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.username AS author
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch event error:", err.message);
    res.status(500).json({ error: "Failed to fetch event." });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/events — Create event (admin only)
// ──────────────────────────────────────────────────────────
router.post("/", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { title, description, event_date, location, category } = req.body;

    if (!title || !description || !event_date || !location) {
      return res.status(400).json({ error: "Title, description, date, and location are required." });
    }

    const result = await pool.query(
      `INSERT INTO events (title, description, event_date, location, category, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, event_date, location, category || "General", req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create event error:", err.message);
    res.status(500).json({ error: "Failed to create event." });
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/events/:id — Update event (admin only)
// ──────────────────────────────────────────────────────────
router.put("/:id", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { title, description, event_date, location, category } = req.body;

    const result = await pool.query(
      `UPDATE events
       SET title = $1, description = $2, event_date = $3, location = $4, category = $5
       WHERE id = $6
       RETURNING *`,
      [title, description, event_date, location, category, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update event error:", err.message);
    res.status(500).json({ error: "Failed to update event." });
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/events/:id — Delete event (admin only)
// ──────────────────────────────────────────────────────────
router.delete("/:id", authenticateToken, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM events WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.json({ message: "Event deleted successfully." });
  } catch (err) {
    console.error("Delete event error:", err.message);
    res.status(500).json({ error: "Failed to delete event." });
  }
});

module.exports = router;
