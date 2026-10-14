const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data for demonstration
const initialData = {
  qrcodes: [
    {
      id: "qr-demo-1",
      shortCode: "summit2026",
      title: "Tech Summit 2026 Portal",
      type: "url", // url, text, wifi, vcard, email, sms, payment
      isDynamic: true,
      destinationUrl: "https://example.com/tech-summit-2026",
      status: "active", // active, paused
      category: "Marketing",
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      scansCount: 42,
      styleConfig: {
        dotType: "rounded",
        cornerSquareType: "extra-rounded",
        cornerDotType: "dot",
        fgColor: "#4f46e5",
        fgColor2: "#06b6d4",
        gradientType: "linear",
        gradientDirection: "45deg",
        bgColor: "#ffffff",
        logo: "link",
        frame: "scan-me",
        frameText: "SCAN FOR PASS",
        errorCorrectionLevel: "H"
      }
    },
    {
      id: "qr-demo-2",
      shortCode: "cafe-wifi",
      title: "Artisan Cafe Guest Wi-Fi",
      type: "wifi",
      isDynamic: true,
      destinationUrl: "WIFI:T:WPA;S:Artisan_Guest;P:CoffeeBeans2026;H:false;;",
      status: "active",
      category: "Operations",
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      scansCount: 128,
      styleConfig: {
        dotType: "dots",
        cornerSquareType: "extra-rounded",
        cornerDotType: "dot",
        fgColor: "#059669",
        fgColor2: "#10b981",
        gradientType: "none",
        bgColor: "#ffffff",
        logo: "wifi",
        frame: "badge",
        frameText: "CONNECT WI-FI",
        errorCorrectionLevel: "H"
      }
    },
    {
      id: "qr-demo-3",
      shortCode: "menu-summer",
      title: "Summer Cocktail Menu",
      type: "url",
      isDynamic: true,
      destinationUrl: "https://example.com/menus/summer-cocktails",
      status: "active",
      category: "Dining",
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      scansCount: 89,
      styleConfig: {
        dotType: "classy",
        cornerSquareType: "square",
        cornerDotType: "square",
        fgColor: "#dc2626",
        fgColor2: "#f97316",
        gradientType: "linear",
        gradientDirection: "90deg",
        bgColor: "#ffffff",
        logo: "custom",
        frame: "modern-border",
        frameText: "VIEW MENU",
        errorCorrectionLevel: "M"
      }
    },
    {
      id: "qr-demo-4",
      shortCode: "contact-alex",
      title: "CEO Digital Business Card",
      type: "vcard",
      isDynamic: true,
      destinationUrl: "https://example.com/cards/alex-morgan",
      status: "paused",
      category: "Executive",
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      scansCount: 31,
      styleConfig: {
        dotType: "square",
        cornerSquareType: "square",
        cornerDotType: "square",
        fgColor: "#1e293b",
        bgColor: "#ffffff",
        logo: "vcard",
        frame: "none",
        frameText: "SCAN ME",
        errorCorrectionLevel: "Q"
      }
    }
  ],
  scans: []
};

// Generate realistic historical scan events for the seeded QR codes
(function seedHistoricalScans() {
  const devices = ["Mobile", "Mobile", "Mobile", "Desktop", "Tablet"];
  const osList = ["Android", "iOS", "iOS", "Windows", "macOS"];
  const browsers = ["Chrome", "Safari", "Mobile Safari", "Chrome Mobile", "Edge"];
  const cities = [
    { city: "San Francisco", country: "United States", code: "US" },
    { city: "New York", country: "United States", code: "US" },
    { city: "London", country: "United Kingdom", code: "GB" },
    { city: "Mumbai", country: "India", code: "IN" },
    { city: "Bengaluru", country: "India", code: "IN" },
    { city: "Berlin", country: "Germany", code: "DE" },
    { city: "Tokyo", country: "Japan", code: "JP" },
    { city: "Sydney", country: "Australia", code: "AU" }
  ];

  initialData.qrcodes.forEach(qr => {
    const total = qr.scansCount;
    for (let i = 0; i < total; i++) {
      const daysAgo = Math.floor(Math.random() * 14);
      const hoursAgo = Math.floor(Math.random() * 24);
      const scanDate = new Date(Date.now() - (daysAgo * 86400000 + hoursAgo * 3600000));
      const loc = cities[Math.floor(Math.random() * cities.length)];
      const dev = devices[Math.floor(Math.random() * devices.length)];
      const os = osList[Math.floor(Math.random() * osList.length)];
      const br = browsers[Math.floor(Math.random() * browsers.length)];

      initialData.scans.push({
        id: "scan-" + Math.random().toString(36).substring(2, 9),
        qrId: qr.id,
        shortCode: qr.shortCode,
        timestamp: scanDate.toISOString(),
        ip: `192.168.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`,
        device: dev,
        os: os,
        browser: br,
        city: loc.city,
        country: loc.country,
        countryCode: loc.code,
        referrer: Math.random() > 0.4 ? "Direct Scan" : "Camera App"
      });
    }
  });
})();

class Database {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.data = initialData;
      this.save();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        if (!this.data.qrcodes) this.data.qrcodes = [];
        if (!this.data.scans) this.data.scans = [];
      } catch (err) {
        console.error("Error reading database file, resetting to defaults:", err);
        this.data = initialData;
        this.save();
      }
    }
  }

  save() {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error("Database save error:", err);
    }
  }

  // QR Code operations
  getAllQRCodes() {
    return this.data.qrcodes;
  }

  getQRCodeById(id) {
    return this.data.qrcodes.find(q => q.id === id);
  }

  getQRCodeByShortCode(shortCode) {
    if (!shortCode) return null;
    return this.data.qrcodes.find(q => q.shortCode.toLowerCase() === shortCode.toLowerCase());
  }

  createQRCode(item) {
    const newQR = {
      id: item.id || `qr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      shortCode: item.shortCode || Math.random().toString(36).substring(2, 8),
      title: item.title || "Untitled QR Code",
      type: item.type || "url",
      isDynamic: item.isDynamic !== undefined ? item.isDynamic : true,
      destinationUrl: item.destinationUrl || "https://example.com",
      status: item.status || "active",
      category: item.category || "General",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scansCount: 0,
      styleConfig: item.styleConfig || {
        dotType: "square",
        cornerSquareType: "square",
        cornerDotType: "square",
        fgColor: "#000000",
        bgColor: "#ffffff",
        logo: "none",
        frame: "none",
        frameText: "SCAN ME",
        errorCorrectionLevel: "M"
      }
    };

    this.data.qrcodes.unshift(newQR);
    this.save();
    return newQR;
  }

  updateQRCode(id, updates) {
    const index = this.data.qrcodes.findIndex(q => q.id === id);
    if (index === -1) return null;

    const qr = this.data.qrcodes[index];
    const updated = {
      ...qr,
      ...updates,
      id: qr.id, // prevent id overwrite
      shortCode: updates.shortCode ? updates.shortCode.trim().toLowerCase() : qr.shortCode,
      updatedAt: new Date().toISOString()
    };

    this.data.qrcodes[index] = updated;
    this.save();
    return updated;
  }

  deleteQRCode(id) {
    const initialLen = this.data.qrcodes.length;
    this.data.qrcodes = this.data.qrcodes.filter(q => q.id !== id);
    // Also remove associated scans
    this.data.scans = this.data.scans.filter(s => s.qrId !== id);
    this.save();
    return this.data.qrcodes.length < initialLen;
  }

  incrementScan(shortCode, scanMeta = {}) {
    const qr = this.getQRCodeByShortCode(shortCode);
    if (!qr) return null;

    qr.scansCount = (qr.scansCount || 0) + 1;

    const scanRecord = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      qrId: qr.id,
      shortCode: qr.shortCode,
      timestamp: new Date().toISOString(),
      ip: scanMeta.ip || "127.0.0.1",
      device: scanMeta.device || "Unknown",
      os: scanMeta.os || "Unknown",
      browser: scanMeta.browser || "Unknown",
      city: scanMeta.city || "Local",
      country: scanMeta.country || "Local Network",
      countryCode: scanMeta.countryCode || "LOC",
      referrer: scanMeta.referrer || "Direct Scan"
    };

    this.data.scans.unshift(scanRecord);

    // Keep scan log limited to recent 5000 scans for speed
    if (this.data.scans.length > 5000) {
      this.data.scans = this.data.scans.slice(0, 5000);
    }

    this.save();
    return { qr, scanRecord };
  }

  // Analytics queries
  getScans(filter = {}) {
    let results = [...this.data.scans];
    if (filter.qrId) {
      results = results.filter(s => s.qrId === filter.qrId);
    }
    if (filter.shortCode) {
      results = results.filter(s => s.shortCode.toLowerCase() === filter.shortCode.toLowerCase());
    }
    return results;
  }

  getAnalyticsSummary(qrId = null) {
    const scans = qrId ? this.data.scans.filter(s => s.qrId === qrId) : this.data.scans;
    const qrcodes = qrId ? this.data.qrcodes.filter(q => q.id === qrId) : this.data.qrcodes;

    const totalScans = scans.length;
    const activeQRs = qrcodes.filter(q => q.status === "active").length;

    // Unique IPs
    const uniqueIPs = new Set(scans.map(s => s.ip)).size;

    // Device breakdown
    const devices = {};
    scans.forEach(s => {
      const dev = s.device || "Other";
      devices[dev] = (devices[dev] || 0) + 1;
    });

    // OS breakdown
    const osBreakdown = {};
    scans.forEach(s => {
      const os = s.os || "Other";
      osBreakdown[os] = (osBreakdown[os] || 0) + 1;
    });

    // Browser breakdown
    const browsers = {};
    scans.forEach(s => {
      const br = s.browser || "Other";
      browsers[br] = (browsers[br] || 0) + 1;
    });

    // Country breakdown
    const countries = {};
    scans.forEach(s => {
      const c = s.country || "Unknown";
      countries[c] = (countries[c] || 0) + 1;
    });

    // Scans by day (last 14 days)
    const scansByDay = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      scansByDay[key] = 0;
    }

    scans.forEach(s => {
      const day = s.timestamp.split('T')[0];
      if (scansByDay[day] !== undefined) {
        scansByDay[day]++;
      }
    });

    return {
      totalScans,
      totalQRCodes: qrcodes.length,
      activeQRs,
      uniqueVisitors: uniqueIPs,
      devices,
      osBreakdown,
      browsers,
      countries,
      scansByDay,
      recentScans: scans.slice(0, 50)
    };
  }
}

module.exports = new Database();
