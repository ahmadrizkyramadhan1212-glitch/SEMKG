// Data awal untuk pengembangan. Jalankan: npx prisma db seed
// Sandi semua akun contoh: SEMINAR#2026 (HANYA untuk pengembangan, ganti di produksi)
// Seed bisa dijalankan ulang: seminar dicocokkan lewat judul, tidak diduplikasi.
import { PrismaClient, SeminarStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { env } from '../src/env.js'
import { sesiDariJam } from '../src/lib/sesi.js'

const db = new PrismaClient()
// Tanggal disimpan UTC-tengah-malam sesuai konvensi aplikasi (kolom DATE): hari ini versi WIB
const day = (n: number) => {
  const ymd = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD zona lokal (WIB)
  const d = new Date(`${ymd}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d
}
const tok = () => crypto.randomBytes(12).toString('hex')

// PDF dan PNG minimal namun asli (lolos cek magic bytes) untuk pratinjau verifikasi
const PDF_MINIMAL = (judul: string) => `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 90>>stream
BT /F1 16 Tf 60 760 Td (${judul.replace(/[()\\]/g, ' ')}) Tj ET
endstream
endobj
trailer<</Size 6/Root 1 0 R>>
%%EOF`
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

async function simpanContoh(sub: 'surat' | 'poster', judul: string, gambar: boolean): Promise<string> {
  const nama = `${crypto.randomBytes(10).toString('hex')}${gambar ? '.png' : '.pdf'}`
  const dir = path.join(env.uploadDir, sub)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, nama), gambar ? PNG_1X1 : Buffer.from(PDF_MINIMAL(judul), 'latin1'))
  return path.join(sub, nama).replace(/\\/g, '/')
}

async function main() {
  const passwordHash = await bcrypt.hash('SEMINAR#2026', 10)

  // Lokasi: dari yang terbesar sampai yang kecil, fasilitas lengkap sampai minim
  const loc = (key: string, name: string, type: 'PHYSICAL' | 'ONLINE' | 'OTHER', capacity?: number, facilities?: string) =>
    db.location.upsert({ where: { key }, update: {}, create: { key, name, type, capacity, facilities } })
  const aud = await loc('auditorium', 'Gedung Auditorium', 'PHYSICAL', 1200, 'Proyektor, sound system, AC, panggung, mikrofon, perekaman')
  const rr = await loc('ruang-rapat', 'Ruang Rapat Lt. 1 Gedung A', 'PHYSICAL', 30, 'Proyektor, AC, papan tulis')
  const onl = await loc('online', 'Online (Zoom Meeting)', 'ONLINE')
  await loc('lainnya', 'Lainnya', 'OTHER')

  const mk = (name: string, nip: string, email: string, role: 'ADMIN' | 'USER', unit: string) =>
    db.user.upsert({ where: { nip }, update: {}, create: { name, nip, email, role, unit, passwordHash, phone: '08123456789' } })
  await mk('Admin SEMINAR', '198001012005011001', 'admin@bmkg.go.id', 'ADMIN', 'Pusat Standardisasi')
  const nabila = await mk('Nabila Putri', '199505052020122001', 'nabila.putri@bmkg.go.id', 'USER', 'Bidang Klimatologi')
  const andi = await mk('Andi Pratama', '199203032018011002', 'andi.pratama@bmkg.go.id', 'USER', 'Bidang Geofisika')

  // dokumen: 'lengkap' = surat + poster, 'surat' = surat saja, null = tanpa berkas
  const sem = async (
    title: string,
    off: number,
    s: string,
    e: string,
    st: SeminarStatus,
    locationId = aud.id,
    userId = nabila.id,
    dokumen: 'lengkap' | 'surat' | null = 'surat',
  ) => {
    const lama = await db.seminar.findFirst({ where: { title, date: day(off) }, include: { files: true } })
    if (lama) return lama
    const dObj = day(off)
    const yy = String(dObj.getUTCFullYear() % 100).padStart(2, '0')
    const mm = String(dObj.getUTCMonth() + 1).padStart(2, '0')
    const KODE_ABJAD = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const rnd = Array.from(crypto.randomBytes(3)).map((b) => KODE_ABJAD[b % KODE_ABJAD.length]).join('')
    const seminar = await db.seminar.create({
      data: {
        title, topic: 'Seminar ilmiah', date: dObj, startTime: s, endTime: e, sesi: sesiDariJam(s, e), status: st, locationId, userId,
        code: `${yy}${mm}${rnd}`, attendToken: tok(),
        letterReceived: st !== 'MENUNGGU_VERIFIKASI' && st !== 'DIKEMBALIKAN',
      },
    })
    if (dokumen) {
      await db.seminarFile.create({
        data: {
          seminarId: seminar.id, kind: 'SURAT_IZIN',
          originalName: 'surat-izin.pdf', mime: 'application/pdf', sizeBytes: 600,
          storedPath: await simpanContoh('surat', title, false),
        },
      })
      if (dokumen === 'lengkap')
        await db.seminarFile.create({
          data: {
            seminarId: seminar.id, kind: 'POSTER',
            originalName: 'poster.png', mime: 'image/png', sizeBytes: PNG_1X1.length,
            storedPath: await simpanContoh('poster', title, true),
          },
        })
    }
    return db.seminar.findUniqueOrThrow({ where: { id: seminar.id }, include: { files: true } })
  }

  await sem('Prakiraan Iklim Ekstrem Indonesia 2027', 0, '07:00', '12:00', 'DIJADWALKAN')
  await sem('Kalibrasi Sensor Suhu Otomatis', 0, '12:00', '16:00', 'BERLANGSUNG')
  await sem('Diskusi Panel Aktivitas Gempa Bumi', 2, '07:00', '12:00', 'DIJADWALKAN', rr.id, andi.id, 'lengkap')
  await sem('Webinar Kualitas Udara Perkotaan', 4, '12:00', '16:00', 'MENUNGGU_VERIFIKASI', onl.id, nabila.id, 'lengkap')
  const ret = await sem('Workshop Analisis Data Hujan', 7, '07:00', '12:00', 'DIKEMBALIKAN', rr.id, nabila.id, 'surat')
  await db.seminar.update({ where: { id: ret.id }, data: { returnReason: 'Surat izin belum ditandatangani, mohon unggah ulang.' } })
  const batal = await sem('Sosialisasi Peringatan Dini Tsunami', 5, '07:00', '12:00', 'DIBATALKAN', aud.id, andi.id, 'surat')
  await db.seminar.update({ where: { id: batal.id }, data: { cancelledBy: 'USER', cancelledAt: new Date() } })

  // Dua seminar selesai lengkap: peserta, materi, dan (salah satunya) berita
  for (const [title, off, tag] of [['Dampak La Nina terhadap Curah Hujan', -14, 'a'], ['Pemodelan Numerik Cuaca (WRF)', -28, 'b']] as const) {
    const s = await sem(title, off, '07:00', '12:00', 'SELESAI', aud.id, nabila.id, 'surat')
    if ((await db.attendance.count({ where: { seminarId: s.id } })) === 0)
      for (const [i, n] of ['Dewi Lestari', 'Hendra Gunawan', 'Maya Sari', 'Rizky Pratama'].entries())
        await db.attendance.create({ data: { seminarId: s.id, name: n, nip: `19900101${tag === 'a' ? 1 : 2}${i}`, email: `${n.split(' ')[0].toLowerCase()}.${tag}@contoh.go.id` } })
    if ((await db.material.count({ where: { seminarId: s.id } })) === 0)
      await db.material.create({ data: { seminarId: s.id, presenter: 'Dr. Sari Utami', driveUrl: 'https://drive.google.com/drive/folders/contoh' } })
    if (tag === 'a' && !(await db.news.findUnique({ where: { seminarId: s.id } })))
      await db.news.create({ data: { seminarId: s.id, authorId: nabila.id, title: `Dokumentasi: ${title}`, body: 'Seminar berlangsung lancar dan dihadiri peserta dari berbagai unit kerja.' } })
  }
  console.log('Seed selesai. Masuk dengan admin@bmkg.go.id atau nabila.putri@bmkg.go.id, sandi SEMINAR#2026')
}
main().finally(() => db.$disconnect())
