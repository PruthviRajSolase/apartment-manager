const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

const MOBILE_PATTERN = /^\d{10}$/;

function generateTempPassword() {
  // 10 hex characters — fixed length, no characters that get lost when read aloud.
  return crypto.randomBytes(8).toString('hex').slice(0, 10);
}

// List residents — admin only. Never selects password_hash.
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.mobile_number, u.unit_id, un.unit_number, u.created_at
       FROM users u
       LEFT JOIN units un ON un.id = u.unit_id AND un.society_id = u.society_id
       WHERE u.society_id = $1 AND u.role = 'resident'
       ORDER BY un.unit_number, u.name`,
      [req.user.societyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

// Create a resident — admin only
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  const { name, mobileNumber, unitId } = req.body;

  if (!name || !mobileNumber || !unitId) {
    return res.status(400).json({ error: 'name, mobileNumber and unitId are required' });
  }

  if (!MOBILE_PATTERN.test(mobileNumber)) {
    return res.status(400).json({ error: 'Mobile number must be exactly 10 digits' });
  }

  try {
    // Confirm the unit actually belongs to this admin's society
    const unitCheck = await db.query(
      'SELECT id FROM units WHERE id = $1 AND society_id = $2',
      [unitId, req.user.societyId]
    );
    if (unitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Unit not found in your society' });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Residents don't have email yet — reuse a placeholder unique value
    // derived from their mobile number, since our schema currently requires email
    const placeholderEmail = `${mobileNumber}@no-email.local`;

    const result = await db.query(
      `INSERT INTO users (society_id, unit_id, name, email, mobile_number, password_hash, role, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, 'resident', true)
       RETURNING id, name, mobile_number, unit_id, role`,
      [req.user.societyId, unitId, name, placeholderEmail, mobileNumber, passwordHash]
    );

    // Only the hash is stored. The plain password is returned once, in this
    // response, and is never logged or exposed by any GET route.
    res.status(201).json({
      message: 'Resident created',
      resident: result.rows[0],
      temporaryPassword: tempPassword,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A resident with this mobile number already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create resident' });
  }
});

module.exports = router;
