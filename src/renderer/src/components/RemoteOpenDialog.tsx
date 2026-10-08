// src/renderer/src/components/RemoteOpenDialog.tsx
// Modal for opening a repo inside a Coder workspace: pick a workspace (starting
// it if needed), then browse its filesystem to the repo. Git runs in the workspace.

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
  CornerDownLeft,
  RefreshCw,
  Play
} from 'lucide-react'
import type { CoderWorkspace } from '../../../shared/coder-workspace'

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

function statusClass(status: string): string {
  if (status === 'running') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (status === 'failed') return 'border-rose-500/30 bg-rose-500/10 text-rose-300'
  if (status === 'stopped' || status === 'deleted')
    return 'border-slate-600 bg-slate-800 text-slate-400'
  return 'border-amber-500/30 bg-amber-500/10 text-amber-300' // starting, stopping, pending...
}

export default function RemoteOpenDialog({
  onClose,
  onOpened
}: RemoteOpenDialogProps): React.JSX.Element {
  const [step, setStep] = useState<'connect' | 'browse'>('connect')
  const [workspaces, setWorkspaces] = useState<CoderWorkspace[] | null>(null)
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false)
  const [startingName, setStartingName] = useState<string | null>(null)
  const [host, setHost] = useState('') // the selected workspace target
  const [isConnecting, setIsConnecting] = useState(false)

  const [currentDir, setCurrentDir] = useState('')
  const [pathInput, setPathInput] = useState('')
  const [entries, setEntries] = useState<RemoteEntry[]>([])
  const [isListing, setIsListing] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadWorkspaces = useCallback(async () => {
    setIsLoadingWorkspaces(true)
    setError(null)
    try {
      const result = await window.gitAPI.getCoderWorkspaces()
      if ('error' in result) {
        setError(result.error)
        return
      }
      setWorkspaces(result.workspaces)
    } catch (err) {
      setError('Failed to list Coder workspaces.')
      console.error(err)
    } finally {
      setIsLoadingWorkspaces(false)
    }
  }, [])

  useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  // Escape closes the dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const listDir = useCallback(
    async (dir?: string, target: string = host) => {
      setIsListing(true)
      setError(null)
      try {
        const result = await window.gitAPI.listRemoteDirectory(target, dir)
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

  const handleConnect = useCallback(
    async (target: string) => {
      setHost(target)
      setIsConnecting(true)
      setError(null)
      try {
        const result = await window.gitAPI.connectRemote(target)
        if ('error' in result) {
          setError(result.error)
          return
        }
        setStep('browse')
        await listDir(undefined, target) // start in the workspace home directory
      } catch (err) {
        setError('Failed to connect. Please try again.')
        console.error(err)
      } finally {
        setIsConnecting(false)
      }
    },
    [listDir]
  )

  const handleStart = useCallback(
    async (ws: CoderWorkspace) => {
      setStartingName(ws.name)
      setError(null)
      try {
        const result = await window.gitAPI.startCoderWorkspace(ws.target)
        if ('error' in result) {
          setError(result.error)
          return
        }
        await loadWorkspaces()
      } catch (err) {
        setError(`Failed to start ${ws.name}.`)
        console.error(err)
      } finally {
        setStartingName(null)
      }
    },
    [loadWorkspaces]
  )

  const handleOpen = useCallback(
    async (repoPath: string) => {
      setIsOpening(true)
      setError(null)
      try {
        const result = await window.gitAPI.openRemoteRepository(host, repoPath)
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
                title="Change workspace"
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <Server className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-semibold text-white">
              {step === 'connect' ? 'Open Coder Workspace' : host}
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
          <div className="flex min-h-0 flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Your workspaces, via the <code className="text-slate-300">coder</code> CLI
              </span>
              <button
                onClick={loadWorkspaces}
                disabled={isLoadingWorkspaces || startingName !== null}
                title="Refresh"
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-40"
              >
                <RefreshCw className={isLoadingWorkspaces ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              </button>
            </div>

            <div className="min-h-[200px] flex-1 overflow-y-auto rounded-lg border border-[#2d2d35] bg-[#0f0f12] py-1">
              {workspaces === null && isLoadingWorkspaces && (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                </div>
              )}
              {workspaces?.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-slate-500">
                  No workspaces found. Create one in Coder, then refresh.
                </p>
              )}
              {workspaces?.map((ws) => {
                const isRunning = ws.status === 'running'
                const isStarting = startingName === ws.name
                return (
                  <div
                    key={ws.target}
                    className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-slate-800/60"
                  >
                    <Server className="h-4 w-4 shrink-0 text-indigo-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-200">
                        {ws.name}
                        {ws.agent && <span className="text-slate-500">.{ws.agent}</span>}
                      </p>
                      {ws.template && (
                        <p className="truncate text-[11px] text-slate-500">{ws.template}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClass(isStarting ? 'starting' : ws.status)}`}
                    >
                      {isStarting ? 'starting' : ws.status}
                    </span>
                    {isRunning ? (
                      <button
                        onClick={() => handleConnect(ws.target)}
                        disabled={isConnecting}
                        className="w-20 shrink-0 rounded-lg bg-indigo-500 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isConnecting && host === ws.target ? (
                          <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Connect'
                        )}
                      </button>
                    ) : ws.status === 'stopped' || ws.status === 'failed' ? (
                      <button
                        onClick={() => handleStart(ws)}
                        disabled={startingName !== null}
                        className="flex w-20 shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-700 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isStarting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Play className="h-3 w-3" /> Start
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="w-20 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>

            <p className="text-[11px] text-slate-500">
              {startingName
                ? `Starting ${startingName} — this can take a few minutes.`
                : 'Requires the Coder CLI, signed in with `coder login`.'}
            </p>
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
