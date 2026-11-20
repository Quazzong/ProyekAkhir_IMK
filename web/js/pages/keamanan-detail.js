// HTA 9.2: cocokkan detail peminjaman dengan pengguna di lokasi → Sesuai / Tidak Sesuai.
import { getState, updateCurrentRequest, setFlash } from '../store.js';
import { mountPortal } from '../ui/portal.js';
import { portalSteps } from '../domain/request-view.js';
import { applyCheck, checkStatus } from '../domain/security.js';
import { formatDateWithDay, formatRange, formatDateTime, nowLocal } from '../domain/dates.js';
import { statusChip, stepperH, textarea, esc, roomPhoto } from '../ui/components.js';

const user = mountPortal({ kind: 'keamanan', active: 'Jadwal Pemakaian', crumbs: ['Jadwal Pemakaian', 'Pemeriksaan'], roleChip: false });
const id = new URLSearchParams(location.search).get('id');
if (user && !getState().requests.find(r => r.id === id && r.status === 'Disetujui')) location.replace('index.html');
else if (user) init();

function init() {
  const $ = k => document.getElementById(k);
  const s = getState();
  const req = s.requests.find(r => r.id === id);
  const room = s.rooms.find(r => r.id === req.roomId);
  const u = s.users.find(x => x.id === req.userId);
  const row = (k, v) => `<div class="row py-2"><div class="col-4 small text-secondary">${k}</div><div class="col-8">${v}</div></div>`;
  const prow = (k, v) => `<div class="small text-secondary">${k}</div><div class="mb-2">${v}</div>`;
  const c = req.check;

  $('content').innerHTML = `
    <a href="index.html" class="small fw-semibold text-decoration-none d-inline-block mb-3"><i aria-hidden="true" class="bi bi-chevron-left me-2"></i>Jadwal Pemakaian</a>
    <div class="d-flex justify-content-between align-items-start mb-4">
      <div><h1 class="fs-2 fw-bold mb-1">Pemeriksaan Pemakaian</h1>
        <p class="text-secondary mb-0">${esc(req.id)} &nbsp;•&nbsp; Disetujui Kabag Umum${req.stageAt?.kabag ? `, ${formatDateTime(req.stageAt.kabag)} WIB` : ''}</p></div>
      ${statusChip(checkStatus(req))}
    </div>
    <div class="mb-4">${stepperH(portalSteps(req, null))}</div>
    <div class="row g-4">
      <div class="col-8 d-flex flex-column gap-4">
        <div class="card"><div class="card-body p-4">
          <h2 class="fs-5 fw-semibold mb-3">Informasi peminjaman</h2>
          <div class="d-flex gap-3 pb-3 mb-2 border-bottom">${roomPhoto(room.id, 'rl-photo-md')}
            <div><div class="fs-4 fw-semibold">${esc(room.name)}</div>
              <div class="small text-secondary">${[room.location, `Kapasitas ${room.capacity} orang`].filter(Boolean).map(esc).join(' &nbsp;•&nbsp; ')}</div>
              <div class="text-primary mt-2">${formatDateWithDay(req.date)} &nbsp;•&nbsp; ${formatRange(req.start, req.end)} WIB</div></div></div>
          ${row('Nama kegiatan', `<span class="fw-semibold">${esc(req.name)}</span>`)}
          ${row('Jenis kegiatan', esc(req.kind))}
          ${row('Jumlah peserta', `${req.attendees} orang`)}
          ${row('Deskripsi', esc(req.description))}
        </div></div>
        <div class="rounded-3 bg-soft p-3 small">
          <div class="fw-semibold text-primary mb-1">Yang dicocokkan di lokasi</div>
          Ruangan dan jam sesuai jadwal · penanggung jawab hadir (nama, NIM/unit) · jumlah peserta tidak melebihi kapasitas ${room.capacity} orang.
        </div>
      </div>
      <div class="col-4 d-flex flex-column gap-4">
        <div class="card"><div class="card-body p-4">
          <h2 class="fs-5 fw-semibold mb-3">Penanggung jawab</h2>
          <div class="fs-5 fw-semibold mb-2">${esc(u.name)}</div>
          ${prow('Status', esc([u.position, u.unitFull ?? u.unit].filter(Boolean).join(' · ') || '—'))}
          ${u.nim ? prow('NIM', esc(u.nim)) : ''}
          ${prow('Kontak', esc(req.contact))}
          ${prow('Email', esc(u.login))}
        </div></div>
        <div class="card"><div class="card-body p-4" id="check"></div></div>
      </div>
    </div>`;

  function renderCheck(error = '', note = c?.note ?? '') {
    $('check').innerHTML = `
      <h2 class="fs-5 fw-semibold mb-1">Hasil pemeriksaan</h2>
      <p class="small text-secondary mb-3">Tidak Sesuai wajib disertai catatan.</p>
      ${c ? `<div class="rounded-3 small p-3 mb-3 ${c.result === 'Sesuai' ? 'rl-ok-box' : 'rl-danger-box'}">
        <div class="fw-semibold">${esc(c.result)} · ${formatDateTime(c.at)} WIB</div>${c.note ? `<div>${esc(c.note)}</div>` : ''}</div>` : ''}
      ${textarea({ id: 'note', label: 'Catatan pemeriksaan', placeholder: 'Contoh: Ruangan dipakai kelompok lain.', value: note, error })}
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-danger-soft flex-fill" data-result="Tidak Sesuai">Tidak Sesuai</button>
        <button type="button" class="btn btn-primary flex-fill" data-result="Sesuai">Sesuai</button>
      </div>`;
  }

  $('check').onclick = e => {
    const b = e.target.closest('[data-result]');
    if (!b) return;
    const note = $('note').value;
    let error;
    const saved = updateCurrentRequest(user.id, req, (s, current, i) => {
      const out = applyCheck(current, { result: b.dataset.result, note, at: nowLocal(), by: user.id });
      error = out.error;
      if (!error) s.requests[i] = out.request;
    });
    if (error) { renderCheck(error, note); $('note').focus(); return; }
    if (saved) setFlash(`${req.id} ditandai ${b.dataset.result}.`);
    location.href = 'index.html';
  };
  renderCheck();
}
