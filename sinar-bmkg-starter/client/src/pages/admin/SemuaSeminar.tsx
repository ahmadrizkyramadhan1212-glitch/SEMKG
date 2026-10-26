import { labelJadwal } from '../../lib/sesi'
// Halaman admin: Semua Seminar — cari, filter status, Batalkan, Hapus permanen, tandai surat asli.
import { useCallback, useEffect, useState } from 'react'
import { get, post, del } from '../../lib/api'
import { Loading, Empty, ErrorBox, Badge, fmtTanggalPendek } from '../../components/ui'
import type { Seminar } from '../../lib/types'

const STATUS = [
  ['', 'Semua status'],
  ['MENUNGGU_VERIFIKASI', 'Menunggu verifikasi'],
  ['DIKEMBALIKAN', 'Dikembalikan'],
  ['DIJADWALKAN', 'Dijadwalkan'],
  ['BERLANGSUNG', 'Berlangsung'],
  ['SELESAI', 'Selesai'],
  ['DIBATALKAN', 'Dibatalkan'],
]

export default function SemuaSeminar() {
  const [data, setData] = useState<(Seminar & { user: { name: string } })[] | null>(null)
  const [galat, setGalat] = useState('')
  const [cari, setCari] = useState('')
  const [status, setStatus] = useState('')

  const muat = useCallback(async () => {
    setGalat('')
    try {
      const q = new URLSearchParams({ ...(cari && { cari }), ...(status && { status }) })
      setData(await get(`/api/admin/seminars?${q}`))
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal memuat seminar')
    }
  }, [cari, status])

  useEffect(() => {
    void muat()
  }, [muat])

  const batalkan = async (s: Seminar) => {
    const alasan = prompt(`Batalkan "${s.title}"? Alasan (opsional, dikirim ke pemilik):`) ?? undefined
    if (alasan === null) return
    try {
      await post(`/api/admin/seminars/${s.id}/batalkan`, { alasan })
      void muat()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal membatalkan')
    }
  }

  const hapus = async (s: Seminar) => {
    if (!confirm(`HAPUS PERMANEN "${s.title}" (${s.code})? Tindakan ini tidak dapat dibatalkan.`)) return
    if (prompt('Ketik HAPUS untuk konfirmasi:') !== 'HAPUS') return alert('Penghapusan dibatalkan')
    try {
      await del(`/api/admin/seminars/${s.id}`)
      void muat()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menghapus')
    }
  }

  const tandaiSurat = async (s: Seminar) => {
    try {
      await post(`/api/admin/seminars/${s.id}/surat-diterima`)
      void muat()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menandai')
    }
  }

  return (
    <>
      <div className="top">
        <div>
          <h1>Semua Seminar</h1>
          <p>Semua seminar dari seluruh pengguna.</p>
        </div>
      </div>
      <div className="card">
        <div className="dn" style={{ marginBottom: 10 }}>
          <input style={{ maxWidth: 280 }} placeholder="Cari judul, kode, atau pemilik…" value={cari} onChange={(e) => setCari(e.target.value)} aria-label="Cari seminar" />
          <select style={{ maxWidth: 200 }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
            {STATUS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        {galat && <ErrorBox message={galat} onCobaLagi={muat} />}
        {!galat && data === null && <Loading />}
        {!galat && data?.length === 0 && <Empty title="Tidak ada seminar" hint="Coba ubah pencarian atau filter." />}
        {data && data.length > 0 && (
          <div className="sc">
            <table>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Judul</th>
                  <th>Pemilik</th>
                  <th>Jadwal</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.code}</strong></td>
                    <td>{s.title}</td>
                    <td>{s.user.name}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {fmtTanggalPendek(s.date)}
                      <br />
                      <span className="hint">{labelJadwal(s.startTime, s.endTime)}</span>
                    </td>
                    <td>{s.locationOther ?? s.location.name}</td>
                    <td>
                      <Badge status={s.status} />
                      {s.status === 'DIJADWALKAN' && !s.letterReceived && (
                        <>
                          <br />
                          <span className="hint">Surat asli belum diterima</span>
                        </>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {s.status === 'DIJADWALKAN' && !s.letterReceived && (
                          <button className="btn sm" onClick={() => tandaiSurat(s)}>Surat diterima</button>
                        )}
                        {s.status !== 'SELESAI' && s.status !== 'DIBATALKAN' && (
                          <button className="btn sm" onClick={() => batalkan(s)}>Batalkan</button>
                        )}
                        <button className="btn sm dgr" onClick={() => hapus(s)}>Hapus</button>
                      </div>
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
