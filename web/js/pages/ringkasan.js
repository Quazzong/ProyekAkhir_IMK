import { requireSession, getState, getDraft, update } from '../store.js';
import { validateRequestForm } from '../domain/validation.js';
import { submit } from '../domain/availability.js';
import { nextRequestId } from '../domain/request-status.js';
import { buildNotifications } from '../domain/notifications.js';
import { formatDateLong, formatRange, formatSize, nowLocal } from '../domain/dates.js';
import { button, esc } from '../ui/components.js';

const user = requireSession('pemohon', 'masuk.html');
const draft = getDraft();
const room = user && getState().rooms.find(r => r.id === draft.roomId);
const form = draft.form;
// Tanpa ruangan/jadwal → pilih ulang; formulir belum valid → kembali ke formulir.
if (user && (!room || !draft.date)) location.replace(room ? 'index.html' : 'ruangan.html');
else if (user && (!form || Object.keys(validateRequestForm(form, room)).length)) location.replace('ajukan.html');
else if (user) init();

function init() {
  const $ = id => document.getElementById(id);
  const row = (label, value) => `<div class="mb-3"><div class="small fw-medium text-secondary">${label}</div><div class="fw-medium">${value}</div></div>`;
  let busy = false;

  function render(loading = false) {
    $('app').innerHTML = `
      <header class="d-flex align-items-center gap-2 mb-1">
        <a href="ajukan.html" class="btn p-2 ${loading ? 'disabled' : ''}" aria-label="Kembali ke formulir"><i class="bi bi-arrow-left fs-5"></i></a>
        <h1 class="h5 fw-bold mb-0">Ringkasan pengajuan</h1>
      </header>
      <p class="small text-secondary mb-3">Langkah 2 dari 2 &nbsp;•&nbsp; Periksa sebelum dikirim</p>
      <div class="rl-photo mb-3"></div>
      <h2 class="fs-4 fw-bold mb-0">${esc(room.name)}</h2>
      <p class="small text-secondary mb-3">${[room.location, `${room.capacity} orang`].filter(Boolean).join(' &nbsp;•&nbsp; ')}</p>
      ${row('Jadwal', `${formatDateLong(draft.date)} · ${formatRange(draft.start, draft.end)} WIB`)}
      ${row('Nama kegiatan', esc(form.name))}
      ${row('Jenis &amp; peserta', `${esc(form.kind)} &nbsp;·&nbsp; ${esc(form.attendees)} orang`)}
      ${row('Deskripsi', esc(form.description).replace(/\n/g, '<br>'))}
      ${row('Penanggung jawab', `${esc(user.name)} &nbsp;·&nbsp; ${esc(form.contact)}`)}
      ${form.attachment ? row('Dokumen', `${esc(form.attachment.name)} &nbsp;·&nbsp; ${formatSize(form.attachment.size)}`) : ''}
      <div class="rounded-3 bg-soft text-primary small p-3 mb-3">Jadwal diperiksa kembali saat dikirim.<br>Pengajuan diteruskan ke Sarpras jika tersedia.</div>
      <div class="d-grid gap-2">
        ${loading ? '<button type="button" class="btn btn-soft" disabled>Ubah Informasi</button>' : '<a href="ajukan.html" class="btn btn-soft">Ubah Informasi</a>'}
        ${button(loading ? 'Memproses…' : 'Kirim Pengajuan', { id: 'send', state: loading ? 'loading' : 'default' })}
      </div>`;
    $('send').onclick = send;
  }

  // tombol terkunci saat memproses; cek bentrok ulang dari state terbaru (bisa berubah dari tab lain).
  function send() {
    if (busy) return;
    busy = true;
    render(true);
    setTimeout(() => {
      const s = getState();
      const slot = { roomId: room.id, date: draft.date, start: draft.start, end: draft.end };
      const at = nowLocal();
      const res = submit(s.requests, { ...slot, userId: user.id, ...form, attendees: +form.attendees, createdAt: at }, nextRequestId(s.requests, new Date().getFullYear()));
      if (res.conflict) {
        update(st => { st.result = { type: 'bentrok', ...slot }; }); // draft tetap tersimpan
      } else {
        update(st => {
          st.requests.push(res.request);
          st.notifications.push(...buildNotifications('submitted', res.request, res.notify, { users: st.users, at }));
          st.draft = null;
          st.result = { type: 'berhasil', requestId: res.request.id };
        });
      }
      location.href = 'hasil.html';
    }, 1200);
  }

  render();
}
