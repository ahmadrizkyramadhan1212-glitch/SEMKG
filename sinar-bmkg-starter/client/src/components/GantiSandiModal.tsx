// Modal ganti kata sandi: verifikasi sandi lama, sandi baru minimal 8 karakter, konfirmasi sandi.
// Render via React Portal ke document.body (root / body level) agar tidak tersangkut di container internal.
import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { post } from '../lib/api'

export default function GantiSandiModal({ tutup }: { tutup: () => void }) {
  const [lama, setLama] = useState('')
  const [baru, setBaru] = useState('')
  const [konfirmasi, setKonfirmasi] = useState('')
  const [galat, setGalat] = useState('')
  const [ok, setOk] = useState(false)
  const [proses, setProses] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setGalat('')

    if (baru.length < 8) {
      setGalat('Kata sandi baru minimal 8 karakter')
      return
    }

    if (baru !== konfirmasi) {
      setGalat('Konfirmasi kata sandi tidak cocok')
      return
    }

    setProses(true)
    try {
      await post('/api/auth/ganti-sandi', { lama, baru })
      setOk(true)
      setTimeout(tutup, 1400)
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Gagal mengganti kata sandi')
    } finally {
      setProses(false)
    }
  }

  // Dipindahkan ke body level melalui createPortal agar tidak terpotong container mana pun
  return createPortal(
    <div
      id="passwordModal"
      className="fixed inset-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && tutup()}
      role="dialog"
      aria-modal="true"
      aria-label="Ganti kata sandi"
    >
      <div
        className="bg-white dark:bg-navy-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Ganti Kata Sandi</h3>
          <button
            type="button"
            onClick={tutup}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>

        {ok ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Kata sandi berhasil diperbarui!</span>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {/* Kata Sandi Lama */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kata Sandi Lama
              </label>
              <input
                type="password"
                required
                value={lama}
                onChange={(e) => setLama(e.target.value)}
                placeholder="Masukkan kata sandi lama"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-950 border border-transparent focus:border-blue-500 text-xs focus:outline-none focus:bg-white dark:focus:bg-navy-950 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Kata Sandi Baru */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kata Sandi Baru (Minimal 8 Karakter)
              </label>
              <input
                type="password"
                minLength={8}
                required
                value={baru}
                onChange={(e) => setBaru(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-950 border border-transparent focus:border-blue-500 text-xs focus:outline-none focus:bg-white dark:focus:bg-navy-950 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Konfirmasi Kata Sandi Baru */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type="password"
                minLength={8}
                required
                value={konfirmasi}
                onChange={(e) => setKonfirmasi(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-950 border border-transparent focus:border-blue-500 text-xs focus:outline-none focus:bg-white dark:focus:bg-navy-950 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Pesan Error */}
            {galat && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-2.5 rounded-lg text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{galat}</span>
              </div>
            )}

            {/* Footer Button Modal */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={tutup}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={proses}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {proses ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
