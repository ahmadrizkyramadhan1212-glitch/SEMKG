import React from 'react'
import './HeroPanel.css'

export interface HeroPanelProps {
  className?: string
  isDark?: boolean
  onJadwalClick?: () => void
  onAjukanClick?: () => void
  onPresensiClick?: () => void
}

/**
 * Komponen UI Hero Panel SEMINAR BMKG (5 dari 5)
 * Dibuat 100% murni menggunakan HTML, CSS, dan Inline SVG (TANPA FILE GAMBAR EKSTERNAL).
 * Mendukung penuh Mode Gelap (Dark Mode) & Mode Terang (Light Mode).
 */
export const HeroPanel: React.FC<HeroPanelProps> = ({
  className = '',
  isDark,
  onJadwalClick,
  onAjukanClick,
  onPresensiClick,
}) => {
  const themeClass = isDark !== undefined ? (isDark ? 'dark' : 'light') : ''

  return (
    <aside
      className={`hero-panel-container ${themeClass} ${className}`.trim()}
      aria-label="Panel Pengantar Seminar Ilmiah BMKG"
    >
      {/* 1. Efek Bokeh / Lens Flare Bulat (Murni CSS Radial Gradient + Blur) */}
      <div className="hero-flare hero-flare-top-left" aria-hidden="true" />
      <div className="hero-flare hero-flare-bottom-right" aria-hidden="true" />
      <div className="hero-flare hero-flare-center-amber" aria-hidden="true" />

      {/* Grid Overlay Halus */}
      <div className="hero-grid-pattern" aria-hidden="true" />

      {/* Konten Utama Terpusat */}
      <div className="hero-content-wrapper">
        {/* 2. Card Logo "SEMINAR BMKG" (Card Putih Terang dengan Shadow Lembut & Inline SVG) */}
        <div className="hero-logo-card">
          <div className="hero-logo-row">
            {/* Logo Emblem BMKG (100% Murni Inline SVG) */}
            <svg
              className="hero-logo-svg"
              width="54"
              height="54"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Emblem Logo BMKG"
            >
              <defs>
                <clipPath id="bmkgCircleClip">
                  <circle cx="50" cy="50" r="46" />
                </clipPath>
              </defs>

              {/* Dasar Lingkaran & Garis-Garis */}
              <g clipPath="url(#bmkgCircleClip)">
                {/* Latar Belakang Biru Langit */}
                <rect x="0" y="0" width="100" height="50" fill="#f0f7ff" />

                {/* Pola Garis-Garis Biru Atmosfer di Bagian Atas */}
                <rect x="0" y="6" width="100" height="7.5" fill="#005caa" />
                <rect x="0" y="18" width="100" height="7.5" fill="#005caa" />
                <rect x="0" y="30" width="100" height="7.5" fill="#005caa" />
                <rect x="0" y="42" width="100" height="6.5" fill="#005caa" />

                {/* Gambar Bentuk Awan Putih di Bagian Tengah */}
                <path
                  d="M20 50 C20 42 27 36 35 36 C38 31 44 28 50 28 C58 28 65 33 67 39 C73 39 78 44 78 50 C78 51 77 52 76 53 L20 53 Z"
                  fill="#ffffff"
                />

                {/* Garis Pembatas Horisontal Gelap (Khatulistiwa) */}
                <rect x="0" y="50" width="100" height="3.5" fill="#2d3748" />

                {/* Latar Belakang Hijau Bumi */}
                <rect x="0" y="53.5" width="100" height="46.5" fill="#eafbf0" />

                {/* Pola Garis-Garis Hijau Daratan di Bagian Bawah */}
                <polygon points="4,58 36,58 46,65 4,65" fill="#009b4c" />
                <polygon points="42,58 96,58 96,65 52,65" fill="#009b4c" />

                <polygon points="4,69 42,69 52,76 4,76" fill="#009b4c" />
                <polygon points="48,69 96,69 96,76 58,76" fill="#009b4c" />

                <polygon points="4,80 48,80 58,87 4,87" fill="#009b4c" />
                <polygon points="54,80 96,80 96,87 64,87" fill="#009b4c" />

                <polygon points="4,91 54,91 64,98 4,98" fill="#009b4c" />
                <polygon points="60,91 96,91 96,98 70,98" fill="#009b4c" />
              </g>

              {/* Bingkai Lingkaran Presisi */}
              <circle cx="50" cy="50" r="46" stroke="rgba(11,60,140,0.18)" strokeWidth="2.5" />
            </svg>

            {/* Teks Logo: SEMINAR BMKG & SISTEM INFORMASI SEMINAR ILMIAH */}
            <div className="hero-logo-text-block">
              <span className="hero-logo-title">SEMINAR BMKG</span>
              <span className="hero-logo-subtitle">SISTEM INFORMASI SEMINAR ILMIAH</span>
            </div>
          </div>
        </div>

        {/* 3. Pill / Badge Peringatan (Border Emas/Oranye, Background Gelap Transparan, Icon Gembok) */}
        <div className="hero-security-pill" role="status">
          {/* Icon Gembok (Inline SVG Oranye/Emas) */}
          <svg
            className="hero-lock-svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2.5" ry="2.5" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="hero-pill-text">SISTEM INFORMASI SEMINAR ILMIAH</span>
        </div>

        {/* 4. Teks Judul & Deskripsi (Center Aligned) */}
        <div className="hero-text-center-group">
          <h1 className="hero-main-title">Seminar Ilmiah BMKG</h1>
          <p className="hero-main-desc">
            Akses jadwal seminar unit kerja, ajukan seminar ilmiah Anda, dan kelola presensi kegiatan secara terintegrasi.
          </p>
        </div>

        {/* 5. Tiga Tombol Navigasi Glassmorphism */}
        <div className="hero-glass-actions" role="group" aria-label="Navigasi Aksi Cepat">
          {/* Tombol 1: Jadwal (Icon Kalender) */}
          <button
            type="button"
            className="hero-glass-btn"
            onClick={onJadwalClick}
            title="Lihat Jadwal Seminar"
          >
            <div className="hero-glass-icon-box">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <circle cx="8" cy="15" r="1" fill="currentColor" />
                <circle cx="12" cy="15" r="1" fill="currentColor" />
                <circle cx="16" cy="15" r="1" fill="currentColor" />
              </svg>
            </div>
            <span className="hero-glass-label">Jadwal</span>
          </button>

          {/* Tombol 2: Ajukan (Icon Dokumen Tambah Plus) */}
          <button
            type="button"
            className="hero-glass-btn"
            onClick={onAjukanClick}
            title="Ajukan Seminar Baru"
          >
            <div className="hero-glass-icon-box">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <span className="hero-glass-label">Ajukan</span>
          </button>

          {/* Tombol 3: Presensi (Icon Papan Centang/Presensi) */}
          <button
            type="button"
            className="hero-glass-btn"
            onClick={onPresensiClick}
            title="Kelola Presensi Kegiatan"
          >
            <div className="hero-glass-icon-box">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1.5" ry="1.5" />
                <polyline points="9 14 11.5 16.5 15.5 11" />
              </svg>
            </div>
            <span className="hero-glass-label">Presensi</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
export default HeroPanel
