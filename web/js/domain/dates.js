// Format tampilan tanggal/jam + grid kalender. Murni.
import { toISODate, pad } from './validation.js';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const parse = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };

export const formatDateLong = iso => { const d = parse(iso); return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
export const formatDateShort = iso => { const d = parse(iso); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; };
export const formatDateWithDay = iso => `${DAYS[parse(iso).getDay()]}, ${formatDateShort(iso)}`;
export const formatTime = t => t.replace(':', '.');
export const formatRange = (start, end) => `${formatTime(start)}–${formatTime(end)}`;
export const monthLabel = (year, month) => `${MONTHS[month]} ${year}`;

// month 0–11. Minggu dimulai Senin. lead = sel kosong sebelum tanggal 1.
export function monthGrid(year, month) {
  const count = new Date(year, month + 1, 0).getDate();
  return {
    lead: (new Date(year, month, 1).getDay() + 6) % 7,
    days: Array.from({ length: count }, (_, i) => toISODate(new Date(year, month, i + 1))),
  };
}

// 'HH:MM' tiap 30 menit, from–to jam.
export const timeSlots = (from = 7, to = 21) =>
  Array.from({ length: (to - from) * 2 + 1 }, (_, i) => {
    const m = from * 60 + i * 30;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`;
  });

// Waktu lokal 'YYYY-MM-DDTHH:MM' (tanpa zona).
export const nowLocal = (d = new Date()) => `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const formatClock = at => `${formatTime(at.slice(11, 16))} WIB`; // 11.00 WIB
export const formatDateTime = at => `${formatDateShort(at.slice(0, 10))}, ${formatTime(at.slice(11, 16))}`; // 12 Nov 2026, 08.30
export const formatDayMonth = at => { const d = parse(at.slice(0, 10)); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; }; // 12 Nov
export const formatSize = bytes => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace(/\.0$/, '')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
