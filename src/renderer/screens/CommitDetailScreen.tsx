// src/renderer/screens/CommitDetailScreen.tsx
// Commit Details & Diff Viewer — full commit metadata plus a per-file unified
// or split diff, built from `git diff <parent> <hash>` (PRD Screen 3).

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { cn } from '../src/lib/cn'
import { initialsFor, avatarColorFor } from '../src/lib/avatar'
import { parseDiff } from '../src/lib/diff-parser'
import { IS_MAC, DRAG_REGION, NO_DRAG } from '../src/lib/platform'
import DiffView from '../src/components/DiffView'

interface CommitDetailScreenProps {
  repoPath: string
  commit: {
    hash: string
    message: string
    body?: string
    author_name: string
    date: string
  }
  onBack: () => void
}

function formatFullDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function CommitDetailScreen({
  repoPath,
  commit,
  onBack
}: CommitDetailScreenProps): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  const { data: rawDiff, isLoading } = useQuery({
    queryKey: ['commitDiff', repoPath, commit.hash],
    queryFn: () => window.gitAPI.getCommitDiff(repoPath, commit.hash)
  })

  const files = useMemo(() => parseDiff(rawDiff || ''), [rawDiff])

  const [summary, ...bodyLines] = commit.message.split('\n')
  const description = commit.body || bodyLines.join('\n').trim()

  const copySha = (): void => {
    navigator.clipboard.writeText(commit.hash).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex h-screen w-full flex-col bg-[#0f0f12] text-slate-300 font-sans">
      {/* Header — draggable (custom title bar replaces the native one on mac) */}
      <header
        className={cn('border-b border-[#2d2d35] bg-[#1a1a1f] px-4 py-3 shrink-0', DRAG_REGION)}
      >
        <div className={cn('flex items-center gap-3 text-sm', IS_MAC && 'pl-16')}>
          <button
            onClick={onBack}
            className={cn(
              'flex items-center justify-center h-7 w-7 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors',
              NO_DRAG
            )}
            title="Back to repository"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-slate-500">Got /</span>
          <span className="font-mono text-slate-400">{commit.hash.substring(0, 7)}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Commit metadata */}
        <div className="border-b border-[#2d2d35] px-6 py-5">
          <h1 className="text-xl font-semibold text-white mb-3">{summary}</h1>
          <div className="flex items-center gap-3 text-sm mb-3">
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                avatarColorFor(commit.author_name || '?')
              )}
            >
              {initialsFor(commit.author_name || '?')}
            </div>
            <span className="font-medium text-slate-200">{commit.author_name}</span>
            <span className="text-slate-500">
              committed on <span className="text-slate-300">{formatFullDate(commit.date)}</span>
            </span>
            <button
              onClick={copySha}
              className="flex items-center gap-1.5 font-mono text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-[#2d2d35] text-slate-400 transition-colors"
              title="Copy full SHA"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {commit.hash}
            </button>
          </div>
          {description && (
            <p className="text-sm text-slate-400 leading-relaxed max-w-3xl whitespace-pre-wrap">
              {description}
            </p>
          )}
        </div>

        <DiffView files={files} isLoading={isLoading} emptyMessage="No changes in this commit" />
      </div>
    </div>
  )
}
