// HTA 9.1: daftar pemakaian ruangan terverifikasi per tanggal (awal = hari ini).
import { getState, update } from '../store.js';
import { mountPortal } from '../ui/portal.js';
import { usageOn, nearestUsageDate, checkStatus, checkSummary } from '../domain/security.js';
import { toISODate } from '../domain/validation.js';
import { formatDateLong, formatDateWithDay, formatRange } from '../domain/dates.js';
import { esc, portalTable, statusChip } from '../ui/components.js';

const user = mountPortal({ kind: 'keamanan', active: 'Jadwal Pemakaian', crumbs: ['Jadwal Pemakaian'], roleChip: false });
if (user) init();

function init() {
  const $ = id => document.getElementById(id);
  const today = toISODate(new Date());
  const shift = (iso, n) => { const d = new Date(`${iso}T00:00`); d.setDate(d.getDate() + n); return toISODate(d); };
  // Tanggal terpilih disimpan di store agar tetap sama saat kembali dari detail.
  const setDate = date => { update(s => { s.securityDate = date; }); render(); };

  $('content').innerHTML = `
    <div class="d-flex justify-content-between align-items-start mb-4 gap-4">
      <div><h1 class="fs-2 fw-bold mb-2">Jadwal Pemakaian</h1>
        <p class="text-secondary mb-0">Peminjaman yang sudah disetujui Kabag Umum. Cocokkan dengan pengguna di lokasi saat kegiatan berlangsung.</p></div>
      <div class="d-flex align-items-center gap-2 flex-shrink-0">
        <button type="button" class="btn btn-outline-secondary" id="prev" aria-label="Hari sebelumnya"><i aria-hidden="true" class="bi bi-chevron-left"></i></button>
        <input type="date" class="form-control" id="date" aria-label="Tanggal pemakaian">
        <button type="button" class="btn btn-outline-secondary" id="next" aria-label="Hari berikutnya"><i aria-hidden="true" class="bi bi-chevron-right"></i></button>
        <button type="button" class="btn btn-soft text-nowrap" id="today">Hari ini</button>
      </div>
    </div>
    <div class="row row-cols-3 g-4 mb-4 rl-fade" id="stats"></div>
    <div class="d-flex justify-content-between align-items-end mb-3">
      <div><h2 class="fs-4 fw-semibold mb-1" id="title"></h2><p class="small text-secondary mb-0" id="count"></p></div>
    </div>
    <div class="card rl-fade" id="table"></div>`;

  function render() {
    const s = getState();
    const date = s.securityDate ?? today;
    const list = usageOn(s.requests, date);
    const sum = checkSummary(list);
    $('date').value = date;
    $('today').disabled = date === today;
    $('title').textContent = `${date === today ? 'Hari ini · ' : ''}${formatDateLong(date)}`;
    $('count').textContent = `${sum.total} pemakaian terverifikasi`;

    const stat = (title, n, sub, icon, bg, fg) =>
      `<div class="col"><div class="card h-100"><div class="card-body"><div class="small text-secondary mb-2">${title}</div>` +
      `<div class="d-flex justify-content-between align-items-center"><span class="display-6 fw-bold">${n}</span><span class="rl-stat-icon" style="background:var(${bg});color:var(${fg})"><i aria-hidden="true" class="bi bi-${icon}"></i></span></div>` +
      `<div class="small text-secondary mt-2">${sub}</div></div></div></div>`;
    $('stats').innerHTML =
      stat('Total pemakaian', sum.total, 'Disetujui pada tanggal ini', 'calendar-check', '--rl-soft-bg', '--bs-primary') +
      stat('Sudah dicek', sum.checked, !sum.checked ? 'Belum ada pemeriksaan' : sum.mismatch ? `${sum.mismatch} tidak sesuai` : 'Semua sesuai', 'shield-check', '--rl-ok-bg', '--bs-success') +
      stat('Belum dicek', sum.pending, 'Perlu dicocokkan di lokasi', 'clock', '--rl-warn-bg', '--rl-warn-fg');

    if (!list.length) {
      const near = nearestUsageDate(s.requests, date);
      $('table').innerHTML = `<div class="card-body text-center py-5">
        <i aria-hidden="true" class="bi bi-calendar-x fs-1 text-secondary"></i>
        <p class="fw-semibold mt-3 mb-1">Tidak ada pemakaian terverifikasi pada tanggal ini.</p>
        <p class="small text-secondary mb-3">Pemakaian muncul di sini setelah disetujui Kabag Umum.</p>
        ${near && near !== date ? `<button type="button" class="btn btn-soft" data-date="${near}">Lihat jadwal ${formatDateWithDay(near)}</button>` : ''}</div>`;
      return;
    }
    const cols = ['No.', 'Waktu', 'Ruangan', 'Kegiatan', 'Penanggung jawab', 'Pemeriksaan', 'Aksi'];
    $('table').innerHTML = portalTable(cols, list.map((r, i) => {
      const u = s.users.find(x => x.id === r.userId);
      return [
        String(i + 1).padStart(2, '0'),
        `<span class="fw-semibold text-body">${formatRange(r.start, r.end)}</span>`,
        esc(s.rooms.find(x => x.id === r.roomId).name),
        `<div class="fw-semibold text-body">${esc(r.name)}</div><div class="text-secondary">${esc(r.kind)} · ${r.attendees} peserta</div>`,
        `<div class="fw-semibold text-body">${esc(u.name)}</div><div class="text-secondary">${esc([u.position, u.unit].filter(Boolean).join(' · '))}</div>`,
        statusChip(checkStatus(r)),
        `<a class="btn btn-soft btn-sm" href="detail.html?id=${encodeURIComponent(r.id)}">${r.check ? 'Lihat Hasil' : 'Periksa'} <i aria-hidden="true" class="bi bi-arrow-right"></i></a>`,
      ];
    }));
  }

  const current = () => getState().securityDate ?? today;
  $('prev').onclick = () => setDate(shift(current(), -1));
  $('next').onclick = () => setDate(shift(current(), 1));
  $('today').onclick = () => setDate(today);
  $('date').onchange = () => $('date').value && setDate($('date').value);
  $('table').onclick = e => { const b = e.target.closest('[data-date]'); if (b) setDate(b.dataset.date); };
  render();
}
