// src/renderer/src/context/ThemeContext.tsx
// App-wide Normal/1980s theme, the same idea as a light/dark toggle.
// Persists to localStorage so it survives restarts.

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export type AppTheme = 'normal' | 'synth'

const STORAGE_KEY = 'got:theme'

interface ThemeContextValue {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): AppTheme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'synth' ? 'synth' : 'normal'
  } catch {
    return 'normal'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [theme, setThemeState] = useState<AppTheme>(readStoredTheme)

  const setTheme = useCallback((next: AppTheme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private browsing / disabled storage — theme just won't persist.
    }
  }, [])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useAppTheme must be used within a ThemeProvider')
  return ctx
}
