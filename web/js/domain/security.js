// Petugas Keamanan (HTA 9). Murni, tanpa DOM.
// 9.1 daftar pemakaian terverifikasi (Disetujui) per tanggal; 9.2 hasil pencocokan di lokasi.
import { NOTE_REQUIRED } from './request-status.js';

export const CHECK_RESULTS = ['Sesuai', 'Tidak Sesuai'];

export const usageOn = (requests, date) =>
  requests.filter(r => r.status === 'Disetujui' && r.date === date).sort((a, b) => a.start.localeCompare(b.start));

// Tanggal terdekat (≥ from) yang punya pemakaian; kalau tidak ada, yang terakhir sebelum from; null bila kosong sama sekali.
export function nearestUsageDate(requests, from) {
  const dates = [...new Set(requests.filter(r => r.status === 'Disetujui').map(r => r.date))].sort();
  return dates.find(d => d >= from) ?? dates.at(-1) ?? null;
}

export const checkStatus = req => req.check?.result ?? 'Belum dicek';

export const validateCheck = (result, note = '') =>
  result === 'Tidak Sesuai' && !note.trim() ? NOTE_REQUIRED : '';

export function applyCheck(req, { result, note = '', at, by }) {
  if (!CHECK_RESULTS.includes(result)) throw new Error(`Hasil tidak dikenal: ${result}`);
  if (req.status !== 'Disetujui') throw new Error('Hanya pemakaian Disetujui yang dapat diperiksa.');
  const error = validateCheck(result, note);
  if (error) return { error };
  return { request: { ...req, check: { result, note: note.trim(), at, by } } };
}

export const checkSummary = list => ({
  total: list.length,
  checked: list.filter(r => r.check).length,
  pending: list.filter(r => !r.check).length,
  mismatch: list.filter(r => r.check?.result === 'Tidak Sesuai').length,
});
