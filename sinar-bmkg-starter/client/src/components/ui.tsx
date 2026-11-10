// Kondisi memuat / kosong / galat yang dipakai semua daftar dan form.
export function Loading({ text = 'Memuat…' }: { text?: string }) {
  return (
    <div className="center" role="status">
      <span className="spin" aria-hidden="true" /> <span style={{ marginLeft: 10 }}>{text}</span>
    </div>
  )
}

export function Empty({ title = 'Belum ada data', hint }: { title?: string; hint?: string }) {
  return (
    <div className="empty">
      <b>{title}</b>
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function ErrorBox({ message, onCobaLagi }: { message: string; onCobaLagi?: () => void }) {
  return (
    <div className="ind no" role="alert">
      {message}
      {onCobaLagi && (
        <div style={{ marginTop: 8 }}>
          <button className="btn sm" onClick={onCobaLagi}>
            Coba lagi
          </button>
        </div>
      )}
    </div>
  )
}

export function Badge({ status }: { status: string }) {
  const label: Record<string, string> = {
    MENUNGGU_VERIFIKASI: 'Menunggu verifikasi',
    DIKEMBALIKAN: 'Ditolak',
    DIJADWALKAN: 'Dijadwalkan',
    BERLANGSUNG: 'Berlangsung',
    SELESAI: 'Selesai',
    DIBATALKAN: 'Dibatalkan',
    TERKIRIM: 'Terkirim',
    GAGAL: 'Gagal',
    MENUNGGU: 'Menunggu',
  }
  return <span className={`bd ${status}`}>{label[status] ?? status}</span>
}

// Tanggal WIB: "Senin, 12 Mei 2026"
export function fmtTanggal(d: Date | string, panjang = false): string {
  const date = typeof d === 'string' ? new Date(`${d.slice(0, 10)}T00:00:00+07:00`) : d
  return date.toLocaleDateString('id-ID', {
    weekday: panjang ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

export function fmtTanggalPendek(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(`${d.slice(0, 10)}T00:00:00+07:00`) : d
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })
}
