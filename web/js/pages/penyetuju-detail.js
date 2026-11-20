import { getState, updateCurrentRequest, setFlash } from '../store.js';
import { mountPortal } from '../ui/portal.js';
import { STAGES, STAGE_LABELS, currentStage, validateDecisionNote } from '../domain/request-status.js';
import { STAGE_INFO, applyDecision, decisionResult } from '../domain/approval.js';
import { portalSteps } from '../domain/request-view.js';
import { formatDateLong, formatDateWithDay, formatRange, formatTime, formatSize, formatDateShort, nowLocal } from '../domain/dates.js';
import { statusChip, stepperH, resultModal, esc, showToast, roomPhoto } from '../ui/components.js';

// Dibuka dari Riwayat Keputusan → kembali ke sana (asal halaman, bukan data, jadi cukup referrer).
const back = /\/riwayat\.html/.test(document.referrer) ? ['Riwayat Keputusan', 'riwayat.html'] : ['Pengajuan Masuk', 'pengajuan.html'];
const user = mountPortal({ active: back[0], crumbs: [back[0], 'Detail'], roleChip: false });
const id = new URLSearchParams(location.search).get('id');
if (user && !getState().requests.find(r => r.id === id && r.status !== 'Dibatalkan')) location.replace('pengajuan.html');
else if (user) init();

function init() {
  const $ = k => document.getElementById(k);
  const s = getState();
  const req = s.requests.find(r => r.id === id);
  const stage = user.role;
  const label = STAGE_LABELS[stage];
  const info = STAGE_INFO[stage];
  const room = s.rooms.find(r => r.id === req.roomId);
  const applicant = s.users.find(u => u.id === req.userId);
  const turn = currentStage(req);
  const actionable = turn === stage;
  const prev = STAGES[STAGES.indexOf(stage) - 1];
  const a = req.attachment;
  const row = (k, v) => `<div class="row py-2"><div class="col-4 small text-secondary">${k}</div><div class="col-8">${v}</div></div>`;
  const chip = req.status === 'Menunggu'
    ? `<span class="badge badge-status badge-menunggu px-3 py-2">Menunggu ${esc(STAGE_LABELS[turn])}</span>` : statusChip(req.status);

  $('content').innerHTML = `
    <a href="${back[1]}" class="small fw-semibold text-decoration-none d-inline-block mb-3"><i aria-hidden="true" class="bi bi-chevron-left me-2"></i>${back[0]}</a>
    <div class="d-flex justify-content-between align-items-start mb-4">
      <div><h1 class="fs-2 fw-bold mb-1">Detail Persetujuan</h1>
        <p class="text-secondary mb-0">${esc(req.id)} &nbsp;•&nbsp; Diajukan ${formatDateLong(req.createdAt.slice(0, 10))}, ${formatTime(req.createdAt.slice(11, 16))} WIB</p></div>
      ${chip}
    </div>
    <div class="mb-4">${stepperH(portalSteps(req, stage))}</div>
    <div class="row g-4 mb-4">
      <div class="col-8 d-flex flex-column gap-4">
        <div class="card"><div class="card-body p-4">
          <h2 class="fs-5 fw-semibold mb-3">Informasi peminjaman</h2>
          <div class="d-flex gap-3 pb-3 mb-2 border-bottom">${roomPhoto(room.id, 'rl-photo-md')}
            <div><div class="fs-4 fw-semibold">${esc(room.name)}</div>
              <div class="small text-secondary">${[room.location, `Kapasitas ${room.capacity} orang`].filter(Boolean).map(esc).join(' &nbsp;•&nbsp; ')}</div>
              <div class="text-primary mt-2">${formatDateWithDay(req.date)} &nbsp;•&nbsp; ${formatRange(req.start, req.end)} WIB</div></div></div>
          ${row('Nama kegiatan', `<span class="fw-semibold">${esc(req.name)}</span>`)}${row('Jenis kegiatan', esc(req.kind))}
          ${row('Jumlah peserta', `${req.attendees} orang`)}${row('Deskripsi', esc(req.description))}
        </div></div>
        <div class="card"><div class="card-body p-4">
          <h2 class="fs-5 fw-semibold mb-3">Dokumen pendukung</h2>
          ${a ? `<div class="rounded-3 bg-body p-2 d-flex align-items-center gap-3"><i aria-hidden="true" class="bi bi-file-earmark-text fs-4 text-primary ms-2"></i>
              <div class="flex-grow-1"><div class="small fw-semibold">${esc(a.name)}</div><div class="small text-secondary">${esc(a.name.split('.').pop().toUpperCase())} &nbsp;•&nbsp; ${formatSize(a.size)} &nbsp;•&nbsp; Diunggah ${formatDateShort(req.createdAt.slice(0, 10))}</div></div>
              <button type="button" class="btn btn-soft btn-sm px-4" data-bs-toggle="modal" data-bs-target="#m-preview"><i aria-hidden="true" class="bi bi-eye me-2"></i>Pratinjau</button>
              <button type="button" class="btn btn-soft btn-sm px-4" id="download"><i aria-hidden="true" class="bi bi-download me-2"></i>Unduh</button></div>`
    : '<p class="small text-secondary mb-0">Tidak ada dokumen pendukung.</p>'}
          ${req.previousAttachments?.length ? `<p class="small text-secondary mt-2 mb-0">Dokumen sebelumnya: ${req.previousAttachments.map(x => esc(x.name)).join(', ')}</p>` : ''}
        </div></div>
      </div>
      <div class="col-4 d-flex flex-column gap-4">
        <div class="card"><div class="card-body p-4">
          <h2 class="fs-5 fw-semibold mb-3">Informasi pemohon</h2>
          <div class="fs-5 fw-semibold mb-2">${esc(applicant.name)}</div>
          <div class="small text-secondary mb-2">${[applicant.position, applicant.unitFull].filter(Boolean).map(esc).join(' &nbsp;•&nbsp; ')}</div>
          ${applicant.nim ? `<div class="small text-secondary mb-2">NIM ${esc(applicant.nim)}</div>` : ''}
          <a class="small d-block mb-2" href="mailto:${esc(applicant.login)}">${esc(applicant.login)}</a>
          <div class="small">${esc(req.contact)}</div>
        </div></div>
        <div class="card flex-grow-1"><div class="card-body p-4">
          <h2 class="fs-5 fw-semibold mb-1">Catatan persetujuan</h2>
          ${actionable ? `<label for="note" class="d-block small text-secondary mb-3">Wajib diisi untuk revisi atau penolakan.</label>
            <textarea id="note" aria-describedby="note-err" class="form-control mb-1" rows="4"></textarea><div class="invalid-feedback" id="note-err"></div>
            <p class="small text-secondary mt-3 mb-2">${esc(info.noteHint)}</p><p class="small text-warning-emphasis mb-0">Revisi / penolakan menghentikan proses.</p>`
    : `<p class="small text-secondary mb-0 mt-3">${esc(req.notes?.[stage] || 'Belum ada catatan dari tahap Anda.')}</p>`}
        </div></div>
      </div>
    </div>
    ${actionable ? `<div class="card"><div class="card-body p-4 d-flex align-items-center gap-3">
      <div class="flex-grow-1"><h2 class="fs-6 fw-semibold mb-1">${esc(info.decisionTitle)}</h2><p class="small text-secondary mb-0">${esc(info.decisionHint)}</p></div>
      <button type="button" class="btn btn-danger-soft btn-lg px-5" data-act="reject">Tolak</button>
      <button type="button" class="btn btn-soft btn-lg px-4" data-act="revise">Minta Revisi</button>
      <button type="button" class="btn btn-primary btn-lg px-5" data-act="approve">Setujui</button>
    </div></div>
    ${prev ? `<p class="small text-success-emphasis mt-2">${esc(STAGE_LABELS[prev])} telah menyetujui. Pengajuan kini siap ditinjau ${esc(label)}.</p>` : ''}` : ''}`;

  // Pratinjau dokumen: isi contoh dari data pengajuan.
  $('modal-box').innerHTML = a ? `<div class="modal fade" id="m-preview" tabindex="-1" aria-labelledby="m-preview-t" aria-hidden="true"><div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content p-4">
      <h2 class="fs-4 fw-bold mb-1" id="m-preview-t">Pratinjau dokumen</h2><p class="small text-secondary">${esc(a.name)} &nbsp;•&nbsp; ${formatSize(a.size)}</p>
      <div class="rl-doc-preview p-4 mb-4">
        ${applicant.unitFull ? `<div class="small fw-semibold text-primary text-uppercase mb-4">${esc(applicant.unitFull)}</div>` : ''}
        <div class="fs-4 fw-bold mb-4">PROPOSAL KEGIATAN<br>${esc(req.name)}</div>
        <p>1. Latar belakang<br>${esc(req.description)}</p>
        <p>2. Pelaksanaan<br>${formatDateLong(req.date)}, ${formatRange(req.start, req.end)} WIB<br>${esc([room.name, room.location].filter(Boolean).join(', '))}</p>
        <p>3. Peserta dan penanggung jawab<br>${req.attendees} peserta · ${esc(applicant.name)} · ${esc(req.contact)}</p>
        <p class="small text-secondary mt-5 mb-0">Contoh dokumen untuk presentasi IMK</p>
      </div>
      <button type="button" class="btn btn-primary w-100" data-bs-dismiss="modal">Tutup Pratinjau</button>
    </div></div></div>` : '';
  if ($('download')) $('download').onclick = () => showToast('Unduhan dokumen hanya simulasi.');

  if (!actionable) return;
  const buttons = [...document.querySelectorAll('[data-act]')];
  buttons.forEach(b => (b.onclick = () => decideWith(b.dataset.act)));

  // catatan wajib untuk revisi/tolak; tombol dikunci agar tidak terkirim dua kali.
  function decideWith(action) {
    const note = $('note').value;
    const err = validateDecisionNote(action, note);
    $('note').setAttribute('aria-invalid', String(Boolean(err)));
    $('note').classList.toggle('is-invalid', !!err);
    $('note-err').textContent = err;
    if (err) return $('note').focus();
    buttons.forEach(b => (b.disabled = true));
    const at = nowLocal();
    let result;
    const saved = updateCurrentRequest(user.id, req, (st, current, i) => {
      const out = applyDecision(current, stage, action, note, { users: st.users, at, offset: st.notifications.length, roomName: room.name });
      st.requests[i] = out.request;
      st.notifications.push(...out.notifications);
      result = decisionResult(out.request, stage, action, note);
    });
    if (!saved) { location.href = 'pengajuan.html'; return; }
    if (!result) { // setuju tahap 1–2: tanpa panel
      setFlash(`Pengajuan disetujui dan diteruskan ke ${STAGE_LABELS[STAGES[STAGES.indexOf(stage) + 1]]}.`);
      location.href = 'pengajuan.html';
      return;
    }
    showResult(result);
  }

  function showResult(r) {
    $('modal-box').insertAdjacentHTML('beforeend', resultModal({ id: 'm-result', r, href: r.cta === 'Kembali ke Antrean' ? 'pengajuan.html' : `detail.html?id=${encodeURIComponent(req.id)}` }));
    new bootstrap.Modal($('m-result')).show();
  }
}
