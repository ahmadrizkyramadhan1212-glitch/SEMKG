// Timeline Seminar: Tampilan Hari (07:00–16:00 WIB) dengan sistem sesi BMKG.
// Header dibagi dua pita (PAGI 07-12 dan SIANG 12-16) dengan pembatas vertikal di 12.00.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Lokasi, Seminar } from '../lib/types'
import { useAuth } from '../lib/auth'
import { DAFTAR_SESI, normalisasiSesi, sesiDariJam, labelJadwal } from '../lib/sesi'

const MULAI = 7 // 07.00 WIB
const SELESAI = 16 // 16.00 WIB
const RENTANG = SELESAI - MULAI // 9 jam
const TITIK_PISAH_12 = ((12 - MULAI) / RENTANG) * 100 // 55.5556%

const MENIT = (jam: string) => Number(jam.slice(0, 2)) * 60 + Number(jam.slice(3, 5))
// Posisi kiri & lebar blok dalam persen
const kiri = (jam: string) => Math.max(0, Math.min(100, ((MENIT(jam) - MULAI * 60) / (RENTANG * 60)) * 100))
const lebar = (mulai: string, selesai: string) => Math.max(3.5, Math.min(100 - kiri(mulai), ((MENIT(selesai) - MENIT(mulai)) / (RENTANG * 60)) * 100))

interface Item extends Seminar {
  milik: boolean
}

export default function Timeline({ tanggal, lokasi, seminar }: { tanggal: string; lokasi: Lokasi[]; seminar: Item[] }) {
  const { me } = useAuth()
  const navigate = useNavigate()
  const [, setKini] = useState(new Date())

  // Garis "sekarang" bergerak tiap menit
  useEffect(() => {
    const t = setInterval(() => setKini(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const tanggalIni = new Date(`${tanggal}T00:00:00+07:00`)
  const hariIniWIB = new Date()
  const samaHari = tanggalIni.toDateString() === hariIniWIB.toDateString()
  const menitKini = hariIniWIB.getHours() * 60 + hariIniWIB.getMinutes()
  const posisiKini = ((menitKini - MULAI * 60) / (RENTANG * 60)) * 100
  // Garis "sekarang" hanya tampil di antara 07.00-16.00 WIB
  const tampilKini = samaHari && menitKini >= MULAI * 60 && menitKini <= SELESAI * 60

  const jamLabel = Array.from({ length: RENTANG + 1 }, (_, i) => MULAI + i)

  const getDotColor = (key: string) => {
    switch (key) {
      case 'auditorium':
        return '#0b3c8c'
      case 'ruang-rapat':
        return '#2e9e4f'
      case 'online':
        return '#0284c7'
      case 'lainnya':
      default:
        return '#d97706'
    }
  }

  const formatNamaSesi = (s: Item) => {
    const norm = normalisasiSesi(s.sesi) ?? sesiDariJam(s.startTime, s.endTime)
    if (norm && DAFTAR_SESI[norm]) {
      return DAFTAR_SESI[norm].label
    }
    return null
  }

  const blok = (s: Item, l: Lokasi) => {
    const namaTempat = s.locationOther?.trim() || l.name
    const namaSesi = formatNamaSesi(s)

    return (
      <button
        key={s.id}
        className={`hv ${s.milik && s.status === 'MENUNGGU_VERIFIKASI' ? 'Menunggu' : ''} ${s.milik && (s.status === 'MENUNGGU_VERIFIKASI' || s.status === 'DIKEMBALIKAN') ? 'dim' : ''}`}
        style={{ left: `${kiri(s.startTime)}%`, width: `${lebar(s.startTime, s.endTime)}%`, minWidth: 95 }}
        onClick={(e) => {
          e.stopPropagation()
          navigate(s.milik ? `/seminar/${s.id}` : `/seminar-publik/${s.id}`)
        }}
        aria-label={`${s.title}, ${s.startTime} sampai ${s.endTime} WIB di ${namaTempat}`}
      >
        <span className="truncate block font-bold text-[11.5px] leading-tight text-center w-full">{s.title}</span>
        <small className="block text-[9.5px] opacity-90 truncate leading-tight mt-0.5 text-center w-full">
          {namaSesi ? `${namaSesi} • ` : ''}{labelJadwal(s.startTime, s.endTime)} WIB
        </small>
      </button>
    )
  }

  const klikSlotKosong = (e: React.MouseEvent<HTMLDivElement>, l: Lokasi) => {
    if (!me) {
      navigate(`/login?pesan=${encodeURIComponent('Silakan masuk terlebih dahulu untuk mengajukan seminar pada slot ini.')}`)
      return
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const persen = (e.clientX - rect.left) / rect.width
    const menit = MULAI * 60 + persen * RENTANG * 60
    if (menit < MULAI * 60 || menit > SELESAI * 60) return

    // Sebelum 12.00 = PAGI, sesudahnya = SIANG
    const sesi = menit < 12 * 60 ? 'PAGI' : 'SIANG'
    navigate(`/seminar/baru?lokasi=${l.id}&tanggal=${tanggal}&sesi=${sesi}`)
  }

  return (
    <div className="sc">
      {/* ===== Desktop: horizontal ===== */}
      <div className="tlh">
        {/* Garis sekarang */}
        {tampilKini && <div className="nowl" style={{ ['--f' as string]: posisiKini / 100 }} />}

        {/* Pita Header Sesi: PAGI (07-12) dan SIANG (12-16) */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ width: 'var(--lw)', flex: 'none', paddingLeft: 2 }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--p)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Pita Sesi
            </span>
          </div>
          <div className="hr" style={{ height: 'auto', display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--glx)' }}>
            <div
              style={{
                width: `${TITIK_PISAH_12}%`,
                textAlign: 'center',
                background: 'rgba(37, 99, 235, 0.08)',
                padding: '4px 0',
                fontSize: '11px',
                fontWeight: 700,
                color: '#1d4ed8',
                borderRight: '2px solid rgba(37, 99, 235, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>🌅 PAGI (07.00–12.00)</span>
            </div>
            <div
              style={{
                width: `${100 - TITIK_PISAH_12}%`,
                textAlign: 'center',
                background: 'rgba(234, 88, 12, 0.08)',
                padding: '4px 0',
                fontSize: '11px',
                fontWeight: 700,
                color: '#c2410c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>☀️ SIANG (12.00–16.00)</span>
            </div>
          </div>
        </div>

        {/* Sumbu Jam: 07.00 - 16.00 WIB */}
        <div className="hh">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <b style={{ lineHeight: 1.2 }}>Ruang / Lokasi</b>
            <span style={{ fontSize: '10px', color: 'var(--m)', fontWeight: 600, letterSpacing: '-0.2px' }}>07.00 - 16.00 WIB</span>
          </div>
          <div className="hr">
            {/* Garis pembatas 12.00 menembus header */}
            <i
              style={{
                left: `${TITIK_PISAH_12}%`,
                borderLeft: '2px dashed rgba(37, 99, 235, 0.45)',
                zIndex: 1,
              }}
            />
            {jamLabel.map((j) => (
              <span key={j} style={{ left: `${((j - MULAI) / RENTANG) * 100}%` }}>
                {String(j).padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>

        {/* Baris per Lokasi */}
        {lokasi.map((l) => {
          const dotColor = getDotColor(l.key)
          const namaBaris = l.key === 'lainnya' ? 'Lainnya / Luar Gedung' : l.name
          const seminarBaris = seminar.filter((s) => s.locationId === l.id)

          return (
            <div className="hw" key={l.id}>
              <b>
                <span
                  style={{
                    display: 'inline-block',
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: dotColor,
                    marginRight: 8,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${dotColor}66`,
                  }}
                />
                <span>{namaBaris}</span>
              </b>
              <div
                className="hr"
                onClick={(e) => klikSlotKosong(e, l)}
                title={me ? 'Klik slot kosong: sebelum 12.00 pilih PAGI, sesudahnya pilih SIANG' : 'Klik slot kosong untuk masuk dan mengajukan seminar'}
                style={{ cursor: 'pointer' }}
              >
                {/* Garis pembatas jam */}
                {jamLabel.slice(0, -1).map((j) => (
                  <i key={j} style={{ left: `${((j + 1 - MULAI) / RENTANG) * 100}%` }} />
                ))}

                {/* Garis pembatas vertikal tipis di 12.00 yang menembus baris */}
                <i
                  style={{
                    left: `${TITIK_PISAH_12}%`,
                    borderLeft: '2px dashed rgba(37, 99, 235, 0.45)',
                    zIndex: 1,
                  }}
                />

                {seminarBaris.map((s) => blok(s, l))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ===== HP: vertikal (07.00 - 16.00 WIB) ===== */}
      <div className="tlv">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--m)' }}>Jam Kerja: 07.00 – 16.00 WIB</span>
          {tampilKini && (
            <span style={{ fontSize: '11px', color: 'var(--p)', fontWeight: 600 }}>
              Sekarang: {hariIniWIB.toTimeString().slice(0, 5)} WIB
            </span>
          )}
        </div>
        {lokasi.map((l) => {
          const isi = seminar.filter((s) => s.locationId === l.id)
          const dotColor = getDotColor(l.key)
          const namaBaris = l.key === 'lainnya' ? 'Lainnya / Luar Gedung' : l.name

          return (
            <div key={l.id} style={{ marginBottom: 14 }}>
              <b style={{ display: 'flex', alignItems: 'center', margin: '8px 0 6px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: dotColor,
                    marginRight: 8,
                    flexShrink: 0,
                  }}
                />
                {namaBaris}
              </b>
              {isi.length === 0 ? (
                <div
                  onClick={() => me && navigate(`/seminar/baru?lokasi=${l.id}&tanggal=${tanggal}&sesi=PAGI`)}
                  className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 cursor-pointer hover:border-blue-400"
                >
                  Belum ada seminar. Klik untuk ajukan seminar
                </div>
              ) : (
                isi.map((s) => {
                  const namaTempat = s.locationOther?.trim() || l.name
                  const namaSesi = formatNamaSesi(s)
                  return (
                    <button
                      key={s.id}
                      className="btn"
                      style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginBottom: 6, textAlign: 'left', padding: '10px 12px' }}
                      onClick={() => navigate(s.milik ? `/seminar/${s.id}` : `/seminar-publik/${s.id}`)}
                    >
                      <div style={{ overflow: 'hidden', paddingRight: 8 }}>
                        <span style={{ display: 'block', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                        <small className="hint" style={{ display: 'block', marginTop: 2 }}>
                          {namaSesi ? `Sesi ${namaSesi} • ` : ''}📍 {namaTempat}
                        </small>
                      </div>
                      <span className="hint" style={{ whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--p)' }}>
                        {s.startTime}–{s.endTime}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
