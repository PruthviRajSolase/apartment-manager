const jwt = require('jsonwebtoken');
const db = require('../db');
const { SESSION_IDLE_MINUTES } = require('../config');

// A user who must change their password may only call these two routes.
// Keeping the exemption list here means every new verifyToken route is
// protected automatically — no one has to remember to add the check.
const SETUP_ROUTES = new Set([
  '/api/auth/set-initial-password',
  '/api/auth/logout',
]);

function requestPath(req) {
  return req.originalUrl.split('?')[0].replace(/\/+$/, '').toLowerCase();
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const result = await db.query(
      `UPDATE users SET last_active_at = NOW()
       WHERE id = $1
         AND session_id = $2
         AND last_active_at > NOW() - make_interval(mins => $3::int)
       RETURNING id, must_change_password`,
      [decoded.userId, decoded.sid, SESSION_IDLE_MINUTES]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Session ended. Please log in again.' });
    }

    if (result.rows[0].must_change_password && !SETUP_ROUTES.has(requestPath(req))) {
      return res.status(403).json({
        error: 'Please set your password before using the app.',
        code: 'PASSWORD_CHANGE_REQUIRED',
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Authentication check failed' });
  }
}

module.exports = verifyToken;
