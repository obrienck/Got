// src/renderer/screens/BranchManagerScreen.tsx
// Branch & Remote Management screen — local/remote branches, tags, stashes,
// and a commit history list. Layout matches the Stitch mockup
// (project 428850243772848549, screen e26c72d5c89547f78aabbb2a86dbd88d).

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  GitBranch,
  GitMerge,
  GitPullRequestArrow,
  Plus,
  Cloud,
  Tag,
  Archive,
  Check,
  Loader2
} from 'lucide-react'
import { cn } from '../src/lib/cn'
import { initialsFor, avatarColorFor } from '../src/lib/avatar'
import { formatRelativeTime } from '../src/lib/format-time'
import gotLogo from '../src/assets/got-logo-transparent.png'
import { IS_MAC, DRAG_REGION, NO_DRAG } from '../src/lib/platform'
import { repoDisplayName } from '../../shared/repo-location'
import { useAppTheme } from '../src/context/ThemeContext'

interface BranchManagerScreenProps {
  repoPath: string
  onBack: () => void
  onViewCommit: (hash: string) => void
}

export default function BranchManagerScreen({
  repoPath,
  onBack,
  onViewCommit
}: BranchManagerScreenProps): React.JSX.Element {
  const queryClient = useQueryClient()
  const { theme } = useAppTheme()
  const synth = theme === 'synth'
  const [isCreatingBranch, setIsCreatingBranch] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')

  const invalidateRefs = (): void => {
    queryClient.invalidateQueries({ queryKey: ['status', repoPath] })
    queryClient.invalidateQueries({ queryKey: ['log', repoPath] })
    queryClient.invalidateQueries({ queryKey: ['branchesLocal', repoPath] })
    queryClient.invalidateQueries({ queryKey: ['branchesRemote', repoPath] })
  }

  const { data: statusData } = useQuery({
    queryKey: ['status', repoPath],
    queryFn: () => window.gitAPI.status(repoPath)
  })

  const { data: logData } = useQuery({
    queryKey: ['log', repoPath],
    queryFn: () => window.gitAPI.log(repoPath, { '--all': true, n: 50 })
  })

  const { data: localBranches } = useQuery({
    queryKey: ['branchesLocal', repoPath],
    queryFn: () => window.gitAPI.branchesLocal(repoPath)
  })

  const { data: remoteBranches } = useQuery({
    queryKey: ['branchesRemote', repoPath],
    queryFn: () => window.gitAPI.branchesRemote(repoPath)
  })

  const { data: tagsData } = useQuery({
    queryKey: ['tags', repoPath],
    queryFn: () => window.gitAPI.tags(repoPath)
  })

  const { data: stashesData } = useQuery({
    queryKey: ['stashes', repoPath],
    queryFn: () => window.gitAPI.stashes(repoPath)
  })

  const checkoutMutation = useMutation({
    mutationFn: (branch: string) => window.gitAPI.checkout(repoPath, branch),
    onSuccess: invalidateRefs
  })

  const createBranchMutation = useMutation({
    mutationFn: (name: string) => window.gitAPI.createBranch(repoPath, name),
    onSuccess: () => {
      setIsCreatingBranch(false)
      setNewBranchName('')
      invalidateRefs()
    }
  })

  const currentBranch: string = localBranches?.current || statusData?.current || ''
  const locals: string[] = localBranches?.all || []
  const remotes: string[] = remoteBranches?.all || []
  const tags: string[] = tagsData?.all || []
  const stashes: any[] = stashesData?.all || []
  const commits: any[] = logData?.all || []
  const repoName = repoDisplayName(repoPath)

  const ahead = statusData?.ahead ?? 0
  const behind = statusData?.behind ?? 0
  const tracking = statusData?.tracking || ''
  const filesChanged = statusData?.files?.length ?? 0

  const submitNewBranch = (): void => {
    const name = newBranchName.trim()
    if (name) createBranchMutation.mutate(name)
  }

  return (
    <div
      className={cn(
        'flex h-screen w-full flex-col',
        synth ? 'font-mono crt-scanlines text-[#ecdcff]' : 'bg-[#0f0f12] text-slate-300 font-sans'
      )}
      style={synth ? { background: '#0d0221' } : undefined}
    >
      {/* Header — draggable (custom title bar replaces the native one on mac) */}
      <header
        className={cn(
          'h-14 flex items-center justify-between px-4 shrink-0',
          DRAG_REGION,
          synth ? '' : 'border-b border-[#2d2d35] bg-[#1a1a1f]'
        )}
        style={
          synth
            ? {
                background: '#140727',
                borderBottom: '2px solid #ff007f',
                boxShadow: '0 4px 20px rgba(255,0,127,0.2)'
              }
            : undefined
        }
      >
        <div className={cn('flex items-center gap-4', IS_MAC && 'pl-16')}>
          <button
            onClick={onBack}
            className={cn(
              'flex items-center justify-center h-7 w-7 rounded transition-colors',
              NO_DRAG,
              synth
                ? 'text-[#00f0ff] hover:bg-[#26193a] hover:text-white'
                : 'hover:bg-white/5 text-slate-400 hover:text-white'
            )}
            title="Back to repository"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <img src={gotLogo} alt="" className="h-6 w-6" />
            <span
              className={cn(
                'font-semibold',
                synth ? 'text-[#ffd9e1] neon-text-pink' : 'text-slate-100'
              )}
            >
              Got
            </span>
          </div>
          <div className={cn('h-4 w-px', synth ? 'bg-[#5c3f46]' : 'bg-[#33333d]')} />
          <span
            className={cn(
              'text-xs font-mono px-2 py-1 rounded',
              synth
                ? 'bg-[#211536] text-[#00f0ff] border border-[#00f0ff]/40'
                : 'text-slate-400 bg-white/5'
            )}
          >
            repo: {repoName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            title="Coming soon"
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded flex items-center gap-2 cursor-not-allowed',
              NO_DRAG,
              synth
                ? 'bg-[#211536] border border-[#3c2e50] text-[#5c3f46]'
                : 'bg-white/5 border border-[#33333d] text-slate-500'
            )}
          >
            <GitMerge className="w-3.5 h-3.5" />
            Merge
          </button>
          <button
            disabled
            title="Coming soon"
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded flex items-center gap-2 cursor-not-allowed',
              NO_DRAG,
              synth
                ? 'bg-[#211536] border border-[#3c2e50] text-[#5c3f46]'
                : 'bg-white/5 border border-[#33333d] text-slate-500'
            )}
          >
            <GitPullRequestArrow className="w-3.5 h-3.5" />
            Rebase
          </button>

          {isCreatingBranch ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewBranch()
                  if (e.key === 'Escape') setIsCreatingBranch(false)
                }}
                placeholder="new-branch-name"
                className={cn(
                  'h-8 w-40 rounded px-2 text-xs focus:outline-none focus:ring-1',
                  NO_DRAG,
                  synth
                    ? 'bg-[#140727] border border-[#ff007f]/50 text-[#00f0ff] focus:ring-[#00f0ff]'
                    : 'bg-[#0f0f12] border border-[#33333d] text-slate-200 focus:ring-indigo-500'
                )}
              />
              <button
                onClick={submitNewBranch}
                disabled={!newBranchName.trim() || createBranchMutation.isPending}
                className={cn(
                  'h-8 px-2 rounded text-white text-xs disabled:opacity-50',
                  NO_DRAG,
                  synth
                    ? 'bg-gradient-to-r from-[#ff007f] to-[#ba005b] hover:brightness-125'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                )}
              >
                {createBranchMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingBranch(true)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-2 text-white',
                NO_DRAG,
                synth
                  ? 'bg-gradient-to-r from-[#ff007f] to-[#ba005b] hover:brightness-125 shadow-lg shadow-[#ff007f]/30'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Branch
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            'w-64 flex flex-col shrink-0',
            synth ? '' : 'border-r border-[#2d2d35] bg-[#1a1a1f]'
          )}
          style={synth ? { background: '#140727', borderRight: '1px solid #3c2e50' } : undefined}
        >
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Local Branches */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider',
                    synth ? 'text-[#00f0ff] neon-text-cyan' : 'text-slate-500'
                  )}
                >
                  Local Branches
                </h3>
                <span className={cn('text-[10px]', synth ? 'text-[#5c3f46]' : 'text-slate-600')}>
                  {locals.length}
                </span>
              </div>
              <ul className="space-y-0.5">
                {locals.map((branch) => {
                  const isActive = branch === currentBranch
                  return (
                    <li key={branch}>
                      <button
                        disabled={isActive || checkoutMutation.isPending}
                        onClick={() => checkoutMutation.mutate(branch)}
                        className={cn(
                          'w-full flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors border',
                          isActive
                            ? synth
                              ? 'bg-[#ff007f]/20 text-[#ffb1c4] border-[#ff007f]/60 neon-glow-pink font-bold'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : synth
                              ? 'text-[#ecdcff]/70 hover:bg-[#26193a] hover:text-[#00f0ff] border-transparent'
                              : 'hover:bg-white/5 text-slate-400 border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <GitBranch className="w-4 h-4 shrink-0" />
                          <span className={cn('text-sm truncate', isActive && 'font-medium')}>
                            {branch}
                          </span>
                        </div>
                        {isActive && (
                          <Check
                            className={cn(
                              'w-3.5 h-3.5 shrink-0',
                              synth ? 'text-[#39ff14]' : 'text-emerald-500'
                            )}
                          />
                        )}
                      </button>
                    </li>
                  )
                })}
                {locals.length === 0 && (
                  <p
                    className={cn('text-xs px-1 py-1', synth ? 'text-[#5c3f46]' : 'text-slate-600')}
                  >
                    No local branches
                  </p>
                )}
              </ul>
            </section>

            {/* Remote Branches */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider',
                    synth ? 'text-[#00f0ff] neon-text-cyan' : 'text-slate-500'
                  )}
                >
                  Remote: origin
                </h3>
                <span className={cn('text-[10px]', synth ? 'text-[#5c3f46]' : 'text-slate-600')}>
                  {remotes.length}
                </span>
              </div>
              <ul className="space-y-0.5">
                {remotes.map((branch) => (
                  <li key={branch}>
                    <div
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                        synth
                          ? 'hover:bg-[#26193a] text-[#ac878f]'
                          : 'hover:bg-white/5 text-slate-500'
                      )}
                    >
                      <Cloud className="w-4 h-4 shrink-0" />
                      <span className="text-sm truncate">{branch}</span>
                    </div>
                  </li>
                ))}
                {remotes.length === 0 && (
                  <p
                    className={cn('text-xs px-1 py-1', synth ? 'text-[#5c3f46]' : 'text-slate-600')}
                  >
                    No remote branches
                  </p>
                )}
              </ul>
            </section>

            {/* Tags */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider',
                    synth ? 'text-[#fde400]' : 'text-slate-500'
                  )}
                >
                  Tags
                </h3>
                <span className={cn('text-[10px]', synth ? 'text-[#5c3f46]' : 'text-slate-600')}>
                  {tags.length}
                </span>
              </div>
              <ul className="space-y-0.5">
                {tags.map((tag) => (
                  <li key={tag}>
                    <div
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                        synth
                          ? 'hover:bg-[#26193a] text-[#ac878f]'
                          : 'hover:bg-white/5 text-slate-500'
                      )}
                    >
                      <Tag className="w-4 h-4 shrink-0" />
                      <span className="text-sm truncate">{tag}</span>
                    </div>
                  </li>
                ))}
                {tags.length === 0 && (
                  <p
                    className={cn('text-xs px-1 py-1', synth ? 'text-[#5c3f46]' : 'text-slate-600')}
                  >
                    No tags yet
                  </p>
                )}
              </ul>
            </section>

            {/* Stashes */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider',
                    synth ? 'text-[#00f0ff] neon-text-cyan' : 'text-slate-500'
                  )}
                >
                  Stashes
                </h3>
                <span className={cn('text-[10px]', synth ? 'text-[#5c3f46]' : 'text-slate-600')}>
                  {stashes.length}
                </span>
              </div>
              <ul className="space-y-0.5">
                {stashes.map((stash) => (
                  <li key={stash.hash}>
                    <div
                      className={cn(
                        'group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                        synth
                          ? 'hover:bg-[#26193a] text-[#ac878f]'
                          : 'hover:bg-white/5 text-slate-500'
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Archive className="w-4 h-4 shrink-0" />
                        <span className="text-sm truncate">{stash.message}</span>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] hidden group-hover:block shrink-0',
                          synth ? 'text-[#5c3f46]' : 'text-slate-700'
                        )}
                      >
                        {formatRelativeTime(stash.date)}
                      </span>
                    </div>
                  </li>
                ))}
                {stashes.length === 0 && (
                  <p
                    className={cn('text-xs px-1 py-1', synth ? 'text-[#5c3f46]' : 'text-slate-600')}
                  >
                    No stashes
                  </p>
                )}
              </ul>
            </section>
          </div>
        </aside>

        {/* Branch detail / history */}
        <section
          className={cn('flex-1 flex flex-col', synth ? '' : 'bg-[#0f0f12]')}
          style={synth ? { background: '#0d0221' } : undefined}
        >
          <div
            className={cn(
              'h-10 flex items-center px-4 justify-between shrink-0',
              synth ? '' : 'border-b border-[#2d2d35] bg-[#0f0f12]/80'
            )}
            style={synth ? { background: '#190c2d', borderBottom: '1px solid #3c2e50' } : undefined}
          >
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  'text-[11px] font-medium',
                  synth ? 'text-[#00f0ff] neon-text-cyan' : 'text-slate-400'
                )}
              >
                Graph
              </span>
              <span
                className={cn(
                  'text-[11px] font-medium',
                  synth ? 'text-[#ff007f]' : 'text-slate-400'
                )}
              >
                Commit
              </span>
              <span
                className={cn(
                  'text-[11px] font-medium',
                  synth ? 'text-[#ff007f]' : 'text-slate-400'
                )}
              >
                Message
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  'text-[11px] font-medium',
                  synth ? 'text-[#39ff14]' : 'text-slate-400'
                )}
              >
                Author
              </span>
              <span
                className={cn(
                  'text-[11px] font-medium',
                  synth ? 'text-[#dec800]' : 'text-slate-400'
                )}
              >
                Date
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {commits.map((commit) => {
              const isSynced = typeof commit.refs === 'string' && commit.refs.includes('origin/')
              const remoteTip = isSynced
                ? commit.refs
                    .split(',')
                    .map((r: string) => r.trim())
                    .find((r: string) => r.startsWith('origin/'))
                : null
              const dotColor = synth
                ? isSynced
                  ? 'bg-[#5c3f46]'
                  : 'bg-[#ff007f]'
                : isSynced
                  ? 'bg-slate-600'
                  : 'bg-indigo-500'
              const lineColor = synth
                ? isSynced
                  ? 'bg-[#3c2e50]/60'
                  : 'bg-[#ff007f]/30'
                : isSynced
                  ? 'bg-slate-700/30'
                  : 'bg-indigo-500/30'

              return (
                <div
                  key={commit.hash}
                  onDoubleClick={() => onViewCommit(commit.hash)}
                  title="Double-click to view commit details"
                  className={cn(
                    'flex items-center px-4 py-3 transition-colors group cursor-pointer',
                    synth
                      ? 'border-b border-[#3c2e50]/70 hover:bg-[#ff007f]/10'
                      : 'border-b border-[#1e1e24] hover:bg-white/[0.02]'
                  )}
                >
                  <div className="w-12 flex justify-center shrink-0">
                    <div className={cn('w-2 h-2 rounded-full relative', dotColor)}>
                      <div
                        className={cn(
                          'absolute top-1/2 left-1/2 -translate-x-1/2 w-px h-10',
                          lineColor
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-between gap-4 min-w-0">
                    <div className="flex items-center gap-4 min-w-0">
                      <code
                        className={cn(
                          'text-[11px] font-mono px-1.5 py-0.5 rounded shrink-0',
                          synth
                            ? isSynced
                              ? 'text-[#5c3f46]'
                              : 'text-[#00f0ff] bg-[#00f0ff]/10'
                            : isSynced
                              ? 'text-slate-500'
                              : 'text-indigo-400 bg-indigo-500/10'
                        )}
                      >
                        {commit.hash?.substring(0, 7)}
                      </code>
                      <div className="flex items-center gap-2 min-w-0">
                        {remoteTip && (
                          <span
                            className={cn(
                              'px-1.5 py-0.5 text-[10px] rounded border shrink-0',
                              synth
                                ? 'bg-[#26193a] text-[#ac878f] border-[#3c2e50]'
                                : 'bg-white/5 text-slate-400 border-[#33333d]'
                            )}
                          >
                            {remoteTip}
                          </span>
                        )}
                        <span
                          className={cn(
                            'min-w-0 flex-1 truncate text-sm',
                            synth
                              ? isSynced
                                ? 'text-[#ac878f] italic'
                                : 'text-[#ecdcff] font-medium'
                              : isSynced
                                ? 'text-slate-400 italic'
                                : 'text-slate-200 font-medium'
                          )}
                        >
                          {commit.message}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0',
                            avatarColorFor(commit.author_name || '?')
                          )}
                        >
                          {initialsFor(commit.author_name || '?')}
                        </div>
                        <span
                          className={cn(
                            'text-xs whitespace-nowrap',
                            synth ? 'text-[#39ff14]' : 'text-slate-400'
                          )}
                        >
                          {commit.author_name}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-xs w-24 text-right italic whitespace-nowrap',
                          synth ? 'text-[#dec800]' : 'text-slate-500'
                        )}
                      >
                        {formatRelativeTime(commit.date)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            {commits.length === 0 && (
              <p
                className={cn(
                  'text-sm px-4 py-6 text-center',
                  synth ? 'text-[#5c3f46]' : 'text-slate-600'
                )}
              >
                No commits yet
              </p>
            )}
          </div>

          {/* Status bar */}
          <footer
            className={cn(
              'h-8 flex items-center px-4 justify-between shrink-0',
              synth ? '' : 'border-t border-[#2d2d35] bg-[#1a1a1f]'
            )}
            style={synth ? { background: '#140727', borderTop: '1px solid #3c2e50' } : undefined}
          >
            <div
              className={cn(
                'flex items-center gap-4 text-[10px] font-medium',
                synth ? 'text-[#ac878f]' : 'text-slate-500'
              )}
            >
              <div className="flex items-center gap-1">
                <Cloud className={cn('w-3 h-3', synth ? 'text-[#39ff14]' : 'text-emerald-500')} />
                <span>
                  {ahead === 0 && behind === 0
                    ? tracking
                      ? `Up to date with ${tracking}`
                      : 'No upstream branch'
                    : `${ahead} ahead, ${behind} behind${tracking ? ` ${tracking}` : ''}`}
                </span>
              </div>
              <div className={cn('h-3 w-px', synth ? 'bg-[#3c2e50]' : 'bg-[#2d2d35]')} />
              <span>{filesChanged} Files Changed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    synth ? 'bg-[#ff007f]' : 'bg-indigo-500'
                  )}
                />
                <span className={cn('text-[10px]', synth ? 'text-[#ecdcff]' : 'text-slate-400')}>
                  {currentBranch}
                </span>
              </div>
            </div>
          </footer>
        </section>
      </main>
    </div>
  )
}
