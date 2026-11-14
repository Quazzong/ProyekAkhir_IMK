// Portal penyetuju: antrean per peran, statistik dasbor, penerapan keputusan. Murni.
import { STAGES, STAGE_LABELS, currentStage, decide } from './request-status.js';
import { buildNotifications } from './notifications.js';

export const STAGE_INFO = {
  sarpras: {
    level: 1, intro: 'Tinjau ketersediaan sarana sebelum meneruskan pengajuan ke Kemahasiswaan.',
    queueNote: 'Hanya pengajuan yang belum diputuskan Sarpras ditampilkan di sini.',
    decisionTitle: 'Keputusan Sarpras', decisionHint: 'Jika disetujui, diteruskan ke Kemahasiswaan.',
    noteHint: 'Setujui untuk melanjutkan ke tahap berikutnya.',
  },
  kemahasiswaan: {
    level: 2, intro: 'Verifikasi kegiatan dan dokumen yang sudah disetujui Sarpras.',
    queueNote: 'Hanya pengajuan yang telah disetujui Sarpras ditampilkan.',
    decisionTitle: 'Keputusan Kemahasiswaan', decisionHint: 'Jika disetujui, diteruskan ke Kabag Umum.',
    noteHint: 'Setujui untuk melanjutkan ke tahap berikutnya.',
  },
  kabag: {
    level: 3, intro: 'Berikan keputusan akhir setelah persetujuan Sarpras dan Kemahasiswaan.',
    queueNote: 'Hanya pengajuan yang telah disetujui Kemahasiswaan ditampilkan.',
    decisionTitle: 'Keputusan akhir Kabag Umum', decisionHint: 'Pemohon dan keamanan gedung akan diberi notifikasi.',
    noteHint: 'Persetujuan akhir mengunci jadwal ruangan.',
  },
};

// Pengajuan yang sudah sampai tahap ini (bukan Belum/Tidak diproses, bukan Dibatalkan).
export const reachedStage = (requests, stage) =>
  requests.filter(r => r.status !== 'Dibatalkan' && !['Belum diproses', 'Tidak diproses'].includes(r.stages[stage]));

export const pendingFor = (requests, stage) => requests.filter(r => currentStage(r) === stage);

// month: 'YYYY-MM' (berdasarkan tanggal diajukan).
export function statsFor(requests, stage, month) {
  const inMonth = reachedStage(requests, stage).filter(r => r.createdAt.startsWith(month));
  return {
    total: inMonth.length,
    pending: pendingFor(requests, stage).length,
    approved: inMonth.filter(r => r.stages[stage] === 'Disetujui').length,
    rejected: inMonth.filter(r => r.stages[stage] === 'Ditolak').length,
  };
}

// Keputusan + catatan waktu tahap + notifikasi. Mengembalikan {request, notifications}.
export function applyDecision(req, stage, action, note, { users, at, roomName }) {
  const { request, notify } = decide(req, stage, action, note);
  request.stageAt = { ...req.stageAt, [stage]: at };
  const event = { approve: 'approve', revise: 'revise', reject: 'reject' }[action];
  return { request, notifications: buildNotifications(event, request, notify, { users, at, stage, note: note.trim(), roomName }) };
}

// Teks panel hasil keputusan. null = tidak ada panel (setuju tahap 1–2).
export function decisionResult(req, stage, action, note) {
  const label = STAGE_LABELS[stage];
  const lvl = STAGE_INFO[stage].level;
  const back = stage === 'kemahasiswaan' ? 'Lihat Status Pemohon' : 'Kembali ke Antrean';
  if (action === 'revise') return { tone: 'primary', title: 'Permintaan revisi dikirim.', lines: [`${label} menghentikan proses pada tahap ${lvl}.`, '', `Catatan: ${note.trim()}`, 'Pemohon menerima notifikasi keputusan.'], cta: back };
  if (action === 'reject') return { tone: 'danger', title: 'Pengajuan ditolak.', lines: [`${label} menghentikan proses pada tahap ${lvl}.`, '', `Catatan: ${note.trim()}`, 'Pemohon menerima notifikasi keputusan.'], cta: back };
  if (stage === 'kabag') return { tone: 'success', title: 'Peminjaman disetujui.', lines: ['Kabag Umum telah menyelesaikan persetujuan akhir.', '', `${req.id} kini berstatus Disetujui.`, 'Pemohon dan petugas keamanan gedung telah diberi notifikasi.'], cta: 'Lihat Status Pemohon' };
  return null;
}
