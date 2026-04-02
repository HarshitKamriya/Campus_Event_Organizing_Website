// ============================================================
// Admin-Only Middleware
// ============================================================
// Use AFTER authenticateToken. Checks that the logged-in user
// has role === 'admin'. Returns 403 if not.
// ============================================================

function adminOnly(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Admin access required." });
}

module.exports = adminOnly;
