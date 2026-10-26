// Aturan bentrok jadwal (SPEC bagian 3): hanya lokasi PHYSICAL, rentang waktu tumpang tindih,
// dan hanya status yang mengunci jadwal. DIKEMBALIKAN dan DIBATALKAN tidak mengunci.
import { db } from '../db.js'
import type { SeminarStatus } from '@prisma/client'
import { DAFTAR_SESI, LIST_SESI, normalisasiSesi, type SesiTipe } from './sesi.js'

export const STATUS_MENGUNCI: SeminarStatus[] = ['MENUNGGU_VERIFIKASI', 'DIJADWALKAN', 'BERLANGSUNG', 'SELESAI']

// Menentukan apakah dua rentang waktu tumpang tindih.
// Batas yang bersentuhan (misal selesai 12.00 dan mulai 12.00) BUKAN tumpang tindih (< bukan <=).
export function waktuTumpangTindih(aMulai: string, aSelesai: string, bMulai: string, bSelesai: string): boolean {
  return aMulai < bSelesai && bMulai < aSelesai
}

export interface CekBentrok {
  locationId: string
  tanggal: Date
  mulai: string
  selesai: string
  sesi?: string | null
  abaikanSeminarId?: string
}

export interface SeminarBentrokInfo {
  id: string
  title: string
  startTime: string
  endTime: string
  status: SeminarStatus
  sesi: string | null
}

// Mengembalikan daftar seminar yang bentrok (kosong = bebas)
export async function cekBentrok({
  locationId,
  tanggal,
  mulai,
  selesai,
  abaikanSeminarId,
}: CekBentrok): Promise<SeminarBentrokInfo[]> {
  const lokasi = await db.location.findUnique({ where: { id: locationId } })
  if (!lokasi || lokasi.type !== 'PHYSICAL') return []

  // Tanggal dinormalkan ke tengah malam UTC (kolom DATE)
  const hari = new Date(`${tanggal.toISOString().slice(0, 10)}T00:00:00.000Z`)

  const kandidat = await db.seminar.findMany({
    where: {
      locationId,
      status: { in: STATUS_MENGUNCI },
      date: hari,
      ...(abaikanSeminarId && { id: { not: abaikanSeminarId } }),
    },
    select: { id: true, title: true, startTime: true, endTime: true, status: true, sesi: true },
  })

  // Cek apakah ada seminar kandidat yang tumpang tindih dengan rentang jam ini
  return kandidat.filter((k) => waktuTumpangTindih(mulai, selesai, k.startTime, k.endTime))
}

export interface SesiKetersediaan {
  sesi: SesiTipe
  tersedia: boolean
  bentrokDengan?: string
}

// Mengecek ketersediaan tiap sesi (PAGI, SIANG, FULL_DAY) pada tanggal dan lokasi tertentu
export async function cekSesiTersedia(
  locationId: string,
  tanggal: Date,
  abaikanSeminarId?: string,
): Promise<SesiKetersediaan[]> {
  const lokasi = await db.location.findUnique({ where: { id: locationId } })

  // Untuk lokasi ONLINE dan OTHER, semua sesi tersedia
  if (!lokasi || lokasi.type !== 'PHYSICAL') {
    return LIST_SESI.map((s) => ({
      sesi: s.kode,
      tersedia: true,
    }))
  }

  const hari = new Date(`${tanggal.toISOString().slice(0, 10)}T00:00:00.000Z`)

  const kandidat = await db.seminar.findMany({
    where: {
      locationId,
      status: { in: STATUS_MENGUNCI },
      date: hari,
      ...(abaikanSeminarId && { id: { not: abaikanSeminarId } }),
    },
    select: { id: true, title: true, startTime: true, endTime: true, status: true, sesi: true },
  })

  return LIST_SESI.map((s) => {
    const bentrok = kandidat.find((k) => waktuTumpangTindih(s.start, s.end, k.startTime, k.endTime))
    if (bentrok) {
      return {
        sesi: s.kode,
        tersedia: false,
        bentrokDengan: bentrok.title,
      }
    }
    return {
      sesi: s.kode,
      tersedia: true,
    }
  })
}
