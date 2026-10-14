/**
 * Cloud QR - Integrated QR Code Scanner Module
 */

class QRScannerModule {
  constructor() {
    this.html5QrCode = null;
    this.isCameraRunning = false;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Camera toggles
    const startBtn = document.getElementById('btn-start-camera');
    const stopBtn = document.getElementById('btn-stop-camera');

    if (startBtn) {
      startBtn.addEventListener('click', () => this.startCamera());
    }
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stopCamera());
    }

    // Dropzone upload
    const dropzone = document.getElementById('scanner-dropzone');
    const fileInput = document.getElementById('scanner-file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--accent-primary)';
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'rgba(99, 102, 241, 0.4)';
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'rgba(99, 102, 241, 0.4)';
        if (e.dataTransfer.files.length > 0) {
          this.scanImageFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.scanImageFile(e.target.files[0]);
        }
      });
    }

    // Result actions
    const openBtn = document.getElementById('btn-open-scanned-url');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        const payload = document.getElementById('scan-result-payload').textContent;
        if (payload.startsWith('http://') || payload.startsWith('https://')) {
          window.open(payload, '_blank');
        } else {
          window.location.href = payload;
        }
      });
    }

    const copyBtn = document.getElementById('btn-copy-scanned-payload');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const payload = document.getElementById('scan-result-payload').textContent;
        navigator.clipboard.writeText(payload).then(() => {
          window.app.showToast('Copied decoded payload to clipboard!', 'success');
        });
      });
    }
  }

  async startCamera() {
    if (typeof Html5Qrcode === 'undefined') {
      window.app.showToast('Scanner library not loaded', 'error');
      return;
    }

    try {
      this.html5QrCode = new Html5Qrcode("camera-reader-viewport");
      const config = { fps: 10, qrbox: { width: 220, height: 220 } };

      await this.html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          this.onScanSuccess(decodedText);
          this.stopCamera();
        },
        (error) => {
          // Continuous scanning ignore
        }
      );

      this.isCameraRunning = true;
      document.getElementById('btn-start-camera').classList.add('hidden');
      document.getElementById('btn-stop-camera').classList.remove('hidden');
    } catch (err) {
      console.error(err);
      window.app.showToast('Camera permission denied or camera unavailable', 'error');
    }
  }

  async stopCamera() {
    if (this.html5QrCode && this.isCameraRunning) {
      try {
        await this.html5QrCode.stop();
        this.isCameraRunning = false;
        document.getElementById('btn-start-camera').classList.remove('hidden');
        document.getElementById('btn-stop-camera').classList.add('hidden');
      } catch (err) {
        console.error(err);
      }
    }
  }

  async scanImageFile(file) {
    if (typeof Html5Qrcode === 'undefined') {
      window.app.showToast('Scanner library unavailable', 'error');
      return;
    }

    try {
      const scanner = new Html5Qrcode("camera-reader-viewport");
      const result = await scanner.scanFile(file, true);
      this.onScanSuccess(result);
    } catch (err) {
      console.error(err);
      window.app.showToast('Could not decode QR code from the provided image', 'error');
    }
  }

  onScanSuccess(decodedText) {
    const resultBox = document.getElementById('scan-result-box');
    const typeLabel = document.getElementById('scan-result-type');
    const payloadEl = document.getElementById('scan-result-payload');
    const openBtn = document.getElementById('btn-open-scanned-url');

    resultBox.classList.remove('hidden');
    payloadEl.textContent = decodedText;

    let type = 'Text';
    if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
      type = 'URL / Web Link';
      openBtn.classList.remove('hidden');
    } else if (decodedText.startsWith('WIFI:')) {
      type = 'Wi-Fi Network Configuration';
      openBtn.classList.add('hidden');
    } else if (decodedText.includes('BEGIN:VCARD')) {
      type = 'Digital Business Card (vCard)';
      openBtn.classList.add('hidden');
    } else if (decodedText.startsWith('upi://')) {
      type = 'UPI Payment';
      openBtn.classList.remove('hidden');
    } else {
      openBtn.classList.add('hidden');
    }

    typeLabel.textContent = `Type: ${type}`;
    window.app.showToast('QR Code successfully decoded!', 'success');
  }
}

window.QRScannerModule = QRScannerModule;
