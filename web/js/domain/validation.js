// Validasi isian. Fungsi mengembalikan pesan error, '' bila valid.
export const MSG = {
  REQUIRED: 'Wajib diisi.',
  PAST_DATE: 'Tanggal sudah lewat.',
  TIME_ORDER: start => `Waktu selesai harus lebih dari pukul ${start.replace(':', '.')}.`,
  CAPACITY: max => `Peserta melebihi kapasitas. Maksimal ${max} orang.`,
  ATTENDEES: 'Isi jumlah peserta dengan angka.',
  CONTACT: 'Masukkan nomor HP atau email yang valid.',
  FILE_TYPE: 'Format file harus PDF, DOC, atau JPG.',
  FILE_SIZE: 'Ukuran file maksimal 10 MB.',
};

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
const FILE_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg'];
export const KINDS = ['Rapat', 'Kelas Pengganti', 'Acara'];

const pad = n => String(n).padStart(2, '0');
// Tanggal lokal YYYY-MM-DD (toISOString menggeser hari di WIB sebelum 07.00).
export const toISODate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const isPastDate = (date, today = new Date()) => date < toISODate(today);

// slot: {date, start, end}, jam 'HH:MM'. Mengembalikan {date?, start?, end?}.
export function validateSlot({ date, start, end }, today = new Date()) {
  const e = {};
  if (!date) e.date = MSG.REQUIRED;
  else if (isPastDate(date, today)) e.date = MSG.PAST_DATE;
  if (!start) e.start = MSG.REQUIRED;
  if (!end) e.end = MSG.REQUIRED;
  else if (start && end <= start) e.end = MSG.TIME_ORDER(start);
  return e;
}

export function validateAttendees(value, capacity) {
  const s = String(value ?? '').trim();
  if (!s) return MSG.REQUIRED;
  if (!/^\d+$/.test(s) || +s < 1) return MSG.ATTENDEES;
  return +s > capacity ? MSG.CAPACITY(capacity) : '';
}

// HP Indonesia (08…, 62…, +62…, boleh spasi/strip) atau email.
export function validateContact(value = '') {
  const s = value.trim();
  if (!s) return MSG.REQUIRED;
  const phone = /^(\+62|62|0)8\d{7,11}$/.test(s.replace(/[\s-]/g, ''));
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  return phone || email ? '' : MSG.CONTACT;
}

// file: {name, size} (File browser cocok). Opsional → null valid.
export function validateAttachment(file) {
  if (!file) return '';
  const ext = file.name.split('.').pop().toLowerCase();
  if (!file.name.includes('.') || !FILE_EXT.includes(ext)) return MSG.FILE_TYPE;
  return file.size > MAX_FILE_BYTES ? MSG.FILE_SIZE : '';
}

// Formulir 05. Mengembalikan {field: pesan}; kosong = valid.
export function validateRequestForm(form, room) {
  const e = {};
  for (const f of ['name', 'description']) if (!form[f]?.trim()) e[f] = MSG.REQUIRED;
  if (!KINDS.includes(form.kind)) e.kind = MSG.REQUIRED;
  const att = validateAttendees(form.attendees, room.capacity);
  if (att) e.attendees = att;
  const contact = validateContact(form.contact);
  if (contact) e.contact = contact;
  const file = validateAttachment(form.attachment);
  if (file) e.attachment = file;
  return e;
}
