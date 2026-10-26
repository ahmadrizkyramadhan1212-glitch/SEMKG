import { labelJadwal } from '../../lib/sesi'
// Halaman admin: Dashboard — statistik, perlu tindakan, aktivitas terbaru, seminar mendatang.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../lib/api'
import { Loading, ErrorBox, fmtTanggalPendek } from '../../components/ui'
import type { Seminar } from '../../lib/types'

interface Dash {
  menunggu: number
  totalSeminar: number
  totalUser: number
  totalPeserta: number
  suratBelum: number
  seminarMendatang: (Seminar & { user?: { name: string } })[]
  aktivitas: { id: string; action: string; target: string; createdAt: string; user: { name: string } | null }[]
}

export default function Dashboard() {
  const [d, setD] = useState<Dash | null>(null)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    get<Dash>('/api/admin/dashboard').then(setD).catch((e) => setGalat(e instanceof Error ? e.message : 'Gagal memuat dashboard'))
  }, [])

  if (galat) return <ErrorBox message={galat} />
  if (!d) return <Loading />

  return (
    <>
      <div className="top">
        <div>
          <h1>Dashboard</h1>
          <p>Ringkasan aktivitas seminar unit kerja.</p>
        </div>
      </div>
      <div className="g4">
        <div className="card st">
          <b>{d.menunggu}</b>
          <span>Pengajuan menunggu verifikasi</span>
          {d.menunggu > 0 && (
            <p style={{ marginTop: 8 }}>
              <Link className="btn sm pr" to="/admin/verifikasi">Verifikasi sekarang</Link>
            </p>
          )}
        </div>
        <div className="card st"><b>{d.totalSeminar}</b><span>Total seminar</span></div>
        <div className="card st"><b>{d.totalUser}</b><span>Akun aktif</span></div>
        <div className="card st"><b>{d.totalPeserta}</b><span>Peserta tercatat</span></div>
      </div>
      <div className="cols">
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <h3 style={{ marginBottom: 8 }}>Perlu tindakan</h3>
            <ul style={{ paddingLeft: 18, display: 'grid', gap: 6 }}>
              <li>
                {d.menunggu > 0 ? (
                  <><b className="bd Dikembalikan">{d.menunggu} pengajuan</b> menunggu verifikasi — <Link to="/admin/verifikasi">buka Verifikasi Seminar</Link></>
                ) : (
                  'Tidak ada pengajuan yang menunggu. ✓'
                )}
              </li>
              <li>
                {d.suratBelum > 0 ? (
                  <><b className="bd Menunggu">{d.suratBelum} surat asli</b> belum diterima untuk seminar terjadwal.</>
                ) : (
                  'Semua surat asli seminar terjadwal sudah diterima. ✓'
                )}
              </li>
              <li>Info ruang: Gedung Auditorium (kapasitas 1.200 orang).</li>
            </ul>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 8 }}>Seminar mendatang</h3>
            {d.seminarMendatang.length === 0 ? (
              <p className="hint">Belum ada seminar terjadwal ke depan.</p>
            ) : (
              d.seminarMendatang.map((s) => (
                <p key={s.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--bd)' }}>
                  <b>{s.title}</b>
                  <br />
                  <span className="hint">
                    {fmtTanggalPendek(s.date)} · {labelJadwal(s.startTime, s.endTime)} · {s.locationOther ?? s.location.name} · {s.user?.name}
                  </span>
                </p>
              ))
            )}
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 8 }}>Aktivitas terbaru</h3>
          {d.aktivitas.map((a) => (
            <p key={a.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--bd)', fontSize: 13 }}>
              <b>{a.user?.name ?? 'Sistem'}</b> — {a.action.replaceAll('_', ' ').toLowerCase()}{' '}
              <span className="hint">{a.target}</span>
              <br />
              <span className="hint">{new Date(a.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</span>
            </p>
          ))}
        </div>
      </div>
    </>
  )
}
