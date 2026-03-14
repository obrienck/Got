import { ArrowDown, ArrowUp, Plus, Settings } from 'lucide-react'

interface ToolbarProps {
  branch: string
  onPull?: () => void
  onPush?: () => void
  onNewBranch?: () => void
}

export default function Toolbar({
  branch,
  onPull,
  onPush,
  onNewBranch
}: ToolbarProps): React.JSX.Element {
  return (
    <header
      className="h-14 border-b border-git-border bg-git-panel flex items-center justify-between px-4 z-50"
      data-purpose="main-header"
    >
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-white font-semibold">
          <svg
            className="w-6 h-6 text-git-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            ></path>
          </svg>
          <span>Got</span>
        </div>
        <div className="h-6 w-px bg-git-border"></div>
        <div className="flex space-x-2">
          <button
            onClick={onPull}
            className="px-3 py-1 bg-git-dark hover:bg-slate-700 rounded text-xs border border-git-border flex items-center gap-2 transition-colors"
          >
            <ArrowDown className="w-4 h-4" /> Pull
          </button>
          <button
            onClick={onPush}
            className="px-3 py-1 bg-git-dark hover:bg-slate-700 rounded text-xs border border-git-border flex items-center gap-2 transition-colors"
          >
            <ArrowUp className="w-4 h-4" /> Push
          </button>
          <button
            onClick={onNewBranch}
            className="px-3 py-1 bg-git-accent text-white font-medium hover:opacity-90 rounded text-xs flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Branch
          </button>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-xs text-git-text bg-git-dark px-3 py-1 rounded border border-git-border mono">
          {branch} <span className="text-gray-500">•</span> origin/{branch}
        </div>
        <button className="p-2 hover:bg-git-border rounded-full text-git-text transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
