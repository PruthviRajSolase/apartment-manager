const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const verifyToken = require('../middleware/auth');
const { SESSION_IDLE_MINUTES } = require('../config');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { societyName, societyAddress, adminName, adminEmail, password } = req.body;

  // Basic validation — reject early if required fields are missing
  if (!societyName || !adminName || !adminEmail || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const societyResult = await client.query(
      'INSERT INTO societies (name, address) VALUES ($1, $2) RETURNING id',
      [societyName, societyAddress]
    );
    const societyId = societyResult.rows[0].id;

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `INSERT INTO users (society_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, name, email, role, society_id`,
      [societyId, adminName, adminEmail, passwordHash]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Society and admin account created successfully',
      user: userResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);

    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    res.status(500).json({ error: 'Signup failed' });
  } finally {
    client.release();
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Stage 1: find the user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Stage 2: check the password
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Stage 3: try to claim the account's single session
    const sessionId = crypto.randomUUID();

    const claimed = await db.query(
      `UPDATE users SET session_id = $1, last_active_at = NOW()
       WHERE id = $2
         AND (session_id IS NULL
              OR last_active_at IS NULL
              OR last_active_at < NOW() - make_interval(mins => $3::int))
       RETURNING id`,
      [sessionId, user.id, SESSION_IDLE_MINUTES]
    );

    if (claimed.rows.length === 0) {
      return res.status(409).json({
        error: `This account is already logged in on another device. It can be used again after that session logs out or is idle for ${SESSION_IDLE_MINUTES} minutes.`,
      });
    }

    // Stage 4: issue the token
    const token = jwt.sign(
      { userId: user.id, societyId: user.society_id, role: user.role, sid: sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        society_id: user.society_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', verifyToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE users SET session_id = NULL, last_active_at = NULL WHERE id = $1 AND session_id = $2',
      [req.user.userId, req.user.sid]
    );
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;