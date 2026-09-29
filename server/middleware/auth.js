const jwt = require('jsonwebtoken');
const db = require('../db');
const { SESSION_IDLE_MINUTES } = require('../config');

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
       RETURNING id`,
      [decoded.userId, decoded.sid, SESSION_IDLE_MINUTES]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Session ended. Please log in again.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Authentication check failed' });
  }
}

module.exports = verifyToken;