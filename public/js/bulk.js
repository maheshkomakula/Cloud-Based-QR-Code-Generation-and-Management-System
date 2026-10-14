/**
 * Cloud QR - Bulk QR Code Generator Module
 */

class BulkGenerator {
  constructor() {
    this.init();
  }

  init() {
    const btn = document.getElementById('btn-run-bulk');
    if (btn) {
      btn.addEventListener('click', () => this.generateBatch());
    }
  }

  async generateBatch() {
    const rawText = document.getElementById('bulk-input-text').value.trim();
    const prefix = document.getElementById('bulk-prefix').value.trim() || 'batch';
    const isDynamic = document.getElementById('bulk-dynamic').value === 'true';
    const statusMsg = document.getElementById('bulk-status-message');
    const btn = document.getElementById('btn-run-bulk');

    if (!rawText) {
      window.app.showToast('Please enter at least one URL or item', 'error');
      return;
    }

    const lines = rawText.split('\n').filter(l => l.trim().length > 0);
    const items = [];

    lines.forEach((line, index) => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        items.push({
          title: parts[0].trim(),
          destinationUrl: parts.slice(1).join(',').trim(),
          category: 'Bulk Campaign'
        });
      } else {
        items.push({
          title: `${prefix}-${index + 1}`,
          destinationUrl: line.trim(),
          category: 'Bulk Campaign'
        });
      }
    });

    if (items.length === 0) {
      window.app.showToast('No valid items found', 'error');
      return;
    }

    try {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ Processing ${items.length} QR Codes...</span>`;
      statusMsg.textContent = 'Generating high-resolution QR codes and building ZIP...';

      const response = await fetch('/api/bulk/generate-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, prefix, isDynamic })
      });

      if (!response.ok) {
        throw new Error('Server returned an error generating batch');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${prefix}-bulk-qrcodes.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      statusMsg.textContent = `✅ Successfully created ${items.length} QR codes and downloaded ZIP archive!`;
      window.app.showToast(`Batch generated & downloaded ${items.length} QR codes!`, 'success');

      // Refresh manager
      if (window.qrManager) window.qrManager.loadQRCodes();
      if (window.app) window.app.refreshTopbarMetrics();
    } catch (err) {
      console.error(err);
      statusMsg.textContent = '❌ Error generating batch.';
      window.app.showToast('Failed to generate batch', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span>📦 Generate Batch & Download ZIP</span>`;
    }
  }
}

window.BulkGenerator = BulkGenerator;
