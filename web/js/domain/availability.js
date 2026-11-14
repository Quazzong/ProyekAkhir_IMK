// Cek bentrok jadwal + filter ruangan. Murni, tanpa DOM.
import { createRequest } from './request-status.js';

// Status yang masih memegang slot. Perlu Revisi ikut karena dikirim ulang dengan jadwal yang sama.
const HOLDS_SLOT = ['Menunggu', 'Perlu Revisi', 'Disetujui'];

// Jam 'HH:MM'; interval setengah terbuka: selesai 11:00 tidak bentrok dengan mulai 11:00.
export const overlaps = (a, b) =>
  a.roomId === b.roomId && a.date === b.date && a.start < b.end && b.start < a.end;

export const hasConflict = (requests, slot, excludeId = null) =>
  requests.some(r => r.id !== excludeId && HOLDS_SLOT.includes(r.status) && overlaps(r, slot));

// cek ulang saat kirim. Bentrok → tidak ada pengajuan dibuat.
export function submit(requests, data, id) {
  if (hasConflict(requests, data)) return { conflict: true };
  return { conflict: false, ...createRequest(data, id) };
}

export const CAPACITY_RANGES = {
  '<25': c => c < 25,
  '25–50': c => c >= 25 && c <= 50,
  '>50': c => c > 50,
};

// slot: {date, start, end}; filter: {type?, capacity?} (kunci CAPACITY_RANGES).
export const availableRooms = (rooms, requests, slot, { type = '', capacity = '' } = {}) =>
  rooms.filter(room =>
    (!type || room.type === type) &&
    (!capacity || CAPACITY_RANGES[capacity](room.capacity)) &&
    !hasConflict(requests, { ...slot, roomId: room.id }));
