import { useState } from 'react'

interface FileChange {
  path: string
  status: 'M' | 'A' | 'D'
}

interface SidebarRightProps {
  unstaged: FileChange[]
  stagedCount: number
  onCommit: (message: string, description: string) => void
}

export default function SidebarRight({
  unstaged,
  stagedCount,
  onCommit
}: SidebarRightProps): React.JSX.Element {
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')

  const handleCommit = (): void => {
    if (summary.trim()) {
      onCommit(summary, description)
      setSummary('')
      setDescription('')
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'M':
        return 'text-git-commit-hotfix'
      case 'A':
        return 'text-green-400'
      case 'D':
        return 'text-gray-400'
      default:
        return 'text-white'
    }
  }

  return (
    <aside
      className="w-80 border-l border-git-border bg-git-panel flex flex-col shrink-0"
      data-purpose="right-sidebar"
    >
      <div className="p-3 border-b border-git-border flex justify-between items-center bg-git-dark/40">
        <span className="text-xs font-bold tracking-wider uppercase">Commit Info</span>
        <button className="text-xs text-git-accent hover:underline">Staged ({stagedCount})</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs opacity-60 font-semibold uppercase">Unstaged Changes</span>
            <span className="text-[10px] bg-slate-700 px-1 rounded">{unstaged.length} files</span>
          </div>
          <div className="space-y-2">
            {unstaged.map((file) => (
              <div key={file.path} className="flex items-center text-xs group">
                <input
                  className="rounded border-git-border bg-git-dark text-git-accent focus:ring-git-accent mr-3 h-3.5 w-3.5"
                  type="checkbox"
                />
                <span className={`${getStatusColor(file.status)} mr-2 font-bold w-3`}>
                  {file.status}
                </span>
                <span className="flex-1 truncate opacity-90 group-hover:opacity-100">
                  {file.path}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="h-px bg-git-border mx-4"></div>
        <div className="p-4 space-y-3">
          <label className="block">
            <span className="text-xs opacity-60 mb-1 block font-medium">Commit Message</span>
            <textarea
              className="w-full bg-git-dark border border-git-border rounded-md text-sm p-2 focus:ring-1 focus:ring-git-accent outline-none h-24 resize-none transition-all"
              placeholder="Summary (required)"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            ></textarea>
          </label>
          <textarea
            className="w-full bg-git-dark border border-git-border rounded-md text-xs p-2 focus:ring-1 focus:ring-git-accent outline-none h-20 resize-none transition-all"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
          <button
            onClick={handleCommit}
            disabled={!summary.trim()}
            className="w-full py-2 bg-git-accent text-white font-bold rounded-md text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Commit {unstaged.length} Files
          </button>
        </div>
      </div>
      <div className="p-3 border-t border-git-border bg-git-dark/40 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
          AD
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white truncate">Alex Developer</div>
          <div className="text-[10px] text-git-text truncate">alex@example.com</div>
        </div>
      </div>
    </aside>
  )
}
