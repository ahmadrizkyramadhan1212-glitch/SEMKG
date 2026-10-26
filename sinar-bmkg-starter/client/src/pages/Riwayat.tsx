import { labelJadwal } from '../lib/sesi'
// Riwayat Seminar publik: daftar SELESAI dan DIBATALKAN dengan lencana status.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../lib/api'
import { Loading, Empty, ErrorBox, Badge, fmtTanggal } from '../components/ui'
import type { Seminar } from '../lib/types'

interface ItemRiwayat extends Seminar {
  _count?: { materials: number; attendances: number }
  news?: { id: string; title: string; photos?: { id: string }[] } | null
}

interface Halaman {
  data: ItemRiwayat[]
  total: number
  halaman: number
  totalHalaman: number
}

export default function Riwayat() {
  const [h, setH] = useState<Halaman | null>(null)
  const [galat, setGalat] = useState('')
  const [halaman, setHalaman] = useState(1)

  useEffect(() => {
    setH(null)
    get<Halaman>(`/api/publik/riwayat?halaman=${halaman}`).then(setH).catch((e) => setGalat(e instanceof Error ? e.message : 'Gagal memuat riwayat'))
  }, [halaman])

  return (
    <main>
      <div className="top">
        <div>
          <h1 style={{ margin: '6px 0 4px' }}>Riwayat Seminar</h1>
          <p className="hint">Arsip seminar ilmiah BMKG yang telah selesai. Materi presentasi dan berita dokumentasi dapat diakses secara terbuka.</p>
        </div>
      </div>
      <div className="card">
        {galat && <ErrorBox message={galat} onCobaLagi={() => setHalaman(1)} />}
        {!galat && !h && <Loading />}
        {!galat && h?.data.length === 0 && <Empty title="Belum ada riwayat" hint="Seminar yang selesai atau dibatalkan akan tampil di sini." />}
        {h && h.data.length > 0 && (
          <div className="sc">
            <table>
              <thead>
                <tr>
                  <th>Tanggal & Waktu</th>
                  <th>Judul Seminar</th>
                  <th>Ruang / Lokasi</th>
                  <th>Kelengkapan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {h.data.map((s) => {
                  const namaLokasi = s.locationOther?.trim() || s.location.name
                  const jumlahMateri = s._count?.materials ?? 0
                  const adaBerita = Boolean(s.news)

                  return (
                    <tr key={s.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <b>{fmtTanggal(s.date)}</b>
                        <br />
                        <span className="hint">{labelJadwal(s.startTime, s.endTime)}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {s.news?.photos?.[0]?.id ? (
                            <img
                              src={`/api/publik/foto/${s.news.photos[0].id}`}
                              alt={s.title}
                              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--bd)' }}
                              loading="lazy"
                            />
                          ) : null}
                          <div style={{ minWidth: 0 }}>
                            <Link to={`/seminar-publik/${s.id}`} style={{ fontWeight: 600, color: 'var(--p)' }}>
                              {s.title}
                            </Link>
                            {s.topic && <p className="hint" style={{ margin: '2px 0 0', fontSize: 12 }}>Topik: {s.topic}</p>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{namaLokasi}</span>
                        {s.location.key === 'lainnya' && s.locationOther && (
                          <span className="hint" style={{ display: 'block', fontSize: 11 }}>(Luar Gedung)</span>
                        )}
                      </td>
                      <td>
                        {s.status === 'SELESAI' ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {jumlahMateri > 0 ? (
                              <span className="bd Berlangsung" style={{ fontSize: 11 }}>
                                {jumlahMateri} Materi
                              </span>
                            ) : (
                              <span className="hint" style={{ fontSize: 11 }}>Materi -</span>
                            )}
                            {adaBerita && (
                              <span className="bd Selesai" style={{ fontSize: 11 }}>
                                Berita
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="hint">-</span>
                        )}
                      </td>
                      <td>
                        <Badge status={s.status} />
                      </td>
                      <td>
                        <Link to={`/seminar-publik/${s.id}`} className="btn sm">
                          {s.status === 'SELESAI' ? 'Buka Berita & Materi ↗' : 'Detail'}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {h && h.totalHalaman > 1 && (
          <div className="dn" style={{ marginTop: 12, justifyContent: 'center' }}>
            <button className="btn sm" disabled={halaman <= 1} onClick={() => setHalaman((p) => p - 1)}>
              ‹ Sebelumnya
            </button>
            <span className="hint">
              Halaman {h.halaman} dari {h.totalHalaman}
            </span>
            <button className="btn sm" disabled={halaman >= h.totalHalaman} onClick={() => setHalaman((p) => p + 1)}>
              Berikutnya ›
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
