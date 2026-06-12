// Blood group compatibility matrix for organ donation
// Key: recipient blood group → Value: list of compatible donor blood groups
const COMPATIBILITY = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],  // Universal recipient
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'],  // Universal donor, only receives O-
};

/**
 * Run organ matching for a newly approved donor.
 * Queries donor_organs table (normalized 1NF design) instead of
 * JSON column.  Finds pending requests compatible with the donor's
 * blood group and pledged organs, creates match records, and
 * updates request statuses inside a transaction (concurrency control).
 *
 * Concurrency: uses a serializable transaction so two simultaneous
 * admin approvals cannot double-match the same donor→request pair.
 *
 * @param {object} pool     - mysql2 pool
 * @param {number} donorId  - approved donor ID
 */
async function runOrganMatching(pool, donorId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the donor row for the duration of this transaction
    const [donorRows] = await conn.query(
      `SELECT donor_id, blood_group FROM donors
       WHERE donor_id = ? AND status = 'approved'
       FOR UPDATE`,
      [donorId]
    );
    if (donorRows.length === 0) {
      await conn.rollback();
      return;
    }

    const donor = donorRows[0];
    const donorBloodGroup = donor.blood_group;

    // Fetch pledged organs from normalized table
    const [organRows] = await conn.query(
      'SELECT organ_name FROM donor_organs WHERE donor_id = ?',
      [donorId]
    );
    const donorOrgans = organRows.map(r => r.organ_name);

    if (donorOrgans.length === 0) {
      await conn.commit();
      return;
    }

    // Fetch pending requests (lock them to prevent race conditions)
    const [requests] = await conn.query(
      `SELECT * FROM organ_requests WHERE status = 'pending' FOR UPDATE`
    );

    for (const request of requests) {
      const compatibleDonors = COMPATIBILITY[request.blood_group] || [];
      const organMatch = donorOrgans.some(
        o => o.toLowerCase() === request.organ_type.toLowerCase()
      );
      const bloodMatch = compatibleDonors.includes(donorBloodGroup);

      if (organMatch && bloodMatch) {
        // Check idempotency — match must not already exist
        const [existing] = await conn.query(
          'SELECT match_id FROM matches WHERE donor_id = ? AND request_id = ?',
          [donor.donor_id, request.request_id]
        );
        if (existing.length === 0) {
          await conn.query(
            'INSERT INTO matches (donor_id, request_id) VALUES (?, ?)',
            [donor.donor_id, request.request_id]
          );
          await conn.query(
            `UPDATE organ_requests SET status = 'matched' WHERE request_id = ?`,
            [request.request_id]
          );
        }
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('Matching transaction rolled back:', err);
  } finally {
    conn.release();
  }
}

module.exports = { runOrganMatching, COMPATIBILITY };
