// src/renderer/src/components/RemoteOpenDialog.tsx
// Modal for opening a repo on a remote machine over SSH: pick a host, then
// browse its filesystem to the repo. Git itself runs on the remote host.

import { useState, useEffect, useCallback } from 'react'
import {
  Server,
  Folder,
  FolderGit2,
  File,
  ArrowUp,
  ArrowLeft,
  Loader2,
  X,
  CornerDownLeft
} from 'lucide-react'

interface RemoteEntry {
  name: string
  isDirectory: boolean
  isRepo: boolean
}

interface RemoteOpenDialogProps {
  onClose: () => void
  onOpened: (repoLocation: string) => void
}

/** Parent of an absolute POSIX path ("/" stays "/"). */
function parentDir(path: string): string {
  const trimmed = path.replace(/\/+$/, '')
  const idx = trimmed.lastIndexOf('/')
  return idx <= 0 ? '/' : trimmed.slice(0, idx)
}

function joinPath(dir: string, name: string): string {
  return dir.endsWith('/') ? `${dir}${name}` : `${dir}/${name}`
}

export default function RemoteOpenDialog({
  onClose,
  onOpened
}: RemoteOpenDialogProps): React.JSX.Element {
  const [step, setStep] = useState<'connect' | 'browse'>('connect')
  const [knownHosts, setKnownHosts] = useState<string[]>([])
  const [host, setHost] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  const [currentDir, setCurrentDir] = useState('')
  const [pathInput, setPathInput] = useState('')
  const [entries, setEntries] = useState<RemoteEntry[]>([])
  const [isListing, setIsListing] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.gitAPI.getRemoteHosts().then(setKnownHosts).catch(console.error)
  }, [])

  // Escape closes the dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const listDir = useCallback(
    async (dir?: string) => {
      setIsListing(true)
      setError(null)
      try {
        const result = await window.gitAPI.listRemoteDirectory(host.trim(), dir)
        if ('error' in result) {
          setError(result.error)
          return
        }
        setCurrentDir(result.path)
        setPathInput(result.path)
        setEntries(result.entries)
      } catch (err) {
        setError('Failed to list remote directory.')
        console.error(err)
      } finally {
        setIsListing(false)
      }
    },
    [host]
  )

  const handleConnect = useCallback(async () => {
    if (!host.trim()) return
    setIsConnecting(true)
    setError(null)
    try {
      const result = await window.gitAPI.connectRemote(host.trim())
      if ('error' in result) {
        setError(result.error)
        return
      }
      setStep('browse')
      await listDir() // start in the remote home directory
    } catch (err) {
      setError('Failed to connect. Please try again.')
      console.error(err)
    } finally {
      setIsConnecting(false)
    }
  }, [host, listDir])

  const handleOpen = useCallback(
    async (repoPath: string) => {
      setIsOpening(true)
      setError(null)
      try {
        const result = await window.gitAPI.openRemoteRepository(host.trim(), repoPath)
        if ('error' in result) {
          setError(
            result.error === 'NOT_A_GIT_REPO'
              ? `"${result.path}" is not a Git repository.`
              : result.error
          )
          return
        }
        onOpened(result.path)
      } catch (err) {
        setError('Failed to open repository. Please try again.')
        console.error(err)
      } finally {
        setIsOpening(false)
      }
    },
    [host, onOpened]
  )

  const isBusy = isConnecting || isListing || isOpening

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[80vh] w-full max-w-xl flex-col rounded-2xl border border-slate-700 bg-[#1a1a1f] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2d2d35] px-5 py-4">
          <div className="flex items-center gap-2">
            {step === 'browse' && (
              <button
                onClick={() => {
                  setStep('connect')
                  setError(null)
                }}
                title="Change host"
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <Server className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-semibold text-white">
              {step === 'connect' ? 'Open Remote Repository' : host.trim()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
            <X
              className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer hover:text-rose-100"
              onClick={() => setError(null)}
            />
            <span className="break-words">{error}</span>
          </div>
        )}

        {step === 'connect' ? (
          <div className="flex flex-col gap-3 p-5">
            <label className="text-xs text-slate-400">
              SSH host — an alias from <code className="text-slate-300">~/.ssh/config</code> or{' '}
              <code className="text-slate-300">user@hostname</code>
            </label>
            <input
              autoFocus
              list="got-ssh-hosts"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConnect()
              }}
              placeholder="user@devbox"
              className="rounded-lg border border-slate-700 bg-[#0f0f12] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <datalist id="got-ssh-hosts">
              {knownHosts.map((h) => (
                <option key={h} value={h} />
              ))}
            </datalist>
            <p className="text-[11px] text-slate-500">
              Key-based authentication (ssh-agent or an IdentityFile) is required.
            </p>
            <button
              onClick={handleConnect}
              disabled={!host.trim() || isConnecting}
              className="mt-1 rounded-lg bg-indigo-500 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isConnecting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Connect'}
            </button>
          </div>
        ) : (
          <>
            {/* Path bar */}
            <div className="flex items-center gap-2 px-5 pt-4">
              <button
                onClick={() => listDir(parentDir(currentDir))}
                disabled={isBusy || currentDir === '/'}
                title="Parent folder"
                className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <input
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pathInput.trim()) listDir(pathInput.trim())
                }}
                className="flex-1 rounded-lg border border-slate-700 bg-[#0f0f12] px-3 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {isListing && <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />}
            </div>

            {/* Directory listing */}
            <div className="mx-5 mt-3 min-h-[240px] flex-1 overflow-y-auto rounded-lg border border-[#2d2d35] bg-[#0f0f12] py-1">
              {entries.length === 0 && !isListing && (
                <p className="px-3 py-6 text-center text-xs text-slate-500">Empty folder</p>
              )}
              {entries.map((entry) => {
                const fullPath = joinPath(currentDir, entry.name)
                const Icon = entry.isRepo ? FolderGit2 : entry.isDirectory ? Folder : File
                return (
                  <div
                    key={entry.name}
                    className="group flex items-center pr-2 transition-colors hover:bg-slate-800/60"
                  >
                    <button
                      disabled={!entry.isDirectory || isBusy}
                      onClick={() => listDir(fullPath)}
                      className="flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 text-left text-xs disabled:cursor-default"
                    >
                      <Icon
                        className={
                          entry.isRepo
                            ? 'h-4 w-4 shrink-0 text-indigo-400'
                            : entry.isDirectory
                              ? 'h-4 w-4 shrink-0 text-slate-400'
                              : 'h-4 w-4 shrink-0 text-slate-600'
                        }
                      />
                      <span
                        className={
                          entry.isDirectory ? 'truncate text-slate-200' : 'truncate text-slate-500'
                        }
                      >
                        {entry.name}
                      </span>
                    </button>
                    {entry.isRepo && (
                      <button
                        onClick={() => handleOpen(fullPath)}
                        disabled={isBusy}
                        className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-60"
                      >
                        Open repo
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <span className="truncate font-mono text-[11px] text-slate-500" title={currentDir}>
                {currentDir}
              </span>
              <button
                onClick={() => handleOpen(currentDir)}
                disabled={isBusy || !currentDir}
                className="flex shrink-0 items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isOpening ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CornerDownLeft className="h-3.5 w-3.5" />
                )}
                Open This Folder
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
