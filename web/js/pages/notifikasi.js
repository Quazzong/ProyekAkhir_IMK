import { requireSession, getState, update, unreadCount } from '../store.js';
import { groupByDay, markAllRead } from '../domain/notifications.js';
import { toISODate } from '../domain/validation.js';
import { formatClock, formatDateShort } from '../domain/dates.js';
import { notifCard, mainNav, emptyState, profileMenu, bindLogout } from '../ui/components.js';

// Lambang per jenis notifikasi.
const ICONS = { submitted: 'bell', forwarded: 'bell', approved: 'bell', final: 'check-lg', revise: 'file-earmark-text', rejected: 'x-lg' };

const user = requireSession('pemohon', 'masuk.html');
if (user) init();

function init() {
  const $ = id => document.getElementById(id);
  const today = toISODate(new Date());
  bindLogout('masuk.html');

  function render() {
    const mine = getState().notifications.filter(n => n.userId === user.id);
    const unread = unreadCount(user.id);
    $('nav').innerHTML = mainNav('Notifikasi', unread, user);
    $('app').innerHTML = `<div class="row"><div class="col-lg-8 mx-auto">
      <div class="d-flex justify-content-between align-items-start mb-3">
        <div><h1 class="fs-3 fw-bold mb-0">Notifikasi</h1><div class="small text-secondary">${unread} belum dibaca</div></div>
        <div class="d-flex align-items-center">${unread ? '<button type="button" class="btn btn-link btn-sm" id="read-all">Tandai dibaca</button>' : ''}<div class="d-lg-none">${profileMenu(user)}</div></div>
      </div>` +
      (mine.length
        ? groupByDay(mine).map(g => `<div class="small fw-semibold text-secondary mb-2 mt-3">${g.day === today ? 'Hari ini' : formatDateShort(g.day)}</div>` +
          g.items.map(n => notifCard({ title: n.title, body: n.body, time: formatClock(n.at), unread: !n.read, icon: ICONS[n.kind],
            href: `pengajuan-detail.html?id=${encodeURIComponent(n.requestId)}` }).replace('<a ', `<a data-nid="${n.id}" `)).join('')).join('')
        : emptyState({ icon: 'bell', title: 'Belum ada notifikasi', body: 'Pembaruan pengajuan akan muncul di sini.' })) +
      '</div></div>';
    if ($('read-all')) $('read-all').onclick = () => { update(s => { s.notifications = markAllRead(s.notifications, user.id); }); render(); };
  }

  // ketuk → tandai dibaca lalu buka detail (href biasa).
  $('app').addEventListener('click', e => {
    const id = e.target.closest('[data-nid]')?.dataset.nid;
    if (id) update(s => { s.notifications.find(n => n.id === id).read = true; });
  });
  render();
}
