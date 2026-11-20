import { bindPortalTabs } from '../ui/portal.js';
import { renderDashboard } from './penyetuju-index.js';
import { renderQueue } from './penyetuju-pengajuan.js';
import { renderHistory } from './penyetuju-riwayat.js';
import { renderSettings } from './penyetuju-pengaturan.js';

if (location.pathname.endsWith('/detail.html')) await import('./penyetuju-detail.js');
bindPortalTabs('penyetuju', {
  'index.html': renderDashboard,
  'pengajuan.html': renderQueue,
  'riwayat.html': renderHistory,
  'pengaturan.html': renderSettings,
});
