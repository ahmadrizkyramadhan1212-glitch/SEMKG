// Sprint 7: sertifikat — template, tata letak, pratinjau, generate PDF per peserta,
// multi-peran (Peserta, Narasumber, Moderator, Panitia), sertifikat susulan,
// klaim ulang via email antrean Nodemailer, dan verifikasi nomor seri.
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { promises as fs } from 'node:fs'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, type AuthRequest } from '../lib/auth.js'
import { audit } from '../lib/audit.js'
import { berkasDisimpan, jalurLokal, simpanBerkas, SET_TEMPLATE, EKSTENSI_TEMPLATE } from '../lib/upload.js'
import { buatPdfSertifikat, rasioDariTemplate, type DataSertifikat } from '../lib/certPdf.js'
import { bacaHuruf } from '../lib/fonts.js'
import {
  layoutSkema,
  normalisasiLayout,
  normalisasiLayoutPeran,
  pageModeSkema,
  DAFTAR_PERAN,
  type CertLayout,
  type PeranSertifikat,
} from '../lib/certLayout.js'

export const sertifikatRouter = Router()

const unduhLimiter = rateLimit({
  windowMs: 60_000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan. Tunggu sebentar.' },
})

const templateUnggah = berkasDisimpan(SET_TEMPLATE, 10, { lewatEkstensi: EKSTENSI_TEMPLATE })

async function seminarMilik(
  id: string,
  req: AuthRequest,
): Promise<
  | { ok: false; status: number; pesan: string }
  | {
      ok: true
      seminar: NonNullable<Awaited<ReturnType<typeof db.seminar.findUnique>>> & { location: { name: string } | null }
    }
> {
  const seminar = await db.seminar.findUnique({ where: { id }, include: { location: true } })
  if (!seminar) return { ok: false, status: 404, pesan: 'Seminar tidak ditemukan' }
  if (seminar.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return { ok: false, status: 403, pesan: 'Seminar ini bukan milik Anda' }
  }
  if (seminar.status !== 'SELESAI') {
    return { ok: false, status: 400, pesan: 'Sertifikat aktif setelah seminar selesai' }
  }
  return { ok: true, seminar: seminar as never }
}

const lokasiNama = (s: { location: { name: string } | null; locationOther: string | null }) =>
  s.locationOther?.trim() || s.location?.name || '-'

async function dataSertifikat(
  s: NonNullable<Awaited<ReturnType<typeof db.seminar.findUnique>>> & { location: { name: string } | null },
  nama: string,
  nip: string | null | undefined,
  nomor: string,
  peran?: string | null,
): Promise<DataSertifikat> {
  return {
    nama,
    nip,
    judul: s.title,
    tanggal: s.date,
    lokasi: lokasiNama(s as never),
    code: s.code,
    nomor,
    peran: peran || 'Peserta',
  }
}

// ===== GAMBARAN KESELURUHAN UNTUK TAB SERTIFIKAT (MULTI-PERAN) =====
sertifikatRouter.get('/seminars/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const cek = await seminarMilik(String(req.params.id), req)
    if (!cek.ok) return res.status(cek.status).json({ error: cek.pesan })
    const s = cek.seminar
    const peserta = await db.attendance.findMany({
      where: { seminarId: s.id },
      orderBy: { createdAt: 'asc' },
      include: { certificate: true },
    })
    const jobs = await db.emailJob.findMany({
      where: { certificateId: { in: peserta.map((p) => p.certificate?.id).filter((v): v is string => !!v) } },
      orderBy: { createdAt: 'desc' },
    })
    const jobTerakhir = new Map<string, (typeof jobs)[number]>()
    for (const j of jobs) if (!jobTerakhir.has(j.certificateId!)) jobTerakhir.set(j.certificateId!, j)

    const certTemplates = (s.cert_templates as Record<string, any>) || {}
    const peranAktif = String(req.query.peran || 'Peserta')

    const layouts: Record<string, any> = {}
    const templates: Record<string, any> = {}

    for (const p of DAFTAR_PERAN) {
      layouts[p] = normalisasiLayoutPeran(s.certLayout, p)
      const roleTpl = certTemplates[p] || {}
      const tplAda = !!(roleTpl.templatePath ?? s.certTemplatePath)
      const rasio = roleTpl.pageRatio ?? s.certPageRatio
      const pageMode = roleTpl.pageMode ?? s.certPageMode
      templates[p] = { templateAda: tplAda, rasio, pageMode }
    }

    res.json({
      seminar: { id: s.id, code: s.code, title: s.title, date: s.date, lokasi: lokasiNama(s as never) },
      peranAktif,
      templateAda: templates[peranAktif]?.templateAda ?? !!s.certTemplatePath,
      rasio: templates[peranAktif]?.rasio ?? s.certPageRatio,
      pageMode: templates[peranAktif]?.pageMode ?? s.certPageMode,
      layout: layouts[peranAktif] ?? normalisasiLayoutPeran(s.certLayout, peranAktif),
      layouts,
      templates,
      peserta: peserta.map((p) => ({
        id: p.id,
        name: p.name,
        nip: p.nip,
        email: p.email,
        peran: p.peran || 'Peserta',
        alasan: p.alasan || null,
        source: p.source,
        sertifikat: p.certificate
          ? {
              id: p.certificate.id,
              nomor: p.certificate.number,
              pdfAda: !!p.certificate.pdfPath,
              mailStatus: p.certificate.mailStatus,
              emailStatus: jobTerakhir.get(p.certificate.id)?.status ?? null,
              emailGalat: jobTerakhir.get(p.certificate.id)?.lastError ?? null,
            }
          : null,
      })),
    })
  } catch (e) {
    next(e)
  }
})

// ===== UNGGAH TEMPLATE BERDASARKAN PERAN =====
sertifikatRouter.post(
  '/seminars/:id/template',
  requireAuth,
  templateUnggah.multer.single('template'),
  async (req: AuthRequest, res, next) => {
    try {
      const cek = await seminarMilik(String(req.params.id), req)
      if (!cek.ok) return res.status(cek.status).json({ error: cek.pesan })
      const berkas = req.file
      if (!berkas) return res.status(400).json({ error: 'Pilih berkas template terlebih dahulu' })
      await templateUnggah.validasi(berkas)
      const tersimpan = await simpanBerkas('template', berkas)
      const rasio = await rasioDariTemplate(tersimpan)

      const peran = String(req.query.peran || req.body?.peran || 'Peserta')
      const certTemplates = (cek.seminar.cert_templates as Record<string, any>) || {}
      certTemplates[peran] = {
        templatePath: tersimpan,
        pageRatio: rasio,
        pageMode: 'AUTO',
      }

      const seminar = await db.seminar.update({
        where: { id: cek.seminar.id },
        data: {
          certTemplatePath: tersimpan,
          cert_templates: certTemplates,
          certPageRatio: rasio,
          certPageMode: 'AUTO',
        },
      })
      await audit(req.user!.id, 'UBAH_SEMINAR', cek.seminar.title, `Unggah template sertifikat peran ${peran}`)
      res.json({
        peran,
        templateAda: true,
        rasio: certTemplates[peran].pageRatio,
        pageMode: certTemplates[peran].pageMode,
      })
    } catch (e) {
      next(e)
    }
  },
)

// ===== RESET/HAPUS TEMPLATE PER PERAN (KEMBALI KE BAWAAN BMKG) =====
sertifikatRouter.delete('/seminars/:id/template', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const cek = await seminarMilik(String(req.params.id), req)
    if (!cek.ok) return res.status(cek.status).json({ error: cek.pesan })
    const { rasioDariTemplate } = await import('../lib/certPdf.js')
    const rasioBawaan = await rasioDariTemplate(null)

    const peran = String(req.query.peran || 'Peserta')
    const certTemplates = (cek.seminar.cert_templates as Record<string, any>) || {}
    delete certTemplates[peran]

    const seminar = await db.seminar.update({
      where: { id: cek.seminar.id },
      data: {
        certTemplatePath: Object.keys(certTemplates).length ? cek.seminar.certTemplatePath : null,
        cert_templates: certTemplates,
        certPageRatio: rasioBawaan,
        certPageMode: 'A4_LANDSCAPE',
      },
    })
    await audit(req.user!.id, 'UBAH_SEMINAR', cek.seminar.title, `Reset template sertifikat peran ${peran} ke bawaan BMKG`)
    res.json({ peran, templateAda: false, rasio: rasioBawaan, pageMode: 'A4_LANDSCAPE' })
  } catch (e) {
    next(e)
  }
})

// ===== SIMPAN TATA LETAK PER PERAN =====
const layoutBody = z.object({
  peran: z.enum(DAFTAR_PERAN).optional(),
  layout: layoutSkema.partial({ name: true }).optional(),
  pageMode: pageModeSkema.optional(),
})

sertifikatRouter.patch('/seminars/:id/layout', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const cek = await seminarMilik(String(req.params.id), req)
    if (!cek.ok) return res.status(cek.status).json({ error: cek.pesan })
    const parsed = layoutBody.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' })

    const peran = parsed.data.peran || 'Peserta'
    const mentahLayout = (cek.seminar.certLayout as Record<string, any>) || {}
    const updatedRoleLayout = parsed.data.layout
      ? normalisasiLayoutPeran(parsed.data.layout, peran)
      : normalisasiLayoutPeran(mentahLayout, peran)

    const certLayout: Record<string, any> = typeof mentahLayout === 'object' ? { ...mentahLayout } : {}
    certLayout[peran] = updatedRoleLayout

    const certTemplates = (cek.seminar.cert_templates as Record<string, any>) || {}
    if (parsed.data.pageMode) {
      if (!certTemplates[peran]) certTemplates[peran] = {}
      certTemplates[peran].pageMode = parsed.data.pageMode
    }

    const seminar = await db.seminar.update({
      where: { id: cek.seminar.id },
      data: {
        certLayout,
        cert_templates: certTemplates,
        ...(parsed.data.pageMode ? { certPageMode: parsed.data.pageMode } : {}),
      },
    })

    res.json({
      peran,
      layout: normalisasiLayoutPeran(seminar.certLayout, peran),
      pageMode: certTemplates[peran]?.pageMode ?? seminar.certPageMode,
    })
  } catch (e) {
    next(e)
  }
})

// ===== PRATINJAU PDF SESUAI PERAN =====
sertifikatRouter.get('/seminars/:id/pratinjau', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const cek = await seminarMilik(String(req.params.id), req)
    if (!cek.ok) return res.status(cek.status).json({ error: cek.pesan })
    const s = cek.seminar
    const peran = String(req.query.peran || 'Peserta')
    const tahun = s.date.getUTCFullYear()
    const data = await dataSertifikat(
      s as never,
      'Contoh Nama Lengkap',
      '199001012005011001',
      `SERT/BMKG/${tahun}/${s.code}/001`,
      peran,
    )

    const certTemplates = (s.cert_templates as Record<string, any>) || {}
    const roleCfg = certTemplates[peran] || {}
    const templatePath = roleCfg.templatePath ?? s.certTemplatePath
    const layout = normalisasiLayoutPeran(s.certLayout, peran)

    const pdf = await buatPdfSertifikat({
      seminar: s,
      lokasiNama: lokasiNama(s as never),
      data,
      layout,
      templatePath,
      pageMode: roleCfg.pageMode ?? s.certPageMode,
      pageRatio: roleCfg.pageRatio ?? s.certPageRatio,
    })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="pratinjau-sertifikat-${peran.toLowerCase()}.pdf"`)
    res.setHeader('Cache-Control', 'no-store')
    res.send(pdf)
  } catch (e) {
    next(e)
  }
})

// ===== HURUF UNTUK EDITOR (TTF) =====
sertifikatRouter.get('/huruf/:kunci.ttf', requireAuth, async (req, res, next) => {
  try {
    const kunci = String(req.params.kunci).replace(/\.ttf$/, '') as Parameters<typeof bacaHuruf>[0]
    const buf = await bacaHuruf(kunci)
    res.setHeader('Content-Type', 'font/ttf')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.send(buf)
  } catch (e) {
    next(e)
  }
})

// ===== LATAR TEMPLATE SEBAGAI PNG (BERDASARKAN PERAN) =====
sertifikatRouter.get('/seminars/:id/latar.png', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const cek = await seminarMilik(String(req.params.id), req)
    if (!cek.ok) return res.status(cek.status).json({ error: cek.pesan })
    const peran = String(req.query.peran || 'Peserta')
    const certTemplates = (cek.seminar.cert_templates as Record<string, any>) || {}
    const roleCfg = certTemplates[peran] || {}
    const targetPath = roleCfg.templatePath ?? cek.seminar.certTemplatePath

    const { pngLatar, rasioDariTemplate } = await import('../lib/certPdf.js')
    const png = await pngLatar(targetPath)
    const rasio = roleCfg.pageRatio ?? cek.seminar.certPageRatio ?? (await rasioDariTemplate(targetPath))

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Access-Control-Expose-Headers', 'X-Rasio-Halaman')
    res.setHeader('X-Rasio-Halaman', String(rasio ?? 1.414))
    res.send(png)
  } catch (e) {
    next(e)
  }
})

// ===== GENERATE SATU PDF PER PESERTA (BERDASARKAN PERAN TIAP ORANG) =====
sertifikatRouter.post('/seminars/:id/generate', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const cek = await seminarMilik(String(req.params.id), req)
    if (!cek.ok) return res.status(cek.status).json({ error: cek.pesan })
    const s = cek.seminar
    const peserta = await db.attendance.findMany({
      where: { seminarId: s.id },
      orderBy: { createdAt: 'asc' },
      include: { certificate: true },
    })
    if (peserta.length === 0) return res.status(400).json({ error: 'Belum ada peserta hadir untuk dibuatkan sertifikat' })
    const tahun = s.date.getUTCFullYear()
    const urutLama = new Map<string, number>()
    peserta.forEach((p, i) => {
      if (p.certificate) urutLama.set(p.certificate.id, i + 1)
    })

    const certTemplates = (s.cert_templates as Record<string, any>) || {}
    let dibuat = 0

    for (const [i, p] of peserta.entries()) {
      const urut = p.certificate && urutLama.has(p.certificate.id) ? urutLama.get(p.certificate.id)! : i + 1
      const nomor = `SERT/BMKG/${tahun}/${s.code}/${String(urut).padStart(3, '0')}`
      const peranPeserta = p.peran || 'Peserta'
      const data = await dataSertifikat(s as never, p.name, p.nip, nomor, peranPeserta)

      const roleCfg = certTemplates[peranPeserta] || {}
      const templatePath = roleCfg.templatePath ?? s.certTemplatePath
      const layoutPeran = normalisasiLayoutPeran(s.certLayout, peranPeserta)

      const pdf = await buatPdfSertifikat({
        seminar: s,
        lokasiNama: lokasiNama(s as never),
        data,
        layout: layoutPeran,
        templatePath,
        pageMode: roleCfg.pageMode ?? s.certPageMode,
        pageRatio: roleCfg.pageRatio ?? s.certPageRatio,
      })

      const pdfPath = await simpanBerkas('sertifikat', { originalname: 'sertifikat.pdf', buffer: pdf } as Express.Multer.File)
      await db.certificate.upsert({
        where: { attendanceId: p.id },
        update: { pdfPath, mailStatus: 'MENUNGGU' },
        create: { attendanceId: p.id, number: nomor, pdfPath },
      })
      dibuat++
    }

    await audit(req.user!.id, 'GENERATE_SERTIFIKAT', s.title, `${dibuat} sertifikat multi-peran`)
    res.json({ ok: true, dibuat, total: peserta.length })
  } catch (e) {
    next(e)
  }
})

// ===== FITUR SERTIFIKAT SUSULAN (LATE ATTENDANCE / NON-PRESENSI) =====
const susulanSkema = z.object({
  nama_lengkap: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  peran: z.enum(DAFTAR_PERAN),
  alasan: z.string().min(5, 'Alasan penerbitan susulan wajib diisi (minimal 5 karakter)'),
  nip: z.string().optional().nullable(),
})

sertifikatRouter.post('/seminars/:id/susulan', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const cek = await seminarMilik(String(req.params.id), req)
    if (!cek.ok) return res.status(cek.status).json({ error: cek.pesan })
    const parsed = susulanSkema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' })

    const s = cek.seminar
    const { nama_lengkap, email, peran, alasan, nip } = parsed.data
    const emailBersih = email.toLowerCase().trim()

    // 1. Simpan atau perbarui data attendance
    let attendance = await db.attendance.findUnique({
      where: { seminarId_email: { seminarId: s.id, email: emailBersih } },
      include: { certificate: true },
    })

    if (attendance) {
      attendance = await db.attendance.update({
        where: { id: attendance.id },
        data: {
          name: nama_lengkap,
          peran,
          alasan,
          source: 'MANUAL',
          nip: nip || attendance.nip,
        },
        include: { certificate: true },
      })
    } else {
      attendance = await db.attendance.create({
        data: {
          seminarId: s.id,
          name: nama_lengkap,
          email: emailBersih,
          peran,
          alasan,
          source: 'MANUAL',
          nip: nip || null,
        },
        include: { certificate: true },
      })
    }

    // 2. Generate nomor seri urut berikutnya
    const tahun = s.date.getUTCFullYear()
    let nomor = attendance.certificate?.number
    if (!nomor) {
      const count = await db.certificate.count({ where: { attendance: { seminarId: s.id } } })
      nomor = `SERT/BMKG/${tahun}/${s.code}/${String(count + 1).padStart(3, '0')}`
    }

    // 3. Generate berkas PDF sesuai template & layout peran
    const data = await dataSertifikat(s as never, nama_lengkap, nip, nomor, peran)
    const layoutPeran = normalisasiLayoutPeran(s.certLayout, peran)
    const certTemplates = (s.cert_templates as Record<string, any>) || {}
    const roleCfg = certTemplates[peran] || {}
    const templatePath = roleCfg.templatePath ?? s.certTemplatePath

    const pdf = await buatPdfSertifikat({
      seminar: s,
      lokasiNama: lokasiNama(s as never),
      data,
      layout: layoutPeran,
      templatePath,
      pageMode: roleCfg.pageMode ?? s.certPageMode,
      pageRatio: roleCfg.pageRatio ?? s.certPageRatio,
    })

    const pdfPath = await simpanBerkas('sertifikat', { originalname: 'sertifikat.pdf', buffer: pdf } as Express.Multer.File)

    const cert = await db.certificate.upsert({
      where: { attendanceId: attendance.id },
      update: { pdfPath, mailStatus: 'MENUNGGU' },
      create: { attendanceId: attendance.id, number: nomor, pdfPath },
    })

    // 4. Catat alasan penerbitan ke dalam tabel 'audit_logs'
    await audit(
      req.user!.id,
      'SERTIFIKAT_SUSULAN',
      s.title,
      `Penerima: ${nama_lengkap} (${emailBersih}), Peran: ${peran}, Nomor: ${nomor}. Alasan: ${alasan}`,
    )

    // 5. Langsung picu Nodemailer (EmailJob) ke email penerima
    const materiDrive = await db.material.findMany({
      where: { seminarId: s.id, driveUrl: { not: null } },
      select: { presenter: true, driveUrl: true, originalName: true },
      orderBy: { createdAt: 'asc' },
    })

    const daftarDriveText =
      materiDrive.length > 0
        ? '\n\nTautan Materi Seminar (Google Drive):\n' +
          materiDrive.map((m, idx) => `${idx + 1}. ${m.originalName || 'Materi Paparan'} (${m.presenter}): ${m.driveUrl}`).join('\n')
        : ''

    await db.emailJob.create({
      data: {
        type: 'SERTIFIKAT',
        toEmail: emailBersih,
        toName: nama_lengkap,
        subject: `Sertifikat ${peran} - ${s.title}`,
        body: [
          `Yth. Bapak/Ibu ${nama_lengkap},`,
          '',
          `Terima kasih atas partisipasi dan kontribusi Anda sebagai ${peran} pada kegiatan seminar ilmiah BMKG:`,
          `- Judul Seminar: "${s.title}"`,
          `- Peran: ${peran}`,
          `- Nomor Sertifikat: ${nomor}`,
          '',
          'Sertifikat resmi berformat PDF dengan QR Code verifikasi keaslian dokumen telah dilampirkan pada email ini.',
          daftarDriveText,
          '',
          'Salam hormat,',
          'Sistem Informasi Seminar Ilmiah BMKG (SINAR)',
        ].join('\n'),
        attachmentPath: pdfPath,
        attachmentName: `sertifikat-${peran.toLowerCase()}-${nama_lengkap.replace(/\s+/g, '-')}.pdf`,
        certificateId: cert.id,
      },
    })

    res.json({
      ok: true,
      nomor,
      peran,
      email: emailBersih,
      pesan: `Sertifikat susulan berhasil diterbitkan (${nomor}) dan email telah dimasukkan ke antrean pengiriman.`,
    })
  } catch (e) {
    next(e)
  }
})

// ===== UNDUH PDF SERTIFIKAT (pemilik/admin) =====
sertifikatRouter.get('/pdf/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const cert = await db.certificate.findUnique({
      where: { id: String(req.params.id) },
      include: { attendance: { include: { seminar: true } } },
    })
    if (!cert?.pdfPath) return res.status(404).json({ error: 'Sertifikat belum dibuat' })
    if (cert.attendance.seminar.userId !== req.user!.id && req.user!.role !== 'ADMIN')
      return res.status(403).json({ error: 'Bukan milik Anda' })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(cert.number.replace(/\//g, '-'))}.pdf"`)
    res.send(await fs.readFile(await jalurLokal(cert.pdfPath)))
  } catch (e) {
    next(e)
  }
})

// ===== KIRIM EMAIL SERTIFIKAT (satu EmailJob per penerima) =====
const emailBody = z.object({
  subjek: z.string().min(3).max(200),
  isi: z.string().min(10).max(5000),
  penerima: z.array(z.string()).min(1, 'Pilih minimal satu penerima'),
})

sertifikatRouter.post('/seminars/:id/email', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const cek = await seminarMilik(String(req.params.id), req)
    if (!cek.ok) return res.status(cek.status).json({ error: cek.pesan })
    const parsed = emailBody.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' })
    const s = cek.seminar
    const peserta = await db.attendance.findMany({
      where: { seminarId: s.id, id: { in: parsed.data.penerima } },
      include: { certificate: true },
    })
    if (peserta.length === 0) return res.status(400).json({ error: 'Penerima tidak ditemukan' })

    const materiDrive = await db.material.findMany({
      where: { seminarId: s.id, driveUrl: { not: null } },
      select: { presenter: true, driveUrl: true, originalName: true },
      orderBy: { createdAt: 'asc' },
    })

    const daftarDriveText =
      materiDrive.length > 0
        ? materiDrive
            .map((m, idx) => `${idx + 1}. ${m.originalName || 'Materi Paparan'} (${m.presenter}): ${m.driveUrl}`)
            .join('\n')
        : ''

    let antre = 0
    for (const p of peserta) {
      if (!p.certificate?.pdfPath) continue
      let isi = parsed.data.isi.replaceAll('{nama}', p.name).replaceAll('{judul}', s.title)

      if (daftarDriveText) {
        if (isi.includes('{link_materi}') || isi.includes('{materi_drive}') || isi.includes('{tautan_materi}')) {
          isi = isi
            .replaceAll('{link_materi}', daftarDriveText)
            .replaceAll('{materi_drive}', daftarDriveText)
            .replaceAll('{tautan_materi}', daftarDriveText)
        } else {
          isi += `\n\n--- TAUTAN MATERI SEMINAR (GOOGLE DRIVE) ---\n${daftarDriveText}`
        }
      } else {
        isi = isi
          .replaceAll('{link_materi}', '')
          .replaceAll('{materi_drive}', '')
          .replaceAll('{tautan_materi}', '')
      }

      await db.emailJob.create({
        data: {
          type: 'SERTIFIKAT',
          toEmail: p.email,
          toName: p.name,
          subject: parsed.data.subjek,
          body: isi,
          attachmentPath: p.certificate.pdfPath,
          attachmentName: `sertifikat-${(p.peran || 'peserta').toLowerCase()}-${p.name.replace(/\s+/g, '-')}.pdf`,
          certificateId: p.certificate.id,
        },
      })
      await db.certificate.update({ where: { id: p.certificate.id }, data: { mailStatus: 'MENUNGGU' } })
      antre++
    }
    if (antre === 0)
      return res.status(400).json({ error: 'Semua penerima belum memiliki berkas sertifikat. Tekan Buat Sertifikat dulu.' })
    await audit(req.user!.id, 'KIRIM_SERTIFIKAT', s.title, `${antre} email masuk antrean`)
    res.json({ ok: true, antre })
  } catch (e) {
    next(e)
  }
})

// ===== KIRIM ULANG YANG GAGAL =====
sertifikatRouter.post('/email/:jobId/kirim-ulang', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const job = await db.emailJob.findUnique({ where: { id: String(req.params.jobId) } })
    if (!job) return res.status(404).json({ error: 'Tugas email tidak ditemukan' })
    const cert = job.certificateId
      ? await db.certificate.findUnique({
          where: { id: job.certificateId },
          include: { attendance: { include: { seminar: true } } },
        })
      : null
    if (!cert || cert.attendance.seminar.userId !== req.user!.id) return res.status(403).json({ error: 'Bukan milik Anda' })
    await db.emailJob.create({
      data: {
        type: job.type,
        toEmail: job.toEmail,
        toName: job.toName,
        subject: job.subject,
        body: job.body,
        attachmentPath: job.attachmentPath,
        attachmentName: job.attachmentName,
        certificateId: job.certificateId,
      },
    })
    await db.certificate.update({ where: { id: cert.id }, data: { mailStatus: 'MENUNGGU' } })
    await audit(req.user!.id, 'KIRIM_ULANG', cert.attendance.seminar.title, job.toEmail)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ===== FITUR RE-SEND CLAIM SERTIFIKAT (EMAIL CLAIM) =====
const klaimBody = z.object({
  email: z.string().email('Format email tidak valid'),
  nip: z.string().optional(),
})

const handleKlaimUlang = async (req: any, res: any, next: any) => {
  try {
    const parsed = klaimBody.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' })

    const emailBersih = parsed.data.email.toLowerCase().trim()
    const nipBersih = parsed.data.nip ? parsed.data.nip.trim() : undefined

    const certs = await db.certificate.findMany({
      where: {
        attendance: {
          email: emailBersih,
          ...(nipBersih ? { nip: nipBersih } : {}),
          seminar: { status: 'SELESAI' },
        },
        pdfPath: { not: null },
      },
      include: {
        attendance: {
          include: {
            seminar: {
              include: {
                materials: {
                  where: { driveUrl: { not: null } },
                  select: { presenter: true, driveUrl: true, originalName: true },
                },
              },
            },
          },
        },
      },
      orderBy: { attendance: { seminar: { date: 'desc' } } },
    })

    if (certs.length === 0) {
      return res.status(404).json({
        error: 'Sertifikat tidak ditemukan untuk email tersebut. Pastikan email yang dimasukkan sama dengan saat presensi seminar.',
      })
    }

    // Mengolah EmailJob untuk mengirim ulang file sertifikat langsung ke email tanpa menampilkan file di layar publik
    for (const cert of certs) {
      const s = cert.attendance.seminar
      const materiDrive = s.materials
      const daftarDriveText =
        materiDrive.length > 0
          ? '\n\nTautan Materi Seminar (Google Drive):\n' +
            materiDrive.map((m, idx) => `${idx + 1}. ${m.originalName || 'Materi'} (${m.presenter}): ${m.driveUrl}`).join('\n')
          : ''

      await db.emailJob.create({
        data: {
          type: 'SERTIFIKAT',
          toEmail: cert.attendance.email,
          toName: cert.attendance.name,
          subject: `[Klaim Ulang] Sertifikat ${cert.attendance.peran || 'Kehadiran'} - ${s.title}`,
          body: [
            `Halo ${cert.attendance.name},`,
            '',
            `Berikut adalah pengiriman ulang berkas sertifikat kehadiran Anda:`,
            `- Judul Seminar: "${s.title}"`,
            `- Peran: ${cert.attendance.peran || 'Peserta'}`,
            `- Nomor Sertifikat: ${cert.number}`,
            '',
            'Berkas sertifikat resmi (PDF) dengan Nomor Seri dan QR Code verifikasi keaslian dokumen telah dilampirkan pada email ini.',
            daftarDriveText,
            '',
            'Salam hormat,',
            'Sistem Informasi Seminar Ilmiah BMKG (SINAR)',
          ].join('\n'),
          attachmentPath: cert.pdfPath,
          attachmentName: `sertifikat-${(cert.attendance.peran || 'peserta').toLowerCase()}-${cert.attendance.name.replace(/\s+/g, '-')}.pdf`,
          certificateId: cert.id,
        },
      })
      await db.certificate.update({ where: { id: cert.id }, data: { mailStatus: 'MENUNGGU' } })
    }

    res.json({
      ok: true,
      pesan: `Sertifikat berhasil diproses! Berkas sertifikat PDF resmi telah dikirimkan ulang langsung ke email ${emailBersih}. Silakan periksa kotak masuk atau spam email Anda.`,
      jumlah: certs.length,
    })
  } catch (e) {
    next(e)
  }
}

sertifikatRouter.post('/klaim', unduhLimiter, handleKlaimUlang)
sertifikatRouter.post('/klaim-ulang', unduhLimiter, handleKlaimUlang)

// ===== VERIFIKASI NOMOR SERI PUBLIK =====
sertifikatRouter.get('/verifikasi/:nomor', unduhLimiter, async (req, res, next) => {
  try {
    const nomor = decodeURIComponent(String(req.params.nomor)).trim()
    const cert = await db.certificate.findUnique({
      where: { number: nomor },
      include: { attendance: { include: { seminar: { include: { location: true } } } } },
    })
    if (!cert) return res.status(404).json({ error: 'Nomor sertifikat tidak ditemukan' })
    const s = cert.attendance.seminar
    res.json({
      nomor: cert.number,
      nama: cert.attendance.name,
      nip: cert.attendance.nip,
      peran: cert.attendance.peran || 'Peserta',
      seminar: s.title,
      tanggal: s.date,
      lokasi: lokasiNama(s as never),
    })
  } catch (e) {
    next(e)
  }
})
