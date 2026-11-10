// Tab Peserta & Presensi: Tautan web presensi, status aktivasi via host 'Mulai Seminar',
// daftar hadir peserta (Nama, Email, Instansi, Status Peserta), serta unduh CSV.
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { get, post, del } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Loading, Empty, ErrorBox } from './ui'
import type { Seminar } from '../lib/types'

interface Peserta {
  id: string
  name: string
  email: string
  instansi?: string | null
  statusPeserta?: string | null
  source: string
  createdAt: string
}

export default function PesertaTab({ seminar, berubah }: { seminar: Seminar; berubah: () => void }) {
  const { me } = useAuth()
  const [peserta, setPeserta] = useState<Peserta[] | null>(null)
  const [galat, setGalat] = useState('')

  const muat = useCallback(async () => {
    try {
      setPeserta(await get<Peserta[]>(`/api/absensi/${seminar.id}/peserta`))
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal memuat daftar peserta')
    }
  }, [seminar.id])

  useEffect(() => {
    void muat()
  }, [muat])

  const link = `${window.location.origin}/absen/${seminar.attendToken}`

  return (
    <div className="cols">
      {/* Kolom Kiri: Tabel Daftar Hadir Peserta */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Daftar Hadir Peserta</h3>
          {peserta && (
            <span className="hint" style={{ fontSize: 13 }}>
              Total: <b>{peserta.length}</b> orang
            </span>
          )}
        </div>

        {galat && <ErrorBox message={galat} onCobaLagi={muat} />}
        {!galat && peserta === null && <Loading />}
        {!galat && peserta?.length === 0 && (
          <Empty
            title="Belum ada presensi peserta"
            hint="Peserta mengisi presensi secara mandiri melalui tautan web saat seminar berlangsung."
          />
        )}

        {peserta && peserta.length > 0 && (
          <>
            <div className="sc" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Lengkap</th>
                    <th>Email</th>
                    <th>Instansi</th>
                    <th>Status</th>
                    <th>Waktu Presensi</th>
                    {me?.role === 'ADMIN' && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {peserta.map((p, i) => (
                    <tr key={p.id}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>{p.email}</td>
                      <td>{p.instansi || '—'}</td>
                      <td>
                        <span
                          className={`badge ${
                            p.statusPeserta === 'Pegawai BMKG'
                              ? 'bgblue'
                              : p.statusPeserta === 'Mahasiswa'
                                ? 'bgyellow'
                                : 'bggray'
                          }`}
                          style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99 }}
                        >
                          {p.statusPeserta || 'Umum'}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                        {new Date(p.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </td>
                      {me?.role === 'ADMIN' && (
                        <td>
                          <button
                            className="btn sm dgr"
                            onClick={async () => {
                              if (!confirm(`Hapus data presensi ${p.name}?`)) return
                              await del(`/api/absensi/peserta/${p.id}`).catch((e) => alert(e.message))
                              void muat()
                            }}
                          >
                            Hapus
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <a className="btn" href={`/api/absensi/${seminar.id}/peserta.csv`} download>
            ⬇ Unduh Daftar Hadir (CSV)
          </a>
          {me?.role === 'ADMIN' && <TambahManual seminarId={seminar.id} selesai={() => { void muat(); berubah() }} />}
        </div>
      </div>

      {/* Kolom Kanan: Tautan Presensi Peserta & Status Alur Presensi */}
      <div className="card">
        <h3>Alur &amp; Tautan Presensi</h3>
        <p className="hint" style={{ fontSize: 12, lineHeight: 1.5 }}>
          Presensi seminar murni dijalankan secara online via tautan web. Peserta cukup membuka link berikut di peramban (browser) laptop maupun smartphone mereka.
        </p>

        {/* Status Akses Presensi Berdasarkan Tombol Mulai Seminar */}
        <div style={{ marginTop: 12 }}>
          {seminar.status === 'BERLANGSUNG' ? (
            <div
              className="ind ok"
              style={{ padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span style={{ fontSize: 20 }}>🟢</span>
              <div>
                <b style={{ display: 'block', fontSize: 13 }}>Presensi Sedang AKTIF</b>
                <span style={{ fontSize: 11 }}>Seminar sedang berlangsung. Peserta dapat langsung mengakses tautan presensi dan mengisi data kehadiran.</span>
              </div>
            </div>
          ) : seminar.status === 'SELESAI' ? (
            <div
              className="ind"
              style={{ background: 'var(--c)', border: '1px solid var(--bd)', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span style={{ fontSize: 20 }}>⚪</span>
              <div>
                <b style={{ display: 'block', fontSize: 13 }}>Presensi Telah DITUTUP</b>
                <span style={{ fontSize: 11 }}>Seminar telah dinyatakan selesai. Tautan formulir presensi tidak lagi menerima isian kehadiran.</span>
              </div>
            </div>
          ) : (
            <div
              className="ind"
              style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span style={{ fontSize: 20 }}>⏳</span>
              <div>
                <b style={{ display: 'block', fontSize: 13 }}>Menunggu Host Klik 'Mulai Seminar'</b>
                <span style={{ fontSize: 11 }}>
                  Presensi belum dibuka. Akses formulir akan otomatis aktif ketika host/penyelenggara mengklik tombol <strong>'▶ Mulai Seminar'</strong> di tab Detail.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Box Tautan Web Presensi */}
        <div style={{ marginTop: 16, background: 'var(--c)', border: '1px solid var(--bd)', borderRadius: 12, padding: 14 }}>
          <label style={{ fontSize: 12, color: 'var(--m)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
            Tautan Presensi Web:
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              readOnly
              value={link}
              style={{ flex: 1, minWidth: 200, fontFamily: 'monospace', fontSize: 12, background: 'var(--bg)', cursor: 'text' }}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              className="btn pr sm"
              onClick={() => {
                void navigator.clipboard.writeText(link)
                alert('Tautan presensi berhasil disalin ke clipboard!')
              }}
            >
              📋 Salin Tautan
            </button>
            <a href={link} target="_blank" rel="noreferrer" className="btn sm">
              Buka Form ↗
            </a>
          </div>
          <span className="hint" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
            Tautan ini dapat dibagikan langsung melalui chat room Zoom, grup WhatsApp, atau slide presentasi.
          </span>
        </div>
      </div>
    </div>
  )
}

function TambahManual({ seminarId, selesai }: { seminarId: string; selesai: () => void }) {
  const [buka, setBuka] = useState(false)
  const [f, setF] = useState({
    nama_lengkap: '',
    email: '',
    instansi: '',
    status_peserta: 'Umum' as 'Pegawai BMKG' | 'Mahasiswa' | 'Umum',
  })
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  const kirim = async (e: FormEvent) => {
    e.preventDefault()
    setGalat('')
    setProses(true)
    try {
      await post(`/api/absensi/${seminarId}/peserta`, f)
      setBuka(false)
      setF({ nama_lengkap: '', email: '', instansi: '', status_peserta: 'Umum' })
      selesai()
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Gagal menambah peserta')
    } finally {
      setProses(false)
    }
  }

  if (!buka) {
    return (
      <button className="btn" onClick={() => setBuka(true)}>
        + Tambah Peserta Manual (Admin)
      </button>
    )
  }

  return (
    <form onSubmit={kirim} style={{ marginTop: 14, padding: 14, border: '1px solid var(--bd)', borderRadius: 10, background: 'var(--c)' }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 700 }}>Tambah Peserta Manual</h4>
      <label htmlFor="tm-nama" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
        Nama Lengkap *
      </label>
      <input
        id="tm-nama"
        value={f.nama_lengkap}
        onChange={(e) => setF({ ...f, nama_lengkap: e.target.value })}
        required
        minLength={3}
        placeholder="Nama peserta"
        style={{ width: '100%', marginBottom: 8 }}
      />

      <label htmlFor="tm-email" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
        Email *
      </label>
      <input
        id="tm-email"
        type="email"
        value={f.email}
        onChange={(e) => setF({ ...f, email: e.target.value })}
        required
        placeholder="email@domain.com"
        style={{ width: '100%', marginBottom: 8 }}
      />

      <label htmlFor="tm-instansi" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
        Asal Instansi (Opsional)
      </label>
      <input
        id="tm-instansi"
        value={f.instansi}
        onChange={(e) => setF({ ...f, instansi: e.target.value })}
        placeholder="Asal instansi / unit kerja"
        style={{ width: '100%', marginBottom: 8 }}
      />

      <label htmlFor="tm-status" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
        Status Peserta
      </label>
      <select
        id="tm-status"
        value={f.status_peserta}
        onChange={(e) => setF({ ...f, status_peserta: e.target.value as any })}
        style={{ width: '100%', marginBottom: 10 }}
      >
        <option value="Umum">Umum</option>
        <option value="Pegawai BMKG">Pegawai BMKG</option>
        <option value="Mahasiswa">Mahasiswa</option>
      </select>

      {galat && (
        <p className="err" role="alert" style={{ marginBottom: 10 }}>
          {galat}
        </p>
      )}

      <div className="dn" style={{ display: 'flex', gap: 6 }}>
        <button className="btn pr sm" disabled={proses}>
          {proses ? 'Menyimpan…' : 'Simpan'}
        </button>
        <button type="button" className="btn sm" onClick={() => setBuka(false)}>
          Batal
        </button>
      </div>
    </form>
  )
}
