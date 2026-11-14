import { requireSession, getState, unreadCount, popFlash } from '../store.js';
import { isHistory } from '../domain/request-status.js';
import { formatDateShort, formatRange } from '../domain/dates.js';
import { requestCard, tabs, mainNav, emptyState, showToast, esc } from '../ui/components.js';

const user = requireSession('pemohon', 'masuk.html');
if (user) init();

function init() {
  const $ = id => document.getElementById(id);
  const all = getState().requests.filter(r => r.userId === user.id);
  const rooms = getState().rooms;
  const STATUS = { Aktif: ['Menunggu', 'Perlu Revisi'], Riwayat: ['Disetujui', 'Ditolak', 'Dibatalkan'] };
  const flash = popFlash();
  let tab = flash?.tab || 'Aktif';
  let query = '', status = '';

  $('nav').innerHTML = mainNav('Pengajuan Saya', unreadCount(user.id));
  $('app').innerHTML = `
    <h1 class="fs-3 fw-bold mb-1">Pengajuan Saya</h1>
    <p class="small text-secondary mb-3">Pantau kegiatan dan status persetujuan.</p>
    <div id="tabs"></div>
    <div class="position-relative mb-3"><i class="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-secondary"></i>
      <input id="q" class="form-control ps-5" placeholder="Cari nama kegiatan atau ID" aria-label="Cari nama kegiatan atau ID"></div>
    <select id="status" class="form-select form-select-sm w-auto border-0 bg-transparent text-primary fw-semibold ps-0 mb-2" aria-label="Filter status"></select>
    <div id="list" class="rl-fab-space"></div>
    <a href="index.html" class="btn btn-primary rl-fab" aria-label="Buat pengajuan baru"><i class="bi bi-plus-lg fs-5"></i></a>`;

  function render() {
    $('tabs').innerHTML = tabs(['Aktif', 'Riwayat'], tab);
    $('status').innerHTML = ['<option value="">Semua status</option>', ...STATUS[tab].map(s => `<option ${s === status ? 'selected' : ''}>${esc(s)}</option>`)].join('');
    const q = query.trim().toLowerCase();
    const rows = all
      .filter(r => isHistory(r.status) === (tab === 'Riwayat') && (!status || r.status === status) &&
        (!q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    $('list').innerHTML = rows.length
      ? rows.map(r => requestCard({ id: r.id, room: rooms.find(x => x.id === r.roomId).name, status: r.status, title: r.name,
        dateTime: `${formatDateShort(r.date)} · ${formatRange(r.start, r.end)} WIB`, href: `pengajuan-detail.html?id=${encodeURIComponent(r.id)}` })).join('')
      : emptyState({ icon: 'inbox', title: 'Belum ada pengajuan', body: q || status ? 'Tidak ada pengajuan yang cocok.' : `Belum ada pengajuan di ${tab}.` });
  }

  $('tabs').onclick = e => {
    const t = e.target.closest('[data-tab]');
    if (!t) return;
    e.preventDefault();
    tab = t.dataset.tab; status = ''; render();
  };
  $('q').oninput = () => { query = $('q').value; render(); };
  $('status').onchange = () => { status = $('status').value; render(); };

  render();
  if (flash?.message) showToast(flash.message);
}
