// src/renderer/src/components/welcome/types.ts
// Shared props between the normal and 1980s synthwave welcome screens —
// both skins drive the exact same repository actions.

export interface WelcomeContentProps {
  isSelecting: boolean
  isCloning: boolean
  isInitializing: boolean
  isBusy: boolean

  error: string | null
  setError: (error: string | null) => void

  showCloneInput: boolean
  setShowCloneInput: (show: boolean) => void
  cloneUrl: string
  setCloneUrl: (url: string) => void
  handleCloneRepo: () => void

  handleSelectRepo: () => void
  handleInitRepo: () => void

  showRemoteDialog: boolean
  setShowRemoteDialog: (show: boolean) => void

  recentRepos: string[]
  handleOpenRecent: (path: string) => void
}
