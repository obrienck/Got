// src/renderer/src/components/repository/types.ts
// Shared props between the normal and 1980s synthwave repository views —
// both skins render the exact same live data and drive the same mutations.

import type { UseMutationResult } from '@tanstack/react-query'
import type { CommitGraphLayout, GraphCommit } from '../../lib/commit-graph'
import type { DiffFile } from '../../lib/diff-parser'
import type { BlameLine } from '../../lib/blame-parser'
import type { AppTheme } from '../../context/ThemeContext'

export interface RepositoryViewContentProps {
  repoPath: string
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  onSwitchRepo: () => void

  // Top bar / identity
  repoName: string
  remoteHost: string | null
  currentBranch: string
  tracking: string

  // Commit composer
  summary: string
  setSummary: (value: string) => void
  description: string
  setDescription: (value: string) => void
  summaryRef: React.RefObject<HTMLInputElement | null>
  commitMutation: UseMutationResult<unknown, Error, { sum: string; desc: string }>

  // Tabs
  activeTab: string
  setActiveTab: (tab: string) => void

  // File tree / selection
  selectedFilePath: string | null
  setSelectedFilePath: (path: string | null) => void
  statusByPath: Record<string, { workingDir: string; index: string }>

  // Branches
  branches: string[]
  branchColors: Record<string, string>
  checkoutMutation: UseMutationResult<unknown, Error, string>
  setShowBranchManager: (show: boolean) => void

  // Pull/push
  pullMutation: UseMutationResult<unknown, Error, void>
  pushMutation: UseMutationResult<unknown, Error, void>

  // Graph tab
  isLoadingLog: boolean
  logData: any
  graphCommits: GraphCommit[]
  graphLayout: CommitGraphLayout
  graphWidth: number
  selectedCommit: string | null
  setSelectedCommit: (hash: string | null) => void
  setViewingCommitHash: (hash: string | null) => void

  // Files tab
  filesTabDiff: DiffFile[]
  isLoadingFilesTabDiff: boolean

  // Blame tab
  blameLines: BlameLine[]
  isLoadingBlame: boolean

  // Staged/unstaged panel
  isLoadingStatus: boolean
  stagedFiles: any[]
  allUnstaged: any[]
  stageMutation: UseMutationResult<unknown, Error, string[]>
  unstageMutation: UseMutationResult<unknown, Error, string[]>

  // Committer profile
  userConfig: { name?: string; email?: string } | undefined
}
