const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Create a unit — admin only
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  const { unitNumber } = req.body;

  if (!unitNumber) {
    return res.status(400).json({ error: 'unitNumber is required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO units (society_id, unit_number)
       VALUES ($1, $2)
       RETURNING id, unit_number, created_at`,
      [req.user.societyId, unitNumber]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This unit number already exists in your society' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

// List units — any logged-in user in the society
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, unit_number, created_at FROM units WHERE society_id = $1 ORDER BY unit_number',
      [req.user.societyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

module.exports = router;