const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes        = require('./routes/auth');
const donorRoutes       = require('./routes/donor');
const hospitalRoutes    = require('./routes/hospital');
const adminRoutes       = require('./routes/admin');
const certificateRoutes = require('./routes/certificate');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/donor',       donorRoutes);
app.use('/api/hospital',    hospitalRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/certificate', certificateRoutes);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ODMS API is running.', timestamp: new Date() });
});

// ── Public Stats (no auth — used by Landing page) ───────────
// Returns live counts directly from the database so the
// homepage stats are always accurate and verifiable.
app.get('/api/public/stats', async (req, res) => {
  try {
    const pool = require('./config/db');
    const [[donors]]    = await pool.query('SELECT COUNT(*) AS count FROM donors');
    const [[hospitals]] = await pool.query('SELECT COUNT(*) AS count FROM hospitals');
    const [[requests]]  = await pool.query('SELECT COUNT(*) AS count FROM organ_requests');
    const [[matches]]   = await pool.query('SELECT COUNT(*) AS count FROM matches');
    const [[organs]]    = await pool.query('SELECT COUNT(*) AS count FROM donor_organs');
    const [[certs]]     = await pool.query('SELECT COUNT(*) AS count FROM certificates');
    return res.json({
      success: true,
      stats: {
        total_donors:    donors.count,
        total_hospitals: hospitals.count,
        total_requests:  requests.count,
        total_matches:   matches.count,
        total_organs:    organs.count,
        total_certs:     certs.count,
      },
    });
  } catch (err) {
    console.error('Public stats error:', err);
    return res.status(500).json({ success: false, message: 'Could not fetch stats.' });
  }
});

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🏥 ODMS Backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
