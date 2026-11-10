// API Publik Terbuka v1 untuk Integrasi & Web Crawling portal BMKG
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'

export const apiV1Router = Router()

// Dokumentasi Endpoint API
apiV1Router.get('/', (_req, res) => {
  res.json({
    name: 'SEMINAR BMKG Public Integration API',
    version: '1.0.0',
    description: 'API Publik untuk crawling dan integrasi jadwal/data seminar ilmiah BMKG ke website utama atau portal internal BMKG.',
    endpoints: {
      'GET /api/v1/seminars': 'Mengambil daftar seminar ilmiah (bisa difilter tanggal, status, lokasi, pencarian kata kunci)',
      'GET /api/v1/seminars/:id': 'Mengambil detail lengkap seminar tertentu beserta informasi pemateri dan berita',
    },
    filterParams: {
      status: 'Filter status (misal: DIJADWALKAN, BERLANGSUNG, SELESAI). Default: semua status publik.',
      from: 'Format YYYY-MM-DD (tanggal awal rentang)',
      to: 'Format YYYY-MM-DD (tanggal akhir rentang)',
      location: 'Filter key lokasi (auditorium, ruang-rapat, online, lainnya)',
      q: 'Kata kunci pencarian judul atau topik seminar',
      limit: 'Batas jumlah data per halaman (default 50, maks 200)',
      page: 'Nomor halaman (default 1)',
    },
  })
})

const parseTanggal = (str?: string) => {
  if (!str) return undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return undefined
  return new Date(`${str}T00:00:00.000Z`)
}

// GET /api/v1/seminars
apiV1Router.get('/seminars', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)))
    const statusParam = String(req.query.status ?? '').trim()
    const from = parseTanggal(req.query.from ? String(req.query.from) : undefined)
    const to = parseTanggal(req.query.to ? String(req.query.to) : undefined)
    const locationKey = String(req.query.location ?? '').trim()
    const q = String(req.query.q ?? '').trim()

    const statusList = statusParam
      ? statusParam.split(',').map((s) => s.trim().toUpperCase())
      : ['DIJADWALKAN', 'BERLANGSUNG', 'SELESAI']

    const where: any = {
      status: { in: statusList },
      ...(from || to ? { date: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
      ...(locationKey ? { location: { key: locationKey } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { topic: { contains: q } },
              { code: { contains: q } },
              { locationOther: { contains: q } },
            ],
          }
        : {}),
    }

    const [total, data] = await Promise.all([
      db.seminar.count({ where }),
      db.seminar.findMany({
        where,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          code: true,
          title: true,
          topic: true,
          date: true,
          startTime: true,
          endTime: true,
          sesi: true,
          status: true,
          locationOther: true,
          location: {
            select: {
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
              materials: true,
              attendances: true,
            },
          },
          news: {
            select: {
              id: true,
              title: true,
              publishedAt: true,
            },
          },
        },
      }),
    ])

    const formatted = data.map((s) => ({
      id: s.id,
      code: s.code,
      title: s.title,
      topic: s.topic,
      date: s.date.toISOString().slice(0, 10),
      time: `${s.startTime} - ${s.endTime} WIB`,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      location: {
        key: s.location.key,
        name: s.location.name,
        type: s.location.type,
        detail: s.locationOther || (s.location.key === 'lainnya' ? s.locationOther : s.location.name),
      },
      organizer: {
        name: s.user.name,
        unit: s.user.unit,
      },
      statistics: {
        materialsCount: s._count.materials,
        attendancesCount: s._count.attendances,
      },
      documentation: s.news
        ? {
            id: s.news.id,
            title: s.news.title,
            publishedAt: s.news.publishedAt,
          }
        : null,
    }))

    res.json({
      status: 'success',
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        timestamp: new Date().toISOString(),
      },
      data: formatted,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/seminars/:id
apiV1Router.get('/seminars/:id', async (req, res, next) => {
  try {
    const s = await db.seminar.findUnique({
      where: { id: String(req.params.id) },
      select: {
        id: true,
        code: true,
        title: true,
        topic: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        locationOther: true,
        location: true,
        user: { select: { name: true, unit: true } },
        materials: {
          select: {
            id: true,
            presenter: true,
            originalName: true,
            driveUrl: true,
            sizeBytes: true,
          },
        },
        news: {
          select: {
            id: true,
            title: true,
            body: true,
            publishedAt: true,
            photos: { select: { id: true, caption: true } },
          },
        },
        _count: { select: { attendances: true } },
      },
    })

    if (!s) return res.status(404).json({ status: 'error', error: 'Seminar tidak ditemukan' })

    res.json({
      status: 'success',
      data: {
        id: s.id,
        code: s.code,
        title: s.title,
        topic: s.topic,
        date: s.date.toISOString().slice(0, 10),
        time: `${s.startTime} - ${s.endTime} WIB`,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
        location: {
          key: s.location.key,
          name: s.location.name,
          type: s.location.type,
          detail: s.locationOther || s.location.name,
        },
        organizer: {
          name: s.user.name,
          unit: s.user.unit,
        },
        attendancesCount: s._count.attendances,
        materials: s.status === 'SELESAI' ? s.materials : [],
        documentation: s.status === 'SELESAI' ? s.news : null,
      },
    })
  } catch (err) {
    next(err)
  }
})
