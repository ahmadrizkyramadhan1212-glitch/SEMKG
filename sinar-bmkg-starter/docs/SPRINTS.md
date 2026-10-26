# Rencana sprint dan prompt

Asumsi: sekitar **40 jam per minggu** (160 jam per bulan). Perkiraan total **6-8 minggu**, dengan cadangan 25%.
Jadwal kasar (sesuaikan dengan kecepatan sebenarnya):

| Minggu | Isi |
|---|---|
| 1 | Sprint 0 (setup, tema, deploy kosong) + awal Sprint 1 |
| 2 | Sprint 1 (login, akun, audit log) |
| 3 | Sprint 2 (buat seminar, edit, aturan status) |
| 4 | Sprint 3 (Beranda timeline, riwayat) + Sprint 4 (verifikasi, batal, hapus) |
| 5 | Sprint 5 (absensi) + Sprint 6 (materi, berita, Hasil Seminar) |
| 6 | Sprint 7 (sertifikat, email, klaim, verifikasi) |
| 7 | Sprint 8 (poles, keamanan, uji, deploy) |
| 8 | Cadangan dan penulisan laporan |

Kalau waktu mepet, **Sprint 0-5 adalah inti**. Sprint 6-7 bisa disederhanakan (sertifikat: satu template unggahan, satu huruf).

## Cara memakai prompt
1. Buka proyek di alat AI. Pastikan `CLAUDE.md` (atau `.cursorrules`) terbaca.
2. Buat cabang: `git checkout -b fitur/nama-sprint`.
3. Tempel prompt sprint. Minta **rencana dulu**, setujui, baru kode.
4. Jalankan, uji di browser (termasuk kasus gagal), lalu commit dan gabung ke `main`.
5. Tulis **catatan belajar** 3 kalimat: apa yang dibuat, bagaimana alurnya, apa yang AI putuskan. Pak Husein meminta lo paham alur React, bukan sekadar menempel hasil.

---

## Sprint 0: Fondasi
**Prompt:**
> Baca `CLAUDE.md` dan `docs/SPEC.md`. Siapkan fondasi: (1) server Express TypeScript dengan `GET /api/health`, koneksi Prisma, middleware dasar (helmet, cors untuk `APP_URL`, cookie-parser, JSON, penanganan galat); (2) client Vite + React Router dengan layout publik, token desain (warna, huruf Plus Jakarta Sans), tema terang/gelap dengan tombol ikon melayang, komponen latar langit (awan, matahari/bulan, bintang) dengan pengaturan Awan bergerak/diam/polos yang disimpan di localStorage, dan halaman placeholder. Rujuk `docs/prototype/prototipe-user.html` untuk tampilan. Beri tahu rencana dulu.

**Selesai kalau:** `/api/health` menjawab, halaman tampil, tema dan pengaturan latar bekerja dan tersimpan, `npm run build` sukses.
**Tes:** ganti tema, reload (tetap), aktifkan "kurangi gerakan" di sistem (latar jadi diam).
**Jelaskan sendiri:** peran Vite vs Express, cara client memanggil API, apa itu CORS.
**Tambahan minggu 1:** deploy kosong ke server (Nginx + PM2) agar masalah jaringan ketemu sejak awal.

## Sprint 1: Login, akun, audit log
**Prompt:**
> Implementasikan autentikasi dan kelola akun sesuai SPEC bagian 5-7. Server: login (NIP atau email + sandi, "Ingat saya"), logout, `GET /api/me`, ganti sandi, JWT di cookie httpOnly, bcrypt, rate limit login, middleware `requireAuth` dan `requireRole`. Admin: CRUD akun, cek NIP/email ganda, nonaktifkan, ubah peran, reset sandi, impor Excel (xlsx) dengan laporan baris gagal. Sandi sementara dikirim lewat antrean `EmailJob` (pekerja node-cron + Nodemailer, uji dengan Mailpit). Catat ke `AuditLog` lewat satu fungsi `audit()`. Client: halaman login, header per peran, rute terlindungi, halaman Kelola Akun admin. Tampilan sesuai prototipe.

**Selesai kalau:** login benar/salah, rute admin tertutup untuk user, email sandi sementara masuk Mailpit, aksi tercatat di audit log.
**Tes gagal:** sandi salah 6 kali (kena batas), akses `/admin` sebagai user, impor Excel dengan NIP ganda, akun nonaktif mencoba login.
**Jelaskan sendiri:** alur JWT cookie, kenapa hak akses wajib di server, cara kerja antrean email.

## Sprint 2: Seminar (buat, edit, aturan status)
**Prompt:**
> Implementasikan seminar sesuai SPEC bagian 3, 4, 6. Server: `GET /api/locations`, fungsi cek bentrok (hanya PHYSICAL; status yang mengunci sesuai SPEC), `POST /api/seminars` (jadwal, judul, topik, unggah surat wajib + poster opsional dengan multer dan validasi MIME/ukuran/ekstensi), `GET /api/seminars/mine`, `PATCH` dengan aturan edit per status (MENUNGGU/DIKEMBALIKAN semua kolom; DIJADWALKAN/BERLANGSUNG/SELESAI hanya judul dan topik tanpa verifikasi ulang), `POST .../resubmit`, unggah ulang surat/poster, pembuatan `code` dan `attendToken`. Client: form Buat Seminar 3 langkah dengan indikator bentrok langsung, halaman Seminar Saya (cari, filter), detail seminar tab Detail dan Dokumen, form edit sesuai aturan, tombol Ajukan Ulang.

**Selesai kalau:** seminar tersimpan berstatus MENUNGGU_VERIFIKASI, bentrok tertolak di server (bukan hanya UI), aturan edit ditegakkan di server.
**Tes gagal:** jadwal bentrok di Auditorium (tapi tidak di Online), tanpa surat, surat 6 MB, file `.exe` diganti nama jadi `.pdf`, mengedit jadwal seminar yang sudah DIJADWALKAN (harus ditolak), user B membuka seminar user A.
**Jelaskan sendiri:** logika tumpang tindih waktu, mengapa cek bentrok di server, alur unggah berkas.

## Sprint 3: Beranda timeline, riwayat, detail publik
**Prompt:**
> Implementasikan halaman publik sesuai SPEC bagian 5. Server: endpoint publik timeline per tanggal (hanya DIJADWALKAN/BERLANGSUNG/SELESAI; untuk user login tambahkan seminar miliknya yang menunggu), daftar seminar mendatang, riwayat (SELESAI dan DIBATALKAN), detail publik. Client: Beranda dengan Timeline Seminar 4 baris lokasi 07.00-16.00 (pita PAGI dan SIANG) (navigasi hari, bulan, pilih tanggal, Hari ini; tampilan vertikal di HP; **tanpa label status**), Seminar Mendatang, Riwayat, detail seminar publik. Blok seminar muncul dengan animasi bertahap. Untuk user login, klik slot kosong membuka Buat Seminar dengan jadwal terisi.

**Tes:** pindah bulan, tampilan 390 px, seminar yang menunggu tidak terlihat publik, seminar dibatalkan tampil di riwayat.
**Jelaskan sendiri:** cara menghitung posisi blok pada timeline, state di React.

## Sprint 4: Verifikasi, batalkan, hapus
**Prompt:**
> Implementasikan sisi admin sesuai SPEC bagian 7 dan aturan status bagian 4. Server: daftar pengajuan, pratinjau berkas lewat rute berotorisasi, setujui (cek bentrok ulang, status DIJADWALKAN, `EmailJob` DISETUJUI), kembalikan (alasan wajib, email), tandai surat asli diterima, batalkan oleh user atau admin tanpa persetujuan pihak lain (admin: email pemberitahuan), hapus permanen seminar oleh admin, semua tercatat di audit log. Client: layout admin, Dashboard, Verifikasi Seminar dengan pratinjau PDF/gambar, Semua Seminar (cari, filter, Batalkan, Hapus dengan konfirmasi), Arsip & Riwayat, Audit Log. Lencana merah verifikasi.

**Tes gagal:** menyetujui seminar yang bentrok dengan yang sudah disetujui, mengembalikan tanpa alasan, user mencoba memanggil API setujui, membatalkan seminar yang sudah SELESAI.

## Sprint 5: Absensi dan status seminar
**Prompt:**
> Implementasikan tombol Mulai dan "Seminar selesai, absensi ditutup" (user, dan admin sebagai cadangan), halaman absensi publik `/absen/:attendToken` (aktif hanya BERLANGSUNG; nama, NIP, email, persetujuan; unik per email dan NIP per seminar; kode hadir 6 digit opsional yang diaktifkan user dan ditampilkan di layar), rate limit, QR dan link absensi di detail seminar (pustaka qrcode), tab Peserta & Absensi (daftar hadir, jumlah), dan sisi admin: tambah peserta manual, hapus, unduh daftar hadir.

**Tes gagal:** absen saat belum dimulai dan setelah selesai, email ganda, NIP ganda, kode hadir salah, token ngawur, tembak endpoint 20 kali beruntun.

## Sprint 6: Materi, berita, Hasil Seminar
**Prompt:**
> Implementasikan tab Materi, Berita, dan halaman Hasil Seminar sesuai SPEC bagian 6. Materi: input jumlah N lalu N form (pemateri, berkas maks 25 MB atau tautan Google Drive), hapus. Berita: satu per seminar, judul, isi, maks 10 foto (JPG/PNG/WEBP 5 MB), langsung tayang, ubah/hapus milik sendiri, galeri dengan lightbox di halaman publik, bersihkan teks (cegah XSS). Hasil Seminar: tabel Berita/Materi/Sertifikat dengan tombol cepat ke tab, lencana merah header untuk seminar SELESAI tanpa berita. Tampilkan Dokumentasi dan Materi pada detail Riwayat publik.

**Tes gagal:** 11 foto, foto 6 MB, tautan Drive tidak valid, user lain mengubah berita, materi pada seminar belum SELESAI.

## Sprint 7: Sertifikat
**Prompt:**
> Implementasikan fitur sertifikat sesuai SPEC bagian 6 (alur user) dan 5 (klaim, verifikasi). Pengaturan per seminar: unggah template (PDF/PNG/JPG/WEBP/GIF/BMP/SVG, maks 10 MB; konversi dengan sharp bila perlu), ukuran halaman otomatis dari template atau pilihan manual, elemen otomatis (nama, judul seminar, tanggal opsional, ID seminar, nomor seri, QR keaslian) masing-masing dengan aktif/nonaktif, posisi X/Y (seret + slider), ukuran, jenis huruf (10 huruf TTF di `server/assets/fonts`, daftarkan lewat fontkit), disimpan di `Seminar.certLayout` (JSON). Generate satu PDF per peserta dengan pdf-lib, nomor `SERT/BMKG/<tahun>/<code>/<urut>`, QR menuju `/verifikasi/:nomor`. Form email (subjek, isi dengan {nama} dan {judul}, penerima, lampiran) memasukkan `EmailJob`; pekerja mengirim berurutan dengan jeda, tampilkan status per penerima dan Kirim ulang. Halaman publik Klaim Sertifikat (email + NIP) dan Verifikasi Sertifikat. Pratinjau di editor harus sama dengan hasil PDF.

**Tes gagal:** nama sangat panjang, nama dengan huruf Indonesia khusus, template PDF 2 halaman, SMTP dimatikan (status Gagal lalu Kirim ulang), klaim dengan NIP salah, nomor palsu di halaman verifikasi.
**Jelaskan sendiri:** bagaimana PDF dibuat dari template, mengapa email lewat antrean.

## Sprint 8: Poles, keamanan, deploy
**Prompt:**
> Rapikan semua halaman: kondisi kosong/memuat/galat, tampilan HP (390 px), transisi halaman (View Transitions API dengan cadangan), sapuan ganti tema, kontras mode gelap, aksesibilitas dasar (fokus, label). Tinjauan keamanan terhadap SPEC bagian 9 (hak akses tiap endpoint, validasi upload, rate limit, header, XSS, unduhan berotorisasi). Siapkan skrip build, konfigurasi Nginx + PM2, cadangan `mysqldump` harian, dan panduan deploy.

**Selesai kalau:** daftar periksa keamanan lolos, aplikasi berjalan di server BMKG, cadangan database teruji dipulihkan.

---

## Daftar periksa uji akhir (jalankan satu skenario penuh)
Admin buat akun, user login, user ajukan seminar, admin kembalikan (alasan), user edit dan ajukan ulang, admin setujui (email surat asli), user Mulai, peserta absen (QR) termasuk percobaan ganda, user Selesai, user unggah materi dan berita, user buat dan kirim sertifikat (satu gagal lalu kirim ulang), peserta klaim sertifikat dan memverifikasi nomor, user dan admin masing-masing membatalkan seminar lain, admin menghapus seminar, semua tampil benar di audit log, pada HP dan mode gelap.
