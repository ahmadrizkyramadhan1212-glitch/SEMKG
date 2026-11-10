// Tab Sertifikat (aktif setelah SELESAI): unggah template, editor tata letak seret,
// generate PDF per peserta, kirim email lewat antrean, kirim ulang yang gagal.
import { useCallback, useEffect, useRef, useState } from 'react'
import { get, post, patch, del } from '../lib/api'
import { Loading, ErrorBox, Empty } from './ui'

interface Elemen {
  on: boolean
  x: number
  y: number
  size: number
  font: string
  color: string
  align: 'left' | 'center' | 'right'
  format?: string
}

interface Layout {
  name: Elemen
  title: Elemen
  date: Elemen
  seminarId: Elemen
  serial: Elemen
  qr: Elemen
  location?: Elemen
  nip?: Elemen
}

interface Peserta {
  id: string
  name: string
  nip: string
  email: string
  peran?: string
  alasan?: string | null
  source?: string
  sertifikat: { id: string; nomor: string; pdfAda: boolean; mailStatus: string; emailStatus: string | null; emailGalat: string | null } | null
}

type PageModeType = 'AUTO' | 'A4_LANDSCAPE' | 'A4_PORTRAIT' | 'SQUARE' | 'WIDE_16_9'

interface Gambaran {
  seminar: { id: string; code: string; title: string; date: string; lokasi: string }
  peranAktif?: string
  templateAda: boolean
  rasio?: number | null
  pageMode: PageModeType
  layout: Layout
  layouts?: Record<string, Layout>
  templates?: Record<string, { templateAda: boolean; rasio: number | null; pageMode: PageModeType }>
  peserta: Peserta[]
}

const HURUF: [string, string][] = [
  ['playfair', 'Playfair Display'],
  ['greatvibes', 'Great Vibes'],
  ['cinzel', 'Cinzel'],
  ['allura', 'Allura'],
  ['pinyon', 'Pinyon Script'],
  ['dancing', 'Dancing Script'],
  ['cormorant', 'Cormorant Garamond'],
  ['baskerville', 'Libre Baskerville'],
  ['montserrat', 'Montserrat'],
  ['times', 'Times New Roman'],
]

const LABEL_ELEMEN: Record<string, string> = {
  name: 'Nama Peserta',
  role: 'Keterangan Peran',
  title: 'Judul Seminar',
  date: 'Tanggal Seminar',
  serial: 'Nomor Seri',
  location: 'Lokasi Seminar',
  nip: 'NIP Peserta',
}

const KUNCI_ELEMEN = ['name', 'role', 'title', 'date', 'serial', 'location', 'nip'] as const

const WARNA_PRESET = [
  { label: 'Biru BMKG', hex: '#0B3C8C' },
  { label: 'Hijau BMKG', hex: '#2E9E4F' },
  { label: 'Hitam', hex: '#111827' },
  { label: 'Emas Elegan', hex: '#854D0E' },
  { label: 'Abu Gelap', hex: '#374151' },
]

export default function SertifikatTab({ seminarId }: { seminarId: string }) {
  const [d, setD] = useState<Gambaran | null>(null)
  const [galat, setGalat] = useState('')
  const [pesan, setPesan] = useState('')
  const [peranAktif, setPeranAktif] = useState<'Peserta' | 'Narasumber' | 'Moderator' | 'Panitia'>('Peserta')
  const [layout, setLayout] = useState<Layout | null>(null)
  const [pageMode, setPageMode] = useState<PageModeType>('AUTO')
  const [pilih, setPilih] = useState<string>('name')
  const [proses, setProses] = useState(false)
  const [versiLatar, setVersiLatar] = useState(Date.now())

  const muat = useCallback(async (peranTarget?: string) => {
    try {
      setGalat('')
      const roleToFetch = peranTarget || peranAktif
      const g = await get<Gambaran>(`/api/sertifikat/seminars/${seminarId}?peran=${roleToFetch}`)
      setD(g)
      const roleLayout = g.layouts?.[roleToFetch] || g.layout
      setLayout(roleLayout)
      const roleTpl = g.templates?.[roleToFetch]
      if (roleTpl?.pageMode) setPageMode(roleTpl.pageMode)
      else if (g.pageMode) setPageMode(g.pageMode)
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal memuat sertifikat')
    }
  }, [seminarId, peranAktif])

  const gantiPeran = (peranBaru: 'Peserta' | 'Narasumber' | 'Moderator' | 'Panitia') => {
    setPeranAktif(peranBaru)
    setPilih('name')
    if (d?.layouts?.[peranBaru]) {
      setLayout(d.layouts[peranBaru])
      const tpl = d.templates?.[peranBaru]
      if (tpl?.pageMode) setPageMode(tpl.pageMode)
    } else {
      void muat(peranBaru)
    }
  }

  useEffect(() => {
    void muat()
  }, [muat])

  if (galat) return <ErrorBox message={galat} onCobaLagi={muat} />
  if (!d || !layout) return <Loading />

  const ubah = (kunci: string, perubahan: Partial<Elemen>) => {
    setLayout((l) => {
      if (!l) return l
      const el = (l as unknown as Record<string, Elemen | undefined>)[kunci]
      if (!el) return l
      return { ...l, [kunci]: { ...el, ...perubahan } }
    })
  }

  const simpanLayout = async () => {
    setProses(true)
    setPesan('')
    try {
      // Pertahankan Nomor Seri dan QR Code verifikasi keaslian
      const layoutKirim = {
        ...layout,
        serial: { ...layout.serial, on: true },
        qr: { ...layout.qr, on: true },
      }
      const hasil = await patch(`/api/sertifikat/seminars/${seminarId}/layout`, {
        peran: peranAktif,
        layout: layoutKirim,
        pageMode,
      })
      setPesan(`Tata letak sertifikat peran ${peranAktif} berhasil disimpan.`)
      if ((hasil as { layout?: Layout }).layout) {
        setLayout((hasil as { layout: Layout }).layout)
      }
      if ((hasil as { pageMode?: PageModeType }).pageMode) {
        setPageMode((hasil as { pageMode: PageModeType }).pageMode)
      }
      void muat()
    } catch (e) {
      setPesan('')
      alert(e instanceof Error ? e.message : 'Gagal menyimpan tata letak')
    } finally {
      setProses(false)
    }
  }

  const generate = async () => {
    if (!confirm('Buat ulang PDF sertifikat untuk semua peserta? Nomor seri yang sudah ada tidak berubah.')) return
    setProses(true)
    try {
      const hasil = await post<{ dibuat: number; total: number }>(`/api/sertifikat/seminars/${seminarId}/generate`)
      setPesan(`${hasil.dibuat} dari ${hasil.total} sertifikat selesai dibuat.`)
      void muat()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal membuat sertifikat')
    } finally {
      setProses(false)
    }
  }

  const adaPdf = d.peserta.some((p) => p.sertifikat?.pdfAda)
  const terkirim = d.peserta.filter((p) => p.sertifikat?.emailStatus === 'TERKIRIM').length
  const punyaPdf = d.peserta.filter((p) => p.sertifikat?.pdfAda).length

  return (
    <>
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Pengaturan Sertifikat</h3>
        <p className="hint">
          Kode seminar: <strong>{d.seminar.code}</strong>. Template kustom dapat diunggah per seminar (gambar atau PDF).
          Nomor seri otomatis: <code>SERT/BMKG/&lt;tahun&gt;/{d.seminar.code}/&lt;urut&gt;</code>.
        </p>
        {pesan && <p className="ok-msg" style={{ marginTop: 8 }}>{pesan}</p>}

        {/* TABS MULTI-PERAN: Peserta, Narasumber, Moderator, Panitia */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--t)' }}>
              Pilih Peran Sertifikat yang Sedang Dikonfigurasi:
            </span>
            <span className="hint" style={{ fontSize: '0.8rem' }}>
              Tiap peran memiliki template dan tata letak tersendiri
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['Peserta', 'Narasumber', 'Moderator', 'Panitia'] as const).map((p) => {
              const isActive = peranAktif === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => gantiPeran(p)}
                  className={`btn sm ${isActive ? 'pr' : ''}`}
                  style={{
                    borderRadius: 9,
                    padding: '6px 14px',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {p === 'Peserta' ? '👤 Peserta' : p === 'Narasumber' ? '🎤 Narasumber' : p === 'Moderator' ? '🎙️ Moderator' : '👥 Panitia'}
                </button>
              )
            })}
          </div>
        </div>

        <div className="dn" style={{ flexWrap: 'wrap', gap: 10, marginTop: 14, alignItems: 'center' }}>
          <TemplateForm
            seminarId={seminarId}
            peran={peranAktif}
            ada={d.templates?.[peranAktif]?.templateAda ?? d.templateAda}
            selesai={() => {
              void muat()
              setVersiLatar(Date.now())
            }}
          />
          <button className="btn pr" onClick={generate} disabled={proses || d.peserta.length === 0}>
            {proses ? 'Memproses…' : 'Buat Sertifikat Semua Peserta (PDF)'}
          </button>
          <a className="btn" href={`/api/sertifikat/seminars/${seminarId}/pratinjau?peran=${peranAktif}`} target="_blank" rel="noreferrer">
            Pratinjau PDF ({peranAktif}) ↗
          </a>
        </div>

        {d.peserta.length === 0 && (
          <p className="hint" style={{ marginTop: 10 }}>Belum ada peserta hadir — sertifikat dibuat untuk peserta yang tercatat.</p>
        )}
        {adaPdf && (
          <p className="hint" style={{ marginTop: 10 }}>
            {punyaPdf} PDF siap · {terkirim} email terkirim.
          </p>
        )}
      </div>

      <EditorSertifikat
        seminarId={seminarId}
        seminar={d.seminar}
        layout={layout}
        peran={peranAktif}
        pilih={pilih}
        setPilih={setPilih}
        ubah={ubah}
        simpan={simpanLayout}
        proses={proses}
        pageMode={pageMode}
        setPageMode={setPageMode}
        serverRasio={d.templates?.[peranAktif]?.rasio ?? d.rasio}
        versiLatar={versiLatar}
      />

      <TabelPeserta seminarId={seminarId} peserta={d.peserta} muat={muat} />

      {adaPdf && <FormEmail seminarId={seminarId} judul={d.seminar.title} peserta={d.peserta} muat={muat} />}
    </>
  )
}

function TemplateForm({ seminarId, peran = 'Peserta', ada, selesai }: { seminarId: string; peran?: string; ada: boolean; selesai: () => void }) {
  const [f, setF] = useState<File | null>(null)
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  const kirim = async () => {
    if (!f) return setGalat('Pilih berkas template')
    setProses(true)
    try {
      const fd = new FormData()
      fd.append('template', f)
      fd.append('peran', peran)
      await post(`/api/sertifikat/seminars/${seminarId}/template?peran=${encodeURIComponent(peran)}`, fd)
      setF(null)
      setGalat('')
      selesai()
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal mengunggah template')
    } finally {
      setProses(false)
    }
  }

  const resetBawaan = async () => {
    if (!confirm('Gunakan template sertifikat bawaan BMKG? Template kustom saat ini akan dihapus.')) return
    setProses(true)
    try {
      await del(`/api/sertifikat/seminars/${seminarId}/template?peran=${encodeURIComponent(peran)}`)
      setF(null)
      setGalat('')
      selesai()
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal mereset template')
    } finally {
      setProses(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <label className="btn sm" style={{ cursor: 'pointer', margin: 0 }}>
        {ada ? 'Ganti Template' : 'Unggah Template'}
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg"
          style={{ display: 'none' }}
          onChange={(e) => {
            const berkas = e.target.files?.[0] ?? null
            if (berkas && berkas.size > 10 * 1024 * 1024) {
              setGalat('Template maksimal 10 MB')
              return
            }
            setGalat('')
            setF(berkas)
          }}
        />
      </label>
      {f && <span className="hint">{f.name} siap diunggah</span>}
      {f && (
        <button className="btn sm pr" onClick={kirim} disabled={proses}>
          {proses ? 'Mengunggah…' : 'Unggah Sekarang'}
        </button>
      )}
      {!f && ada && (
        <>
          <span className="hint" style={{ color: '#166534', fontWeight: 500 }}>Template kustom aktif ✓</span>
          <button type="button" className="btn sm" onClick={resetBawaan} disabled={proses} title="Kembali ke template bawaan BMKG">
            Pakai Bawaan BMKG
          </button>
        </>
      )}
      {!f && !ada && <span className="hint">Menggunakan template bawaan BMKG</span>}
      {galat && <span className="err" role="alert" style={{ width: '100%' }}>{galat}</span>}
    </div>
  )
}

function EditorSertifikat({
  seminarId,
  seminar,
  layout,
  peran = 'Peserta',
  pilih,
  setPilih,
  ubah,
  simpan,
  proses,
  pageMode,
  setPageMode,
  serverRasio,
  versiLatar,
}: {
  seminarId: string
  seminar: Gambaran['seminar']
  layout: Layout
  peran?: string
  pilih: string
  setPilih: (k: string) => void
  ubah: (kunci: string, perubahan: Partial<Elemen>) => void
  simpan: () => Promise<void>
  proses: boolean
  pageMode: PageModeType
  setPageMode: (m: PageModeType) => void
  serverRasio?: number | null
  versiLatar: number
}) {
  const [templateRasio, setTemplateRasio] = useState<number>(serverRasio || 1.414)
  const [latar, setLatar] = useState<string | null>(null)
  const refKanvas = useRef<HTMLDivElement>(null)
  const seret = useRef<string | null>(null)

  // Muat gambar latar dan baca rasio asli template dengan cache buster
  useEffect(() => {
    let aktif = true
    let blobUrl = ''
    fetch(`/api/sertifikat/seminars/${seminarId}/latar.png?peran=${encodeURIComponent(peran)}&v=${versiLatar}`, { credentials: 'include' })
      .then(async (r) => {
        const headerRasio = Number(r.headers.get('X-Rasio-Halaman'))
        if (headerRasio && headerRasio > 0) {
          setTemplateRasio(headerRasio)
        }
        return r.blob()
      })
      .then((b) => {
        if (!aktif) return
        blobUrl = URL.createObjectURL(b)
        setLatar(blobUrl)
      })
      .catch(() => {})

    return () => {
      aktif = false
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [seminarId, versiLatar])

  // Sinkronkan serverRasio jika ada perubahan dari props
  useEffect(() => {
    if (serverRasio && serverRasio > 0) {
      setTemplateRasio(serverRasio)
    }
  }, [serverRasio])

  // Hitung rasio efektif berdasarkan mode halaman yang dipilih
  let rasioEfektif = 1.414 // Default A4 Landscape
  if (pageMode === 'A4_PORTRAIT') rasioEfektif = 0.707
  else if (pageMode === 'SQUARE') rasioEfektif = 1.0
  else if (pageMode === 'WIDE_16_9') rasioEfektif = 16 / 9
  else if (pageMode === 'AUTO') rasioEfektif = templateRasio && templateRasio > 0 ? templateRasio : 1.414

  // Ukuran kanvas proporsional (tanpa distorsi)
  const maxW = 680
  const maxH = 430
  let lebarKanvas = maxW
  let tinggiKanvas = Math.round(lebarKanvas / rasioEfektif)
  if (tinggiKanvas > maxH) {
    tinggiKanvas = maxH
    lebarKanvas = Math.round(tinggiKanvas * rasioEfektif)
  }

  const saatSeret = (e: React.MouseEvent) => {
    if (!seret.current || !refKanvas.current) return
    const kotak = refKanvas.current.getBoundingClientRect()
    const x = Math.round(Math.min(100, Math.max(0, ((e.clientX - kotak.left) / kotak.width) * 100)))
    const y = Math.round(Math.min(100, Math.max(0, ((e.clientY - kotak.top) / kotak.height) * 100)))
    ubah(seret.current, { x, y })
  }

  const tanggalContoh = new Date(seminar.date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  const isi: Record<string, { teks: string }> = {
    name: { teks: 'Contoh Nama Lengkap' },
    title: { teks: seminar.title },
    date: { teks: tanggalContoh },
    seminarId: { teks: `ID Seminar: ${seminar.code}` },
    serial: { teks: `SERT/BMKG/${new Date(seminar.date).getUTCFullYear()}/${seminar.code}/001` },
    location: { teks: seminar.lokasi },
    nip: { teks: 'NIP 199001012005011001' },
  }

  const el = (layout as unknown as Record<string, Elemen | undefined>)[pilih]

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
        <div>
          <h3>Editor Tata Letak Sertifikat</h3>
          <p className="hint">
            Pilih elemen di bawah atau klik pada kanvas untuk menggeser posisi. Simpan perubahan sebelum membuat sertifikat atau melihat pratinjau PDF.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn pr" onClick={simpan} disabled={proses}>
            {proses ? 'Menyimpan…' : 'Simpan Tata Letak'}
          </button>
        </div>
      </div>

      {/* Pilihan Elemen Cepat (Tab Chips) */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {KUNCI_ELEMEN.map((k) => {
          const item = (layout as unknown as Record<string, Elemen | undefined>)[k]
          if (!item) return null
          const isActive = item.on
          const isSelected = pilih === k
          return (
            <button
              key={k}
              type="button"
              onClick={() => setPilih(k)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 20,
                fontSize: '0.85rem',
                border: isSelected ? '2px solid #2E9E4F' : '1px solid var(--bd)',
                background: isSelected ? 'rgba(46, 158, 79, 0.12)' : 'var(--card-bg, #fff)',
                color: isSelected ? '#166534' : 'inherit',
                fontWeight: isSelected ? 600 : 400,
                padding: '5px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isActive ? '#2E9E4F' : '#9CA3AF',
                }}
                title={isActive ? 'Elemen aktif di sertifikat' : 'Elemen dinonaktifkan'}
              />
              <span>{LABEL_ELEMEN[k]}</span>
              {k === 'name' && <small style={{ opacity: 0.7 }}>(Wajib)</small>}
            </button>
          )
        })}
      </div>

      <div className="dn" style={{ alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        {/* Kanvas Pratinjau Interaktif */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            ref={refKanvas}
            style={{
              position: 'relative',
              width: lebarKanvas,
              height: tinggiKanvas,
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
              border: '1px solid var(--bd)',
              backgroundImage: latar ? `url(${latar})` : undefined,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#ffffff',
              userSelect: 'none',
              cursor: seret.current ? 'grabbing' : 'default',
            }}
            onMouseMove={saatSeret}
            onMouseUp={() => (seret.current = null)}
            onMouseLeave={() => (seret.current = null)}
          >
            {/* Garis bantu tengah tipis */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(46, 158, 79, 0.15)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed rgba(46, 158, 79, 0.15)', pointerEvents: 'none' }} />

            {KUNCI_ELEMEN.map((kunci) => {
              const e = (layout as unknown as Record<string, Elemen | undefined>)[kunci]
              if (!e || !e.on) return null
              const terpilih = pilih === kunci
              const ukuranFont = (e.size / 100) * tinggiKanvas

              return (
                <div
                  key={kunci}
                  onMouseDown={(ev) => {
                    ev.stopPropagation()
                    seret.current = kunci
                    setPilih(kunci)
                  }}
                  style={{
                    position: 'absolute',
                    left: `${e.x}%`,
                    top: `${e.y}%`,
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '92%',
                    fontSize: ukuranFont,
                    fontFamily: `cert-${e.font}`,
                    color: e.color,
                    textAlign: e.align,
                    width: e.align === 'center' ? '82%' : 'auto',
                    outline: terpilih ? '2px dashed #2E9E4F' : '1px dashed rgba(0,0,0,0.18)',
                    boxShadow: terpilih ? '0 0 8px rgba(46, 158, 79, 0.25)' : undefined,
                    cursor: 'grab',
                    whiteSpace: 'pre-wrap',
                    padding: '2px 4px',
                    borderRadius: 3,
                  }}
                  title={LABEL_ELEMEN[kunci]}
                >
                  {isi[kunci]?.teks ?? kunci}
                </div>
              )
            })}
          </div>
          <small className="hint" style={{ marginTop: 6, textAlign: 'center' }}>
            Rasio kanvas: {rasioEfektif.toFixed(2)} · Ukuran tampilan: {lebarKanvas} × {tinggiKanvas} px
          </small>
        </div>

        {/* Panel Kontrol & Properti */}
        <div style={{ minWidth: 300, flex: 1, maxWidth: 440, background: 'var(--subcard-bg, rgba(0,0,0,0.02))', padding: 16, borderRadius: 10, border: '1px solid var(--bd)' }}>
          {/* Pengaturan Ukuran / Mode Halaman */}
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="st-pagemode" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Ukuran / Orientasi Halaman
            </label>
            <select
              id="st-pagemode"
              value={pageMode}
              onChange={(e) => setPageMode(e.target.value as PageModeType)}
              style={{ width: '100%', height: 38 }}
            >
              <option value="AUTO">Otomatis (Mengikuti Rasio Template)</option>
              <option value="A4_LANDSCAPE">A4 Mendatar / Landscape (Standar)</option>
              <option value="A4_PORTRAIT">A4 Tegak / Portrait</option>
              <option value="WIDE_16_9">Layar Lebar / 16:9</option>
              <option value="SQUARE">Persegi (1:1)</option>
            </select>
          </div>

          <div style={{ height: 1, background: 'var(--bd)', margin: '14px 0', opacity: 0.7 }} />

          {/* Pengaturan Elemen Aktif */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: '1rem', color: '#166534' }}>
              Pengaturan: {LABEL_ELEMEN[pilih] ?? pilih}
            </strong>
            {el && (
              <label style={{ margin: 0, display: 'inline-flex', gap: 6, alignItems: 'center', cursor: pilih === 'name' ? 'not-allowed' : 'pointer' }}>
                <input
                  type="checkbox"
                  checked={el.on}
                  disabled={pilih === 'name'}
                  onChange={(e) => ubah(pilih, { on: e.target.checked })}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Tampilkan</span>
              </label>
            )}
          </div>

          {el && (
            <>
              {/* Tombol Pintas Posisi */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn sm"
                  onClick={() => ubah(pilih, { x: 50, align: pilih !== 'qr' ? 'center' : el.align })}
                  title="Pusatkan posisi horizontal (X: 50%)"
                >
                  ↔ Pusatkan X (50%)
                </button>
                <button
                  type="button"
                  className="btn sm"
                  onClick={() => ubah(pilih, { y: 50 })}
                  title="Pusatkan posisi vertikal (Y: 50%)"
                >
                  ↕ Pusatkan Y (50%)
                </button>
              </div>

              <Slider
                label="Posisi Horizontal (X)"
                nilai={el.x}
                min={0}
                max={100}
                satuan="%"
                ubah={(v) => ubah(pilih, { x: v })}
              />
              <Slider
                label="Posisi Vertikal (Y)"
                nilai={el.y}
                min={0}
                max={100}
                satuan="%"
                ubah={(v) => ubah(pilih, { y: v })}
              />
              <Slider
                label={pilih === 'qr' ? 'Ukuran Kotak QR' : 'Ukuran Huruf (% Tinggi)'}
                nilai={el.size}
                min={pilih === 'qr' ? 4 : 0.5}
                max={pilih === 'qr' ? 35 : 18}
                langkah={pilih === 'qr' ? 0.5 : 0.1}
                satuan="%"
                ubah={(v) => ubah(pilih, { size: v })}
              />

              {pilih !== 'qr' && (
                <>
                  <div style={{ marginTop: 10 }}>
                    <label htmlFor="st-huruf" style={{ display: 'block', marginBottom: 4 }}>Jenis Huruf</label>
                    <select
                      id="st-huruf"
                      value={el.font}
                      onChange={(e) => ubah(pilih, { font: e.target.value })}
                      style={{ width: '100%', height: 38 }}
                    >
                      {HURUF.map(([k, n]) => (
                        <option key={k} value={k}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <label style={{ display: 'block', marginBottom: 4 }}>Warna Teks</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        id="st-warna"
                        type="color"
                        value={el.color}
                        onChange={(e) => ubah(pilih, { color: e.target.value })}
                        style={{ width: 44, height: 34, padding: 0, border: '1px solid var(--bd)', borderRadius: 6, cursor: 'pointer' }}
                        title="Pilih warna kustom"
                      />
                      {WARNA_PRESET.map((w) => (
                        <button
                          key={w.hex}
                          type="button"
                          onClick={() => ubah(pilih, { color: w.hex })}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: w.hex,
                            border: el.color.toLowerCase() === w.hex.toLowerCase() ? '2px solid #2E9E4F' : '1px solid rgba(0,0,0,0.2)',
                            boxShadow: el.color.toLowerCase() === w.hex.toLowerCase() ? '0 0 4px rgba(46, 158, 79, 0.6)' : undefined,
                            cursor: 'pointer',
                          }}
                          title={w.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <label style={{ display: 'block', marginBottom: 4 }}>Perataan Teks</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <button
                          key={a}
                          type="button"
                          className={`btn sm ${el.align === a ? 'pr' : ''}`}
                          onClick={() => ubah(pilih, { align: a })}
                          style={{ flex: 1 }}
                        >
                          {a === 'left' ? 'Kiri' : a === 'center' ? 'Tengah' : 'Kanan'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
            <button className="btn pr" onClick={simpan} disabled={proses} style={{ flex: 1 }}>
              {proses ? 'Menyimpan…' : 'Simpan Tata Letak'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Slider({
  label,
  nilai,
  min,
  max,
  langkah = 1,
  satuan = '',
  ubah,
}: {
  label: string
  nilai: number
  min: number
  max: number
  langkah?: number
  satuan?: string
  ubah: (v: number) => void
}) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <label style={{ margin: 0, fontSize: '0.85rem' }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <input
            type="number"
            min={min}
            max={max}
            step={langkah}
            value={nilai}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (!isNaN(v)) ubah(Math.min(max, Math.max(min, v)))
            }}
            style={{ width: 56, padding: '2px 4px', textAlign: 'right', fontSize: '0.85rem', height: 26 }}
          />
          {satuan && <span className="hint" style={{ fontSize: '0.8rem' }}>{satuan}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={langkah}
        value={nilai}
        onChange={(e) => ubah(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  )
}

function TabelPeserta({ seminarId, peserta, muat }: { seminarId: string; peserta: Peserta[]; muat: () => Promise<void> }) {
  const [modalSusulan, setModalSusulan] = useState(false)
  const labelStatus: Record<string, string> = { MENUNGGU: 'Menunggu', TERKIRIM: 'Terkirim', GAGAL: 'Gagal' }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>Peserta &amp; Sertifikat Multi-Peran</h3>
          <p className="hint" style={{ fontSize: '0.8rem', marginTop: 2 }}>
            Total {peserta.length} penerima terdaftar. Nomor seri dan status pengiriman email tercatat.
          </p>
        </div>
        <button className="btn pr sm" type="button" onClick={() => setModalSusulan(true)}>
          + Tambah Penerima / Sertifikat Susulan
        </button>
      </div>

      {peserta.length === 0 ? (
        <Empty title="Belum ada peserta" hint="Gunakan tombol + Tambah Penerima / Sertifikat Susulan di atas untuk menambahkan peserta/pembicara non-presensi." />
      ) : (
        <div className="sc">
          <table>
            <thead>
              <tr>
                <th>Penerima</th>
                <th>Peran</th>
                <th>Nomor Seri</th>
                <th>Status Email</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {peserta.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <br />
                    <span className="hint">{p.email}{p.nip ? ` · NIP: ${p.nip}` : ''}</span>
                    {p.alasan && (
                      <div className="hint" style={{ color: '#d97706', fontSize: '0.75rem', marginTop: 2 }}>
                        Alasan susulan: {p.alasan}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className={`bd ${
                        p.peran === 'Narasumber'
                          ? 'Berlangsung'
                          : p.peran === 'Moderator'
                            ? 'Menunggu'
                            : p.peran === 'Panitia'
                              ? 'Selesai'
                              : ''
                      }`}
                    >
                      {p.peran || 'Peserta'}
                    </span>
                  </td>
                  <td>{p.sertifikat?.nomor ?? <span className="hint">belum dibuat</span>}</td>
                <td>
                  {p.sertifikat?.emailStatus ? (
                    <span className={`bd ${p.sertifikat.emailStatus === 'TERKIRIM' ? 'Berlangsung' : p.sertifikat.emailStatus === 'GAGAL' ? 'Dibatalkan' : 'Menunggu'}`}>
                      {labelStatus[p.sertifikat.emailStatus] ?? p.sertifikat.emailStatus}
                    </span>
                  ) : (
                    <span className="hint">—</span>
                  )}
                  {p.sertifikat?.emailGalat && (
                    <>
                      <br />
                      <span className="hint" title={p.sertifikat.emailGalat}>galat tersimpan</span>
                    </>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {p.sertifikat?.pdfAda && (
                      <a className="btn sm" href={`/api/sertifikat/pdf/${p.sertifikat.id}`} target="_blank" rel="noreferrer">
                        PDF
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      <p className="hint" style={{ marginTop: 8 }}>Status email diperbarui oleh pekerja email setiap ±20 detik. Muat ulang halaman untuk memperbarui.</p>
      <button className="btn sm" onClick={() => void muat()}>Muat Ulang Status</button>
      {modalSusulan && (
        <ModalSertifikatSusulan
          seminarId={seminarId}
          tutup={() => setModalSusulan(false)}
          selesai={() => {
            setModalSusulan(false)
            void muat()
          }}
        />
      )}
    </div>
  )
}

function FormEmail({ seminarId, judul, peserta, muat }: { seminarId: string; judul: string; peserta: Peserta[]; muat: () => Promise<void> }) {
  const layak = peserta.filter((p) => p.sertifikat?.pdfAda)
  const [terpilih, setTerpilih] = useState<string[]>(layak.map((p) => p.id))
  const [subjek, setSubjek] = useState(`Sertifikat ${judul}`)
  const [isi, setIsi] = useState('Yth. {nama},\n\nTerima kasih telah mengikuti seminar "{judul}". Sertifikat kehadiran terlampir.\n\nSalam,\nSEMINAR BMKG')
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  const kirim = async () => {
    if (terpilih.length === 0) return setGalat('Centang minimal satu penerima')
    setProses(true)
    try {
      const hasil = await post<{ antre: number }>(`/api/sertifikat/seminars/${seminarId}/email`, { subjek, isi, penerima: terpilih })
      alert(`${hasil.antre} email masuk antrean dan akan dikirim oleh pekerja email.`)
      setGalat('')
      void muat()
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal mengirim')
    } finally {
      setProses(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h3>Kirim Email Sertifikat</h3>
      <p className="hint">Isi boleh memakai {'{nama}'}, {'{judul}'}, dan {'{link_materi}'}. Tautan Google Drive materi otomatis disertakan dalam badan email peserta.</p>
      <label htmlFor="em-subjek">Subjek</label>
      <input id="em-subjek" value={subjek} onChange={(e) => setSubjek(e.target.value)} />
      <label htmlFor="em-isi">Isi email</label>
      <textarea id="em-isi" rows={6} value={isi} onChange={(e) => setIsi(e.target.value)} />

      {/* Daftar Penerima Berstruktur Rapi */}
      <div style={{ marginTop: 14, border: '1px solid var(--bd)', borderRadius: 12, overflow: 'hidden', background: 'var(--c)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--bd)', flexWrap: 'wrap', gap: 8 }}>
          <strong style={{ fontSize: '0.9rem' }}>
            Daftar Penerima Sertifikat ({terpilih.length} dari {layak.length} dipilih)
          </strong>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn sm"
              onClick={() => setTerpilih(layak.map((p) => p.id))}
            >
              Pilih Semua
            </button>
            <button
              type="button"
              className="btn sm"
              onClick={() => setTerpilih([])}
            >
              Batal Pilih
            </button>
          </div>
        </div>

        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {layak.length === 0 ? (
            <p className="hint" style={{ padding: 16, textAlign: 'center' }}>Belum ada PDF sertifikat yang dibuat. Klik "Buat Sertifikat (PDF)" terlebih dahulu.</p>
          ) : (
            layak.map((p) => {
              const isChecked = terpilih.includes(p.id)
              return (
                <label
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    margin: 0,
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--bd)',
                    background: isChecked ? 'rgba(46, 158, 79, 0.05)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setTerpilih((t) => (e.target.checked ? [...t, p.id] : t.filter((x) => x !== p.id)))}
                    style={{ width: 'auto', margin: 0, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--t)' }}>{p.name}</div>
                    <div className="hint" style={{ fontSize: '0.8rem', marginTop: 1 }}>
                      {p.email}{p.nip ? ` · NIP: ${p.nip}` : ''}
                    </div>
                  </div>
                  <span className="bd Berlangsung" style={{ fontSize: '0.75rem', padding: '2px 8px', flexShrink: 0 }}>
                    PDF Siap ✓
                  </span>
                </label>
              )
            })
          )}
        </div>
      </div>

      {galat && <p className="err" role="alert">{galat}</p>}
      <button className="btn pr" style={{ marginTop: 14 }} onClick={kirim} disabled={proses || layak.length === 0}>
        {proses ? 'Memasukkan antrean…' : `Kirim ke ${terpilih.length} penerima`}
      </button>
    </div>
  )
}

function ModalSertifikatSusulan({
  seminarId,
  tutup,
  selesai,
}: {
  seminarId: string
  tutup: () => void
  selesai: () => void
}) {
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [peran, setPeran] = useState<'Peserta' | 'Narasumber' | 'Moderator' | 'Panitia'>('Peserta')
  const [alasan, setAlasan] = useState('')
  const [nip, setNip] = useState('')
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama.trim() || !email.trim()) return setGalat('Nama lengkap dan email wajib diisi')
    if (alasan.trim().length < 5) return setGalat('Alasan penerbitan susulan wajib diisi (minimal 5 karakter)')
    setGalat('')
    setProses(true)
    try {
      const res = await post<{ ok: boolean; nomor: string; pesan: string }>(
        `/api/sertifikat/seminars/${seminarId}/susulan`,
        {
          nama_lengkap: nama.trim(),
          email: email.trim(),
          peran,
          alasan: alasan.trim(),
          nip: nip.trim() || null,
        },
      )
      alert(res.pesan || 'Sertifikat susulan berhasil diterbitkan dan masuk antrean email!')
      selesai()
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Gagal menerbitkan sertifikat susulan')
    } finally {
      setProses(false)
    }
  }

  return (
    <div className="mod" onClick={(e) => e.target === e.currentTarget && tutup()} role="dialog" aria-modal="true">
      <div className="card" style={{ maxWidth: 480 }}>
        <h3>Tambah Penerima / Sertifikat Susulan</h3>
        <p className="hint" style={{ fontSize: '0.85rem' }}>
          Terbitkan sertifikat resmi susulan untuk peserta/pembicara non-presensi. Sertifikat akan langsung digenerate dengan nomor seri berikutnya dan dikirimkan via Nodemailer ke email penerima.
        </p>

        <form onSubmit={simpan} style={{ marginTop: 14 }}>
          <label htmlFor="sus-nama">Nama Lengkap *</label>
          <input
            id="sus-nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
            placeholder="contoh: Dr. Ahmad Fauzi, M.Si"
          />

          <label htmlFor="sus-email">Email Penerima *</label>
          <input
            id="sus-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="contoh: ahmad.fauzi@bmkg.go.id"
          />

          <label htmlFor="sus-peran">Peran Sertifikat *</label>
          <select id="sus-peran" value={peran} onChange={(e) => setPeran(e.target.value as any)} required>
            <option value="Peserta">Peserta</option>
            <option value="Narasumber">Narasumber</option>
            <option value="Moderator">Moderator</option>
            <option value="Panitia">Panitia</option>
          </select>

          <label htmlFor="sus-alasan">Alasan Penerbitan Susulan * (tercatat ke tabel audit log)</label>
          <textarea
            id="sus-alasan"
            rows={3}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            required
            placeholder="contoh: Hadir secara langsung sebagai pemateri, dikonfirmasi oleh koordinator seminar."
          />

          <label htmlFor="sus-nip">NIP (Opsional)</label>
          <input id="sus-nip" value={nip} onChange={(e) => setNip(e.target.value)} placeholder="Diisi bila berstatus ASN BMKG" />

          {galat && (
            <p className="err" role="alert" style={{ marginTop: 8 }}>
              {galat}
            </p>
          )}

          <div className="acts" style={{ marginTop: 16 }}>
            <button type="button" className="btn" onClick={tutup}>
              Batal
            </button>
            <button type="submit" className="btn pr" disabled={proses}>
              {proses ? 'Menerbitkan & Mengirim…' : 'Terbitkan & Kirim Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
