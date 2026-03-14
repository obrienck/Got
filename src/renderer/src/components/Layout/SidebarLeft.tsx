import { Folder, FileCode, FileText, Plus } from 'lucide-react'

interface SidebarLeftProps {
  currentBranch: string
  branches?: string[]
}

export default function SidebarLeft({
  currentBranch,
  branches = ['main']
}: SidebarLeftProps): React.JSX.Element {
  return (
    <aside
      className="w-64 border-r border-git-border bg-git-dark flex flex-col shrink-0"
      data-purpose="left-sidebar"
    >
      <div className="p-4 border-b border-git-border flex justify-between items-center">
        <span className="text-xs font-bold tracking-wider uppercase">Repository</span>
        <Plus className="w-4 h-4 cursor-pointer hover:text-white" />
      </div>
      <div className="flex-1 overflow-y-auto p-2 text-sm">
        {/* Mock File Tree */}
        <div className="space-y-1">
          <div className="flex items-center p-1 hover:bg-git-panel rounded cursor-pointer text-git-accent">
            <Folder className="w-4 h-4 mr-2" fill="currentColor" />
            <span>src/</span>
          </div>
          <div className="ml-4 space-y-1">
            <div className="flex items-center p-1 hover:bg-git-panel rounded cursor-pointer">
              <FileCode className="w-4 h-4 mr-2 opacity-60" />
              <span>App.tsx</span>
            </div>
            <div className="flex items-center p-1 hover:bg-git-panel rounded cursor-pointer">
              <FileText className="w-4 h-4 mr-2 opacity-60" />
              <span>index.css</span>
            </div>
          </div>
          <div className="flex items-center p-1 hover:bg-git-panel rounded cursor-pointer">
            <Folder className="w-4 h-4 mr-2" fill="currentColor" />
            <span>public/</span>
          </div>
          <div className="flex items-center p-1 hover:bg-git-panel rounded cursor-pointer opacity-70">
            <FileCode className="w-4 h-4 mr-2" />
            <span>package.json</span>
          </div>
        </div>

        <div className="mt-8 border-t border-git-border pt-4">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 mb-2 block opacity-50">
            Local Branches
          </span>
          {branches.map((branch) => (
            <div
              key={branch}
              className={`px-2 py-1 rounded text-xs mb-1 cursor-pointer transition-colors ${
                branch === currentBranch
                  ? 'bg-git-accent/10 text-git-accent'
                  : 'opacity-70 hover:bg-git-panel'
              }`}
            >
              {branch}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
