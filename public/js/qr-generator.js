/**
 * Cloud QR - Advanced QR Code Generator Engine & Studio Controller
 */

class QRStudio {
  constructor() {
    this.currentType = 'url';
    this.isDynamic = true;
    this.customLogoUrl = null;
    this.qrCodeInstance = null;
    this.state = {
      title: 'Tech Summit 2026 Portal',
      category: 'Marketing',
      shortCode: 'summit2026',
      destination: 'https://example.com/tech-summit-2026',
      dotType: 'rounded',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'dot',
      colorMode: 'gradient',
      fgColor1: '#4f46e5',
      fgColor2: '#06b6d4',
      bgColor: '#ffffff',
      logoPreset: 'link',
      frame: 'scan-me',
      frameText: 'SCAN FOR PASS',
      errorCorrection: 'H'
    };

    this.logoSVGs = {
      link: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234f46e5"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>',
      wifi: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23059669"><path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4zm0 2.22c3.96 0 7.55 1.54 10.24 4.07L12 18.55 1.76 10.29C4.45 7.76 8.04 6.22 12 6.22z"/></svg>',
      whatsapp: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2325D366"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.02 18.09c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.14.82.84-3.06-.2-.31c-.84-1.33-1.28-2.88-1.28-4.48 0-4.45 3.63-8.08 8.08-8.08 2.16 0 4.19.84 5.72 2.37 1.53 1.53 2.37 3.56 2.37 5.72 0 4.45-3.63 8.08-8.09 8.08z"/></svg>',
      payment: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>',
      star: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f59e0b"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>'
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.updatePayload();
    this.renderQR();
  }

  bindEvents() {
    // Type selector pills
    document.querySelectorAll('.type-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.type-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentType = btn.dataset.type;
        this.switchForm(this.currentType);
      });
    });

    // Dynamic mode switch
    const toggleDynamic = document.getElementById('toggle-dynamic-mode');
    toggleDynamic.addEventListener('change', (e) => {
      this.isDynamic = e.target.checked;
      const badge = document.getElementById('mode-status-badge');
      const previewTag = document.getElementById('preview-mode-tag');
      const expl = document.getElementById('mode-explanation-text');
      const shortGroup = document.getElementById('group-custom-shortcode');

      if (this.isDynamic) {
        badge.textContent = 'DYNAMIC QR CODE';
        badge.className = 'mode-badge dynamic';
        previewTag.textContent = 'Dynamic • Tracked';
        previewTag.style.color = 'var(--success)';
        expl.textContent = 'Editable destination anytime in cloud dashboard + Real-time scan statistics & location tracking.';
        shortGroup.classList.remove('hidden');
      } else {
        badge.textContent = 'STATIC QR CODE';
        badge.className = 'mode-badge static';
        previewTag.textContent = 'Static • Direct';
        previewTag.style.color = 'var(--text-muted)';
        expl.textContent = 'Hardcoded content directly in the QR pattern. Scans are not tracked in the cloud.';
        shortGroup.classList.add('hidden');
      }

      this.updatePayload();
      this.renderQR();
    });

    // Input listeners for real-time payload updates
    const inputsToWatch = [
      'input-url', 'input-wifi-ssid', 'input-wifi-encryption', 'input-wifi-pass', 'input-wifi-hidden',
      'input-vcard-name', 'input-vcard-phone', 'input-vcard-email', 'input-vcard-org',
      'input-text-content', 'input-wa-phone', 'input-wa-message',
      'input-pay-vpa', 'input-pay-name', 'input-pay-amount', 'input-pay-note',
      'input-email-to', 'input-email-subject', 'input-email-body',
      'input-campaign-title', 'input-campaign-category', 'input-custom-slug'
    ];

    inputsToWatch.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          this.updatePayload();
          this.renderQR();
        });
      }
    });

    // Dot style selector
    document.querySelectorAll('#dot-style-selector .pattern-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#dot-style-selector .pattern-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.state.dotType = card.dataset.dot;
        this.renderQR();
      });
    });

    // Corner eye selectors
    document.getElementById('select-corner-square').addEventListener('change', (e) => {
      this.state.cornerSquareType = e.target.value;
      this.renderQR();
    });
    document.getElementById('select-corner-dot').addEventListener('change', (e) => {
      this.state.cornerDotType = e.target.value;
      this.renderQR();
    });

    // Accordions
    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        item.classList.toggle('open');
      });
    });

    // Color mode & Pickers
    document.querySelectorAll('input[name="color-mode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.state.colorMode = e.target.value;
        const fg2Container = document.getElementById('picker-fg2-container');
        if (this.state.colorMode === 'solid') {
          fg2Container.classList.add('hidden');
        } else {
          fg2Container.classList.remove('hidden');
        }
        this.renderQR();
      });
    });

    const bindColor = (pickerId, textId, stateKey) => {
      const picker = document.getElementById(pickerId);
      const text = document.getElementById(textId);
      picker.addEventListener('input', (e) => {
        text.value = e.target.value;
        this.state[stateKey] = e.target.value;
        this.renderQR();
      });
      text.addEventListener('change', (e) => {
        picker.value = e.target.value;
        this.state[stateKey] = e.target.value;
        this.renderQR();
      });
    };

    bindColor('picker-fg1', 'text-fg1', 'fgColor1');
    bindColor('picker-fg2', 'text-fg2', 'fgColor2');
    bindColor('picker-bg', 'text-bg', 'bgColor');

    // Gradient Presets
    document.querySelectorAll('.grad-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const c1 = btn.dataset.c1;
        const c2 = btn.dataset.c2;
        document.getElementById('picker-fg1').value = c1;
        document.getElementById('text-fg1').value = c1;
        document.getElementById('picker-fg2').value = c2;
        document.getElementById('text-fg2').value = c2;
        this.state.fgColor1 = c1;
        this.state.fgColor2 = c2;
        this.renderQR();
      });
    });

    // Logo Presets
    document.querySelectorAll('.logo-preset-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.logo-preset-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const logoType = btn.dataset.logo;
        this.state.logoPreset = logoType;

        const uploadSec = document.getElementById('custom-logo-upload-section');
        if (logoType === 'custom') {
          uploadSec.classList.remove('hidden');
        } else {
          uploadSec.classList.add('hidden');
          this.customLogoUrl = null;
        }

        this.renderQR();
      });
    });

    // Custom Logo File Upload
    document.getElementById('input-logo-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('logo', file);

      try {
        const res = await fetch('/api/upload-logo', { method: 'POST', body: formData });
        const json = await res.json();
        if (json.success) {
          this.customLogoUrl = json.url;
          this.renderQR();
          window.app.showToast('Logo uploaded and embedded!', 'success');
        } else {
          window.app.showToast(json.error || 'Failed to upload logo', 'error');
        }
      } catch (err) {
        // Fallback to local DataURL
        const reader = new FileReader();
        reader.onload = (re) => {
          this.customLogoUrl = re.target.result;
          this.renderQR();
          window.app.showToast('Embedded logo locally!', 'success');
        };
        reader.readAsDataURL(file);
      }
    });

    // Frames & CTA
    document.querySelectorAll('.frame-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.frame-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.state.frame = chip.dataset.frame;
        this.updateFrameDisplay();
      });
    });

    document.getElementById('input-frame-text').addEventListener('input', (e) => {
      this.state.frameText = e.target.value || 'SCAN ME';
      this.updateFrameDisplay();
    });

    // Copy Short URL button
    document.getElementById('btn-copy-short-url').addEventListener('click', () => {
      const text = document.getElementById('display-short-url').textContent;
      navigator.clipboard.writeText(text).then(() => {
        window.app.showToast('Short link copied to clipboard!', 'success');
      });
    });

    // Save to Cloud Campaign
    document.getElementById('btn-save-cloud').addEventListener('click', () => {
      this.saveToCloud();
    });

    // Download PNG
    document.getElementById('btn-download-png').addEventListener('click', () => {
      this.downloadPNG();
    });

    // Download SVG
    document.getElementById('btn-download-svg').addEventListener('click', () => {
      this.downloadSVG();
    });

    // Print Sheet
    document.getElementById('btn-print-card').addEventListener('click', () => {
      this.printCard();
    });
  }

  switchForm(type) {
    document.querySelectorAll('.type-form').forEach(form => form.classList.add('hidden'));
    const target = document.getElementById(`form-${type}`);
    if (target) target.classList.remove('hidden');

    this.updatePayload();
    this.renderQR();
  }

  updatePayload() {
    let payload = '';
    const type = this.currentType;

    switch (type) {
      case 'url':
        payload = document.getElementById('input-url').value.trim() || 'https://example.com';
        break;
      case 'wifi':
        const ssid = document.getElementById('input-wifi-ssid').value.trim() || 'MyNetwork';
        const enc = document.getElementById('input-wifi-encryption').value;
        const pass = document.getElementById('input-wifi-pass').value.trim();
        const hidden = document.getElementById('input-wifi-hidden').checked;
        payload = `WIFI:T:${enc};S:${ssid};P:${pass};H:${hidden};;`;
        break;
      case 'vcard':
        const name = document.getElementById('input-vcard-name').value.trim() || 'Contact Name';
        const phone = document.getElementById('input-vcard-phone').value.trim();
        const email = document.getElementById('input-vcard-email').value.trim();
        const org = document.getElementById('input-vcard-org').value.trim();
        payload = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nORG:${org}\nEND:VCARD`;
        break;
      case 'text':
        payload = document.getElementById('input-text-content').value || 'Hello World';
        break;
      case 'whatsapp':
        const num = document.getElementById('input-wa-phone').value.trim();
        const msg = encodeURIComponent(document.getElementById('input-wa-message').value.trim());
        payload = `https://wa.me/${num}?text=${msg}`;
        break;
      case 'payment':
        const vpa = document.getElementById('input-pay-vpa').value.trim() || 'merchant@upi';
        const pname = encodeURIComponent(document.getElementById('input-pay-name').value.trim() || 'Merchant');
        const amt = document.getElementById('input-pay-amount').value.trim();
        const note = encodeURIComponent(document.getElementById('input-pay-note').value.trim() || '');
        payload = `upi://pay?pa=${vpa}&pn=${pname}${amt ? `&am=${amt}` : ''}${note ? `&tn=${note}` : ''}`;
        break;
      case 'email':
        const to = document.getElementById('input-email-to').value.trim();
        const sub = encodeURIComponent(document.getElementById('input-email-subject').value.trim());
        const body = encodeURIComponent(document.getElementById('input-email-body').value.trim());
        payload = `mailto:${to}?subject=${sub}&body=${body}`;
        break;
    }

    this.state.destination = payload;
    this.state.title = document.getElementById('input-campaign-title').value.trim() || 'Untitled QR';
    this.state.category = document.getElementById('input-campaign-category').value;
    
    let slug = document.getElementById('input-custom-slug').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!slug) slug = 'summit2026';
    this.state.shortCode = slug;

    // Update display fields
    const host = window.location.origin;
    const shortUrl = `${host}/r/${this.state.shortCode}`;
    document.getElementById('display-short-url').textContent = shortUrl;
    document.getElementById('display-target-url').textContent = payload;
  }

  updateFrameDisplay() {
    const wrapper = document.getElementById('qr-frame-wrapper');
    const headerBanner = document.getElementById('frame-header-banner');
    const bottomBadge = document.getElementById('frame-bottom-badge');
    const bottomText = document.getElementById('frame-bottom-text');
    const headerText = document.getElementById('frame-header-text');

    wrapper.className = `qr-render-canvas-container frame-${this.state.frame}`;

    if (this.state.frame === 'scan-me') {
      headerBanner.classList.add('hidden');
      bottomBadge.classList.remove('hidden');
      bottomText.textContent = this.state.frameText;
    } else if (this.state.frame === 'badge') {
      headerBanner.classList.remove('hidden');
      bottomBadge.classList.add('hidden');
      headerText.textContent = this.state.frameText;
    } else if (this.state.frame === 'modern-border') {
      headerBanner.classList.add('hidden');
      bottomBadge.classList.remove('hidden');
      bottomText.textContent = this.state.frameText;
    } else {
      headerBanner.classList.add('hidden');
      bottomBadge.classList.add('hidden');
    }
  }

  getQRDataPayload() {
    if (this.isDynamic) {
      const host = window.location.origin;
      return `${host}/r/${this.state.shortCode}`;
    }
    return this.state.destination;
  }

  renderQR() {
    const container = document.getElementById('qr-canvas-holder');
    if (!container) return;

    this.updateFrameDisplay();

    const dataPayload = this.getQRDataPayload();

    // Determine Center Logo
    let logoImage = null;
    if (this.state.logoPreset === 'custom' && this.customLogoUrl) {
      logoImage = this.customLogoUrl;
    } else if (this.logoSVGs[this.state.logoPreset]) {
      logoImage = this.logoSVGs[this.state.logoPreset];
    }

    // Configure QR Styling options
    const dotsOptions = {
      type: this.state.dotType === 'classy' ? 'classy' : this.state.dotType
    };

    if (this.state.colorMode === 'gradient') {
      dotsOptions.gradient = {
        type: 'linear',
        rotation: 45,
        colorStops: [
          { offset: 0, color: this.state.fgColor1 },
          { offset: 1, color: this.state.fgColor2 }
        ]
      };
    } else {
      dotsOptions.color = this.state.fgColor1;
    }

    const qrOptions = {
      width: 250,
      height: 250,
      type: 'canvas',
      data: dataPayload,
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: this.state.errorCorrection
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.35,
        margin: 4
      },
      dotsOptions: dotsOptions,
      backgroundOptions: {
        color: this.state.bgColor
      },
      cornersSquareOptions: {
        type: this.state.cornerSquareType,
        color: this.state.fgColor1
      },
      cornersDotOptions: {
        type: this.state.cornerDotType,
        color: this.state.fgColor1
      }
    };

    if (logoImage) {
      qrOptions.image = logoImage;
    }

    try {
      if (typeof QRCodeStyling !== 'undefined') {
        container.innerHTML = '';
        this.qrCodeInstance = new QRCodeStyling(qrOptions);
        this.qrCodeInstance.append(container);
      } else {
        // Fallback display if CDN blocked
        container.innerHTML = `<img src="/api/qrcodes/preview?data=${encodeURIComponent(dataPayload)}" alt="QR Code" style="width: 240px; height: 240px;">`;
      }
    } catch (err) {
      console.error('Error rendering QR code:', err);
    }
  }

  async saveToCloud() {
    this.updatePayload();

    const payload = {
      title: this.state.title,
      type: this.currentType,
      isDynamic: this.isDynamic,
      destinationUrl: this.state.destination,
      customShortCode: this.state.shortCode,
      category: this.state.category,
      styleConfig: {
        dotType: this.state.dotType,
        cornerSquareType: this.state.cornerSquareType,
        cornerDotType: this.state.cornerDotType,
        colorMode: this.state.colorMode,
        fgColor: this.state.fgColor1,
        fgColor2: this.state.fgColor2,
        bgColor: this.state.bgColor,
        logo: this.state.logoPreset,
        frame: this.state.frame,
        frameText: this.state.frameText,
        errorCorrectionLevel: this.state.errorCorrection
      }
    };

    try {
      const btn = document.getElementById('btn-save-cloud');
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Saving to Cloud...</span>';

      const res = await fetch('/api/qrcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      btn.disabled = false;
      btn.innerHTML = '<span>☁️ Save to Cloud Campaign</span>';

      if (data.success) {
        window.app.showToast(`Saved campaign "${data.data.title}" successfully!`, 'success');
        // Refresh manager and topbar
        if (window.qrManager) window.qrManager.loadQRCodes();
        if (window.app) window.app.refreshTopbarMetrics();
      } else {
        window.app.showToast(data.error || 'Failed to save QR code', 'error');
      }
    } catch (err) {
      console.error('Save error:', err);
      window.app.showToast('Network error while saving QR code', 'error');
      document.getElementById('btn-save-cloud').disabled = false;
      document.getElementById('btn-save-cloud').innerHTML = '<span>☁️ Save to Cloud Campaign</span>';
    }
  }

  downloadPNG() {
    const size = parseInt(document.querySelector('input[name="res-multiplier"]:checked').value) || 1000;
    if (this.qrCodeInstance) {
      this.qrCodeInstance.download({
        name: `${this.state.title.replace(/[^a-z0-9_-]/gi, '_')}-qr`,
        extension: 'png'
      });
      window.app.showToast('Downloaded High-Res PNG!', 'success');
    }
  }

  downloadSVG() {
    if (this.qrCodeInstance) {
      this.qrCodeInstance.download({
        name: `${this.state.title.replace(/[^a-z0-9_-]/gi, '_')}-qr`,
        extension: 'svg'
      });
      window.app.showToast('Downloaded Vector SVG!', 'success');
    }
  }

  printCard() {
    const canvasHolder = document.getElementById('qr-canvas-holder');
    const canvas = canvasHolder.querySelector('canvas');
    const imgData = canvas ? canvas.toDataURL('image/png') : '';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print QR Card - ${this.state.title}</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fff; }
          .card { border: 2px dashed #000; padding: 30px; text-align: center; border-radius: 16px; width: 340px; }
          h2 { margin: 0 0 8px; font-size: 20px; }
          .sub { color: #666; font-size: 13px; margin-bottom: 20px; }
          img { width: 220px; height: 220px; }
          .badge { margin-top: 16px; background: #000; color: #fff; font-weight: bold; padding: 8px 16px; border-radius: 20px; font-size: 13px; display: inline-block; }
          .url { margin-top: 12px; font-family: monospace; font-size: 11px; color: #444; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>${this.state.title}</h2>
          <div class="sub">${this.state.category} Campaign</div>
          <img src="${imgData}" />
          <div><span class="badge">${this.state.frameText}</span></div>
          <div class="url">${document.getElementById('display-short-url').textContent}</div>
        </div>
        <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
}

window.QRStudio = QRStudio;
