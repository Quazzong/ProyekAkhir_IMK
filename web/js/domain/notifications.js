// Notifikasi. Murni. Penerima = kunci dari status machine: 'pemohon' | 'keamanan' | kunci tahap.
import { STAGES, STAGE_LABELS } from './request-status.js';

const NEXT_INFO = {
  kemahasiswaan: 'Pengajuan Anda memasuki pemeriksaan kegiatan dan dokumen pendukung.',
  kabag: 'Pengajuan Anda menunggu persetujuan akhir Kabag Umum.',
};

// event: 'submitted' | 'approve' | 'revise' | 'reject' | 'resubmitted' (pemohon tidak diberi notifikasi saat kirim ulang). ctx.stage = tahap yang memutuskan.
function forPemohon(event, r, { stage, note = '', roomName = '' }) {
  const label = STAGE_LABELS[stage];
  if (event === 'submitted') return [{ kind: 'submitted', title: 'Pengajuan berhasil dikirim', body: `${r.id} sedang menunggu Sarpras.` }];
  if (event === 'revise') return [{ kind: 'revise', title: 'Permintaan revisi', body: `${label}: ${note} Perbaiki pengajuan ${r.id}.` }];
  if (event === 'reject') return [{ kind: 'rejected', title: 'Pengajuan ditolak', body: `${note} Pilih jadwal atau ruangan lain.` }];
  if (event !== 'approve') return [];
  if (stage === 'kabag') return [{ kind: 'final', title: 'Pengajuan disetujui Kabag Umum', body: `${roomName} siap digunakan. Keamanan gedung telah menerima pemberitahuan.` }];
  const next = STAGES[STAGES.indexOf(stage) + 1];
  return [
    { kind: 'approved', title: `Pengajuan disetujui ${label}`, body: note || `Tahap ${label} selesai.` },
    { kind: 'forwarded', title: `Diteruskan ke ${STAGE_LABELS[next]}`, body: NEXT_INFO[next] },
  ];
}

export function buildNotifications(event, r, recipients, { users, at, stage = '', note = '', roomName = '' }) {
  const out = [];
  const push = (userId, msg, i = 0) => out.push({ id: `${r.id}:${msg.kind}:${userId}:${at}:${i}`, userId, requestId: r.id, ...msg, at, read: false });
  for (const key of recipients) {
    if (key === 'pemohon') forPemohon(event, r, { stage, note, roomName }).forEach((m, i) => push(r.userId, m, i));
    else if (key === 'keamanan') push('keamanan', { kind: 'final', title: 'Peminjaman disetujui', body: `${r.id} · ${roomName} · ${r.date} ${r.start}–${r.end}` });
    else for (const u of users.filter(x => x.role === key)) push(u.id, { kind: 'incoming', title: 'Pengajuan menunggu keputusan', body: `${r.id} siap ditinjau ${STAGE_LABELS[key]}.` });
  }
  return out;
}

export const markAllRead = (notifications, userId) =>
  notifications.map(n => (n.userId === userId ? { ...n, read: true } : n));

export const groupByDay = notifications => {
  // Terbaru di atas; waktu sama (resolusi menit) → yang dibuat belakangan di atas.
  const sorted = notifications.map((n, i) => [n, i]).sort(([a, i], [b, j]) => b.at.localeCompare(a.at) || j - i);
  const groups = [];
  for (const [n] of sorted) {
    const day = n.at.slice(0, 10);
    const g = groups.find(x => x.day === day);
    g ? g.items.push(n) : groups.push({ day, items: [n] });
  }
  return groups;
};
