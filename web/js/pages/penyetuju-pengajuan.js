import { getState } from '../store.js';
import { mountPortal, queueTable } from '../ui/portal.js';
import { STAGE_LABELS } from '../domain/request-status.js';
import { STAGE_INFO, reachedStage } from '../domain/approval.js';
import { formatDateShort } from '../domain/dates.js';
import { esc } from '../ui/components.js';

const user = mountPortal({ active: 'Pengajuan Masuk', crumbs: ['Pengajuan Masuk'] });
if (user) init();

function init() {
  const $ = id => document.getElementById(id);
  const s = getState();
  const stage = user.role;
  const label = STAGE_LABELS[stage];
  const info = STAGE_INFO[stage];
  const all = reachedStage(s.requests, stage);
  const PER_PAGE = 6;
  const STATUSES = ['Menunggu', 'Disetujui', 'Perlu Revisi', 'Ditolak'];
  const dates = [...new Set(all.map(r => r.date))].sort();
  let f = { q: '', status: 'Menunggu', date: '', desc: true, page: 1 };

  $('content').innerHTML = `
    <h1 class="fs-2 fw-bold mb-2">Pengajuan Masuk</h1>
    <p class="text-secondary mb-4">${esc(info.intro)}</p>
    <div class="rounded-3 bg-soft p-3 mb-4 d-flex gap-3"><i aria-hidden="true" class="bi bi-file-earmark-text fs-5 text-primary"></i>
      <div><div class="fw-semibold">Antrean ${esc(label)}</div><div class="small text-secondary">${esc(info.queueNote)}</div></div></div>
    <div class="card mb-4"><div class="card-body row g-3">
      <div class="col-6 position-relative"><i aria-hidden="true" class="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-secondary"></i>
        <input id="q" class="form-control ps-5 bg-body border-0" placeholder="Cari nama pemohon, ruangan, atau ID pengajuan" aria-label="Cari nama pemohon, ruangan, atau ID pengajuan"></div>
      <div class="col-3"><select id="status" class="form-select" aria-label="Filter status">
        <option value="">Status: Semua</option>${STATUSES.map(x => `<option value="${x}" ${x === f.status ? 'selected' : ''}>Status: ${x}</option>`).join('')}</select></div>
      <div class="col-3"><select id="date" class="form-select" aria-label="Filter tanggal">
        <option value="">Semua tanggal</option>${dates.map(d => `<option value="${d}">${formatDateShort(d)}</option>`).join('')}</select></div>
    </div></div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="fs-5 fw-semibold mb-0" id="count"></h2>
      <button type="button" class="btn btn-link btn-sm text-secondary text-decoration-none" id="sort"></button>
    </div>
    <div class="card rl-fade" id="table"></div>
    <div class="d-flex justify-content-between align-items-center mt-3">
      <span class="small text-secondary" id="range"></span>
      <nav aria-label="Halaman"><ul class="pagination mb-0" id="pages"></ul></nav>
    </div>`;

  function render() {
    const q = f.q.trim().toLowerCase();
    const name = r => s.users.find(u => u.id === r.userId).name;
    const room = r => s.rooms.find(x => x.id === r.roomId).name;
    const rows = all
      .filter(r => (!f.status || r.stages[stage] === f.status) && (!f.date || r.date === f.date) &&
        (!q || [r.id, name(r), room(r)].some(v => v.toLowerCase().includes(q))))
      .sort((a, b) => (f.desc ? -1 : 1) * a.createdAt.localeCompare(b.createdAt));
    const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    f.page = Math.min(f.page, pages);
    const start = (f.page - 1) * PER_PAGE;
    const shown = rows.slice(start, start + PER_PAGE);
    $('count').textContent = `${rows.length} pengajuan${f.status ? ` ${f.status.toLowerCase()}` : ''}`;
    $('sort').innerHTML = `Urutkan: ${f.desc ? 'terbaru' : 'terlama'} <i aria-hidden="true" class="bi bi-arrow-${f.desc ? 'down' : 'up'}"></i>`;
    $('table').innerHTML = shown.length ? queueTable(shown, { rooms: s.rooms, users: s.users, stage, offset: start }) : '<div class="card-body text-secondary small">Tidak ada pengajuan yang cocok.</div>';
    $('range').textContent = rows.length ? `Menampilkan ${start + 1}–${start + shown.length} dari ${rows.length} pengajuan` : '';
    const li = (p, text, aria, disabled = false) => `<li class="page-item ${p === f.page && !aria ? 'active' : ''} ${disabled ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${p}" ${aria ? `aria-label="${aria}"` : ''}>${text}</a></li>`;
    $('pages').innerHTML = li(f.page - 1, '‹', 'Sebelumnya', f.page === 1) + Array.from({ length: pages }, (_, i) => li(i + 1, i + 1)).join('') + li(f.page + 1, '›', 'Berikutnya', f.page === pages);
  }

  $('q').oninput = () => { f.q = $('q').value; f.page = 1; render(); };
  $('status').onchange = () => { f.status = $('status').value; f.page = 1; render(); };
  $('date').onchange = () => { f.date = $('date').value; f.page = 1; render(); };
  $('sort').onclick = () => { f.desc = !f.desc; render(); };
  $('pages').onclick = e => { const a = e.target.closest('[data-page]'); if (!a) return; e.preventDefault(); f.page = +a.dataset.page; render(); };
  render();
}
