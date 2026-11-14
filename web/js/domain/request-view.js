// Teks tampilan Detail pengajuan: baris linimasa + catatan bawah. Murni.
import { STAGES, STAGE_LABELS } from './request-status.js';
import { formatDayMonth, formatTime } from './dates.js';

// Teks tugas tahap yang sedang menunggu.
const TASK = { sarpras: 'Verifikasi ketersediaan sarana.', kemahasiswaan: 'Pemeriksaan berkas kegiatan.', kabag: 'Persetujuan akhir.' };
const stamp = at => (at ? `${formatDayMonth(at)}, ${formatTime(at.slice(11, 16))}` : '');

// users: seed.users. Mengembalikan input untuk ui.stepper.
export function stepperSteps(req, users) {
  return STAGES.map((stage, i) => {
    const status = req.stages[stage];
    const note = req.notes?.[stage];
    const when = stamp(req.stageAt?.[stage]);
    let line;
    if (status === 'Menunggu') line = `Menunggu · ${TASK[stage]}`;
    else if (status === 'Belum diproses') line = `Belum diproses · Menunggu ${STAGE_LABELS[STAGES[i - 1]]}.`;
    else if (status === 'Tidak diproses') line = 'Tidak diproses · Tahap sebelumnya berhenti.';
    else line = [when, note].filter(Boolean).join(' · ');
    return { name: STAGE_LABELS[stage], person: users.find(u => u.role === stage)?.name ?? '', status, note: line };
  });
}

// Catatan di bawah linimasa; '' bila tidak ada.
export function flowNote(req) {
  const stopped = STAGES.find(s => ['Perlu Revisi', 'Ditolak'].includes(req.stages[s]));
  if (req.status === 'Menunggu') return 'Persetujuan berlangsung secara berurutan.';
  if (req.status === 'Perlu Revisi') return 'Proses berhenti. Data pengajuan tetap tersimpan.';
  if (req.status === 'Ditolak') return `Proses berhenti di ${STAGE_LABELS[stopped]}.`;
  return '';
}

// Linimasa horizontal portal. viewer = tahap milik penyetuju yang sedang membuka.
export function portalSteps(req, viewer) {
  return STAGES.map(stage => {
    const status = req.stages[stage];
    const at = stamp(req.stageAt?.[stage]);
    const sub = status === 'Menunggu' ? (stage === viewer ? 'Menunggu keputusan Anda' : 'Menunggu keputusan')
      : ['Disetujui', 'Perlu Revisi', 'Ditolak'].includes(status) ? [status, at].filter(Boolean).join(' · ')
        : status;
    return { name: STAGE_LABELS[stage], status, sub };
  });
}

// Tahap yang meminta revisi, atau null.
export const revisionStage = req => STAGES.find(s => req.stages[s] === 'Perlu Revisi') ?? null;

// Kotak info perbaikan: "Kemahasiswaan: lengkapi surat izin UKM.".
export function revisionHint(req) {
  const stage = revisionStage(req);
  const note = req.notes?.[stage] ?? '';
  return stage ? `${STAGE_LABELS[stage]}: ${note.charAt(0).toLowerCase()}${note.slice(1)}` : '';
}

// Baris revisi terkirim: "Persetujuan Sarpras tetap tersimpan." ('' bila revisi diminta di tahap pertama).
export function keptApprovals(req, stage) {
  const done = STAGES.slice(0, STAGES.indexOf(stage)).filter(s => req.stages[s] === 'Disetujui').map(s => STAGE_LABELS[s]);
  return done.length ? `Persetujuan ${done.join(' dan ')} tetap tersimpan.` : '';
}
