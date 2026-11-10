// Halaman publik: Klaim Ulang Sertifikat via Email (Re-send Claim).
// Sistem mencocokkan data presensi dan mengirimkan ulang file sertifikat langsung ke email penerima
// tanpa menampilkan berkas di layar publik.
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { post } from '../lib/api'
import { Logo } from '../components/Logo'

export default function KlaimSertifikat() {
  const [email, setEmail] = useState('')
  const [nip, setNip] = useState('')
  const [galat, setGalat] = useState('')
  const [pesanSukses, setPesanSukses] = useState('')
  const [proses, setProses] = useState(false)

  const kirim = async (e: FormEvent) => {
    e.preventDefault()
    setProses(true)
    setGalat('')
    setPesanSukses('')
    try {
      const payload: Record<string, string> = { email }
      if (nip.trim()) payload.nip = nip.trim()
      const res = await post<{ ok: boolean; pesan: string; jumlah?: number }>('/api/sertifikat/klaim', payload)
      setPesanSukses(
        res.pesan ||
          'Sertifikat berhasil diproses! Berkas sertifikat PDF resmi telah dikirimkan langsung ke email Anda.',
      )
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Gagal memproses klaim sertifikat')
    } finally {
      setProses(false)
    }
  }

  return (
    <div className="lgw">
      <div className="card" style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <Logo height={52} />
          <div>
            <h2>Klaim Ulang Sertifikat</h2>
            <p className="hint">Sistem Informasi Seminar Ilmiah BMKG</p>
          </div>
        </div>

        <p className="hint" style={{ marginBottom: 16, fontSize: '0.85rem', lineHeight: 1.4 }}>
          Masukkan alamat email yang Anda gunakan saat presensi seminar. Sistem akan memverifikasi data dan mengirimkan ulang berkas sertifikat resmi (PDF) langsung ke kotak masuk email Anda.
        </p>

        {pesanSukses ? (
          <div className="ind ok" role="status" style={{ padding: '14px 16px', borderRadius: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#166534', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✓</span>
              <span>Sertifikat Berhasil Dikirim Ulang!</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#14532d', lineHeight: 1.45 }}>{pesanSukses}</p>
            <button
              type="button"
              className="btn sm"
              style={{ marginTop: 14 }}
              onClick={() => {
                setPesanSukses('')
                setEmail('')
                setNip('')
              }}
            >
              Kirim untuk Email Lain
            </button>
          </div>
        ) : (
          <form onSubmit={kirim}>
            <label htmlFor="kl-email">Email saat absensi / pendaftaran *</label>
            <input
              id="kl-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nama@bmkg.go.id atau email pribadi"
              autoComplete="email"
            />

            <label htmlFor="kl-nip">NIP (opsional bagi pegawai BMKG)</label>
            <input
              id="kl-nip"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              placeholder="Diisi bila saat presensi mencantumkan NIP"
              autoComplete="off"
            />

            {galat && (
              <p className="err" role="alert" style={{ marginTop: 8 }}>
                {galat}
              </p>
            )}

            <button className="btn pr" style={{ width: '100%', marginTop: 16 }} disabled={proses || !email.trim()}>
              {proses ? 'Mencocokkan data & mengirim email…' : 'Kirim Ulang Sertifikat ke Email'}
            </button>
          </form>
        )}

        <p className="hint" style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/verifikasi">Verifikasi Nomor Seri Sertifikat</Link> · <Link to="/">Beranda</Link>
        </p>
      </div>
    </div>
  )
}
