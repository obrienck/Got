// src/renderer/src/components/repository/SynthRepositoryView.tsx
// 1980s synthwave/CRT skin for the main repository view — same live data and
// mutations as NormalRepositoryView, reskinned chrome (header, sidebars,
// tabs, panels, buttons). The file tree / diff / blame sub-widgets keep
// their normal styling — they're complex components the Stitch mockup
// didn't cover, and they still read fine inside the retro shell.

import React from 'react'
import { Terminal, Plus, Loader2, Settings, Save } from 'lucide-react'
import { cn } from '../../lib/cn'
import { initialsFor, avatarColorFor } from '../../lib/avatar'
import { IS_MAC, DRAG_REGION, NO_DRAG } from '../../lib/platform'
import { getStatusInfo } from '../../lib/file-status'
import FileTree from '../FileTree'
import DiffView from '../DiffView'
import BlameView from '../BlameView'
import ThemeToggle from '../ThemeToggle'
import { laneX, edgeY, edgePath, ROW_HEIGHT } from './graph-geometry'
import type { RepositoryViewContentProps } from './types'

const TABS = ['Graph', 'Files', 'Blame']

export default function SynthRepositoryView(props: RepositoryViewContentProps): React.JSX.Element {
  const {
    theme,
    setTheme,
    onSwitchRepo,
    repoName,
    remoteHost,
    currentBranch,
    tracking,
    summary,
    setSummary,
    description,
    setDescription,
    summaryRef,
    commitMutation,
    activeTab,
    setActiveTab,
    repoPath,
    selectedFilePath,
    setSelectedFilePath,
    statusByPath,
    branches,
    branchColors,
    checkoutMutation,
    setShowBranchManager,
    pullMutation,
    pushMutation,
    isLoadingLog,
    logData,
    graphCommits,
    graphLayout,
    graphWidth,
    selectedCommit,
    setSelectedCommit,
    setViewingCommitHash,
    filesTabDiff,
    isLoadingFilesTabDiff,
    blameLines,
    isLoadingBlame,
    isLoadingStatus,
    stagedFiles,
    allUnstaged,
    stageMutation,
    unstageMutation,
    userConfig
  } = props

  return (
    <div
      className="flex h-screen w-full flex-col font-mono crt-scanlines overflow-hidden"
      style={{ background: '#0d0221', color: '#ecdcff' }}
    >
      {/* Top Bar */}
      <div
        className={cn('flex h-14 shrink-0 items-center justify-between px-4 z-10', DRAG_REGION)}
        style={{
          background: '#140727',
          borderBottom: '2px solid #ff007f',
          boxShadow: '0 4px 20px rgba(255,0,127,0.2)'
        }}
      >
        <div className={cn('flex items-center gap-4', IS_MAC && 'pl-16')}>
          <button
            onClick={onSwitchRepo}
            title="Switch repository"
            className={cn('flex items-center gap-2 tracking-widest font-bold', NO_DRAG)}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded border border-[#ff007f] bg-[#ff007f]/20 text-[#ff007f] neon-glow-pink">
              <Terminal className="h-4 w-4" />
            </div>
            <span className="bg-gradient-to-r from-[#ff007f] via-[#ffd9e1] to-[#00f0ff] bg-clip-text text-transparent neon-text-pink">
              GOT
            </span>
            <span className="rounded border border-[#ff007f]/60 bg-[#ff007f]/20 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-[#ffb1c4]">
              v1.4.2 [80s EDITION]
            </span>
          </button>
          <div className="h-6 w-px bg-[#5c3f46]" />
          <div className={cn('flex gap-2', NO_DRAG)}>
            <button
              onClick={() => pullMutation.mutate()}
              disabled={pullMutation.isPending}
              className="flex items-center gap-1.5 rounded border border-[#00f0ff]/40 bg-[#211536] px-3 py-1 text-xs text-[#d3fbff] transition-all hover:bg-[#302445] disabled:opacity-60"
            >
              {pullMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className="text-[#00f0ff]">▼</span>
              )}
              Pull
            </button>
            <button
              onClick={() => pushMutation.mutate()}
              disabled={pushMutation.isPending}
              className="flex items-center gap-1.5 rounded border border-[#ff007f]/40 bg-[#211536] px-3 py-1 text-xs text-[#ffd9e1] transition-all hover:bg-[#302445] disabled:opacity-60"
            >
              {pushMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className="text-[#ff007f]">▲</span>
              )}
              Push
            </button>
            <button
              onClick={() => setShowBranchManager(true)}
              className="flex items-center gap-1.5 rounded bg-gradient-to-r from-[#ff007f] to-[#ba005b] px-3 py-1 text-xs font-bold text-white shadow-lg shadow-[#ff007f]/30 transition-all hover:brightness-125"
            >
              <span className="text-[#fde400]">+</span> Branch
            </button>
          </div>
        </div>

        <div className={cn('flex items-center gap-3', NO_DRAG)}>
          <ThemeToggle theme={theme} onChange={setTheme} />
          <div className="flex items-center gap-1.5 rounded border border-[#00f0ff]/40 bg-[#140727] px-3 py-1 text-xs text-[#00f0ff]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#39ff14]" />
            {currentBranch} {tracking && <span className="text-[#ff007f]">⟷ {tracking}</span>}
          </div>
          {remoteHost && (
            <span className="rounded border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-2 py-0.5 text-[10px] text-[#00f0ff]">
              {remoteHost}
            </span>
          )}
          <span className="max-w-[160px] truncate text-xs text-[#ac878f]" title={repoPath}>
            {repoName}
          </span>
          <button className="rounded-full border border-[#5c3f46] p-1.5 text-[#ffb1c4] transition-all hover:bg-[#3c2e50]">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className="flex h-full w-[280px] shrink-0 flex-col"
          style={{ background: '#140727', borderRight: '1px solid #3c2e50' }}
        >
          <div className="flex items-center justify-between border-b border-[#ff007f]/40 p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#ff007f] neon-text-pink">
              <span className="text-[#00f0ff]">▶</span> REPOSITORY
            </span>
            <Plus className="h-4 w-4 cursor-pointer text-[#00f0ff] transition-all hover:text-white" />
          </div>

          <div className="flex-1 overflow-y-auto p-2 text-sm">
            <FileTree
              repoPath={repoPath}
              statusByPath={statusByPath}
              onFileClick={setSelectedFilePath}
              selectedFilePath={selectedFilePath}
            />

            <div className="mt-8 border-t border-[#ff007f]/30 pt-4">
              <span className="mb-2 block px-2 text-[10px] font-bold uppercase tracking-widest text-[#00f0ff] neon-text-cyan">
                LOCAL BRANCHES
              </span>
              <div className="flex flex-col gap-1.5">
                {branches.map((branch) => {
                  const isActive = branch === currentBranch
                  const color = branchColors[branch] || '#ff007f'
                  return (
                    <button
                      key={branch}
                      disabled={checkoutMutation.isPending || isActive}
                      onClick={() => !isActive && checkoutMutation.mutate(branch)}
                      className={cn(
                        'flex items-center justify-between rounded px-2 py-1.5 text-xs transition-colors',
                        isActive
                          ? 'border border-[#ff007f]/60 bg-[#ff007f]/20 font-bold text-[#ffb1c4] neon-glow-pink'
                          : 'text-[#ecdcff]/70 hover:bg-[#26193a] hover:text-[#00f0ff]'
                      )}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {isActive ? '★' : <span style={{ color }}>↳</span>} {branch}
                      </span>
                      {isActive && (
                        <span className="rounded bg-[#ff007f] px-1 text-[9px] uppercase text-white">
                          active
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Center Main Area — Commit Graph */}
        <section
          className="relative flex flex-1 flex-col overflow-hidden"
          style={{ background: '#0d0221' }}
        >
          <div
            className="flex h-10 shrink-0 items-center px-4 text-xs"
            style={{ background: '#190c2d', borderBottom: '1px solid #3c2e50' }}
          >
            <div className="flex gap-6 font-bold">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex h-10 items-center gap-1.5 border-b-2 transition-colors',
                    activeTab === tab
                      ? 'border-[#00f0ff] text-[#00f0ff] neon-text-cyan'
                      : 'border-transparent text-[#ac878f] hover:text-[#ffd9e1]'
                  )}
                >
                  {activeTab === tab && (
                    <span className="h-2 w-2 animate-ping rounded-full bg-[#00f0ff]" />
                  )}
                  {tab === 'Graph' ? 'GRAPH [SYNTH]' : tab.toUpperCase()}
                </button>
              ))}
            </div>
            {activeTab === 'Graph' && (
              <div className="ml-auto flex items-center gap-2 text-[11px] text-[#fde400]">
                <span className="rounded border border-[#fde400]/40 bg-[#fde400]/10 px-2 py-0.5">
                  LASER TRACKS ACTIVE
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'Graph' &&
              (isLoadingLog ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-[#00f0ff]" />
                    <span className="text-sm text-[#ac878f]">Loading commit history...</span>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead
                      className="sticky top-0 z-10"
                      style={{ background: '#140727', borderBottom: '2px solid #5c3f46' }}
                    >
                      <tr>
                        <th
                          style={{ width: graphWidth }}
                          className="p-2 font-bold text-[#00f0ff] neon-text-cyan"
                        >
                          {'// GRAPH'}
                        </th>
                        <th className="p-2 font-bold text-[#ff007f] neon-text-pink">
                          {'// MESSAGE'}
                        </th>
                        <th className="w-[140px] p-2 font-bold text-[#39ff14] neon-text-green">
                          {'// AUTHOR'}
                        </th>
                        <th className="w-[140px] p-2 font-bold text-[#dec800]">{'// DATE'}</th>
                        <th className="w-[80px] p-2 text-right font-bold text-[#d3fbff]">
                          {'// SHA'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="relative">
                      <tr>
                        <td colSpan={5} className="p-0">
                          <div
                            className="relative"
                            style={{ height: graphCommits.length * ROW_HEIGHT }}
                          >
                            <svg
                              width={graphWidth}
                              height={graphCommits.length * ROW_HEIGHT}
                              className="absolute top-0 left-0 pointer-events-none"
                              style={{ filter: 'drop-shadow(0 0 3px rgba(0,240,255,0.5))' }}
                            >
                              {graphLayout.edges.map((e, i) => (
                                <path
                                  key={i}
                                  d={edgePath(
                                    laneX(e.fromCol),
                                    edgeY(e.row, e.fromEdge),
                                    laneX(e.toCol),
                                    edgeY(e.row, e.toEdge)
                                  )}
                                  stroke={e.color}
                                  strokeWidth={2.5}
                                  fill="none"
                                />
                              ))}
                              {graphLayout.nodes.map((n) => {
                                const commit = logData?.all?.[n.row]
                                const isSelected = !!commit && selectedCommit === commit.hash
                                return (
                                  <circle
                                    key={n.row}
                                    cx={laneX(n.col)}
                                    cy={edgeY(n.row, 'center')}
                                    r={isSelected ? 5.5 : 4}
                                    fill={n.color}
                                    stroke="#0d0221"
                                    strokeWidth={2.5}
                                  />
                                )
                              })}
                            </svg>

                            {logData?.all?.map((commit: any, i: number) => {
                              const isSelected = selectedCommit === commit.hash
                              const commitDate = commit.date
                                ? new Date(commit.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : ''
                              return (
                                <div
                                  key={commit.hash}
                                  onClick={() => setSelectedCommit(commit.hash)}
                                  onDoubleClick={() => setViewingCommitHash(commit.hash)}
                                  title="Double-click to view commit details"
                                  style={{ height: ROW_HEIGHT, top: i * ROW_HEIGHT }}
                                  className={cn(
                                    'absolute left-0 right-0 flex items-center border-b border-[#3c2e50]/70 cursor-pointer transition-colors',
                                    isSelected ? 'bg-[#ff007f]/10' : 'hover:bg-[#ff007f]/5'
                                  )}
                                >
                                  <div style={{ width: graphWidth }} className="shrink-0 h-full" />
                                  <div className="min-w-0 flex-1 px-4">
                                    <div className="flex min-w-0 items-center gap-2">
                                      {commit.refs && (
                                        <span className="shrink-0 truncate rounded border border-[#ff007f]/70 bg-[#ff007f]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#ff007f]">
                                          {commit.refs.replace('HEAD -> ', '')}
                                        </span>
                                      )}
                                      <span
                                        className={cn(
                                          'min-w-0 flex-1 truncate',
                                          isSelected
                                            ? 'font-bold text-white neon-text-pink'
                                            : 'text-[#ecdcff]'
                                        )}
                                      >
                                        {commit.message}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="w-[140px] shrink-0 truncate px-2 font-medium text-[#39ff14]">
                                    {commit.author_name}
                                  </div>
                                  <div className="w-[140px] shrink-0 whitespace-nowrap px-2 text-[#dec800]">
                                    {commitDate}
                                  </div>
                                  <div className="w-[80px] shrink-0 pr-4 text-right font-bold text-[#00f0ff]">
                                    {commit.hash?.substring(0, 7)}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}

            {activeTab === 'Files' && (
              <div className="h-full overflow-y-auto">
                <DiffView
                  files={filesTabDiff}
                  isLoading={isLoadingFilesTabDiff}
                  emptyMessage={
                    selectedCommit
                      ? 'No changes in this commit'
                      : 'Select a commit in the Graph tab to see its changed files'
                  }
                />
              </div>
            )}

            {activeTab === 'Blame' && (
              <div className="h-full overflow-y-auto">
                <BlameView
                  lines={blameLines}
                  isLoading={isLoadingBlame}
                  filePath={selectedFilePath || undefined}
                />
              </div>
            )}
          </div>
        </section>

        {/* Right Panel — Staged/Unstaged + Commit */}
        <aside
          className="flex h-full w-[320px] shrink-0 flex-col"
          style={{ background: '#140727', borderLeft: '1px solid #3c2e50' }}
        >
          <div className="flex items-center justify-between border-b border-[#ff007f]/40 p-3">
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#ff007f] neon-text-pink">
              <span>⚙</span> COMMIT TERMINAL
            </span>
            <span className="rounded border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-2 py-0.5 text-xs font-bold text-[#00f0ff]">
              Staged ({stagedFiles.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00f0ff] neon-text-cyan">
                  Unstaged Changes
                </span>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-[#ff007f]/50 bg-[#3c2e50] px-1.5 py-0.2 text-[10px] font-bold text-[#ffd9e1]">
                    {allUnstaged.length} files
                  </span>
                  {allUnstaged.length > 0 && (
                    <button
                      onClick={() => stageMutation.mutate(allUnstaged.map((f: any) => f.path))}
                      disabled={stageMutation.isPending}
                      className="text-[10px] font-bold text-[#00f0ff] hover:text-white disabled:opacity-50"
                    >
                      STAGE ALL
                    </button>
                  )}
                </div>
              </div>
              {isLoadingStatus ? (
                <div className="flex items-center gap-2 py-2 text-xs text-[#ac878f]">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                </div>
              ) : allUnstaged.length === 0 ? (
                <p className="py-1 text-xs text-[#5c3f46]">Working tree clean</p>
              ) : (
                <div className="space-y-2">
                  {allUnstaged.map((f: any) => {
                    const info = getStatusInfo(f.working_dir, f.index)
                    return (
                      <div
                        key={f.path}
                        className="group flex items-center rounded p-1 text-xs hover:bg-[#26193a]"
                      >
                        <input
                          type="checkbox"
                          onChange={() => stageMutation.mutate([f.path])}
                          title="Click to stage"
                          className="mr-3 h-3.5 w-3.5 rounded border-[#00f0ff] bg-[#140727] text-[#00f0ff] focus:ring-[#00f0ff]"
                        />
                        <span
                          className={cn(
                            'mr-2 flex h-4 w-4 items-center justify-center rounded border text-[10px] font-bold',
                            info.bg,
                            info.text
                          )}
                        >
                          {info.letter}
                        </span>
                        <span className="flex-1 truncate text-[#ecdcff]">{f.path}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {stagedFiles.length > 0 && (
              <div className="px-4 pb-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ffd9e1] neon-text-pink">
                    Staged
                  </span>
                  <button
                    onClick={() => unstageMutation.mutate(stagedFiles.map((f: any) => f.path))}
                    disabled={unstageMutation.isPending}
                    className="text-[10px] font-bold text-[#ff007f] hover:text-white disabled:opacity-50"
                  >
                    UNSTAGE ALL
                  </button>
                </div>
                <div className="space-y-2">
                  {stagedFiles.map((f: any) => {
                    const info = getStatusInfo(' ', f.index)
                    return (
                      <div
                        key={f.path}
                        className="group flex items-center rounded p-1 text-xs hover:bg-[#26193a]"
                      >
                        <input
                          type="checkbox"
                          checked
                          onChange={() => unstageMutation.mutate([f.path])}
                          title="Click to unstage"
                          className="mr-3 h-3.5 w-3.5 rounded border-[#ff007f] bg-[#140727] text-[#ff007f] focus:ring-[#ff007f]"
                        />
                        <span
                          className={cn(
                            'mr-2 flex h-4 w-4 items-center justify-center rounded border text-[10px] font-bold',
                            info.bg,
                            info.text
                          )}
                        >
                          {info.letter}
                        </span>
                        <span className="flex-1 truncate text-[#ecdcff]">{f.path}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[#ff007f]/60 to-transparent" />

            <div className="space-y-3 p-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#ffd9e1] neon-text-pink">
                  Commit Message
                </span>
                <textarea
                  ref={summaryRef as unknown as React.RefObject<HTMLTextAreaElement>}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Summary (required)"
                  className="h-16 w-full resize-none rounded-md border border-[#ff007f]/50 bg-[#140727] p-2.5 text-xs text-[#00f0ff] placeholder-[#5c3f46] outline-none focus:border-[#00f0ff]"
                />
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional details...)"
                className="h-14 w-full resize-none rounded-md border border-[#3c2e50] bg-[#140727] p-2.5 text-xs text-[#ecdcff] placeholder-[#5c3f46] outline-none focus:border-[#00f0ff]"
              />
              <button
                onClick={() => commitMutation.mutate({ sum: summary, desc: description })}
                disabled={!summary.trim() || commitMutation.isPending || stagedFiles.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded bg-gradient-to-r from-[#ff007f] via-[#ba005b] to-[#00f0ff] py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-[#ff007f]/40 transition-all hover:brightness-125 active:scale-95 disabled:opacity-50 disabled:hover:brightness-100"
              >
                {commitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" /> COMMIT {stagedFiles.length} FILE
                    {stagedFiles.length !== 1 ? 'S' : ''} ⚡
                  </>
                )}
              </button>
            </div>
          </div>

          {userConfig?.name && (
            <div className="flex items-center gap-3 border-t border-[#ff007f]/40 bg-[#140727] p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-tr from-[#ff007f] to-[#00f0ff] p-0.5 neon-glow-pink">
                <div
                  className={cn(
                    'flex h-full w-full items-center justify-center rounded text-xs font-black text-[#00f0ff]',
                    avatarColorFor(userConfig.name)
                  )}
                  style={{ background: '#140727' }}
                >
                  {initialsFor(userConfig.name)}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-[#ffd9e1] neon-text-pink">
                  {userConfig.name}
                </div>
                <div className="truncate text-[10px] text-[#00f0ff]">{userConfig.email}</div>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#39ff14] shadow-sm shadow-[#39ff14]" />
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
