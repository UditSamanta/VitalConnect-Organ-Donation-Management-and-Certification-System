const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { runOrganMatching } = require('../utils/matching');

const router = express.Router();

// ────────────────────────────────────────────────────────────
// POST /api/donor/register — submit donor profile
// Uses a transaction: inserts into donors then donor_organs.
// If organ insert fails the whole registration rolls back.
// ────────────────────────────────────────────────────────────
router.post(
  '/register',
  authenticate,
  authorize('donor'),
  [
    body('age').isInt({ min: 18, max: 120 }).withMessage('Age must be 18-120'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('blood_group').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('contact_number').trim().notEmpty().withMessage('Contact number is required'),
    body('organs').isArray({ min: 1 }).withMessage('Select at least one organ'),
    body('emergency_contact_name').trim().notEmpty().withMessage('Emergency contact name is required'),
    body('emergency_contact_phone').trim().notEmpty().withMessage('Emergency contact phone is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      age, gender, blood_group, address, city, state, pincode,
      contact_number,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      organs,
    } = req.body;
    const userId = req.user.user_id;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Check for existing profile
      const [existing] = await conn.query(
        'SELECT donor_id FROM donors WHERE user_id = ?',
        [userId]
      );
      if (existing.length > 0) {
        await conn.rollback();
        return res.status(409).json({
          success: false,
          message: 'Donor profile already exists. Use the update endpoint.',
        });
      }

      // Insert donor row
      const [result] = await conn.query(
        `INSERT INTO donors
           (user_id, age, gender, blood_group, address, city, state, pincode,
            contact_number, emergency_contact_name, emergency_contact_phone,
            emergency_contact_relation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, age, gender, blood_group, address,
          city || null, state || null, pincode || null,
          contact_number,
          emergency_contact_name, emergency_contact_phone,
          emergency_contact_relation || null,
        ]
      );
      const donorId = result.insertId;

      // Insert pledged organs (1NF: each organ is its own row)
      if (organs.length > 0) {
        const organValues = organs.map(o => [donorId, o]);
        await conn.query(
          'INSERT INTO donor_organs (donor_id, organ_name) VALUES ?',
          [organValues]
        );
      }

      // Insert audit log
      await conn.query(
        `INSERT INTO audit_log (table_name, operation, record_id, performed_by, new_values)
         VALUES ('donors', 'INSERT', ?, ?, ?)`,
        [donorId, userId, JSON.stringify({ age, gender, blood_group, organs })]
      );

      await conn.commit();
      return res.status(201).json({
        success: true,
        message: 'Donor profile submitted successfully. Awaiting admin approval.',
        donor_id: donorId,
      });
    } catch (err) {
      await conn.rollback();
      console.error('Donor register error:', err);
      return res.status(500).json({ success: false, message: 'Server error.' });
    } finally {
      conn.release();
    }
  }
);

// ────────────────────────────────────────────────────────────
// GET /api/donor/profile — get own full profile
// ────────────────────────────────────────────────────────────
router.get('/profile', authenticate, authorize('donor'), async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [rows] = await pool.query(
      `SELECT d.*, u.name, u.email,
              c.certificate_uid, c.issue_date AS cert_issue_date
       FROM donors d
       JOIN users u ON d.user_id = u.user_id
       LEFT JOIN certificates c ON c.donor_id = d.donor_id
       WHERE d.user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor profile not found. Please register first.',
      });
    }

    const donor = rows[0];

    // Fetch organs from normalized table
    const [organRows] = await pool.query(
      'SELECT organ_name FROM donor_organs WHERE donor_id = ?',
      [donor.donor_id]
    );
    donor.organs = organRows.map(r => r.organ_name);

    // Fetch medical conditions
    const [conditions] = await pool.query(
      'SELECT * FROM donor_medical_conditions WHERE donor_id = ? ORDER BY condition_id',
      [donor.donor_id]
    );
    donor.medical_conditions = conditions;

    // Fetch allergies
    const [allergies] = await pool.query(
      'SELECT * FROM donor_allergies WHERE donor_id = ?',
      [donor.donor_id]
    );
    donor.allergies = allergies;

    // Fetch lifestyle
    const [lifestyleRows] = await pool.query(
      'SELECT * FROM donor_lifestyle WHERE donor_id = ?',
      [donor.donor_id]
    );
    donor.lifestyle = lifestyleRows[0] || null;

    return res.json({ success: true, donor });
  } catch (err) {
    console.error('Donor profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
// PUT /api/donor/update — update donor profile
// Replaces organ rows and updates main profile atomically.
// ────────────────────────────────────────────────────────────
router.put('/update', authenticate, authorize('donor'), async (req, res) => {
  const userId = req.user.user_id;
  const {
    age, gender, blood_group, address, city, state, pincode,
    contact_number,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
    organs,
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      'SELECT donor_id, status FROM donors WHERE user_id = ?',
      [userId]
    );
    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Donor profile not found.' });
    }
    const { donor_id: donorId, status: oldStatus } = existing[0];

    await conn.query(
      `UPDATE donors SET
         age=?, gender=?, blood_group=?, address=?, city=?, state=?, pincode=?,
         contact_number=?,
         emergency_contact_name=?, emergency_contact_phone=?, emergency_contact_relation=?
       WHERE user_id=?`,
      [
        age, gender, blood_group, address,
        city || null, state || null, pincode || null,
        contact_number,
        emergency_contact_name || null, emergency_contact_phone || null,
        emergency_contact_relation || null,
        userId,
      ]
    );

    // Replace organs: delete old rows then insert new ones (atomic)
    if (Array.isArray(organs)) {
      await conn.query('DELETE FROM donor_organs WHERE donor_id = ?', [donorId]);
      if (organs.length > 0) {
        const organValues = organs.map(o => [donorId, o]);
        await conn.query(
          'INSERT INTO donor_organs (donor_id, organ_name) VALUES ?',
          [organValues]
        );
      }
    }

    await conn.query(
      `INSERT INTO audit_log (table_name, operation, record_id, performed_by, old_values, new_values)
       VALUES ('donors', 'UPDATE', ?, ?, ?, ?)`,
      [donorId, userId, JSON.stringify({ status: oldStatus }), JSON.stringify({ age, gender, blood_group })]
    );

    await conn.commit();
    return res.json({ success: true, message: 'Donor profile updated successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error('Donor update error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    conn.release();
  }
});

// ────────────────────────────────────────────────────────────
// PUT /api/donor/medical — update medical history, lifestyle
// ────────────────────────────────────────────────────────────
router.put('/medical', authenticate, authorize('donor'), async (req, res) => {
  const userId = req.user.user_id;
  const { conditions, allergies, lifestyle } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      'SELECT donor_id FROM donors WHERE user_id = ?',
      [userId]
    );
    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Donor profile not found.' });
    }
    const donorId = existing[0].donor_id;

    // Replace medical conditions
    if (Array.isArray(conditions)) {
      await conn.query(
        'DELETE FROM donor_medical_conditions WHERE donor_id = ?',
        [donorId]
      );
      for (const c of conditions) {
        if (c.condition_name) {
          await conn.query(
            `INSERT INTO donor_medical_conditions
               (donor_id, condition_name, diagnosed_year, severity, is_current, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              donorId, c.condition_name,
              c.diagnosed_year || null,
              c.severity || 'mild',
              c.is_current !== undefined ? c.is_current : true,
              c.notes || null,
            ]
          );
        }
      }
    }

    // Replace allergies
    if (Array.isArray(allergies)) {
      await conn.query('DELETE FROM donor_allergies WHERE donor_id = ?', [donorId]);
      for (const a of allergies) {
        if (a.allergen) {
          await conn.query(
            'INSERT INTO donor_allergies (donor_id, allergen, reaction_type) VALUES (?, ?, ?)',
            [donorId, a.allergen, a.reaction_type || null]
          );
        }
      }
    }

    // Upsert lifestyle
    if (lifestyle) {
      await conn.query(
        `INSERT INTO donor_lifestyle
           (donor_id, bmi, smoker, alcohol_use, exercise_freq, diet_type, past_surgeries, current_medications)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           bmi=VALUES(bmi), smoker=VALUES(smoker), alcohol_use=VALUES(alcohol_use),
           exercise_freq=VALUES(exercise_freq), diet_type=VALUES(diet_type),
           past_surgeries=VALUES(past_surgeries), current_medications=VALUES(current_medications)`,
        [
          donorId,
          lifestyle.bmi || null,
          lifestyle.smoker ? 1 : 0,
          lifestyle.alcohol_use || 'none',
          lifestyle.exercise_freq || 'none',
          lifestyle.diet_type || 'non-vegetarian',
          lifestyle.past_surgeries || null,
          lifestyle.current_medications || null,
        ]
      );
    }

    await conn.commit();
    return res.json({ success: true, message: 'Medical history updated successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error('Donor medical update error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
