const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const generateTempPassword = require('../utils/tempPassword');
const { SESSION_IDLE_MINUTES } = require('../config');

const router = express.Router();

const MOBILE_PATTERN = /^\d{10}$/;

// List residents — admin only. Never selects password_hash.
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.mobile_number, u.unit_id, un.unit_number, u.created_at,
              u.must_change_password,
              (u.session_id IS NOT NULL
               AND u.last_active_at > NOW() - make_interval(mins => $2::int)) AS has_active_session
       FROM users u
       LEFT JOIN units un ON un.id = u.unit_id AND un.society_id = u.society_id
       WHERE u.society_id = $1 AND u.role = 'resident'
       ORDER BY un.unit_number, u.name`,
      [req.user.societyId, SESSION_IDLE_MINUTES]
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

// Reset a resident's password — admin only, own society only.
// Generating a new one-time password also ends their current session.
router.post('/:id/reset-password', verifyToken, requireRole('admin'), async (req, res) => {
  const residentId = Number(req.params.id);

  if (!Number.isInteger(residentId)) {
    return res.status(400).json({ error: 'Invalid resident id' });
  }

  try {
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await db.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = true,
           session_id = NULL, last_active_at = NULL
       WHERE id = $2 AND society_id = $3 AND role = 'resident'
       RETURNING id`,
      [passwordHash, residentId, req.user.societyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resident not found in your society' });
    }

    // Plain password is returned once and never logged.
    res.json({
      message: 'Password reset',
      temporaryPassword: tempPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Force a resident out of their current session — admin only, own society only.
router.post('/:id/force-logout', verifyToken, requireRole('admin'), async (req, res) => {
  const residentId = Number(req.params.id);

  if (!Number.isInteger(residentId)) {
    return res.status(400).json({ error: 'Invalid resident id' });
  }

  try {
    const result = await db.query(
      `UPDATE users SET session_id = NULL, last_active_at = NULL
       WHERE id = $1 AND society_id = $2 AND role = 'resident'
       RETURNING id`,
      [residentId, req.user.societyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resident not found in your society' });
    }

    res.json({ message: 'Resident logged out' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log out resident' });
  }
});

module.exports = router;
