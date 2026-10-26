import { labelJadwal } from '../../lib/sesi'
// Halaman admin: Verifikasi Seminar — daftar pengajuan dengan pratinjau surat/poster,
// indikator bentrok, tombol Setujui / Kembalikan (alasan wajib), dan bagian surat asli.
import { useCallback, useEffect, useState } from 'react'
import { get, post } from '../../lib/api'
import { Loading, Empty, ErrorBox, fmtTanggalPendek } from '../../components/ui'
import type { Seminar } from '../../lib/types'

type Jenis = Seminar & { user: { name: string; nip: string; email: string; unit: string | null } }

export default function Verifikasi() {
  const [data, setData] = useState<Jenis[] | null>(null)
  const [galat, setGalat] = useState('')
  const [pesan, setPesan] = useState('')
  const [kembali, setKembali] = useState<Jenis | null>(null)

  const muat = useCallback(async () => {
    setGalat('')
    try {
      setData(await get<Jenis[]>('/api/admin/seminars?status=MENUNGGU_VERIFIKASI'))
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal memuat pengajuan')
    }
  }, [])

  useEffect(() => {
    void muat()
  }, [muat])

  const setujui = async (s: Jenis) => {
    if (!confirm(`Setujui "${s.title}" (${fmtTanggalPendek(s.date)}, ${labelJadwal(s.startTime, s.endTime)})?`)) return
    try {
      await post(`/api/admin/seminars/${s.id}/setujui`)
      setPesan(`Seminar "${s.title}" disetujui. Email pemberitahuan terkirim ke pemilik.`)
      void muat()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menyetujui')
    }
  }

  return (
    <>
      <div className="top">
        <div>
          <h1>Verifikasi Seminar</h1>
          <p>Periksa pengajuan, pratinjau surat izin dan poster, lalu setujui atau kembalikan dengan alasan.</p>
        </div>
      </div>
      {pesan && <div className="ind ok" role="status">{pesan}</div>}
      {galat && <ErrorBox message={galat} onCobaLagi={muat} />}
      {!galat && data === null && <Loading />}
      {!galat && data?.length === 0 && <div className="card"><Empty title="Tidak ada pengajuan menunggu" hint="Semua pengajuan sudah diverifikasi." /></div>}
      {data?.map((s) => (
        <div className="card" key={s.id} style={{ marginBottom: 14 }}>
          <div className="dn" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <h3>{s.title}</h3>
              <p className="hint">
                Kode {s.code} · {fmtTanggalPendek(s.date)}, {labelJadwal(s.startTime, s.endTime)} · {s.locationOther ?? s.location.name}
              </p>
              <p className="hint">
                Pemilik: {s.user.name} ({s.user.nip}) · {s.user.unit ?? '—'} · {s.user.email}
              </p>
              {s.topic && <p style={{ marginTop: 6 }}>{s.topic}</p>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn pr" onClick={() => setujui(s)}>Setujui</button>
              <button className="btn dgr" onClick={() => setKembali(s)}>Kembalikan</button>
            </div>
          </div>
          <div className="cols" style={{ marginTop: 12 }}>
            <div>
              <b className="hint">Surat izin</b>
              <Pratinjau fileId={s.files.find((f) => f.kind === 'SURAT_IZIN')?.id} mime={s.files.find((f) => f.kind === 'SURAT_IZIN')?.mime} nama={s.files.find((f) => f.kind === 'SURAT_IZIN')?.originalName} />
            </div>
            <div>
              <b className="hint">Poster</b>
              <Pratinjau fileId={s.files.find((f) => f.kind === 'POSTER')?.id} mime={s.files.find((f) => f.kind === 'POSTER')?.mime} nama={s.files.find((f) => f.kind === 'POSTER')?.originalName} />
            </div>
          </div>
        </div>
      ))}
      {kembali && <ModalKembalikan s={kembali} tutup={() => setKembali(null)} selesai={(m) => { setKembali(null); setPesan(m); void muat() }} />}
    </>
  )
}

function Pratinjau({ fileId, mime, nama }: { fileId?: string; mime?: string; nama?: string }) {
  if (!fileId) return <div className="prevbox" style={{ marginTop: 6 }}><span className="hint">Tidak ada berkas</span></div>
  return (
    <div className="prevbox" style={{ marginTop: 6 }}>
      {mime?.startsWith('image/') ? (
        <img src={`/api/berkas/${fileId}`} alt={nama} />
      ) : mime === 'application/pdf' ? (
        <object data={`/api/berkas/${fileId}`} type="application/pdf" width="100%" height="320">
          <p className="hint" style={{ padding: 10 }}>
            Pratinjau PDF tidak didukung — <a href={`/api/berkas/${fileId}`} target="_blank" rel="noreferrer">buka di tab baru</a>
          </p>
        </object>
      ) : (
        <p className="hint" style={{ padding: 10 }}>
          📄 {nama} — <a href={`/api/berkas/${fileId}`} target="_blank" rel="noreferrer">unduh untuk melihat</a>
        </p>
      )}
    </div>
  )
}

function ModalKembalikan({ s, tutup, selesai }: { s: Jenis; tutup: () => void; selesai: (m: string) => void }) {
  const [alasan, setAlasan] = useState('')
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  const kirim = async () => {
    setGalat('')
    setProses(true)
    try {
      await post(`/api/admin/seminars/${s.id}/kembalikan`, { alasan })
      selesai(`Seminar "${s.title}" dikembalikan ke pemilik dengan alasan.`)
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal mengembalikan')
    } finally {
      setProses(false)
    }
  }

  return (
    <div className="mod" onClick={(e) => e.target === e.currentTarget && tutup()} role="dialog" aria-modal="true">
      <div className="card">
        <h3>Kembalikan "{s.title}"</h3>
        <label htmlFor="alasan-kembali">Alasan pengembalian (wajib, terkirim ke pemilik)</label>
        <textarea id="alasan-kembali" rows={4} value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="contoh: Surat izin belum ditandatangani pejabat berwenang." />
        {galat && <p className="err" role="alert">{galat}</p>}
        <div className="acts">
          <button className="btn" onClick={tutup}>Batal</button>
          <button className="btn dgr" onClick={kirim} disabled={proses || alasan.trim().length < 5}>
            {proses ? 'Mengirim…' : 'Kembalikan'}
          </button>
        </div>
      </div>
    </div>
  )
}
