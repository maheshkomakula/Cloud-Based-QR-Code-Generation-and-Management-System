/**
 * Cloud QR - Cloud QR Codes Manager Module
 */

class QRManager {
  constructor() {
    this.qrcodes = [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadQRCodes();
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('mgr-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterAndRender());
    }

    // Filter status
    const statusSelect = document.getElementById('mgr-filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', () => this.filterAndRender());
    }

    // Filter category
    const catSelect = document.getElementById('mgr-filter-category');
    if (catSelect) {
      catSelect.addEventListener('change', () => this.filterAndRender());
    }

    // Create New button in manager
    const createBtn = document.getElementById('btn-mgr-create-new');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        window.app.switchView('studio');
      });
    }

    // Edit Modal events
    document.getElementById('btn-close-edit-modal').addEventListener('click', () => this.closeEditModal());
    document.getElementById('btn-cancel-edit-modal').addEventListener('click', () => this.closeEditModal());
    document.getElementById('btn-save-edit-modal').addEventListener('click', () => this.saveEditModal());
  }

  async loadQRCodes() {
    try {
      const res = await fetch('/api/qrcodes');
      const data = await res.json();
      if (data.success) {
        this.qrcodes = data.data;
        this.updateKPIs();
        this.filterAndRender();
        this.populateAnalyticsDropdown();
      }
    } catch (err) {
      console.error('Failed to load QR codes:', err);
    }
  }

  updateKPIs() {
    const total = this.qrcodes.length;
    const active = this.qrcodes.filter(q => q.status === 'active').length;
    const paused = this.qrcodes.filter(q => q.status === 'paused').length;
    const scans = this.qrcodes.reduce((sum, q) => sum + (q.scansCount || 0), 0);

    document.getElementById('kpi-mgr-total').textContent = total;
    document.getElementById('kpi-mgr-active').textContent = active;
    document.getElementById('kpi-mgr-paused').textContent = paused;
    document.getElementById('kpi-mgr-scans').textContent = scans.toLocaleString();
    document.getElementById('badge-total-qrs').textContent = total;

    // Topbar update
    document.getElementById('topbar-total-scans').textContent = scans.toLocaleString();
    document.getElementById('topbar-active-codes').textContent = active;
  }

  populateAnalyticsDropdown() {
    const select = document.getElementById('analytics-qr-select');
    const simSelect = document.getElementById('sim-qr-select');
    if (!select || !simSelect) return;

    // Preserve first option
    select.innerHTML = '<option value="all">🌐 All Campaigns Combined</option>';
    simSelect.innerHTML = '';

    this.qrcodes.forEach(qr => {
      const opt = document.createElement('option');
      opt.value = qr.id;
      opt.textContent = `${qr.title} (/r/${qr.shortCode})`;
      select.appendChild(opt);

      const simOpt = document.createElement('option');
      simOpt.value = qr.shortCode;
      simOpt.textContent = `${qr.title} (${qr.shortCode})`;
      simSelect.appendChild(simOpt);
    });
  }

  filterAndRender() {
    const searchTerm = (document.getElementById('mgr-search-input').value || '').toLowerCase();
    const statusFilter = document.getElementById('mgr-filter-status').value;
    const catFilter = document.getElementById('mgr-filter-category').value;

    let filtered = this.qrcodes.filter(qr => {
      const matchSearch = qr.title.toLowerCase().includes(searchTerm) ||
        (qr.shortCode && qr.shortCode.toLowerCase().includes(searchTerm)) ||
        qr.destinationUrl.toLowerCase().includes(searchTerm) ||
        (qr.category && qr.category.toLowerCase().includes(searchTerm));

      const matchStatus = statusFilter === 'all' || qr.status === statusFilter;
      const matchCat = catFilter === 'all' || qr.category === catFilter;

      return matchSearch && matchStatus && matchCat;
    });

    this.renderCards(filtered);
  }

  renderCards(items) {
    const container = document.getElementById('mgr-cards-container');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-light);">
          <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
          <h3 style="margin-bottom: 6px;">No QR Codes Found</h3>
          <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 20px;">Try adjusting your search query or filters.</p>
          <button class="btn btn-primary" onclick="window.app.switchView('studio')">+ Create New QR Code</button>
        </div>
      `;
      return;
    }

    const host = window.location.origin;

    container.innerHTML = items.map(qr => {
      const isDynamic = qr.isDynamic;
      const shortUrl = `${host}/r/${qr.shortCode}`;
      const statusClass = qr.status === 'active' ? 'active' : 'paused';
      const statusText = qr.status === 'active' ? '● Active' : '⏸ Paused';

      // Generate preview thumbnail using server render endpoint
      const thumbUrl = `/api/qrcodes/${qr.id}/render?format=svg`;

      return `
        <div class="qr-card" data-id="${qr.id}">
          <div class="qr-card-header">
            <div>
              <h3 class="qr-card-title">${escapeHtml(qr.title)}</h3>
              <span class="qr-card-category">${escapeHtml(qr.category || 'General')}</span>
            </div>
            <span class="status-badge ${statusClass}" id="badge-status-${qr.id}">${statusText}</span>
          </div>

          <div class="qr-card-body">
            <div class="qr-card-thumb">
              <img src="${thumbUrl}" alt="QR" loading="lazy">
            </div>
            <div class="qr-card-meta">
              ${isDynamic ? `
                <span style="font-size: 11px; color: var(--accent-secondary); font-weight: 600;">CLOUD SHORT LINK:</span>
                <a href="${shortUrl}" target="_blank" class="meta-link">${shortUrl}</a>
              ` : `
                <span style="font-size: 11px; color: var(--text-muted);">STATIC DIRECT CODE</span>
              `}
              <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">DESTINATION:</span>
              <span class="meta-dest" title="${escapeHtml(qr.destinationUrl)}">${escapeHtml(qr.destinationUrl)}</span>
              
              <div class="meta-scans-pill">
                <span>🔥 ${qr.scansCount || 0} Scans</span>
              </div>
            </div>
          </div>

          <div class="qr-card-actions">
            <button class="btn-card-action" onclick="window.qrManager.openEditModal('${qr.id}')" title="Edit Destination URL">
              ✏️ Edit URL
            </button>
            <button class="btn-card-action" onclick="window.qrManager.toggleStatus('${qr.id}')" title="Toggle Active / Paused">
              ${qr.status === 'active' ? '⏸ Pause' : '▶ Activate'}
            </button>
            ${isDynamic ? `
              <button class="btn-card-action test" onclick="window.qrManager.testScan('${qr.shortCode}')" title="Test scan redirect & track count">
                🚀 Test Scan
              </button>
            ` : ''}
            <button class="btn-card-action" onclick="window.qrManager.downloadQR('${qr.id}', '${escapeHtml(qr.title)}')" title="Download PNG">
              📥
            </button>
            <button class="btn-card-action danger" onclick="window.qrManager.deleteQR('${qr.id}')" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  async toggleStatus(id) {
    const qr = this.qrcodes.find(q => q.id === id);
    if (!qr) return;

    const newStatus = qr.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/qrcodes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        qr.status = newStatus;
        this.updateKPIs();
        this.filterAndRender();
        window.app.showToast(`Campaign status updated to ${newStatus}!`, 'success');
      }
    } catch (err) {
      console.error(err);
      window.app.showToast('Failed to update status', 'error');
    }
  }

  testScan(shortCode) {
    const url = `/r/${shortCode}`;
    window.open(url, '_blank');
    window.app.showToast('Redirect triggered! Refreshing analytics in 1s...', 'success');
    setTimeout(() => {
      this.loadQRCodes();
      if (window.analyticsHub) window.analyticsHub.loadAnalytics();
    }, 1200);
  }

  downloadQR(id, title) {
    const url = `/api/qrcodes/${id}/render?format=png&width=1200`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9_-]/gi, '_')}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.app.showToast('Downloaded High-Res QR code!', 'success');
  }

  openEditModal(id) {
    const qr = this.qrcodes.find(q => q.id === id);
    if (!qr) return;

    document.getElementById('edit-qr-id').value = qr.id;
    document.getElementById('edit-qr-title').value = qr.title;
    document.getElementById('edit-qr-destination').value = qr.destinationUrl;
    document.getElementById('edit-qr-status').value = qr.status;

    document.getElementById('edit-destination-modal').classList.remove('hidden');
  }

  closeEditModal() {
    document.getElementById('edit-destination-modal').classList.add('hidden');
  }

  async saveEditModal() {
    const id = document.getElementById('edit-qr-id').value;
    const title = document.getElementById('edit-qr-title').value.trim();
    const destinationUrl = document.getElementById('edit-qr-destination').value.trim();
    const status = document.getElementById('edit-qr-status').value;

    if (!destinationUrl) {
      window.app.showToast('Destination URL is required', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/qrcodes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, destinationUrl, status })
      });
      const data = await res.json();
      if (data.success) {
        this.closeEditModal();
        this.loadQRCodes();
        window.app.showToast('Dynamic destination updated in real time!', 'success');
      } else {
        window.app.showToast(data.error || 'Failed to update', 'error');
      }
    } catch (err) {
      console.error(err);
      window.app.showToast('Network error updating destination', 'error');
    }
  }

  async deleteQR(id) {
    if (!confirm('Are you sure you want to delete this cloud QR code and its tracking data?')) {
      return;
    }

    try {
      const res = await fetch(`/api/qrcodes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        window.app.showToast('QR Code deleted successfully', 'success');
        this.loadQRCodes();
        if (window.analyticsHub) window.analyticsHub.loadAnalytics();
      }
    } catch (err) {
      console.error(err);
      window.app.showToast('Failed to delete QR code', 'error');
    }
  }
}

function escapeHtml(string) {
  return String(string || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.QRManager = QRManager;
