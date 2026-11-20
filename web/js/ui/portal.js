// Kerangka halaman portal (penyetuju & keamanan): sidebar + bilah atas + area konten #content.
import { currentUser, requireSession, unreadCount, popFlash, update } from '../store.js';
import { STAGE_LABELS } from '../domain/request-status.js';
import { markAllRead } from '../domain/notifications.js';
import { sidebar, esc, showToast, portalTable, statusChip, infoModal, bindLogout } from './components.js';
import { formatDateShort, formatRange } from '../domain/dates.js';

const ITEMS = [
  { label: 'Dasbor', icon: 'grid', href: 'index.html' },
  { label: 'Pengajuan Masuk', icon: 'file-earmark-text', href: 'pengajuan.html' },
  { label: 'Riwayat Keputusan', icon: 'clock-history', href: 'riwayat.html' },
  { label: 'Pengaturan', icon: 'gear', href: 'pengaturan.html' },
];

// Per jenis portal: menu, judul, label peran, teks bantuan, tujuan bel.
const KINDS = {
  penyetuju: {
    title: 'Portal Penyetuju', items: ITEMS, bell: 'pengajuan.html',
    role: u => STAGE_LABELS[u.role], level: () => '', sub: u => `Penyetuju ${STAGE_LABELS[u.role]}`,
    help: [
      'Pengajuan diproses berurutan: Sarpras → Kemahasiswaan → Kabag Umum. Setujui untuk meneruskan ke tahap berikutnya.',
      'Minta Revisi atau Tolak wajib disertai catatan dan menghentikan proses pada tahap Anda. Pemohon langsung menerima notifikasi.',
      'Kendala akun atau sistem: hubungi Bagian Umum kampus.',
    ],
  },
  keamanan: {
    title: 'Portal Keamanan', bell: 'index.html',
    items: [
      { label: 'Jadwal Pemakaian', icon: 'calendar-check', href: 'index.html' },
      { label: 'Pengaturan', icon: 'gear', href: 'pengaturan.html' },
    ],
    role: () => 'Keamanan Gedung', level: () => 'Pemeriksaan pemakaian ruangan', sub: () => 'Petugas Keamanan',
    help: [
      'Jadwal Pemakaian berisi peminjaman yang sudah disetujui Kabag Umum. Pilih tanggal untuk melihat pemakaian hari itu.',
      'Saat kegiatan berlangsung, cocokkan data peminjaman dengan pengguna di lokasi, lalu tandai Sesuai atau Tidak Sesuai. Tidak Sesuai wajib disertai catatan.',
      'Kendala akun atau sistem: hubungi Bagian Umum kampus.',
    ],
  },
};

// crumbs: ['Dasbor'] atau ['Pengajuan Masuk', 'Detail']. roleChip: chip peran di kanan atas. kind: 'penyetuju' | 'keamanan'.
export function mountPortal({ active, crumbs, roleChip = true, kind = 'penyetuju' }) {
  const user = requireSession(kind, '../masuk.html');
  if (!user) return null;
  const k = KINDS[kind];
  const label = k.role(user);
  const unread = unreadCount(user.id);
  const app = document.getElementById('app');
  const aside = app.querySelector('aside');
  if (aside) {
    for (const link of aside.querySelectorAll('a')) {
      const selected = link.textContent.trim() === active;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    aside.nextElementSibling.remove();
  } else {
    app.innerHTML = sidebar({ title: k.title, role: label, level: k.level(user), items: k.items, active });
    bindLogout('../masuk.html');
    document.body.insertAdjacentHTML('beforeend', infoModal({ id: 'm-help', title: 'Butuh bantuan?', body: k.help }));
  }
  app.insertAdjacentHTML('beforeend', `<div class="flex-grow-1 d-flex flex-column min-vh-100">
      <header class="rl-topbar d-flex align-items-center px-4 gap-4 border-bottom">
        <nav aria-label="breadcrumb" class="flex-grow-1"><ol class="breadcrumb mb-0 small">
          <li class="breadcrumb-item"><a href="index.html" class="text-secondary text-decoration-none">${esc(k.title)}</a></li>
          ${crumbs.map((c, i) => `<li class="breadcrumb-item ${i === crumbs.length - 1 ? 'active' : ''}">${esc(c)}</li>`).join('')}</ol></nav>
        <a href="${k.bell}" class="btn position-relative p-2" id="bell" aria-label="Notifikasi${unread ? `, ${unread} belum dibaca` : ''}"><i aria-hidden="true" class="bi bi-bell fs-5"></i>${unread ? `<span class="badge text-bg-primary rounded-pill position-absolute top-0 end-0">${unread}</span>` : ''}</a>
        <div><div class="fw-semibold">${esc(user.name)}</div><div class="small text-secondary">${esc(k.sub(user))}</div></div>
        ${roleChip ? `<span class="badge badge-filter rounded-3 px-3 py-2">${esc(label)}</span>` : ''}
      </header>
      <main class="p-4 flex-grow-1" id="content"></main>
    </div>`);
  // Bel menandai dibaca lalu membuka antrean / jadwal.
  document.getElementById('bell').onclick = () => update(s => { s.notifications = markAllRead(s.notifications, user.id); });
  const flash = popFlash();
  if (flash) setTimeout(() => showToast(flash.message));
  return user;
}

// Hanya tab sidebar yang berbagi dokumen. Detail tetap memakai navigasi biasa dan referrer.
export function bindPortalTabs(kind, views) {
  const items = KINDS[kind].items;
  const currentFile = () => location.pathname.split('/').pop() || 'index.html';
  const session = requireSession(kind, '../masuk.html');
  if (!session) return;

  function render() {
    const file = currentFile();
    const item = items.find(i => i.href === file);
    if (!item || document.querySelector('.modal.show') || currentUser()?.id !== session.id) {
      location.reload();
      return;
    }
    const user = mountPortal({ kind, active: item.label, crumbs: [item.label], roleChip: kind !== 'keamanan' });
    if (!user) return;
    document.getElementById('modal-box').replaceChildren();
    document.title = item.label + ' — RoomLink';
    views[file](user);
  }

  if (views[currentFile()]) render();
  document.querySelector('.rl-sidebar')?.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (link.href !== location.href) history.pushState(null, '', link.href);
    render();
    window.scrollTo(0, 0);
  });
  window.addEventListener('popstate', render);
}

// Tabel antrean. offset: nomor awal (paginasi). Status = status tahap milik peran.
export function queueTable(rows, { rooms, users, stage, offset = 0 }) {
  const cols = ['No.', 'Nama Pemohon', 'Ruangan', 'Jenis Kegiatan', 'Tanggal', 'Jam', 'Status', 'Aksi'];
  return portalTable(cols, rows.map((r, i) => {
    const u = users.find(x => x.id === r.userId);
    return [
      String(offset + i + 1).padStart(2, '0'),
      `<div class="fw-semibold text-body">${esc(u.name)}</div><div class="text-secondary">${esc([u.position, u.unit].filter(Boolean).join(' · '))}</div>`,
      esc(rooms.find(x => x.id === r.roomId).name), esc(r.kind), formatDateShort(r.date), formatRange(r.start, r.end),
      statusChip(r.stages[stage]),
      `<a class="btn btn-soft btn-sm" href="detail.html?id=${encodeURIComponent(r.id)}">Lihat Detail <i aria-hidden="true" class="bi bi-arrow-right"></i></a>`,
    ];
  }));
}
