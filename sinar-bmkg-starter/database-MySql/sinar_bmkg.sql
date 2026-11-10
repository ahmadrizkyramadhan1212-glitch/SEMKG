-- phpMyAdmin SQL Dump
-- version 6.0.0-dev+20250324.ebd456db30
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 15, 2026 at 07:17 AM
-- Server version: 8.0.30
-- PHP Version: 8.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `SEMINAR_bmkg`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seminarId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nip` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instansi` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statusPeserta` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `peran` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Peserta',
  `alasan` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WEB',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `seminarId`, `name`, `nip`, `email`, `source`, `createdAt`) VALUES
('cmv90g46p000mydwkcm7abyu2', 'cmv90g46i000kydwkhk3nuzkc', 'Dewi Lestari', '1990010110', 'dewi.a@contoh.go.id', 'QR', '2026-10-15 04:00:10.033'),
('cmv90g46z000oydwkuvsd46lw', 'cmv90g46i000kydwkhk3nuzkc', 'Hendra Gunawan', '1990010111', 'hendra.a@contoh.go.id', 'QR', '2026-10-15 04:00:10.043'),
('cmv90g476000qydwkv2ps1u76', 'cmv90g46i000kydwkhk3nuzkc', 'Maya Sari', '1990010112', 'maya.a@contoh.go.id', 'QR', '2026-10-15 04:00:10.050'),
('cmv90g47d000sydwkhegp3olm', 'cmv90g46i000kydwkhk3nuzkc', 'Rizky Pratama', '1990010113', 'rizky.a@contoh.go.id', 'QR', '2026-10-15 04:00:10.057'),
('cmv90g48b0010ydwkkawm4ybg', 'cmv90g483000yydwk0m495eg8', 'Dewi Lestari', '1990010120', 'dewi.b@contoh.go.id', 'QR', '2026-10-15 04:00:10.091'),
('cmv90g48h0012ydwkapfr8ws1', 'cmv90g483000yydwk0m495eg8', 'Hendra Gunawan', '1990010121', 'hendra.b@contoh.go.id', 'QR', '2026-10-15 04:00:10.098'),
('cmv90g48p0014ydwkntmrjcti', 'cmv90g483000yydwk0m495eg8', 'Maya Sari', '1990010122', 'maya.b@contoh.go.id', 'QR', '2026-10-15 04:00:10.105'),
('cmv90g48w0016ydwks96yjmzb', 'cmv90g483000yydwk0m495eg8', 'Rizky Pratama', '1990010123', 'rizky.b@contoh.go.id', 'QR', '2026-10-15 04:00:10.112');

-- --------------------------------------------------------

--
-- Table structure for table `auditlog`
--

CREATE TABLE `auditlog` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `auditlog`
--

INSERT INTO `auditlog` (`id`, `userId`, `action`, `target`, `detail`, `createdAt`) VALUES
('cmv90i0ra0001ydfge1tg5qyz', 'cmv90g40f0005ydwknh5ku2u3', 'LOGIN', 'Nabila Putri', NULL, '2026-10-15 04:01:38.901'),
('cmv90ilhi0005ydfg75pyc8u9', 'cmv90g40f0005ydwknh5ku2u3', 'TAMBAH_MATERI', 'Dampak La Nina terhadap Curah Hujan', 'Dr. Bambang Sutejo, M.Si.', '2026-10-15 04:02:05.766'),
('cmv90illi0009ydfgowvhd7tq', 'cmv90g40f0005ydwknh5ku2u3', 'TAMBAH_MATERI', 'Dampak La Nina terhadap Curah Hujan', 'Tim Cuaca Maritim', '2026-10-15 04:02:05.911'),
('cmv90jcyf000fydfgwvr0rzyu', 'cmv90g40f0005ydwknh5ku2u3', 'TAYANGKAN_BERITA', 'Pemodelan Numerik Cuaca (WRF)', 'Seminar Pemodelan Numerik Cuaca WRF Berhasil', '2026-10-15 04:02:41.367'),
('cmv90jdhw000jydfgqq1uycmx', 'cmv90g40f0005ydwknh5ku2u3', 'UBAH_BERITA', 'Pemodelan Numerik Cuaca (WRF)', NULL, '2026-10-15 04:02:42.068'),
('cmv90jds7000lydfgsqrjacnh', 'cmv90g4020004ydwkew3ecskk', 'LOGIN', 'Admin SEMINAR', NULL, '2026-10-15 04:02:42.439'),
('cmv90jx8i000nydfggzbmskvm', 'cmv90g40f0005ydwknh5ku2u3', 'HAPUS_BERITA', 'Pemodelan Numerik Cuaca (WRF)', NULL, '2026-10-15 04:03:07.650'),
('cmv90mlqy000rydfgtwvy4ycf', 'cmv90g40f0005ydwknh5ku2u3', 'TAMBAH_MATERI', 'Dampak La Nina terhadap Curah Hujan', 'alert(1)Pak Budi', '2026-10-15 04:05:12.729'),
('cmv90mmad000tydfgavefyhj2', 'cmv90g40f0005ydwknh5ku2u3', 'HAPUS_MATERI', 'Dampak La Nina terhadap Curah Hujan', 'alert(1)Pak Budi', '2026-10-15 04:05:13.429'),
('cmv90n1wk000xydfg5k7t3gx2', 'cmv90g40f0005ydwknh5ku2u3', 'TAYANGKAN_BERITA', 'Pemodelan Numerik Cuaca (WRF)', '<b>Judul</b> Berita Uji Cuci Tag', '2026-10-15 04:05:33.667'),
('cmv90n2dz000zydfgneoan3sf', 'cmv90g40f0005ydwknh5ku2u3', 'HAPUS_BERITA', 'Pemodelan Numerik Cuaca (WRF)', NULL, '2026-10-15 04:05:34.296'),
('cmv913e750010ydfggusimewl', NULL, 'LOGIN_GAGAL', 'qwewew', 'NIP/email atau kata sandi salah', '2026-10-15 04:18:16.095'),
('cmv913emj0011ydfgl7dzdrmw', NULL, 'LOGIN_GAGAL', 'qwewew', 'NIP/email atau kata sandi salah', '2026-10-15 04:18:16.651'),
('cmv913go00012ydfgkr81tet0', NULL, 'LOGIN_GAGAL', '123123', 'NIP/email atau kata sandi salah', '2026-10-15 04:18:19.296'),
('cmv913h2l0013ydfgs65tliby', NULL, 'LOGIN_GAGAL', '123123', 'NIP/email atau kata sandi salah', '2026-10-15 04:18:19.822'),
('cmv913ij90014ydfgxu156ui5', NULL, 'LOGIN_GAGAL', '123123', 'NIP/email atau kata sandi salah', '2026-10-15 04:18:21.717'),
('cmv91wis00015ydfg2651xfkd', NULL, 'LOGIN_GAGAL', 'nabila.putri@bmkg.go.id', 'NIP/email atau kata sandi salah', '2026-10-15 04:40:55.054'),
('cmv91xaku0016ydfgnuyg1zhi', NULL, 'LOGIN_GAGAL', '199505052020122001', 'NIP/email atau kata sandi salah', '2026-10-15 04:41:31.086'),
('cmv91zarz0018ydfg647ip8h5', 'cmv90g40f0005ydwknh5ku2u3', 'LOGIN', 'Nabila Putri', NULL, '2026-10-15 04:43:04.653'),
('cmv9204dg001aydfgxq6mxji9', 'cmv90g40f0005ydwknh5ku2u3', 'LOGIN', 'Nabila Putri', NULL, '2026-10-15 04:43:43.013'),
('cmv920acc001cydfgkypt6g5j', 'cmv90g40f0005ydwknh5ku2u3', 'LOGIN', 'Nabila Putri', NULL, '2026-10-15 04:43:50.746'),
('cmv95a9qo001eydfgbuyexd29', 'cmv90g40f0005ydwknh5ku2u3', 'LOGIN', 'Nabila Putri', NULL, '2026-10-15 06:15:35.371'),
('cmv95bwxd001gydfgi08fe94a', 'cmv90g40f0005ydwknh5ku2u3', 'LOGIN', 'Nabila Putri', NULL, '2026-10-15 06:16:52.081'),
('cmv95hnm8001iydfg4f2dz4r5', 'cmv90g40f0005ydwknh5ku2u3', 'LOGIN', 'Nabila Putri', NULL, '2026-10-15 06:21:19.949'),
('cmv96d1vx0001ydvk7ihrcp0l', 'cmv90g40f0005ydwknh5ku2u3', 'LOGIN', 'Nabila Putri', NULL, '2026-10-15 06:45:44.774'),
('cmv96h00l0003ydvkhjsi3rip', 'cmv90g40f0005ydwknh5ku2u3', 'LOGIN', 'Nabila Putri', NULL, '2026-10-15 06:48:48.981'),
('cmv96k5kk0005ydvkw3z625i2', 'cmv90g40f0005ydwknh5ku2u3', 'UBAH_BERITA', 'Dampak La Nina terhadap Curah Hujan', NULL, '2026-10-15 06:51:16.148'),
('cmv96l4tu0007ydvkg4z5esn5', 'cmv90g40f0005ydwknh5ku2u3', 'UBAH_BERITA', 'Dampak La Nina terhadap Curah Hujan', NULL, '2026-10-15 06:52:01.842'),
('cmv96lz2i0009ydvkb1fr1imn', 'cmv90g4020004ydwkew3ecskk', 'LOGIN', 'Admin SEMINAR', NULL, '2026-10-15 06:52:41.034'),
('cmv96v5jx000bydvkhfla109w', 'cmv90g40f0005ydwknh5ku2u3', 'LOGIN', 'Nabila Putri', NULL, '2026-10-15 06:59:49.337'),
('cmv96z966000hydvk0fvoxt6j', 'cmv90g40f0005ydwknh5ku2u3', 'BUAT_SEMINAR', 'SURGA', 'Kode 2610U6W, 2026-10-29 00:21-02:13', '2026-10-15 07:03:00.653'),
('cmv973pbc000jydvkrorna4pc', 'cmv90g4020004ydwkew3ecskk', 'LOGIN', 'Admin SEMINAR', NULL, '2026-10-15 07:06:28.200'),
('cmv974g5a000mydvk73c1mggo', 'cmv90g4020004ydwkew3ecskk', 'SETUJUI_SEMINAR', 'SURGA', 'Kode 2610U6W', '2026-10-15 07:07:02.974'),
('cmv974tio000pydvktju50eb6', 'cmv90g4020004ydwkew3ecskk', 'KEMBALIKAN_SEMINAR', 'Webinar Kualitas Udara Perkotaan', 'tidak melampirkan surat izin \n', '2026-10-15 07:07:20.305'),
('cmv975lqh000qydvk34wbipic', NULL, 'LOGIN_GAGAL', 'nabila.putri@bmkg.go.id', 'NIP/email atau kata sandi salah', '2026-10-15 07:07:56.873'),
('cmv9760dh000sydvke5dosjap', 'cmv90g40f0005ydwknh5ku2u3', 'LOGIN', 'Nabila Putri', NULL, '2026-10-15 07:08:15.845'),
('cmv976t95000uydvkoi8awtqz', 'cmv90g40f0005ydwknh5ku2u3', 'MULAI_SEMINAR', 'SURGA', 'oleh pemilik', '2026-10-15 07:08:53.273'),
('cmv978ooh000wydvklkkcr3m6', 'cmv90g40f0005ydwknh5ku2u3', 'LOGIN', 'Nabila Putri', NULL, '2026-10-15 07:10:20.657'),
('cmv97a0iq000yydvknnvnwr5w', 'cmv90g4020004ydwkew3ecskk', 'LOGIN', 'Admin SEMINAR', NULL, '2026-10-15 07:11:22.659');

-- --------------------------------------------------------

--
-- Table structure for table `certificate`
--

CREATE TABLE `certificate` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attendanceId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pdfPath` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mailStatus` enum('MENUNGGU','TERKIRIM','GAGAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MENUNGGU',
  `mailError` text COLLATE utf8mb4_unicode_ci,
  `sentAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emailjob`
--

CREATE TABLE `emailjob` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('AKUN_BARU','DISETUJUI','DIKEMBALIKAN','DIBATALKAN','SERTIFIKAT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `toEmail` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `toName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachmentPath` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attachmentName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certificateId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('MENUNGGU','TERKIRIM','GAGAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MENUNGGU',
  `attempts` int NOT NULL DEFAULT '0',
  `lastError` text COLLATE utf8mb4_unicode_ci,
  `nextTryAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `sentAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `emailjob`
--

INSERT INTO `emailjob` (`id`, `type`, `toEmail`, `toName`, `subject`, `body`, `attachmentPath`, `attachmentName`, `certificateId`, `status`, `attempts`, `lastError`, `nextTryAt`, `createdAt`, `sentAt`) VALUES
('cmv974g4n000kydvkhrnmynel', 'DISETUJUI', 'nabila.putri@bmkg.go.id', 'Nabila Putri', 'Seminar \"SURGA\" disetujui', 'Halo Nabila Putri,\n\nPengajuan seminar Anda telah DISETUJUI:\nJudul: SURGA\nKode: 2610U6W\nJadwal: 2026-10-29 pukul 00:21-02:13 WIB\n\nSilakan serahkan SURAT IZIN ASLI ke admin unit selambat-lambatnya sehari sebelum pelaksanaan.\nJadwal Anda kini tampil di timeline publik.', NULL, NULL, NULL, 'MENUNGGU', 0, NULL, '2026-10-15 07:07:02.951', '2026-10-15 07:07:02.951', NULL),
('cmv974tij000nydvknnijmq1a', 'DIKEMBALIKAN', 'nabila.putri@bmkg.go.id', 'Nabila Putri', 'Pengajuan seminar \"Webinar Kualitas Udara Perkotaan\" dikembalikan', 'Halo Nabila Putri,\n\nPengajuan seminar Anda dikembalikan untuk diperbaiki dengan alasan:\ntidak melampirkan surat izin \n\n\nSilakan buka SEMINAR BMKG, perbaiki data, unggah ulang dokumen, lalu tekan Ajukan Ulang.', NULL, NULL, NULL, 'MENUNGGU', 0, NULL, '2026-10-15 07:07:20.299', '2026-10-15 07:07:20.299', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `location`
--

CREATE TABLE `location` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('PHYSICAL','ONLINE','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int DEFAULT NULL,
  `facilities` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `location`
--

INSERT INTO `location` (`id`, `key`, `name`, `type`, `capacity`, `facilities`) VALUES
('cmv90g3xy0000ydwk5s1zkydt', 'auditorium', 'Gedung Auditorium', 'PHYSICAL', 1200, 'Proyektor, sound system, AC, panggung, mikrofon, perekaman'),
('cmv90g3ze0001ydwk5qx9l2ri', 'ruang-rapat', 'Ruang Rapat Lt. 1 Gedung A', 'PHYSICAL', 30, 'Proyektor, AC, papan tulis'),
('cmv90g3zm0002ydwkndstc5kv', 'online', 'Online (Zoom Meeting)', 'ONLINE', NULL, NULL),
('cmv90g3zu0003ydwkbi4f2sjz', 'lainnya', 'Lainnya', 'OTHER', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `material`
--

CREATE TABLE `material` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seminarId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `presenter` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storedPath` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `originalName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sizeBytes` int DEFAULT NULL,
  `driveUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material`
--

INSERT INTO `material` (`id`, `seminarId`, `presenter`, `storedPath`, `originalName`, `sizeBytes`, `driveUrl`, `createdAt`) VALUES
('cmv90g47k000uydwk53zxsyzg', 'cmv90g46i000kydwkhk3nuzkc', 'Dr. Sari Utami', NULL, NULL, NULL, 'https://drive.google.com/drive/folders/contoh', '2026-10-15 04:00:10.065'),
('cmv90g4930018ydwkatwlhcrr', 'cmv90g483000yydwk0m495eg8', 'Dr. Sari Utami', NULL, NULL, NULL, 'https://drive.google.com/drive/folders/contoh', '2026-10-15 04:00:10.119'),
('cmv90ilh90003ydfgdigrgwiv', 'cmv90g46i000kydwkhk3nuzkc', 'Dr. Bambang Sutejo, M.Si.', 'materi/c450a97bede6aa8bbcbfc1ff.pdf', 'materi.pdf', 208, NULL, '2026-10-15 04:02:05.757'),
('cmv90illc0007ydfgd870srel', 'cmv90g46i000kydwkhk3nuzkc', 'Tim Cuaca Maritim', NULL, NULL, NULL, 'https://drive.google.com/file/d/abc123/view', '2026-10-15 04:02:05.904');

-- --------------------------------------------------------

--
-- Table structure for table `news`
--

CREATE TABLE `news` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seminarId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `authorId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `publishedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `news`
--

INSERT INTO `news` (`id`, `seminarId`, `authorId`, `title`, `body`, `publishedAt`, `updatedAt`) VALUES
('cmv90g47t000wydwknsswi44y', 'cmv90g46i000kydwkhk3nuzkc', 'cmv90g40f0005ydwknh5ku2u3', 'Dokumentasi Seminar La Nina Terbaru', 'Seminar berlangsung lancar dengan diskusi hangat tentang dampak La Nina terhadap curah hujan Indonesia.', '2026-10-15 04:00:10.073', '2026-10-15 06:52:01.825');

-- --------------------------------------------------------

--
-- Table structure for table `newsphoto`
--

CREATE TABLE `newsphoto` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `newsId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortOrder` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `seminar`
--

CREATE TABLE `seminar` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locationId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locationOther` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `topic` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `startTime` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endTime` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sesi` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipe_acara` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Offline',
  `zoom_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zoom_passcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('MENUNGGU_VERIFIKASI','DIKEMBALIKAN','DIJADWALKAN','BERLANGSUNG','SELESAI','DIBATALKAN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
  `returnReason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `letterReceived` tinyint(1) NOT NULL DEFAULT '0',
  `cancelledBy` enum('ADMIN','USER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancelledAt` datetime(3) DEFAULT NULL,
  `attendToken` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attendCodeOn` tinyint(1) NOT NULL DEFAULT '0',
  `attendCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certTemplatePath` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cert_templates` json DEFAULT NULL,
  `certPageMode` enum('A4_LANDSCAPE','A4_PORTRAIT','SQUARE','WIDE_16_9','AUTO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'A4_LANDSCAPE',
  `certPageRatio` double DEFAULT NULL,
  `certLayout` json DEFAULT NULL,
  `certMailSubject` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certMailBody` text COLLATE utf8mb4_unicode_ci,
  `certGeneratedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `seminar`
--

INSERT INTO `seminar` (`id`, `code`, `userId`, `locationId`, `locationOther`, `title`, `topic`, `date`, `startTime`, `endTime`, `status`, `returnReason`, `letterReceived`, `cancelledBy`, `cancelledAt`, `attendToken`, `attendCodeOn`, `attendCode`, `certTemplatePath`, `certPageMode`, `certPageRatio`, `certLayout`, `certMailSubject`, `certMailBody`, `certGeneratedAt`, `createdAt`, `updatedAt`) VALUES
('cmv90g4420008ydwkn6vvkvvs', '6BA545', 'cmv90g40f0005ydwknh5ku2u3', 'cmv90g3xy0000ydwk5s1zkydt', NULL, 'Prakiraan Iklim Ekstrem Indonesia 2027', 'Seminar ilmiah', '2026-10-15', '09:00', '11:00', 'DIJADWALKAN', NULL, 1, NULL, NULL, '3a8de72a32f233b0da920abb', 0, NULL, NULL, 'A4_LANDSCAPE', NULL, NULL, NULL, NULL, NULL, '2026-10-15 04:00:09.937', '2026-10-15 04:00:09.937'),
('cmv90g44h000aydwkjy6qeu9j', '8443E2', 'cmv90g40f0005ydwknh5ku2u3', 'cmv90g3xy0000ydwk5s1zkydt', NULL, 'Kalibrasi Sensor Suhu Otomatis', 'Seminar ilmiah', '2026-10-15', '13:00', '15:30', 'BERLANGSUNG', NULL, 1, NULL, NULL, '958688e1652d59d8c5c20503', 0, NULL, NULL, 'A4_LANDSCAPE', NULL, NULL, NULL, NULL, NULL, '2026-10-15 04:00:09.953', '2026-10-15 04:00:09.953'),
('cmv90g44q000cydwkpqkwvvrb', 'C01088', 'cmv90g40m0006ydwkp1rlqvm4', 'cmv90g3ze0001ydwk5qx9l2ri', NULL, 'Diskusi Panel Aktivitas Gempa Bumi', 'Seminar ilmiah', '2026-10-17', '10:00', '12:00', 'DIJADWALKAN', NULL, 1, NULL, NULL, '46ff1b8627e105279e3eff85', 0, NULL, NULL, 'A4_LANDSCAPE', NULL, NULL, NULL, NULL, NULL, '2026-10-15 04:00:09.962', '2026-10-15 04:00:09.962'),
('cmv90g44y000eydwkrzom89uv', '01ED5D', 'cmv90g40f0005ydwknh5ku2u3', 'cmv90g3zm0002ydwkndstc5kv', NULL, 'Webinar Kualitas Udara Perkotaan', 'Seminar ilmiah', '2026-10-19', '14:00', '16:00', 'DIKEMBALIKAN', 'tidak melampirkan surat izin \n', 0, NULL, NULL, '6311167511058312ec3bd737', 0, NULL, NULL, 'A4_LANDSCAPE', NULL, NULL, NULL, NULL, NULL, '2026-10-15 04:00:09.970', '2026-10-15 07:07:20.288'),
('cmv90g456000gydwkbaoqmlan', 'DB23DA', 'cmv90g40f0005ydwknh5ku2u3', 'cmv90g3ze0001ydwk5qx9l2ri', NULL, 'Workshop Analisis Data Hujan', 'Seminar ilmiah', '2026-10-22', '09:00', '12:00', 'DIKEMBALIKAN', 'Surat izin belum ditandatangani, mohon unggah ulang.', 0, NULL, NULL, '938c57b6785367144e49db04', 0, NULL, NULL, 'A4_LANDSCAPE', NULL, NULL, NULL, NULL, NULL, '2026-10-15 04:00:09.978', '2026-10-15 04:00:09.987'),
('cmv90g45y000iydwktk3mnyyh', '2B9C09', 'cmv90g40m0006ydwkp1rlqvm4', 'cmv90g3xy0000ydwk5s1zkydt', NULL, 'Sosialisasi Peringatan Dini Tsunami', 'Seminar ilmiah', '2026-10-20', '08:00', '09:30', 'DIBATALKAN', NULL, 1, 'USER', '2026-10-15 04:00:10.012', '476b4e3755944457310e66c6', 0, NULL, NULL, 'A4_LANDSCAPE', NULL, NULL, NULL, NULL, NULL, '2026-10-15 04:00:10.006', '2026-10-15 04:00:10.014'),
('cmv90g46i000kydwkhk3nuzkc', '50771B', 'cmv90g40f0005ydwknh5ku2u3', 'cmv90g3xy0000ydwk5s1zkydt', NULL, 'Dampak La Nina terhadap Curah Hujan', 'Seminar ilmiah', '2026-10-01', '09:00', '12:00', 'SELESAI', NULL, 1, NULL, NULL, '2d8d893628edb5ed1e667cd7', 0, NULL, NULL, 'A4_LANDSCAPE', NULL, NULL, NULL, NULL, NULL, '2026-10-15 04:00:10.026', '2026-10-15 04:00:10.026'),
('cmv90g483000yydwk0m495eg8', '5EC066', 'cmv90g40f0005ydwknh5ku2u3', 'cmv90g3xy0000ydwk5s1zkydt', NULL, 'Pemodelan Numerik Cuaca (WRF)', 'Seminar ilmiah', '2026-09-17', '09:00', '12:00', 'SELESAI', NULL, 1, NULL, NULL, 'a0c8e5eef068702b0565d425', 0, NULL, NULL, 'A4_LANDSCAPE', NULL, NULL, NULL, NULL, NULL, '2026-10-15 04:00:10.082', '2026-10-15 04:00:10.082'),
('cmv96z94s000dydvk6zr6oyxm', '2610U6W', 'cmv90g40f0005ydwknh5ku2u3', 'cmv90g3xy0000ydwk5s1zkydt', NULL, 'SURGA', 'AA', '2026-10-29', '00:21', '02:13', 'BERLANGSUNG', NULL, 0, NULL, NULL, '705c167d4b743d0781fe1fd5', 0, NULL, NULL, 'A4_LANDSCAPE', NULL, NULL, NULL, NULL, NULL, '2026-10-15 07:03:00.597', '2026-10-15 07:08:53.257');

-- --------------------------------------------------------

--
-- Table structure for table `seminarfile`
--

CREATE TABLE `seminarfile` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seminarId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` enum('SURAT_IZIN','POSTER','LAINNYA') COLLATE utf8mb4_unicode_ci NOT NULL,
  `originalName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storedPath` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sizeBytes` int NOT NULL,
  `uploadedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `seminarfile`
--

INSERT INTO `seminarfile` (`id`, `seminarId`, `kind`, `originalName`, `storedPath`, `mime`, `sizeBytes`, `uploadedAt`) VALUES
('cmv96z94t000eydvkju14suf1', 'cmv96z94s000dydvk6zr6oyxm', 'SURAT_IZIN', 'contoh sertif.png', 'seminar/fa7bde518ddf8b697f0b6b6b.png', 'image/png', 7045, '2026-10-15 07:03:00.597'),
('cmv96z94t000fydvkbauptw1r', 'cmv96z94s000dydvk6zr6oyxm', 'POSTER', 'contoh sertif.png', 'seminar/da31c27044eb2e058dd2f963.png', 'image/png', 7045, '2026-10-15 07:03:00.597');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nip` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('ADMIN','USER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `passwordHash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `nip`, `email`, `phone`, `unit`, `role`, `passwordHash`, `active`, `createdAt`) VALUES
('cmv90g4020004ydwkew3ecskk', 'Admin SEMINAR', '198001012005011001', 'admin@bmkg.go.id', '08123456789', 'Pusat Standardisasi', 'ADMIN', '$2b$10$tT98i9bUMiQ4MXhIzeLcV.UVJs3E7PLhsddfexmeNIlTRI0PQX6Q6', 1, '2026-10-15 04:00:09.794'),
('cmv90g40f0005ydwknh5ku2u3', 'Nabila Putri', '199505052020122001', 'nabila.putri@bmkg.go.id', '08123456789', 'Bidang Klimatologi', 'USER', '$2b$10$tT98i9bUMiQ4MXhIzeLcV.UVJs3E7PLhsddfexmeNIlTRI0PQX6Q6', 1, '2026-10-15 04:00:09.808'),
('cmv90g40m0006ydwkp1rlqvm4', 'Andi Pratama', '199203032018011002', 'andi.pratama@bmkg.go.id', '08123456789', 'Bidang Geofisika', 'USER', '$2b$10$tT98i9bUMiQ4MXhIzeLcV.UVJs3E7PLhsddfexmeNIlTRI0PQX6Q6', 1, '2026-10-15 04:00:09.815');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Attendance_seminarId_email_key` (`seminarId`,`email`),
  ADD UNIQUE KEY `Attendance_seminarId_nip_key` (`seminarId`,`nip`);

--
-- Indexes for table `auditlog`
--
ALTER TABLE `auditlog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `AuditLog_createdAt_idx` (`createdAt`),
  ADD KEY `AuditLog_userId_fkey` (`userId`);

--
-- Indexes for table `certificate`
--
ALTER TABLE `certificate`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Certificate_attendanceId_key` (`attendanceId`),
  ADD UNIQUE KEY `Certificate_number_key` (`number`);

--
-- Indexes for table `emailjob`
--
ALTER TABLE `emailjob`
  ADD PRIMARY KEY (`id`),
  ADD KEY `EmailJob_status_nextTryAt_idx` (`status`,`nextTryAt`);

--
-- Indexes for table `location`
--
ALTER TABLE `location`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Location_key_key` (`key`);

--
-- Indexes for table `material`
--
ALTER TABLE `material`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Material_seminarId_idx` (`seminarId`);

--
-- Indexes for table `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `News_seminarId_key` (`seminarId`),
  ADD KEY `News_authorId_fkey` (`authorId`);

--
-- Indexes for table `newsphoto`
--
ALTER TABLE `newsphoto`
  ADD PRIMARY KEY (`id`),
  ADD KEY `NewsPhoto_newsId_idx` (`newsId`);

--
-- Indexes for table `seminar`
--
ALTER TABLE `seminar`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Seminar_code_key` (`code`),
  ADD UNIQUE KEY `Seminar_attendToken_key` (`attendToken`),
  ADD KEY `Seminar_date_locationId_idx` (`date`,`locationId`),
  ADD KEY `Seminar_status_idx` (`status`),
  ADD KEY `Seminar_userId_idx` (`userId`),
  ADD KEY `Seminar_locationId_fkey` (`locationId`);

--
-- Indexes for table `seminarfile`
--
ALTER TABLE `seminarfile`
  ADD PRIMARY KEY (`id`),
  ADD KEY `SeminarFile_seminarId_idx` (`seminarId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_nip_key` (`nip`),
  ADD UNIQUE KEY `User_email_key` (`email`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `Attendance_seminarId_fkey` FOREIGN KEY (`seminarId`) REFERENCES `seminar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `auditlog`
--
ALTER TABLE `auditlog`
  ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `certificate`
--
ALTER TABLE `certificate`
  ADD CONSTRAINT `Certificate_attendanceId_fkey` FOREIGN KEY (`attendanceId`) REFERENCES `attendance` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `material`
--
ALTER TABLE `material`
  ADD CONSTRAINT `Material_seminarId_fkey` FOREIGN KEY (`seminarId`) REFERENCES `seminar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `news`
--
ALTER TABLE `news`
  ADD CONSTRAINT `News_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `News_seminarId_fkey` FOREIGN KEY (`seminarId`) REFERENCES `seminar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `newsphoto`
--
ALTER TABLE `newsphoto`
  ADD CONSTRAINT `NewsPhoto_newsId_fkey` FOREIGN KEY (`newsId`) REFERENCES `news` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `seminar`
--
ALTER TABLE `seminar`
  ADD CONSTRAINT `Seminar_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `location` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `Seminar_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `seminarfile`
--
ALTER TABLE `seminarfile`
  ADD CONSTRAINT `SeminarFile_seminarId_fkey` FOREIGN KEY (`seminarId`) REFERENCES `seminar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


--
-- Table structure for table `notifikasis`
--

CREATE TABLE IF NOT EXISTS `notifikasis` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seminarId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `judul` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pesan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENOLAKAN',
  `dibaca` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notifikasis_userId_dibaca_idx` (`userId`,`dibaca`),
  KEY `notifikasis_seminarId_idx` (`seminarId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
