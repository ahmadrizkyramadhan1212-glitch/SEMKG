import { labelJadwal } from '../lib/sesi'
// Detail seminar publik: format berita BMKG dengan 1 foto besar hero + info seminar + unduh materi.
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get } from '../lib/api'
import { Loading, ErrorBox, Badge, fmtTanggal } from '../components/ui'
import { Galeri } from '../components/BeritaTab'
import type { Seminar } from '../lib/types'

interface Publik extends Omit<Seminar, 'user'> {
  milik: boolean
  user?: { name: string; unit: string | null }
  berita: {
    id: string
    title: string
    body: string
    publishedAt: string
    author?: { name: string; unit: string | null }
    photos: { id: string; caption?: string | null }[]
  } | null
  materi: { id: string; presenter: string; originalName: string | null; driveUrl: string | null; sizeBytes: number | null }[]
}

export default function SeminarPublik() {
  const { id } = useParams()
  const [s, setS] = useState<Publik | null>(null)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    get<Publik>(`/api/publik/seminar/${id}`)
      .then(setS)
      .catch((e) => setGalat(e instanceof Error ? e.message : 'Gagal memuat seminar'))
  }, [id])

  if (galat) return <ErrorBox message={galat} />
  if (!s) return <Loading />

  const judulBerita = s.berita?.title || s.title
  const penulis = s.berita?.author?.name || s.user?.name || 'Humas BMKG'
  const unitPenulis = s.berita?.author?.unit || s.user?.unit
  const tanggalTayang = s.berita?.publishedAt || s.date
  const namaLokasi = s.locationOther?.trim() || s.location.name
  const fotoUtama = s.berita?.photos && s.berita.photos.length > 0 ? s.berita.photos[0] : null
  const fotoLainnya = s.berita?.photos && s.berita.photos.length > 1 ? s.berita.photos.slice(1) : []

  return (
    <main className="news-article-wrap">
      {/* Tombol Kembali ke Riwayat */}
      <Link to="/riwayat" className="news-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>Kembali ke Riwayat Seminar</span>
      </Link>

      <article className="card" style={{ padding: '28px 32px' }}>
        {/* Judul Berita Besar */}
        <h1 className="news-title">{judulBerita}</h1>

        {/* Metadata Penulis & Tanggal (Format BMKG) */}
        <div className="news-meta">
          <span>{fmtTanggal(tanggalTayang, true)}</span>
          <span>•</span>
          <span>
            {penulis}
            {unitPenulis ? ` — ${unitPenulis}` : ''}
          </span>
          <span style={{ marginLeft: 'auto' }}>
            <Badge status={s.status} />
          </span>
        </div>

        {/* Foto Dokumentasi Utama (1 Foto Dipajang Besar) */}
        {fotoUtama ? (
          <div className="news-hero-container">
            <img
              src={`/api/publik/foto/${fotoUtama.id}`}
              alt={judulBerita}
              className="news-hero-img"
            />
          </div>
        ) : (
          <div
            className="news-hero-container"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #0b3c8c 0%, #1a56b0 100%)',
              color: '#ffffff',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.9 }}>🏛️</div>
            <h3 style={{ margin: '0 0 6px', color: '#fff' }}>Dokumentasi Seminar Ilmiah BMKG</h3>
            <p style={{ margin: 0, opacity: 0.85, fontSize: 13 }}>{s.title}</p>
          </div>
        )}

        {/* Isi Berita / Narasi Dokumentasi */}
        {s.berita ? (
          <div className="news-body">
            {s.berita.body
              .split('\n')
              .filter((p) => p.trim().length > 0)
              .map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
          </div>
        ) : (
          <div className="news-body" style={{ color: 'var(--m)', fontStyle: 'italic', marginBottom: 20 }}>
            <p>Penyelenggara belum menerbitkan narasi dokumentasi berita untuk kegiatan ini.</p>
          </div>
        )}

        {/* Foto Dokumentasi Tambahan (Jika Lebih dari 1 Foto) */}
        {fotoLainnya.length > 0 && (
          <div style={{ marginTop: 24, marginBottom: 28 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--m)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Foto Dokumentasi Kegiatan Lainnya
            </h4>
            <Galeri foto={fotoLainnya.map((p) => p.id)} />
          </div>
        )}

        {/* Kotak Ringkasan Informasi Seminar */}
        <div className="news-info-card">
          <div className="news-info-item">
            <dt>Waktu & Tanggal</dt>
            <dd>
              {fmtTanggal(s.date, true)}
              <br />
              <span className="hint" style={{ fontSize: 12 }}>{labelJadwal(s.startTime, s.endTime)}</span>
            </dd>
          </div>
          <div className="news-info-item">
            <dt>Ruang / Tempat</dt>
            <dd>{namaLokasi}</dd>
          </div>
          <div className="news-info-item">
            <dt>Kode Seminar</dt>
            <dd style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>{s.code}</dd>
          </div>
          {s.topic && (
            <div className="news-info-item">
              <dt>Topik</dt>
              <dd>{s.topic}</dd>
            </div>
          )}
        </div>

        {/* Seksi Materi Presentasi Seminar */}
        <section style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 17 }}>Materi Presentasi Seminar</h3>
            <span className="hint" style={{ fontSize: 12 }}>
              {s.materi.length > 0 ? `${s.materi.length} berkas materi tersedia` : 'Belum ada materi'}
            </span>
          </div>

          {s.materi.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', background: 'rgba(11,60,140,0.03)', border: '1px dashed var(--bd)', borderRadius: 10, color: 'var(--m)', fontSize: 13 }}>
              Belum ada materi paparan yang diunggah untuk seminar ini.
            </div>
          ) : (
            <div className="materi-card-list">
              {s.materi.map((m) => (
                <div key={m.id} className="materi-card">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.originalName || 'Materi Paparan Seminar'}
                    </div>
                    <div className="hint" style={{ fontSize: 11.5, marginTop: 2 }}>
                      Pemateri: <strong>{m.presenter}</strong>
                    </div>
                  </div>
                  <div>
                    {m.driveUrl ? (
                      <a
                        href={m.driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn sm pr"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <span>Drive</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ) : !m.originalName ? (
                      <span className="hint text-[11px] italic px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        🔒 Materi Drive dikirim via email sertifikat peserta
                      </span>
                    ) : (
                      <a
                        href={`/api/publik/materi/${m.id}`}
                        className="btn sm pr"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <span>Unduh</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Seksi Sertifikat & Keaslian */}
        <section
          style={{
            marginTop: 26,
            padding: '16px 20px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(11,60,140,0.06), rgba(46,158,79,0.06))',
            border: '1px solid var(--bd)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <strong style={{ fontSize: 13.5, color: 'var(--t)', display: 'block' }}>
              Keaslian Sertifikat Seminar
            </strong>
            <span className="hint" style={{ fontSize: 12 }}>
              Peserta terdaftar dapat memeriksa status atau keabsahan nomor seri sertifikat seminar ini.
            </span>
          </div>
          <Link to="/verifikasi" className="btn sm" style={{ textDecoration: 'none' }}>
            Verifikasi Sertifikat ↗
          </Link>
        </section>

        {s.milik && (
          <p className="hint" style={{ marginTop: 20, textAlign: 'center' }}>
            Ini seminar milik Anda —{' '}
            <Link to={`/seminar/${s.id}`} style={{ fontWeight: 600 }}>
              buka panel kelola seminar
            </Link>
            .
          </p>
        )}
      </article>
    </main>
  )
}
