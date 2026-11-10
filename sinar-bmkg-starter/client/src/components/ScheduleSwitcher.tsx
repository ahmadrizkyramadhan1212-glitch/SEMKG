import type { FC, ReactNode } from 'react'

export type ScheduleViewMode = 'Harian' | 'Mingguan' | 'Bulanan'

export interface ScheduleSwitcherProps {
  mode: ScheduleViewMode
  onChange: (mode: ScheduleViewMode) => void
  disabled?: boolean
}

interface OptionConfig {
  id: ScheduleViewMode
  label: string
  sublabel: string
  tooltip: string
  icon: (active: boolean) => ReactNode
}

export const ScheduleSwitcher: FC<ScheduleSwitcherProps> = ({ mode, onChange, disabled = false }) => {
  const options: OptionConfig[] = [
    {
      id: 'Harian',
      label: 'Harian',
      sublabel: '06.00–22.00 WIB',
      tooltip: 'Tampilan linimasa harian presisi sumbu waktu (06.00 - 22.00 WIB)',
      icon: (active) => (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={active ? '#ffffff' : 'currentColor'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: 'Mingguan',
      label: 'Mingguan',
      sublabel: '7 Hari',
      tooltip: 'Tampilan jadwal 1 minggu (Senin - Minggu)',
      icon: (active) => (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={active ? '#ffffff' : 'currentColor'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="8" y1="14" x2="8" y2="18" />
          <line x1="12" y1="14" x2="12" y2="18" />
          <line x1="16" y1="14" x2="16" y2="18" />
        </svg>
      ),
    },
    {
      id: 'Bulanan',
      label: 'Bulanan',
      sublabel: 'Kalender',
      tooltip: 'Tampilan kalender grid 1 bulan penuh',
      icon: (active) => (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={active ? '#ffffff' : 'currentColor'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <circle cx="8" cy="14" r="1" fill="currentColor" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
          <circle cx="16" cy="14" r="1" fill="currentColor" />
          <circle cx="8" cy="18" r="1" fill="currentColor" />
          <circle cx="12" cy="18" r="1" fill="currentColor" />
          <circle cx="16" cy="18" r="1" fill="currentColor" />
        </svg>
      ),
    },
  ]

  return (
    <div
      className="schedule-switcher"
      role="radiogroup"
      aria-label="Pilih format tampilan jadwal kegiatan seminar BMKG"
    >
      {options.map((opt) => {
        const isActive = mode === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={`schedule-switcher-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(opt.id)}
            disabled={disabled}
            title={opt.tooltip}
          >
            {opt.icon(isActive)}
            <span className="schedule-switcher-label">{opt.label}</span>
            <span className="schedule-switcher-badge">{opt.sublabel}</span>
          </button>
        )
      })}
    </div>
  )
}

export default ScheduleSwitcher
