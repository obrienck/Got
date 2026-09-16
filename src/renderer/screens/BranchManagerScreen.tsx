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

interface BranchManagerScreenProps {
  repoPath: string
  onBack: () => void
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function BranchManagerScreen({
  repoPath,
  onBack
}: BranchManagerScreenProps): React.JSX.Element {
  const queryClient = useQueryClient()
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
  const repoName = repoPath.split('/').pop() || repoPath

  const ahead = statusData?.ahead ?? 0
  const behind = statusData?.behind ?? 0
  const tracking = statusData?.tracking || ''
  const filesChanged = statusData?.files?.length ?? 0

  const submitNewBranch = (): void => {
    const name = newBranchName.trim()
    if (name) createBranchMutation.mutate(name)
  }

  return (
    <div className="flex h-screen w-full flex-col bg-[#0f0f12] text-slate-300 font-sans">
      {/* Header */}
      <header className="h-14 border-b border-[#2d2d35] bg-[#1a1a1f] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center h-7 w-7 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            title="Back to repository"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold text-slate-100">Got</span>
          </div>
          <div className="h-4 w-px bg-[#33333d]" />
          <span className="text-xs text-slate-400 font-mono bg-white/5 px-2 py-1 rounded">
            repo: {repoName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            title="Coming soon"
            className="px-3 py-1.5 text-xs font-medium rounded bg-white/5 border border-[#33333d] flex items-center gap-2 text-slate-500 cursor-not-allowed"
          >
            <GitMerge className="w-3.5 h-3.5" />
            Merge
          </button>
          <button
            disabled
            title="Coming soon"
            className="px-3 py-1.5 text-xs font-medium rounded bg-white/5 border border-[#33333d] flex items-center gap-2 text-slate-500 cursor-not-allowed"
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
                className="h-8 w-40 rounded bg-[#0f0f12] border border-[#33333d] px-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={submitNewBranch}
                disabled={!newBranchName.trim() || createBranchMutation.isPending}
                className="h-8 px-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs disabled:opacity-50"
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
              className="px-3 py-1.5 text-xs font-medium rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-2"
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
        <aside className="w-64 border-r border-[#2d2d35] bg-[#1a1a1f] flex flex-col shrink-0">
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Local Branches */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Local Branches
                </h3>
                <span className="text-[10px] text-slate-600">{locals.length}</span>
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
                          'w-full flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                          isActive
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'hover:bg-white/5 text-slate-400 border border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <GitBranch className="w-4 h-4 shrink-0" />
                          <span className={cn('text-sm truncate', isActive && 'font-medium')}>
                            {branch}
                          </span>
                        </div>
                        {isActive && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </button>
                    </li>
                  )
                })}
                {locals.length === 0 && (
                  <p className="text-xs text-slate-600 px-1 py-1">No local branches</p>
                )}
              </ul>
            </section>

            {/* Remote Branches */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Remote: origin
                </h3>
                <span className="text-[10px] text-slate-600">{remotes.length}</span>
              </div>
              <ul className="space-y-0.5">
                {remotes.map((branch) => (
                  <li key={branch}>
                    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 text-slate-500 rounded-md cursor-pointer transition-colors">
                      <Cloud className="w-4 h-4 shrink-0" />
                      <span className="text-sm truncate">{branch}</span>
                    </div>
                  </li>
                ))}
                {remotes.length === 0 && (
                  <p className="text-xs text-slate-600 px-1 py-1">No remote branches</p>
                )}
              </ul>
            </section>

            {/* Tags */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Tags
                </h3>
                <span className="text-[10px] text-slate-600">{tags.length}</span>
              </div>
              <ul className="space-y-0.5">
                {tags.map((tag) => (
                  <li key={tag}>
                    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 text-slate-500 rounded-md cursor-pointer transition-colors">
                      <Tag className="w-4 h-4 shrink-0" />
                      <span className="text-sm truncate">{tag}</span>
                    </div>
                  </li>
                ))}
                {tags.length === 0 && (
                  <p className="text-xs text-slate-600 px-1 py-1">No tags yet</p>
                )}
              </ul>
            </section>

            {/* Stashes */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Stashes
                </h3>
                <span className="text-[10px] text-slate-600">{stashes.length}</span>
              </div>
              <ul className="space-y-0.5">
                {stashes.map((stash) => (
                  <li key={stash.hash}>
                    <div className="group flex items-center justify-between px-2 py-1.5 hover:bg-white/5 text-slate-500 rounded-md cursor-pointer transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        <Archive className="w-4 h-4 shrink-0" />
                        <span className="text-sm truncate">{stash.message}</span>
                      </div>
                      <span className="text-[10px] text-slate-700 hidden group-hover:block shrink-0">
                        {formatRelativeTime(stash.date)}
                      </span>
                    </div>
                  </li>
                ))}
                {stashes.length === 0 && (
                  <p className="text-xs text-slate-600 px-1 py-1">No stashes</p>
                )}
              </ul>
            </section>
          </div>
        </aside>

        {/* Branch detail / history */}
        <section className="flex-1 flex flex-col bg-[#0f0f12]">
          <div className="h-10 border-b border-[#2d2d35] flex items-center px-4 justify-between bg-[#0f0f12]/80 shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-medium text-slate-400">Graph</span>
              <span className="text-[11px] font-medium text-slate-400">Commit</span>
              <span className="text-[11px] font-medium text-slate-400">Message</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-medium text-slate-400">Author</span>
              <span className="text-[11px] font-medium text-slate-400">Date</span>
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
              const dotColor = isSynced ? 'bg-slate-600' : 'bg-indigo-500'
              const lineColor = isSynced ? 'bg-slate-700/30' : 'bg-indigo-500/30'

              return (
                <div
                  key={commit.hash}
                  className="flex items-center px-4 py-3 border-b border-[#1e1e24] hover:bg-white/[0.02] transition-colors group"
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
                          isSynced ? 'text-slate-500' : 'text-indigo-400 bg-indigo-500/10'
                        )}
                      >
                        {commit.hash?.substring(0, 7)}
                      </code>
                      <div className="flex items-center gap-2 min-w-0">
                        {remoteTip && (
                          <span className="px-1.5 py-0.5 bg-white/5 text-slate-400 text-[10px] rounded border border-[#33333d] shrink-0">
                            {remoteTip}
                          </span>
                        )}
                        <span
                          className={cn(
                            'min-w-0 flex-1 truncate text-sm',
                            isSynced ? 'text-slate-400 italic' : 'text-slate-200 font-medium'
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
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {commit.author_name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 w-24 text-right italic whitespace-nowrap">
                        {formatRelativeTime(commit.date)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            {commits.length === 0 && (
              <p className="text-sm text-slate-600 px-4 py-6 text-center">No commits yet</p>
            )}
          </div>

          {/* Status bar */}
          <footer className="h-8 border-t border-[#2d2d35] flex items-center px-4 justify-between bg-[#1a1a1f] shrink-0">
            <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500">
              <div className="flex items-center gap-1">
                <Cloud className="w-3 h-3 text-emerald-500" />
                <span>
                  {ahead === 0 && behind === 0
                    ? tracking
                      ? `Up to date with ${tracking}`
                      : 'No upstream branch'
                    : `${ahead} ahead, ${behind} behind${tracking ? ` ${tracking}` : ''}`}
                </span>
              </div>
              <div className="h-3 w-px bg-[#2d2d35]" />
              <span>{filesChanged} Files Changed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] text-slate-400">{currentBranch}</span>
              </div>
            </div>
          </footer>
        </section>
      </main>
    </div>
  )
}
