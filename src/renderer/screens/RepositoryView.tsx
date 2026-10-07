// src/renderer/screens/RepositoryView.tsx
// Repository view container: owns all live data (TanStack Query), mutations,
// and derived state, then hands it to NormalRepositoryView or
// SynthRepositoryView depending on the active theme.

import { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Server, RefreshCw, ArrowLeft } from 'lucide-react'
import { useRepoContext } from '../src/context/RepoContext'
import { useAppTheme } from '../src/context/ThemeContext'
import { buildCommitGraph, type GraphCommit } from '../src/lib/commit-graph'
import { cn } from '../src/lib/cn'
import { DRAG_REGION } from '../src/lib/platform'
import { parseDiff } from '../src/lib/diff-parser'
import { parseBlame } from '../src/lib/blame-parser'
import BranchManagerScreen from './BranchManagerScreen'
import CommitDetailScreen from './CommitDetailScreen'
import { repoDisplayName, repoHostLabel } from '../../shared/repo-location'
import NormalRepositoryView from '../src/components/repository/NormalRepositoryView'
import SynthRepositoryView from '../src/components/repository/SynthRepositoryView'
import { GRAPH_COLORS } from '../src/components/repository/graph-geometry'
import type { RepositoryViewContentProps } from '../src/components/repository/types'

interface RepositoryViewProps {
  repoPath: string
}

export default function RepositoryView({ repoPath }: RepositoryViewProps) {
  const { setCurrentRepoPath } = useRepoContext()
  const { theme, setTheme } = useAppTheme()
  const queryClient = useQueryClient()
  const summaryRef = useRef<HTMLInputElement>(null)

  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [activeTab, setActiveTab] = useState('Graph')
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null)
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [viewingCommitHash, setViewingCommitHash] = useState<string | null>(null)
  const [showBranchManager, setShowBranchManager] = useState(false)

  // --- TanStack Queries (REAL data from window.gitAPI) ---

  const {
    data: statusData,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
    isFetching: isFetchingStatus
  } = useQuery({
    queryKey: ['status', repoPath],
    queryFn: () => window.gitAPI.status(repoPath),
    refetchInterval: 5000 // Auto-refresh status every 5s
  })

  const { data: logData, isLoading: isLoadingLog } = useQuery({
    queryKey: ['log', repoPath],
    queryFn: () => window.gitAPI.log(repoPath, { '--all': true })
  })

  const { data: userConfig } = useQuery({
    queryKey: ['userConfig', repoPath],
    queryFn: () => window.gitAPI.getUserConfig(repoPath)
  })

  const { data: localBranches } = useQuery({
    queryKey: ['branchesLocal', repoPath],
    queryFn: () => window.gitAPI.branchesLocal(repoPath)
  })

  // --- Files tab: diff for whichever commit is selected in the Graph tab ---

  const { data: filesTabRawDiff, isLoading: isLoadingFilesTabDiff } = useQuery({
    queryKey: ['commitDiff', repoPath, selectedCommit],
    queryFn: () => window.gitAPI.getCommitDiff(repoPath, selectedCommit as string),
    enabled: activeTab === 'Files' && !!selectedCommit
  })

  const filesTabDiff = useMemo(() => parseDiff(filesTabRawDiff || ''), [filesTabRawDiff])

  // --- Blame tab: blame for whichever file is selected in the sidebar tree ---

  const { data: rawBlame, isLoading: isLoadingBlame } = useQuery({
    queryKey: ['fileBlame', repoPath, selectedFilePath],
    queryFn: () => window.gitAPI.getFileBlame(repoPath, selectedFilePath as string),
    enabled: activeTab === 'Blame' && !!selectedFilePath
  })

  const blameLines = useMemo(() => parseBlame(rawBlame || ''), [rawBlame])

  // --- Ancestry-aware commit graph layout ---

  const graphCommits: GraphCommit[] = useMemo(
    () =>
      (logData?.all || []).map((c: any) => ({
        hash: c.hash,
        parents: typeof c.parents === 'string' ? c.parents.split(' ').filter(Boolean) : []
      })),
    [logData]
  )

  const graphLayout = useMemo(() => buildCommitGraph(graphCommits, GRAPH_COLORS), [graphCommits])
  const graphWidth = Math.max(96, graphLayout.laneCount * 18 + 18)

  // --- Mutations ---

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['status', repoPath] })
    queryClient.invalidateQueries({ queryKey: ['log', repoPath] })
    queryClient.invalidateQueries({ queryKey: ['branchesLocal', repoPath] })
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

  // --- Derived data from REAL status ---

  const currentBranch = statusData?.current || '...'
  const tracking = statusData?.tracking || ''

  const unstagedFiles =
    statusData?.files?.filter((f: any) => f.working_dir !== ' ' && f.working_dir !== '?') || []
  const untrackedFiles = statusData?.files?.filter((f: any) => f.working_dir === '?') || []
  const stagedFiles =
    statusData?.files?.filter((f: any) => f.index !== ' ' && f.index !== '?' && f.index !== '!') ||
    []
  const allUnstaged = [...unstagedFiles, ...untrackedFiles]

  const statusByPath: Record<string, { workingDir: string; index: string }> = {}
  statusData?.files?.forEach((f: any) => {
    statusByPath[f.path] = { workingDir: f.working_dir, index: f.index }
  })

  const branches: string[] = localBranches?.all || []

  const branchColors: Record<string, string> = {}
  branches.forEach((b, i) => {
    branchColors[b] = GRAPH_COLORS[i % GRAPH_COLORS.length]
  })

  const repoName = repoDisplayName(repoPath)
  const remoteHost = repoHostLabel(repoPath)

  // A remote repo whose host can't be reached would otherwise render an
  // empty, half-broken view — show what went wrong and a way out instead.
  if (remoteHost && statusError && !statusData) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0f0f12]">
        <div className={cn('absolute top-0 left-0 right-0 h-10', DRAG_REGION)} />
        <div className="flex max-w-md flex-col items-center gap-4 px-8 text-center">
          <Server className="h-10 w-10 text-rose-400" />
          <h1 className="text-lg font-semibold text-white">Can&apos;t reach {remoteHost}</h1>
          <p className="break-words text-xs text-slate-400">
            {statusError instanceof Error ? statusError.message : String(statusError)}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setCurrentRepoPath(null)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={() => refetchStatus()}
              disabled={isFetchingStatus}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-3 py-1.5 text-sm text-white hover:bg-indigo-600 disabled:opacity-60"
            >
              {isFetchingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const viewingCommit = viewingCommitHash
    ? logData?.all?.find((c: any) => c.hash === viewingCommitHash)
    : null
  if (viewingCommit) {
    return (
      <CommitDetailScreen
        repoPath={repoPath}
        commit={viewingCommit}
        onBack={() => setViewingCommitHash(null)}
      />
    )
  }

  if (showBranchManager) {
    return (
      <BranchManagerScreen
        repoPath={repoPath}
        onBack={() => setShowBranchManager(false)}
        onViewCommit={setViewingCommitHash}
      />
    )
  }

  const contentProps: RepositoryViewContentProps = {
    repoPath,
    theme,
    setTheme,
    onSwitchRepo: () => setCurrentRepoPath(null),
    repoName,
    remoteHost,
    currentBranch,
    tracking,
    summary,
    setSummary,
    description,
    setDescription,
    summaryRef,
    commitMutation,
    activeTab,
    setActiveTab,
    selectedFilePath,
    setSelectedFilePath,
    statusByPath,
    branches,
    branchColors,
    checkoutMutation,
    setShowBranchManager,
    pullMutation,
    pushMutation,
    isLoadingLog,
    logData,
    graphCommits,
    graphLayout,
    graphWidth,
    selectedCommit,
    setSelectedCommit,
    setViewingCommitHash,
    filesTabDiff,
    isLoadingFilesTabDiff,
    blameLines,
    isLoadingBlame,
    isLoadingStatus,
    stagedFiles,
    allUnstaged,
    stageMutation,
    unstageMutation,
    userConfig
  }

  return theme === 'synth' ? (
    <SynthRepositoryView {...contentProps} />
  ) : (
    <NormalRepositoryView {...contentProps} />
  )
}
