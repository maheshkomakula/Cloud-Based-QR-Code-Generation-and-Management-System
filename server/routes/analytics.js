const express = require('express');
const router = express.Router();
const db = require('../db');

// Overall or Per-QR Analytics
router.get('/overview', (req, res) => {
  try {
    const { qrId } = req.query;
    const summary = db.getAnalyticsSummary(qrId);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Recent Scan logs
router.get('/scans', (req, res) => {
  try {
    const { qrId, shortCode } = req.query;
    const scans = db.getScans({ qrId, shortCode });
    res.json({ success: true, count: scans.length, data: scans.slice(0, 100) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CSV Export
router.get('/export', (req, res) => {
  try {
    const { qrId } = req.query;
    const scans = db.getScans({ qrId });

    let csv = 'Scan ID,Short Code,Timestamp,Device,OS,Browser,City,Country,IP,Referrer\n';
    scans.forEach(s => {
      csv += `"${s.id}","${s.shortCode}","${s.timestamp}","${s.device}","${s.os}","${s.browser}","${s.city}","${s.country}","${s.ip}","${s.referrer}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="qr-analytics-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Simulate scan endpoint (useful for demo & presentation purposes!)
router.post('/simulate', (req, res) => {
  try {
    const { shortCode, device, os, browser, city, country } = req.body;
    if (!shortCode) {
      return res.status(400).json({ success: false, error: 'shortCode is required' });
    }

    const qr = db.getQRCodeByShortCode(shortCode);
    if (!qr) {
      return res.status(404).json({ success: false, error: 'QR Code not found' });
    }

    const result = db.incrementScan(shortCode, {
      device: device || 'Mobile',
      os: os || 'iOS',
      browser: browser || 'Safari',
      city: city || 'San Francisco',
      country: country || 'United States',
      countryCode: 'US',
      ip: `198.51.100.${Math.floor(Math.random() * 254) + 1}`,
      referrer: 'Camera Live Scan'
    });

    res.json({ success: true, message: 'Scan simulated successfully', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
