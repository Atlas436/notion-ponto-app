import { useEffect, useState } from 'react'
import { Moon } from 'lucide-react'

export default function ThemePicker() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('cozyPonto.theme') || 'system'
    } catch {
      return 'system'
    }
  })
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
    }
    apply()
    try {
      localStorage.setItem('cozyPonto.theme', theme)
    } catch {
      /* Theme still works when storage is unavailable. */
    }
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
  return (
    <label className="ml-auto flex items-center gap-2 rounded-xl border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm">
      <Moon size={15} aria-hidden="true" />
      <span className="sr-only">Tema</span>
      <select
        aria-label="Tema"
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        className="bg-transparent outline-none"
      >
        <option value="system">Automático</option>
        <option value="light">Claro</option>
        <option value="dark">Noturno</option>
      </select>
    </label>
  )
}
