const UAParser = require('ua-parser-js');

// Geo IP helper simulation for private / development IPs
const sampleLocations = [
  { city: "San Francisco", country: "United States", code: "US" },
  { city: "London", country: "United Kingdom", code: "GB" },
  { city: "New York", country: "United States", code: "US" },
  { city: "Mumbai", country: "India", code: "IN" },
  { city: "Bengaluru", country: "India", code: "IN" },
  { city: "Tokyo", country: "Japan", code: "JP" },
  { city: "Berlin", country: "Germany", code: "DE" },
  { city: "Singapore", country: "Singapore", code: "SG" }
];

function parseClient(req) {
  const uaString = req.headers['user-agent'] || '';
  const parser = new UAParser(uaString);
  const result = parser.getResult();

  // Determine device type
  let deviceType = 'Desktop';
  if (result.device.type === 'mobile') {
    deviceType = 'Mobile';
  } else if (result.device.type === 'tablet') {
    deviceType = 'Tablet';
  } else if (/Mobi|Android|iPhone/i.test(uaString)) {
    deviceType = 'Mobile';
  } else if (/iPad|Tablet/i.test(uaString)) {
    deviceType = 'Tablet';
  }

  // Determine OS
  let osName = result.os.name || 'Unknown OS';
  if (/Windows/i.test(uaString)) osName = 'Windows';
  else if (/iPhone|iPad|iOS/i.test(uaString)) osName = 'iOS';
  else if (/Android/i.test(uaString)) osName = 'Android';
  else if (/Macintosh|Mac OS/i.test(uaString)) osName = 'macOS';
  else if (/Linux/i.test(uaString)) osName = 'Linux';

  // Determine Browser
  let browserName = result.browser.name || 'Unknown Browser';
  if (/Chrome/i.test(uaString) && !/Edg/i.test(uaString)) browserName = 'Chrome';
  else if (/Safari/i.test(uaString) && !/Chrome/i.test(uaString)) browserName = 'Safari';
  else if (/Edg/i.test(uaString)) browserName = 'Edge';
  else if (/Firefox/i.test(uaString)) browserName = 'Firefox';

  // IP Address extraction
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  // Geo lookup or simulated fallback for local IPs
  let loc = { city: "Local Dev", country: "Local Network", code: "LOC" };
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    // Pick an appropriate representative location or local dev
    loc = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
  }

  return {
    ip,
    device: deviceType,
    os: osName,
    browser: browserName,
    city: loc.city,
    country: loc.country,
    countryCode: loc.code,
    referrer: req.headers['referer'] || 'Direct Scan'
  };
}

module.exports = { parseClient };
