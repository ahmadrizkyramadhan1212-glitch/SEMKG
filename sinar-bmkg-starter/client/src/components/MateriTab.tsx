// Tab Materi: isi jumlah N lalu muncul N form (pemateri + berkas maks 25 MB ATAU tautan Drive). Bisa hapus.
import { useCallback, useEffect, useState } from 'react'
import { get, post, del } from '../lib/api'
import { Loading, Empty, ErrorBox } from './ui'

interface Materi {
  id: string
  presenter: string
  storedPath: string | null
  originalName: string | null
  sizeBytes: number | null
  driveUrl: string | null
}

const MB = 1024 * 1024

export default function MateriTab({ seminarId }: { seminarId: string }) {
  const [data, setData] = useState<Materi[] | null>(null)
  const [galat, setGalat] = useState('')
  const [n, setN] = useState(1)

  const muat = useCallback(async () => {
    try {
      setGalat('')
      setData(await get<Materi[]>(`/api/konten/seminars/${seminarId}/materi`))
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal memuat materi')
    }
  }, [seminarId])

  useEffect(() => {
    void muat()
  }, [muat])

  const hapus = async (m: Materi) => {
    if (!confirm(`Hapus materi dari "${m.presenter}"?`)) return
    await del(`/api/konten/materi/${m.id}`).catch((e) => alert(e.message))
    void muat()
  }

  return (
    <div className="card">
      <h3>Materi Seminar</h3>
      <p className="hint">Materi tayang publik pada halaman seminar. Tiap materi: nama pemateri + berkas (maks 25 MB: PDF/PPT/PPTX/DOC/DOCX/ZIP/JPG/PNG) atau tautan Google Drive.</p>
      {galat && <ErrorBox message={galat} onCobaLagi={muat} />}
      {!galat && data === null && <Loading />}
      {!galat && data?.length === 0 && <Empty title="Belum ada materi" hint="Tambahkan materi di bawah." />}
      {data && data.length > 0 && (
        <div className="sc">
          <table>
            <thead>
              <tr>
                <th>Pemateri</th>
                <th>Materi</th>
                <th>Ukuran</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => (
                <tr key={m.id}>
                  <td>{m.presenter}</td>
                  <td>
                    {m.driveUrl ? (
                      <a href={m.driveUrl} target="_blank" rel="noreferrer">🔗 Buka tautan Drive</a>
                    ) : (
                      <a href={`/api/publik/materi/${m.id}`}>📄 {m.originalName}</a>
                    )}
                  </td>
                  <td>{m.sizeBytes ? (m.sizeBytes / MB).toFixed(1) + ' MB' : '—'}</td>
                  <td>
                    <button className="btn sm dgr" onClick={() => hapus(m)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="form-narrow" style={{ margin: "18px 0 0" }}>
      <h3>Tambah Materi</h3>
      <div className="dn" style={{ alignItems: 'center' }}>
        <label htmlFor="mt-n" style={{ margin: 0 }}>Jumlah materi yang akan ditambahkan</label>
        <input
          id="mt-n"
          type="number"
          min={1}
          max={20}
          value={n}
          onChange={(e) => setN(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          style={{ width: 90 }}
        />
      </div>
      {Array.from({ length: n }, (_, i) => (
        <FormMateri key={i} nomor={i + 1} seminarId={seminarId} selesai={() => void muat()} />
      ))}
      </div>
    </div>
  )
}

function FormMateri({ nomor, seminarId, selesai }: { nomor: number; seminarId: string; selesai: () => void }) {
  const [pemateri, setPemateri] = useState('')
  const [berkas, setBerkas] = useState<File | null>(null)
  const [drive, setDrive] = useState('')
  const [galat, setGalat] = useState('')
  const [ok, setOk] = useState(false)
  const [proses, setProses] = useState(false)

  const kirim = async () => {
    setGalat('')
    setProses(true)
    try {
      const fd = new FormData()
      fd.append('presenter', pemateri)
      if (berkas) fd.append('berkas', berkas)
      if (drive) fd.append('driveUrl', drive)
      await post(`/api/konten/seminars/${seminarId}/materi`, fd)
      setOk(true)
      setPemateri('')
      setBerkas(null)
      setDrive('')
      selesai()
      setTimeout(() => setOk(false), 3000)
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal menyimpan materi')
    } finally {
      setProses(false)
    }
  }

  return (
    <div style={{ border: '1px dashed var(--bd)', borderRadius: 12, padding: 12, marginTop: 10 }}>
      <b style={{ fontSize: 13 }}>Materi {nomor}</b>
      <label htmlFor={`mt-p-${nomor}`}>Nama pemateri</label>
      <input id={`mt-p-${nomor}`} value={pemateri} onChange={(e) => setPemateri(e.target.value)} placeholder="contoh: Dr. Sari Utami, M.Sc." />
      <label htmlFor={`mt-f-${nomor}`}>Berkas (maks 25 MB) — atau isi tautan Drive di bawah</label>
      <input
        id={`mt-f-${nomor}`}
        type="file"
        accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.jpg,.jpeg,.png"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null
          if (f && f.size > 25 * MB) {
            setGalat('Ukuran berkas melebihi 25 MB')
            e.target.value = ''
            return setBerkas(null)
          }
          setGalat('')
          setBerkas(f)
        }}
      />
      <label htmlFor={`mt-d-${nomor}`}>Tautan Google Drive (bila tidak mengunggah berkas)</label>
      <input id={`mt-d-${nomor}`} value={drive} onChange={(e) => setDrive(e.target.value)} placeholder="https://drive.google.com/…" />
      {galat && <p className="err" role="alert">{galat}</p>}
      {ok && <p className="ok-msg">Materi tersimpan.</p>}
      <button className="btn pr sm" style={{ marginTop: 8 }} onClick={kirim} disabled={proses || pemateri.trim().length < 3 || (!berkas && !drive.trim())}>
        {proses ? 'Menyimpan…' : 'Simpan materi'}
      </button>
    </div>
  )
}
