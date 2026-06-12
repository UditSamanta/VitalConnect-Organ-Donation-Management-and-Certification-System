const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { runOrganMatching } = require('../utils/matching');

const router = express.Router();

// ────────────────────────────────────────────────────────────
// GET /api/admin/donors — list all donors with organs
// ────────────────────────────────────────────────────────────
router.get('/donors', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [donors] = await pool.query(
      `SELECT d.*, u.name, u.email, u.created_at AS user_registered_at,
              c.certificate_uid
       FROM donors d
       JOIN users u ON d.user_id = u.user_id
       LEFT JOIN certificates c ON c.donor_id = d.donor_id
       ORDER BY d.registered_at DESC`
    );

    // Attach organs and condition counts from normalized tables
    for (const donor of donors) {
      const [organRows] = await pool.query(
        'SELECT organ_name FROM donor_organs WHERE donor_id = ?',
        [donor.donor_id]
      );
      donor.organs = organRows.map(r => r.organ_name);

      const [condRows] = await pool.query(
        'SELECT COUNT(*) AS cnt FROM donor_medical_conditions WHERE donor_id = ?',
        [donor.donor_id]
      );
      donor.condition_count = condRows[0].cnt;
    }

    return res.json({ success: true, donors });
  } catch (err) {
    console.error('Admin donors error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
// PUT /api/admin/approve-donor/:id — approve or reject
// Uses transaction + audit log (concurrency control)
// ────────────────────────────────────────────────────────────
router.put('/approve-donor/:id', authenticate, authorize('admin'), async (req, res) => {
  const donorId = parseInt(req.params.id);
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      'SELECT * FROM donors WHERE donor_id = ? FOR UPDATE',
      [donorId]
    );
    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Donor not found.' });
    }

    const oldStatus = existing[0].status;
    await conn.query(
      'UPDATE donors SET status = ? WHERE donor_id = ?',
      [status, donorId]
    );

    if (status === 'approved') {
      const certUid = `ODMS-${new Date().getFullYear()}-${String(donorId).padStart(5, '0')}`;
      await conn.query(
        `INSERT INTO certificates (donor_id, certificate_uid, issue_date)
         VALUES (?, ?, CURDATE())
         ON DUPLICATE KEY UPDATE certificate_uid = ?, issue_date = CURDATE()`,
        [donorId, certUid, certUid]
      );
    }

    // Audit log
    await conn.query(
      `INSERT INTO audit_log (table_name, operation, record_id, performed_by, old_values, new_values)
       VALUES ('donors', 'UPDATE', ?, ?, ?, ?)`,
      [donorId, req.user.user_id, JSON.stringify({ status: oldStatus }), JSON.stringify({ status })]
    );

    await conn.commit();

    // Run matching outside transaction (own transaction inside)
    if (status === 'approved') {
      await runOrganMatching(pool, donorId);
    }

    return res.json({ success: true, message: `Donor ${status} successfully.` });
  } catch (err) {
    await conn.rollback();
    console.error('Admin approve-donor error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    conn.release();
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/admin/hospitals — list all hospitals
// ────────────────────────────────────────────────────────────
router.get('/hospitals', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [hospitals] = await pool.query(
      `SELECT h.*,
              u.name AS contact_person, u.email AS user_email,
              COUNT(r.request_id) AS total_requests
       FROM hospitals h
       JOIN users u ON h.user_id = u.user_id
       LEFT JOIN organ_requests r ON r.hospital_id = h.hospital_id
       GROUP BY h.hospital_id
       ORDER BY h.created_at DESC`
    );
    return res.json({ success: true, hospitals });
  } catch (err) {
    console.error('Admin hospitals error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
// PUT /api/admin/verify-hospital/:id
// ────────────────────────────────────────────────────────────
router.put('/verify-hospital/:id', authenticate, authorize('admin'), async (req, res) => {
  const hospitalId = parseInt(req.params.id);
  const { is_verified } = req.body;
  try {
    await pool.query(
      'UPDATE hospitals SET is_verified = ? WHERE hospital_id = ?',
      [is_verified ? 1 : 0, hospitalId]
    );
    await pool.query(
      `INSERT INTO audit_log (table_name, operation, record_id, performed_by, new_values)
       VALUES ('hospitals', 'UPDATE', ?, ?, ?)`,
      [hospitalId, req.user.user_id, JSON.stringify({ is_verified })]
    );
    return res.json({ success: true, message: `Hospital ${is_verified ? 'verified' : 'unverified'}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/admin/requests — all organ requests
// ────────────────────────────────────────────────────────────
router.get('/requests', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT r.*, h.hospital_name, h.city AS hospital_city
       FROM organ_requests r
       JOIN hospitals h ON r.hospital_id = h.hospital_id
       ORDER BY r.requested_at DESC`
    );
    return res.json({ success: true, requests });
  } catch (err) {
    console.error('Admin requests error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/admin/matches — all matches
// ────────────────────────────────────────────────────────────
router.get('/matches', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [matches] = await pool.query(
      `SELECT m.match_id, m.matched_at,
              u.name AS donor_name, d.blood_group, d.age AS donor_age,
              r.organ_type, r.patient_name, r.urgency,
              h.hospital_name
       FROM matches m
       JOIN donors d ON m.donor_id = d.donor_id
       JOIN users u ON d.user_id = u.user_id
       JOIN organ_requests r ON m.request_id = r.request_id
       JOIN hospitals h ON r.hospital_id = h.hospital_id
       ORDER BY m.matched_at DESC`
    );
    return res.json({ success: true, matches });
  } catch (err) {
    console.error('Admin matches error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/admin/stats — dashboard analytics
// ────────────────────────────────────────────────────────────
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [[donorCount]]    = await pool.query("SELECT COUNT(*) AS count FROM donors");
    const [[approvedCount]] = await pool.query("SELECT COUNT(*) AS count FROM donors WHERE status='approved'");
    const [[pendingCount]]  = await pool.query("SELECT COUNT(*) AS count FROM donors WHERE status='pending'");
    const [[hospCount]]     = await pool.query("SELECT COUNT(*) AS count FROM hospitals");
    const [[verHospCount]]  = await pool.query("SELECT COUNT(*) AS count FROM hospitals WHERE is_verified=1");
    const [[reqCount]]      = await pool.query("SELECT COUNT(*) AS count FROM organ_requests");
    const [[matchCount]]    = await pool.query("SELECT COUNT(*) AS count FROM matches");
    const [[certCount]]     = await pool.query("SELECT COUNT(*) AS count FROM certificates");
    const [[pendingReq]]    = await pool.query("SELECT COUNT(*) AS count FROM organ_requests WHERE status='pending'");

    // Organ-wise breakdown
    const [organBreakdown] = await pool.query(
      `SELECT organ_name, COUNT(*) AS count
       FROM donor_organs
       GROUP BY organ_name
       ORDER BY count DESC`
    );

    // Urgency breakdown
    const [urgencyBreakdown] = await pool.query(
      `SELECT urgency, COUNT(*) AS count
       FROM organ_requests
       GROUP BY urgency
       ORDER BY FIELD(urgency, 'critical','high','medium','low')`
    );

    return res.json({
      success: true,
      stats: {
        total_donors:       donorCount.count,
        approved_donors:    approvedCount.count,
        pending_donors:     pendingCount.count,
        total_hospitals:    hospCount.count,
        verified_hospitals: verHospCount.count,
        total_requests:     reqCount.count,
        pending_requests:   pendingReq.count,
        total_matches:      matchCount.count,
        total_certificates: certCount.count,
        organ_breakdown:    organBreakdown,
        urgency_breakdown:  urgencyBreakdown,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/admin/users — list all users
// ────────────────────────────────────────────────────────────
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
// PUT /api/admin/toggle-user/:id
// ────────────────────────────────────────────────────────────
router.put('/toggle-user/:id', authenticate, authorize('admin'), async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE user_id = ?',
      [userId]
    );
    return res.json({ success: true, message: 'User status toggled.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
