/**
 * Cloud QR - Cloud Analytics & Live Scan Tracking Module
 */

class AnalyticsHub {
  constructor() {
    this.charts = {};
    this.currentQrId = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadAnalytics();
  }

  bindEvents() {
    // Campaign dropdown filter
    const select = document.getElementById('analytics-qr-select');
    if (select) {
      select.addEventListener('change', (e) => {
        this.currentQrId = e.target.value === 'all' ? null : e.target.value;
        this.loadAnalytics();
      });
    }

    // Refresh stream button
    const refreshBtn = document.getElementById('btn-refresh-analytics');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadAnalytics();
        window.app.showToast('Analytics stream refreshed!', 'success');
      });
    }

    // Export CSV
    const exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const url = this.currentQrId 
          ? `/api/analytics/export?qrId=${this.currentQrId}`
          : '/api/analytics/export';
        window.open(url, '_blank');
        window.app.showToast('Exporting analytics CSV...', 'success');
      });
    }

    // Simulate Scan Modal
    const simModalBtn = document.getElementById('btn-open-simulate-modal');
    if (simModalBtn) {
      simModalBtn.addEventListener('click', () => {
        document.getElementById('simulate-scan-modal').classList.remove('hidden');
      });
    }

    document.getElementById('btn-close-sim-modal').addEventListener('click', () => this.closeSimModal());
    document.getElementById('btn-cancel-sim-modal').addEventListener('click', () => this.closeSimModal());
    document.getElementById('btn-trigger-simulate').addEventListener('click', () => this.triggerSimulation());
  }

  closeSimModal() {
    document.getElementById('simulate-scan-modal').classList.add('hidden');
  }

  async triggerSimulation() {
    const shortCode = document.getElementById('sim-qr-select').value;
    const device = document.getElementById('sim-device').value;
    const os = document.getElementById('sim-os').value;
    const browser = document.getElementById('sim-browser').value;
    const [city, country] = document.getElementById('sim-location').value.split(',');

    if (!shortCode) {
      window.app.showToast('Please select a QR code campaign first', 'error');
      return;
    }

    try {
      const res = await fetch('/api/analytics/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortCode, device, os, browser, city, country })
      });
      const data = await res.json();
      if (data.success) {
        this.closeSimModal();
        window.app.showToast(`Simulated scan from ${city}, ${country} recorded!`, 'success');
        this.loadAnalytics();
        if (window.qrManager) window.qrManager.loadQRCodes();
      } else {
        window.app.showToast(data.error || 'Failed to simulate scan', 'error');
      }
    } catch (err) {
      console.error(err);
      window.app.showToast('Network error triggering simulation', 'error');
    }
  }

  async loadAnalytics() {
    try {
      const url = this.currentQrId 
        ? `/api/analytics/overview?qrId=${this.currentQrId}`
        : '/api/analytics/overview';

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        this.renderKPIs(data.data);
        this.renderCharts(data.data);
        this.renderScanStream(data.data.recentScans);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }

  renderKPIs(summary) {
    document.getElementById('ana-total-scans').textContent = summary.totalScans.toLocaleString();
    document.getElementById('ana-unique-visitors').textContent = summary.uniqueVisitors.toLocaleString();

    // Mobile share %
    const mobileCount = (summary.devices['Mobile'] || 0) + (summary.devices['Tablet'] || 0);
    const total = summary.totalScans || 1;
    const mobileShare = Math.round((mobileCount / total) * 100);
    document.getElementById('ana-mobile-share').textContent = `${mobileShare}%`;

    // Top country
    let topCountry = 'None';
    let max = 0;
    for (const [c, count] of Object.entries(summary.countries)) {
      if (count > max) {
        max = count;
        topCountry = c;
      }
    }
    document.getElementById('ana-top-country').textContent = topCountry;
  }

  renderCharts(summary) {
    if (typeof Chart === 'undefined') return;

    // 1. Timeline Line Chart
    this.renderTimelineChart(summary.scansByDay);

    // 2. Devices Donut Chart
    this.renderDonutChart('chart-devices', summary.devices, ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b']);

    // 3. OS Donut Chart
    this.renderDonutChart('chart-os', summary.osBreakdown, ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#64748b']);

    // 4. Browsers Donut Chart
    this.renderDonutChart('chart-browsers', summary.browsers, ['#f59e0b', '#06b6d4', '#6366f1', '#10b981', '#ef4444']);
  }

  renderTimelineChart(scansByDay) {
    const ctx = document.getElementById('chart-timeline');
    if (!ctx) return;

    const labels = Object.keys(scansByDay).map(dateStr => {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    const values = Object.values(scansByDay);

    if (this.charts.timeline) {
      this.charts.timeline.destroy();
    }

    this.charts.timeline = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Scans',
          data: values,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#818cf8',
          pointBorderColor: '#ffffff',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#fff',
            bodyColor: '#38bdf8',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', font: { size: 11 }, precision: 0 }
          }
        }
      }
    });
  }

  renderDonutChart(canvasId, dataObj, colorPalette) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = Object.keys(dataObj);
    const data = Object.values(dataObj);

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    if (labels.length === 0) {
      labels.push('No data');
      data.push(1);
    }

    this.charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colorPalette.slice(0, labels.length),
          borderColor: '#111827',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: { size: 11 },
              boxWidth: 10,
              padding: 12
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  renderScanStream(scans) {
    const tbody = document.getElementById('scan-stream-tbody');
    if (!tbody) return;

    if (!scans || scans.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No scan events recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = scans.map(s => {
      const time = new Date(s.timestamp).toLocaleString();
      return `
        <tr>
          <td><span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-secondary);">${time}</span></td>
          <td><strong>/r/${escapeHtml(s.shortCode)}</strong></td>
          <td><span class="badge-device">${escapeHtml(s.device)} • ${escapeHtml(s.os)}</span></td>
          <td>${escapeHtml(s.browser)}</td>
          <td>📍 ${escapeHtml(s.city)}, ${escapeHtml(s.country)}</td>
          <td><code style="font-size: 11px; color: var(--text-muted);">${escapeHtml(s.ip)}</code></td>
          <td><span style="font-size: 11px; color: var(--text-secondary);">${escapeHtml(s.referrer)}</span></td>
        </tr>
      `;
    }).join('');
  }
}

window.AnalyticsHub = AnalyticsHub;
