import { labelJadwal } from '../lib/sesi'
// Halaman publik presensi peserta /absen/:token — aktif hanya saat seminar BERLANGSUNG.
// Validasi ketat matching email untuk mencegah salah ketik.
import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { get, post } from '../lib/api'
import { Loading, ErrorBox, fmtTanggal } from '../components/ui'
import { Logo } from '../components/Logo'

interface Info {
  seminar: {
    id: string
    title: string
    status: string
    date: string
    startTime: string
    endTime: string
    sesi?: string | null
    location: { name: string }
    locationOther?: string | null
  }
  bisaAbsen: boolean
}

export default function Absensi() {
  const { token } = useParams()
  const [info, setInfo] = useState<Info | null>(null)
  const [galat, setGalat] = useState('')
  const [sukses, setSukses] = useState<{ nama: string; email: string } | null>(null)
  const [proses, setProses] = useState(false)

  // State form presensi yang disederhanakan
  const [f, setF] = useState({
    nama_lengkap: '',
    email: '',
    ketik_ulang_email: '',
    instansi: '',
    status_peserta: 'Umum' as 'Pegawai BMKG' | 'Mahasiswa' | 'Umum' | '',
  })
  const [setuju, setSetuju] = useState(true)

  useEffect(() => {
    get<Info>(`/api/absensi/t/${token}`)
      .then(setInfo)
      .catch((e) => setGalat(e instanceof Error ? e.message : 'Gagal memuat halaman presensi'))
  }, [token])

  // Validasi kecocokan email secara real-time
  const emailTerisi = f.email.trim().length > 0
  const retypeTerisi = f.ketik_ulang_email.trim().length > 0
  const emailCocok = emailTerisi && retypeTerisi && f.email.trim().toLowerCase() === f.ketik_ulang_email.trim().toLowerCase()
  const emailBeda = emailTerisi && retypeTerisi && !emailCocok

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setGalat('')

    if (f.email.trim().toLowerCase() !== f.ketik_ulang_email.trim().toLowerCase()) {
      setGalat('Alamat email dan konfirmasi email tidak sama. Harap periksa kembali penulisan email Anda.')
      return
    }

    setProses(true)
    try {
      const res = await post<{ ok: boolean; nama: string; email: string }>(`/api/absensi/t/${token}`, {
        nama_lengkap: f.nama_lengkap.trim(),
        email: f.email.trim().toLowerCase(),
        ketik_ulang_email: f.ketik_ulang_email.trim().toLowerCase(),
        instansi: f.instansi.trim() || undefined,
        status_peserta: f.status_peserta || undefined,
        setuju,
      })
      setSukses({ nama: res.nama, email: res.email })
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Gagal mengirim presensi')
    } finally {
      setProses(false)
    }
  }

  if (galat && !info) {
    return (
      <div className="ph">
        <div className="card" style={{ textAlign: 'center', maxWidth: 500, margin: '40px auto' }}>
          <Logo height={54} />
          <div style={{ marginTop: 16 }}>
            <ErrorBox message={galat} />
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            Pastikan tautan presensi yang Anda akses sudah benar atau hubungi panitia seminar di ruangan.
          </p>
        </div>
      </div>
    )
  }

  if (!info) return <Loading />
  const { seminar, bisaAbsen } = info
  const namaLokasi = seminar.locationOther ?? seminar.location.name

  return (
    <div className="ph" style={{ padding: '24px 12px' }}>
      <div className="card" style={{ maxWidth: 540, margin: '0 auto', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        {/* Header Identitas BMKG */}
        <div style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--bd)' }}>
          <Logo height={52} />
          <h2 style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: 'var(--t)' }}>Presensi Seminar Ilmiah</h2>
          <p className="hint" style={{ fontSize: 12, marginTop: 4 }}>
            Sistem Informasi Seminar Ilmiah BMKG (SINAR)
          </p>
        </div>

        {/* Info Seminar */}
        <div style={{ marginBottom: 20, padding: 14, borderRadius: 12, background: 'var(--c)', border: '1px solid var(--bd)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--m)' }}>
            Kegiatan Seminar:
          </span>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '4px 0 8px 0', color: 'var(--t)' }}>
            {seminar.title}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--m)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📅</span>
              <span>{fmtTanggal(seminar.date, true)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⏰</span>
              <span>
                {labelJadwal(seminar.startTime, seminar.endTime)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📍</span>
              <span>{namaLokasi}</span>
            </div>
          </div>
        </div>

        {/* Kondisi Jika Belum Dibuka atau Sudah Selesai */}
        {!bisaAbsen ? (
          <div
            className={`ind ${seminar.status === 'SELESAI' ? 'no' : 'ok'}`}
            role="alert"
            style={{ marginTop: 12, textAlign: 'center', padding: 18 }}
          >
            {seminar.status === 'SELESAI' ? (
              <>
                <b style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>Presensi Sudah Ditutup</b>
                <span>Seminar telah selesai dilaksanakan. Akses pengisian presensi ditutup oleh penyelenggara.</span>
              </>
            ) : (
              <>
                <b style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>Presensi Belum Dibuka</b>
                <span>
                  Sesi presensi belum dimulai oleh host. Halaman ini akan otomatis aktif setelah host menekan tombol <strong>'Mulai Seminar'</strong>.
                </span>
                <button
                  type="button"
                  className="btn sm pr"
                  style={{ marginTop: 12 }}
                  onClick={() => window.location.reload()}
                >
                  🔄 Refresh Halaman
                </button>
              </>
            )}
          </div>
        ) : sukses ? (
          /* Kondisi Sukses Mengisi Presensi */
          <div style={{ textAlign: 'center', padding: '24px 12px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 16px auto',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
              }}
            >
              ✓
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#16a34a', marginBottom: 8 }}>
              Kehadiran Berhasil Dicatat!
            </h3>
            <p style={{ fontSize: 14, color: 'var(--t)', marginBottom: 8 }}>
              Terima kasih, <strong>{sukses.nama}</strong>.
            </p>
            <p className="hint" style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 440, margin: '0 auto' }}>
              Data presensi Anda telah tersimpan ke sistem. Dokumen e-sertifikat akan dikirimkan secara otomatis ke alamat email:
              <br />
              <strong style={{ color: 'var(--p)', fontSize: 14 }}>{sukses.email}</strong>
            </p>
          </div>
        ) : (
          /* Form Presensi Aktif */
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Field Wajib: Nama Lengkap */}
            <div>
              <label htmlFor="ab-nama" style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                Nama Lengkap &amp; Gelar *
              </label>
              <input
                id="ab-nama"
                type="text"
                value={f.nama_lengkap}
                onChange={(e) => setF({ ...f, nama_lengkap: e.target.value })}
                required
                minLength={3}
                placeholder="contoh: Dr. Ahmad Fauzi, M.Si."
                autoComplete="name"
                style={{ width: '100%' }}
              />
              <span className="hint" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                Nama ini akan dicetak langsung pada sertifikat seminar Anda.
              </span>
            </div>

            {/* Field Wajib: Email */}
            <div>
              <label htmlFor="ab-email" style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                Alamat Email Aktif *
              </label>
              <input
                id="ab-email"
                type="email"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
                required
                placeholder="contoh: nama@domain.com"
                autoComplete="email"
                style={{ width: '100%' }}
              />
              <span className="hint" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                Sertifikat seminar dan materi presentasi akan dikirimkan ke email ini.
              </span>
            </div>

            {/* Field Wajib: Ketik Ulang Email (Konfirmasi Re-Type) */}
            <div>
              <label
                htmlFor="ab-reemail"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 600,
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                <span>Ketik Ulang Email (Konfirmasi) *</span>
                {emailCocok && (
                  <span style={{ color: '#16a34a', fontSize: 11, fontWeight: 700 }}>
                    ✓ Email Cocok
                  </span>
                )}
              </label>
              <input
                id="ab-reemail"
                type="email"
                value={f.ketik_ulang_email}
                onChange={(e) => setF({ ...f, ketik_ulang_email: e.target.value })}
                required
                placeholder="Ketik ulang alamat email Anda"
                style={{
                  width: '100%',
                  borderColor: emailBeda ? '#ef4444' : emailCocok ? '#22c55e' : undefined,
                }}
              />
              {emailBeda && (
                <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 600, marginTop: 3 }}>
                  ⚠ Alamat email tidak cocok. Pastikan tidak ada salah ketik agar sertifikat tidak salah kirim!
                </p>
              )}
              {!retypeTerisi && (
                <span className="hint" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                  Fitur verifikasi ganda untuk mencegah salah ketik email.
                </span>
              )}
            </div>

            {/* Field Opsional: Asal Instansi */}
            <div>
              <label htmlFor="ab-instansi" style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                Asal Instansi / Unit Kerja <span className="hint">(Opsional)</span>
              </label>
              <input
                id="ab-instansi"
                type="text"
                value={f.instansi}
                onChange={(e) => setF({ ...f, instansi: e.target.value })}
                placeholder="contoh: BMKG Pusat, Stasiun Geofisika, Univ. Indonesia, dsb."
                style={{ width: '100%' }}
              />
            </div>

            {/* Field Opsional: Status Peserta */}
            <div>
              <label htmlFor="ab-status" style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                Status Peserta <span className="hint">(Opsional)</span>
              </label>
              <select
                id="ab-status"
                value={f.status_peserta}
                onChange={(e) => setF({ ...f, status_peserta: e.target.value as any })}
                style={{ width: '100%' }}
              >
                <option value="Umum">Umum</option>
                <option value="Pegawai BMKG">Pegawai BMKG</option>
                <option value="Mahasiswa">Mahasiswa</option>
              </select>
            </div>

            {/* Persetujuan Data Pribadi */}
            <div className="rm" style={{ marginTop: 4 }}>
              <input
                id="ab-setuju"
                type="checkbox"
                checked={setuju}
                onChange={(e) => setSetuju(e.target.checked)}
                required
              />
              <label htmlFor="ab-setuju" style={{ margin: 0, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                Saya menyatakan data yang saya masukkan adalah benar untuk kebutuhan absensi dan penerbitan e-sertifikat.
              </label>
            </div>

            {/* Pesan Kesalahan */}
            {galat && (
              <p className="err" role="alert" style={{ margin: '4px 0 0 0' }}>
                {galat}
              </p>
            )}

            {/* Tombol Kirim */}
            <button
              type="submit"
              className="btn pr"
              disabled={proses || emailBeda}
              style={{ width: '100%', marginTop: 8, padding: 12, fontSize: 14, fontWeight: 700 }}
            >
              {proses ? 'Mengirim Presensi…' : 'Kirim Presensi Kehadiran'}
            </button>
          </form>
        )}

        <p className="hint" style={{ marginTop: 16, textAlign: 'center', fontSize: 11 }}>
          Satu alamat email hanya dapat mengisi presensi satu kali untuk setiap seminar.
        </p>
      </div>
    </div>
  )
}
