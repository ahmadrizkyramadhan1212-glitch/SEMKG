// Form seminar 3 langkah (Jadwal & Sesi → Detail → Lampiran) dengan sistem sesi tetap (07.00 - 16.00 WIB).
// Dipakai untuk Buat Seminar dan Ubah Seminar (bila bisaSemua=false, bagian jadwal dikunci).
import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { get, post, patch } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Lokasi, Seminar } from '../lib/types'
import { DAFTAR_SESI, LIST_SESI, normalisasiSesi, sesiDariJam, labelJadwal, type SesiTipe } from '../lib/sesi'
import { Loading } from './ui'

const MB = 1024 * 1024

interface Nilai {
  locationId: string
  locationOther: string
  tipe_acara: 'Offline' | 'Online' | 'Hybrid'
  zoom_link: string
  zoom_passcode: string
  date: string
  sesi: SesiTipe | ''
  startTime: string
  endTime: string
  title: string
  topic: string
}

interface SesiKetersediaanResponse {
  sesi: SesiTipe
  tersedia: boolean
  bentrokDengan?: string
}

export default function SeminarForm({
  seminar,
  bisaSemua,
  selesai,
}: {
  seminar?: Seminar // bila ada berarti mode edit
  bisaSemua: boolean // boleh mengubah jadwal/lokasi/dokumen
  selesai: (pesan: string) => void
}) {
  const { me } = useAuth()
  const [cariParams] = useSearchParams()
  const [langkah, setLangkah] = useState(1)
  const [lokasi, setLokasi] = useState<Lokasi[] | null>(null)

  // Inisialisasi dari seminar atau prefill query param
  const paramSesi = normalisasiSesi(cariParams.get('sesi'))
  const seminarSesi = normalisasiSesi(seminar?.sesi) ?? (seminar ? sesiDariJam(seminar.startTime, seminar.endTime) : null)
  const sesiAwal = seminarSesi ?? paramSesi ?? ''

  const [f, setF] = useState<Nilai>({
    locationId: seminar?.locationId ?? cariParams.get('lokasi') ?? '',
    locationOther: seminar?.locationOther ?? '',
    tipe_acara: (seminar?.tipe_acara as any) || (seminar?.tipeAcara as any) || 'Offline',
    zoom_link: seminar?.zoom_link || seminar?.zoomLink || '',
    zoom_passcode: seminar?.zoom_passcode || seminar?.zoomPasscode || '',
    date: seminar?.date.slice(0, 10) ?? cariParams.get('tanggal') ?? '',
    sesi: sesiAwal,
    startTime: seminar?.startTime ?? (sesiAwal ? DAFTAR_SESI[sesiAwal]?.start ?? '' : ''),
    endTime: seminar?.endTime ?? (sesiAwal ? DAFTAR_SESI[sesiAwal]?.end ?? '' : ''),
    title: seminar?.title ?? '',
    topic: seminar?.topic ?? '',
  })

  const [surat, setSurat] = useState<File | null>(null)
  const [poster, setPoster] = useState<File | null>(null)
  const [bentrok, setBentrok] = useState<string | null>(null)
  const [daftarKetersediaan, setDaftarKetersediaan] = useState<Record<SesiTipe, { tersedia: boolean; bentrokDengan?: string }> | null>(null)
  const [memuatStatus, setMemuatStatus] = useState(false)
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  useEffect(() => {
    void get<Lokasi[]>('/api/seminars/locations').then(setLokasi).catch(() => setLokasi([]))
  }, [])

  const lokasiPilih = lokasi?.find((l) => l.id === f.locationId)
  const fisik = lokasiPilih?.type === 'PHYSICAL'

  // Ambil ketersediaan Sesi (Pagi, Siang, Full-day) saat lokasi dan tanggal terisi
  useEffect(() => {
    if (!f.locationId || !f.date) {
      setDaftarKetersediaan(null)
      return
    }

    let batal = false
    setMemuatStatus(true)

    const q = new URLSearchParams({
      locationId: f.locationId,
      date: f.date,
      ...(seminar && { abaikan: seminar.id }),
    })

    get<SesiKetersediaanResponse[]>(`/api/seminars/sesi-tersedia?${q}`)
      .then((res) => {
        if (!batal) {
          const map: Record<SesiTipe, { tersedia: boolean; bentrokDengan?: string }> = {
            PAGI: { tersedia: true },
            SIANG: { tersedia: true },
            FULL_DAY: { tersedia: true },
          }
          for (const item of res) {
            map[item.sesi] = { tersedia: item.tersedia, bentrokDengan: item.bentrokDengan }
          }
          setDaftarKetersediaan(map)

          // Jika sesi yang sedang terpilih ternyata tidak tersedia, set pesan bentrok
          if (f.sesi && map[f.sesi] && !map[f.sesi].tersedia) {
            const judul = map[f.sesi].bentrokDengan
            setBentrok(judul ? `Jadwal bentrok dengan "${judul}"` : 'Sesi yang dipilih tidak lagi tersedia')
          } else {
            setBentrok(null)
          }
        }
      })
      .catch(() => {
        if (!batal) setDaftarKetersediaan(null)
      })
      .finally(() => {
        if (!batal) setMemuatStatus(false)
      })

    return () => {
      batal = true
    }
  }, [f.locationId, f.date, seminar, f.sesi])

  if (!lokasi) return <Loading />

  // Handler memilih sesi
  const pilihSesi = (sesiKode: SesiTipe) => {
    if (!bisaSemua) return
    const opt = DAFTAR_SESI[sesiKode]
    if (!opt) return

    setF((prev) => ({
      ...prev,
      sesi: sesiKode,
      startTime: opt.start,
      endTime: opt.end,
    }))
    setGalat('')
  }

  const validasiLangkah = (n: number): string | null => {
    if (n === 1) {
      if (!f.locationId) return 'Pilih lokasi terlebih dahulu'
      if (lokasiPilih?.type === 'OTHER' && !f.locationOther.trim()) return 'Tuliskan nama lokasi untuk pilihan Lainnya'
      if (!f.date) return 'Pilih tanggal pelaksanaan seminar'
      if (f.tipe_acara === 'Online' && !f.zoom_link.trim()) {
        return 'Tautan Zoom Meeting wajib diisi untuk acara bertipe Online'
      }

      if (!f.sesi) return 'Pilih sesi kegiatan (Pagi, Siang, atau Full-day)'

      if (daftarKetersediaan && daftarKetersediaan[f.sesi] && !daftarKetersediaan[f.sesi].tersedia) {
        const judul = daftarKetersediaan[f.sesi].bentrokDengan
        return judul ? `Sesi ${DAFTAR_SESI[f.sesi].label} bentrok dengan "${judul}"` : `Sesi ${DAFTAR_SESI[f.sesi].label} tidak tersedia`
      }

      if (bentrok) return `Jadwal bentrok: ${bentrok}`
    }
    if (n === 2 && f.title.trim().length < 5) return 'Judul minimal 5 karakter'
    return null
  }

  const lanjut = () => {
    const g = validasiLangkah(langkah)
    if (g) return setGalat(g)
    setGalat('')
    setLangkah((l) => Math.min(3, l + 1))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    for (const n of [1, 2]) {
      const g = validasiLangkah(n)
      if (g) return setGalat(g)
    }
    if (!seminar && !surat) return setGalat('Surat izin wajib dilampirkan (PDF/JPG/PNG/DOC/DOCX, maks 5 MB)')
    setGalat('')
    setProses(true)

    try {
      if (seminar) {
        const data: Record<string, any> = {
          title: f.title,
          topic: f.topic,
          tipe_acara: f.tipe_acara,
          zoom_link: f.tipe_acara !== 'Offline' ? f.zoom_link : null,
          zoom_passcode: f.tipe_acara !== 'Offline' ? f.zoom_passcode : null,
        }
        if (bisaSemua) {
          Object.assign(data, {
            locationId: f.locationId,
            locationOther: f.locationOther,
            date: f.date,
            sesi: f.sesi,
          })
        }
        await patch(`/api/seminars/${seminar.id}`, data)
        selesai('Perubahan tersimpan')
      } else {
        const fd = new FormData()
        Object.entries(f).forEach(([k, v]) => {
          if (k === 'startTime' || k === 'endTime') return // dihitung server dari sesi
          fd.append(k, v)
        })
        if (surat) fd.append('surat', surat)
        if (poster) fd.append('poster', poster)
        await post('/api/seminars', fd)
        selesai('Seminar diajukan dan menunggu verifikasi admin')
      }
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setProses(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="steps" aria-label="Langkah pengisian">
        {['1. Jadwal & Sesi', '2. Detail Seminar', '3. Lampiran Dokumen'].map((s, i) => (
          <span key={s} className={langkah === i + 1 ? 'on' : langkah > i + 1 ? 'dn' : ''}>
            {s}
          </span>
        ))}
      </div>

      {langkah === 1 && (
        <fieldset disabled={!bisaSemua} style={{ border: 0, padding: 0 }}>
          {!bisaSemua && (
            <p className="hint" style={{ marginBottom: 10 }}>
              Jadwal dan sesi terkunci pada status ini. Untuk mengubahnya, batalkan seminar lalu buat baru.
            </p>
          )}

          {/* Pemilihan Tipe Pelaksanaan Acara */}
          <div className="mb-4">
            <label className="font-semibold block mb-1 text-sm text-slate-900 dark:text-white">
              Tipe Acara *
            </label>
            <p className="hint mb-2 text-xs">
              Pilih format pelaksanaan kegiatan seminar ilmiah BMKG.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  tipe: 'Offline' as const,
                  label: '🏢 Offline',
                  desc: 'Tatap muka di Gedung BMKG',
                },
                {
                  tipe: 'Online' as const,
                  label: '🌐 Online',
                  desc: 'Daring via Zoom Meeting',
                },
                {
                  tipe: 'Hybrid' as const,
                  label: '🔀 Hybrid',
                  desc: 'Gedung BMKG + Siaran Zoom',
                },
              ].map((opt) => {
                const isSelected = f.tipe_acara === opt.tipe
                return (
                  <button
                    key={opt.tipe}
                    type="button"
                    onClick={() => {
                      if (!bisaSemua) return
                      const onlineLoc = lokasi?.find((l) => l.type === 'ONLINE')
                      setF((prev) => ({
                        ...prev,
                        tipe_acara: opt.tipe,
                        locationId: opt.tipe === 'Online' && onlineLoc ? onlineLoc.id : (opt.tipe !== 'Online' && prev.locationId === onlineLoc?.id ? '' : prev.locationId),
                      }))
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                        : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{opt.label}</div>
                    <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* INPUT KONDISIONAL: TAUTAN ZOOM & PASSCODE (UNTUK ONLINE & HYBRID) */}
          {(f.tipe_acara === 'Online' || f.tipe_acara === 'Hybrid') && (
            <div className="mb-4 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
              <div className="flex items-center gap-2 mb-2 font-semibold text-sm text-blue-900 dark:text-blue-300">
                <span>📹</span>
                <span>Konfigurasi Siaran Zoom Meeting ({f.tipe_acara})</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label htmlFor="sf-zoom-link" className="font-semibold block mb-1 text-xs text-slate-800 dark:text-slate-200">
                    Tautan Zoom Meeting {f.tipe_acara === 'Online' ? '*' : '(Opsional)'}
                  </label>
                  <input
                    id="sf-zoom-link"
                    type="url"
                    value={f.zoom_link}
                    onChange={(e) => setF({ ...f, zoom_link: e.target.value })}
                    placeholder="https://zoom.us/j/1234567890?pwd=..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={f.tipe_acara === 'Online'}
                  />
                </div>
                <div>
                  <label htmlFor="sf-zoom-pass" className="font-semibold block mb-1 text-xs text-slate-800 dark:text-slate-200">
                    Passcode Zoom (Opsional)
                  </label>
                  <input
                    id="sf-zoom-pass"
                    type="text"
                    value={f.zoom_passcode}
                    onChange={(e) => setF({ ...f, zoom_passcode: e.target.value })}
                    placeholder="contoh: 123456 atau bmkg2026"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pemilihan Lokasi */}
          <label htmlFor="sf-lokasi" className="font-semibold block mb-1">
            Lokasi Seminar *
          </label>
          <select
            id="sf-lokasi"
            value={f.locationId}
            onChange={(e) => {
              const baruId = e.target.value
              setF((prev) => ({
                ...prev,
                locationId: baruId,
              }))
            }}
            required
            className="w-full mb-2"
          >
            <option value="">— Pilih lokasi —</option>
            {lokasi.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
                {l.capacity ? ` (${l.capacity} orang)` : ''}
              </option>
            ))}
          </select>

          {lokasiPilih?.type === 'OTHER' && (
            <div className="mb-3">
              <label htmlFor="sf-lain" className="font-semibold block mb-1">
                Tuliskan Lokasi Spesifik *
              </label>
              <input
                id="sf-lain"
                value={f.locationOther}
                onChange={(e) => setF({ ...f, locationOther: e.target.value })}
                placeholder="contoh: Ruang Serbaguna BMKG Stasiun Citeko"
                required
              />
            </div>
          )}

          {f.locationId && (
            <p className="fc mb-4">
              <span className={fisik ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}>
                {fisik
                  ? '🏢 Ruangan Fisik BMKG — Menggunakan Sistem Sesi 07.00 - 16.00 WIB'
                  : lokasiPilih?.type === 'ONLINE'
                    ? '🌐 Online (Zoom Meeting) — Menggunakan Sistem Sesi 07.00 - 16.00 WIB'
                    : '📍 Lokasi Lainnya — Menggunakan Sistem Sesi 07.00 - 16.00 WIB'}
              </span>
              {lokasiPilih?.facilities && <span>{lokasiPilih.facilities}</span>}
            </p>
          )}

          {/* Pemilihan Tanggal Pelaksanaan */}
          <div className="mb-4">
            <label htmlFor="sf-tanggal" className="font-semibold block mb-1">
              Tanggal Pelaksanaan *
            </label>
            <input
              id="sf-tanggal"
              type="date"
              value={f.date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setF({ ...f, date: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-900"
            />
          </div>

          {/* TIGA KARTU PILIHAN SESI (RADIO BERBANTU KEYBOARD) */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-sm text-slate-900 dark:text-white">
                Pilih Sesi Kegiatan *
              </label>
              {memuatStatus && <span className="text-xs text-slate-500 animate-pulse">Memeriksa ketersediaan…</span>}
            </div>
            <p className="hint mb-3 text-xs">
              Jadwal pelaksanaan seminar BMKG menggunakan sesi kerja tetap 07.00 – 16.00 WIB.
            </p>

            {!f.date || !f.locationId ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 my-2">
                📅 Silakan pilih <strong>Lokasi</strong> dan <strong>Tanggal Pelaksanaan</strong> terlebih dahulu untuk memeriksa ketersediaan sesi.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3" role="radiogroup" aria-label="Pilihan Sesi Kegiatan">
                {LIST_SESI.map((s) => {
                  const statusInfo = daftarKetersediaan ? daftarKetersediaan[s.kode] : null
                  const isAvailable = statusInfo ? statusInfo.tersedia : true
                  const bentrokDengan = statusInfo?.bentrokDengan
                  const isSelected = f.sesi === s.kode
                  const radioId = `sesi-${s.kode.toLowerCase()}`

                  return (
                    <label
                      key={s.kode}
                      htmlFor={radioId}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 ${
                        !isAvailable
                          ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                          : isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                            : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id={radioId}
                              name="sesi"
                              value={s.kode}
                              checked={isSelected}
                              disabled={!isAvailable || !bisaSemua}
                              onChange={() => isAvailable && pilihSesi(s.kode)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                            />
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {s.namaLengkap}
                            </span>
                          </div>
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                            {s.jamRentang}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        {isAvailable ? (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            ✓ Tersedia
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 truncate" title={`Terisi: ${bentrokDengan || 'Seminar Lain'}`}>
                            🔒 Terisi: {bentrokDengan || 'Seminar Lain'}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {s.kode === 'FULL_DAY' ? 'Seharian' : 'Setengah Hari'}
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            {/* Rangkuman Jam Terpilih */}
            {f.sesi && DAFTAR_SESI[f.sesi] && (
              <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Jadwal Terpilih:
                  </span>
                  <strong className="text-blue-600 dark:text-blue-400">
                    {labelJadwal(DAFTAR_SESI[f.sesi].start, DAFTAR_SESI[f.sesi].end)}
                  </strong>
                </div>
                <span className="text-slate-500 text-[11px]">Sistem Sesi BMKG</span>
              </div>
            )}
          </div>

          {/* Indikator Status & Bentrok */}
          {bisaSemua && bentrok && (
            <div className="ind no mt-4" role="alert">
              ⚠ {bentrok}
            </div>
          )}
          {bisaSemua && !bentrok && f.date && f.sesi && (
            <div className="ind ok mt-4">
              ✓ Jadwal tersedia untuk {DAFTAR_SESI[f.sesi]?.namaLengkap}
            </div>
          )}
        </fieldset>
      )}

      {langkah === 2 && (
        <fieldset style={{ border: 0, padding: 0 }}>
          <label htmlFor="sf-judul">Judul seminar</label>
          <input
            id="sf-judul"
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            minLength={5}
            required
            placeholder="contoh: Analisis Pola Curah Hujan Ekstrem 2026"
          />
          <label htmlFor="sf-topik">Topik / abstrak singkat</label>
          <textarea
            id="sf-topik"
            rows={4}
            value={f.topic}
            onChange={(e) => setF({ ...f, topic: e.target.value })}
            placeholder="Tujuan, metode, dan hasil utama yang akan dipresentasikan"
          />
        </fieldset>
      )}

      {langkah === 3 && (
        <fieldset disabled={!!seminar} style={{ border: 0, padding: 0 }}>
          {seminar && (
            <p className="hint" style={{ marginBottom: 10 }}>
              Untuk mengunggah ulang surat/poster, gunakan tombol unggah di halaman detail saat status Dikembalikan.
            </p>
          )}
          <label htmlFor="sf-surat">Surat izin (wajib) — PDF/JPG/PNG/DOC/DOCX, maks 5 MB</label>
          <input
            id="sf-surat"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              if (file && file.size > 5 * MB) {
                setGalat('Ukuran surat melebihi 5 MB')
                e.target.value = ''
                return setSurat(null)
              }
              setGalat('')
              setSurat(file)
            }}
            required={!seminar}
          />
          <label htmlFor="sf-poster">Poster (opsional) — JPG/PNG/WEBP/PDF, maks 5 MB</label>
          <input
            id="sf-poster"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              if (file && file.size > 5 * MB) {
                setGalat('Ukuran poster melebihi 5 MB')
                e.target.value = ''
                return setPoster(null)
              }
              setGalat('')
              setPoster(file)
            }}
          />
          {surat && (
            <p className="fc">
              <span>Surat: {surat.name}</span>
              <span>{(surat.size / MB).toFixed(2)} MB</span>
            </p>
          )}
        </fieldset>
      )}

      {galat && (
        <p className="err" role="alert">
          {galat}
        </p>
      )}
      <div className="dn" style={{ marginTop: 16 }}>
        {langkah > 1 && (
          <button type="button" className="btn" onClick={() => setLangkah((l) => l - 1)}>
            ← Kembali
          </button>
        )}
        {langkah < 3 && (
          <button type="button" className="btn pr" onClick={lanjut}>
            Lanjut →
          </button>
        )}
        {langkah === 3 && (
          <button className="btn pr" disabled={proses}>
            {proses ? 'Menyimpan…' : seminar ? 'Simpan perubahan' : 'Ajukan Seminar'}
          </button>
        )}
        {me && langkah === 3 && !seminar && <span className="hint">Pengajuan langsung diverifikasi oleh admin unit.</span>}
      </div>
    </form>
  )
}
