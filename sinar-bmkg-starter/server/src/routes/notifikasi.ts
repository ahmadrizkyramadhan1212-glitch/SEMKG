import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth, type AuthRequest } from '../lib/auth.js'

export const notifikasiRouter = Router()

// GET /api/notifikasi: Ambil daftar notifikasi milik user dan jumlah yang belum dibaca
notifikasiRouter.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id
    const [notifikasi, belumDibaca] = await Promise.all([
      db.notifikasi.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.notifikasi.count({
        where: { userId, dibaca: false },
      }),
    ])
    res.json({ notifikasi, belumDibaca })
  } catch (e) {
    next(e)
  }
})

// GET /api/notifikasi/unread-count: Ambil jumlah notifikasi belum dibaca (untuk badge dashboard pemohon)
notifikasiRouter.get('/unread-count', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const belumDibaca = await db.notifikasi.count({
      where: { userId: req.user!.id, dibaca: false },
    })
    res.json({ belumDibaca })
  } catch (e) {
    next(e)
  }
})

// PATCH /api/notifikasi/:id/baca: Tandai notifikasi sebagai dibaca
notifikasiRouter.patch('/:id/baca', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await db.notifikasi.updateMany({
      where: { id: String(req.params.id), userId: req.user!.id },
      data: { dibaca: true },
    })
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// PATCH /api/notifikasi/baca-semua: Tandai semua notifikasi milik user sebagai dibaca
notifikasiRouter.patch('/baca-semua', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await db.notifikasi.updateMany({
      where: { userId: req.user!.id },
      data: { dibaca: true },
    })
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})
