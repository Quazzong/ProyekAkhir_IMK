// Status machine pengajuan. Murni: data masuk → data baru keluar, tanpa DOM/storage.
// Penerima notifikasi dikembalikan sebagai kunci peran: 'pemohon' | 'keamanan' | kunci tahap.

export const STAGES = ['sarpras', 'kemahasiswaan', 'kabag'];
export const STAGE_LABELS = { sarpras: 'Sarpras', kemahasiswaan: 'Kemahasiswaan', kabag: 'Kabag Umum' };
export const NOTE_REQUIRED = 'Catatan wajib diisi.';

const DECISION_STATUS = { approve: 'Disetujui', revise: 'Perlu Revisi', reject: 'Ditolak' };
const CANCELLABLE = ['Menunggu', 'Disetujui', 'Perlu Revisi'];

// Aktif = Menunggu, Perlu Revisi; sisanya Riwayat.
export const isHistory = status => ['Disetujui', 'Ditolak', 'Dibatalkan'].includes(status);

export function actionsFor(status) {
  return {
    Menunggu: ['cancel'],
    Disetujui: ['cancel'],
    'Perlu Revisi': ['resubmit', 'cancel'],
    Ditolak: ['findOther'],
  }[status] ?? [];
}

// Tahap yang sedang menunggu keputusan, atau null.
export const currentStage = req =>
  req.status === 'Menunggu' ? STAGES.find(s => req.stages[s] === 'Menunggu') ?? null : null;

// catatan wajib untuk revisi/tolak. '' bila valid.
export const validateDecisionNote = (action, note = '') =>
  action !== 'approve' && !note.trim() ? NOTE_REQUIRED : '';

export function createRequest(data, id) {
  return {
    request: {
      ...structuredClone(data), id, status: 'Menunggu', notes: {},
      stages: { sarpras: 'Menunggu', kemahasiswaan: 'Belum diproses', kabag: 'Belum diproses' },
    },
    notify: ['pemohon', 'sarpras'],
  };
}

// action: 'approve' | 'revise' | 'reject'.
export function decide(req, stage, action, note = '') {
  if (!DECISION_STATUS[action]) throw new Error(`Aksi tidak dikenal: ${action}`);
  if (currentStage(req) !== stage) throw new Error(`Bukan giliran tahap ${stage}`);
  const err = validateDecisionNote(action, note);
  if (err) throw new Error(err);

  const r = structuredClone(req);
  const i = STAGES.indexOf(stage);
  const later = STAGES.slice(i + 1);
  r.stages[stage] = DECISION_STATUS[action];
  r.notes = { ...r.notes, [stage]: note.trim() }; // timpa: catatan revisi lama tidak tertinggal

  if (action === 'approve') {
    if (later.length) {
      r.stages[later[0]] = 'Menunggu';
      return { request: r, notify: ['pemohon', later[0]] };
    }
    r.status = 'Disetujui';
    return { request: r, notify: ['pemohon', 'keamanan'] };
  }
  for (const s of later) r.stages[s] = 'Tidak diproses';
  r.status = DECISION_STATUS[action];
  return { request: r, notify: ['pemohon'] };
}

// kembali ke tahap yang meminta revisi; persetujuan sebelumnya tetap.
// Jadwal tidak bisa diubah pada perbaikan, jadi tidak perlu cek bentrok ulang.
export function resubmit(req, changes = {}) {
  if (req.status !== 'Perlu Revisi') throw new Error('Hanya pengajuan Perlu Revisi yang bisa dikirim ulang');
  const stage = STAGES.find(s => req.stages[s] === 'Perlu Revisi');
  const r = { ...structuredClone(req), ...structuredClone(changes), status: 'Menunggu' };
  // "Dokumen lama tetap tersimpan." → lampiran lama yang diganti disimpan di riwayat.
  const old = req.attachment;
  if (old && 'attachment' in changes && (changes.attachment?.name !== old.name || changes.attachment?.size !== old.size)) r.previousAttachments = [...(req.previousAttachments ?? []), old];
  r.stages = { ...req.stages, [stage]: 'Menunggu' };
  for (const s of STAGES.slice(STAGES.indexOf(stage) + 1)) r.stages[s] = 'Belum diproses';
  return { request: r, notify: [stage] };
}

export function cancel(req) {
  if (!CANCELLABLE.includes(req.status)) throw new Error(`Pengajuan ${req.status} tidak bisa dibatalkan`);
  return { ...structuredClone(req), status: 'Dibatalkan' };
}

// Format RL-2026-0184.
export function nextRequestId(requests, year) {
  const prefix = `RL-${year}-`;
  const max = Math.max(0, ...requests.filter(r => r.id.startsWith(prefix)).map(r => +r.id.slice(prefix.length)));
  return prefix + String(max + 1).padStart(4, '0');
}
