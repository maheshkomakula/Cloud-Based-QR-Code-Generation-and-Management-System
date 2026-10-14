const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const redirectRouter = require('./routes/redirect');
const qrcodesRouter = require('./routes/qrcodes');
const analyticsRouter = require('./routes/analytics');
const bulkRouter = require('./routes/bulk');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for custom logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are permitted'));
  }
});

// Logo upload endpoint
app.post('/api/upload-logo', upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// Mount Routes
app.use('/r', redirectRouter);
app.use('/api/qrcodes', qrcodesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/bulk', bulkRouter);

// System info endpoint
app.get('/api/system', (req, res) => {
  res.json({
    status: 'online',
    appName: 'Cloud Based QR Code Generation & Management System',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback to index.html for SPA client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start Server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Cloud QR System is running at http://localhost:${PORT}`);
    console.log(`📡 Dynamic Redirect Engine active on /r/:shortCode`);
    console.log(`📊 Cloud Analytics Hub online`);
    console.log(`====================================================`);
  });
}

module.exports = app;
