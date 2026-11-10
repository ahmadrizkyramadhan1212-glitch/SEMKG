// Kerangka halaman publik: navigasi kaca + konten + footer.
// Bila sudah masuk, tombol "Masuk" diganti tautan halaman akun + menu akun.
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Logo } from '../components/Logo'
import AkunMenu from '../components/AkunMenu'

export default function PublicLayout() {
  const { me, memuat } = useAuth()
  const link = ({ isActive }: { isActive: boolean }) => `l${isActive ? ' on' : ''}`

  return (
    <div className="pub">
      <nav className="nav" aria-label="Navigasi utama">
        <Link to="/" className="lg">
          <Logo height={36} />
          <span>
            <b>SEMINAR BMKG</b>
            <small>Sistem Informasi Seminar Ilmiah</small>
          </span>
        </Link>
        <NavLink to="/" end className={link}>
          Beranda
        </NavLink>
        <NavLink to="/riwayat" className={link}>
          Riwayat Seminar
        </NavLink>
        {me?.role === 'USER' && (
          <>
            <NavLink to="/seminar-saya" className={link}>
              Seminar Saya
            </NavLink>
            <NavLink to="/hasil-seminar" className={link}>
              Hasil Seminar
            </NavLink>
          </>
        )}
        {me?.role === 'ADMIN' && (
          <NavLink to="/admin" className={link}>
            Panel Admin
          </NavLink>
        )}
        {!memuat && !me && (
          <NavLink to="/login" className="btn pr">
            Masuk
          </NavLink>
        )}
        {me && <AkunMenu />}
      </nav>
      <Outlet />
      <footer className="foot">
        <p>
          <Link to="/klaim-sertifikat">Klaim Sertifikat</Link> · <Link to="/verifikasi">Verifikasi Sertifikat</Link>
        </p>
        <p>SEMINAR BMKG — Sistem Informasi Seminar Ilmiah © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
