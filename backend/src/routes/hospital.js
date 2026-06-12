const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ────────────────────────────────────────────────────────────
// POST /api/hospital/register — submit hospital profile
// ────────────────────────────────────────────────────────────
router.post(
  '/register',
  authenticate,
  authorize('hospital'),
  [
    body('hospital_name').trim().notEmpty().withMessage('Hospital name is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('contact_number').trim().notEmpty().withMessage('Contact number is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      hospital_name, hospital_type, address, city, state, pincode,
      contact_number, email, website, license_number, bed_count, specialization,
    } = req.body;
    const userId = req.user.user_id;

    try {
      const [existing] = await pool.query(
        'SELECT hospital_id FROM hospitals WHERE user_id = ?',
        [userId]
      );
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Hospital profile already exists.' });
      }

      const [result] = await pool.query(
        `INSERT INTO hospitals
           (user_id, hospital_name, hospital_type, address, city, state, pincode,
            contact_number, email, website, license_number, bed_count, specialization)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, hospital_name, hospital_type || 'private', address,
          city || null, state || null, pincode || null,
          contact_number, email || null, website || null, license_number || null,
          bed_count || null, specialization || null,
        ]
      );

      return res.status(201).json({
        success: true,
        message: 'Hospital profile submitted. Pending admin verification.',
        hospital_id: result.insertId,
      });
    } catch (err) {
      console.error('Hospital register error:', err);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }
);

// ────────────────────────────────────────────────────────────
// GET /api/hospital/profile
// ────────────────────────────────────────────────────────────
router.get('/profile', authenticate, authorize('hospital'), async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [rows] = await pool.query(
      'SELECT h.*, u.name, u.email AS user_email FROM hospitals h JOIN users u ON h.user_id = u.user_id WHERE h.user_id = ?',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hospital profile not found.' });
    }
    return res.json({ success: true, hospital: rows[0] });
  } catch (err) {
    console.error('Hospital profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
// PUT /api/hospital/profile — update hospital profile
// ────────────────────────────────────────────────────────────
router.put('/profile', authenticate, authorize('hospital'), async (req, res) => {
  const userId = req.user.user_id;
  const {
    hospital_name, hospital_type, address, city, state, pincode,
    contact_number, email, website, license_number, bed_count, specialization,
  } = req.body;

  try {
    const [existing] = await pool.query(
      'SELECT hospital_id FROM hospitals WHERE user_id = ?',
      [userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Hospital profile not found.' });
    }

    await pool.query(
      `UPDATE hospitals SET
         hospital_name=?, hospital_type=?, address=?, city=?, state=?, pincode=?,
         contact_number=?, email=?, website=?, license_number=?, bed_count=?, specialization=?
       WHERE user_id=?`,
      [
        hospital_name, hospital_type || 'private', address,
        city || null, state || null, pincode || null,
        contact_number, email || null, website || null,
        license_number || null, bed_count || null, specialization || null,
        userId,
      ]
    );

    return res.json({ success: true, message: 'Hospital profile updated.' });
  } catch (err) {
    console.error('Hospital profile update error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/hospital/request — submit organ request
// ────────────────────────────────────────────────────────────
router.post(
  '/request',
  authenticate,
  authorize('hospital'),
  [
    body('organ_type').trim().notEmpty().withMessage('Organ type is required'),
    body('blood_group').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('patient_name').trim().notEmpty().withMessage('Patient name is required'),
    body('urgency').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid urgency level'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      organ_type, blood_group,
      patient_name, patient_age, patient_gender, patient_diagnosis,
      doctor_name, ward_number,
      urgency, notes,
    } = req.body;
    const userId = req.user.user_id;

    try {
      const [hospitalRows] = await pool.query(
        'SELECT hospital_id, is_verified FROM hospitals WHERE user_id = ?',
        [userId]
      );
      if (hospitalRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Hospital profile not found. Register your hospital first.',
        });
      }

      const hospital = hospitalRows[0];

      const [result] = await pool.query(
        `INSERT INTO organ_requests
           (hospital_id, organ_type, blood_group, patient_name, patient_age,
            patient_gender, patient_diagnosis, doctor_name, ward_number, urgency, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          hospital.hospital_id, organ_type.toLowerCase(), blood_group,
          patient_name, patient_age || null, patient_gender || null,
          patient_diagnosis || null, doctor_name || null, ward_number || null,
          urgency, notes || null,
        ]
      );

      // Audit log
      await pool.query(
        `INSERT INTO audit_log (table_name, operation, record_id, performed_by, new_values)
         VALUES ('organ_requests', 'INSERT', ?, ?, ?)`,
        [result.insertId, userId, JSON.stringify({ organ_type, blood_group, patient_name, urgency })]
      );

      return res.status(201).json({
        success: true,
        message: 'Organ request submitted successfully.',
        request_id: result.insertId,
      });
    } catch (err) {
      console.error('Organ request error:', err);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }
);

// ────────────────────────────────────────────────────────────
// GET /api/hospital/requests — list own hospital's requests
// ────────────────────────────────────────────────────────────
router.get('/requests', authenticate, authorize('hospital'), async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [hospitalRows] = await pool.query(
      'SELECT hospital_id FROM hospitals WHERE user_id = ?',
      [userId]
    );
    if (hospitalRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hospital profile not found.' });
    }
    const hospitalId = hospitalRows[0].hospital_id;

    const [requests] = await pool.query(
      'SELECT * FROM organ_requests WHERE hospital_id = ? ORDER BY requested_at DESC',
      [hospitalId]
    );
    return res.json({ success: true, requests });
  } catch (err) {
    console.error('Hospital requests error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/hospital/matches — view matching donors
// ────────────────────────────────────────────────────────────
router.get('/matches', authenticate, authorize('hospital'), async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [hospitalRows] = await pool.query(
      'SELECT hospital_id FROM hospitals WHERE user_id = ?',
      [userId]
    );
    if (hospitalRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hospital profile not found.' });
    }
    const hospitalId = hospitalRows[0].hospital_id;

    const [matches] = await pool.query(
      `SELECT m.match_id, m.matched_at,
              d.donor_id, d.blood_group AS donor_blood_group, d.age AS donor_age, d.gender AS donor_gender,
              u.name AS donor_name,
              r.request_id, r.organ_type, r.blood_group AS req_blood_group,
              r.patient_name, r.patient_age, r.patient_gender, r.patient_diagnosis,
              r.urgency, r.doctor_name, r.ward_number
       FROM matches m
       JOIN donors d ON m.donor_id = d.donor_id
       JOIN users u ON d.user_id = u.user_id
       JOIN organ_requests r ON m.request_id = r.request_id
       WHERE r.hospital_id = ?
       ORDER BY m.matched_at DESC`,
      [hospitalId]
    );

    // Attach organs array from normalized table for each donor
    for (const match of matches) {
      const [orgRows] = await pool.query(
        'SELECT organ_name FROM donor_organs WHERE donor_id = ?',
        [match.donor_id]
      );
      match.donor_organs = orgRows.map(r => r.organ_name);
    }

    return res.json({ success: true, matches });
  } catch (err) {
    console.error('Hospital matches error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
