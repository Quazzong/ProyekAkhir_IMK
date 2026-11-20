import { getDraft, patchDraft, popFlash, unreadCount } from '../store.js';
import { toISODate, validateSlot } from '../domain/validation.js';
import { formatDateLong, monthGrid, monthLabel, timeSlots } from '../domain/dates.js';
import { dayCell, select, button, esc, profileMenu, showToast } from '../ui/components.js';

export function renderCalendar(user, navigate) {
  const today = new Date();
  const todayISO = toISODate(today);
  const draft = getDraft();
  const sel = { date: draft.date >= todayISO ? draft.date : todayISO, start: draft.start ?? '09:00', end: draft.end ?? '11:00' };
  const [dy, dm] = sel.date.split('-').map(Number);
  let view = { y: dy, m: dm - 1 };
  const unread = unreadCount(user.id);
  const times = timeSlots().map(t => ({ value: t, label: t.replace(':', '.') }));
  const HINT = 'Waktu selesai harus setelah waktu mulai.';

  document.getElementById('app').innerHTML = `
    <div class="d-flex justify-content-between align-items-start mb-4">
      <div><h1 class="h3 fw-bold mb-1">Halo, ${esc(user.name.split(' ')[0])} 👋</h1><p class="text-secondary small mb-0">Temukan ruang untuk kegiatanmu.</p></div>
      <div class="d-flex d-lg-none align-items-center"><a href="notifikasi.html" class="btn position-relative p-2" aria-label="Notifikasi${unread ? `, ${unread} belum dibaca` : ''}"><i aria-hidden="true" class="bi bi-bell fs-4"></i>${unread ? `<span class="badge text-bg-primary rounded-pill position-absolute top-0 end-0">${unread}</span>` : ''}</a>${profileMenu(user)}</div>
    </div>
    <div class="row g-lg-4"><div class="col-lg-7">
    <div class="card bg-soft border-0 mb-3"><div class="card-body d-flex gap-3 align-items-center">
      <i aria-hidden="true" class="bi bi-calendar3 text-primary fs-5"></i>
      <div><div class="fw-semibold small">Mulai dari jadwal kegiatan</div><div class="small text-secondary">Pilih tanggal dan waktu peminjaman.</div></div>
    </div></div>
    <div class="card mb-3"><div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h2 class="h6 fw-bold mb-0" id="month"></h2>
        <div><button type="button" class="btn btn-link p-2" id="prev" aria-label="Bulan sebelumnya"><i aria-hidden="true" class="bi bi-chevron-left"></i></button><button type="button" class="btn btn-link p-2" id="next" aria-label="Bulan berikutnya"><i aria-hidden="true" class="bi bi-chevron-right"></i></button></div>
      </div>
      <div class="rl-cal" id="cal"></div>
    </div></div>
    </div><div class="col-lg-5"><div class="rl-sticky-lg">
    <p class="small fw-semibold text-primary" id="picked"></p>
    <div class="row g-3">
      <div class="col-6">${select({ id: 'start', label: 'Waktu mulai', options: times, value: sel.start })}</div>
      <div class="col-6">${select({ id: 'end', label: 'Waktu selesai', options: times, value: sel.end })}</div>
    </div>
    <p class="small text-secondary" id="hint">${HINT}</p>
    <div id="cta">${button('Cari Ruangan', { id: 'go' })}</div>
    </div></div></div>`;

  const $ = id => document.getElementById(id);

  function renderCal() {
    const { lead, days } = monthGrid(view.y, view.m);
    $('month').textContent = monthLabel(view.y, view.m);
    $('prev').classList.toggle('invisible', view.y === today.getFullYear() && view.m === today.getMonth()); // tidak ada tanggal untuk dipilih sebelum bulan ini
    $('cal').innerHTML = ['S', 'S', 'R', 'K', 'J', 'S', 'M'].map(d => `<div class="rl-dow">${d}</div>`).join('') +
      '<span></span>'.repeat(lead) +
      days.map(iso => dayCell(+iso.slice(8), iso < todayISO ? 'disabled' : iso === sel.date ? 'selected' : 'default', { date: iso, label: formatDateLong(iso) })).join('');
  }

  // error waktu menggantikan petunjuk, tombol jadi "Perbaiki Waktu" (nonaktif).
  function check() {
    const errs = validateSlot(sel);
    for (const id of ['start', 'end']) {
      $(id).classList.toggle('is-invalid', !!errs[id]);
      $(id).setAttribute('aria-invalid', String(Boolean(errs[id])));
      $(id).setAttribute('aria-describedby', 'hint');
    }
    const timeErr = errs.start || errs.end;
    $('hint').textContent = timeErr || HINT;
    $('hint').className = `small ${timeErr ? 'text-danger' : 'text-secondary'}`;
    $('picked').textContent = `Tanggal dipilih: ${formatDateLong(sel.date)}`;
    $('cta').innerHTML = button(timeErr ? 'Perbaiki Waktu' : 'Cari Ruangan', { id: 'go', state: timeErr ? 'disabled' : 'default' });
  }

  $('cal').onclick = e => {
    const b = e.target.closest('[data-date]');
    if (!b) return;
    sel.date = b.dataset.date;
    renderCal(); check();
    $('cal').querySelector('[aria-pressed="true"]').focus();
  };
  $('prev').onclick = () => { view = view.m ? { ...view, m: view.m - 1 } : { y: view.y - 1, m: 11 }; renderCal(); };
  $('next').onclick = () => { view = view.m < 11 ? { ...view, m: view.m + 1 } : { y: view.y + 1, m: 0 }; renderCal(); };
  for (const k of ['start', 'end']) $(k).onchange = () => { sel[k] = $(k).value; check(); };
  $('cta').onclick = e => {
    if (!e.target.closest('#go') || e.target.closest('#go').disabled) return;
    if (Object.keys(validateSlot(sel)).length) return; // jaga bila tanggal lampau lolos lewat state lama
    patchDraft({ ...sel });
    navigate('ruangan.html');
  };

  renderCal(); check();
  const flash = popFlash();
  if (flash?.message) showToast(flash.message);
}
