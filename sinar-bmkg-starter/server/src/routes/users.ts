// Kelola akun (admin): daftar, tambah, ubah, reset sandi, impor Excel.
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { z } from 'zod'
import multer from 'multer'
import * as XLSX from 'xlsx'
import { db } from '../db.js'
import { requireAuth, requireRole, type AuthRequest } from '../lib/auth.js'
import { audit } from '../lib/audit.js'
import { queueEmail } from '../lib/email.js'

export const usersRouter = Router()
usersRouter.use(requireAuth, requireRole('ADMIN'))

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })

// Sandi sementara acak yang mudah dibaca (tanpa huruf membingungkan)
const sandiSementara = () => {
  const abjad = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from(crypto.randomBytes(10)).map((b) => abjad[b % abjad.length]).join('') + '#1'
}

const userPublik = {
  id: true, name: true, nip: true, email: true, phone: true, unit: true, role: true, active: true, createdAt: true,
} as const

// DAFTAR: cari + filter peran/status
usersRouter.get('/', async (req, res, next) => {
  try {
    const cari = String(req.query.cari ?? '').trim()
    const peran = String(req.query.peran ?? '')
    const status = String(req.query.status ?? '')
    const where = {
      ...(cari && { OR: [{ name: { contains: cari } }, { nip: { contains: cari } }, { email: { contains: cari } }] }),
      ...(peran === 'ADMIN' || peran === 'USER' ? { role: peran as 'ADMIN' | 'USER' } : {}),
      ...(status === 'aktif' ? { active: true } : status === 'nonaktif' ? { active: false } : {}),
    }
    const users = await db.user.findMany({ where, orderBy: { name: 'asc' }, select: userPublik })
    res.json(users)
  } catch (e) {
    next(e)
  }
})

const buatSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  nip: z.string().regex(/^\d{6,20}$/, 'NIP harus 6-20 angka'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().max(20).optional().or(z.literal('')),
  unit: z.string().max(120).optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
})

// TAMBAH satu akun: sandi sementara dikirim lewat antrean email
usersRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const parsed = buatSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' })
    const { name, nip, email, phone, unit, role } = parsed.data

    const ganda = await db.user.findFirst({ where: { OR: [{ nip }, { email: email.toLowerCase() }] } })
    if (ganda) {
      return res.status(409).json({
        error: ganda.nip === nip ? `NIP ${nip} sudah terdaftar atas nama ${ganda.name}` : `Email ${email} sudah terdaftar`,
      })
    }

    const sandi = sandiSementara()
    const user = await db.user.create({
      data: { name, nip, email: email.toLowerCase(), phone: phone || null, unit: unit || null, role, passwordHash: await bcrypt.hash(sandi, 10) },
      select: userPublik,
    })
    await queueEmail({
      type: 'AKUN_BARU',
      toEmail: user.email,
      toName: user.name,
      subject: 'Akun SEMINAR BMKG Anda telah dibuat',
      body: [
        `Selamat datang ${user.name},`,
        '',
        'Akun SEMINAR BMKG Anda telah dibuat oleh admin dengan rincian:',
        `NIP: ${user.nip}`,
        `Email: ${user.email}`,
        `Kata sandi sementara: ${sandi}`,
        '',
        'Silakan masuk di SEMINAR BMKG dan segera ganti kata sandi melalui menu akun Anda.',
        'Email ini dikirim otomatis, mohon tidak dibalas.',
      ].join('\n'),
    })
    await audit(req.user!.id, 'BUAT_AKUN', user.name, `NIP ${user.nip}, peran ${user.role}`)
    res.status(201).json(user)
  } catch (e) {
    next(e)
  }
})

const ubahSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().max(20).nullable().optional(),
  unit: z.string().max(120).nullable().optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  active: z.boolean().optional(),
})

// UBAH akun: nama, kontak, unit, peran, aktif/nonaktif
usersRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const parsed = ubahSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' })
    const lama = await db.user.findUnique({ where: { id: String(req.params.id) } })
    if (!lama) return res.status(404).json({ error: 'Akun tidak ditemukan' })

    const { active, role, ...data } = parsed.data
    if (lama.id === req.user!.id && ((role && role !== lama.role) || active === false)) {
      return res.status(400).json({ error: 'Anda tidak dapat menonaktifkan atau menurunkan peran akun sendiri' })
    }
    const user = await db.user.update({
      where: { id: lama.id },
      data: { ...data, ...(role && { role }), ...(active !== undefined && { active }) },
      select: userPublik,
    })
    await audit(req.user!.id, 'UBAH_AKUN', user.name, JSON.stringify(parsed.data))
    res.json(user)
  } catch (e) {
    next(e)
  }
})

// RESET SANDI: buat sandi sementara baru dan kirim lewat email
usersRouter.post('/:id/reset-sandi', async (req: AuthRequest, res, next) => {
  try {
    const user = await db.user.findUnique({ where: { id: String(req.params.id) } })
    if (!user) return res.status(404).json({ error: 'Akun tidak ditemukan' })
    const sandi = sandiSementara()
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(sandi, 10) } })
    await queueEmail({
      type: 'AKUN_BARU',
      toEmail: user.email,
      toName: user.name,
      subject: 'Pengaturan ulang kata sandi SEMINAR BMKG',
      body: [
        `Halo ${user.name},`,
        '',
        'Kata sandi akun SEMINAR BMKG Anda telah diatur ulang oleh admin.',
        `Kata sandi sementara baru: ${sandi}`,
        '',
        'Silakan masuk dan segera ganti kata sandi Anda.',
      ].join('\n'),
    })
    await audit(req.user!.id, 'RESET_SANDI', user.name, `Email ke ${user.email}`)
    res.json({ ok: true, pesan: `Kata sandi sementara dikirim ke ${user.email}` })
  } catch (e) {
    next(e)
  }
})

// IMPOR EXCEL: kolom Nama, NIP, Email, HP, Unit, Peran (opsional). Laporkan baris gagal.
usersRouter.post('/impor', upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Berkas Excel wajib diunggah' })
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0] ?? '']
    if (!sheet) return res.status(400).json({ error: 'Berkas Excel tidak memiliki lembar kerja' })
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    const gagal: { baris: number; nama: string; alasan: string }[] = []
    let sukses = 0

    // Kumpulkan NIP/email di berkas dulu untuk deteksi duplikat di dalam berkas
    const terlihatNip = new Set<string>()
    const terlihatEmail = new Set<string>()

    for (const [i, r] of rows.entries()) {
      const no = i + 2 // baris 1 adalah header
      const nama = String(r['Nama'] ?? r['nama'] ?? '').trim()
      const nip = String(r['NIP'] ?? r['nip'] ?? '').trim()
      const email = String(r['Email'] ?? r['email'] ?? '').trim().toLowerCase()
      const phone = String(r['HP'] ?? r['hp'] ?? r['No HP'] ?? '').trim() || null
      const unit = String(r['Unit'] ?? r['unit'] ?? '').trim() || null
      const peran = String(r['Peran'] ?? r['peran'] ?? 'USER').trim().toUpperCase()
      const role = peran === 'ADMIN' ? 'ADMIN' : 'USER'

      const alasan =
        !nama ? 'Nama kosong'
        : !/^\d{6,20}$/.test(nip) ? 'NIP tidak valid (harus 6-20 angka)'
        : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? 'Email tidak valid'
        : terlihatNip.has(nip) ? 'NIP ganda di dalam berkas'
        : terlihatEmail.has(email) ? 'Email ganda di dalam berkas'
        : null
      if (alasan) {
        gagal.push({ baris: no, nama: nama || '(tanpa nama)', alasan })
        continue
      }
      const ada = await db.user.findFirst({ where: { OR: [{ nip }, { email }] } })
      if (ada) {
        gagal.push({ baris: no, nama, alasan: ada.nip === nip ? `NIP sudah terdaftar (${ada.name})` : `Email sudah terdaftar (${ada.name})` })
        continue
      }
      terlihatNip.add(nip)
      terlihatEmail.add(email)
      const sandi = sandiSementara()
      await db.user.create({
        data: { name: nama, nip, email, phone, unit, role, passwordHash: await bcrypt.hash(sandi, 10) },
      })
      await queueEmail({
        type: 'AKUN_BARU',
        toEmail: email,
        toName: nama,
        subject: 'Akun SEMINAR BMKG Anda telah dibuat',
        body: [
          `Selamat datang ${nama},`,
          '',
          'Akun SEMINAR BMKG Anda telah dibuat oleh admin dengan rincian:',
          `NIP: ${nip}`,
          `Email: ${email}`,
          `Kata sandi sementara: ${sandi}`,
          '',
          'Silakan masuk dan segera ganti kata sandi Anda.',
        ].join('\n'),
      })
      sukses++
    }
    await audit(req.user!.id, 'IMPOR_AKUN', req.file.originalname, `${sukses} berhasil, ${gagal.length} gagal`)
    res.json({ sukses, gagal })
  } catch (e) {
    next(e)
  }
})

// STATUS ANTREAN EMAIL (admin): untuk halaman Kelola Akun memantau email akun terkirim
usersRouter.get('/email-terkirim/:userId', async (req, res, next) => {
  try {
    const jobs = await db.emailJob.findMany({
      where: { toEmail: (await db.user.findUnique({ where: { id: req.params.userId } }))?.email ?? '' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { type: true, status: true, createdAt: true, lastError: true },
    })
    res.json(jobs)
  } catch (e) {
    next(e)
  }
})
