const express = require('express');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/certificate/download/:id — generate donor certificate PDF
router.get('/download/:id', authenticate, authorize('donor'), async (req, res) => {
  const certId   = req.params.id;
  const userId   = req.user.user_id;

  try {
    // 1. Fetch certificate + donor + user info
    const [rows] = await pool.query(
      `SELECT c.*, d.donor_id, d.blood_group, d.age, d.gender,
              u.name, u.email
       FROM certificates c
       JOIN donors d ON c.donor_id = d.donor_id
       JOIN users u ON d.user_id = u.user_id
       WHERE (c.certificate_id = ? OR c.certificate_uid = ?) AND d.user_id = ?`,
      [certId, certId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Certificate not found or access denied.' });
    }

    const cert  = rows[0];

    // 2. Fetch pledged organs from the normalized table
    const [organRows] = await pool.query(
      `SELECT organ_name FROM donor_organs WHERE donor_id = ?`,
      [cert.donor_id]
    );
    const organsList = organRows.map(o => o.organ_name).join(', ');

    const issueDate = cert.issue_date
      ? new Date(cert.issue_date).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })
      : new Date().toLocaleDateString('en-IN');

    // Build PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 60, right: 60 },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="donor-certificate-${cert.certificate_uid}.pdf"`);
    doc.pipe(res);

    // Background rect - Clean white with premium borders
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
    
    // Outer solid blue border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(3).strokeColor('#1e3a8a').stroke();
       
    // Inner gold/accent border
    doc.rect(36, 36, doc.page.width - 72, doc.page.height - 72)
       .lineWidth(1).strokeColor('#d97706').stroke();

    // Logo image at the top
    try {
      const logoPath = 'C:/Users/udits/.gemini/antigravity/brain/7521c2f8-a261-4903-8399-394bf8964acb/odms_logo_1775469779767.png';
      // Center the image: (PageWidth - ImageWidth) / 2
      doc.image(logoPath, (doc.page.width - 70) / 2, 50, { width: 70 });
    } catch(err) {
      console.warn('Logo image not found, skipping logo render');
    }

    // Title Section
    doc.fillColor('#1e3a8a')
       .fontSize(24)
       .font('Times-Bold')
       .text('ORGAN DONATION CERTIFICATE', 60, 140, { align: 'center' });

    doc.moveDown(0.2);
    doc.fillColor('#d97706') // Gold text
       .fontSize(16)
       .font('Times-Italic')
       .text('National Organ Donation Management System', { align: 'center' });

    doc.moveDown(0.8);
    doc.moveTo(100, doc.y).lineTo(doc.page.width - 100, doc.y)
       .lineWidth(0.5).strokeColor('#e5e7eb').stroke();

    // Main Body Text
    doc.moveDown(1.5);
    doc.fillColor('#4b5563').fontSize(14).font('Helvetica-Oblique')
       .text('This is to proudly certify that', { align: 'center' });

    doc.moveDown(0.8);
    // Big prominent name
    doc.fillColor('#0f172a').fontSize(32).font('Helvetica-Bold')
       .text(cert.name.toUpperCase(), { align: 'center' });

    doc.moveDown(0.8);
    doc.fillColor('#4b5563').fontSize(12).font('Helvetica')
       .text('has voluntarily and generously pledged to donate their organs', { align: 'center' })
       .text('to save lives. Your pledge is formally registered in our network.', { align: 'center' });

    doc.moveDown(1.5);

    // Details Section (Elegant Table-like structure)
    const boxX = 100;
    const boxWidth = doc.page.width - 200;
    const boxY = doc.y;
    
    // Light gray background for details
    doc.rect(boxX, boxY, boxWidth, 145).fill('#f8fafc');
    // Accent strip on the left
    doc.rect(boxX, boxY, 4, 145).fill('#1e3a8a');

    let lineY = boxY + 20;
    const detailsX = boxX + 30;

    const details = [
      ['Registration UID',    cert.certificate_uid],
      ['Blood Group',         cert.blood_group],
      ['Organs Pledged',      organsList || 'General Donation'],
      ['Gender / Age',        `${cert.gender.charAt(0).toUpperCase() + cert.gender.slice(1)} / ${cert.age} Years`],
      ['Date of Issue',       issueDate],
    ];

    details.forEach(([label, value]) => {
      doc.fillColor('#64748b').fontSize(11).font('Helvetica-Bold')
         .text(label, detailsX, lineY, { continued: false });
      doc.fillColor('#0f172a').font('Helvetica')
         .text(value, detailsX + 130, lineY);
      lineY += 24;
    });

    // Signatures Section
    const signatureY = doc.y + 110;
    
    // Left signature
    doc.moveTo(90, signatureY).lineTo(230, signatureY)
       .lineWidth(1).strokeColor('#94a3b8').stroke();
    doc.fillColor('#4b5563').fontSize(10).font('Helvetica')
       .text('Authorized Signatory', 90, signatureY + 5, { width: 140, align: 'center' });
       
    // Right signature
    doc.moveTo(doc.page.width - 230, signatureY).lineTo(doc.page.width - 90, signatureY)
       .lineWidth(1).strokeColor('#94a3b8').stroke();
    doc.fillColor('#4b5563').fontSize(10).font('Helvetica')
       .text(`Issued By: ${cert.issued_by}`, doc.page.width - 230, signatureY + 5, { width: 140, align: 'center' });

    // Footer
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
       .text('This certificate uses cryptography for data integrity. Verify at: www.odms.org', 
          0, doc.page.height - 50, { align: 'center', width: doc.page.width });

    doc.end();
  } catch (err) {
    console.error('Certificate error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Server error generating certificate.' });
    }
  }
});

// GET /api/certificate/info/:id — get certificate info (JSON)
router.get('/info/:donorId', authenticate, async (req, res) => {
  const donorId = req.params.donorId;
  try {
    const [rows] = await pool.query(
      `SELECT c.*, d.blood_group, u.name
       FROM certificates c
       JOIN donors d ON c.donor_id = d.donor_id
       JOIN users u ON d.user_id = u.user_id
       WHERE c.donor_id = ?`,
      [donorId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No certificate found.' });
    }
    const cert = rows[0];

    // Fetch organs
    const [organRows] = await pool.query(`SELECT organ_name FROM donor_organs WHERE donor_id = ?`, [cert.donor_id]);
    cert.organs = organRows.map(o => o.organ_name);
    
    return res.json({ success: true, certificate: cert });
  } catch (err) {
    console.error('Cert info error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
