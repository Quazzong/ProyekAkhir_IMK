import { requireSession, getState } from '../store.js';
import { formatDateLong, formatRange } from '../domain/dates.js';
import { STAGE_LABELS } from '../domain/request-status.js';
import { keptApprovals } from '../domain/request-view.js';
import { esc } from '../ui/components.js';

const user = requireSession('pemohon', 'masuk.html');
const s = user && getState();
if (user && !s.result) location.replace('index.html');
else if (user) init();

// Tiga keadaan: berhasil, bentrok, revisi terkirim.
function init() {
  const r = s.result;
  const req = s.requests.find(x => x.id === r.requestId);
  const slot = req ?? r;
  const room = s.rooms.find(x => x.id === slot.roomId);
  const when = `${formatDateLong(slot.date).split(', ')[1]} &nbsp;•&nbsp; ${formatRange(slot.start, slot.end)}`;
  const head = req && `${esc(req.id)} &nbsp;•&nbsp; ${esc(room.name)}`;
  const v = {
    berhasil: { ok: true, title: 'Pengajuan berhasil dikirim.', body: 'Pengajuan Anda sedang diproses oleh pihak terkait.', head, sub: 'Tahap pertama: menunggu Sarpras.', back: 'pengajuan.html', cta: ['pengajuan.html', 'Lihat Pengajuan Saya'], foot: 'Lacak persetujuan melalui Pengajuan Saya.' },
    bentrok: { ok: false, title: 'Jadwal ruangan bentrok.', body: 'Silakan pilih jadwal atau ruangan lain.', head: 'Jadwal telah terisi', sub: 'Pengajuan belum dikirim. Data tetap tersimpan.', back: 'ringkasan.html', cta: ['index.html', 'Pilih Jadwal Lain'], foot: 'Tidak ada pengajuan ganda yang dibuat.' },
    revisi: { ok: true, title: 'Revisi berhasil dikirim.', body: `Revisi Anda dikirim kembali ke ${STAGE_LABELS[r.stage]}.`, head, sub: req && keptApprovals(req, r.stage), back: 'pengajuan.html', cta: ['pengajuan.html', 'Lihat Pengajuan Saya'], foot: 'Lacak persetujuan melalui Pengajuan Saya.' },
  }[r.type];

  document.getElementById('app').innerHTML = `<div class="row"><div class="col-lg-6 mx-auto">
    <header class="d-flex align-items-center gap-2 mb-5">
      <a href="${v.back}" class="btn p-2" aria-label="Kembali"><i aria-hidden="true" class="bi bi-arrow-left fs-5"></i></a>
      <h1 class="h5 fw-bold mb-0">Hasil pengajuan</h1>
    </header>
    <div class="py-4">
      <div class="rl-result-icon mb-4" style="background:var(--${v.ok ? 'rl-ok-bg' : 'rl-danger-bg'})">
        <i aria-hidden="true" class="bi bi-${v.ok ? 'check-lg text-success' : 'exclamation-triangle text-danger'}"></i></div>
      <h2 class="fs-3 fw-bold">${v.title}</h2>
      <p class="text-secondary">${esc(v.body)}</p>
    </div>
    <div class="card mb-4"><div class="card-body"><div class="fw-semibold small">${v.head}</div>
      <div class="small text-secondary">${when}${v.sub ? `<br>${esc(v.sub)}` : ''}</div></div></div>
    <a href="${v.cta[0]}" class="btn btn-primary w-100">${v.cta[1]}</a>
    <p class="small text-secondary mt-3">${v.foot}</p>
    </div></div>`;
}
