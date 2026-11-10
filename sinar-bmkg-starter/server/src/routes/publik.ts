// Rute publik (tanpa login): timeline, seminar mendatang, riwayat, detail.
// Seminar milik user yang belum disetujui HANYA tampil untuk pemiliknya (redup), tidak untuk publik.
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, type AuthRequest } from '../lib/auth.js'

export const publikRouter = Router()

const tampilPublik = ['DIJADWALKAN', 'BERLANGSUNG', 'SELESAI'] as const

const pilih = {
  id: true, code: true, title: true, topic: true, date: true, startTime: true, endTime: true, sesi: true,
  tipe_acara: true, zoom_link: true, zoom_passcode: true,
  status: true, locationId: true, locationOther: true, location: true, userId: true,
} as const

// Opsional kenali user (boleh tamu): pakai middleware requireAuth yang tidak memaksa
import { COOKIE_NAME } from '../lib/auth.js'
import jwt from 'jsonwebtoken'
import { env } from '../env.js'
import { jalurLokal } from '../lib/upload.js'

async function userOpsional(req: AuthRequest): Promise<{ id: string; role: 'ADMIN' | 'USER' } | null> {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined
  if (!token) return null
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { sub?: string }
    if (!payload.sub) return null
    const u = await db.user.findUnique({ where: { id: payload.sub } })
    return u && u.active ? { id: u.id, role: u.role } : null
  } catch {
    return null
  }
}

// Rate limiter khusus endpoint publik jadwal seminar BMKG
const jadwalPublikLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit window
  limit: 60, // 60 request per menit per IP
  standardHeaders: true,
  legacyHeaders: true,
  message: {
    ok: false,
    error: 'Terlalu banyak permintaan ke API jadwal. Silakan coba kembali dalam 1 menit.',
  },
})

// ===== REST API JADWAL PUBLIK (UNTUK INTEGRASI PORTAL BMKG) =====
// GET /api/publik/jadwal
// Hanya menampilkan seminar berstatus 'Setuju' / 'Approved' (DIJADWALKAN).
// Parameter: tanggal_mulai (YYYY-MM-DD), tanggal_selesai (YYYY-MM-DD).
// Proteksi privasi: TANPA data pribadi peserta (nama, email, nip, dsb). Dilindungi rate-limiting.
publikRouter.get('/jadwal', jadwalPublikLimiter, async (req, res, next) => {
  try {
    const tanggalMulai = req.query.tanggal_mulai
      ? String(req.query.tanggal_mulai).trim()
      : req.query.startDate
        ? String(req.query.startDate).trim()
        : req.query.from
          ? String(req.query.from).trim()
          : undefined

    const tanggalSelesai = req.query.tanggal_selesai
      ? String(req.query.tanggal_selesai).trim()
      : req.query.endDate
        ? String(req.query.endDate).trim()
        : req.query.to
          ? String(req.query.to).trim()
          : undefined

    const tglRegex = /^\d{4}-\d{2}-\d{2}$/
    if (tanggalMulai && !tglRegex.test(tanggalMulai)) {
      return res.status(400).json({
        ok: false,
        error: 'Parameter tanggal_mulai tidak valid. Gunakan format YYYY-MM-DD.',
      })
    }
    if (tanggalSelesai && !tglRegex.test(tanggalSelesai)) {
      return res.status(400).json({
        ok: false,
        error: 'Parameter tanggal_selesai tidak valid. Gunakan format YYYY-MM-DD.',
      })
    }

    if (tanggalMulai && tanggalSelesai && tanggalMulai > tanggalSelesai) {
      return res.status(400).json({
        ok: false,
        error: 'Parameter tanggal_mulai tidak boleh lebih besar dari tanggal_selesai.',
      })
    }

    const dateFilter: any = {}
    if (tanggalMulai) {
      dateFilter.gte = new Date(`${tanggalMulai}T00:00:00.000Z`)
    }
    if (tanggalSelesai) {
      dateFilter.lte = new Date(`${tanggalSelesai}T23:59:59.999Z`)
    }

    // Filter status: HANYA seminar yang berstatus 'Setuju' / 'Approved' (DIJADWALKAN)
    const statusParam = req.query.status ? String(req.query.status).trim().toUpperCase() : ''
    const statusFilter = statusParam === 'ALL_APPROVED' || statusParam === 'SEMUA'
      ? { in: ['DIJADWALKAN', 'BERLANGSUNG', 'SELESAI'] as const }
      : statusParam && ['DIJADWALKAN', 'BERLANGSUNG', 'SELESAI'].includes(statusParam)
        ? statusParam
        : 'DIJADWALKAN'

    const where: any = {
      status: statusFilter,
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    }

    // Proteksi Privasi Ketat: Tidak mengambil relasi attendance (nama/email peserta)!
    const seminars = await db.seminar.findMany({
      where,
      select: {
        id: true,
        code: true,
        title: true,
        topic: true,
        date: true,
        startTime: true,
        endTime: true,
        sesi: true,
        tipe_acara: true,
        zoom_link: true,
        zoom_passcode: true,
        status: true,
        locationOther: true,
        location: {
          select: {
            id: true,
            key: true,
            name: true,
            type: true,
            capacity: true,
          },
        },
        user: {
          select: {
            name: true,
            unit: true,
          },
        },
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    const data = seminars.map((s) => {
      const namaLokasi = s.locationOther?.trim() || s.location.name
      const tglIso = s.date.toISOString().slice(0, 10)
      const isOnline = s.tipe_acara === 'Online' || s.tipe_acara === 'Hybrid' || s.location.type === 'ONLINE'

      return {
        id: s.id,
        kode: s.code,
        judul: s.title,
        topik: s.topic || null,
        tanggal: tglIso,
        jam_mulai: s.startTime,
        jam_selesai: s.endTime,
        sesi: s.sesi || null,
        tipe_acara: s.tipe_acara || (s.location.type === 'ONLINE' ? 'Online' : 'Offline'),
        lokasi: {
          nama: namaLokasi,
          tipe: s.location.type,
          kapasitas: s.location.capacity ?? null,
        },
        penyelenggara: {
          nama: s.user.name,
          unit_kerja: s.user.unit || null,
        },
        daring: isOnline
          ? {
              zoom_link: s.zoom_link || null,
              zoom_passcode: s.zoom_passcode || null,
            }
          : null,
        status: s.status,
        status_label: 'Disetujui',
        total_peserta_terdaftar: s._count.attendances,
      }
    })

    res.json({
      ok: true,
      keterangan: 'Jadwal Seminar Ilmiah BMKG (Disetujui / Approved)',
      filter: {
        tanggal_mulai: tanggalMulai || null,
        tanggal_selesai: tanggalSelesai || null,
        status_filter: typeof statusFilter === 'string' ? statusFilter : 'ALL_APPROVED',
        total: data.length,
      },
      data,
    })
  } catch (e) {
    next(e)
  }
})

// TIMELINE per tanggal / rentang tanggal (Hari, Minggu, Bulan).
// Publik hanya lihat yang disetujui; user login juga lihat miliknya yang menunggu.
publikRouter.get('/timeline', async (req: AuthRequest, res, next) => {
  try {
    const q = z
      .object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      })
      .safeParse(req.query)
    if (!q.success) return res.status(400).json({ error: 'Parameter tanggal tidak valid' })

    const dateFilter =
      q.data.startDate && q.data.endDate
        ? {
            gte: new Date(`${q.data.startDate}T00:00:00.000Z`),
            lte: new Date(`${q.data.endDate}T00:00:00.000Z`),
          }
        : q.data.date
          ? new Date(`${q.data.date}T00:00:00.000Z`)
          : new Date(new Date().toLocaleDateString('en-CA') + 'T00:00:00.000Z')

    const user = await userOpsional(req)
    const seminar = await db.seminar.findMany({
      where: {
        date: dateFilter,
        OR: [
          { status: { in: [...tampilPublik] } },
          // milik user login yang belum disetujui pun tampil (redup) di timeline miliknya
          ...(user ? [{ userId: user.id, status: { in: ['MENUNGGU_VERIFIKASI', 'DIKEMBALIKAN'] as never[] } }] : []),
        ],
      },
      select: {
        ...pilih,
        _count: { select: { materials: true, attendances: true } },
        news: { select: { id: true, title: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })
    const lokasi = await db.location.findMany({ orderBy: { capacity: 'desc' } })
    res.json({
      lokasi,
      seminar: seminar.map((s) => ({
        ...s,
        // penanda untuk client: redup + tidak bisa diklik publik
        milik: user ? s.userId === user.id : false,
      })),
    })
  } catch (e) {
    next(e)
  }
})

// SEMINAR MENDATANG: mulai besok sampai 30 hari ke depan, hanya yang disetujui
publikRouter.get('/mendatang', async (_req, res, next) => {
  try {
    // Mulai HARI INI (WIB), bukan besok, supaya seminar yang berlangsung hari ini ikut tampil
    const besok = new Date(Date.now() + 7 * 3600 * 1000)
    besok.setUTCHours(0, 0, 0, 0)
    const batas = new Date(besok)
    batas.setUTCDate(batas.getUTCDate() + 30)
    const data = await db.seminar.findMany({
      where: { status: { in: ['DIJADWALKAN', 'BERLANGSUNG'] }, date: { gte: besok, lte: batas } },
      select: pilih,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 12,
    })
    res.json(data)
  } catch (e) {
    next(e)
  }
})

// RIWAYAT: seminar SELESAI dan DIBATALKAN
publikRouter.get('/riwayat', async (req, res, next) => {
  try {
    const halaman = Math.max(1, Number(req.query.halaman ?? 1))
    const perHalaman = 20
    const where = { status: { in: ['SELESAI', 'DIBATALKAN'] as never[] } }
    const [data, total] = await Promise.all([
      db.seminar.findMany({
        where,
        select: {
          ...pilih,
          _count: { select: { materials: true, attendances: true } },
          news: { select: { id: true, title: true, photos: { take: 1, select: { id: true } } } },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip: (halaman - 1) * perHalaman,
        take: perHalaman,
      }),
      db.seminar.count({ where }),
    ])
    res.json({ data, total, halaman, totalHalaman: Math.ceil(total / perHalaman) })
  } catch (e) {
    next(e)
  }
})

// DETAIL PUBLIK: hanya yang disetujui; milik user menunggu hanya untuk pemilik/admin
publikRouter.get('/seminar/:id', async (req: AuthRequest, res, next) => {
  try {
    const seminar = await db.seminar.findUnique({
      where: { id: String(req.params.id) },
      select: { ...pilih, returnReason: true, user: { select: { name: true, unit: true } } },
    })
    if (!seminar) return res.status(404).json({ error: 'Seminar tidak ditemukan' })
    const user = await userOpsional(req)
    const publikLihat = (tampilPublik as readonly string[]).includes(seminar.status)
    const milik = user ? seminar.userId === user.id : false
    if (!publikLihat && !(milik || user?.role === 'ADMIN')) {
      return res.status(403).json({ error: 'Seminar ini belum dipublikasikan' })
    }

    // Dokumentasi & materi hanya untuk seminar yang sudah selesai (SPEC bagian 5)
    const [berita, materi] =
      seminar.status === 'SELESAI'
        ? await Promise.all([
            db.news.findUnique({
              where: { seminarId: seminar.id },
              include: {
                photos: { orderBy: { sortOrder: 'asc' } },
                author: { select: { name: true, unit: true } },
              },
            }),
            db.material.findMany({ where: { seminarId: seminar.id }, orderBy: { createdAt: 'asc' }, select: { id: true, presenter: true, originalName: true, driveUrl: true, sizeBytes: true } }),
          ])
        : [null, []]

    const bolehLihatDrive = milik || user?.role === 'ADMIN'
    const materiDiproteksi = materi.map((m: any) => ({
      ...m,
      driveUrl: bolehLihatDrive ? m.driveUrl : null,
      driveProtected: !bolehLihatDrive && !!m.driveUrl,
    }))
    res.json({ ...seminar, milik, berita, materi: materiDiproteksi })
  } catch (e) {
    next(e)
  }
})

// Foto berita: publik hanya bila berita milik seminar SELESAI
publikRouter.get('/foto/:id', async (req, res, next) => {
  try {
    const foto = await db.newsPhoto.findUnique({ where: { id: String(req.params.id) }, include: { news: { include: { seminar: true } } } })
    if (!foto) return res.status(404).json({ error: 'Foto tidak ditemukan' })
    if (foto.news.seminar.status !== 'SELESAI') return res.status(403).json({ error: 'Dokumentasi belum dipublikasikan' })
    res.sendFile(await jalurLokal(foto.path))
  } catch (e) {
    next(e)
  }
})

// Unduh berkas materi: publik hanya bila seminar SELESAI (tautan Drive ditangani client)
publikRouter.get('/materi/:id', async (req, res, next) => {
  try {
    const materi = await db.material.findUnique({ where: { id: String(req.params.id) }, include: { seminar: true } })
    if (!materi?.storedPath) return res.status(404).json({ error: 'Berkas materi tidak ditemukan' })
    if (materi.seminar.status !== 'SELESAI') return res.status(403).json({ error: 'Materi belum dipublikasikan' })
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(materi.originalName ?? 'materi')}"`)
    res.sendFile(await jalurLokal(materi.storedPath))
  } catch (e) {
    next(e)
  }
})
