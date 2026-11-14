// Data mock fiktif.
export const seed = {
  users: [
    { id: 'u1', name: 'Alya Putri', role: 'pemohon', login: 'alya@kampus.ac.id', nim: '2310001' },
    { id: 'u2', name: 'Budi Santoso', role: 'sarpras', login: 'budi@kampus.ac.id' },
    { id: 'u3', name: 'Rina Wulandari', role: 'kemahasiswaan', login: 'rina@kampus.ac.id' },
    { id: 'u4', name: 'Hendra Wijaya', role: 'kabag', login: 'hendra@kampus.ac.id' },
  ],
  rooms: [
    { id: 'r1', name: 'Ruang Seminar', type: 'Ruang Seminar', capacity: 100, facilities: 'Proyektor · AC · Mikrofon' },
    { id: 'r2', name: 'Ruang Kelas A', type: 'Ruang Kelas', capacity: 40, facilities: 'Proyektor · AC · Papan tulis' },
    { id: 'r3', name: 'Ruang Lab Komputer', type: 'Laboratorium', capacity: 30, facilities: 'Komputer · Wi-Fi · AC' },
    { id: 'r4', name: 'Ruang Rapat', type: 'Ruang Rapat', capacity: 15, facilities: 'Layar · Wi-Fi · AC' },
  ],
  requests: [
    { id: 'RL-2026-0184', userId: 'u1', roomId: 'r1', date: '2026-11-20', start: '09:00', end: '11:00',
      kind: 'Acara', attendees: 80, status: 'Menunggu',
      stages: { sarpras: 'Menunggu', kemahasiswaan: 'Belum diproses', kabag: 'Belum diproses' } },
  ],
  notifications: [],
};
