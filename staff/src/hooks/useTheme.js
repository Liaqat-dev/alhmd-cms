import { useState, useEffect } from 'react'

export const PALETTES = [
  { name: 'blue',    label: 'Blue',    color: 'oklch(65.26% 0.1828 255.54)' },
  { name: 'green',   label: 'Green',   color: 'oklch(74.88% 0.1723 157.44)' },
  { name: 'teal',    label: 'Teal',    color: 'oklch(70.4% 0.14 182.5)'     },
  { name: 'violet',  label: 'Violet',  color: 'oklch(60.6% 0.25 292.7)'     },
  { name: 'fuchsia', label: 'Fuchsia', color: 'oklch(66.7% 0.295 322.15)'   },
  { name: 'orange',  label: 'Orange',  color: 'oklch(64.19% 0.2084 34.96)'  },
  { name: 'amber',   label: 'Amber',   color: 'oklch(76.9% 0.188 70.08)'    },
  { name: 'lime',    label: 'Lime',    color: 'oklch(76.8% 0.233 130.85)'   },
]

export function useTheme() {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('cga-theme') === 'dark'
  )
  const [palette, setPalette] = useState(
    () => localStorage.getItem('cga-palette') || 'blue'
  )

  useEffect(() => {
    const html = document.documentElement
    if (isDark) {
      html.setAttribute('data-mode', 'dark')
      html.classList.add('dark')
    } else {
      html.removeAttribute('data-mode')
      html.classList.remove('dark')
    }
    localStorage.setItem('cga-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    const html = document.documentElement
    if (palette === 'blue') {
      html.removeAttribute('data-colors')
    } else {
      html.setAttribute('data-colors', palette)
    }
    localStorage.setItem('cga-palette', palette)
  }, [palette])

  const toggleDark = () => setIsDark(prev => !prev)

  return { isDark, toggleDark, palette, setPalette }
}
