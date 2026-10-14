const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const QRCode = require('qrcode');
const db = require('../db');

// Generate batch QR codes and return ZIP archive
router.post('/generate-zip', async (req, res) => {
  try {
    const { items, prefix = 'batch', isDynamic = true } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items array is required' });
    }

    const host = req.get('host');
    const protocol = req.protocol;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="qrcodes-bulk-${Date.now()}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const title = item.title || `${prefix}-${i + 1}`;
      const destination = item.destinationUrl || item.content || 'https://example.com';
      const shortCode = `${prefix.toLowerCase().replace(/[^a-z0-9]/g, '')}-${i + 1}-${Math.random().toString(36).substring(2, 5)}`;

      let newQR;
      if (item.saveToCloud !== false) {
        newQR = db.createQRCode({
          title: title,
          type: item.type || 'url',
          isDynamic: isDynamic,
          shortCode: isDynamic ? shortCode : null,
          destinationUrl: destination,
          category: item.category || 'Bulk Generation',
          status: 'active'
        });
      }

      const payload = isDynamic
        ? `${protocol}://${host}/r/${shortCode}`
        : destination;

      const qrPngBuffer = await QRCode.toBuffer(payload, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'H'
      });

      const safeFilename = `${title.replace(/[^a-z0-9_-]/gi, '_')}.png`;
      archive.append(qrPngBuffer, { name: safeFilename });
    }

    await archive.finalize();
  } catch (err) {
    console.error('Bulk generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

module.exports = router;
