// src/renderer/src/lib/welcome-theme.ts
// Persists the user's choice between the normal welcome screen and the
// 1980s synthwave skin, the same way a light/dark toggle would.

import { useCallback, useState } from 'react'

export type WelcomeTheme = 'normal' | 'synth'

const STORAGE_KEY = 'got:welcomeTheme'

function readStoredTheme(): WelcomeTheme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'synth' ? 'synth' : 'normal'
  } catch {
    return 'normal'
  }
}

export function useWelcomeTheme(): [WelcomeTheme, (theme: WelcomeTheme) => void] {
  const [theme, setThemeState] = useState<WelcomeTheme>(readStoredTheme)

  const setTheme = useCallback((next: WelcomeTheme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private browsing / disabled storage — theme just won't persist.
    }
  }, [])

  return [theme, setTheme]
}
