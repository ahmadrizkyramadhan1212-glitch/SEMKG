import { labelJadwal } from '../lib/sesi'
// Tampilan Jadwal Bulan: Kalender grid 1 bulan dengan chip seminar per tanggal.
import { useNavigate } from 'react-router-dom'
import type { Seminar } from '../lib/types'

interface Item extends Seminar {
  milik: boolean
}

const HARI_HEADER = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

export default function MonthlyView({
  monthStr,
  seminar,
  onPilihHari,
}: {
  monthStr: string // YYYY-MM
  seminar: Item[]
  onPilihHari: (t: string) => void
}) {
  const navigate = useNavigate()
  const [year, month] = monthStr.split('-').map(Number)

  // Tanggal 1 bulan ini
  const firstDay = new Date(year, month - 1, 1)
  // Jumlah hari bulan ini
  const lastDate = new Date(year, month, 0).getDate()
  // Hari dalam minggu untuk tanggal 1 (0=Min, 1=Sen, ... 6=Sab) -> ubah ke 0=Sen s/d 6=Min
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7

  // Tanggal terakhir bulan lalu
  const prevMonthLastDate = new Date(year, month - 1, 0).getDate()

  const todayStr = new Date().toLocaleDateString('en-CA')

  interface CellInfo {
    ymd: string
    dayNum: number
    isCurrentMonth: boolean
    isToday: boolean
  }

  const cells: CellInfo[] = []

  // Hari dari bulan sebelumnya
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dNum = prevMonthLastDate - i
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const ymd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`
    cells.push({
      ymd,
      dayNum: dNum,
      isCurrentMonth: false,
      isToday: ymd === todayStr,
    })
  }

  // Hari bulan ini
  for (let d = 1; d <= lastDate; d++) {
    const ymd = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({
      ymd,
      dayNum: d,
      isCurrentMonth: true,
      isToday: ymd === todayStr,
    })
  }

  // Hari bulan berikutnya agar genap kelipatan 7
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      const ymd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        ymd,
        dayNum: d,
        isCurrentMonth: false,
        isToday: ymd === todayStr,
      })
    }
  }

  return (
    <div>
      <div className="month-grid" style={{ marginBottom: 6 }}>
        {HARI_HEADER.map((h) => (
          <div key={h} className="month-head">
            {h}
          </div>
        ))}
      </div>
      <div className="month-grid">
        {cells.map((cell) => {
          const daftar = seminar.filter((s) => s.date.slice(0, 10) === cell.ymd)

          return (
            <div
              key={cell.ymd}
              className={`cal-cell ${cell.isCurrentMonth ? '' : 'other-month'} ${cell.isToday ? 'today' : ''}`}
              onClick={() => onPilihHari(cell.ymd)}
              title={`Klik untuk melihat jadwal Hari tanggal ${cell.ymd}`}
            >
              <div className="cal-cell-header">
                <span style={{ fontWeight: cell.isToday ? 700 : 500 }}>{cell.dayNum}</span>
                {cell.isToday && <span className="today-badge">Hari ini</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, marginTop: 2 }}>
                {daftar.slice(0, 2).map((s) => {
                  const locKey = s.location.key
                  const namaTempat = s.locationOther?.trim() || s.location.name
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`cal-chip ${locKey}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(s.milik ? `/seminar/${s.id}` : `/seminar-publik/${s.id}`)
                      }}
                      title={`${s.title} (${labelJadwal(s.startTime, s.endTime)} di ${namaTempat})`}
                    >
                      <span>{s.startTime}</span> {s.title}
                    </button>
                  )
                })}
                {daftar.length > 2 && (
                  <span style={{ fontSize: 10, color: 'var(--m)', fontWeight: 600, paddingLeft: 2 }}>
                    +{daftar.length - 2} lainnya
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
