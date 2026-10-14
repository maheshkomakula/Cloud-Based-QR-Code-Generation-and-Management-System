/**
 * Cloud QR - Main Application Controller & View Router
 */

class AppController {
  constructor() {
    this.currentView = 'studio';
    this.viewTitles = {
      studio: {
        title: 'QR Studio & Customization',
        sub: 'Design dynamic, brand-customized QR codes with cloud redirection and scan tracking'
      },
      manager: {
        title: 'Cloud QR Code Manager',
        sub: 'Manage destinations, toggle campaign statuses, and track live scan counts'
      },
      analytics: {
        title: 'Real-Time Analytics & Tracking',
        sub: 'Live device parsing, geographic distributions, operating systems, and scan feeds'
      },
      bulk: {
        title: 'Bulk / Batch QR Generator',
        sub: 'Generate hundreds of QR codes from CSV or URL lists with 1-click ZIP export'
      },
      scanner: {
        title: 'QR Code Scanner & Decoder',
        sub: 'Scan physical codes using webcam or drop image files for deep payload inspection'
      },
      api: {
        title: 'Cloud REST API & Webhooks',
        sub: 'Seamless developer endpoints for dynamic short-link routing and programmatic generation'
      }
    };

    this.init();
  }

  init() {
    this.bindNavigation();
    this.initModules();
    this.refreshTopbarMetrics();
    this.updateHostDisplay();
  }

  bindNavigation() {
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.switchView(view);
      });
    });

    // Quick New QR button in top bar
    const quickNewBtn = document.getElementById('btn-quick-new-qr');
    if (quickNewBtn) {
      quickNewBtn.addEventListener('click', () => {
        this.switchView('studio');
      });
    }
  }

  switchView(viewName) {
    if (!this.viewTitles[viewName]) return;

    // Update active nav button
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update active view panel
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `view-${viewName}`);
    });

    // Update titles
    const meta = this.viewTitles[viewName];
    document.getElementById('page-title').textContent = meta.title;
    document.getElementById('page-subtitle').textContent = meta.sub;

    this.currentView = viewName;

    // Trigger view-specific refreshes
    if (viewName === 'manager' && window.qrManager) {
      window.qrManager.loadQRCodes();
    } else if (viewName === 'analytics' && window.analyticsHub) {
      window.analyticsHub.loadAnalytics();
    }
  }

  initModules() {
    // Instantiate all modules
    window.qrStudio = new window.QRStudio();
    window.qrManager = new window.QRManager();
    window.analyticsHub = new window.AnalyticsHub();
    window.bulkGenerator = new window.BulkGenerator();
    window.qrScanner = new window.QRScannerModule();
  }

  async refreshTopbarMetrics() {
    try {
      const res = await fetch('/api/analytics/overview');
      const data = await res.json();
      if (data.success) {
        document.getElementById('topbar-total-scans').textContent = data.data.totalScans.toLocaleString();
        document.getElementById('topbar-active-codes').textContent = data.data.activeQRs;
      }
    } catch (e) {
      // ignore
    }
  }

  updateHostDisplay() {
    const hostEl = document.getElementById('server-url-display');
    if (hostEl) {
      hostEl.textContent = window.location.origin;
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
