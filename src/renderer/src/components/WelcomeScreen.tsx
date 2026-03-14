import { Search, FolderGit2, ExternalLink, Github, Settings, RefreshCw } from 'lucide-react'

interface RepositoryItem {
  id: string
  name: string
  path: string
  lastModified: string
  branch: string
  branchColor: string
}

const RECENT_REPOS: RepositoryItem[] = [
  {
    id: '1',
    name: 'Frontend-Dashboard-V2',
    path: '~/Projects/work/nexus-frontend',
    lastModified: '2 hours ago',
    branch: 'Main',
    branchColor: 'text-brand-primary'
  },
  {
    id: '2',
    name: 'Personal-Portfolio-2024',
    path: '~/Documents/Dev/Portfolio',
    lastModified: 'yesterday',
    branch: 'Production',
    branchColor: 'text-green-500'
  },
  {
    id: '3',
    name: 'OpenSource-Library-Core',
    path: '~/Downloads/Source/lib-core',
    lastModified: '5 days ago',
    branch: 'Develop',
    branchColor: 'text-slate-500'
  }
]

interface WelcomeScreenProps {
  onOpenRepo: (path: string) => void
}

export default function WelcomeScreen({ onOpenRepo }: WelcomeScreenProps): React.JSX.Element {
  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-[#e2e8f0]">
      <main className="flex-grow flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl w-full space-y-12">
          {/* Header Section */}
          <header className="text-center space-y-4">
            <div className="inline-block p-3 rounded-2xl bg-brand-primary/10 mb-2">
              <svg
                className="w-12 h-12 text-brand-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></path>
              </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Welcome to Got</h1>
            <p className="text-slate-400 text-lg">
              Streamline your workflow with powerful repository management.
            </p>
          </header>

          {/* Quick Actions */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Open Repository */}
            <button
              onClick={() => onOpenRepo('')}
              className="group relative flex flex-col items-center p-8 rounded-2xl bg-brand-card border border-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-primary/20 gradient-border-hover border-2"
            >
              <div className="mb-4">
                <svg
                  className="w-10 h-10 action-card-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
              <span className="text-lg font-semibold text-white">Open Repository</span>
              <p className="mt-2 text-sm text-slate-400 text-center">
                Open an existing local Git repository
              </p>
            </button>

            {/* Clone Repository */}
            <button className="group relative flex flex-col items-center p-8 rounded-2xl bg-brand-card border border-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-secondary/20 gradient-border-hover border-2">
              <div className="mb-4">
                <svg
                  className="w-10 h-10 action-card-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
              <span className="text-lg font-semibold text-white">Clone Repository</span>
              <p className="mt-2 text-sm text-slate-400 text-center">
                Clone from GitHub, GitLab, or Bitbucket
              </p>
            </button>

            {/* New Repository */}
            <button className="group relative flex flex-col items-center p-8 rounded-2xl bg-brand-card border border-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 gradient-border-hover border-2">
              <div className="mb-4">
                <svg
                  className="w-10 h-10 action-card-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4v16m8-8H4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
              <span className="text-lg font-semibold text-white">Init New Repo</span>
              <p className="mt-2 text-sm text-slate-400 text-center">
                Create a new local Git repository
              </p>
            </button>
          </section>

          {/* Recent Repositories */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-medium text-slate-200">Recent Repositories</h2>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-slate-500" />
                </div>
                <input
                  className="bg-slate-800 border-none rounded-lg text-sm pl-10 pr-4 py-2 w-64 focus:ring-2 focus:ring-brand-primary placeholder:text-slate-500"
                  placeholder="Search recents..."
                  type="text"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {RECENT_REPOS.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => onOpenRepo(repo.path)}
                  className="group flex items-center justify-between py-4 px-2 hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-brand-primary/20 transition-colors">
                      <FolderGit2 className="w-6 h-6 text-slate-400 group-hover:text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-100">{repo.name}</h3>
                      <p className="text-xs text-slate-500">{repo.path}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Modified {repo.lastModified}</p>
                    <span
                      className={`text-[10px] uppercase tracking-wider ${repo.branchColor} font-bold`}
                    >
                      {repo.branch}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Links */}
            <div className="pt-6 flex justify-center space-x-8 text-xs text-slate-500">
              <a
                href="#"
                className="flex items-center gap-1 hover:text-brand-primary transition-colors"
              >
                <ExternalLink size={12} /> Documentation
              </a>
              <a
                href="#"
                className="flex items-center gap-1 hover:text-brand-primary transition-colors"
              >
                <Github size={12} /> GitHub Integration
              </a>
              <a
                href="#"
                className="flex items-center gap-1 hover:text-brand-primary transition-colors"
              >
                <Settings size={12} /> Settings
              </a>
              <a
                href="#"
                className="flex items-center gap-1 hover:text-brand-primary transition-colors"
              >
                <RefreshCw size={12} /> Check for Updates
              </a>
            </div>
          </section>
        </div>
      </main>

      <footer className="p-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
        <div>Got v1.4.2 - Stable</div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>Connected to Cloud Sync</span>
        </div>
      </footer>
    </div>
  )
}
