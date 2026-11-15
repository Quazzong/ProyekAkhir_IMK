import { requireSession, getState, update, setFlash } from '../store.js';
import { actionsFor, cancel } from '../domain/request-status.js';
import { stepperSteps, flowNote } from '../domain/request-view.js';
import { formatDateShort, formatRange, formatDateTime } from '../domain/dates.js';
import { statusChip, stepper, confirmModal, esc } from '../ui/components.js';

const user = requireSession('pemohon', 'masuk.html');
const id = new URLSearchParams(location.search).get('id');
const state = user && getState();
const req = state?.requests.find(r => r.id === id && r.userId === user.id);
if (user && !req) location.replace('pengajuan.html'); // id tak dikenal
else if (user) init();

function init() {
  const $ = k => document.getElementById(k);
  const room = state.rooms.find(r => r.id === req.roomId);
  const acts = actionsFor(req.status);
  const note = flowNote(req);
  const noteCls = req.status === 'Ditolak' ? 'text-danger' : req.status === 'Perlu Revisi' ? 'text-primary' : 'text-secondary';

  $('app').innerHTML = `
    <header class="d-flex align-items-center gap-2 mb-1">
      <a href="pengajuan.html" class="btn p-2" aria-label="Kembali ke Pengajuan Saya"><i aria-hidden="true" class="bi bi-arrow-left fs-5"></i></a>
      <h1 class="h5 fw-bold mb-0">Detail pengajuan</h1>
    </header>
    <p class="small text-secondary mb-2">${esc(req.id)} &nbsp;•&nbsp; Diajukan ${formatDateTime(req.createdAt)}</p>
    <div class="mb-3">${statusChip(req.status)}</div>
    <div class="rl-photo mb-3"></div>
    <h2 class="fs-4 fw-bold mb-1">${esc(room.name)}</h2>
    <p class="small fw-medium text-primary mb-3">${formatDateShort(req.date)} &nbsp;•&nbsp; ${formatRange(req.start, req.end)} WIB</p>
    <h3 class="h6 fw-semibold mb-1">${esc(req.name)}</h3>
    <p class="small text-secondary mb-4">${esc(req.kind)} · ${req.attendees} peserta · ${esc(user.name)}<br>${esc(req.contact)}${req.attachment ? ` · ${esc(req.attachment.name)}` : ''}</p>
    <h3 class="h5 fw-semibold mb-2">Alur persetujuan</h3>
    <div class="card mb-2"><div class="card-body pb-0">${stepper(stepperSteps(req, state.users))}</div></div>
    ${note ? `<p class="small ${noteCls} mb-3">${esc(note)}</p>` : ''}
    <div class="d-grid gap-2 mt-3" id="acts">
      ${req.status === 'Disetujui' ? '<div class="rounded-3 small p-3 rl-ok-box">Pemohon dan petugas keamanan gedung telah menerima notifikasi persetujuan.</div><button type="button" class="btn btn-soft" id="history">Lihat Riwayat</button>' : ''}
      ${acts.includes('resubmit') ? `<a href="ajukan.html?id=${encodeURIComponent(req.id)}" class="btn btn-primary">Perbaiki Pengajuan</a>` : ''}
      ${acts.includes('findOther') ? '<a href="index.html" class="btn btn-primary" data-act="findOther">Cari Ruangan Lain</a>' : ''}
      ${acts.includes('cancel') ? `<button type="button" class="btn ${req.status === 'Disetujui' ? 'btn-link text-danger' : 'btn-soft'}" data-bs-toggle="modal" data-bs-target="#m-cancel">Batalkan Pengajuan</button>` : ''}
    </div>`;

  $('modal-box').innerHTML = confirmModal({ id: 'm-cancel', title: 'Batalkan Pengajuan?', body: 'Apakah Anda yakin ingin membatalkan pengajuan ini?', note: 'Pengajuan yang dibatalkan masuk ke riwayat.', cancel: 'Kembali', confirm: 'Ya, Batalkan' });

  // "Lihat Riwayat" → Pengajuan Saya tab Riwayat (lewat store, bukan query string).
  if ($('history')) $('history').onclick = () => { setFlash('', 'Riwayat'); location.href = 'pengajuan.html'; };

  // konfirmasi → toast → pengajuan.html (tab Riwayat).
  $('m-cancel').querySelector('[data-role=confirm]').onclick = () => {
    update(s => { s.requests[s.requests.findIndex(r => r.id === req.id)] = cancel(req); });
    setFlash('Pengajuan berhasil dibatalkan.', 'Riwayat');
    location.href = 'pengajuan.html';
  };
}
