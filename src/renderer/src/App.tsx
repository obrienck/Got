import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GitBranch, Search, RefreshCw, FolderGit2, CheckCircle2, Clock } from 'lucide-react'

const { gitAPI } = window as any

export default function App() {
  const [repoPath, setRepoPath] = useState<string>('/Users/chrisobrien/Documents/GitHub/Got')
  const [searchInput, setSearchInput] = useState<string>(repoPath)

  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['status', repoPath],
    queryFn: () => gitAPI.status(repoPath)
  })

  const {
    data: history,
    isLoading: historyLoading,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['log', repoPath],
    queryFn: () => gitAPI.log(repoPath)
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setRepoPath(searchInput)
  }

  const handleRefresh = () => {
    refetchStatus()
    refetchHistory()
  }

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar */}
      <aside className="w-72 border-r border-zinc-800/60 bg-zinc-900/50 flex flex-col backdrop-blur-xl">
        <div className="p-4 border-b border-zinc-800/60 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <GitBranch size={18} />
          </div>
          <div>
            <h1 className="font-semibold text-zinc-100 leading-tight">Got Client</h1>
            <p className="text-xs text-zinc-500">v1.0.0 Experimental</p>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Open Repository
          </h2>
          <form onSubmit={handleSearch} className="relative group">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-zinc-600"
              placeholder="/path/to/repo"
            />
          </form>

          {status && (
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md hover:bg-zinc-800/50 text-zinc-300">
                <FolderGit2 size={16} className="text-emerald-400" />
                <span className="truncate">{repoPath.split('/').pop() || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md hover:bg-zinc-800/50 text-zinc-300">
                <GitBranch size={16} className="text-indigo-400" />
                <span className="truncate">{status.current}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800/60">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-2 bg-zinc-800/50 hover:bg-zinc-800 text-sm font-medium py-2 rounded-md transition-all active:scale-[0.98]"
          >
            <RefreshCw size={14} className={(statusLoading || historyLoading) ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#0a0a0c] relative isolate overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        <header className="h-14 border-b border-zinc-800/60 flex items-center px-6 justify-between shrink-0 bg-zinc-900/20 backdrop-blur-sm">
          <h2 className="font-semibold text-zinc-200">History</h2>
          {status && (
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-zinc-400">
                {status.modified.length > 0 ? (
                  <><span className="w-2 h-2 rounded-full bg-amber-500" /> {status.modified.length} modified</>
                ) : (
                  <><CheckCircle2 size={14} className="text-emerald-500" /> Working tree clean</>
                )}
              </span>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {historyLoading ? (
            <div className="flex items-center justify-center h-full text-zinc-500 gap-2">
              <RefreshCw size={16} className="animate-spin" /> Loading commits...
            </div>
          ) : history?.all ? (
            <div className="flex flex-col gap-1 relative before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-zinc-800/80">
              {history.all.map((commit: any) => (
                <div key={commit.hash} className="group flex items-start gap-4 py-2 relative">
                  <div className="relative z-10 w-10 flex flex-col items-center mt-1">
                    <div className="w-2.5 h-2.5 rounded-full border-[2px] border-[#0a0a0c] ring-1 ring-zinc-700 bg-zinc-600 group-hover:bg-indigo-400 group-hover:ring-indigo-400 transition-colors" />
                  </div>
                  <div className="flex-1 bg-zinc-900/30 hover:bg-zinc-800/40 border border-zinc-800/40 hover:border-zinc-700/50 rounded-lg p-3 transition-colors backdrop-blur-[2px]">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-zinc-200">{commit.message}</h3>
                      <span className="text-xs font-mono text-zinc-500">{commit.hash.substring(0, 7)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[8px] uppercase">
                          {commit.author_name.charAt(0)}
                        </div>
                        {commit.author_name}
                      </span>
                      <span className="flex items-center gap-1 opacity-70">
                        <Clock size={12} />
                        {new Date(commit.date).toLocaleDateString()} {new Date(commit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500">
              No commit history found or invalid repository path.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
