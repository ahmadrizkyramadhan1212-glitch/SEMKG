// Halaman Masuk SEMINAR BMKG: 100% Pure Code, Authentic BMKG Seal Inline SVG, Fit 100vh tanpa scrollbar
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { post } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Logo } from '../components/Logo'

export default function Login() {
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [id, setId] = useState('nabila.putri@bmkg.go.id')
  const [sandi, setSandi] = useState('password123')
  const [lihatSandi, setLihatSandi] = useState(false)
  const [ingat, setIngat] = useState(false)
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)
  const [bukaLupaSandi, setBukaLupaSandi] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setGalat('')
    setProses(true)
    try {
      const me = await post<{ role: 'ADMIN' | 'USER' }>('/api/auth/login', { id, password: sandi, ingat })
      await refresh()
      const ke = (location.state as { dari?: string } | null)?.dari ?? (me.role === 'ADMIN' ? '/admin' : '/')
      navigate(ke, { replace: true })
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Gagal masuk. Periksa kembali username dan kata sandi Anda.')
    } finally {
      setProses(false)
    }
  }

  const params = new URLSearchParams(location.search)
  const pesan = params.get('pesan')

  return (
    <div className="login-split-page min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-slate-50 dark:bg-[#08142b] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* ========================================== */}
      {/* PANEL KIRI: HERO & BRANDING (PURE SVG/CSS) */}
      {/* ========================================== */}
      <div className="relative w-full lg:w-1/2 bg-[#08142b] bg-grid-pattern flex flex-col justify-between items-center p-4 sm:p-6 lg:p-6 text-white overflow-hidden select-none min-h-[560px] lg:min-h-0 lg:h-screen lg:max-h-screen">
        
        {/* Efek Cahaya / Lens Flare & Bokeh Gradients */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/25 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 right-14 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-36 h-36 bg-sky-300/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Spacer */}
        <div className="hidden lg:block h-2" />

        {/* Content Group Center */}
        <div className="relative z-10 max-w-sm sm:max-w-md w-full flex flex-col items-center text-center my-auto">
          
          {/* Card Logo SEMINAR BMKG (Kecil & Pas: w-48 sampai w-52) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xl shadow-blue-950/70 border border-white/20 inline-flex flex-col items-center justify-center w-48 sm:w-52 mb-2 sm:mb-2.5 transform hover:scale-[1.02] transition-transform duration-300">
            {/* Logo BMKG Resmi (100% Pure Inline SVG) */}
            <Logo height={66} className="mb-1.5" />
            
            {/* Teks Brand SEMINAR BMKG */}
            <h2 className="text-xl sm:text-2xl font-black text-[#0f2a4a] tracking-wider uppercase leading-none mb-0.5">
              SEMINAR BMKG
            </h2>
            <p className="text-[8px] sm:text-[8.5px] font-bold text-slate-500 tracking-wider uppercase">
            </p>
          </div>

          {/* Pill Badge Sistem Informasi */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 backdrop-blur-md mb-2">
            <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[11px] font-semibold text-amber-300 tracking-wide uppercase">
              SISTEM INFORMASI SEMINAR ILMIAH
            </span>
          </div>

          {/* Judul & Deskripsi */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1 drop-shadow-md">
            Seminar Ilmiah BMKG
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal max-w-sm mx-auto mb-3">
            Akses jadwal seminar unit kerja, ajukan seminar ilmiah Anda, dan kelola presensi kegiatan secara terintegrasi.
          </p>

          {/* 3 Tombol Navigasi Glassmorphism */}
          <div className="grid grid-cols-3 gap-2.5 max-w-sm w-full mx-auto">
            {/* Tombol 1: Jadwal */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-center transition-all duration-200 transform active:scale-95 group cursor-pointer outline-none"
            >
              <div className="w-8 h-8 mx-auto mb-1 rounded-xl bg-white/15 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-white block">Jadwal</span>
            </button>

            {/* Tombol 2: Ajukan */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-center transition-all duration-200 transform active:scale-95 group cursor-pointer outline-none"
            >
              <div className="w-8 h-8 mx-auto mb-1 rounded-xl bg-white/15 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-white block">Ajukan</span>
            </button>

            {/* Tombol 3: Presensi */}
            <button
              type="button"
              onClick={() => navigate('/absensi')}
              className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-center transition-all duration-200 transform active:scale-95 group cursor-pointer outline-none"
            >
              <div className="w-8 h-8 mx-auto mb-1 rounded-xl bg-white/15 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-white block">Presensi</span>
            </button>
          </div>

        </div>

        {/* Footer Text Left Panel */}
        <div className="relative z-10 text-center text-[11px] text-slate-400 py-1">
          &copy; 2026 Badan Meteorologi, Klimatologi, dan Geofisika
        </div>
      </div>

      {/* ========================================== */}
      {/* PANEL KANAN: FORM LOGIN                   */}
      {/* ========================================== */}
      <div className="w-full lg:w-1/2 bg-slate-50 dark:bg-[#08142b] text-slate-800 dark:text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 transition-colors duration-300 min-h-[560px] lg:min-h-0 lg:h-screen lg:max-h-screen lg:overflow-hidden relative">
        
        {/* Top Bar Navigation (Kembali ke Beranda) */}
        <div className="flex items-center justify-start w-full max-w-md mx-auto mb-3 sm:mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white dark:bg-[#132238] shadow-sm border border-slate-200 dark:border-slate-700/70 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Container Form Login */}
        <div className="max-w-md w-full mx-auto my-auto">
          <div className="bg-white dark:bg-[#132238] p-5 sm:p-7 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-2xl dark:shadow-black/50 border border-slate-100 dark:border-slate-700/60 transition-all duration-300">
            
            {/* Header Form */}
            <div className="mb-4 sm:mb-5">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
                Masuk ke Akun Anda
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Silakan masukkan username dan kata sandi Anda untuk melanjutkan.
              </p>
            </div>

            {/* Pesan info redirect */}
            {pesan && (
              <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-xl p-2.5 text-xs mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeLinecap="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
                </svg>
                <span>{pesan}</span>
              </div>
            )}

            {/* Pesan galat */}
            {galat && (
              <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 rounded-xl p-2.5 text-xs mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeLinecap="round" strokeWidth="2" d="M15 9l-6 6m0-6l6 6" />
                </svg>
                <span>{galat}</span>
              </div>
            )}

            {/* Form Login */}
            <form onSubmit={submit} className="space-y-4">
              
              {/* Input Username / Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Username / Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    required
                    placeholder="nama@bmkg.go.id"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Input Kata Sandi */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={lihatSandi ? 'text' : 'password'}
                    value={sandi}
                    onChange={(e) => setSandi(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setLihatSandi(!lihatSandi)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {lihatSandi ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.018 10.018 0 013.682-.763c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m-4.692-4.692a3 3 0 00-4.243-4.243" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Checkbox Ingat Saya & Lupa Kata Sandi */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ingat}
                    onChange={(e) => setIngat(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Ingat Saya</span>
                </label>
                <button
                  type="button"
                  onClick={() => setBukaLupaSandi(true)}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Lupa Kata Sandi?
                </button>
              </div>

              {/* Tombol Hijau Utama Khas BMKG (#00a651) */}
              <button
                type="submit"
                disabled={proses}
                className="w-full py-3 px-4 rounded-xl bg-[#00a651] hover:bg-[#008f45] active:bg-[#007a3b] text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-emerald-600/30 transition-all transform active:scale-[0.99] mt-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {proses ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses…</span>
                  </>
                ) : (
                  <span>MASUK</span>
                )}
              </button>
            </form>
          </div>

          {/* Footer Note Registrasi */}
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed max-w-xs mx-auto">
            Belum memiliki akun? Hubungi Admin Unit Kerja Anda untuk pendaftaran.
          </p>
        </div>

        {/* Bottom Spacer */}
        <div className="h-2" />
      </div>

      {/* Modal Bantuan Lupa Kata Sandi */}
      {bukaLupaSandi && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setBukaLupaSandi(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-[#132238] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Bantuan Reset Kata Sandi</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Demi keamanan akun dinas BMKG, reset kata sandi dilakukan secara terverifikasi melalui <strong>Administrator Sistem SEMINAR BMKG</strong> atau Admin Unit Kerja Anda.
            </p>
            <div className="bg-blue-50 dark:bg-navy-950/60 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 mb-5 border border-blue-100 dark:border-blue-900/40">
              💡 Silakan hubungi bagian pengelola seminar / kepegawaian di unit kerja Anda dengan menyertakan <strong>NIP</strong> dan <strong>Email dinas BMKG</strong> Anda.
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all cursor-pointer"
                onClick={() => setBukaLupaSandi(false)}
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
