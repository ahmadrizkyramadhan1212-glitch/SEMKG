// Titik masuk Express: middleware dasar + rute kesehatan. Rute fitur ditambah per sprint.
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { env, isProd } from './env.js'
import { db } from './db.js'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { auditRouter } from './routes/audit.js'
import { seminarsRouter, berkasRouter, galatUnggah } from './routes/seminars.js'
import { publikRouter } from './routes/publik.js'
import { adminRouter } from './routes/admin.js'
import { absensiRouter } from './routes/absensi.js'
import { kontenRouter } from './routes/konten.js'
import { sertifikatRouter } from './routes/sertifikat.js'
import { notifikasiRouter } from './routes/notifikasi.js'
import { apiV1Router } from './routes/api-v1.js'

const app = express()

app.set('trust proxy', 1)
// Keamanan header dasar; crossOriginResourcePolicy longgar agar gambar/PDF bisa dibuka client dev
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(
  cors({
    origin: [env.appUrl],
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/audit', auditRouter)
app.use('/api/seminars', seminarsRouter)
app.use('/api/berkas', berkasRouter)
app.use('/api/publik', publikRouter)
app.use('/api/v1', apiV1Router)
app.use('/api/admin', adminRouter)
app.use('/api/absensi', absensiRouter)
app.use('/api/konten', kontenRouter)
app.use('/api/sertifikat', sertifikatRouter)
app.use('/api/notifikasi', notifikasiRouter)

app.get('/api/health', async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`
    res.json({ ok: true, db: 'tersambung', time: new Date().toISOString() })
  } catch {
    res.status(500).json({ ok: false, db: 'gagal tersambung' })
  }
})

// Penanganan galat terpusat: bentuk respons selalu sama
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const unggah = galatUnggah(err)
  if (unggah) {
    return res.status(unggah.status ?? 400).json({ error: unggah.message ?? 'Unggahan ditolak' })
  }
  console.error(err)
  const status = typeof err === 'object' && err !== null && 'status' in err ? Number((err as { status: unknown }).status) || 500 : 500
  const message = status < 500 && typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : 'Terjadi galat di server'
  res.status(status).json({ error: message })
})

app.listen(env.port, () => {
  console.log(`SEMINAR BMKG server berjalan di port ${env.port} (${isProd ? 'produksi' : 'pengembangan'})`)
})
