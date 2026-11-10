// Otentikasi JWT di cookie httpOnly. Token hanya berisi id pengguna.
import jwt from 'jsonwebtoken'
import type { Response, Request, NextFunction } from 'express'
import { env, isProd } from '../env.js'
import { db } from '../db.js'
import type { Role } from '@prisma/client'

export const COOKIE_NAME = 'SEMINAR_token'

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '30d' })
}

// ingat = true -> cookie bertahan 30 hari; false -> cookie sesi (hilang saat browser ditutup)
export function setAuthCookie(res: Response, token: string, ingat: boolean) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    ...(ingat ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
  })
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME)
}

// Tipe permintaan setelah requireAuth: req.user terisi
export interface AuthRequest extends Request {
  user?: { id: string; role: Role; name: string }
}

// Middleware: pastikan pemanggil membawa token valid dan akun masih aktif
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME] as string | undefined
    if (!token) return res.status(401).json({ error: 'Silakan masuk terlebih dahulu' })
    const payload = jwt.verify(token, env.jwtSecret) as { sub?: string }
    if (!payload.sub) return res.status(401).json({ error: 'Sesi tidak valid, silakan masuk lagi' })
    const user = await db.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.active) return res.status(401).json({ error: 'Akun tidak aktif atau tidak ditemukan' })
    req.user = { id: user.id, role: user.role, name: user.name }
    next()
  } catch {
    return res.status(401).json({ error: 'Sesi kedaluwarsa, silakan masuk lagi' })
  }
}

// Middleware: setelah requireAuth, batasi per peran
export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Silakan masuk terlebih dahulu' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Anda tidak punya hak akses' })
    next()
  }
}
