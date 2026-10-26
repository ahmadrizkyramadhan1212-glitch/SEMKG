import { labelJadwal } from '../lib/sesi'
// Beranda: Hero + Switcher View (Hari, Minggu, Bulan) + Timeline / Kalender Jadwal
// Tampilan umum dan pengguna terautentikasi disamakan (guest diarahkan login saat mengajukan seminar).
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get } from '../lib/api'
import { useAuth } from '../lib/auth'
import Timeline from '../components/Timeline'
import WeeklyView from '../components/WeeklyView'
import MonthlyView from '../components/MonthlyView'
import ScheduleSwitcher, { type ScheduleViewMode } from '../components/ScheduleSwitcher'
import { Loading, ErrorBox, Empty, fmtTanggalPendek } from '../components/ui'
import type { Lokasi, Seminar } from '../lib/types'

interface Item extends Seminar {
  milik: boolean
}


const hariWIB = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const toYMD = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`

const getSeninMinggu = (dStr: string) => {
  const d = new Date(`${dStr}T00:00:00`)
  const day = d.getDay() // 0 = Minggu, 1 = Senin
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    startDate: toYMD(monday),
    endDate: toYMD(sunday),
    monday,
    sunday,
  }
}

const getRentangBulan = (dStr: string) => {
  const [y, m] = dStr.split('-').map(Number)
  const firstDay = new Date(y, m - 1, 1)
  const lastDay = new Date(y, m, 0)

  return {
    startDate: toYMD(firstDay),
    endDate: toYMD(lastDay),
    monthStr: `${y}-${String(m).padStart(2, '0')}`,
    label: firstDay.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
  }
}

export default function Home() {
  const { me } = useAuth()
  const navigate = useNavigate()
  const dateInputRef = useRef<HTMLInputElement>(null)

  const [viewMode, setViewMode] = useState<ScheduleViewMode>('Harian')
  const [tanggal, setTanggal] = useState(hariWIB)
  const [data, setData] = useState<{ lokasi: Lokasi[]; seminar: Item[] } | null>(null)
  const [galat, setGalat] = useState('')
  const [memuat, setMemuat] = useState(false)
  const [mendatang, setMendatang] = useState<Seminar[] | null>(null)

  const muatData = useCallback(async () => {
    setMemuat(true)
    setGalat('')
    try {
      let endpoint = `/api/publik/timeline?date=${tanggal}`
      if (viewMode === 'Mingguan') {
        const { startDate, endDate } = getSeninMinggu(tanggal)
        endpoint = `/api/publik/timeline?startDate=${startDate}&endDate=${endDate}`
      } else if (viewMode === 'Bulanan') {
        const { startDate, endDate } = getRentangBulan(tanggal)
        endpoint = `/api/publik/timeline?startDate=${startDate}&endDate=${endDate}`
      }
      setData(await get(endpoint))
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal memuat jadwal seminar')
    } finally {
      setMemuat(false)
    }
  }, [tanggal, viewMode])

  useEffect(() => {
    void muatData()
  }, [muatData])

  useEffect(() => {
    void get<Seminar[]>('/api/publik/mendatang').then(setMendatang).catch(() => setMendatang([]))
  }, [])

  const geser = (arah: number) => {
    if (viewMode === 'Harian') {
      const d = new Date(`${tanggal}T00:00:00`)
      d.setDate(d.getDate() + arah)
      setTanggal(toYMD(d))
    } else if (viewMode === 'Mingguan') {
      const d = new Date(`${tanggal}T00:00:00`)
      d.setDate(d.getDate() + arah * 7)
      setTanggal(toYMD(d))
    } else {
      const [y, m] = tanggal.split('-').map(Number)
      const target = new Date(y, m - 1 + arah, 1)
      setTanggal(`${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-01`)
    }
  }

  // Label navigasi jadwal sesuai viewMode
  let labelNav = ''
  if (viewMode === 'Harian') {
    labelNav = new Date(`${tanggal}T00:00:00`).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } else if (viewMode === 'Mingguan') {
    const { monday, sunday } = getSeninMinggu(tanggal)
    const tglAwal = monday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    const tglAkhir = sunday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    labelNav = `${tglAwal} – ${tglAkhir}`
  } else {
    labelNav = getRentangBulan(tanggal).label
  }

  const handleBuatSeminar = () => {
    if (!me) {
      navigate(`/login?pesan=${encodeURIComponent('Silakan masuk terlebih dahulu untuk mengajukan seminar.')}`)
    } else {
      navigate('/seminar/baru')
    }
  }

  return (
    <main>
      <div className="hero card" style={{ padding: 26, marginBottom: 16 }}>
        <h2>SEMINAR BMKG</h2>
        <p style={{ margin: '6px 0 4px', maxWidth: 620, opacity: 0.92, lineHeight: 1.5 }}>
          Sistem Informasi Seminar Ilmiah BMKG. Lihat jadwal seminar unit kerja, ajukan seminar ilmiah Anda, dan catat presensi kegiatan secara terintegrasi.
        </p>
        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn pr" onClick={handleBuatSeminar}>
            + Ajukan Seminar
          </button>
          {!me && (
            <span className="hint" style={{ fontSize: 12 }}>
              Belum login? Anda tetap dapat melihat seluruh jadwal & materi di bawah.
            </span>
          )}
        </div>
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        {/* Header Kontrol Jadwal: Switcher Mode + Navigasi Tanggal */}
        <div className="dn" style={{ justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Jadwal Seminar</h3>
            {/* Tombol Switcher Mode Tampilan (Hari, Minggu, Bulan) */}
            <ScheduleSwitcher mode={viewMode} onChange={setViewMode} />
          </div>

          <div className="dn" style={{ gap: 8 }}>
            <div className="seg" role="group" aria-label="Navigasi jadwal">
              <button onClick={() => geser(-1)} aria-label="Sebelumnya" title="Sebelumnya">
                ‹
              </button>
              <button
                type="button"
                className="seg-label"
                onClick={() => dateInputRef.current?.showPicker?.()}
                title="Klik untuk memilih tanggal dari kalender"
                style={{
                  background: 'none',
                  border: 'none',
                  font: 'inherit',
                  fontWeight: 'bold',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: '0 14px',
                  whiteSpace: 'nowrap',
                  minWidth: 'max-content',
                }}
              >
                {labelNav}
              </button>
              <button onClick={() => geser(1)} aria-label="Berikutnya" title="Berikutnya">
                ›
              </button>
            </div>
            <input
              ref={dateInputRef}
              type="date"
              value={tanggal}
              onChange={(e) => e.target.value && setTanggal(e.target.value)}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
              tabIndex={-1}
              aria-hidden="true"
            />

            <button
              className="today"
              onClick={() => setTanggal(hariWIB())}
              title={viewMode === 'Harian' ? 'Kembali ke hari ini' : viewMode === 'Mingguan' ? 'Kembali ke minggu ini' : 'Kembali ke bulan ini'}
            >
              {viewMode === 'Harian' ? 'Hari ini' : viewMode === 'Mingguan' ? 'Minggu ini' : 'Bulan ini'}
            </button>
          </div>
        </div>

        {galat && <ErrorBox message={galat} onCobaLagi={muatData} />}

        {!galat && (memuat || !data) ? (
          <Loading />
        ) : data && (
          <>
            {viewMode === 'Harian' && (
              <Timeline tanggal={tanggal} lokasi={data.lokasi} seminar={data.seminar} />
            )}
            {viewMode === 'Mingguan' && (
              <WeeklyView
                startDate={getSeninMinggu(tanggal).startDate}
                seminar={data.seminar}
                onPilihHari={(t) => {
                  setTanggal(t)
                  setViewMode('Harian')
                }}
              />
            )}
            {viewMode === 'Bulanan' && (
              <MonthlyView
                monthStr={getRentangBulan(tanggal).monthStr}
                seminar={data.seminar}
                onPilihHari={(t) => {
                  setTanggal(t)
                  setViewMode('Harian')
                }}
              />
            )}
          </>
        )}

        {!me && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(11, 60, 140, 0.05)', border: '1px solid var(--bd)', fontSize: 12, color: 'var(--m)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--p)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Ingin mengajukan seminar ilmiah? Klik tombol <strong>+ Ajukan Seminar</strong> atau klik pada slot kosong jam yang diinginkan untuk masuk ke sistem.</span>
          </div>
        )}
      </section>

      <section className="card upc">
        <h3 style={{ marginBottom: 10 }}>Seminar Mendatang</h3>
        {mendatang === null ? (
          <Loading />
        ) : mendatang.length === 0 ? (
          <Empty title="Belum ada seminar mendatang" hint="Seminar yang telah disetujui admin akan tampil di sini." />
        ) : (
          <div className="g3">
            {mendatang.map((s) => (
              <Link to={`/seminar-publik/${s.id}`} key={s.id} className="card" style={{ display: 'block' }}>
                <b style={{ display: 'block', marginBottom: 4 }}>{s.title}</b>
                <span className="hint">
                  {fmtTanggalPendek(s.date)} · {labelJadwal(s.startTime, s.endTime)} · {s.locationOther?.trim() || s.location.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
