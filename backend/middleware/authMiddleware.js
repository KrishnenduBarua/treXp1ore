import jwt from "jsonwebtoken";
import pool from "../config/db.js";

// Verifies the JWT and attaches the current user to req.user
export const protect = async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      "SELECT id, name, email, role, bio, avatar_url, created_at FROM users WHERE id = $1",
      [decoded.id],
    );

    if (!result.rows.length) {
      return res
        .status(401)
        .json({ message: "Not authorized, user no longer exists" });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Not authorized, invalid or expired token" });
  }
};

// Restricts a route to admin (website management) users only
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
};

// Like `protect`, but never rejects: if a valid token is present req.user is
// set (id + role only), otherwise the request continues as anonymous. Used on
// public routes that personalise or log activity for signed-in users.
export const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
      req.user = { id: decoded.id, role: decoded.role };
    } catch (err) {
      // invalid/expired token: treat as anonymous
    }
  }
  next();
};
