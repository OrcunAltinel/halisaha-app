'use client'

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'
const THEME_KEY = 'theme'
const THEME_EVENT = 'theme-change'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (t: Theme) => void
}>({ theme: 'light', setTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function getSnapshot(): Theme {
  if (typeof window === 'undefined') return 'light'

  const stored = localStorage.getItem(THEME_KEY) as Theme | null
  if (stored === 'dark' || stored === 'light') return stored

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getServerSnapshot(): Theme {
  return 'light'
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const handleChange = () => callback()
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === THEME_KEY) callback()
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(THEME_EVENT, handleChange)
  media.addEventListener('change', handleChange)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(THEME_EVENT, handleChange)
    media.removeEventListener('change', handleChange)
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = (t: Theme) => {
    localStorage.setItem(THEME_KEY, t)
    applyTheme(t)
    window.dispatchEvent(new Event(THEME_EVENT))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
