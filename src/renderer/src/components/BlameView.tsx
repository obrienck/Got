// src/renderer/src/components/BlameView.tsx
// Per-line git blame: groups consecutive lines from the same commit,
// showing author/date/hash once per group (GitHub-style), with a
// continuous line-number + content column alongside.

import { Loader2 } from 'lucide-react'
import { cn } from '../lib/cn'
import { formatRelativeTime } from '../lib/format-time'
import type { BlameLine } from '../lib/blame-parser'

interface BlameViewProps {
  lines: BlameLine[]
  isLoading?: boolean
  filePath?: string
}

export default function BlameView({
  lines,
  isLoading = false,
  filePath
}: BlameViewProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading blame...
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <p className="text-sm text-slate-600 text-center py-16">
        {filePath ? 'No blame data for this file' : 'Select a file in the sidebar to view blame'}
      </p>
    )
  }

  return (
    <div className="font-mono text-[12px] leading-5">
      {filePath && (
        <div className="px-4 py-2 border-b border-[#2d2d35] bg-[#1a1a1f]/50 sticky top-0 z-10 text-slate-300 truncate">
          {filePath}
        </div>
      )}
      {lines.map((line, i) => {
        const isNewGroup = i === 0 || lines[i - 1].hash !== line.hash
        return (
          <div key={i} className="flex hover:bg-white/[0.02]">
            <div
              className={cn(
                'w-[260px] shrink-0 border-r border-[#2d2d35] px-3 py-0.5 truncate',
                !isNewGroup && 'invisible'
              )}
              title={line.summary}
            >
              <span className="text-slate-300">{line.author}</span>{' '}
              <span className="text-slate-600">{formatRelativeTime(line.date)}</span>{' '}
              <span className="text-slate-700">{line.hash.substring(0, 7)}</span>
            </div>
            <div className="w-10 shrink-0 text-right pr-2 text-slate-600 select-none">
              {line.line}
            </div>
            <div className="min-w-0 flex-1 whitespace-pre text-slate-300 px-2">{line.content}</div>
          </div>
        )
      })}
    </div>
  )
}
