const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const db = require('../db');

// List QR codes
router.get('/', (req, res) => {
  try {
    let list = db.getAllQRCodes();
    const { search, status, type, category } = req.query;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.shortCode.toLowerCase().includes(q) ||
        item.destinationUrl.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'all') {
      list = list.filter(item => item.status === status);
    }

    if (type && type !== 'all') {
      list = list.filter(item => item.type === type);
    }

    if (category && category !== 'all') {
      list = list.filter(item => item.category === category);
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single QR code
router.get('/:id', (req, res) => {
  try {
    const qr = db.getQRCodeById(req.params.id);
    if (!qr) return res.status(404).json({ success: false, error: 'QR Code not found' });
    res.json({ success: true, data: qr });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new QR Code
router.post('/', (req, res) => {
  try {
    const { title, type, isDynamic, destinationUrl, customShortCode, category, styleConfig } = req.body;

    if (!destinationUrl && !req.body.content) {
      return res.status(400).json({ success: false, error: 'Target destination or content is required' });
    }

    let finalShortCode = null;
    if (isDynamic) {
      if (customShortCode && customShortCode.trim()) {
        const cleaned = customShortCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (db.getQRCodeByShortCode(cleaned)) {
          return res.status(400).json({ success: false, error: 'Short code is already taken. Please choose another.' });
        }
        finalShortCode = cleaned;
      } else {
        // Generate random short code
        let attempts = 0;
        do {
          finalShortCode = Math.random().toString(36).substring(2, 8);
          attempts++;
        } while (db.getQRCodeByShortCode(finalShortCode) && attempts < 10);
      }
    }

    const newQR = db.createQRCode({
      title: title || 'Untitled QR',
      type: type || 'url',
      isDynamic: isDynamic !== undefined ? isDynamic : true,
      shortCode: finalShortCode,
      destinationUrl: destinationUrl || req.body.content || 'https://example.com',
      status: 'active',
      category: category || 'General',
      styleConfig: styleConfig || {}
    });

    res.status(201).json({ success: true, data: newQR });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update QR Code (destination URL, status, title, style, etc.)
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.getQRCodeById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'QR Code not found' });
    }

    const { title, destinationUrl, status, category, styleConfig, shortCode } = req.body;

    if (shortCode && shortCode !== existing.shortCode) {
      const cleaned = shortCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const conflict = db.getQRCodeByShortCode(cleaned);
      if (conflict && conflict.id !== id) {
        return res.status(400).json({ success: false, error: 'Short code is already in use' });
      }
    }

    const updated = db.updateQRCode(id, {
      ...(title !== undefined && { title }),
      ...(destinationUrl !== undefined && { destinationUrl }),
      ...(status !== undefined && { status }),
      ...(category !== undefined && { category }),
      ...(styleConfig !== undefined && { styleConfig }),
      ...(shortCode !== undefined && { shortCode })
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete QR Code
router.delete('/:id', (req, res) => {
  try {
    const deleted = db.deleteQRCode(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'QR Code not found' });
    }
    res.json({ success: true, message: 'QR Code deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate server-side QR Code SVG/PNG image
router.get('/:id/render', async (req, res) => {
  try {
    const qr = db.getQRCodeById(req.params.id);
    if (!qr) return res.status(404).json({ error: 'QR code not found' });

    // Determine payload: If dynamic, route via /r/:shortCode; else direct destinationUrl
    const host = req.get('host');
    const protocol = req.protocol;
    const payload = qr.isDynamic 
      ? `${protocol}://${host}/r/${qr.shortCode}`
      : qr.destinationUrl;

    const format = req.query.format || 'svg';
    const dark = (qr.styleConfig && qr.styleConfig.fgColor) || '#000000';
    const light = (qr.styleConfig && qr.styleConfig.bgColor) || '#ffffff';

    if (format === 'svg') {
      const svg = await QRCode.toString(payload, {
        type: 'svg',
        color: { dark, light },
        errorCorrectionLevel: (qr.styleConfig && qr.styleConfig.errorCorrectionLevel) || 'M',
        margin: 2
      });
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    } else {
      const buffer = await QRCode.toBuffer(payload, {
        type: 'png',
        width: parseInt(req.query.width) || 512,
        color: { dark, light },
        errorCorrectionLevel: (qr.styleConfig && qr.styleConfig.errorCorrectionLevel) || 'M',
        margin: 2
      });
      res.setHeader('Content-Type', 'image/png');
      return res.send(buffer);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
