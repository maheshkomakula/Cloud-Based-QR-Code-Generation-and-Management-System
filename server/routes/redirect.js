const express = require('express');
const router = express.Router();
const db = require('../db');
const { parseClient } = require('../utils/geo');

// Dynamic Redirection Endpoint: /r/:shortCode
router.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const qr = db.getQRCodeByShortCode(shortCode);

  if (!qr) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QR Code Not Found - Cloud QR System</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            background: radial-gradient(circle at top, #1e1b4b 0%, #0f172a 100%);
            color: #f8fafc;
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            max-width: 480px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .icon { font-size: 56px; margin-bottom: 16px; }
          h1 { font-family: 'Outfit', sans-serif; font-size: 26px; margin: 0 0 12px; color: #f43f5e; }
          p { color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: #fff;
            padding: 12px 24px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
          }
          .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.5); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🔍</div>
          <h1>QR Code Not Found</h1>
          <p>The dynamic QR code with code <strong>"${shortCode}"</strong> does not exist or has been removed from the Cloud QR system.</p>
          <a href="/" class="btn">Return to Dashboard</a>
        </div>
      </body>
      </html>
    `);
  }

  // Check if paused
  if (qr.status === 'paused') {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Campaign Paused - ${qr.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            background: radial-gradient(circle at top, #1e1b4b 0%, #0f172a 100%);
            color: #f8fafc;
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            max-width: 480px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .badge {
            display: inline-block;
            background: rgba(245, 158, 11, 0.15);
            color: #fbbf24;
            border: 1px solid rgba(245, 158, 11, 0.3);
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 20px;
          }
          h1 { font-family: 'Outfit', sans-serif; font-size: 26px; margin: 0 0 12px; }
          p { color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
          .footer-note { font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">⏸️ QR Code Paused</div>
          <h1>${escapeHtml(qr.title)}</h1>
          <p>This dynamic QR code campaign has been temporarily paused by its administrator. Please check back later.</p>
          <div class="footer-note">Powered by Cloud QR Generation & Management System</div>
        </div>
      </body>
      </html>
    `);
  }

  // Parse client and track scan event
  const clientInfo = parseClient(req);
  db.incrementScan(shortCode, clientInfo);

  // If destination is a standard web link, 302 redirect directly
  const dest = qr.destinationUrl.trim();
  if (dest.startsWith('http://') || dest.startsWith('https://')) {
    return res.redirect(302, dest);
  }

  // If destination is a special protocol (WiFi, vCard, mailto, tel, sms, upi)
  return res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(qr.title)} - Cloud QR</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          background: radial-gradient(circle at top, #1e1b4b 0%, #0f172a 100%);
          color: #f8fafc;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 40px;
          max-width: 520px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .icon { font-size: 52px; margin-bottom: 16px; }
        h1 { font-family: 'Outfit', sans-serif; font-size: 24px; margin: 0 0 8px; }
        .tag { color: #818cf8; font-size: 14px; margin-bottom: 20px; }
        .payload-box {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          text-align: left;
          font-family: monospace;
          font-size: 13px;
          color: #cbd5e1;
          word-break: break-all;
          white-space: pre-wrap;
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 24px;
        }
        .btn-action {
          display: inline-block;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
          padding: 14px 28px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          cursor: pointer;
          border: none;
          font-size: 15px;
          transition: all 0.2s;
        }
        .btn-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5);
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">${getIconForType(qr.type)}</div>
        <h1>${escapeHtml(qr.title)}</h1>
        <div class="tag">Type: ${qr.type.toUpperCase()}</div>
        <div class="payload-box">${escapeHtml(dest)}</div>
        <button class="btn-action" onclick="handleAction()">Open / Copy Content</button>
      </div>

      <script>
        function handleAction() {
          const payload = ${JSON.stringify(dest)};
          if (payload.startsWith('mailto:') || payload.startsWith('tel:') || payload.startsWith('sms:') || payload.startsWith('upi:')) {
            window.location.href = payload;
          } else {
            navigator.clipboard.writeText(payload).then(() => {
              alert('Copied QR payload to clipboard!');
            }).catch(() => {
              alert('Payload: ' + payload);
            });
          }
        }
      </script>
    </body>
    </html>
  `);
});

function getIconForType(type) {
  switch (type) {
    case 'wifi': return '📶';
    case 'vcard': return '👤';
    case 'email': return '✉️';
    case 'sms': return '💬';
    case 'payment': return '💳';
    default: return '⚡';
  }
}

function escapeHtml(string) {
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = router;
