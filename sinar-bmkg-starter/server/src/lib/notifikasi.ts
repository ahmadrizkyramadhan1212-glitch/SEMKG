// Layanan notifikasi internal: simpan ke tabel 'notifikasis' (untuk badge dashboard pemohon)
// dan memicu antrean 'EmailJob' via Nodemailer yang menyertakan alasan penolakan.
import { db } from '../db.js'
import { queueEmail } from './email.js'

export async function buatNotifikasiPenolakan({
  userId,
  seminarId,
  seminarTitle,
  seminarCode,
  userEmail,
  userName,
  alasanPenolakan,
}: {
  userId: string
  seminarId: string
  seminarTitle: string
  seminarCode: string
  userEmail: string
  userName: string
  alasanPenolakan: string
}) {
  // 1. Simpan ke tabel 'notifikasis' (untuk badge dashboard pemohon)
  const notif = await db.notifikasi.create({
    data: {
      userId,
      seminarId,
      judul: `Pengajuan Seminar "${seminarTitle}" Ditolak`,
      pesan: `Pengajuan seminar Anda (Kode: ${seminarCode}) ditolak oleh admin dengan alasan: "${alasanPenolakan}". Anda dapat mengedit data pengajuan dan mengajukan ulang (resubmit).`,
      tipe: 'PENOLAKAN',
      dibaca: false,
    },
  })

  // 2. Pemicu antrean 'EmailJob' via Nodemailer yang menyertakan alasan penolakan
  const emailJob = await queueEmail({
    type: 'DIKEMBALIKAN',
    toEmail: userEmail,
    toName: userName,
    subject: `[SINAR BMKG] Pengajuan Seminar "${seminarTitle}" Ditolak - Perlu Revisi`,
    body: [
      `Halo ${userName},`,
      '',
      `Pengajuan seminar Anda telah DITOLAK oleh admin dengan rincian alasan penolakan:`,
      `"${alasanPenolakan}"`,
      '',
      'Informasi Pengajuan:',
      `- Judul Seminar: ${seminarTitle}`,
      `- Kode Pengajuan: ${seminarCode}`,
      '',
      'PETUNJUK REVISI & RESUBMIT:',
      'Anda dapat mengedit data jadwal/lokasi atau mengunggah ulang berkas izin di sistem SINAR BMKG, lalu menekan tombol "Ajukan Ulang" (resubmit).',
      '',
      'Salam hangat,',
      'Administrator Seminar Ilmiah BMKG',
    ].join('\n'),
  })

  return { notif, emailJob }
}
