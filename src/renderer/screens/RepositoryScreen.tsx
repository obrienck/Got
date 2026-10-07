// src/renderer/screens/RepositoryScreen.tsx
// Orchestrator: if no repo selected → WelcomeOpenScreen, else → RepositoryView
// Also handles Cmd/Ctrl+O keyboard shortcut to open repository dialog

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { useRepoContext } from '../src/context/RepoContext'
import RepositoryView from './RepositoryView'
import NormalWelcome from '../src/components/welcome/NormalWelcome'
import SynthWelcome from '../src/components/welcome/SynthWelcome'
import { useWelcomeTheme } from '../src/lib/welcome-theme'

// ─── Welcome Open Screen ─────────────────────────────────────────────────────

function WelcomeOpenScreen() {
  const { setCurrentRepoPath } = useRepoContext()
  const [theme, setTheme] = useWelcomeTheme()
  const [recentRepos, setRecentRepos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [showCloneInput, setShowCloneInput] = useState(false)
  const [cloneUrl, setCloneUrl] = useState('')
  const [showRemoteDialog, setShowRemoteDialog] = useState(false)

  // Load recent repos on mount
  useEffect(() => {
    window.gitAPI.getRecentRepos().then(setRecentRepos).catch(console.error)
  }, [])

  const handleSelectRepo = useCallback(async () => {
    setIsSelecting(true)
    setError(null)
    try {
      const result = await window.gitAPI.selectRepository()
      if (!result) {
        // User cancelled
        setIsSelecting(false)
        return
      }
      if ('error' in result && result.error === 'NOT_A_GIT_REPO') {
        setError(`"${result.path}" is not a Git repository (no .git folder found)`)
        setIsSelecting(false)
        return
      }
      if ('path' in result) {
        setCurrentRepoPath(result.path)
      }
    } catch (err) {
      setError('Failed to open repository. Please try again.')
      console.error(err)
    } finally {
      setIsSelecting(false)
    }
  }, [setCurrentRepoPath])

  const handleCloneRepo = useCallback(async () => {
    const url = cloneUrl.trim()
    if (!url) return
    setIsCloning(true)
    setError(null)
    try {
      const result = await window.gitAPI.cloneRepository(url)
      if (!result) {
        // User cancelled the destination picker
        setIsCloning(false)
        return
      }
      if ('error' in result) {
        setError(
          result.error === 'DIR_EXISTS'
            ? `"${result.path}" already exists there.`
            : result.error
        )
        setIsCloning(false)
        return
      }
      setShowCloneInput(false)
      setCloneUrl('')
      setCurrentRepoPath(result.path)
    } catch (err) {
      setError('Failed to clone repository. Please try again.')
      console.error(err)
    } finally {
      setIsCloning(false)
    }
  }, [cloneUrl, setCurrentRepoPath])

  const handleInitRepo = useCallback(async () => {
    setIsInitializing(true)
    setError(null)
    try {
      const result = await window.gitAPI.initRepository()
      if (!result) {
        setIsInitializing(false)
        return
      }
      if ('error' in result) {
        setError(
          result.error === 'ALREADY_A_REPO'
            ? `"${result.path}" is already a Git repository.`
            : result.error
        )
        setIsInitializing(false)
        return
      }
      setCurrentRepoPath(result.path)
    } catch (err) {
      setError('Failed to initialize repository. Please try again.')
      console.error(err)
    } finally {
      setIsInitializing(false)
    }
  }, [setCurrentRepoPath])

  const handleOpenRecent = useCallback(
    (path: string) => {
      setCurrentRepoPath(path)
    },
    [setCurrentRepoPath]
  )

  // Keyboard shortcut: Cmd/Ctrl + O
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault()
        handleSelectRepo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSelectRepo])

  const isBusy = isSelecting || isCloning || isInitializing

  const contentProps = {
    isSelecting,
    isCloning,
    isInitializing,
    isBusy,
    error,
    setError,
    showCloneInput,
    setShowCloneInput,
    cloneUrl,
    setCloneUrl,
    handleCloneRepo,
    handleSelectRepo,
    handleInitRepo,
    showRemoteDialog,
    setShowRemoteDialog,
    recentRepos,
    handleOpenRecent
  }

  return theme === 'synth' ? (
    <SynthWelcome {...contentProps} theme={theme} setTheme={setTheme} />
  ) : (
    <NormalWelcome {...contentProps} theme={theme} setTheme={setTheme} />
  )
}

// ─── Repository Screen (Orchestrator) ────────────────────────────────────────

export default function RepositoryScreen() {
  const { currentRepoPath, isLoading } = useRepoContext()

  // Loading state while checking for persisted repo path
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0f0f12]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  // No repo selected → Welcome screen
  if (!currentRepoPath) {
    return <WelcomeOpenScreen />
  }

  // Repo selected → Full repository view with live data
  return <RepositoryView repoPath={currentRepoPath} />
}
