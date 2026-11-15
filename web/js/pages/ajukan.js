import { requireSession, getState, getDraft, patchDraft, update } from '../store.js';
import { validateRequestForm, validateAttachment, KINDS } from '../domain/validation.js';
import { formatDateShort, formatRange, formatSize, nowLocal } from '../domain/dates.js';
import { resubmit } from '../domain/request-status.js';
import { buildNotifications } from '../domain/notifications.js';
import { revisionStage, revisionHint } from '../domain/request-view.js';
import { field, select, textarea, button, confirmModal, esc, roomPhoto } from '../ui/components.js';

const user = requireSession('pemohon', 'masuk.html');
// ajukan.html?id=RL-… = perbaikan pengajuan Perlu Revisi (jadwal & ruangan tetap, data lama terisi).
const editId = new URLSearchParams(location.search).get('id');
const editReq = user && editId && getState().requests.find(r => r.id === editId && r.userId === user.id && r.status === 'Perlu Revisi');
const draft = getDraft();
const slot = editReq ?? draft;
const room = user && getState().rooms.find(r => r.id === slot.roomId);
if (user && editId && !editReq) location.replace('pengajuan.html');
else if (user && (!room || !slot.date)) location.replace(room ? 'index.html' : 'ruangan.html'); // belum pilih jadwal/ruangan
else if (user) init();

function init() {
  const $ = id => document.getElementById(id);
  const saved = getState().revision;
  const f = editReq
    ? { name: editReq.name, kind: editReq.kind, description: editReq.description, attendees: String(editReq.attendees), contact: editReq.contact, attachment: editReq.attachment ?? null,
      ...(saved?.id === editId ? saved.form : {}) }
    : { name: '', kind: '', description: '', attendees: '', contact: '', attachment: null, ...draft.form };
  const FIELDS = ['name', 'kind', 'description', 'attendees', 'contact'];

  $('app').innerHTML = `
    <header class="d-flex align-items-center gap-2 mb-1">
      <button type="button" class="btn p-2" id="back" aria-label="Kembali"><i aria-hidden="true" class="bi bi-arrow-left fs-5"></i></button>
      <h1 class="h5 fw-bold mb-0">${editReq ? 'Perbaiki pengajuan' : 'Formulir pengajuan'}</h1>
    </header>
    <p class="small text-secondary mb-3" id="sub">${editReq ? `${esc(editReq.id)} &nbsp;•&nbsp; Data sebelumnya tetap tersimpan` : 'Langkah 1 dari 2 &nbsp;•&nbsp; Lengkapi informasi kegiatan'}</p>
    <div class="row g-lg-4"><div class="col-lg-4"><div class="rl-sticky-lg rl-no-nav">
    <div class="card mb-4"><div class="card-body d-flex gap-3">
      ${roomPhoto(room.id, 'rl-photo-sm')}
      <div><div class="fw-semibold">${esc(room.name)}</div><div class="small text-secondary">Kapasitas ${room.capacity} orang</div>
        <div class="small fw-semibold text-primary mt-2">${formatDateShort(slot.date)}</div><div class="small text-primary">${formatRange(slot.start, slot.end)} WIB</div></div>
    </div></div>
    </div></div><div class="col-lg-8">
    <form id="form" novalidate>
      ${field({ id: 'name', label: 'Nama kegiatan', required: true, placeholder: 'Contoh: Seminar Karier Digital 2026', value: f.name })}
      ${select({ id: 'kind', label: 'Jenis kegiatan', required: true, placeholder: 'Pilih kegiatan', options: KINDS, value: f.kind })}
      ${textarea({ id: 'description', label: 'Deskripsi singkat', required: true, value: f.description })}
      ${field({ id: 'attendees', label: 'Perkiraan peserta', required: true, inputmode: 'numeric', placeholder: 'Jumlah peserta', value: f.attendees, hint: `Maksimal ${room.capacity} orang sesuai kapasitas ruangan.` })}
      ${field({ id: 'contact', label: 'Kontak penanggung jawab', required: true, inputmode: 'tel', placeholder: '0812-3456-7890', value: f.contact })}
      <div class="mb-3"><div class="form-label fw-medium">Dokumen pendukung (opsional)</div><div id="upload"></div></div>
      ${editReq
    ? `<div class="rounded-3 bg-soft text-primary small p-3 mb-3">${esc(revisionHint(editReq))}<br>Dokumen lama tetap tersimpan.</div>`
    : '<p class="small text-secondary">* Wajib diisi. Jadwal telah terisi otomatis.</p>'}
      <div class="${editReq ? '' : 'mt-4'} d-grid d-lg-flex justify-content-lg-end rl-cta" id="cta">${button(editReq ? 'Kirim Ulang Revisi' : 'Lanjutkan ke Ringkasan', { id: 'next', type: 'submit', full: false })}</div>
    </form>
    </div></div>`;
  $('modal-box').innerHTML = confirmModal({ id: 'm-discard', title: 'Buang isian?', body: 'Isian formulir yang sudah diisi akan dihapus.', cancel: 'Lanjut Mengisi', confirm: 'Buang', danger: true });

  const save = () => (editReq ? update(s => { s.revision = { id: editId, form: f }; }) : patchDraft({ form: f }));
  // Pesan error di bawah tiap kolom; pesan kosong = valid.
  const show = (id, msg) => {
    const el = $(id);
    el.classList.toggle('is-invalid', !!msg);
    el.parentElement.querySelector('.invalid-feedback').textContent = msg ?? '';
  };

  // Unggah dokumen: kotak putus-putus; progres hanya simulasi (tanpa backend).
  let timer;
  function renderUpload(state = 'idle', msg = '') {
    const a = f.attachment;
    const body = state === 'progress'
      ? `<div class="small fw-semibold mb-2">${esc(msg)}</div><div class="progress" role="progressbar" aria-label="Mengunggah" style="height:6px"><div class="progress-bar" id="bar" style="width:0%"></div></div>`
      : a
        ? `<div class="d-flex justify-content-between"><div><div class="small fw-semibold text-primary">${esc(a.name)}</div><div class="small text-secondary">PDF, DOC, JPG &nbsp;•&nbsp; Maks. 10 MB</div><div class="small text-success-emphasis">${formatSize(a.size)} &nbsp; ✓ Berhasil diunggah</div></div><button type="button" class="btn btn-link btn-sm text-danger align-self-start" id="rm">Hapus</button></div>`
        : `<label for="file" class="d-flex gap-3 align-items-center mb-0" style="cursor:pointer"><i aria-hidden="true" class="bi bi-cloud-arrow-up fs-4 text-primary"></i><span><span class="d-block small fw-semibold text-primary">Unggah dokumen</span><span class="d-block small text-secondary">PDF, DOC, JPG &nbsp;•&nbsp; Maks. 10 MB</span></span></label>`;
    $('upload').innerHTML = `<div class="rl-upload p-3">${body}</div><input type="file" id="file" class="visually-hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg">` +
      `<div class="small text-danger mt-1" id="file-err">${esc(state === 'error' ? msg : '')}</div>`;
    if ($('rm')) $('rm').onclick = () => { f.attachment = null; save(); renderUpload(); };
    $('file').onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const err = validateAttachment(file);
      if (err) return renderUpload('error', err);
      renderUpload('progress', file.name);
      let pct = 0;
      timer = setInterval(() => {
        pct += 20;
        $('bar').style.width = `${pct}%`;
        if (pct >= 100) { clearInterval(timer); f.attachment = { name: file.name, size: file.size }; save(); renderUpload(); }
      }, 150);
    };
  }
  renderUpload();

  // Isian tersimpan ke draft tiap perubahan.
  for (const k of FIELDS) $(k).addEventListener('input', () => { f[k] = $(k).value; save(); });

  $('back').onclick = () => bootstrap.Modal.getOrCreateInstance($('m-discard')).show();
  $('m-discard').querySelector('[data-role=confirm]').onclick = () => {
    clearInterval(timer);
    if (editReq) { update(s => { delete s.revision; }); location.href = `pengajuan-detail.html?id=${encodeURIComponent(editId)}`; return; }
    patchDraft({ form: null });
    location.href = 'ruangan.html';
  };

  $('form').onsubmit = e => {
    e.preventDefault();
    const errors = validateRequestForm(f, room);
    for (const k of FIELDS) show(k, errors[k]);
    if (Object.keys(errors).length) {
      $('sub').textContent = 'Perbaiki isian yang ditandai sebelum melanjutkan.';
      $('sub').className = 'small text-danger mb-3';
      $(FIELDS.find(k => errors[k])).focus();
      return;
    }
    save();
    if (editReq) return sendRevision();
    location.href = 'ringkasan.html';
  };

  // Jadwal tidak berubah, jadi tidak ada cek bentrok ulang. Tombol dikunci.
  let busy = false;
  function sendRevision() {
    if (busy) return;
    busy = true;
    $('cta').innerHTML = button('Memproses…', { id: 'next', state: 'loading', full: false });
    const stage = revisionStage(editReq);
    setTimeout(() => {
      update(s => {
        const i = s.requests.findIndex(r => r.id === editId);
        const { request, notify } = resubmit(s.requests[i], { ...f, attendees: +f.attendees });
        s.requests[i] = request;
        s.notifications.push(...buildNotifications('resubmitted', request, notify, { users: s.users, at: nowLocal() }));
        s.result = { type: 'revisi', requestId: editId, stage };
        delete s.revision;
      });
      location.href = 'hasil.html';
    }, 1200);
  }
}
