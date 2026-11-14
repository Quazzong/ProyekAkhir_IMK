import { getState } from '../store.js';
import { mountPortal, queueTable } from '../ui/portal.js';
import { STAGE_LABELS } from '../domain/request-status.js';
import { statsFor, pendingFor } from '../domain/approval.js';
import { toISODate } from '../domain/validation.js';
import { formatDateWithDay, monthLabel, nowLocal, formatClock } from '../domain/dates.js';
import { esc } from '../ui/components.js';

const user = mountPortal({ active: 'Dasbor', crumbs: ['Dasbor'] });
if (user) init();

function init() {
  const s = getState();
  const stage = user.role;
  const label = STAGE_LABELS[stage];
  const today = new Date();
  const month = monthLabel(today.getFullYear(), today.getMonth());
  const st = statsFor(s.requests, stage, toISODate(today).slice(0, 7));
  const pending = pendingFor(s.requests, stage).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const stat = (title, n, sub, icon, bg, fg) =>
    `<div class="col"><div class="card h-100"><div class="card-body"><div class="small text-secondary mb-2">${title}</div>` +
    `<div class="d-flex justify-content-between align-items-center"><span class="display-6 fw-bold">${n}</span><span class="rl-stat-icon" style="background:var(${bg});color:var(${fg})"><i class="bi bi-${icon}"></i></span></div>` +
    `<div class="small text-secondary mt-2">${sub}</div></div></div></div>`;

  document.getElementById('content').innerHTML = `
    <div class="d-flex justify-content-between align-items-start mb-4">
      <div><h1 class="fs-2 fw-bold mb-2">Dasbor</h1><p class="text-secondary mb-0">Selamat datang, ${esc(user.honorific ?? '')} ${esc(user.name.split(' ')[0])}. Berikut ringkasan peminjaman ruangan hari ini.</p></div>
      <span class="border rounded-3 bg-white px-3 py-2 small"><i class="bi bi-calendar3 me-2"></i>${formatDateWithDay(toISODate(today))}</span>
    </div>
    <div class="row row-cols-4 g-4 mb-4">
      ${stat('Total pengajuan masuk', st.total, `Bulan ${month}`, 'file-earmark-text', '--rl-soft-bg', '--bs-primary')}
      ${stat('Menunggu persetujuan', st.pending, 'Perlu ditinjau pada tahap Anda', 'clock', '--rl-warn-bg', '--bs-warning')}
      ${stat(`Disetujui ${label}`, st.approved, `Bulan ${month}`, 'check-lg', '--rl-ok-bg', '--bs-success')}
      ${stat(`Ditolak ${label}`, st.rejected, `Bulan ${month}`, 'x-lg', '--rl-danger-bg', '--bs-danger')}
    </div>
    <div class="rounded-3 bg-soft p-3 mb-5">
      <div class="small fw-semibold text-primary text-uppercase mb-1">Persetujuan berjenjang</div>
      <div class="fs-5 fw-semibold d-flex gap-4 align-items-center"><span>01&nbsp; Sarpras</span><i class="bi bi-arrow-right"></i><span>02&nbsp; Kemahasiswaan</span><i class="bi bi-arrow-right"></i><span>03&nbsp; Kabag Umum</span></div>
      <div class="small text-secondary mt-1">Keputusan revisi atau penolakan menghentikan proses pada tahap terkait.</div>
    </div>
    <div class="d-flex justify-content-between align-items-start mb-3">
      <div><h2 class="fs-4 fw-semibold mb-1">Pengajuan terbaru</h2><p class="small text-secondary mb-0">Antrean yang siap ditinjau oleh ${esc(label)}</p></div>
      <a href="pengajuan.html" class="btn btn-primary px-4">Lihat Semua <i class="bi bi-arrow-right"></i></a>
    </div>
    <div class="card">${pending.length ? queueTable(pending.slice(0, 4), { rooms: s.rooms, users: s.users, stage }) : '<div class="card-body text-secondary small">Tidak ada pengajuan yang menunggu keputusan Anda.</div>'}</div>
    <div class="d-flex justify-content-between small text-secondary mt-3">
      <span>Menampilkan ${Math.min(4, pending.length)} dari ${pending.length} pengajuan menunggu</span>
      <span>Data diperbarui hari ini, ${formatClock(nowLocal())}</span>
    </div>`;
}
