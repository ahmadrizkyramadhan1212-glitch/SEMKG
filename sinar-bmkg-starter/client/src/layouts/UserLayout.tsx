// Kerangka halaman untuk peran User: navigasi atas + menu akun.
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from '../components/Logo'
import AkunMenu from '../components/AkunMenu'
import { get } from '../lib/api'

export default function UserLayout() {
  const link = ({ isActive }: { isActive: boolean }) => `l${isActive ? ' on' : ''}`
  const [unreadNotif, setUnreadNotif] = useState(0)

  useEffect(() => {
    let aktif = true
    get<{ belumDibaca: number }>('/api/notifikasi/unread-count')
      .then((res) => {
        if (aktif) setUnreadNotif(res.belumDibaca || 0)
      })
      .catch(() => {})
    return () => {
      aktif = false
    }
  }, [])

  return (
    <div className="pub">
      <nav className="nav" aria-label="Navigasi utama">
        <NavLink to="/" className="lg">
          <Logo height={36} />
          <span>
            <b>SEMINAR BMKG</b>
            <small>Sistem Informasi Seminar Ilmiah</small>
          </span>
        </NavLink>
        <NavLink to="/" end className={link}>
          Beranda
        </NavLink>
        <NavLink to="/riwayat" className={link}>
          Riwayat Seminar
        </NavLink>
        <NavLink to="/seminar-saya" className={link}>
          Seminar Saya
          {unreadNotif > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: '#ef4444',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 999,
                display: 'inline-block',
                verticalAlign: 'middle',
              }}
              title={`${unreadNotif} pengajuan perlu revisi / penolakan`}
            >
              {unreadNotif}
            </span>
          )}
        </NavLink>
        <NavLink to="/hasil-seminar" className={link}>
          Hasil Seminar
        </NavLink>
        <AkunMenu />
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
