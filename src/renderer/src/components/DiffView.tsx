// src/renderer/src/components/DiffView.tsx
// Shared per-file unified/split diff renderer — used by both the Commit
// Details screen and the Dashboard's "Files" tab (diff for whatever commit
// is selected in the Graph tab).

import { useState } from 'react'
import { FileCode, FilePlus, FileMinus, Loader2 } from 'lucide-react'
import { cn } from '../lib/cn'
import { toSplitRows, type DiffFile, type DiffLine } from '../lib/diff-parser'

interface DiffViewProps {
  files: DiffFile[]
  isLoading?: boolean
  emptyMessage?: string
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
      <span className="w-10 shrink-0 text-right pr-2 select-none text-slate-600">
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

export default function DiffView({
  files,
  isLoading = false,
  emptyMessage = 'No changes'
}: DiffViewProps): React.JSX.Element {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified')

  return (
    <div>
      {/* Toolbar */}
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
              viewMode === 'split' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-white/5'
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
        <p className="text-sm text-slate-600 text-center py-16">{emptyMessage}</p>
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
  )
}
