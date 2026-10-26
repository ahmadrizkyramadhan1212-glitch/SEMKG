import { labelJadwal } from '../lib/sesi'
// Tampilan Jadwal Mingguan: 7 kolom hari (Senin s/d Minggu) dengan kartu seminar per hari.
import { useNavigate } from 'react-router-dom'
import type { Seminar } from '../lib/types'
import { useAuth } from '../lib/auth'

interface Item extends Seminar {
  milik: boolean
}

export default function WeeklyView({
  startDate,
  seminar,
  onPilihHari,
}: {
  startDate: string
  seminar: Item[]
  onPilihHari: (t: string) => void
}) {
  const { me } = useAuth()
  const navigate = useNavigate()

  // Buat 7 hari mulai dari startDate (Senin)
  const dMulai = new Date(`${startDate}T00:00:00`)
  const hariList = Array.from({ length: 7 }, (_, i) => {
    const cur = new Date(dMulai)
    cur.setDate(dMulai.getDate() + i)
    const ymd = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
    const namaHari = cur.toLocaleDateString('id-ID', { weekday: 'short' })
    const tglBulan = cur.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    const isToday = cur.toDateString() === new Date().toDateString()
    return { ymd, namaHari, tglBulan, isToday }
  })

  // Warna penanda ruangan diaplikasikan ke ikon maps/pin lokasi
  const getLokasiColor = (key: string) => {
    switch (key) {
      case 'auditorium':
        return '#0b3c8c' // Biru BMKG
      case 'ruang-rapat':
        return '#2e9e4f' // Hijau BMKG
      case 'online':
        return '#0284c7' // Biru Cerah
      case 'lainnya':
      default:
        return '#d97706' // Amber / Oranye
    }
  }

  return (
    <div className="week-grid">
      {hariList.map((h) => {
        const daftar = seminar.filter((s) => s.date.slice(0, 10) === h.ymd)

        return (
          <div key={h.ymd} className={`week-col ${h.isToday ? 'today' : ''}`}>
            <div
              className="week-head"
              onClick={() => onPilihHari(h.ymd)}
              title="Klik untuk beralih ke tampilan Harian tanggal ini"
            >
              <div className="week-day-name">{h.namaHari}</div>
              <div className="week-day-date">{h.tglBulan}</div>
              {h.isToday ? (
                <span className="week-today-pill">Hari ini</span>
              ) : (
                <span className="week-count-pill">{daftar.length > 0 ? `${daftar.length} seminar` : 'Kosong'}</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {daftar.length === 0 ? (
                <button
                  type="button"
                  className="week-empty-slot"
                  onClick={() => {
                    if (!me) {
                      navigate(`/login?pesan=${encodeURIComponent('Silakan masuk terlebih dahulu untuk mengajukan seminar.')}`)
                    } else {
                      navigate(`/seminar/baru?tanggal=${h.ymd}`)
                    }
                  }}
                  title="Klik untuk mengajukan jadwal seminar pada tanggal ini"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>+ Ajukan</span>
                </button>
              ) : (
                daftar.map((s) => {
                  const lokasiColor = getLokasiColor(s.location.key)
                  const namaTempat = s.locationOther?.trim() || s.location.name

                  return (
                    <div
                      key={s.id}
                      className="week-card"
                      onClick={() => navigate(s.milik ? `/seminar/${s.id}` : `/seminar-publik/${s.id}`)}
                      title={`${s.title}\n${s.startTime}–${s.endTime} WIB\nLokasi: ${namaTempat}`}
                    >
                      <div className="week-card-time">
                        {labelJadwal(s.startTime, s.endTime)}
                      </div>
                      <div className="week-card-title">{s.title}</div>
                      <div className="week-card-loc">
                        {/* Ikon Maps / Lokasi dengan warna penanda ruangan */}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          style={{ color: lokasiColor, flexShrink: 0 }}
                          aria-hidden="true"
                        >
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span className="loc-text">{namaTempat}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
