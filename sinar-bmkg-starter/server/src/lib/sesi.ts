// Definisi terpusat sistem sesi pemesanan ruangan BMKG (07.00 - 16.00 WIB).
// File ini identik di server (server/src/lib/sesi.ts) dan client (client/src/lib/sesi.ts).

export type SesiTipe = 'PAGI' | 'SIANG' | 'FULL_DAY'

export interface SesiInfo {
  kode: SesiTipe
  label: string
  namaLengkap: string
  start: string
  end: string
  jamRentang: string
}

export const SESI_PAGI: SesiTipe = 'PAGI'
export const SESI_SIANG: SesiTipe = 'SIANG'
export const SESI_FULL_DAY: SesiTipe = 'FULL_DAY'

export const DAFTAR_SESI: Record<SesiTipe, SesiInfo> = {
  PAGI: {
    kode: 'PAGI',
    label: 'Pagi',
    namaLengkap: 'Pagi (Half-day) 07.00-12.00',
    start: '07:00',
    end: '12:00',
    jamRentang: '07.00-12.00 WIB',
  },
  SIANG: {
    kode: 'SIANG',
    label: 'Siang',
    namaLengkap: 'Siang (Half-day) 12.00-16.00',
    start: '12:00',
    end: '16:00',
    jamRentang: '12.00-16.00 WIB',
  },
  FULL_DAY: {
    kode: 'FULL_DAY',
    label: 'Full-day',
    namaLengkap: 'Full-day 07.00-16.00',
    start: '07:00',
    end: '16:00',
    jamRentang: '07.00-16.00 WIB',
  },
}

export const LIST_SESI: SesiInfo[] = [
  DAFTAR_SESI.PAGI,
  DAFTAR_SESI.SIANG,
  DAFTAR_SESI.FULL_DAY,
]

// Normalisasi string sesi (mendukung variasi huruf kapital maupun penulisan lama)
export function normalisasiSesi(input?: string | null): SesiTipe | null {
  if (!input) return null
  const upper = input.trim().toUpperCase().replace(/[\s-]/g, '_')
  if (upper === 'PAGI') return 'PAGI'
  if (upper === 'SIANG') return 'SIANG'
  if (upper === 'FULL_DAY' || upper === 'FULLDAY') return 'FULL_DAY'
  return null
}

// Menurunkan sesi dari jam mulai dan jam selesai
export function sesiDariJam(startTime: string, endTime: string): SesiTipe | null {
  if (startTime === '07:00' && endTime === '12:00') return 'PAGI'
  if (startTime === '12:00' && endTime === '16:00') return 'SIANG'
  if (startTime === '07:00' && endTime === '16:00') return 'FULL_DAY'
  return null
}

// Helper label jadwal seminar: bila cocok sesi, tampilkan format rapi; bila tidak, jam asli
export function labelJadwal(startTime: string, endTime: string): string {
  if (startTime === '07:00' && endTime === '12:00') return 'Pagi - 07.00-12.00 WIB'
  if (startTime === '12:00' && endTime === '16:00') return 'Siang - 12.00-16.00 WIB'
  if (startTime === '07:00' && endTime === '16:00') return 'Full-day - 07.00-16.00 WIB'
  return `${startTime}–${endTime} WIB`
}
