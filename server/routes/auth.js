const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

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

module.exports = router;