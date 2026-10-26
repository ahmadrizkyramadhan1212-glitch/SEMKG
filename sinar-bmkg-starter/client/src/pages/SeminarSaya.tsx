import { labelJadwal } from '../lib/sesi'
// Halaman: Seminar Saya — daftar, cari, filter status, lencana merah untuk yang dikembalikan.
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get } from '../lib/api'
import { Loading, Empty, ErrorBox, Badge, fmtTanggalPendek } from '../components/ui'
import type { Seminar } from '../lib/types'

const STATUS_FILTER = [
  ['', 'Semua status'],
  ['MENUNGGU_VERIFIKASI', 'Menunggu verifikasi'],
  ['DIKEMBALIKAN', 'Ditolak (Perlu Revisi)'],
  ['DIJADWALKAN', 'Dijadwalkan'],
  ['BERLANGSUNG', 'Berlangsung'],
  ['SELESAI', 'Selesai'],
  ['DIBATALKAN', 'Dibatalkan'],
]

export default function SeminarSaya() {
  const [data, setData] = useState<Seminar[] | null>(null)
  const [galat, setGalat] = useState('')
  const [cari, setCari] = useState('')
  const [status, setStatus] = useState('')
  const [urut, setUrut] = useState<'baru' | 'jadwal'>('baru')
  const navigate = useNavigate()

  const muat = useCallback(async () => {
    setGalat('')
    try {
      const q = new URLSearchParams({ ...(cari && { cari }), ...(status && { status }), urut })
      setData(await get<Seminar[]>(`/api/seminars/mine?${q}`))
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal memuat seminar')
    }
  }, [cari, status, urut])

  useEffect(() => {
    void muat()
  }, [muat])

  return (
    <>
      <div className="top">
        <div>
          <h1 className="dn">
            Seminar Saya
            {data?.some((s) => s.status === 'DIKEMBALIKAN') && <span className="bgred bd Dikembalikan" style={{ marginLeft: 10 }}>Ada ditolak (Perlu Revisi)</span>}
          </h1>
          <p>Semua pengajuan seminar Anda beserta statusnya.</p>
        </div>
        <button className="btn pr" onClick={() => navigate('/seminar/baru')}>
          + Buat Seminar
        </button>
      </div>
      <div className="card">
        <div className="dn" style={{ marginBottom: 12, gap: 10 }}>
          <input
            style={{ maxWidth: 260 }}
            className="bg-white dark:bg-[#132238] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Cari judul, topik, atau kode…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            aria-label="Cari seminar"
          />
          <select
            style={{ maxWidth: 210 }}
            className="bg-white dark:bg-[#132238] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm z-10"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter status"
          >
            {STATUS_FILTER.map(([v, l]) => (
              <option key={v} value={v} className="bg-white dark:bg-[#0b172a] text-slate-800 dark:text-slate-100 py-1">
                {l}
              </option>
            ))}
          </select>
          <select
            style={{ maxWidth: 240 }}
            className="bg-white dark:bg-[#132238] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm z-10"
            value={urut}
            onChange={(e) => setUrut(e.target.value as any)}
            aria-label="Urutan seminar"
          >
            <option value="baru" className="bg-white dark:bg-[#0b172a] text-slate-800 dark:text-slate-100 py-1">Urutkan: Baru Diajukan (Teratas)</option>
            <option value="jadwal" className="bg-white dark:bg-[#0b172a] text-slate-800 dark:text-slate-100 py-1">Urutkan: Jadwal Seminar</option>
          </select>
        </div>
        {galat && <ErrorBox message={galat} onCobaLagi={muat} />}
        {!galat && data === null && <Loading />}
        {!galat && data?.length === 0 && <Empty title="Belum ada seminar" hint="Tekan tombol + Buat Seminar untuk mengajukan yang pertama." />}
        {data && data.length > 0 && (
          <div className="sc">
            <table>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Judul</th>
                  <th>Jadwal</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/seminar/${s.id}`)}>
                    <td>
                      <strong>{s.code}</strong>
                    </td>
                    <td>
                      <Link to={`/seminar/${s.id}`} onClick={(e) => e.stopPropagation()}>
                        {s.title}
                      </Link>
                      {s.status === 'DIKEMBALIKAN' && s.returnReason && (
                        <>
                          <br />
                          <span className="hint">Alasan penolakan: {s.returnReason}</span>
                        </>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {fmtTanggalPendek(s.date)}
                      <br />
                      <span className="hint">
                        {labelJadwal(s.startTime, s.endTime)}
                      </span>
                    </td>
                    <td>{s.locationOther ?? s.location.name}</td>
                    <td>
                      <Badge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
