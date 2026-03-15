// src/renderer/screens/RepositoryView.tsx
// Full repository view: top bar + left sidebar + commit graph + right panel
// Receives repoPath as prop, uses real window.gitAPI via TanStack Query

import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  GitPullRequest,
  ArrowDownToLine,
  ArrowUpToLine,
  Settings,
  Plus,
  ChevronRight,
  ChevronDown,
  FileText,
  FileCode,
  FolderOpen,
  Check,
  Loader2
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useRepoContext } from '../src/context/RepoContext'

// --- Utils ---

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Inline UI Components (shadcn-like) ---

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'ghost' | 'outline' | 'secondary'
    size?: 'default' | 'sm' | 'icon'
  }
>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm',
    ghost: 'hover:bg-slate-800 text-slate-300 hover:text-white',
    outline: 'border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300',
    secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700'
  }
  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    icon: 'h-8 w-8 justify-center'
  }
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
})
Button.displayName = 'Button'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-1 text-sm text-slate-200 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[60px] w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <div className="flex items-center">
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          'peer h-4 w-4 shrink-0 rounded-sm border border-slate-500 bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-indigo-500 checked:text-white',
          className
        )}
        {...props}
      />
    </div>
  )
)
Checkbox.displayName = 'Checkbox'

const ScrollArea = ({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) => <div className={cn('overflow-y-auto overflow-x-hidden', className)}>{children}</div>

// --- File status helpers ---

function getStatusInfo(workingDir: string, index: string) {
  // Determine the display status letter + color from simple-git StatusResult fields
  const code = workingDir !== ' ' ? workingDir : index
  switch (code) {
    case 'M':
      return { letter: 'M', bg: 'bg-purple-500/10', text: 'text-purple-400' }
    case 'A':
    case '?':
      return { letter: 'A', bg: 'bg-green-500/10', text: 'text-green-400' }
    case 'D':
      return { letter: 'D', bg: 'bg-rose-500/10', text: 'text-rose-400' }
    case 'R':
      return { letter: 'R', bg: 'bg-cyan-500/10', text: 'text-cyan-400' }
    default:
      return { letter: code || 'M', bg: 'bg-purple-500/10', text: 'text-purple-400' }
  }
}

// --- Graph color cycling ---

const GRAPH_COLORS = ['#a855f7', '#22d3ee', '#f43f5e', '#22c55e', '#f59e0b']

// --- Props ---

interface RepositoryViewProps {
  repoPath: string
}

// --- Main Component ---

export default function RepositoryView({ repoPath }: RepositoryViewProps) {
  const { setCurrentRepoPath } = useRepoContext()
  const queryClient = useQueryClient()
  const summaryRef = useRef<HTMLInputElement>(null)

  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [activeTab, setActiveTab] = useState('Graph')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null)

  // --- TanStack Queries (REAL data from window.gitAPI) ---

  const {
    data: statusData,
    isLoading: isLoadingStatus
  } = useQuery({
    queryKey: ['status', repoPath],
    queryFn: () => window.gitAPI.status(repoPath),
    refetchInterval: 5000 // Auto-refresh status every 5s
  })

  const {
    data: logData,
    isLoading: isLoadingLog
  } = useQuery({
    queryKey: ['log', repoPath],
    queryFn: () => window.gitAPI.log(repoPath, { '--all': true })
  })

  // --- Mutations ---

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['status', repoPath] })
    queryClient.invalidateQueries({ queryKey: ['log', repoPath] })
  }

  const stageMutation = useMutation({
    mutationFn: (files: string[]) => window.gitAPI.stage(repoPath, files),
    onSuccess: invalidateQueries
  })

  const unstageMutation = useMutation({
    mutationFn: (files: string[]) => window.gitAPI.unstage(repoPath, files),
    onSuccess: invalidateQueries
  })

  const commitMutation = useMutation({
    mutationFn: async ({ sum, desc }: { sum: string; desc: string }) => {
      const message = desc ? `${sum}\n\n${desc}` : sum
      return window.gitAPI.commit(repoPath, message)
    },
    onSuccess: () => {
      setSummary('')
      setDescription('')
      invalidateQueries()
    }
  })

  const checkoutMutation = useMutation({
    mutationFn: (branch: string) => window.gitAPI.checkout(repoPath, branch),
    onSuccess: invalidateQueries
  })

  const pullMutation = useMutation({
    mutationFn: () => window.gitAPI.pull(repoPath),
    onSuccess: invalidateQueries
  })

  const pushMutation = useMutation({
    mutationFn: () => window.gitAPI.push(repoPath),
    onSuccess: invalidateQueries
  })

  const toggleFolder = (folder: string) =>
    setExpandedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }))

  // --- Keyboard Shortcuts ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter = commit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (summary.trim()) {
          commitMutation.mutate({ sum: summary, desc: description })
        }
      }
      // Cmd/Ctrl + K = focus commit input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        summaryRef.current?.focus()
      }
      // Cmd/Ctrl + O = open new repository
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault()
        window.gitAPI.selectRepository().then((result) => {
          if (result && 'path' in result && !('error' in result)) {
            setCurrentRepoPath(result.path)
          }
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [summary, description, commitMutation, setCurrentRepoPath])

  // --- Derived data from REAL status ---

  const currentBranch = statusData?.current || '...'
  const tracking = statusData?.tracking || ''

  // Unstaged = files with working_dir changes
  const unstagedFiles =
    statusData?.files?.filter(
      (f: any) => f.working_dir !== ' ' && f.working_dir !== '?'
    ) || []

  // Not-tracked files
  const untrackedFiles =
    statusData?.files?.filter((f: any) => f.working_dir === '?') || []

  // Staged files
  const stagedFiles =
    statusData?.files?.filter(
      (f: any) => f.index !== ' ' && f.index !== '?' && f.index !== '!'
    ) || []

  const allUnstaged = [...unstagedFiles, ...untrackedFiles]

  // Build folder tree from files for left sidebar
  const folderSet = new Set<string>()
  statusData?.files?.forEach((f: any) => {
    const parts = f.path.split('/')
    if (parts.length > 1) {
      folderSet.add(parts[0])
    }
  })
  const folders = Array.from(folderSet)

  // Branch list from log refs
  const branchSet = new Set<string>()
  if (currentBranch) branchSet.add(currentBranch)
  logData?.all?.forEach((commit: any) => {
    if (commit.refs) {
      commit.refs.split(',').forEach((ref: string) => {
        const trimmed = ref.trim()
          .replace('HEAD -> ', '')
          .replace('origin/', '')
        if (trimmed && !trimmed.includes('tag:')) {
          branchSet.add(trimmed)
        }
      })
    }
  })
  const branches = Array.from(branchSet).slice(0, 10)

  // Graph colors for branch assignment
  const branchColors: Record<string, string> = {}
  branches.forEach((b, i) => {
    branchColors[b] = GRAPH_COLORS[i % GRAPH_COLORS.length]
  })

  // Repo display name from path
  const repoName = repoPath.split('/').pop() || repoPath

  return (
    <div className="dark flex h-screen w-full flex-col bg-[#0f0f12] text-slate-300 font-sans selection:bg-indigo-500/30">
      {/* Top Bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#2d2d35] bg-[#1a1a1f] px-4 shadow-sm z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-white cursor-pointer hover:bg-white/5 px-2 py-1 rounded transition-colors">
            <span className="text-indigo-400">{'</>'}</span>
            Got
          </div>
          <div className="flex items-center gap-1.5 border-l border-[#33333d] pl-6">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-2.5 hover:bg-slate-800"
              onClick={() => pullMutation.mutate()}
              disabled={pullMutation.isPending}
            >
              {pullMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="h-4 w-4" />
              )}
              Pull
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-2.5 hover:bg-slate-800"
              onClick={() => pushMutation.mutate()}
              disabled={pushMutation.isPending}
            >
              {pushMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpToLine className="h-4 w-4" />
              )}
              Push
            </Button>
            <Button
              size="sm"
              className="ml-2 gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium border-0 px-3"
            >
              <GitPullRequest className="h-4 w-4" /> Branch
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 rounded-full border border-[#33333d] bg-[#0f0f12] px-3 py-1 text-xs">
            <GitPullRequest className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-semibold text-white">{currentBranch}</span>
            {tracking && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{tracking}</span>
              </>
            )}
          </div>
          <span className="text-xs text-slate-500 truncate max-w-[180px]" title={repoPath}>
            {repoName}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="flex w-[280px] shrink-0 flex-col border-r border-[#2d2d35] bg-[#1a1a1f]">
          <div className="flex h-10 items-center justify-between px-4">
            <h2 className="text-[11px] font-bold tracking-wider text-slate-500">REPOSITORY</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 px-2 pb-4">
            {/* File Tree — real folders from status */}
            <div className="space-y-0.5 mt-1">
              {folders.map((folder) => {
                const folderFiles =
                  statusData?.files?.filter((f: any) => f.path.startsWith(folder + '/')) || []
                return (
                  <div key={folder}>
                    <button
                      onClick={() => toggleFolder(folder)}
                      className="flex w-full items-center gap-1.5 rounded py-1 px-2 text-sm text-slate-300 hover:bg-white/5"
                    >
                      {expandedFolders[folder] ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                      <FolderOpen className="h-3.5 w-3.5 text-indigo-400" />
                      {folder}/
                    </button>
                    {expandedFolders[folder] && (
                      <div className="ml-5 flex flex-col gap-0.5 border-l border-[#33333d] pl-1.5 mt-0.5">
                        {folderFiles.map((f: any) => {
                          const fileName = f.path.split('/').pop()
                          return (
                            <div
                              key={f.path}
                              className="flex items-center gap-2 rounded py-1 px-2 text-[13px] text-slate-400 hover:bg-white/5 cursor-pointer"
                            >
                              {f.path.endsWith('.tsx') || f.path.endsWith('.ts') ? (
                                <FileCode className="h-3.5 w-3.5 text-cyan-400/80" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 text-yellow-400/80" />
                              )}
                              {fileName}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Local Branches */}
            <div className="mt-8">
              <div className="flex h-8 items-center px-2">
                <h2 className="text-[11px] font-bold tracking-wider text-slate-500">
                  LOCAL BRANCHES
                </h2>
              </div>
              <div className="flex flex-col gap-0.5">
                {branches.map((branch) => {
                  const isActive = branch === currentBranch
                  const color = branchColors[branch] || '#a855f7'
                  return (
                    <button
                      key={branch}
                      disabled={checkoutMutation.isPending || isActive}
                      onClick={() => !isActive && checkoutMutation.mutate(branch)}
                      className={cn(
                        'group flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'bg-indigo-500/10 text-indigo-300 font-medium'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <GitPullRequest
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color }}
                        />
                        <span className="truncate">{branch}</span>
                      </div>
                      {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-400" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Center Main Area — Commit Graph */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0f0f12]">
          {/* Tabs */}
          <div className="flex h-12 w-full shrink-0 border-b border-[#2d2d35] px-4 font-medium text-sm z-10">
            {['Graph', 'Files', 'Blame'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative flex items-center px-4 transition-colors',
                  activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 h-[2px] w-full bg-indigo-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Graph Content */}
          <div className="flex-1 overflow-hidden relative">
            {isLoadingLog ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                  <span className="text-sm text-slate-500">Loading commit history...</span>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#0f0f12]/95 backdrop-blur shadow-[0_1px_0_#2d2d35]">
                    <tr>
                      <th className="w-[120px] px-4 py-2 font-semibold text-slate-400 whitespace-nowrap">
                        GRAPH
                      </th>
                      <th className="px-4 py-2 font-semibold text-slate-400">MESSAGE</th>
                      <th className="w-[140px] px-4 py-2 font-semibold text-slate-400 whitespace-nowrap">
                        AUTHOR
                      </th>
                      <th className="w-[140px] px-4 py-2 font-semibold text-slate-400 whitespace-nowrap">
                        DATE
                      </th>
                      <th className="w-[80px] pl-4 pr-6 py-2 font-semibold text-slate-400 whitespace-nowrap text-right">
                        SHA
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1e24] font-mono tracking-tight">
                    {logData?.all?.map((commit: any, i: number) => {
                      const isSelected = selectedCommit === commit.hash
                      // Cycle colors based on position
                      const color = GRAPH_COLORS[i % GRAPH_COLORS.length]
                      // Format date
                      const commitDate = commit.date
                        ? new Date(commit.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : ''

                      return (
                        <tr
                          key={commit.hash}
                          onClick={() => setSelectedCommit(commit.hash)}
                          className={cn(
                            'group cursor-pointer transition-colors',
                            isSelected ? 'bg-indigo-500/10' : 'hover:bg-white/[0.02]'
                          )}
                        >
                          <td className="px-4 py-1 relative">
                            <div className="flex justify-center h-8 items-center w-full relative">
                              <div className="absolute top-0 bottom-0 w-0.5 bg-[#2d2d35] left-1/2 -ml-[1px]" />
                              <div
                                className={cn(
                                  'z-10 h-3 w-3 rounded-full border-[2.5px] border-[#0f0f12] ring-1 ring-offset-0',
                                  isSelected
                                    ? 'scale-125 ring-white'
                                    : 'ring-transparent hover:scale-110 transition-transform'
                                )}
                                style={{ backgroundColor: color }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 text-slate-200 truncate max-w-[200px] sm:max-w-[400px]">
                            <div className="flex items-center gap-2">
                              {commit.refs && (
                                <span
                                  className={cn(
                                    'px-1.5 py-0.5 rounded text-[10px] font-sans font-bold',
                                    commit.refs.includes('main') || commit.refs.includes('master')
                                      ? 'bg-purple-500/20 text-purple-300'
                                      : commit.refs.includes('feature')
                                        ? 'bg-cyan-500/20 text-cyan-300'
                                        : 'bg-rose-500/20 text-rose-300'
                                  )}
                                >
                                  {commit.refs.replace('HEAD -> ', '')}
                                </span>
                              )}
                              <span className={isSelected ? 'text-white' : ''}>
                                {commit.message}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-slate-400 capitalize whitespace-nowrap">
                            {commit.author_name}
                          </td>
                          <td className="px-4 py-2 text-slate-400 whitespace-nowrap">
                            {commitDate}
                          </td>
                          <td className="pl-4 pr-6 py-2 text-slate-500 text-right w-[80px]">
                            {commit.hash?.substring(0, 7)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Right Panel — Staged/Unstaged + Commit */}
        <div className="flex w-[320px] shrink-0 flex-col border-l border-[#2d2d35] bg-[#1a1a1f] shadow-xl z-20">
          <ScrollArea className="flex-1 p-4 pb-0">
            {/* Staged Section */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-400">
                  STAGED ({stagedFiles.length})
                </span>
              </div>
              {isLoadingStatus ? (
                <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                </div>
              ) : stagedFiles.length === 0 ? (
                <p className="text-xs text-slate-600 py-1">No staged changes</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {stagedFiles.map((f: any) => {
                    const info = getStatusInfo(' ', f.index)
                    return (
                      <div
                        key={f.path}
                        className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-white/5 transition-colors cursor-pointer text-slate-300"
                      >
                        <Checkbox
                          checked
                          onChange={() => unstageMutation.mutate([f.path])}
                          title="Click to unstage"
                        />
                        <span
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold',
                            info.bg,
                            info.text
                          )}
                        >
                          {info.letter}
                        </span>
                        <span className="flex-1 truncate group-hover:text-white">{f.path}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Unstaged Section */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-400">
                  UNSTAGED CHANGES ({allUnstaged.length})
                </span>
              </div>
              {isLoadingStatus ? (
                <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                </div>
              ) : allUnstaged.length === 0 ? (
                <p className="text-xs text-slate-600 py-1">Working tree clean</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {allUnstaged.map((f: any) => {
                    const info = getStatusInfo(f.working_dir, f.index)
                    return (
                      <div
                        key={f.path}
                        className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-white/5 transition-colors cursor-pointer text-slate-300"
                      >
                        <Checkbox
                          onChange={() => stageMutation.mutate([f.path])}
                          title="Click to stage"
                        />
                        <span
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold',
                            info.bg,
                            info.text
                          )}
                        >
                          {info.letter}
                        </span>
                        <span className="flex-1 truncate group-hover:text-white">{f.path}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Commit Area */}
          <div className="flex flex-col gap-3 p-4 border-t border-[#2d2d35] bg-[#1a1a1f] shrink-0">
            <h3 className="text-xs font-bold tracking-wider text-slate-400">COMMIT MESSAGE</h3>
            <div className="flex flex-col gap-2 relative">
              <Input
                ref={summaryRef}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Commit summary (Cmd+K)"
                className="bg-[#0f0f12] border-[#33333d] focus-visible:ring-indigo-500 text-[13px]"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="bg-[#0f0f12] border-[#33333d] resize-none h-24 focus-visible:ring-indigo-500 text-[13px]"
              />
            </div>
            <Button
              className="w-full h-10 gap-2 font-medium"
              disabled={!summary.trim() || commitMutation.isPending || stagedFiles.length === 0}
              onClick={() => commitMutation.mutate({ sum: summary, desc: description })}
            >
              {commitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Committing...
                </>
              ) : (
                `Commit ${stagedFiles.length} File${stagedFiles.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
