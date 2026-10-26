import { labelJadwal } from '../lib/sesi'
// Halaman: Detail seminar milik user — tab Detail, Dokumen, dan Peserta & Absensi,
// tombol Mulai/Selesai (dengan konfirmasi penutupan absensi), QR absensi, kode hadir.
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { get, post } from '../lib/api'
import { Loading, ErrorBox, Empty, Badge, fmtTanggal } from '../components/ui'
import SeminarForm from '../components/SeminarForm'
import PesertaTab from '../components/PesertaTab'
import MateriTab from '../components/MateriTab'
import BeritaTab from '../components/BeritaTab'
import SertifikatTab from '../components/SertifikatTab'
import type { Seminar } from '../lib/types'

const MB = 1024 * 1024
const ukuran = (b: number) => (b / MB).toFixed(2) + ' MB'

export default function SeminarDetail() {
  const { id } = useParams()
  const location = useLocation()
  const [s, setS] = useState<Seminar | null>(null)
  const [galat, setGalat] = useState('')
  const [tab, setTab] = useState<'detail' | 'dokumen' | 'peserta' | 'materi' | 'berita' | 'sertifikat'>(
    () => (location.state as { tab?: 'detail' | 'dokumen' | 'peserta' | 'materi' | 'berita' | 'sertifikat' } | null)?.tab ?? 'detail',
  )
  const [edit, setEdit] = useState(false)
  const [pesan, setPesan] = useState('')

  const muat = useCallback(async () => {
    try {
      setGalat('')
      setS(await get<Seminar>(`/api/seminars/${id}`))
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal memuat seminar')
    }
  }, [id])

  useEffect(() => {
    void muat()
  }, [muat])

  if (galat) return <ErrorBox message={galat} onCobaLagi={muat} />
  if (!s) return <Loading />
  const bisaSemua = s.status === 'MENUNGGU_VERIFIKASI' || s.status === 'DIKEMBALIKAN'
  const bisaEditTeks = s.status !== 'DIBATALKAN'

  const ajukanUlang = async () => {
    if (!confirm('Ajukan ulang seminar ini untuk diverifikasi admin?')) return
    try {
      await post(`/api/seminars/${s.id}/resubmit`)
      setPesan('Seminar diajukan ulang, menunggu verifikasi admin.')
      void muat()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal mengajukan ulang')
    }
  }

  const batalkan = async () => {
    if (!confirm(`Batalkan seminar "${s.title}"? Jadwal akan dibebaskan dan tidak bisa dikembalikan.`)) return
    try {
      await post(`/api/seminars/${s.id}/batalkan`)
      setPesan('Seminar dibatalkan. Jadwal lokasi telah dibebaskan.')
      void muat()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal membatalkan')
    }
  }

  const mulai = async () => {
    if (!confirm('Mulai seminar sekarang? Absensi akan dibuka untuk peserta.')) return
    try {
      await post(`/api/absensi/${s.id}/mulai`)
      void muat()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal memulai')
    }
  }

  const selesai = async () => {
    if (!confirm('Seminar selesai dan absensi DITUTUP? Peserta tidak bisa absen lagi setelah ini.')) return
    try {
      await post(`/api/absensi/${s.id}/selesai`)
      void muat()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menutup absensi')
    }
  }

  return (
    <>
      <div className="top">
        <div>
          <h1>
            {s.title} <Badge status={s.status} />
          </h1>
          <p>
            Kode {s.code} · {fmtTanggal(s.date, true)}, {labelJadwal(s.startTime, s.endTime)} · {s.locationOther ?? s.location.name}
          </p>
        </div>
        <Link to="/seminar-saya" className="btn">
          ← Seminar Saya
        </Link>
      </div>

      {pesan && (
        <div className="ind ok" role="status">
          {pesan}
        </div>
      )}
      {s.status === 'DIKEMBALIKAN' && s.returnReason && (
        <div className="ind no" role="alert">
          <b>Dikembalikan admin:</b> {s.returnReason}
          <br />
          <span className="hint">Perbaiki lalu unggah ulang dokumen di tab Dokumen, kemudian tekan Ajukan Ulang.</span>
        </div>
      )}

      <div className="tabs" role="tablist">
        <a role="tab" aria-selected={tab === 'detail'} className={tab === 'detail' ? 'on' : ''} onClick={() => setTab('detail')}>
          Detail
        </a>
        <a role="tab" aria-selected={tab === 'dokumen'} className={tab === 'dokumen' ? 'on' : ''} onClick={() => setTab('dokumen')}>
          Dokumen
        </a>
        <a role="tab" aria-selected={tab === 'peserta'} className={tab === 'peserta' ? 'on' : ''} onClick={() => setTab('peserta')}>
          Peserta &amp; Absensi
        </a>
        <a role="tab" aria-selected={tab === 'materi'} className={`${tab === 'materi' ? 'on' : ''} ${s.status !== 'SELESAI' ? 'hint' : ''}`} onClick={() => s.status === 'SELESAI' && setTab('materi')} style={{ cursor: s.status === 'SELESAI' ? 'pointer' : 'not-allowed' }}>
          Materi
        </a>
        <a role="tab" aria-selected={tab === 'berita'} className={`${tab === 'berita' ? 'on' : ''} ${s.status !== 'SELESAI' ? 'hint' : ''}`} onClick={() => s.status === 'SELESAI' && setTab('berita')} style={{ cursor: s.status === 'SELESAI' ? 'pointer' : 'not-allowed' }}>
          Berita
        </a>
        <a role="tab" aria-selected={tab === 'sertifikat'} className={`${tab === 'sertifikat' ? 'on' : ''} ${s.status !== 'SELESAI' ? 'hint' : ''}`} onClick={() => s.status === 'SELESAI' && setTab('sertifikat')} style={{ cursor: s.status === 'SELESAI' ? 'pointer' : 'not-allowed' }}>
          Sertifikat
        </a>
      </div>
      {s.status !== 'SELESAI' && (tab === 'materi' || tab === 'berita' || tab === 'sertifikat') && <p className="hint">Tab ini aktif setelah seminar selesai.</p>}

      {tab === 'detail' && (
        <div className="card form-narrow">
          {edit ? (
            <SeminarForm
              seminar={s}
              bisaSemua={bisaSemua}
              selesai={(m) => {
                setEdit(false)
                setPesan(m)
                void muat()
              }}
            />
          ) : (
            <>
              <dl style={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: 8 }}>
                <dt className="hint">Judul</dt>
                <dd>{s.title}</dd>
                <dt className="hint">Topik</dt>
                <dd>{s.topic || '—'}</dd>
                <dt className="hint">Jadwal</dt>
                <dd>
                  {fmtTanggal(s.date, true)}, {labelJadwal(s.startTime, s.endTime)}
                </dd>
                <dt className="hint">Lokasi</dt>
                <dd>
                  {s.locationOther ?? s.location.name}
                  {s.location.capacity ? ` (kapasitas ${s.location.capacity})` : ''}
                </dd>
                <dt className="hint">Status</dt>
                <dd>
                  <Badge status={s.status} />
                </dd>
                <dt className="hint">Tipe Acara</dt>
                <dd>
                  <span className={`bd ${s.tipe_acara === 'Hybrid' ? 'Menunggu' : s.tipe_acara === 'Online' ? 'Berlangsung' : 'Selesai'}`}>
                    {s.tipe_acara || 'Offline'}
                  </span>
                </dd>
                {(s.zoom_link || s.tipe_acara === 'Online' || s.tipe_acara === 'Hybrid') && (
                  <>
                    <dt className="hint">Tautan Zoom</dt>
                    <dd>
                      {s.zoom_link ? (
                        <a
                          href={s.zoom_link.startsWith('http') ? s.zoom_link : `https://${s.zoom_link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 font-medium underline flex items-center gap-1.5"
                        >
                          <span>🔗 Buka Zoom Meeting</span>
                          <span className="text-xs text-slate-400">({s.zoom_link})</span>
                        </a>
                      ) : (
                        <span className="hint">Belum ditentukan</span>
                      )}
                    </dd>
                    {s.zoom_passcode && (
                      <>
                        <dt className="hint">Passcode Zoom</dt>
                        <dd>
                          <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-950 font-mono text-sm border border-slate-200 dark:border-slate-800">
                            {s.zoom_passcode}
                          </code>
                        </dd>
                      </>
                    )}
                  </>
                )}
                {s.status === 'SELESAI' && (
                  <>
                    <dt className="hint">Surat asli</dt>
                    <dd>{s.letterReceived ? 'Sudah diterima admin' : 'Belum diterima'}</dd>
                  </>
                )}
              </dl>
              <div className="dn" style={{ marginTop: 14 }}>
                {bisaEditTeks && (
                  <button className="btn" onClick={() => setEdit(true)}>
                    {bisaSemua ? 'Edit Seminar' : 'Edit Judul & Topik'}
                  </button>
                )}
                {s.status === 'DIKEMBALIKAN' && (
                  <button className="btn pr" onClick={ajukanUlang}>
                    Ajukan Ulang
                  </button>
                )}
                {s.status === 'DIJADWALKAN' && (
                  <button className="btn pr" onClick={mulai}>
                    ▶ Mulai Seminar
                  </button>
                )}
                {s.status === 'BERLANGSUNG' && (
                  <button className="btn pr" onClick={selesai}>
                    ■ Seminar selesai, absensi ditutup
                  </button>
                )}
                {s.status !== 'SELESAI' && s.status !== 'DIBATALKAN' && (
                  <button className="btn dgr" onClick={batalkan}>
                    Batalkan Seminar
                  </button>
                )}
              </div>
              {!bisaSemua && s.status !== 'DIBATALKAN' && (
                <p className="hint" style={{ marginTop: 10 }}>
                  Pada status ini hanya judul dan topik yang dapat diubah tanpa verifikasi ulang.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'dokumen' && (
        <div className="cols">
          <div className="card">
            <h3>Surat Izin</h3>
            {s.files.filter((f) => f.kind === 'SURAT_IZIN').length === 0 ? (
              <Empty title="Belum ada surat izin" />
            ) : (
              s.files
                .filter((f) => f.kind === 'SURAT_IZIN')
                .map((f) => <BerkasBox key={f.id} id={f.id} nama={f.originalName} ukuran={f.sizeBytes} mime={f.mime} />)
            )}
            <h3 style={{ marginTop: 18 }}>Poster</h3>
            {s.files.filter((f) => f.kind === 'POSTER').length === 0 ? (
              <Empty title="Belum ada poster" hint="Poster bersifat opsional." />
            ) : (
              s.files
                .filter((f) => f.kind === 'POSTER')
                .map((f) => <BerkasBox key={f.id} id={f.id} nama={f.originalName} ukuran={f.sizeBytes} mime={f.mime} />)
            )}
          </div>
          {s.status === 'DIKEMBALIKAN' && <UnggahUlangCard seminarId={s.id} selesai={() => { setPesan('Dokumen terunggah'); void muat() }} />}
        </div>
      )}

      {tab === 'peserta' && <PesertaTab seminar={s} berubah={muat} />}
      {tab === 'materi' && s.status === 'SELESAI' && <MateriTab seminarId={s.id} />}
      {tab === 'berita' && s.status === 'SELESAI' && <BeritaTab seminarId={s.id} penulis />}
      {tab === 'sertifikat' && s.status === 'SELESAI' && <SertifikatTab seminarId={s.id} />}
    </>
  )
}

function BerkasBox({ id, nama, ukuran: sz, mime }: { id: string; nama: string; ukuran: number; mime: string }) {
  const [ruted, setRuted] = useState(false)
  if (ruted) {
    return mime.startsWith('image/') ? (
      <div className="prevbox" style={{ marginBottom: 8 }}>
        <img src={`/api/berkas/${id}`} alt={nama} />
      </div>
    ) : mime === 'application/pdf' ? (
      <div className="prevbox" style={{ marginBottom: 8 }}>
        <object data={`/api/berkas/${id}`} type="application/pdf" width="100%" height="360">
          Pratinjau PDF tidak didukung browser ini.
        </object>
      </div>
    ) : (
      <div className="prevbox" style={{ marginBottom: 8 }}>
        <span className="hint">Pratinjau tidak tersedia untuk dokumen Word</span>
      </div>
    )
  }
  return (
    <p className="fc" style={{ alignItems: 'center' }}>
      <span>📄 {nama}</span>
      <span>{ukuran(sz)}</span>
      <button className="btn sm" onClick={() => setRuted(true)}>Pratinjau</button>
      <a className="btn sm" href={`/api/berkas/${id}`} download={nama}>
        Unduh
      </a>
    </p>
  )
}

function UnggahUlangCard({ seminarId, selesai }: { seminarId: string; selesai: () => void }) {
  const [surat, setSurat] = useState<File | null>(null)
  const [poster, setPoster] = useState<File | null>(null)
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  const kirim = async () => {
    if (!surat && !poster) return setGalat('Pilih berkas surat atau poster')
    setGalat('')
    setProses(true)
    try {
      const fd = new FormData()
      if (surat) fd.append('surat', surat)
      if (poster) fd.append('poster', poster)
      await post(`/api/seminars/${seminarId}/dokumen`, fd)
      selesai()
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal mengunggah')
    } finally {
      setProses(false)
    }
  }

  return (
    <div className="card">
      <h3>Unggah Ulang Dokumen</h3>
      <p className="hint">Surat izin: PDF/JPG/PNG/DOC/DOCX maks 5 MB. Poster: JPG/PNG/WEBP/PDF maks 5 MB.</p>
      <label htmlFor="uu-surat">Surat izin (baru)</label>
      <input
        id="uu-surat"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null
          if (f && f.size > 5 * MB) return setGalat('Ukuran surat melebihi 5 MB')
          setGalat('')
          setSurat(f)
        }}
      />
      <label htmlFor="uu-poster">Poster (baru)</label>
      <input
        id="uu-poster"
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null
          if (f && f.size > 5 * MB) return setGalat('Ukuran poster melebihi 5 MB')
          setGalat('')
          setPoster(f)
        }}
      />
      {galat && (
        <p className="err" role="alert">
          {galat}
        </p>
      )}
      <div style={{ marginTop: 12 }}>
        <button className="btn pr" onClick={kirim} disabled={proses}>
          {proses ? 'Mengunggah…' : 'Unggah'}
        </button>
      </div>
    </div>
  )
}
