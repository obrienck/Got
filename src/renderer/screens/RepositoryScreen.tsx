import { useEffect, useState } from 'react';
import { useRepoContext } from '../src/context/RepoContext';
import RepositoryView from './RepositoryView';
import { FolderOpen, History, Loader2 } from 'lucide-react';

export default function RepositoryScreen() {
  const { currentRepoPath, setCurrentRepoPath, isLoading } = useRepoContext();
  const [recentRepos, setRecentRepos] = useState<string[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const repos = await window.gitAPI.getRecentRepos();
        setRecentRepos(repos);
      } catch (err) {
        console.error('Failed to load recent repos', err);
      }
    };
    if (!currentRepoPath) {
      loadRecent();
    }
  }, [currentRepoPath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        handleOpenRepo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenRepo = async () => {
    setIsOpening(true);
    setError(null);
    try {
      const selectedPath = await window.gitAPI.selectRepository();
      if (selectedPath) {
        setCurrentRepoPath(selectedPath);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open repository');
    } finally {
      setIsOpening(false);
    }
  };

  const handleSelectRecent = (path: string) => {
    setCurrentRepoPath(path);
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0f0f12] text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (currentRepoPath) {
    return <RepositoryView />;
  }

  // Welcome Screen matches mockup specifications exactly
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f12] text-slate-200">
      <div className="w-full max-w-2xl px-6 py-12 text-center">
        {/* Big Header */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white">Open a Repository</h1>
        
        {/* Subtitle */}
        <p className="mb-10 text-lg text-slate-400">
          Select a local Git repository to get started
        </p>

        {/* Primary Button */}
        <button 
          onClick={handleOpenRepo}
          disabled={isOpening}
          className="group relative mx-auto mb-12 flex items-center justify-center gap-3 rounded-lg bg-[#6366f1] px-8 py-4 font-semibold text-white shadow-lg transition-all hover:bg-[#4f46e5] hover:shadow-indigo-500/25 disabled:opacity-70"
        >
          {isOpening ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <FolderOpen className="h-6 w-6 transition-transform group-hover:scale-110" />
          )}
          Open Local Repository
        </button>

        {/* Error Message */}
        {error && (
          <div className="mx-auto mb-8 max-w-sm rounded-md border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        {/* Recent Repositories */}
        {recentRepos.length > 0 && (
          <div className="mx-auto max-w-lg text-left">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-medium tracking-wider text-slate-500">
              <History className="h-4 w-4" />
              RECENT REPOSITORIES
            </h2>
            <div className="overflow-hidden rounded-xl border border-[#2d2d35] bg-[#1a1a1f] shadow-sm">
              {recentRepos.map((repoPath, index) => {
                const parts = repoPath.split(/\\|\//);
                const name = parts[parts.length - 1];
                return (
                  <button
                    key={repoPath}
                    onClick={() => handleSelectRecent(repoPath)}
                    className={`flex w-full flex-col items-start p-4 text-left transition-colors hover:bg-white/5 ${
                      index < recentRepos.length - 1 ? 'border-b border-[#2d2d35]' : ''
                    }`}
                  >
                    <span className="font-medium text-slate-200">{name}</span>
                    <span className="truncate w-full text-xs text-slate-500">{repoPath}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
