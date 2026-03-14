import React, { useState, useEffect, useRef } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  GitPullRequest,
  ArrowDownToLine,
  ArrowUpToLine,
  Settings,
  Plus,
  ChevronRight,
  ChevronDown,
  FileText,
  FileCode,
  FolderOpen,
  Terminal,
  Check,
  Search,
  MoreVertical,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils & Types ---

/** Utility to merge tailwind classes safely */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Global interface for the gitAPI
declare global {
  interface Window {
    gitAPI: {
      status: (repoPath: string) => Promise<any>;
      log: (repoPath: string, options?: any) => Promise<any>;
      commit: (repoPath: string, message: string, files?: string[]) => Promise<any>;
      stage: (repoPath: string, file: string) => Promise<any>;
      unstage: (repoPath: string, file: string) => Promise<any>;
      checkout: (repoPath: string, branch: string) => Promise<any>;
      onProgress: (callback: (progress: any) => void) => void;
      pull?: (repoPath: string) => Promise<any>;
      push?: (repoPath: string) => Promise<any>;
    };
  }
}

// Mocking useRepoContext for this file as requested
const useRepoContext = () => {
  return { currentRepoPath: '/mock/path/to/repo' };
};

// --- Inline UI Components (shadcn-like) ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost' | 'outline' | 'secondary', size?: 'default' | 'sm' | 'icon' }>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm',
    ghost: 'hover:bg-slate-800 text-slate-300 hover:text-white',
    outline: 'border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300',
    secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700'
  };
  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    icon: 'h-8 w-8 justify-center'
  };
  return (
    <button
      ref={ref}
      className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50', variants[variant], sizes[size], className)}
      {...props}
    />
  );
});
Button.displayName = 'Button';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn('flex h-9 w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-1 text-sm text-slate-200 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50', className)}
    {...props}
  />
));
Input.displayName = 'Input';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn('flex min-h-[60px] w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50', className)}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <div className="flex items-center">
    <input
      type="checkbox"
      ref={ref}
      className={cn('peer h-4 w-4 shrink-0 rounded-sm border border-slate-500 bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-indigo-500 checked:text-white', className)}
      {...props}
    />
  </div>
));
Checkbox.displayName = 'Checkbox';

const ScrollArea = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('overflow-y-auto overflow-x-hidden custom-scrollbar', className)}>
    {children}
  </div>
);

// --- Hooks ---

function useGitStatus(repoPath: string) {
  return useQuery({
    queryKey: ['git-status', repoPath],
    queryFn: async () => {
      if (window.gitAPI?.status) return window.gitAPI.status(repoPath);
      // Fallback mock data if API not fully available
      return {
        modified: ['src/App.tsx', 'src/index.css'],
        not_added: ['public/new-asset.png'],
        deleted: [],
        staged: ['package.json', 'package-lock.json'],
      };
    },
    refetchInterval: false,
  });
}

function useCommitGraph(repoPath: string) {
  return useQuery({
    queryKey: ['git-log', repoPath],
    queryFn: async () => {
      if (window.gitAPI?.log) return window.gitAPI.log(repoPath, { '--all': true, '--graph': true, '--pretty': 'format:%h|%s|%an|%ad' });
      
      // Mock log data matching the mockup lines if window.gitAPI is not available
      return {
        all: [
          { hash: 'a1b2c3d', message: 'Merge pull request #42', author_name: 'Alex Dev', date: '2 hours ago', refs: 'HEAD -> main, origin/main', graphColor: '#a855f7' },
          { hash: 'e5f6g7h', message: 'Fix UI overflow on smaller screens', author_name: 'Sam Smith', date: '3 hours ago', refs: 'fix/ui-overflow', graphColor: '#f43f5e' },
          { hash: 'i9j0k1l', message: 'Implement authentication hooks', author_name: 'Alex Dev', date: 'Yesterday', refs: 'feature/auth-hooks', graphColor: '#22d3ee' },
          { hash: 'm2n3o4p', message: 'Update dependencies and clean up', author_name: 'Chris', date: 'Yesterday', refs: '', graphColor: '#a855f7' },
          { hash: 'q5r6s7t', message: 'Initial layout setup for open repo screen', author_name: 'Alex Dev', date: '2 days ago', refs: '', graphColor: '#a855f7' },
        ],
      };
    },
    refetchInterval: false,
  });
}

// --- Main Component ---

export default function RepositoryView() {
  const { currentRepoPath } = useRepoContext();
  const queryClient = useQueryClient();
  const summaryRef = useRef<HTMLInputElement>(null);

  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState('Graph');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ src: true, public: true });
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);

  // Queries
  const { data: statusData, isLoading: isLoadingStatus } = useGitStatus(currentRepoPath);
  const { data: logData, isLoading: isLoadingLog } = useCommitGraph(currentRepoPath);

  // Mutations
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['git-status', currentRepoPath] });
    queryClient.invalidateQueries({ queryKey: ['git-log', currentRepoPath] });
  };

  const commitMutation = useMutation({
    mutationFn: async ({ sum, desc }: { sum: string; desc: string }) => {
      if (window.gitAPI?.commit) {
        // Assume unstaged changes are committed or we manage them elsewhere
        return window.gitAPI.commit(currentRepoPath, sum + '\n\n' + desc);
      }
      return new Promise(resolve => setTimeout(resolve, 500)); // mock delay
    },
    onSuccess: () => {
      setSummary('');
      setDescription('');
      invalidateQueries();
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (branch: string) => {
      if (window.gitAPI?.checkout) return window.gitAPI.checkout(currentRepoPath, branch);
      return new Promise(resolve => setTimeout(resolve, 300));
    },
    onSuccess: () => {
      invalidateQueries();
    },
  });

  const toggleFolder = (folder: string) => setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (summary.trim()) {
          commitMutation.mutate({ sum: summary, desc: description });
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        summaryRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [summary, description, commitMutation]);

  // Derived mock data for UI visual fidelity according to mockup
  const filesStaged = statusData?.staged || ['src/App.tsx', 'index.css'];
  const filesUnstaged = statusData?.modified || ['package.json', 'README.md', 'tailwind.config.js'];

  return (
    <div className="dark flex h-screen w-full flex-col bg-[#0f0f12] text-slate-300 font-sans selection:bg-indigo-500/30">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
      
      {/* Top Bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#2d2d35] bg-[#1a1a1f] px-4 shadow-sm z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-white cursor-pointer hover:bg-white/5 px-2 py-1 rounded transition-colors">
            <span className="text-indigo-400">{'</>'}</span>
            Got
          </div>
          <div className="flex items-center gap-1.5 border-l border-[#33333d] pl-6">
            <Button variant="ghost" size="sm" className="gap-2 px-2.5 hover:bg-slate-800">
              <ArrowDownToLine className="h-4 w-4" /> Pull
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 px-2.5 hover:bg-slate-800">
              <ArrowUpToLine className="h-4 w-4" /> Push
            </Button>
            <Button size="sm" className="ml-2 gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium border-0 px-3">
              <GitPullRequest className="h-4 w-4" /> Branch
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 rounded-full border border-[#33333d] bg-[#0f0f12] px-3 py-1 text-xs">
            <GitPullRequest className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-semibold text-white">main</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">origin/main</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="flex w-[280px] shrink-0 flex-col border-r border-[#2d2d35] bg-[#1a1a1f]">
          <div className="flex h-10 items-center justify-between px-4">
            <h2 className="text-[11px] font-bold tracking-wider text-slate-500">REPOSITORY</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 px-2 pb-4">
            {/* File Tree Mock */}
            <div className="space-y-0.5 mt-1">
              <div>
                <button onClick={() => toggleFolder('src')} className="flex w-full items-center gap-1.5 rounded bg-white/5 py-1 px-2 text-sm text-slate-200">
                  <ChevronDown className="h-3.5 w-3.5" />
                  <FolderOpen className="h-3.5 w-3.5 text-indigo-400" />
                  src/
                </button>
                {expandedFolders.src && (
                  <div className="ml-5 flex flex-col gap-0.5 border-l border-[#33333d] pl-1.5 mt-0.5">
                    <div className="flex items-center gap-2 rounded py-1 px-2 text-[13px] text-slate-400 hover:bg-white/5 cursor-pointer">
                      <FileCode className="h-3.5 w-3.5 text-cyan-400/80" /> App.tsx
                    </div>
                    <div className="flex items-center gap-2 rounded py-1 px-2 text-[13px] text-slate-400 hover:bg-white/5 cursor-pointer">
                      <FileText className="h-3.5 w-3.5 text-yellow-400/80" /> index.css
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-1">
                <button onClick={() => toggleFolder('public')} className="flex w-full items-center gap-1.5 rounded py-1 px-2 text-sm text-slate-300 hover:bg-white/5">
                  {expandedFolders.public ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  <FolderOpen className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  public/
                </button>
                {expandedFolders.public && (
                  <div className="ml-5 flex flex-col gap-0.5 border-l border-[#33333d] pl-1.5 mt-0.5">
                    <div className="flex items-center gap-2 rounded py-1 px-2 text-[13px] text-slate-400 hover:bg-white/5 cursor-pointer">
                      <FileText className="h-3.5 w-3.5 text-rose-400/80" /> package.json
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex h-8 items-center px-2">
                <h2 className="text-[11px] font-bold tracking-wider text-slate-500">LOCAL BRANCHES</h2>
              </div>
              <div className="flex flex-col gap-0.5">
                {[
                  { name: 'main', active: true, color: 'text-purple-400' },
                  { name: 'feature/auth-hooks', active: false, color: 'text-cyan-400' },
                  { name: 'fix/ui-overflow', active: false, color: 'text-rose-400' }
                ].map((branch) => (
                  <button 
                    key={branch.name}
                    disabled={checkoutMutation.isPending}
                    onClick={() => checkoutMutation.mutate(branch.name)}
                    className={cn(
                      "group flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors",
                      branch.active ? "bg-indigo-500/10 text-indigo-300 font-medium" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <GitPullRequest className={cn("h-3.5 w-3.5 shrink-0", branch.color)} />
                      <span className="truncate">{branch.name}</span>
                    </div>
                    {branch.active && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Center Main Area */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0f0f12]">
          {/* Tabs */}
          <div className="flex h-12 w-full shrink-0 border-b border-[#2d2d35] px-4 font-medium text-sm z-10">
            {['Graph', 'Files', 'Blame'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "relative flex items-center px-4 transition-colors",
                  activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 h-[2px] w-full bg-indigo-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Graph Content */}
          <div className="flex-1 overflow-hidden relative">
            {isLoadingLog ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-sm text-slate-500 animate-pulse">Loading graph...</div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#0f0f12]/95 backdrop-blur shadow-[0_1px_0_#2d2d35]">
                    <tr>
                      <th className="w-[120px] px-4 py-2 font-semibold text-slate-400 whitespace-nowrap">GRAPH</th>
                      <th className="px-4 py-2 font-semibold text-slate-400">MESSAGE</th>
                      <th className="w-[140px] px-4 py-2 font-semibold text-slate-400 whitespace-nowrap">AUTHOR</th>
                      <th className="w-[140px] px-4 py-2 font-semibold text-slate-400 whitespace-nowrap">DATE</th>
                      <th className="w-[80px] pl-4 pr-6 py-2 font-semibold text-slate-400 whitespace-nowrap text-right">SHA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1e24] font-mono tracking-tight">
                    {logData?.all?.map((commit: any, i: number) => {
                      const isSelected = selectedCommit === commit.hash;
                      // Determine graph color based on branch/refs loosely for visuals
                      const color = commit.graphColor || '#a855f7';
                      return (
                        <tr 
                          key={commit.hash} 
                          onClick={() => setSelectedCommit(commit.hash)}
                          className={cn(
                            "group cursor-pointer transition-colors",
                            isSelected ? "bg-indigo-500/10" : "hover:bg-white/[0.02]"
                          )}
                        >
                          <td className="px-4 py-1 relative">
                            <div className="flex justify-center h-8 items-center w-full relative">
                              {/* Central continuous line mock */}
                              <div className="absolute top-0 bottom-0 w-0.5 bg-[#2d2d35] left-1/2 -ml-[1px]" />
                              {/* Commit dot */}
                              <div 
                                className={cn("z-10 h-3 w-3 rounded-full border-[2.5px] border-[#0f0f12] ring-1 ring-offset-0", 
                                  isSelected ? "scale-125 ring-white" : "ring-transparent hover:scale-110 transition-transform"
                                )}
                                style={{ backgroundColor: color }}
                              />
                              {/* Simulated branch curvature for specific elements based on order for visual flair */}
                              {i === 1 && (
                                <svg className="absolute left-1/2 bottom-1/2 w-6 h-full -ml-[1px] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                  <path d="M1,24 Q1,12 24,1" fill="none" stroke="#f43f5e" strokeWidth="2" />
                                </svg>
                              )}
                              {i === 2 && (
                                <svg className="absolute left-1/2 top-1/2 w-8 h-full -ml-[1px] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                  <path d="M1,0 Q1,12 24,24" fill="none" stroke="#22d3ee" strokeWidth="2" />
                                </svg>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-slate-200 truncate max-w-[200px] sm:max-w-[400px]">
                            <div className="flex items-center gap-2">
                              {commit.refs && (
                                <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-sans font-bold", 
                                  commit.refs.includes('main') ? "bg-purple-500/20 text-purple-300" :
                                  commit.refs.includes('feature') ? "bg-cyan-500/20 text-cyan-300" :
                                  "bg-rose-500/20 text-rose-300"
                                )}>
                                  {commit.refs.replace('HEAD -> ', '')}
                                </span>
                              )}
                              <span className={isSelected ? "text-white" : ""}>{commit.message}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-slate-400 capitalize whitespace-nowrap">{commit.author_name}</td>
                          <td className="px-4 py-2 text-slate-400 whitespace-nowrap">{commit.date}</td>
                          <td className="pl-4 pr-6 py-2 text-slate-500 text-right w-[80px]">
                            {commit.hash.substring(0, 7)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Right Panel - Commit Info */}
        <div className="flex w-[320px] shrink-0 flex-col border-l border-[#2d2d35] bg-[#1a1a1f] shadow-xl z-20">
          <ScrollArea className="flex-1 p-4 pb-0">
            {/* Staged Section */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-400">STAGED ({filesStaged.length})</span>
              </div>
              <div className="flex flex-col gap-1">
                {filesStaged.map((f: string, i: number) => (
                  <div key={i} className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-white/5 transition-colors cursor-pointer text-slate-300">
                    <Checkbox className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500" checked onChange={() => {}} />
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-500/10 text-[11px] font-bold text-purple-400">M</span>
                    <span className="flex-1 truncate group-hover:text-white">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Unstaged Section */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-400">UNSTAGED CHANGES ({filesUnstaged.length})</span>
              </div>
              <div className="flex flex-col gap-1">
                {filesUnstaged.map((f: string, i: number) => {
                  // Mock random status
                  const statusInfo = i % 3 === 0 
                    ? { letter: 'A', bg: 'bg-green-500/10', text: 'text-green-400' }
                    : i % 2 === 0 
                      ? { letter: 'D', bg: 'bg-rose-500/10', text: 'text-rose-400' }
                      : { letter: 'M', bg: 'bg-purple-500/10', text: 'text-purple-400' };
                  
                  return (
                    <div key={i} className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-white/5 transition-colors cursor-pointer text-slate-300">
                      <Checkbox />
                      <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold", statusInfo.bg, statusInfo.text)}>
                        {statusInfo.letter}
                      </span>
                      <span className="flex-1 truncate group-hover:text-white">{f}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>

          {/* Commit Area */}
          <div className="flex flex-col gap-3 p-4 border-t border-[#2d2d35] bg-[#1a1a1f] shrink-0">
            <h3 className="text-xs font-bold tracking-wider text-slate-400">COMMIT MESSAGE</h3>
            <div className="flex flex-col gap-2 relative">
              <Input
                ref={summaryRef}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Commit summary (Cmd+K)"
                className="bg-[#0f0f12] border-[#33333d] focus-visible:ring-indigo-500 text-[13px]"
              />
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="bg-[#0f0f12] border-[#33333d] resize-none h-24 focus-visible:ring-indigo-500 text-[13px]"
              />
            </div>
            <Button 
              className="w-full h-10 gap-2 font-medium" 
              disabled={!summary.trim() || commitMutation.isPending}
              onClick={() => commitMutation.mutate({ sum: summary, desc: description })}
            >
              {commitMutation.isPending ? 'Committing...' : `Commit ${filesStaged.length} Files`}
            </Button>
          </div>
        </div>

      </div>

      {/* Bottom Right avatar & info is absolute to overlay or sit at bottom of right panel */}
      <div className="absolute bottom-3 right-[336px] items-center gap-2 hidden lg:flex bg-[#1a1a1f]/80 backdrop-blur border border-[#33333d] px-3 py-1.5 rounded-full shadow-lg">
        <div className="flex bg-indigo-500 text-white rounded-full h-6 w-6 items-center justify-center text-[10px] font-bold tracking-wide shadow-inner">
          AD
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-200 leading-tight">Alex Developer</span>
          <span className="text-[10px] text-slate-400 leading-tight">alex@example.com</span>
        </div>
      </div>
    </div>
  );
}
