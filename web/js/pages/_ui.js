import * as ui from '../ui/components.js';

const section = (title, html) => `<section class="mb-5"><h2 class="h6 text-uppercase text-secondary border-bottom pb-2">${title}</h2>${html}</section>`;
const S = ['Menunggu', 'Disetujui', 'Ditolak', 'Perlu Revisi', 'Dibatalkan'];
const T = ['Disetujui', 'Menunggu', 'Perlu Revisi', 'Ditolak', 'Belum diproses', 'Tidak diproses'];
const steps = [
  { name: 'Sarpras', person: 'Budi Santoso', status: 'Disetujui', note: '12 Nov, 09.10 · Sarana telah diverifikasi.' },
  { name: 'Kemahasiswaan', person: 'Rina Wulandari', status: 'Menunggu', note: 'Menunggu · Pemeriksaan berkas kegiatan.' },
  { name: 'Kabag Umum', person: 'Hendra Wijaya', status: 'Belum diproses', note: 'Belum diproses · Menunggu Kemahasiswaan.' },
];

document.getElementById('app').innerHTML = [
  section('Button', `<div class="d-grid gap-2" style="max-width:342px">${ui.button('Lanjutkan')}${ui.button('Lanjutkan', { variant: 'soft' })}${ui.button('Lanjutkan', { variant: 'danger' })}${ui.button('Lanjutkan', { state: 'disabled' })}${ui.button('Memproses…', { state: 'loading' })}</div>`),
  section('Input & Select (default / error)', `<div style="max-width:342px">${ui.field({ id: 'f1', label: 'Nama kegiatan', placeholder: 'Nama kegiatan', required: true })}${ui.field({ id: 'f2', label: 'Peserta', value: '99', required: true, error: 'Peserta melebihi kapasitas. Maksimal 12 orang.' })}${ui.select({ id: 's1', label: 'Jenis kegiatan', placeholder: 'Pilih kegiatan', options: ['Rapat', 'Kelas Pengganti', 'Acara'] })}${ui.select({ id: 's2', label: 'Jenis kegiatan', placeholder: 'Pilih kegiatan', options: ['Rapat'], error: 'Wajib dipilih.' })}</div>`),
  section('Chip status pengajuan & tahap', `<div class="d-flex flex-wrap gap-2 mb-2">${S.map(ui.statusChip).join('')}</div><div class="d-flex flex-wrap gap-2">${T.map(ui.statusChip).join('')}</div>`),
  section('Chip filter aktif', ui.filterChip('Ruang Seminar', 'jenis') + ' ' + ui.filterChip('>50 orang', 'kap')),
  section('Tanggal (default / terpilih / nonaktif)', `<div class="d-flex gap-2">${ui.dayCell(18)}${ui.dayCell(18, 'selected')}${ui.dayCell(18, 'disabled')}</div>`),
  section('Kartu ruangan', `<div style="max-width:342px">${ui.roomCard({ name: 'Ruang Seminar', capacity: 100, facilities: 'Proyektor · AC · Mikrofon' })}</div>`),
  section('Kartu pengajuan', `<div style="max-width:342px">${ui.requestCard({ id: 'RL-2026-0184', room: 'Ruang Seminar', dateTime: '18 Nov 2026, 09.00–11.00', status: 'Menunggu' })}</div>`),
  section('Kartu notifikasi (belum dibaca / dibaca)', `<div style="max-width:342px">${ui.notifCard({ title: 'Pengajuan disetujui Kabag Umum', body: 'Ruang Seminar siap digunakan.', time: '11.00 WIB', unread: true })}${ui.notifCard({ title: 'Pengajuan disetujui Kabag Umum', body: 'Ruang Seminar siap digunakan.', time: '11.00 WIB' })}</div>`),
  section('Linimasa persetujuan', `<div style="max-width:342px">${ui.stepper(steps)}</div>`),
  section('Tab Aktif / Riwayat', `<div style="max-width:342px">${ui.tabs(['Aktif', 'Riwayat'], 'Aktif')}</div>`),
  section('Dialog & Snackbar & Filter', `<div class="d-flex flex-wrap gap-2">
    <button class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#m-batal">Dialog Batalkan</button>
    <button class="btn btn-soft" data-bs-toggle="modal" data-bs-target="#m-tolak">Panel hasil (tolak)</button>
    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#m-revisi-err">Panel hasil (setuju akhir)</button>
    <button class="btn btn-soft" id="t-btn">Snackbar</button>
    <button class="btn btn-soft" data-bs-toggle="offcanvas" data-bs-target="#sheet">Filter ruangan</button></div>`),
  ui.confirmModal({ id: 'm-batal', title: 'Batalkan Pengajuan?', body: 'Apakah Anda yakin ingin membatalkan pengajuan ini?', note: 'Pengajuan yang dibatalkan masuk ke riwayat.', cancel: 'Kembali', confirm: 'Ya, Batalkan' }),
  ui.resultModal({ id: 'm-tolak', href: '#', r: { tone: 'danger', title: 'Pengajuan ditolak.', lines: ['Sarpras menghentikan proses pada tahap 1.', '', 'Catatan: Kegiatan tidak sesuai izin peminjaman.', 'Pemohon menerima notifikasi keputusan.'], cta: 'Kembali ke Antrean' } }),
  ui.resultModal({ id: 'm-revisi-err', href: '#', r: { tone: 'success', title: 'Peminjaman disetujui.', lines: ['Kabag Umum telah menyelesaikan persetujuan akhir.', '', 'RL-2026-0184 kini berstatus Disetujui.', 'Pemohon dan petugas keamanan gedung telah diberi notifikasi.'], cta: 'Lihat Status Pemohon' } }),
  ui.filterSheet({ id: 'sheet', jenis: ['Ruang Kelas', 'Ruang Seminar', 'Laboratorium', 'Ruang Rapat'], kapasitas: ['Kurang dari 25 orang', '25–50 orang', 'Lebih dari 50 orang'], jenisAktif: 'Ruang Seminar', kapasitasAktif: 'Lebih dari 50 orang' }),
  section('Menu akun pemohon & dialog info / keluar', `<div class="d-flex flex-wrap gap-2 align-items-center">${ui.profileMenu({ name: 'Alya Putri', position: 'Mahasiswa', unit: 'BEM' })}
    <button class="btn btn-soft" data-bs-toggle="modal" data-bs-target="#m-info">Dialog info</button>
    <button class="btn btn-soft" data-role="logout">Dialog keluar</button></div>`),
  ui.infoModal({ id: 'm-info', title: 'Lupa kata sandi?', body: ['Kata sandi mengikuti akun kampus Anda.', 'Untuk mengatur ulang, hubungi layanan TI kampus.'] }),
  section('Bottom nav (3 tab + badge)', `<div class="position-relative" style="height:60px;max-width:430px">${ui.bottomNav([{ label: 'Kalender', icon: 'calendar3', href: '#', active: true }, { label: 'Pengajuan Saya', icon: 'file-earmark-text', href: '#' }, { label: 'Notifikasi', icon: 'bell', href: '#', count: 2 }]).replace('fixed-bottom', 'position-absolute bottom-0 w-100')}</div>`),
  section('Navbar atas desktop (≥992)', `<div class="position-relative" style="height:72px">${ui.topNav([{ label: 'Kalender', icon: 'calendar3', href: '#', active: true }, { label: 'Pengajuan Saya', icon: 'file-earmark-text', href: '#' }, { label: 'Notifikasi', icon: 'bell', href: '#', count: 2 }], { name: 'Alya Putri', position: 'Mahasiswa', unit: 'BEM' }).replace('fixed-top', 'position-absolute top-0 w-100').replace('d-none d-lg-flex', 'd-flex')}</div>`),
  section('Sidebar portal', `<div style="height:420px;overflow:hidden">${ui.sidebar({ role: 'Sarpras', active: 'Dasbor', items: [{ label: 'Dasbor', icon: 'grid', href: '#' }, { label: 'Pengajuan Masuk', icon: 'file-earmark-text', href: '#' }, { label: 'Riwayat Keputusan', icon: 'clock-history', href: '#' }, { label: 'Pengaturan', icon: 'gear', href: '#' }] })}</div>`),
  section('Tabel portal', ui.portalTable(['No.', 'Nama Pemohon', 'Ruangan', 'Jenis Kegiatan', 'Tanggal', 'Jam', 'Status', 'Aksi'], [['01', 'Alya Putri', 'Ruang Seminar', 'Acara', '18 Nov 2026', '09.00–11.00', ui.statusChip('Menunggu'), '<a href="#">Lihat Detail →</a>']])),
].join('');

// Katalog: konfirmasi keluar tampil, tapi tombol Keluar di dialog ini mengakhiri sesi bila ada.
ui.bindLogout('masuk.html');
document.getElementById('t-btn').onclick = () => ui.showToast('Pengajuan berhasil dibatalkan.');
