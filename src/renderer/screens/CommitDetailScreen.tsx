// src/renderer/screens/CommitDetailScreen.tsx
// Commit Details & Diff Viewer — full commit metadata plus a per-file unified
// or split diff, built from `git diff <parent> <hash>` (PRD Screen 3).

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, FileCode, Copy, Check, Loader2, FilePlus, FileMinus } from 'lucide-react'
import { cn } from '../src/lib/cn'
import { initialsFor, avatarColorFor } from '../src/lib/avatar'
import { parseDiff, toSplitRows, type DiffLine } from '../src/lib/diff-parser'

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

function DiffLineCell({ line }: { line: DiffLine | null }): React.JSX.Element {
  if (!line) {
    return <div className="flex-1 bg-white/[0.02]" />
  }
  const bg = line.type === 'add' ? 'bg-emerald-500/10' : line.type === 'del' ? 'bg-rose-500/10' : ''
  const prefixColor =
    line.type === 'add'
      ? 'text-emerald-400'
      : line.type === 'del'
        ? 'text-rose-400'
        : 'text-transparent'
  const prefix = line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '
  return (
    <div className={cn('flex flex-1 min-w-0', bg)}>
      <span className={cn('w-10 shrink-0 text-right pr-2 select-none text-slate-600')}>
        {line.oldLine ?? ''}
      </span>
      <span className="w-10 shrink-0 text-right pr-2 select-none text-slate-600">
        {line.newLine ?? ''}
      </span>
      <span className={cn('w-4 shrink-0 select-none font-bold', prefixColor)}>{prefix}</span>
      <span className="min-w-0 flex-1 whitespace-pre text-slate-300">{line.content}</span>
    </div>
  )
}

export default function CommitDetailScreen({
  repoPath,
  commit,
  onBack
}: CommitDetailScreenProps): React.JSX.Element {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified')
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
      {/* Header */}
      <header className="border-b border-[#2d2d35] bg-[#1a1a1f] px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={onBack}
            className="flex items-center justify-center h-7 w-7 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
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

        {/* Diff toolbar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-[#2d2d35] bg-[#1a1a1f]/50 sticky top-0 z-10">
          <span className="text-xs text-slate-500">
            {isLoading
              ? 'Loading diff...'
              : `${files.length} file${files.length === 1 ? '' : 's'} changed`}
          </span>
          <div className="flex items-center bg-[#1a1a1f] rounded-md border border-[#2d2d35] overflow-hidden">
            <button
              onClick={() => setViewMode('unified')}
              className={cn(
                'px-3 py-1 text-xs font-medium transition-colors',
                viewMode === 'unified'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:bg-white/5'
              )}
            >
              Unified
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={cn(
                'px-3 py-1 text-xs font-medium transition-colors',
                viewMode === 'split'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:bg-white/5'
              )}
            >
              Split
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading diff...
          </div>
        )}

        {!isLoading && files.length === 0 && (
          <p className="text-sm text-slate-600 text-center py-16">No changes in this commit</p>
        )}

        {/* Files */}
        {files.map((file) => (
          <div key={file.path} className="border-b border-[#2d2d35]">
            <div className="flex items-center gap-3 px-6 py-2 bg-[#1a1a1f]/40 sticky top-[41px] z-[5]">
              {file.isNew ? (
                <FilePlus className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : file.isDeleted ? (
                <FileMinus className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="text-sm font-mono text-slate-200 truncate">{file.path}</span>
              {!file.isBinary && (
                <span className="text-[11px] font-mono shrink-0">
                  <span className="text-emerald-400">+{file.additions}</span>{' '}
                  <span className="text-rose-400">-{file.deletions}</span>
                </span>
              )}
            </div>

            {file.isBinary ? (
              <p className="text-sm text-slate-600 px-6 py-4">Binary file not shown</p>
            ) : (
              <div className="overflow-x-auto font-mono text-[12px] leading-5">
                {file.hunks.map((hunk, hi) => (
                  <div key={hi}>
                    <div className="px-6 py-1 bg-white/[0.03] text-slate-500 text-[11px]">
                      {hunk.header}
                    </div>
                    {viewMode === 'unified'
                      ? hunk.lines.map((line, li) => (
                          <div key={li} className="flex pl-6">
                            <DiffLineCell line={line} />
                          </div>
                        ))
                      : toSplitRows(hunk.lines).map((row, ri) => (
                          <div key={ri} className="flex pl-6">
                            <div className="flex-1 border-r border-[#2d2d35]">
                              <DiffLineCell line={row.left} />
                            </div>
                            <DiffLineCell line={row.right} />
                          </div>
                        ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
