// Konteks tema (terang/gelap) dan latar (bergerak/diam/polos), tersimpan di localStorage.
// Bila perangkat meminta "kurangi gerakan", latar otomatis menjadi diam.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'terang' | 'gelap'
type BgMode = 'bergerak' | 'diam' | 'polos'

interface UiCtx {
  theme: Theme
  setTheme: (t: Theme) => void
  bg: BgMode
  setBg: (b: BgMode) => void
}

const Ctx = createContext<UiCtx>({ theme: 'terang', setTheme: () => {}, bg: 'bergerak', setBg: () => {} })

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function UiProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => ((localStorage.getItem('SEMINAR.theme') as Theme) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'gelap' : 'terang')),
  )
  const [bg, setBgState] = useState<BgMode>(() => {
    if (prefersReduced()) return 'diam'
    return (localStorage.getItem('SEMINAR.bg') as BgMode) || 'bergerak'
  })

  useEffect(() => {
    const isDark = theme === 'gelap'
    const val = isDark ? 'dark' : 'light'
    document.documentElement.dataset.theme = val
    document.documentElement.setAttribute('data-theme', val)
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.classList.toggle('light', !isDark)
    localStorage.setItem('SEMINAR.theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.bg = bg
    if (!prefersReduced()) localStorage.setItem('SEMINAR.bg', bg)
  }, [bg])

  // Bila pengguna sistem mengaktifkan kurangi gerakan, paksa latar diam
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const fn = () => mq.matches && setBgState('diam')
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  return <Ctx.Provider value={{ theme, setTheme: setThemeState, bg, setBg: setBgState }}>{children}</Ctx.Provider>
}

export const useUi = () => useContext(Ctx)
