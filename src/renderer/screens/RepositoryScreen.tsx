// src/renderer/screens/RepositoryScreen.tsx
// Orchestrator: if no repo selected → WelcomeOpenScreen, else → RepositoryView
// Also handles Cmd/Ctrl+O keyboard shortcut to open repository dialog

import { useState, useEffect, useCallback } from 'react'
import { FolderOpen, FolderGit2, X, Loader2 } from 'lucide-react'
import { useRepoContext } from '../src/context/RepoContext'
import RepositoryView from './RepositoryView'

// ─── Welcome Open Screen ─────────────────────────────────────────────────────

function WelcomeOpenScreen() {
  const { setCurrentRepoPath } = useRepoContext()
  const [recentRepos, setRecentRepos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

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

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0f0f12]">
      <div className="flex flex-col items-center max-w-lg w-full px-8">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <FolderGit2 className="h-7 w-7 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xl font-bold text-white">
              <span className="text-indigo-400">{'</>'}</span> Got
            </div>
            <p className="text-xs text-slate-500">Modern Git Client</p>
          </div>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Open a Repository</h1>
        <p className="text-slate-400 text-center mb-8">
          Select a local Git repository to get started
        </p>

        {/* Error message */}
        {error && (
          <div className="w-full mb-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <X className="h-4 w-4 mt-0.5 shrink-0 cursor-pointer hover:text-rose-100" onClick={() => setError(null)} />
            <span>{error}</span>
          </div>
        )}

        {/* Primary action button */}
        <button
          onClick={handleSelectRepo}
          disabled={isSelecting}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-indigo-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-600 hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSelecting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <FolderOpen className="h-5 w-5" />
          )}
          {isSelecting ? 'Selecting...' : 'Open Local Repository'}
        </button>

        <p className="mt-2 text-xs text-slate-600 text-center">
          or press <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">⌘O</kbd> to open
        </p>

        {/* Recent Repositories */}
        {recentRepos.length > 0 && (
          <div className="w-full mt-10">
            <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3">
              Recent Repositories
            </h2>
            <div className="flex flex-col gap-1">
              {recentRepos.map((repoPath) => {
                const name = repoPath.split('/').pop() || repoPath
                return (
                  <button
                    key={repoPath}
                    onClick={() => handleOpenRecent(repoPath)}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-800/60"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 group-hover:bg-indigo-500/20 transition-colors">
                      <FolderGit2 className="h-4 w-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-200 truncate">{name}</p>
                      <p className="text-xs text-slate-500 truncate">{repoPath}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-slate-600">Got v1.0.0</p>
        </div>
      </div>
    </div>
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
