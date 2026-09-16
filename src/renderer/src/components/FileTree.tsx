// src/renderer/src/components/FileTree.tsx
// Recursive, lazily-loaded file-tree browser for the Dashboard sidebar.
// Each folder's children are fetched only when expanded (window.gitAPI.
// listDirectory), rather than reading the whole repo tree up front.

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, FileCode, FileText, Folder, FolderOpen } from 'lucide-react'
import { cn } from '../lib/cn'
import { getStatusInfo } from '../lib/file-status'

interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  isIgnored: boolean
}

export interface FileStatusMap {
  [path: string]: { workingDir: string; index: string }
}

interface FileTreeProps {
  repoPath: string
  statusByPath: FileStatusMap
}

export default function FileTree({ repoPath, statusByPath }: FileTreeProps): React.JSX.Element {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (path: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const { data: rootEntries, isLoading } = useQuery({
    queryKey: ['dirListing', repoPath, ''],
    queryFn: () => window.gitAPI.listDirectory(repoPath, '')
  })

  if (isLoading) {
    return <p className="text-xs text-slate-600 px-2 py-1">Loading files...</p>
  }

  return (
    <div className="space-y-0.5">
      {(rootEntries || []).map((entry) => (
        <FileTreeNode
          key={entry.path}
          repoPath={repoPath}
          entry={entry}
          depth={0}
          expanded={expanded}
          onToggle={toggle}
          statusByPath={statusByPath}
        />
      ))}
    </div>
  )
}

function FileTreeNode({
  repoPath,
  entry,
  depth,
  expanded,
  onToggle,
  statusByPath
}: {
  repoPath: string
  entry: DirEntry
  depth: number
  expanded: Set<string>
  onToggle: (path: string) => void
  statusByPath: FileStatusMap
}): React.JSX.Element {
  const isOpen = expanded.has(entry.path)
  const indent = { paddingLeft: 8 + depth * 16 }

  const { data: children } = useQuery({
    queryKey: ['dirListing', repoPath, entry.path],
    queryFn: () => window.gitAPI.listDirectory(repoPath, entry.path),
    enabled: entry.isDirectory && isOpen
  })

  if (entry.isDirectory) {
    return (
      <div>
        <button
          onClick={() => onToggle(entry.path)}
          style={indent}
          className={cn(
            'flex w-full items-center gap-1.5 rounded py-1 pr-2 text-sm text-slate-300 hover:bg-white/5',
            entry.isIgnored && 'opacity-40'
          )}
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
          )}
          <span className="truncate">{entry.name}</span>
        </button>
        {isOpen &&
          (children || []).map((child) => (
            <FileTreeNode
              key={child.path}
              repoPath={repoPath}
              entry={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              statusByPath={statusByPath}
            />
          ))}
      </div>
    )
  }

  const status = statusByPath[entry.path]
  const info = status ? getStatusInfo(status.workingDir, status.index) : null

  return (
    <div
      style={indent}
      className={cn(
        'flex items-center gap-2 rounded py-1 pr-2 text-[13px] text-slate-400 hover:bg-white/5 cursor-pointer',
        entry.isIgnored && 'opacity-40'
      )}
    >
      {/* Spacer matches the chevron's width so file names line up with folder names */}
      <span className="h-3.5 w-3.5 shrink-0" />
      {entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') ? (
        <FileCode className="h-3.5 w-3.5 shrink-0 text-cyan-400/80" />
      ) : (
        <FileText className="h-3.5 w-3.5 shrink-0 text-yellow-400/80" />
      )}
      <span className="truncate flex-1">{entry.name}</span>
      {info && (
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold',
            info.bg,
            info.text
          )}
        >
          {info.letter}
        </span>
      )}
    </div>
  )
}
