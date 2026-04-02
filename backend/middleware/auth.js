// ============================================================
// JWT Authentication Middleware
// ============================================================
// This middleware protects private routes. It:
//   1. Extracts the token from the "Authorization: Bearer <token>" header
//   2. Verifies the token's signature and checks expiry
//   3. Attaches the decoded payload (user id, email) to req.user
//   4. Calls next() so the route handler can proceed
//
// If the token is missing or invalid, it returns 401 or 403.
// ============================================================

const jwt = require("jsonwebtoken");
require("dotenv").config();

function authenticateToken(req, res, next) {
  // The standard pattern is: "Authorization: Bearer <token>"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // grab the part after "Bearer "

  if (!token) {
    // No token provided at all — the user hasn't logged in
    return res.status(401).json({
      error: "Access denied. No authentication token provided.",
    });
  }

  try {
    // jwt.verify() does TWO things:
    //   a) Checks the cryptographic signature (was this token created by OUR server?)
    //   b) Checks the "exp" claim (has this token expired?)
    // If either check fails, it throws an error.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded payload to the request object so downstream
    // route handlers can access req.user.id, req.user.email, etc.
    req.user = decoded;
    next();
  } catch (err) {
    // Token was present but invalid (bad signature, expired, malformed)
    return res.status(403).json({
      error: "Invalid or expired token. Please log in again.",
    });
  }
}

module.exports = authenticateToken;
