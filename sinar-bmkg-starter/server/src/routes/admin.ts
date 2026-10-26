// Sisi admin: dashboard, verifikasi pengajuan, kelola semua seminar (batalkan, hapus).
import { Router } from 'express'
import { z } from 'zod'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { db } from '../db.js'
import { requireAuth, requireRole, type AuthRequest } from '../lib/auth.js'
import { audit } from '../lib/audit.js'
import { queueEmail } from '../lib/email.js'
import { buatNotifikasiPenolakan } from '../lib/notifikasi.js'
import { cekBentrok } from '../lib/bentrok.js'
import { labelJadwal } from '../lib/sesi.js'
import { jalurLokal } from '../lib/upload.js'
import { env } from '../env.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireRole('ADMIN'))

// ===== Dashboard =====
adminRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const [menunggu, totalSeminar, totalUser, totalPeserta, seminarMendatang, aktivitas, suratBelum] = await Promise.all([
      db.seminar.count({ where: { status: 'MENUNGGU_VERIFIKASI' } }),
      db.seminar.count(),
      db.user.count({ where: { active: true } }),
      db.attendance.count(),
      db.seminar.findMany({
        where: { status: 'DIJADWALKAN', date: { gte: new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z') } },
        orderBy: [{ createdAt: 'desc' }],
        take: 5,
        include: { location: true, user: { select: { name: true } } },
      }),
      db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { user: { select: { name: true } } } }),
      db.seminar.count({ where: { status: 'DIJADWALKAN', letterReceived: false } }),
    ])
    res.json({ menunggu, totalSeminar, totalUser, totalPeserta, seminarMendatang, aktivitas, suratBelum })
  } catch (e) {
    next(e)
  }
})

// Jumlah pengajuan menunggu -> lencana merah sidebar
adminRouter.get('/menunggu-count', async (_req, res, next) => {
  try {
    res.json({ jumlah: await db.seminar.count({ where: { status: 'MENUNGGU_VERIFIKASI' } }) })
  } catch (e) {
    next(e)
  }
})

// ===== Daftar pengajuan / semua seminar =====
adminRouter.get('/seminars', async (req, res, next) => {
  try {
    const cari = String(req.query.cari ?? '').trim()
    const status = String(req.query.status ?? '')
    const where = {
      ...(cari && {
        OR: [
          { title: { contains: cari } },
          { code: { contains: cari } },
          { user: { name: { contains: cari } } },
        ],
      }),
      ...(status && { status: status as never }),
    }
    const data = await db.seminar.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: { location: true, files: true, user: { select: { name: true, nip: true, email: true, unit: true } } },
    })
    res.json(data)
  } catch (e) {
    next(e)
  }
})

// ===== Setujui pengajuan: cek bentrok ulang -> DIJADWALKAN + email "serahkan surat asli" =====
adminRouter.post('/seminars/:id/setujui', async (req: AuthRequest, res, next) => {
  try {
    const seminar = await db.seminar.findUnique({ where: { id: String(req.params.id) }, include: { user: true } })
    if (!seminar) return res.status(404).json({ error: 'Seminar tidak ditemukan' })
    if (seminar.status !== 'MENUNGGU_VERIFIKASI') {
      return res.status(400).json({ error: `Seminar berstatus ${seminar.status}, bukan menunggu verifikasi` })
    }

    const bentrok = await cekBentrok({
      locationId: seminar.locationId,
      tanggal: seminar.date,
      mulai: seminar.startTime,
      selesai: seminar.endTime,
      sesi: seminar.sesi,
      abaikanSeminarId: seminar.id,
    })
    if (bentrok.length > 0) {
      return res.status(409).json({
        error: `Tidak dapat menyetujui: bentrok dengan "${bentrok[0]!.title}" (${bentrok[0]!.startTime}-${bentrok[0]!.endTime}) di lokasi yang sama.`,
      })
    }

    await db.seminar.update({ where: { id: seminar.id }, data: { status: 'DIJADWALKAN' } })
    await queueEmail({
      type: 'DISETUJUI',
      toEmail: seminar.user.email,
      toName: seminar.user.name,
      subject: `Seminar "${seminar.title}" disetujui`,
      body: [
        `Halo ${seminar.user.name},`,
        '',
        `Pengajuan seminar Anda telah DISETUJUI:`,
        `Judul: ${seminar.title}`,
        `Kode: ${seminar.code}`,
        `Jadwal: ${seminar.date.toISOString().slice(0, 10)}, ${labelJadwal(seminar.startTime, seminar.endTime)}`,
        '',
        'Silakan serahkan SURAT IZIN ASLI ke admin unit selambat-lambatnya sehari sebelum pelaksanaan.',
        'Jadwal Anda kini tampil di timeline publik.',
      ].join('\n'),
    })
    await audit(req.user!.id, 'SETUJUI_SEMINAR', seminar.title, `Kode ${seminar.code}`)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ===== Tolak / Kembalikan pengajuan: alasan penolakan wajib + notifikasi & email =====
const handleTolakSeminar = async (req: AuthRequest, res: any, next: any) => {
  try {
    const rawAlasan = String(req.body?.alasan_penolakan || req.body?.alasan || '').trim()
    if (!rawAlasan || rawAlasan.length < 5) {
      return res.status(400).json({ error: 'Alasan penolakan wajib diisi (minimal 5 karakter)' })
    }
    const seminar = await db.seminar.findUnique({ where: { id: String(req.params.id) }, include: { user: true } })
    if (!seminar) return res.status(404).json({ error: 'Seminar tidak ditemukan' })
    if (seminar.status !== 'MENUNGGU_VERIFIKASI') {
      return res.status(400).json({ error: `Seminar berstatus ${seminar.status}, bukan menunggu verifikasi` })
    }
    await db.seminar.update({ where: { id: seminar.id }, data: { status: 'DIKEMBALIKAN', returnReason: rawAlasan } })

    // Simpan ke tabel 'notifikasis' (badge dashboard pemohon) dan pemicu antrean 'EmailJob' via Nodemailer
    await buatNotifikasiPenolakan({
      userId: seminar.userId,
      seminarId: seminar.id,
      seminarTitle: seminar.title,
      seminarCode: seminar.code,
      userEmail: seminar.user.email,
      userName: seminar.user.name,
      alasanPenolakan: rawAlasan,
    })

    await audit(req.user!.id, 'TOLAK_SEMINAR', seminar.title, rawAlasan)
    res.json({ ok: true, status: 'Ditolak', alasan_penolakan: rawAlasan })
  } catch (e) {
    next(e)
  }
}

adminRouter.post('/seminars/:id/kembalikan', handleTolakSeminar)
adminRouter.post('/seminars/:id/tolak', handleTolakSeminar)

// ===== Tandai surat asli diterima =====
adminRouter.post('/seminars/:id/surat-diterima', async (req: AuthRequest, res, next) => {
  try {
    const seminar = await db.seminar.findUnique({ where: { id: String(req.params.id) } })
    if (!seminar) return res.status(404).json({ error: 'Seminar tidak ditemukan' })
    if (seminar.letterReceived) return res.status(400).json({ error: 'Surat asli sudah ditandai diterima' })
    await db.seminar.update({ where: { id: seminar.id }, data: { letterReceived: true } })
    await audit(req.user!.id, 'SURAT_ASLI_DITERIMA', seminar.title, `Kode ${seminar.code}`)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ===== Hapus permanen (beserta berkas fisik) =====
adminRouter.delete('/seminars/:id', async (req: AuthRequest, res, next) => {
  try {
    const seminar = await db.seminar.findUnique({ where: { id: String(req.params.id) }, include: { files: true } })
    if (!seminar) return res.status(404).json({ error: 'Seminar tidak ditemukan' })
    for (const f of seminar.files) {
      try {
        await fs.unlink(await jalurLokal(f.storedPath))
      } catch {
        // berkas fisik hilang bukan penghalang penghapusan data
      }
    }
    await db.seminar.delete({ where: { id: seminar.id } })
    await audit(req.user!.id, 'HAPUS_SEMINAR', seminar.title, `Kode ${seminar.code} dihapus permanen`)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ===== Batalkan seminar oleh ADMIN: tanpa persetujuan user, kirim email pemberitahuan =====
adminRouter.post('/seminars/:id/batalkan', async (req: AuthRequest, res, next) => {
  try {
    const parsed = z.object({ alasan: z.string().max(500).optional() }).safeParse(req.body ?? {})
    const seminar = await db.seminar.findUnique({ where: { id: String(req.params.id) }, include: { user: true } })
    if (!seminar) return res.status(404).json({ error: 'Seminar tidak ditemukan' })
    if (seminar.status === 'SELESAI') return res.status(400).json({ error: 'Seminar yang sudah selesai tidak dapat dibatalkan' })
    if (seminar.status === 'DIBATALKAN') return res.status(400).json({ error: 'Seminar sudah dibatalkan' })
    await db.seminar.update({
      where: { id: seminar.id },
      data: { status: 'DIBATALKAN', cancelledBy: 'ADMIN', cancelledAt: new Date() },
    })
    await queueEmail({
      type: 'DIBATALKAN',
      toEmail: seminar.user.email,
      toName: seminar.user.name,
      subject: `Seminar "${seminar.title}" dibatalkan`,
      body: [
        `Halo ${seminar.user.name},`,
        '',
        `Seminar "${seminar.title}" (${seminar.code}) telah dibatalkan oleh admin.`,
        parsed.success && parsed.data.alasan ? `Alasan: ${parsed.data.alasan}` : '',
        '',
        'Jadwal lokasi Anda telah dibebaskan. Silakan ajukan seminar baru bila diperlukan.',
      ].filter(Boolean).join('\n'),
    })
    await audit(req.user!.id, 'BATALKAN_SEMINAR_ADMIN', seminar.title, `Kode ${seminar.code}`)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})
