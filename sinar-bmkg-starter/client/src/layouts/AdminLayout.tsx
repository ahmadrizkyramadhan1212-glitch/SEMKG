// Kerangka admin: sidebar biru + konten. Lencana merah Verifikasi = jumlah pengajuan menunggu.
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { get } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Logo } from '../components/Logo'
import GantiSandiModal from '../components/GantiSandiModal'

const MENU = [
  { ke: '/admin', label: 'Dashboard', akhir: true },
  { ke: '/admin/verifikasi', label: 'Verifikasi Seminar', lencana: true },
  { ke: '/admin/seminar', label: 'Semua Seminar' },
  { ke: '/admin/akun', label: 'Kelola Akun' },
  { ke: '/admin/arsip', label: 'Arsip & Riwayat' },
  { ke: '/admin/audit', label: 'Audit Log' },
]

export default function AdminLayout() {
  const { me, keluar } = useAuth()
  const navigate = useNavigate()
  const [buka, setBuka] = useState(false)
  const [gantiSandi, setGantiSandi] = useState(false)
  const [menunggu, setMenunggu] = useState(0)

  // Lencana merah: jumlah pengajuan menunggu verifikasi, diperbarui tiap pindah rute admin
  useEffect(() => {
    let batal = false
    get<{ jumlah: number }>('/api/admin/menunggu-count')
      .then((r) => !batal && setMenunggu(r.jumlah))
      .catch(() => {})
    return () => {
      batal = true
    }
  }, [buka])

  const tampilMenu = (m: (typeof MENU)[number]) => (
    <NavLink key={m.ke} to={m.ke} end={m.akhir} className={({ isActive }) => `m${isActive ? ' on' : ''}`} onClick={() => setBuka(false)}>
      {m.label}
      {m.lencana && menunggu > 0 && <span className="bgred" style={{ marginLeft: 8, fontWeight: 800 }}>{menunggu}</span>}
    </NavLink>
  )

  return (
    <>
      <aside className={`side ${buka ? 'open' : ''}`}>
        <div className="lg">
          <Logo height={36} />
          <span>
            <b>SEMINAR BMKG</b>
            <small>Panel Admin</small>
          </span>
        </div>
        {MENU.map(tampilMenu)}
        <h6>Akun</h6>
        <a className="m" onClick={() => { setGantiSandi(true); setBuka(false) }} role="button">
          Ganti Kata Sandi
        </a>
        <a
          className="m"
          role="button"
          onClick={async () => {
            await keluar()
            navigate('/')
          }}
        >
          Keluar
        </a>
        <div style={{ marginTop: 'auto', fontSize: 12, opacity: 0.85 }}>
          Masuk sebagai
          <br />
          <strong>{me?.name}</strong>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
      {gantiSandi && <GantiSandiModal tutup={() => setGantiSandi(false)} />}
    </>
  )
}
