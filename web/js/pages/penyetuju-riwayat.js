import { getState } from '../store.js';
import { mountPortal, queueTable } from '../ui/portal.js';
import { STAGE_LABELS } from '../domain/request-status.js';
import { decidedBy } from '../domain/approval.js';
import { esc } from '../ui/components.js';

const user = mountPortal({ active: 'Riwayat Keputusan', crumbs: ['Riwayat Keputusan'] });
if (user) init();

function init() {
  const $ = id => document.getElementById(id);
  const s = getState();
  const stage = user.role;
  const all = decidedBy(s.requests, stage);
  const PER_PAGE = 6;
  const STATUSES = ['Disetujui', 'Perlu Revisi', 'Ditolak'];
  let f = { q: '', status: '', page: 1 };

  $('content').innerHTML = `
    <h1 class="fs-2 fw-bold mb-2">Riwayat Keputusan</h1>
    <p class="text-secondary mb-4">Pengajuan yang sudah Anda putuskan pada tahap ${esc(STAGE_LABELS[stage])}, terbaru di atas.</p>
    <div class="card mb-4"><div class="card-body row g-3">
      <div class="col-8 position-relative"><i aria-hidden="true" class="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-secondary"></i>
        <input id="q" class="form-control ps-5 bg-body border-0" placeholder="Cari nama pemohon, ruangan, atau ID pengajuan" aria-label="Cari nama pemohon, ruangan, atau ID pengajuan"></div>
      <div class="col-4"><select id="status" class="form-select" aria-label="Filter keputusan">
        <option value="">Keputusan: Semua</option>${STATUSES.map(x => `<option value="${x}">Keputusan: ${x}</option>`).join('')}</select></div>
    </div></div>
    <h2 class="fs-5 fw-semibold mb-3" id="count"></h2>
    <div class="card" id="table"></div>
    <div class="d-flex justify-content-between align-items-center mt-3">
      <span class="small text-secondary" id="range"></span>
      <nav aria-label="Halaman"><ul class="pagination mb-0" id="pages"></ul></nav>
    </div>`;

  function render() {
    const q = f.q.trim().toLowerCase();
    const name = r => s.users.find(u => u.id === r.userId).name;
    const room = r => s.rooms.find(x => x.id === r.roomId).name;
    const rows = all.filter(r => (!f.status || r.stages[stage] === f.status) &&
      (!q || [r.id, name(r), room(r)].some(v => v.toLowerCase().includes(q))));
    const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    f.page = Math.min(f.page, pages);
    const start = (f.page - 1) * PER_PAGE;
    const shown = rows.slice(start, start + PER_PAGE);
    $('count').textContent = `${rows.length} keputusan`;
    $('table').innerHTML = shown.length
      ? queueTable(shown, { rooms: s.rooms, users: s.users, stage, offset: start })
      : `<div class="card-body text-secondary small">${all.length ? 'Tidak ada keputusan yang cocok.' : 'Belum ada keputusan.'}</div>`;
    $('range').textContent = rows.length ? `Menampilkan ${start + 1}–${start + shown.length} dari ${rows.length} keputusan` : '';
    const li = (p, text, aria, disabled = false) => `<li class="page-item ${p === f.page && !aria ? 'active' : ''} ${disabled ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${p}" ${aria ? `aria-label="${aria}"` : ''}>${text}</a></li>`;
    $('pages').innerHTML = pages > 1 ? li(f.page - 1, '‹', 'Sebelumnya', f.page === 1) + Array.from({ length: pages }, (_, i) => li(i + 1, i + 1)).join('') + li(f.page + 1, '›', 'Berikutnya', f.page === pages) : '';
  }

  $('q').oninput = () => { f.q = $('q').value; f.page = 1; render(); };
  $('status').onchange = () => { f.status = $('status').value; f.page = 1; render(); };
  $('pages').onclick = e => { const a = e.target.closest('[data-page]'); if (!a) return; e.preventDefault(); f.page = +a.dataset.page; render(); };
  render();
}
