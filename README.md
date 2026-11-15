# RoomLink

Prototipe web untuk peminjaman ruangan kampus (ruang kelas, ruang seminar, laboratorium, ruang rapat). Proyek akhir mata kuliah Interaksi Manusia dan Komputer (IMK).

Web statis tanpa backend dan database. Login, cek bentrok jadwal, persetujuan, dan notifikasi disimulasikan di browser. Data disimpan di `localStorage`.

## Teknologi

- HTML5, [Bootstrap](https://getbootstrap.com/) 5.3, JavaScript vanilla (ES modules).
- Penyimpanan data: `localStorage` (Web Storage API) di browser.
- Bootstrap, Bootstrap Icons, dan font Inter disimpan lokal di `web/vendor/`, jadi aplikasi jalan offline.

## Menjalankan

Aplikasi harus dibuka lewat server lokal. Kalau dibuka lewat `file://`, browser memblokir ES modules.

**1. Python** (dari root repo):

```
python3 -m http.server 5173 -d web
```

Lalu buka http://localhost:5173/masuk.html.

**2. VS Code**: 
- pasang ekstensi Live Server, buka folder `web/`
- klik kanan `masuk.html`, 
- lalu pilih **Open with Live Server**.

Untuk reset data ke kondisi awal, tambahkan `?reset=1` di URL, contoh `masuk.html?reset=1`.

## Akun demo

Kata sandi bebas, asal tidak kosong. Semua nama dan email di bawah fiktif.

| Peran | Nama | Login |
|---|---|---|
| Pemohon | Alya Putri | `alya@kampus.ac.id` / NIM `2310110012` |
| Sarpras (tahap 1) | Budi Santoso | `budi@kampus.ac.id` |
| Kemahasiswaan (tahap 2) | Rina Wulandari | `rina@kampus.ac.id` |
| Kabag Umum (tahap 3) | Hendra Wijaya | `hendra@kampus.ac.id` |

- Semua peran memakai `masuk.html` yang sama.
- Setelah login, pemohon diarahkan ke `index.html` dan penyetuju ke `penyetuju/index.html`.
- Halaman yang dibuka tanpa sesi akan dialihkan ke `masuk.html`.
- Keluar membuka dialog konfirmasi. Setelah keluar, sesi dan draf pengajuan dihapus.

## Peran dan tampilan

| Peran | Tampilan |
|---|---|
| Pemohon (mahasiswa, pengurus UKM, dosen) | Mobile-first, dengan bottom nav. Mulai lebar ≥992 px (breakpoint `lg` Bootstrap): navbar atas dan layout dua kolom. |
| Penyetuju (Sarpras, Kemahasiswaan, Kabag Umum) | Portal desktop dengan sidebar: Dasbor, Pengajuan Masuk, Riwayat Keputusan, Pengaturan. |

## Alur pengajuan

```
Kalender → Ruangan → Formulir → Ringkasan → Kirim → Sarpras → Kemahasiswaan → Kabag Umum → Disetujui
```

- **Status pengajuan**: `Menunggu`, `Perlu Revisi`, `Disetujui`, `Ditolak`, `Dibatalkan`.
- **Status per tahap**: `Menunggu`, `Disetujui`, `Perlu Revisi`, `Ditolak`, `Belum diproses`, `Tidak diproses`.
- **Persetujuan berurutan.** Status `Disetujui` hanya diberikan setelah Kabag Umum menyetujui.
- **Revisi atau Tolak** menghentikan proses di tahap tersebut. Tahap berikutnya menjadi `Tidak diproses`. Catatan wajib diisi.
- **Revisi**: pemohon memperbaiki pengajuan lalu mengirim ulang ke tahap yang meminta revisi. Persetujuan tahap sebelumnya tetap berlaku.
- **Batalkan** bisa dilakukan saat status `Menunggu`, `Perlu Revisi`, atau `Disetujui`.
- Setiap perubahan status mengirim notifikasi ke pemohon. Persetujuan akhir juga mengirim notifikasi ke petugas keamanan.

## Aturan validasi

- Tanggal lampau tidak bisa dipilih.
- Jam tersedia setiap 30 menit dari 07.00 sampai 21.00. Jam selesai harus setelah jam mulai.
- Jumlah peserta tidak boleh melebihi kapasitas ruangan.
- Kontak harus nomor HP Indonesia (`08…`, `62…`, `+62…`) atau email.
- Lampiran opsional, format PDF, DOC/DOCX, atau JPG, maksimal 10 MB. Unggahan hanya simulasi: yang disimpan cuma nama dan ukuran file.
- **Cek bentrok** dijalankan ulang saat kirim:
  - Slot ruangan terpakai oleh pengajuan berstatus `Menunggu`, `Perlu Revisi`, atau `Disetujui`.
  - Interval setengah terbuka, jadi jadwal yang selesai 11.00 tidak bentrok dengan yang mulai 11.00.
  - Kalau bentrok, pengajuan tidak terkirim dan draf tetap tersimpan.

## Struktur

```
web/
  masuk.html              login (semua peran)
  index.html              kalender (beranda pemohon)
  ruangan.html            daftar ruangan tersedia + filter
  ajukan.html             formulir (ajukan.html?id= untuk perbaikan revisi)
  ringkasan.html          konfirmasi sebelum kirim
  hasil.html              hasil kirim (berhasil / bentrok / revisi terkirim)
  pengajuan.html          daftar pengajuan (Aktif / Riwayat)
  pengajuan-detail.html   detail + linimasa persetujuan (?id=)
  notifikasi.html
  penyetuju/              index (dasbor), pengajuan, detail, riwayat, pengaturan
  css/
    theme.css             design token + override variabel Bootstrap
    app.css               gaya yang tidak tersedia di Bootstrap
  js/
    domain/               logika bisnis tanpa DOM: status machine, validasi, cek bentrok,
                          persetujuan, notifikasi, auth, format tanggal
    data/seed.js          data awal (ruangan, akun, pengajuan)
    ui/                   komponen render HTML (components.js, portal.js)
    pages/                satu modul per halaman
    store.js              state di localStorage (key roomlink.state): sesi, draf, flash
  vendor/                 Bootstrap, Bootstrap Icons, Inter
```

- Logika bisnis hanya ada di `js/domain/`. Modul halaman tinggal memanggilnya.
- Data antarhalaman dikirim lewat `store.js`, bukan query string. Pengecualiannya `?id=`.

## Keterbatasan

- Data hanya ada di browser yang dipakai, tidak tersinkron antarperangkat.
- Login hanya mencocokkan akun demo. Kata sandi tidak diverifikasi.
- Belum ada layar untuk Petugas Keamanan. Notifikasinya tetap dicatat di data.
