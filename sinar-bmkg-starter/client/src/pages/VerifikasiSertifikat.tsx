// Halaman publik: Verifikasi Sertifikat — tujuan QR pada sertifikat (/verifikasi?n=NOMOR).
// Menampilkan identitas pemegang bila nomor seri valid.
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { get } from '../lib/api'
import { Logo } from '../components/Logo'

interface Hasil {
  nomor: string
  nama: string
  nip: string
  peran?: string
  seminar: string
  tanggal: string
  lokasi: string
}

export default function VerifikasiSertifikat() {
  const [params] = useSearchParams()
  const [nomor, setNomor] = useState(params.get('n') ?? '')
  const [hasil, setHasil] = useState<Hasil | null>(null)
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  const periksa = useCallback(async (n: string) => {
    if (!n.trim()) return
    setProses(true)
    setGalat('')
    setHasil(null)
    try {
      setHasil(await get<Hasil>(`/api/sertifikat/verifikasi/${encodeURIComponent(n.trim())}`))
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Nomor tidak dapat diverifikasi')
    } finally {
      setProses(false)
    }
  }, [])

  useEffect(() => {
    const awal = params.get('n')
    if (awal) void periksa(awal)
  }, [params, periksa])

  return (
    <div className="lgw">
      <div className="card" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
          <Logo height={52} />
          <div>
            <h2>Verifikasi Sertifikat</h2>
            <p className="hint">Periksa keaslian nomor seri sertifikat</p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void periksa(nomor)
          }}
        >
          <label htmlFor="vf-nomor">Nomor seri sertifikat</label>
          <input id="vf-nomor" value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="SERT/BMKG/2026/XXXXXX/001" required />
          <button className="btn pr" style={{ width: '100%', marginTop: 12 }} disabled={proses}>
            {proses ? 'Memeriksa…' : 'Periksa'}
          </button>
        </form>

        {galat && <p className="err" role="alert" style={{ marginTop: 12 }}>{galat}</p>}
        {hasil && (
          <div className="ind ok" role="status" style={{ marginTop: 14 }}>
            <b>Sertifikat SAH</b>
            <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6, marginTop: 8 }}>
              <dt className="hint">Nomor</dt>
              <dd style={{ wordBreak: 'break-all' }}>{hasil.nomor}</dd>
              <dt className="hint">Nama</dt>
              <dd>{hasil.nama}</dd>
              <dt className="hint">Peran</dt>
              <dd><strong>{hasil.peran || 'Peserta'}</strong></dd>
              <dt className="hint">NIP</dt>
              <dd>{hasil.nip || '—'}</dd>
              <dt className="hint">Seminar</dt>
              <dd>{hasil.seminar}</dd>
              <dt className="hint">Tanggal</dt>
              <dd>{new Date(hasil.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</dd>
              <dt className="hint">Lokasi</dt>
              <dd>{hasil.lokasi}</dd>
            </dl>
          </div>
        )}
        <p className="hint" style={{ marginTop: 12, textAlign: 'center' }}>
          <Link to="/klaim-sertifikat">Klaim Sertifikat</Link> · <Link to="/">Beranda</Link>
        </p>
      </div>
    </div>
  )
}
