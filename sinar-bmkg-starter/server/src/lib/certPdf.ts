// Satu fungsi untuk pratinjau dan PDF peserta — supaya hasil editor = hasil unduhan.
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { PageMode, Seminar } from '@prisma/client'
import { env } from '../env.js'
import { jalurLokal } from './upload.js'
import { bacaHuruf, JALUR_TEMPLATE_BAWAAN } from './fonts.js'
import { normalisasiLayout, type CertLayout, type ElemenCert, type KunciHuruf } from './certLayout.js'

export interface DataSertifikat {
  nama: string
  nip?: string | null
  judul: string
  tanggal: Date
  lokasi: string
  code: string
  nomor: string
  peran?: string | null
}

function heks(warna: string) {
  const n = warna.replace('#', '')
  return rgb(parseInt(n.slice(0, 2), 16) / 255, parseInt(n.slice(2, 4), 16) / 255, parseInt(n.slice(4, 6), 16) / 255)
}

function ukuranMode(mode: PageMode, rasio?: number | null): { w: number; h: number } {
  if (mode === 'A4_PORTRAIT') return { w: 595.28, h: 841.89 }
  if (mode === 'SQUARE') return { w: 595.28, h: 595.28 }
  if (mode === 'WIDE_16_9') return { w: 841.89, h: 473.56 }
  if (mode === 'AUTO' && rasio && rasio > 0) {
    const panjang = 841.89
    return rasio >= 1 ? { w: panjang, h: panjang / rasio } : { w: panjang * rasio, h: panjang }
  }
  return { w: 841.89, h: 595.28 } // A4 mendatar
}

function bungkus(font: PDFFont, teks: string, size: number, max: number): string[] {
  const bersih = teks.replace(/\s+/g, ' ').trim()
  if (!bersih) return ['']
  if (font.widthOfTextAtSize(bersih, size) <= max) return [bersih]
  const kata = bersih.split(' ')
  const baris: string[] = []
  let sekarang = ''
  const masuk = (potong: string) => {
    if (font.widthOfTextAtSize(potong, size) <= max) {
      sekarang = sekarang ? `${sekarang} ${potong}` : potong
      if (font.widthOfTextAtSize(sekarang, size) > max && sekarang.includes(' ')) {
        const i = sekarang.lastIndexOf(' ')
        baris.push(sekarang.slice(0, i))
        sekarang = sekarang.slice(i + 1)
      }
      return
    }
    if (sekarang) {
      baris.push(sekarang)
      sekarang = ''
    }
    let sisa = potong
    while (font.widthOfTextAtSize(sisa, size) > max && sisa.length > 1) {
      let n = sisa.length
      while (n > 1 && font.widthOfTextAtSize(sisa.slice(0, n), size) > max) n--
      baris.push(sisa.slice(0, n))
      sisa = sisa.slice(n)
    }
    sekarang = sisa
  }
  for (const k of kata) masuk(k)
  if (sekarang) baris.push(sekarang)
  return baris.length ? baris : [bersih]
}

function tanggalIndo(d: Date, format?: string) {
  const hari = d.toLocaleDateString('id-ID', { day: 'numeric', timeZone: 'UTC' })
  const bulan = d.toLocaleDateString('id-ID', { month: 'long', timeZone: 'UTC' })
  const tahun = d.toLocaleDateString('id-ID', { year: 'numeric', timeZone: 'UTC' })
  if (!format || format === 'd MMMM yyyy') return `${hari} ${bulan} ${tahun}`
  return `${hari} ${bulan} ${tahun}`
}

async function gambarJadiPng(buf: Buffer): Promise<Buffer> {
  return sharp(buf).rotate().png().toBuffer()
}

async function siapkanLatar(
  doc: PDFDocument,
  templatePath: string | null,
  mode: PageMode,
  rasio: number | null,
): Promise<PDFPage> {
  const jalur = templatePath ? await jalurLokal(templatePath) : JALUR_TEMPLATE_BAWAAN
  const buf = await fs.readFile(jalur)
  const ext = path.extname(jalur).toLowerCase()

  if (ext === '.pdf') {
    const src = await PDFDocument.load(buf)
    if (src.getPageCount() < 1) throw Object.assign(new Error('Template PDF kosong'), { status: 400 })
    // Hanya halaman pertama (uji: PDF 2 halaman)
    if (mode === 'AUTO') {
      const [hal] = await doc.copyPages(src, [0])
      if (!hal) throw Object.assign(new Error('Template PDF tidak dapat dibaca'), { status: 400 })
      doc.addPage(hal)
      return hal
    }
    const ukuran = ukuranMode(mode, rasio)
    const page = doc.addPage([ukuran.w, ukuran.h])
    const [embedded] = await doc.embedPdf(src, [0])
    if (!embedded) throw Object.assign(new Error('Template PDF tidak dapat dibaca'), { status: 400 })
    const ew = embedded.width
    const eh = embedded.height
    const scale = Math.min(ukuran.w / ew, ukuran.h / eh)
    const w = ew * scale
    const h = eh * scale
    page.drawPage(embedded, { x: (ukuran.w - w) / 2, y: (ukuran.h - h) / 2, width: w, height: h })
    return page
  }

  const png = await gambarJadiPng(buf)
  const img = await doc.embedPng(png)
  const meta = await sharp(png).metadata()
  const iw = meta.width ?? img.width
  const ih = meta.height ?? img.height
  const modePakai = mode === 'AUTO' ? 'AUTO' : mode
  const ukuran = ukuranMode(modePakai, modePakai === 'AUTO' ? iw / ih : rasio)
  const page = doc.addPage([ukuran.w, ukuran.h])
  const scale = Math.min(ukuran.w / iw, ukuran.h / ih)
  const w = iw * scale
  const h = ih * scale
  page.drawImage(img, { x: (ukuran.w - w) / 2, y: (ukuran.h - h) / 2, width: w, height: h })
  return page
}

async function gambarTeks(
  page: PDFPage,
  fontCache: Map<KunciHuruf, PDFFont>,
  el: ElemenCert,
  teks: string,
) {
  if (!el.on || !teks) return
  const { width: W, height: H } = page.getSize()
  const font = fontCache.get(el.font)
  if (!font) return
  const size = (el.size / 100) * H
  const max = W * 0.9
  const baris = bungkus(font, teks, size, max)
  const tinggi = baris.length * size * 1.15
  const cx = (el.x / 100) * W
  const cy = H - (el.y / 100) * H
  let y = cy + tinggi / 2 - size
  for (const b of baris) {
    const tw = font.widthOfTextAtSize(b, size)
    let x = cx
    if (el.align === 'center') x = cx - tw / 2
    else if (el.align === 'right') x = cx - tw
    page.drawText(b, { x, y, size, font, color: heks(el.color) })
    y -= size * 1.15
  }
}

export async function buatPdfSertifikat(input: {
  seminar: Pick<Seminar, 'title' | 'date' | 'code' | 'certTemplatePath' | 'certPageMode' | 'certPageRatio' | 'certLayout' | 'locationOther'> & { cert_templates?: any }
  lokasiNama: string
  data: DataSertifikat
  layout?: CertLayout
  templatePath?: string | null
  pageMode?: PageMode
  pageRatio?: number | null
}): Promise<Buffer> {
  const peran = input.data.peran || 'Peserta'
  const certTemplates = (input.seminar.cert_templates as Record<string, any>) || {}
  const roleCfg = certTemplates[peran] || {}

  const templatePath = input.templatePath ?? roleCfg.templatePath ?? input.seminar.certTemplatePath
  const pageMode = input.pageMode ?? roleCfg.pageMode ?? input.seminar.certPageMode
  const pageRatio = input.pageRatio ?? roleCfg.pageRatio ?? input.seminar.certPageRatio

  const layout = input.layout ?? normalisasiLayout(input.seminar.certLayout)
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)

  const page = await siapkanLatar(doc, templatePath, pageMode, pageRatio)
  const { width: W, height: H } = page.getSize()

  const fontCache = new Map<KunciHuruf, PDFFont>()
  const kunciPakai = new Set<KunciHuruf>()
  for (const el of Object.values(layout)) {
    if (el && el.on) kunciPakai.add(el.font)
  }
  for (const k of kunciPakai) {
    fontCache.set(k, await doc.embedFont(await bacaHuruf(k), { subset: true }))
  }

  const d = input.data
  await gambarTeks(page, fontCache, layout.name, d.nama)
  if (layout.role?.on && d.peran) {
    const teksPeran = d.peran === 'Peserta' ? 'Sebagai PESERTA' : `Sebagai ${d.peran.toUpperCase()}`
    await gambarTeks(page, fontCache, layout.role, teksPeran)
  }
  await gambarTeks(page, fontCache, layout.title, d.judul)
  if (layout.date?.on) await gambarTeks(page, fontCache, layout.date, tanggalIndo(d.tanggal, layout.date.format))
  if (layout.seminarId?.on) await gambarTeks(page, fontCache, layout.seminarId, `ID seminar: ${d.code}`)
  await gambarTeks(page, fontCache, layout.serial, d.nomor)
  if (layout.location) await gambarTeks(page, fontCache, layout.location, d.lokasi)
  if (layout.nip && d.nip) await gambarTeks(page, fontCache, layout.nip, `NIP ${d.nip}`)

  if (layout.qr.on) {
    const url = `${env.appUrl}/verifikasi?n=${encodeURIComponent(d.nomor)}`
    const qrBuf = await QRCode.toBuffer(url, { margin: 1, width: 320, errorCorrectionLevel: 'M' })
    const qr = await doc.embedPng(qrBuf)
    const sisi = (layout.qr.size / 100) * Math.min(W, H)
    const cx = (layout.qr.x / 100) * W
    const cy = H - (layout.qr.y / 100) * H
    page.drawImage(qr, { x: cx - sisi / 2, y: cy - sisi / 2, width: sisi, height: sisi })
  }

  return Buffer.from(await doc.save())
}

export async function rasioDariTemplate(rel: string | null): Promise<number | null> {
  const jalur = rel ? await jalurLokal(rel) : JALUR_TEMPLATE_BAWAAN
  const buf = await fs.readFile(jalur)
  const ext = path.extname(jalur).toLowerCase()
  if (ext === '.pdf') {
    const src = await PDFDocument.load(buf)
    const p = src.getPage(0)
    const { width, height } = p.getSize()
    return width / height
  }
  const meta = await sharp(buf).rotate().metadata()
  if (!meta.width || !meta.height) return null
  return meta.width / meta.height
}

export async function pngLatar(rel: string | null): Promise<Buffer> {
  const jalur = rel ? await jalurLokal(rel) : JALUR_TEMPLATE_BAWAAN
  const buf = await fs.readFile(jalur)
  const ext = path.extname(jalur).toLowerCase()
  if (ext === '.pdf') {
    // pdf-lib tidak meraster; tampilkan halaman putih dengan rasio yang sama sebagai cadangan editor
    const src = await PDFDocument.load(buf)
    const { width, height } = src.getPage(0).getSize()
    const w = 1200
    const h = Math.round(w * (height / width))
    return sharp({ create: { width: w, height: h, channels: 3, background: '#ffffff' } }).png().toBuffer()
  }
  return sharp(buf).rotate().png().toBuffer()
}

export function nomorSertifikat(tahun: number, code: string, urut: number) {
  return `SERT/BMKG/${tahun}/${code}/${String(urut).padStart(3, '0')}`
}
