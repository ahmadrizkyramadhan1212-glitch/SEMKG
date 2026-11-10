// Logo BMKG Resmi (100% Pure Inline SVG)
// Geometri resmi BMKG: Lingkaran biru BMKG (#0066b3) + 3 garis putih + siluet awan,
// garis pemisah abu-abu (#4d4d4d), dan pola garis hijau BMKG (#00a651) bertingkat.
export function Logo({
  height = 36,
  size,
  className = '',
}: {
  height?: number
  size?: number
  className?: string
  variant?: 'auto' | 'black' | 'white'
}) {
  const s = size ?? height

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Resmi BMKG"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        <clipPath id="nav-bmkg-circle">
          <circle cx="100" cy="90" r="75" />
        </clipPath>
      </defs>
      <g clipPath="url(#nav-bmkg-circle)">
        {/* Belahan Atas: Biru BMKG (#0066b3) */}
        <rect x="0" y="0" width="200" height="90" fill="#0066b3" />
        <line x1="0" y1="25" x2="200" y2="25" stroke="#ffffff" strokeWidth="8" />
        <line x1="0" y1="42" x2="200" y2="42" stroke="#ffffff" strokeWidth="8" />
        <line x1="0" y1="59" x2="200" y2="59" stroke="#ffffff" strokeWidth="8" />
        
        {/* Siluet Awan Putih */}
        <path d="M 20 88 C 25 65, 55 60, 70 72 C 85 50, 130 50, 145 72 C 160 62, 185 75, 180 88 Z" fill="#ffffff" />
        
        {/* Garis Pemisah Abu-abu (#4d4d4d) */}
        <line x1="0" y1="90" x2="200" y2="90" stroke="#4d4d4d" strokeWidth="5" />
        
        {/* Belahan Bawah: Pola Hijau BMKG (#00a651) Bertingkat */}
        <rect x="0" y="92" width="200" height="100" fill="#ffffff" />
        <polygon points="20,102 75,102 60,114 10,114" fill="#00a651" />
        <polygon points="85,102 180,102 180,114 73,114" fill="#00a651" />
        <polygon points="15,122 90,122 75,134 10,134" fill="#00a651" />
        <polygon points="100,122 185,122 185,134 88,134" fill="#00a651" />
        <polygon points="25,142 110,142 95,154 20,154" fill="#00a651" />
        <polygon points="120,142 175,142 175,154 108,154" fill="#00a651" />
        <polygon points="45,162 130,162 115,174 40,174" fill="#00a651" />
      </g>
      {/* Garis Lingkaran Luar */}
      <circle cx="100" cy="90" r="75" stroke="#003366" strokeWidth="4" fill="none" />
    </svg>
  )
}
