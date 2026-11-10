// Bentuk JSON Seminar.certLayout. Semua posisi dalam persen (0-100) dari kiri-atas halaman.
import { z } from 'zod'

export const DAFTAR_PERAN = ['Peserta', 'Narasumber', 'Moderator', 'Panitia'] as const
export type PeranSertifikat = (typeof DAFTAR_PERAN)[number]

export const KUNCI_HURUF = [
  'playfair',
  'greatvibes',
  'cinzel',
  'allura',
  'pinyon',
  'dancing',
  'cormorant',
  'baskerville',
  'montserrat',
  'times',
] as const

export type KunciHuruf = (typeof KUNCI_HURUF)[number]

export const NAMA_HURUF: Record<KunciHuruf, string> = {
  playfair: 'Playfair Display',
  greatvibes: 'Great Vibes',
  cinzel: 'Cinzel',
  allura: 'Allura',
  pinyon: 'Pinyon Script',
  dancing: 'Dancing Script',
  cormorant: 'Cormorant Garamond',
  baskerville: 'Libre Baskerville',
  montserrat: 'Montserrat',
  times: 'Times New Roman',
}

const rata = z.enum(['left', 'center', 'right'])

export const elemenSkema = z.object({
  on: z.boolean(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  size: z.number().min(0.5).max(30),
  font: z.enum(KUNCI_HURUF),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Warna harus heksadesimal #RRGGBB'),
  align: rata,
  format: z.string().max(40).optional(),
})

export type ElemenCert = z.infer<typeof elemenSkema>

export const layoutSkema = z.object({
  name: elemenSkema,
  role: elemenSkema.optional(),
  title: elemenSkema,
  date: elemenSkema,
  seminarId: elemenSkema,
  serial: elemenSkema,
  qr: elemenSkema,
  location: elemenSkema.optional(),
  nip: elemenSkema.optional(),
})

export type CertLayout = z.infer<typeof layoutSkema>

const dasar = (p: Partial<ElemenCert> & Pick<ElemenCert, 'x' | 'y' | 'size'>): ElemenCert => ({
  on: true,
  font: 'montserrat',
  color: '#1B2433',
  align: 'center',
  ...p,
})

export function layoutBawaan(peran: string = 'Peserta'): CertLayout {
  const isPeserta = peran === 'Peserta'
  return {
    name: dasar({ on: true, x: 50, y: 46, size: 4.2, font: 'playfair', color: '#0B3C8C', align: 'center' }),
    role: dasar({ on: !isPeserta, x: 50, y: 53, size: 2.2, font: 'montserrat', color: '#0B3C8C', align: 'center' }),
    title: dasar({ on: true, x: 50, y: 62, size: 2.2, font: 'montserrat', color: '#1B2433', align: 'center' }),
    date: dasar({ on: false, x: 50, y: 72, size: 1.8, font: 'montserrat', color: '#44505F', align: 'center', format: 'd MMMM yyyy' }),
    seminarId: dasar({ on: false, x: 50, y: 18, size: 1.6, font: 'montserrat', color: '#6B7685', align: 'center' }),
    serial: dasar({ on: true, x: 92, y: 8, size: 1.4, font: 'montserrat', color: '#6B7685', align: 'right' }),
    qr: dasar({ on: true, x: 10, y: 88, size: 11, font: 'montserrat', color: '#000000', align: 'center' }),
    location: dasar({ on: false, x: 50, y: 78, size: 1.6, font: 'montserrat', color: '#44505F', align: 'center' }),
    nip: dasar({ on: false, x: 50, y: 54, size: 1.6, font: 'montserrat', color: '#6B7685', align: 'center' }),
  }
}

export function normalisasiLayout(mentah: unknown): CertLayout {
  return normalisasiLayoutPeran(mentah, 'Peserta')
}

export function normalisasiLayoutPeran(mentah: unknown, peran: string = 'Peserta'): CertLayout {
  const bawaan = layoutBawaan(peran)
  if (!mentah || typeof mentah !== 'object') return bawaan
  const obj = mentah as Record<string, any>
  // Cek apakah mentah menyimpan objek per peran { Peserta: ..., Narasumber: ... }
  const sumber = obj[peran] && typeof obj[peran] === 'object' ? obj[peran] : obj
  const parsed = layoutSkema.safeParse({ ...bawaan, ...sumber })
  if (!parsed.success) return bawaan
  // Nama peserta, Nomor Seri, dan QR Code verifikasi selalu aktif
  return {
    ...parsed.data,
    name: { ...parsed.data.name, on: true },
    serial: { ...parsed.data.serial, on: true },
    qr: { ...parsed.data.qr, on: true },
  }
}

export const pageModeSkema = z.enum(['A4_LANDSCAPE', 'A4_PORTRAIT', 'SQUARE', 'WIDE_16_9', 'AUTO'])
export type PageModeCert = z.infer<typeof pageModeSkema>
