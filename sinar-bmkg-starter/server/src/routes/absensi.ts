// Absensi: status seminar (Mulai/Selesai), halaman presensi publik, daftar peserta.
// Presensi murni dijalankan via tautan web/link ketika host mengklik tombol 'Mulai Seminar'.
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, type AuthRequest } from '../lib/auth.js'
import { audit } from '../lib/audit.js'

export const absensiRouter = Router()

// ===== Mulai seminar: DIJADWALKAN -> BERLANGSUNG (host/user pemilik, atau admin sebagai cadangan) =====
absensiRouter.post('/:id/mulai', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const seminar = await db.seminar.findUnique({ where: { id: String(req.params.id) } })
    if (!seminar) return res.status(404).json({ error: 'Seminar tidak ditemukan' })
    if (seminar.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Seminar ini bukan milik Anda' })
    if (seminar.status !== 'DIJADWALKAN') {
      return res.status(400).json({ error: `Seminar berstatus ${seminar.status}. Hanya seminar terjadwal yang dapat dimulai.` })
    }
    await db.seminar.update({ where: { id: seminar.id }, data: { status: 'BERLANGSUNG' } })
    await audit(req.user!.id, 'MULAI_SEMINAR', seminar.title, req.user!.role === 'ADMIN' ? 'oleh admin (cadangan)' : 'oleh pemilik/host')
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ===== Selesai + tutup absensi: BERLANGSUNG -> SELESAI =====
absensiRouter.post('/:id/selesai', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const seminar = await db.seminar.findUnique({ where: { id: String(req.params.id) } })
    if (!seminar) return res.status(404).json({ error: 'Seminar tidak ditemukan' })
    if (seminar.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Seminar ini bukan milik Anda' })
    if (seminar.status !== 'BERLANGSUNG') {
      return res.status(400).json({ error: `Seminar berstatus ${seminar.status}. Hanya seminar yang sedang berlangsung yang dapat diselesaikan.` })
    }
    await db.seminar.update({ where: { id: seminar.id }, data: { status: 'SELESAI' } })
    await audit(req.user!.id, 'SELESAI_SEMINAR', seminar.title, 'Presensi ditutup')
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ===== Info absensi untuk peserta (publik via link web): aktif hanya saat BERLANGSUNG =====
absensiRouter.get('/t/:token', async (req, res, next) => {
  try {
    const seminar = await db.seminar.findUnique({
      where: { attendToken: String(req.params.token) },
      select: {
        id: true,
        title: true,
        status: true,
        date: true,
        startTime: true,
        endTime: true,
        sesi: true,
        location: { select: { name: true, type: true } },
        locationOther: true,
      },
    })
    if (!seminar) return res.status(404).json({ error: 'Tautan presensi tidak valid atau tidak ditemukan' })
    res.json({
      seminar,
      bisaAbsen: seminar.status === 'BERLANGSUNG',
    })
  } catch (e) {
    next(e)
  }
})

// Batas absen: 120 kali per menit per IP
const absenLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan. Tunggu sebentar.' },
})

// ===== Kirim presensi (publik via link web) =====
// Wajib: nama_lengkap, email, ketik_ulang_email (matching email)
// Opsional: instansi, status_peserta ('Pegawai BMKG' | 'Mahasiswa' | 'Umum')
// Dihapus penuh: nip, nik, nomor_telepon, input kode hadir 6 digit, dropdown sumber_absen
absensiRouter.post('/t/:token', absenLimiter, async (req, res, next) => {
  try {
    const raw = req.body as Record<string, unknown>
    const skema = z
      .object({
        nama_lengkap: z
          .string({ error: 'Nama lengkap wajib diisi' })
          .trim()
          .min(3, 'Nama lengkap minimal 3 karakter')
          .max(100, 'Nama lengkap maksimal 100 karakter'),
        email: z
          .string({ error: 'Alamat email wajib diisi' })
          .trim()
          .email('Format alamat email tidak valid'),
        ketik_ulang_email: z
          .string({ error: 'Ketik ulang email konfirmasi wajib diisi' })
          .trim()
          .email('Format konfirmasi email tidak valid'),
        instansi: z.string().trim().max(150, 'Nama instansi maksimal 150 karakter').optional().nullable(),
        status_peserta: z.enum(['Pegawai BMKG', 'Mahasiswa', 'Umum'], {
          error: 'Pilih status peserta yang valid: Pegawai BMKG, Mahasiswa, atau Umum',
        }).optional().nullable(),
        setuju: z.boolean().optional(),
      })
      .refine(
        (data) => data.email.toLowerCase() === data.ketik_ulang_email.toLowerCase(),
        {
          message: 'Konfirmasi email tidak cocok dengan email yang dimasukkan. Harap periksa kembali penulisan email Anda.',
          path: ['ketik_ulang_email'],
        }
      )

    const parsed = skema.safeParse({
      nama_lengkap: raw.nama_lengkap ?? raw.nama,
      email: raw.email,
      ketik_ulang_email: raw.ketik_ulang_email ?? raw.email_konfirmasi,
      instansi: raw.instansi || null,
      status_peserta: raw.status_peserta || raw.statusPeserta || null,
      setuju: raw.setuju,
    })

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data presensi tidak valid' })
    }

    const { nama_lengkap, email, instansi, status_peserta } = parsed.data

    const seminar = await db.seminar.findUnique({ where: { attendToken: String(req.params.token) } })
    if (!seminar) return res.status(404).json({ error: 'Tautan presensi tidak valid' })

    // Pastikan presensi murni dijalankan via tautan web ketika host mengklik 'Mulai Seminar'
    if (seminar.status !== 'BERLANGSUNG') {
      return res.status(400).json({
        error:
          seminar.status === 'SELESAI'
            ? 'Presensi sudah ditutup — seminar telah selesai.'
            : 'Presensi belum dibuka. Seminar belum dimulai oleh host.',
      })
    }

    const emailBersih = email.toLowerCase()

    // Satu email hanya dapat absen sekali per seminar
    const ganda = await db.attendance.findFirst({
      where: { seminarId: seminar.id, email: emailBersih },
    })
    if (ganda) {
      return res.status(409).json({
        error: 'Alamat email ini sudah tercatat hadir pada seminar ini. Satu peserta hanya dapat mengisi presensi satu kali.',
      })
    }

    const hadir = await db.attendance.create({
      data: {
        seminarId: seminar.id,
        name: nama_lengkap,
        email: emailBersih,
        instansi: instansi || null,
        statusPeserta: status_peserta || null,
        source: 'WEB',
      },
    })

    await audit(
      null,
      'ABSENSI',
      seminar.title,
      `${nama_lengkap} (${emailBersih})${instansi ? ` - Instansi: ${instansi}` : ''}${status_peserta ? ` [${status_peserta}]` : ''}`
    )

    res.status(201).json({ ok: true, nama: hadir.name, email: hadir.email })
  } catch (e) {
    next(e)
  }
})

// ===== Daftar peserta (pemilik/host + admin) =====
absensiRouter.get('/:id/peserta', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const seminar = await db.seminar.findUnique({ where: { id: String(req.params.id) } })
    if (!seminar) return res.status(404).json({ error: 'Seminar tidak ditemukan' })
    if (seminar.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Seminar ini bukan milik Anda' })
    const peserta = await db.attendance.findMany({
      where: { seminarId: seminar.id },
      orderBy: { createdAt: 'asc' },
    })
    res.json(peserta)
  } catch (e) {
    next(e)
  }
})

// ===== Admin: tambah peserta manual =====
absensiRouter.post('/:id/peserta', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Hanya admin yang dapat menambah peserta manual' })
    const raw = req.body as Record<string, unknown>
    const parsed = z
      .object({
        nama_lengkap: z.string().trim().min(3, 'Nama minimal 3 karakter').max(100),
        email: z.string().trim().email('Format email tidak valid'),
        instansi: z.string().trim().max(150).optional().nullable(),
        status_peserta: z.enum(['Pegawai BMKG', 'Mahasiswa', 'Umum']).optional().nullable(),
      })
      .safeParse({
        nama_lengkap: raw.nama_lengkap ?? raw.nama,
        email: raw.email,
        instansi: raw.instansi || null,
        status_peserta: raw.status_peserta || raw.statusPeserta || null,
      })

    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' })

    const seminar = await db.seminar.findUnique({ where: { id: String(req.params.id) } })
    if (!seminar) return res.status(404).json({ error: 'Seminar tidak ditemukan' })

    const emailBersih = parsed.data.email.toLowerCase()
    const ganda = await db.attendance.findFirst({
      where: { seminarId: seminar.id, email: emailBersih },
    })
    if (ganda) return res.status(409).json({ error: 'Email sudah tercatat untuk seminar ini' })

    const hadir = await db.attendance.create({
      data: {
        seminarId: seminar.id,
        name: parsed.data.nama_lengkap,
        email: emailBersih,
        instansi: parsed.data.instansi || null,
        statusPeserta: parsed.data.status_peserta || null,
        source: 'MANUAL',
      },
    })
    await audit(req.user!.id, 'TAMBAH_PESERTA', seminar.title, parsed.data.nama_lengkap)
    res.status(201).json(hadir)
  } catch (e) {
    next(e)
  }
})

// ===== Admin: hapus peserta =====
absensiRouter.delete('/peserta/:pesertaId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Hanya admin yang dapat menghapus peserta' })
    const hadir = await db.attendance.findUnique({ where: { id: String(req.params.pesertaId) }, include: { seminar: true } })
    if (!hadir) return res.status(404).json({ error: 'Peserta tidak ditemukan' })
    await db.attendance.delete({ where: { id: hadir.id } })
    await audit(req.user!.id, 'HAPUS_PESERTA', hadir.seminar.title, hadir.name)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ===== Unduh daftar hadir CSV (pemilik/host + admin) =====
absensiRouter.get('/:id/peserta.csv', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const seminar = await db.seminar.findUnique({ where: { id: String(req.params.id) } })
    if (!seminar) return res.status(404).json({ error: 'Seminar tidak ditemukan' })
    if (seminar.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Seminar ini bukan milik Anda' })
    const peserta = await db.attendance.findMany({ where: { seminarId: seminar.id }, orderBy: { createdAt: 'asc' } })
    const baris = ['No,Nama Lengkap,Email,Instansi,Status Peserta,Waktu Presensi']
      .concat(
        peserta.map((p, i) =>
          [
            i + 1,
            `"${p.name.replaceAll('"', '""')}"`,
            p.email,
            `"${(p.instansi ?? '-').replaceAll('"', '""')}"`,
            p.statusPeserta ?? 'Umum',
            new Date(p.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
          ].join(',')
        )
      )
      .join('\r\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="daftar-hadir-${seminar.code}.csv"`)
    res.send('\uFEFF' + baris)
  } catch (e) {
    next(e)
  }
})
