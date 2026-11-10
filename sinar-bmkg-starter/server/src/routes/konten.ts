// Materi dan berita seminar — hanya untuk seminar yang sudah SELESAI.
// Berita langsung tayang tanpa moderasi; teks dibersihkan dari tag HTML untuk mencegah XSS.
import { Router } from 'express'
import { promises as fs } from 'node:fs'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, type AuthRequest } from '../lib/auth.js'
import { audit } from '../lib/audit.js'
import { berkasDisimpan, simpanBerkas, jalurLokal, SET_FOTO, UploadError } from '../lib/upload.js'
import { MIME } from '../lib/upload.js'

export const kontenRouter = Router()

// MIME tambahan khusus materi
MIME['application/vnd.ms-powerpoint'] = { ekstensi: ['.ppt'], magic: (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0, label: 'PPT' }
MIME['application/vnd.openxmlformats-officedocument.presentationml.presentation'] = { ekstensi: ['.pptx'], magic: (b) => b[0] === 0x50 && b[1] === 0x4b, label: 'PPTX' }
MIME['application/x-zip-compressed'] = { ekstensi: ['.zip'], magic: (b) => b[0] === 0x50 && b[1] === 0x4b, label: 'ZIP' }

const SET_MATERI = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip', 'application/x-zip-compressed', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'] as const
const materiUnggah = berkasDisimpan(SET_MATERI, 25)
const fotoUnggah = berkasDisimpan(SET_FOTO, 5, { maksBerkas: 10 }) // maks 10 foto per kiriman; PDF tidak boleh jadi foto

async function seminarMilik(
  id: string,
  req: AuthRequest,
): Promise<{ ok: false; status: number; pesan: string } | { ok: true; seminar: NonNullable<Awaited<ReturnType<typeof db.seminar.findUnique>>> }> {
  const seminar = await db.seminar.findUnique({ where: { id } })
  if (!seminar) return { ok: false, status: 404, pesan: 'Seminar tidak ditemukan' }
  if (seminar.userId !== req.user!.id && req.user!.role !== 'ADMIN') return { ok: false, status: 403, pesan: 'Seminar ini bukan milik Anda' }
  if (seminar.status !== 'SELESAI') return { ok: false, status: 400, pesan: 'Fitur ini aktif setelah seminar selesai' }
  return { ok: true, seminar }
}

const bersihkan = (t: string) =>
  // Buang tag HTML dan karakter kontrol; penyajian tetap sebagai teks (React otomatis meng-escape)
  t.replace(/<[^>]*>/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim()

// ===== MATERI =====
kontenRouter.get('/seminars/:id/materi', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const cek = await seminarMilik(String(req.params.id), req)
    if (!cek.ok) return res.status(cek.status).json({ error: cek.pesan })
    res.json(await db.material.findMany({ where: { seminarId: cek.seminar.id }, orderBy: { createdAt: 'asc' } }))
  } catch (e) {
    next(e)
  }
})

// Satu materi per kiriman: pemateri + (berkas ATAU tautan Drive)
kontenRouter.post('/seminars/:id/materi', requireAuth, materiUnggah.multer.single('berkas'), async (req: AuthRequest, res, next) => {
  try {
    const cek = await seminarMilik(String(req.params.id), req)
    if (!cek.ok) return res.status(cek.status).json({ error: cek.pesan })
    const pemateri = bersihkan(String(req.body?.presenter ?? ''))
    if (pemateri.length < 3) return res.status(400).json({ error: 'Nama pemateri wajib diisi (minimal 3 karakter)' })
    const drive = String(req.body?.driveUrl ?? '').trim()
    const berkas = req.file

    if (!berkas && !drive) return res.status(400).json({ error: 'Unggah berkas atau isi tautan Google Drive' })
    if (berkas && drive) return res.status(400).json({ error: 'Pilih salah satu: berkas atau tautan Drive' })
    if (drive && !/^https:\/\/(drive\.google\.com|docs\.google\.com)\//.test(drive)) {
      return res.status(400).json({ error: 'Tautan harus berasal dari drive.google.com' })
    }

    const materi = await db.material.create({
      data: {
        seminarId: cek.seminar.id,
        presenter: pemateri,
        ...(berkas
          ? { storedPath: await simpanBerkas('materi', berkas), originalName: berkas.originalname, sizeBytes: berkas.size }
          : { driveUrl: drive }),
      },
    })
    await audit(req.user!.id, 'TAMBAH_MATERI', cek.seminar.title, pemateri)
    res.status(201).json(materi)
  } catch (e) {
    next(e)
  }
})

kontenRouter.delete('/materi/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const materi = await db.material.findUnique({ where: { id: String(req.params.id) }, include: { seminar: true } })
    if (!materi) return res.status(404).json({ error: 'Materi tidak ditemukan' })
    if (materi.seminar.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Bukan milik Anda' })
    if (materi.storedPath) await fs.unlink(await jalurLokal(materi.storedPath)).catch(() => {})
    await db.material.delete({ where: { id: materi.id } })
    await audit(req.user!.id, 'HAPUS_MATERI', materi.seminar.title, materi.presenter)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ===== BERITA (satu per seminar) =====
kontenRouter.get('/seminars/:id/berita', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const cek = await seminarMilik(String(req.params.id), req)
    if (!cek.ok) return res.status(cek.status).json({ error: cek.pesan })
    const berita = await db.news.findUnique({ where: { seminarId: cek.seminar.id }, include: { photos: true } })
    res.json(berita)
  } catch (e) {
    next(e)
  }
})

const beritaSkema = z.object({
  judul: z.string({ error: 'Judul wajib diisi' }).min(5, 'Judul minimal 5 karakter').max(200),
  isi: z.string({ error: 'Isi wajib diisi' }).min(20, 'Isi berita minimal 20 karakter').max(20000),
})

kontenRouter.post('/seminars/:id/berita', requireAuth, fotoUnggah.multer.array('foto', 10), async (req: AuthRequest, res, next) => {
  try {
    const cek = await seminarMilik(String(req.params.id), req)
    if (!cek.ok) return res.status(cek.status).json({ error: cek.pesan })
    if (await db.news.findUnique({ where: { seminarId: cek.seminar.id } })) {
      return res.status(409).json({ error: 'Berita sudah ada. Gunakan ubah berita.' })
    }
    const parsed = beritaSkema.safeParse({ judul: req.body?.judul, isi: req.body?.isi })
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' })
    const fotos = (req.files as Express.Multer.File[] | undefined) ?? []
    if (fotos.length > 10) return res.status(400).json({ error: 'Maksimal 10 foto' })
    // Validasi semua foto SEBELUM menyimpan apa pun agar tidak ada berita yatim saat foto gagal
    for (const foto of fotos) await fotoUnggah.validasi(foto)

    const berita = await db.news.create({
      data: {
        seminarId: cek.seminar.id,
        authorId: req.user!.id,
        title: bersihkan(parsed.data.judul),
        body: bersihkan(parsed.data.isi),
        photos: { create: [] },
      },
    })
    for (const [i, foto] of fotos.entries()) {
      await db.newsPhoto.create({
        data: { newsId: berita.id, path: await simpanBerkas('berita', foto), sortOrder: i },
      })
    }
    await audit(req.user!.id, 'TAYANGKAN_BERITA', cek.seminar.title, parsed.data.judul)
    res.status(201).json(await db.news.findUnique({ where: { id: berita.id }, include: { photos: true } }))
  } catch (e) {
    next(e)
  }
})

kontenRouter.patch('/berita/:id', requireAuth, fotoUnggah.multer.array('foto', 10), async (req: AuthRequest, res, next) => {
  try {
    const berita = await db.news.findUnique({ where: { id: String(req.params.id) }, include: { seminar: true, photos: true } })
    if (!berita) return res.status(404).json({ error: 'Berita tidak ditemukan' })
    if (berita.authorId !== req.user!.id) return res.status(403).json({ error: 'Hanya penulis yang dapat mengubah berita ini' })
    const parsed = beritaSkema.safeParse({ judul: req.body?.judul ?? berita.title, isi: req.body?.isi ?? berita.body })
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' })
    const fotos = (req.files as Express.Multer.File[] | undefined) ?? []
    if (berita.photos.length + fotos.length > 10) return res.status(400).json({ error: 'Total foto melebihi 10' })
    for (const foto of fotos) await fotoUnggah.validasi(foto)

    await db.news.update({
      where: { id: berita.id },
      data: { title: bersihkan(parsed.data.judul), body: bersihkan(parsed.data.isi) },
    })
    for (const [i, foto] of fotos.entries()) {
      await db.newsPhoto.create({ data: { newsId: berita.id, path: await simpanBerkas('berita', foto), sortOrder: berita.photos.length + i } })
    }
    await audit(req.user!.id, 'UBAH_BERITA', berita.seminar.title)
    res.json(await db.news.findUnique({ where: { id: berita.id }, include: { photos: true } }))
  } catch (e) {
    next(e)
  }
})

kontenRouter.delete('/berita/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const berita = await db.news.findUnique({ where: { id: String(req.params.id) }, include: { seminar: true } })
    if (!berita) return res.status(404).json({ error: 'Berita tidak ditemukan' })
    if (berita.authorId !== req.user!.id) return res.status(403).json({ error: 'Hanya penulis yang dapat menghapus berita ini' })
    // Hapus berkas fisik dulu (cascade database menghapus baris foto saat berita dihapus)
    for (const p of await db.newsPhoto.findMany({ where: { newsId: berita.id } })) {
      await fs.unlink(await jalurLokal(p.path)).catch(() => {})
    }
    await db.news.delete({ where: { id: berita.id } })
    await audit(req.user!.id, 'HAPUS_BERITA', berita.seminar.title)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ===== HASIL SEMINAR (tabel user) =====
kontenRouter.get('/hasil', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const seminars = await db.seminar.findMany({
      where: { userId: req.user!.id, status: 'SELESAI' },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
      include: { news: { select: { id: true, title: true } }, materials: { select: { id: true } }, attendances: { select: { id: true } } },
    })
    res.json(
      seminars.map((s) => ({
        id: s.id,
        code: s.code,
        title: s.title,
        date: s.date,
        berita: s.news ? { id: s.news.id, judul: s.news.title } : null,
        materiJumlah: s.materials.length,
        pesertaJumlah: s.attendances.length,
      })),
    )
  } catch (e) {
    next(e)
  }
})
