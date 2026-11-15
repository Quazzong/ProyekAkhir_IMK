import { requireSession, getState, getDraft, patchDraft, unreadCount } from '../store.js';
import { availableRooms } from '../domain/availability.js';
import { formatDateWithDay, formatRange } from '../domain/dates.js';
import { roomCard, bindRoomCards, filterChip, filterSheet, emptyState, mainNav } from '../ui/components.js';

const JENIS = ['Ruang Kelas', 'Ruang Seminar', 'Laboratorium', 'Ruang Rapat'];
const KAP = [
  { value: '<25', label: 'Kurang dari 25 orang', chip: '<25 orang' },
  { value: '25–50', label: '25–50 orang', chip: '25–50 orang' },
  { value: '>50', label: 'Lebih dari 50 orang', chip: '>50 orang' },
];

const user = requireSession('pemohon', 'masuk.html');
const draft = getDraft();
if (user && !draft.date) location.replace('index.html'); // belum memilih jadwal
else if (user) init();

function init() {
  const $ = id => document.getElementById(id);
  const slot = { date: draft.date, start: draft.start, end: draft.end };
  let filter = { type: draft.type ?? '', capacity: draft.capacity ?? '' };

  $('nav').innerHTML = mainNav('Kalender', unreadCount(user.id), user);
  $('app').innerHTML = `
    <header class="d-flex align-items-center gap-2 mb-1">
      <a href="index.html" class="btn p-2" aria-label="Kembali ke Kalender"><i aria-hidden="true" class="bi bi-arrow-left fs-5"></i></a>
      <h1 class="h5 fw-bold mb-0">Ruangan tersedia</h1>
    </header>
    <p class="small text-secondary mb-3">${formatDateWithDay(slot.date)} &nbsp;•&nbsp; ${formatRange(slot.start, slot.end)}</p>
    <div id="list" class="rl-fade"></div>`;

  function openSheet() {
    $('sheet-box').innerHTML = filterSheet({ id: 'sheet', jenis: JENIS, kapasitas: KAP, jenisAktif: filter.type, kapasitasAktif: filter.capacity, placement: matchMedia('(min-width: 992px)').matches ? 'end' : 'bottom' });
    const el = $('sheet');
    const sheet = new bootstrap.Offcanvas(el);
    el.addEventListener('hidden.bs.offcanvas', () => { sheet.dispose(); el.remove(); });
    $('sheet-apply').onclick = () => {
      filter = { type: el.querySelector('[name=jenis]:checked')?.value ?? '', capacity: el.querySelector('[name=kap]:checked')?.value ?? '' };
      patchDraft(filter);
      render();
      sheet.hide();
    };
    $('sheet-reset').onclick = () => { for (const r of el.querySelectorAll('input:checked')) r.checked = false; };
    sheet.show();
  }

  function render() {
    const rooms = availableRooms(getState().rooms, getState().requests, slot, filter);
    const capChip = KAP.find(k => k.value === filter.capacity)?.chip;
    const chips = [filter.type && filterChip(filter.type, 'type'), capChip && filterChip(capChip, 'capacity')].filter(Boolean);
    $('list').innerHTML = (rooms.length
      ? `<div class="d-flex justify-content-between align-items-center mb-3"><span class="fw-semibold">${rooms.length} ruangan tersedia</span>` +
        `<button type="button" class="btn btn-soft btn-sm" data-act="filter"><i aria-hidden="true" class="bi bi-funnel me-1"></i>Filter</button></div>`
      : '') +
      (chips.length ? `<div class="d-flex flex-wrap align-items-center gap-2 mb-3">${chips.join('')}<button type="button" class="btn btn-link btn-sm p-0" data-act="reset">Reset filter</button></div>` : '') +
      (rooms.length
        ? `<div class="row row-cols-1 row-cols-lg-2 gx-lg-3">${rooms.map(r => `<div class="col">${roomCard(r)}</div>`).join('')}</div>`
        : `<div class="row"><div class="col-lg-5 mx-auto">${emptyState({
          icon: 'search', title: 'Belum ada ruangan tersedia',
          body: 'Semua ruangan telah terisi pada jadwal ini.\nCoba tanggal, waktu, atau filter lain.',
          actions: '<a href="index.html" class="btn btn-primary">Kembali ke Kalender</a><button type="button" class="btn btn-soft" data-act="filter">Ubah Filter</button>',
        })}</div></div>`);
  }

  $('list').onclick = e => {
    const chip = e.target.closest('[data-chip]');
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (chip) { filter = { ...filter, [chip.dataset.chip]: '' }; patchDraft(filter); render(); }
    else if (act === 'reset') { filter = { type: '', capacity: '' }; patchDraft(filter); render(); }
    else if (act === 'filter') openSheet();
  };

  bindRoomCards($('list'), roomId => { patchDraft({ roomId }); location.href = 'ajukan.html'; });
  render();
}
