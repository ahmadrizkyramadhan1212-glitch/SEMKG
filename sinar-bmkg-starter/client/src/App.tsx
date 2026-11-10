// Peta rute lengkap. Rute dilindungi RequireAuth/RequireAdmin; hak akses ditegakkan ulang di server.
import { Navigate, Route, Routes } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import UserLayout from './layouts/UserLayout'
import AdminLayout from './layouts/AdminLayout'
import { RequireAuth, RequireAdmin } from './layouts/guards'
import ThemeFab from './components/ThemeFab'

import Home from './pages/Home'
import Riwayat from './pages/Riwayat'
import Login from './pages/Login'
import BuatSeminar from './pages/BuatSeminar'
import SeminarSaya from './pages/SeminarSaya'
import SeminarDetail from './pages/SeminarDetail'
import SeminarPublik from './pages/SeminarPublik'
import Absensi from './pages/Absensi'
import HasilSeminar from './pages/HasilSeminar'
import KlaimSertifikat from './pages/KlaimSertifikat'
import VerifikasiSertifikat from './pages/VerifikasiSertifikat'
import KelolaAkun from './pages/admin/KelolaAkun'
import AuditLog from './pages/admin/AuditLog'
import Dashboard from './pages/admin/Dashboard'
import Verifikasi from './pages/admin/Verifikasi'
import SemuaSeminar from './pages/admin/SemuaSeminar'
import Arsip from './pages/admin/Arsip'

export default function App() {
  return (
    <>
      
      <ThemeFab />
      <Routes>
        {/* Publik */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="riwayat" element={<Riwayat />} />
          <Route path="seminar-publik/:id" element={<SeminarPublik />} />
        </Route>
        <Route path="login" element={<Login />} />
        <Route path="absen/:token" element={<Absensi />} />
        <Route path="klaim-sertifikat" element={<KlaimSertifikat />} />
        <Route path="verifikasi" element={<VerifikasiSertifikat />} />

        {/* User (harus masuk) */}
        <Route element={<RequireAuth />}>
          <Route element={<UserLayout />}>
            <Route index element={<Home />} />
            <Route path="seminar/baru" element={<BuatSeminar />} />
            <Route path="seminar-saya" element={<SeminarSaya />} />
            <Route path="seminar/:id" element={<SeminarDetail />} />
            <Route path="hasil-seminar" element={<HasilSeminar />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<RequireAdmin />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="verifikasi" element={<Verifikasi />} />
            <Route path="seminar" element={<SemuaSeminar />} />
            <Route path="akun" element={<KelolaAkun />} />
            <Route path="arsip" element={<Arsip />} />
            <Route path="audit" element={<AuditLog />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
