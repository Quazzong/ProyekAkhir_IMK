import { bindPortalTabs } from '../ui/portal.js';
import { renderSchedule } from './keamanan-index.js';
import { renderSettings } from './keamanan-pengaturan.js';

if (location.pathname.endsWith('/detail.html')) await import('./keamanan-detail.js');
bindPortalTabs('keamanan', {
  'index.html': renderSchedule,
  'pengaturan.html': renderSettings,
});
