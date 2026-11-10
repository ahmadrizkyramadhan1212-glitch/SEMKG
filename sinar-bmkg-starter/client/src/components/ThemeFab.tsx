// Komponen resmi Floating Action Button (FAB) Dark Mode / Light Mode untuk seluruh aplikasi
import { useUi } from '../lib/ui'

export default function ThemeFab() {
  const { theme, setTheme } = useUi()

  // Sapuan transisi lingkaran jika browser mendukung View Transitions API
  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = theme === 'terang' ? 'gelap' : 'terang'
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> }
    }
    const x = e.clientX
    const y = e.clientY
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

    if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(next)
      return
    }

    const transition = doc.startViewTransition(() => {
      setTheme(next)
    })

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
          },
          {
            duration: 450,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        )
      })
      .catch(() => {})
  }

  const isDark = theme === 'gelap'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
      aria-label={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
      className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-white/95 dark:bg-[#132238]/95 text-slate-700 dark:text-amber-400 border border-slate-200/90 dark:border-slate-700/80 shadow-xl shadow-black/20 backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/20"
    >
      {isDark ? (
        /* Ikon Matahari (Sun Icon) murni SVG */
        <svg
          className="w-5 h-5 text-amber-400 transform hover:rotate-45 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="5" strokeWidth="2" stroke="currentColor" fill="currentColor" fillOpacity="0.2" />
          <path
            strokeLinecap="round"
            strokeWidth="2"
            d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          />
        </svg>
      ) : (
        /* Ikon Bulan Sabit (Moon Icon) murni SVG */
        <svg
          className="w-5 h-5 text-slate-700 dark:text-slate-200 transform -rotate-12 hover:rotate-0 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            fill="currentColor"
            fillOpacity="0.15"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  )
}
