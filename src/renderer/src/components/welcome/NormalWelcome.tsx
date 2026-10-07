// src/renderer/src/components/welcome/NormalWelcome.tsx
// The standard (non-synthwave) welcome screen.

import { FolderOpen, FolderGit2, CloudDownload, FolderPlus, Server, X, Loader2 } from 'lucide-react'
import RemoteOpenDialog from '../RemoteOpenDialog'
import ThemeToggle from '../ThemeToggle'
import { parseRepoLocation, repoDisplayName, repoHostLabel } from '../../../../shared/repo-location'
import gotLogo from '../../assets/got-logo-transparent.png'
import { DRAG_REGION } from '../../lib/platform'
import type { WelcomeTheme } from '../../lib/welcome-theme'
import type { WelcomeContentProps } from './types'

interface NormalWelcomeProps extends WelcomeContentProps {
  theme: WelcomeTheme
  setTheme: (theme: WelcomeTheme) => void
}

export default function NormalWelcome({
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
  handleOpenRecent,
  theme,
  setTheme
}: NormalWelcomeProps): React.JSX.Element {
  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-[#0f0f12]">
      {/* No header on this screen, but the window still needs to be draggable */}
      <div className={`absolute top-0 left-0 right-0 h-10 ${DRAG_REGION}`} />
      <div className="absolute top-4 right-4">
        <ThemeToggle theme={theme} onChange={setTheme} />
      </div>
      <div className="flex flex-col items-center max-w-3xl w-full px-8">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <img src={gotLogo} alt="Got" className="h-16 w-16" />
          <div>
            <div className="text-xl font-bold text-white">Got</div>
            <p className="text-xs text-slate-500">Modern Git Client</p>
          </div>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome to Got</h1>
        <p className="text-slate-400 text-center mb-8">
          Streamline your workflow with powerful repository management
        </p>

        {/* Error message */}
        {error && (
          <div className="w-full mb-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <X
              className="h-4 w-4 mt-0.5 shrink-0 cursor-pointer hover:text-rose-100"
              onClick={() => setError(null)}
            />
            <span>{error}</span>
          </div>
        )}

        {/* Quick action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <button
            onClick={handleSelectRepo}
            disabled={isBusy}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-6 text-center transition-all hover:border-indigo-500/50 hover:bg-slate-800/60 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSelecting ? (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            ) : (
              <FolderOpen className="h-8 w-8 text-indigo-400" />
            )}
            <span className="text-sm font-semibold text-white">
              {isSelecting ? 'Selecting...' : 'Open Repository'}
            </span>
            <span className="text-xs text-slate-500">Open an existing local Git repository</span>
          </button>

          {showCloneInput ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-indigo-500/40 bg-slate-800/40 p-5">
              <span className="text-sm font-semibold text-white text-center">Clone Repository</span>
              <input
                autoFocus
                value={cloneUrl}
                onChange={(e) => setCloneUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCloneRepo()
                  if (e.key === 'Escape') {
                    setShowCloneInput(false)
                    setCloneUrl('')
                  }
                }}
                placeholder="https://github.com/user/repo.git"
                className="rounded-lg bg-[#0f0f12] border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => {
                    setShowCloneInput(false)
                    setCloneUrl('')
                  }}
                  className="flex-1 rounded-lg border border-slate-700 py-1.5 text-xs text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloneRepo}
                  disabled={!cloneUrl.trim() || isCloning}
                  className="flex-1 rounded-lg bg-indigo-500 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isCloning ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : 'Clone'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCloneInput(true)}
              disabled={isBusy}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-6 text-center transition-all hover:border-indigo-500/50 hover:bg-slate-800/60 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <CloudDownload className="h-8 w-8 text-indigo-400" />
              <span className="text-sm font-semibold text-white">Clone Repository</span>
              <span className="text-xs text-slate-500">
                Clone from GitHub, GitLab, or Bitbucket
              </span>
            </button>
          )}

          <button
            onClick={handleInitRepo}
            disabled={isBusy}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-6 text-center transition-all hover:border-indigo-500/50 hover:bg-slate-800/60 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isInitializing ? (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            ) : (
              <FolderPlus className="h-8 w-8 text-indigo-400" />
            )}
            <span className="text-sm font-semibold text-white">
              {isInitializing ? 'Creating...' : 'Init New Repo'}
            </span>
            <span className="text-xs text-slate-500">Create a new local Git repository</span>
          </button>

          <button
            onClick={() => setShowRemoteDialog(true)}
            disabled={isBusy}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-6 text-center transition-all hover:border-indigo-500/50 hover:bg-slate-800/60 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Server className="h-8 w-8 text-indigo-400" />
            <span className="text-sm font-semibold text-white">Open Remote (SSH)</span>
            <span className="text-xs text-slate-500">Work on a repository on another machine</span>
          </button>
        </div>

        {showRemoteDialog && (
          <RemoteOpenDialog
            onClose={() => setShowRemoteDialog(false)}
            onOpened={(location) => {
              setShowRemoteDialog(false)
              handleOpenRecent(location)
            }}
          />
        )}

        <p className="mt-3 text-xs text-slate-600 text-center">
          or press{' '}
          <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ⌘O
          </kbd>{' '}
          to open
        </p>

        {/* Recent Repositories */}
        {recentRepos.length > 0 && (
          <div className="w-full mt-10">
            <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3">
              Recent Repositories
            </h2>
            <div className="flex flex-col gap-1">
              {recentRepos.map((repoPath) => {
                const name = repoDisplayName(repoPath)
                const host = repoHostLabel(repoPath)
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
                      <p className="text-xs text-slate-500 truncate">
                        {parseRepoLocation(repoPath).path}
                      </p>
                    </div>
                    {host && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                        <Server className="h-3 w-3" />
                        {host}
                      </span>
                    )}
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
