# SPEC: SINAR BMKG (Sistem Informasi Seminar Ilmiah)

Dokumen ini adalah **sumber kebenaran** fitur. Bila ada beda dengan prototipe atau Bab III lama, SPEC ini yang menang.
Referensi tampilan: `docs/prototype/prototipe-user.html` dan `prototipe-admin.html` (buka di browser). Diagram: `docs/diagram/`.

## 1. Ringkasan

Aplikasi web satu unit kerja untuk mengelola seminar ilmiah: pengajuan, verifikasi admin, jadwal (timeline), absensi QR, materi, sertifikat otomatis lewat email, dan berita dokumentasi.

- Peran: **User** (penyelenggara), **Admin**. Pengunjung/peserta **tanpa akun**.
- Akun **dibuat admin** (satu per satu atau impor Excel). Tidak ada pendaftaran mandiri.
- Zona waktu **WIB (Asia/Jakarta)**. Seluruh teks antarmuka **Bahasa Indonesia**.
- Izin ruang tetap surat fisik: aplikasi menyimpan salinan pindaian, admin memverifikasi, surat asli diserahkan sesudah disetujui.

## 2. Teknologi

| Bagian | Pilihan |
|---|---|
| Frontend | React + Vite (TypeScript), React Router |
| Tampilan | Tailwind CSS, shadcn/ui, lucide-react, Motion (Framer Motion) |
| Form | react-hook-form + zod |
| Backend | Node.js + Express (TypeScript) |
| Database | MySQL + Prisma |
| Auth | JWT di cookie httpOnly + bcrypt, express-rate-limit |
| PDF / QR / gambar | pdf-lib (+ fontkit), qrcode, sharp |
| Email | Nodemailer; antrean: node-cron + tabel `EmailJob` |
| Impor akun | xlsx |
| Uji email lokal | Mailpit |

Kalender bulanan (FullCalendar) **tidak dipakai**: timeline dibuat sendiri.

## 3. Lokasi

Empat pilihan tetap (tabel `Location`): Gedung Auditorium (PHYSICAL, kapasitas 1.200), Ruang Rapat Lt. 1 Gedung A (PHYSICAL), Online (Zoom Meeting) (ONLINE), Lainnya (OTHER, teks bebas di `locationOther`).
**Hanya lokasi PHYSICAL dicek bentrok.**

Sistem jadwal menggunakan sesi tetap dengan jam kerja 07.00 - 16.00 WIB:
- **PAGI** (Half-day): 07.00 - 12.00 WIB
- **SIANG** (Half-day): 12.00 - 16.00 WIB
- **FULL_DAY**: 07.00 - 16.00 WIB (bentrok dengan Pagi dan Siang)
TIDAK ADA buffer atau jeda kebersihan/sterilisasi ruangan.

Bentrok = lokasi sama + tanggal sama + rentang waktu tumpang tindih (`mulaiA < selesaiB && mulaiB < selesaiA`) dengan seminar berstatus `MENUNGGU_VERIFIKASI`, `DIJADWALKAN`, `BERLANGSUNG`, atau `SELESAI`. Batas jam yang bersentuhan (PAGI berakhir 12.00, SIANG mulai 12.00) BUKAN bentrok, sehingga PAGI dan SIANG dapat digunakan oleh dua seminar berbeda pada ruangan dan tanggal yang sama. Status `DIKEMBALIKAN` dan `DIBATALKAN` **tidak** mengunci jadwal. Cek dilakukan saat memilih jadwal, saat ajukan/ajukan ulang, dan saat admin menyetujui.

## 4. Siklus status seminar

```
MENUNGGU_VERIFIKASI --(admin setujui)--> DIJADWALKAN --(user Mulai)--> BERLANGSUNG --(user "Seminar selesai, absensi ditutup")--> SELESAI
MENUNGGU_VERIFIKASI --(admin kembalikan + alasan wajib)--> DIKEMBALIKAN --(user edit + Ajukan Ulang)--> MENUNGGU_VERIFIKASI
Sebelum SELESAI (kecuali sudah DIBATALKAN): user ATAU admin dapat membatalkan --> DIBATALKAN (tanpa persetujuan pihak lain)
```

- Mulai dan Selesai **manual** (tombol di detail seminar). Admin boleh menjalankan tombol yang sama sebagai cadangan.
- Setelah SELESAI tidak bisa dibatalkan. Seminar DIBATALKAN tampil di Riwayat dengan lencana "Dibatalkan"; jadwalnya bebas lagi. Bila admin yang membatalkan, kirim email pemberitahuan ke user.
- Admin dapat **menghapus permanen** seminar apa pun (konfirmasi, tercatat di audit log) dari Semua Seminar.
- **Timeline tidak menampilkan label status** (hanya judul dan jam). Status tampil di Seminar Saya, detail, dan Riwayat. Seminar milik user yang belum disetujui tampil redup khusus untuk pemiliknya.

### Aturan edit

| Status | Boleh diedit user |
|---|---|
| MENUNGGU_VERIFIKASI | Semua kolom (tetap di antrean) |
| DIKEMBALIKAN | Semua kolom + unggah ulang surat/poster, lalu **Ajukan Ulang** |
| DIJADWALKAN, BERLANGSUNG, SELESAI | **Hanya judul dan topik**, bebas, **tanpa verifikasi ulang**. Jadwal, lokasi, dan surat terkunci (batalkan lalu buat baru bila perlu) |

## 5. Fitur publik (tanpa login)

- **Beranda**: Timeline Seminar (4 baris lokasi, sumbu 07.00-16.00 WIB dibagi dua pita PAGI 07-12 dan SIANG 12-16 dengan pembatas di 12.00, garis "sekarang" tampil di rentang 07.00-16.00; klik slot kosong mengisi lokasi, tanggal, dan sesi; di HP berubah vertikal dengan rentang yang sama) + daftar "Seminar Mendatang". Hanya seminar yang sudah disetujui.
- **Riwayat Seminar**: seminar SELESAI dan DIBATALKAN. Detail seminar menampilkan **Dokumentasi** (berita + galeri foto dengan lightbox) dan **Materi** (unduh berkas atau buka tautan Drive) untuk yang SELESAI.
- **Absensi** `/absen/:attendToken`: aktif **hanya saat BERLANGSUNG**. Isian: nama, NIP, email, persetujuan data pribadi (+ **kode hadir 6 digit** bila diaktifkan user). Satu email dan satu NIP hanya sekali per seminar. Tampilan mobile-first. Halaman Klaim dan Verifikasi Sertifikat ditautkan di footer halaman publik.
- **Klaim sertifikat** `/klaim-sertifikat`: isi email + NIP yang cocok dengan data absensi, lalu unduh PDF sertifikat (hanya bila sudah digenerate). Cadangan bila email gagal. Dibatasi laju.
- **Verifikasi sertifikat** `/verifikasi/:nomor` (tujuan QR di sertifikat) dan kolom cek manual: menampilkan nama, seminar, tanggal bila nomor valid.
- Login `/login` (NIP atau email + sandi + "Ingat saya"). **Tanpa captcha**; pembatasan percobaan login lewat rate limit.

## 6. Fitur User

Header: **Beranda, Seminar Saya, Hasil Seminar**, menu nama akun (Ganti Kata Sandi, Keluar). Tombol **+ Buat Seminar** berada di kanan judul halaman Beranda, Seminar Saya, dan Hasil Seminar.

- **Buat Seminar (3 langkah)**: (1) Jadwal: lokasi, tanggal, pemilihan sesi (Pagi 07.00-12.00, Siang 12.00-16.00, Full-day 07.00-16.00), indikator ketersediaan sesi (terisi) dan bentrok langsung; (2) Detail: judul, topik; (3) Lampiran: **surat izin wajib** (PDF/JPG/PNG/DOC/DOCX, maks 5 MB), **poster opsional** (JPG/PNG/WEBP/PDF, maks 5 MB). Hasil: `MENUNGGU_VERIFIKASI`, jadwal terkunci.
- **Seminar Saya**: daftar + cari + filter status. Lencana merah bila ada yang DIKEMBALIKAN.
- **Detail seminar (tab)**: Detail (info, banner status, link + QR absensi, tombol Mulai/Selesai/Batalkan/Ajukan Ulang), Dokumen, Peserta & Absensi (daftar hadir, jumlah, opsi kode hadir), Materi, Sertifikat, Berita. Tab Materi, Sertifikat, Berita aktif setelah SELESAI.
- **Materi** (setelah SELESAI): user mengisi **jumlah materi N**, muncul N form: nama pemateri + berkas (maks **25 MB**: PDF/PPT/PPTX/DOC/DOCX/ZIP/JPG/PNG) **atau** tautan Google Drive. Boleh hapus.
- **Berita** (setelah SELESAI, satu per seminar): judul, isi, maks **10 foto** (JPG/PNG/WEBP, 5 MB/foto). **Langsung tayang, tanpa moderasi.** Ubah dan hapus milik sendiri.
- **Hasil Seminar**: tabel seminar SELESAI dengan kolom Berita (Tayang/Belum), Materi (jumlah), Sertifikat (Terkirim n/m atau Belum) + tombol cepat ke tab terkait. Lencana merah di header bila ada seminar SELESAI yang belum punya berita.

### Sertifikat (alur user, setelah SELESAI)

1. **Template**: unggah per seminar (PDF/PNG/JPG/WEBP/GIF/BMP/SVG, maks 10 MB). Tanda tangan dan desain **sudah bagian dari template** (rekaman pembimbing: "template doang"). Ukuran halaman mengikuti template (PDF: ukuran halaman; gambar: rasio gambar) atau dipilih manual (A4 mendatar default, A4 tegak, persegi, 16:9). Template bawaan BMKG hanya contoh/cadangan.
2. **Elemen otomatis di sertifikat** (data dari database). Tiap elemen punya: aktif/nonaktif, posisi X dan Y (persen, bisa diseret), ukuran huruf, jenis huruf, warna, rata (kiri/tengah/kanan). Disimpan sebagai JSON `Seminar.certLayout`, contoh: `{"name":{"on":true,"x":50,"y":48,"size":4,"font":"playfair","color":"#0B3C8C","align":"center"},"title":{...},"date":{"on":true,"format":"d MMMM yyyy",...},"seminarId":{...},"serial":{...},"qr":{...}}`.
   - **Nama peserta**: wajib, selalu aktif.
   - **Judul seminar**: opsional.
   - **Tanggal seminar** (tanggal bulan tahun): **opsional**, matikan bila template sudah mencantumkan tanggal.
   - **ID seminar** (`Seminar.code`): opsional, default aktif.
   - **Nomor seri** (`SERT/BMKG/<tahun>/<code>/<urut>`): default aktif, kanan atas.
   - **QR keaslian** (menuju `/verifikasi?n=<nomor>`): default aktif, kiri bawah (anti-palsu).
   - Opsional lain bila dibutuhkan: lokasi seminar, NIP peserta.
   Huruf: 10 pilihan (Playfair Display, Great Vibes, Cinzel, Allura, Pinyon Script, Dancing Script, Cormorant Garamond, Libre Baskerville, Montserrat, Times New Roman), berkas TTF di server. Prototipe baru memperlihatkan toggle elemen dengan posisi tetap; versi final wajib bisa menggeser semua elemen.
3. **Generate**: satu PDF per peserta hadir. Nomor: `SERT/BMKG/<tahun>/<Seminar.code>/<urut 3 digit>`; nomor tetap meski digenerate ulang.
4. **Form email**: subjek, isi (boleh `{nama}` dan `{judul}`), daftar penerima (centang), lampiran PDF per orang. Isi bawaan: ucapan terima kasih standar + lampiran. Tombol **Kirim** memasukkan satu `EmailJob` per penerima; pekerja node-cron mengirim berurutan dengan jeda 1-2 detik, maksimal 3 kali coba. Status per penerima: Terkirim / Gagal, tombol **Kirim ulang** untuk yang gagal.

## 7. Fitur Admin

Layout sidebar: Dashboard, Verifikasi Seminar, Semua Seminar, Kelola Akun, Arsip & Riwayat, Audit Log. Lencana merah pada Verifikasi Seminar = jumlah pengajuan menunggu.

- **Dashboard**: statistik ringkas, perlu tindakan, aktivitas terbaru, info Auditorium (1.200 orang), seminar mendatang.
- **Verifikasi Seminar**: daftar pengajuan dengan **pratinjau surat izin dan poster** (PDF/gambar di halaman), indikator bentrok, tombol **Setujui** (cek bentrok ulang, status DIJADWALKAN, email "serahkan surat asli" ke user) atau **Kembalikan** (alasan wajib, email ke user). Bagian "Surat asli belum diterima" dengan tombol tandai diterima.
- **Semua Seminar**: cari, filter status, **Batalkan**, **Hapus**, detail (Ringkasan, Dokumen, Peserta). Peserta: tambah manual (nama, NIP, email), hapus, unduh daftar hadir.
- **Kelola Akun**: tambah (nama, NIP, email dinas, HP, unit, peran), cek NIP/email ganda, **impor Excel**, reset sandi, aktif/nonaktif, ubah peran. Sandi sementara dikirim lewat email; user bebas mengganti kapan saja (tidak dipaksa).
- **Arsip & Riwayat**: seminar SELESAI/DIBATALKAN.
- **Audit Log**: semua aksi admin dan aksi penting user (login, setuju, kembalikan, batalkan, hapus, buat/ubah akun, kirim sertifikat).

## 8. Email (lewat antrean)

Jenis: AKUN_BARU (sandi sementara), DISETUJUI (serahkan surat asli), DIKEMBALIKAN (alasan), DIBATALKAN (oleh admin), SERTIFIKAT. Pengembangan: Mailpit. Uji nyata: SMTP email pribadi. Produksi: email resmi BMKG (menyusul; pengirim sementara memakai email pribadi atas arahan pembimbing). Pengaturan di `.env`, tidak di kode.

## 9. Keamanan (wajib)

- Sandi di-hash (bcrypt). JWT di cookie httpOnly + sameSite. Rate limit login dan endpoint publik (absensi, klaim, verifikasi).
- Hak akses per peran di server (middleware), bukan hanya di tampilan. User hanya mengakses seminar miliknya.
- Validasi semua input dengan zod di server. Unggahan: cek ekstensi, **MIME sebenarnya**, ukuran; nama berkas diganti acak; simpan di luar folder publik; unduh lewat rute yang memeriksa hak akses (surat izin hanya pemilik dan admin).
- Token absensi acak (tidak berurutan). Jangan menyimpan rahasia di kode atau di Git.
- Pembersihan teks bila menampilkan isi berita (cegah XSS).

## 10. Tampilan (ringkas, rujuk prototipe)

Gaya "Atmosfer": langit hidup di latar (warna mengikuti jam, awan, matahari/bulan, bintang di mode gelap), kartu kaca, hijau BMKG `#2E9E4F` dan biru `#0B3C8C`, huruf Plus Jakarta Sans, tombol utama hijau polos. Mode **terang/gelap** (ikon matahari/bulan melayang kanan bawah, sapuan lingkaran). Pengaturan latar: **Awan bergerak / Awan diam / Latar polos** (ikon awan), otomatis "diam" bila perangkat meminta kurangi gerakan. Transisi halaman: sapuan lingkaran (View Transitions API) dengan cadangan tanpa efek. Hormati `prefers-reduced-motion`.

## 11. Data contoh

`server/prisma/seed.ts`: lokasi dari terbesar ke terkecil, 1 admin + 2 user, seminar di berbagai status, peserta, materi, berita. Sandi contoh `Sinar#2026` (khusus pengembangan).

## 12. Masih terbuka (tidak menghambat pembuatan)

1. Server hanya jaringan internal atau bisa diakses dari internet (peserta absen lewat HP sendiri).
2. Akun SMTP resmi dan izin kirim massal.
3. Versi MySQL/MariaDB, hak sudo, domain dan HTTPS di server BMKG.
4. Nama unit kerja dan pejabat untuk template bawaan.
