// Kerangka halaman portal penyetuju: sidebar + bilah atas + area konten #content.
import { requireSession, unreadCount, popFlash, update } from '../store.js';
import { STAGE_LABELS } from '../domain/request-status.js';
import { STAGE_INFO } from '../domain/approval.js';
import { markAllRead } from '../domain/notifications.js';
import { sidebar, esc, showToast, portalTable, statusChip, infoModal, bindLogout } from './components.js';
import { formatDateShort, formatRange } from '../domain/dates.js';

const ITEMS = [
  { label: 'Dasbor', icon: 'grid', href: 'index.html' },
  { label: 'Pengajuan Masuk', icon: 'file-earmark-text', href: 'pengajuan.html' },
  { label: 'Riwayat Keputusan', icon: 'clock-history', href: 'riwayat.html' },
  { label: 'Pengaturan', icon: 'gear', href: 'pengaturan.html' },
];

// crumbs: ['Dasbor'] atau ['Pengajuan Masuk', 'Detail']. roleChip: chip peran di kanan atas.
export function mountPortal({ active, crumbs, roleChip = true }) {
  const user = requireSession('penyetuju', '../masuk.html');
  if (!user) return null;
  const label = STAGE_LABELS[user.role];
  const unread = unreadCount(user.id);
  document.getElementById('app').innerHTML =
    sidebar({ role: label, level: `Tingkat ${STAGE_INFO[user.role].level} dari 3  •  Aktif`, items: ITEMS, active }) +
    `<div class="flex-grow-1 d-flex flex-column min-vh-100">
      <header class="rl-topbar d-flex align-items-center px-4 gap-4 border-bottom">
        <nav aria-label="breadcrumb" class="flex-grow-1"><ol class="breadcrumb mb-0 small">
          <li class="breadcrumb-item"><a href="index.html" class="text-secondary text-decoration-none">Portal Penyetuju</a></li>
          ${crumbs.map((c, i) => `<li class="breadcrumb-item ${i === crumbs.length - 1 ? 'active' : ''}">${esc(c)}</li>`).join('')}</ol></nav>
        <a href="pengajuan.html" class="btn position-relative p-2" id="bell" aria-label="Notifikasi${unread ? `, ${unread} belum dibaca` : ''}"><i aria-hidden="true" class="bi bi-bell fs-5"></i>${unread ? `<span class="badge text-bg-primary rounded-pill position-absolute top-0 end-0">${unread}</span>` : ''}</a>
        <div><div class="fw-semibold">${esc(user.name)}</div><div class="small text-secondary">Penyetuju ${esc(label)}</div></div>
        ${roleChip ? `<span class="badge badge-filter rounded-3 px-3 py-2">${esc(label)}</span>` : ''}
      </header>
      <main class="p-4 flex-grow-1" id="content"></main>
    </div>`;
  bindLogout('../masuk.html');
  document.body.insertAdjacentHTML('beforeend', infoModal({ id: 'm-help', title: 'Butuh bantuan?', body: [
    'Pengajuan diproses berurutan: Sarpras → Kemahasiswaan → Kabag Umum. Setujui untuk meneruskan ke tahap berikutnya.',
    'Minta Revisi atau Tolak wajib disertai catatan dan menghentikan proses pada tahap Anda. Pemohon langsung menerima notifikasi.',
    'Kendala akun atau sistem: hubungi Bagian Umum kampus.',
  ] }));
  // Bel menandai dibaca lalu membuka antrean.
  document.getElementById('bell').onclick = () => update(s => { s.notifications = markAllRead(s.notifications, user.id); });
  const flash = popFlash();
  if (flash) setTimeout(() => showToast(flash.message));
  return user;
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
