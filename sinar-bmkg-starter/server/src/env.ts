// Muat variabel lingkungan dari .env (rahasia hanya di sini, tidak pernah di kode)
import dotenv from 'dotenv'
dotenv.config()

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback
  if (!v) throw new Error(`Variabel lingkungan ${name} wajib diisi di server/.env`)
  return v
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET', 'rahasia-pengembangan-jangan-dipakai-di-produksi'),
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  smtp: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'SEMINAR BMKG <SEMINAR@bmkg.go.id>',
  },
  nodeEnv: process.env.NODE_ENV ?? 'development',
}

export const isProd = env.nodeEnv === 'production'
