// src/renderer/src/components/welcome/SynthWelcome.tsx
// 1980s synthwave/CRT skin for the welcome screen — same actions and data
// as NormalWelcome, just a different costume.

import { useMemo, useState } from 'react'
import { Terminal, FolderOpen, Download, PlusCircle, Server, Save, Loader2, X } from 'lucide-react'
import RemoteOpenDialog from '../RemoteOpenDialog'
import ThemeToggle from '../ThemeToggle'
import { parseRepoLocation, repoDisplayName, repoHostLabel } from '../../../../shared/repo-location'
import { DRAG_REGION } from '../../lib/platform'
import type { AppTheme } from '../../context/ThemeContext'
import type { WelcomeContentProps } from './types'

interface SynthWelcomeProps extends WelcomeContentProps {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
}

export default function SynthWelcome({
  isSelecting,
  isCloning,
  isInitializing,
  isBusy,
  error,
  setError,
  showCloneInput,
  setShowCloneInput,
  cloneUrl,
  setCloneUrl,
  handleCloneRepo,
  handleSelectRepo,
  handleInitRepo,
  showRemoteDialog,
  setShowRemoteDialog,
  recentRepos,
  handleOpenRecent,
  theme,
  setTheme
}: SynthWelcomeProps): React.JSX.Element {
  const [scan, setScan] = useState('')

  const filteredRepos = useMemo(() => {
    const query = scan.trim().toLowerCase()
    if (!query) return recentRepos
    return recentRepos.filter((repoPath) => repoPath.toLowerCase().includes(query))
  }, [recentRepos, scan])

  return (
    <div className="relative flex h-screen w-screen flex-col bg-[#0f172a] text-[#e2e8f0] font-mono crt-scanlines overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-10 z-40 ${DRAG_REGION}`} />

      <main className="flex-grow flex items-center justify-center p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-5xl w-full space-y-10">
          {/* Status bar + theme toggle */}
          <div className="flex flex-wrap justify-between items-center gap-3 px-4 py-2 border border-pink-500/30 rounded-xl bg-purple-950/40 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-xs tracking-wider">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
              <span className="font-bold text-pink-400">SYS://GOT_OS_v1.4.2</span>
              <span className="text-slate-500">|</span>
              <span className="text-yellow-400">CRT: 60Hz RGB PAL</span>
            </div>
            <ThemeToggle theme={theme} onChange={setTheme} />
          </div>

          {/* Hero emblem */}
          <div className="relative flex flex-col items-center justify-center gap-6 pt-2 text-center">
            <div className="relative w-28 h-28 flex items-center justify-center rounded-2xl bg-gradient-to-b from-purple-900/60 via-pink-950/40 to-black/80 border-2 border-pink-500/70 shadow-[0_0_30px_rgba(255,0,127,0.5),inset_0_0_15px_rgba(0,240,255,0.4)]">
              <div className="absolute inset-0 synth-grid opacity-60 rounded-2xl" />
              <div className="absolute -top-3 px-3 py-0.5 bg-pink-600 text-[9px] font-bold tracking-widest text-black rounded-full shadow-[0_0_10px_#ff007f] uppercase">
                SYNTH-DECK
              </div>
              <Terminal className="h-12 w-12 text-cyan-300 drop-shadow-[0_0_12px_#00f0ff] animate-pulse" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 drop-shadow-[0_0_15px_rgba(255,0,127,0.7)] uppercase font-synth">
                WELCOME TO GOT
              </h1>
              <p className="mt-3 text-cyan-300 text-sm tracking-widest">
                [ 1980s CYBERPUNK REPO TERMINAL // STREAMLINE YOUR CODEBASE ]
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="w-full flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
              <X
                className="h-4 w-4 mt-0.5 shrink-0 cursor-pointer hover:text-rose-100"
                onClick={() => setError(null)}
              />
              <span>{error}</span>
            </div>
          )}

          {/* Quick actions */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Open Repository */}
            <button
              onClick={handleSelectRepo}
              disabled={isBusy}
              className="group relative flex flex-col items-center p-8 rounded-2xl bg-[#140628]/90 border-2 border-pink-500/60 transition-all duration-300 hover:scale-[1.03] neon-border-pink hover:bg-purple-950/70 text-left disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="absolute top-3 right-3 text-[9px] font-bold text-pink-400 bg-pink-950/80 border border-pink-500/50 px-2 py-0.5 rounded tracking-widest">
                CASSETTE-01
              </div>
              <div className="mb-5 p-4 rounded-xl bg-pink-500/10 border border-pink-500/40 shadow-[0_0_15px_rgba(255,0,127,0.3)] group-hover:shadow-[0_0_25px_#ff007f] transition-all">
                {isSelecting ? (
                  <Loader2 className="h-9 w-9 text-pink-400 animate-spin" />
                ) : (
                  <FolderOpen className="h-9 w-9 text-pink-400" />
                )}
              </div>
              <span className="text-lg font-bold tracking-wider text-pink-200 uppercase group-hover:text-pink-300">
                {isSelecting ? 'MOUNTING...' : 'LOAD REPOSITORY'}
              </span>
              <p className="mt-2 text-xs text-pink-300/70 text-center tracking-wide">
                &gt; Mount an existing local disk repository into memory
              </p>
              <div className="mt-4 w-full bg-pink-950/50 border border-pink-500/30 rounded py-1 px-3 text-[10px] text-pink-400 text-center flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" /> READY TO
                MOUNT
              </div>
            </button>

            {/* Clone Repository */}
            {showCloneInput ? (
              <div className="flex flex-col gap-2 rounded-2xl border-2 border-cyan-400/60 bg-[#061826]/90 p-6">
                <span className="text-sm font-bold text-cyan-200 text-center uppercase tracking-wider">
                  Clone Repo [NET]
                </span>
                <input
                  autoFocus
                  value={cloneUrl}
                  onChange={(e) => setCloneUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCloneRepo()
                    if (e.key === 'Escape') {
                      setShowCloneInput(false)
                      setCloneUrl('')
                    }
                  }}
                  placeholder="https://github.com/user/repo.git"
                  className="rounded-lg bg-black/80 border border-cyan-400/40 px-3 py-2 text-xs text-cyan-200 placeholder:text-cyan-500/50 focus:outline-none focus:border-cyan-300 focus:shadow-[0_0_12px_#00f0ff]"
                />
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => {
                      setShowCloneInput(false)
                      setCloneUrl('')
                    }}
                    className="flex-1 rounded-lg border border-cyan-400/30 py-1.5 text-xs text-cyan-300/80 hover:bg-cyan-950/50 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleCloneRepo}
                    disabled={!cloneUrl.trim() || isCloning}
                    className="flex-1 rounded-lg bg-cyan-500 py-1.5 text-xs font-bold text-black hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCloning ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : 'GO'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCloneInput(true)}
                disabled={isBusy}
                className="group relative flex flex-col items-center p-8 rounded-2xl bg-[#061826]/90 border-2 border-cyan-400/60 transition-all duration-300 hover:scale-[1.03] neon-border-cyan hover:bg-cyan-950/70 text-left disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="absolute top-3 right-3 text-[9px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-400/50 px-2 py-0.5 rounded tracking-widest">
                  MODEM-2400
                </div>
                <div className="mb-5 p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.3)] group-hover:shadow-[0_0_25px_#00f0ff] transition-all">
                  <Download className="h-9 w-9 text-cyan-300" />
                </div>
                <span className="text-lg font-bold tracking-wider text-cyan-200 uppercase group-hover:text-cyan-300">
                  CLONE REPO [NET]
                </span>
                <p className="mt-2 text-xs text-cyan-300/70 text-center tracking-wide">
                  &gt; Ingest stream from GitHub, GitLab, or BBS Bitbucket
                </p>
                <div className="mt-4 w-full bg-cyan-950/50 border border-cyan-400/30 rounded py-1 px-3 text-[10px] text-cyan-300 text-center flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> PROTOCOL
                  ONLINE
                </div>
              </button>
            )}

            {/* Init New Repo */}
            <button
              onClick={handleInitRepo}
              disabled={isBusy}
              className="group relative flex flex-col items-center p-8 rounded-2xl bg-[#1d1203]/90 border-2 border-amber-400/60 transition-all duration-300 hover:scale-[1.03] neon-border-amber hover:bg-amber-950/70 text-left disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="absolute top-3 right-3 text-[9px] font-bold text-amber-300 bg-amber-950/80 border border-amber-400/50 px-2 py-0.5 rounded tracking-widest">
                TRACK-00
              </div>
              <div className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-400/40 shadow-[0_0_15px_rgba(255,170,0,0.3)] group-hover:shadow-[0_0_25px_#ffaa00] transition-all">
                {isInitializing ? (
                  <Loader2 className="h-9 w-9 text-amber-300 animate-spin" />
                ) : (
                  <PlusCircle className="h-9 w-9 text-amber-300" />
                )}
              </div>
              <span className="text-lg font-bold tracking-wider text-amber-200 uppercase group-hover:text-amber-300">
                {isInitializing ? 'FORMATTING...' : 'INIT NEW SECTOR'}
              </span>
              <p className="mt-2 text-xs text-amber-300/70 text-center tracking-wide">
                &gt; Format and initialize a brand-new Git repository
              </p>
              <div className="mt-4 w-full bg-amber-950/50 border border-amber-400/30 rounded py-1 px-3 text-[10px] text-amber-300 text-center flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> WRITE
                UNPROTECTED
              </div>
            </button>

            {/* Open Remote (SSH) */}
            <button
              onClick={() => setShowRemoteDialog(true)}
              disabled={isBusy}
              className="group relative flex flex-col items-center p-8 rounded-2xl bg-[#140420]/90 border-2 border-purple-400/60 transition-all duration-300 hover:scale-[1.03] neon-border-purple hover:bg-purple-950/70 text-left disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="absolute top-3 right-3 text-[9px] font-bold text-purple-300 bg-purple-950/80 border border-purple-400/50 px-2 py-0.5 rounded tracking-widest">
                UPLINK-SSH
              </div>
              <div className="mb-5 p-4 rounded-xl bg-purple-500/10 border border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_25px_#a855f7] transition-all">
                <Server className="h-9 w-9 text-purple-300" />
              </div>
              <span className="text-lg font-bold tracking-wider text-purple-200 uppercase group-hover:text-purple-300">
                REMOTE UPLINK
              </span>
              <p className="mt-2 text-xs text-purple-300/70 text-center tracking-wide">
                &gt; Work on a repository hosted on another machine
              </p>
              <div className="mt-4 w-full bg-purple-950/50 border border-purple-400/30 rounded py-1 px-3 text-[10px] text-purple-300 text-center flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" /> SSH CHANNEL
                OPEN
              </div>
            </button>
          </section>

          {showRemoteDialog && (
            <RemoteOpenDialog
              onClose={() => setShowRemoteDialog(false)}
              onOpened={(location) => {
                setShowRemoteDialog(false)
                handleOpenRecent(location)
              }}
            />
          )}

          {/* Recent Repositories */}
          {recentRepos.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-pink-500/40 pb-4 gap-3">
                <div className="flex items-center space-x-3">
                  <span className="text-pink-400 font-bold text-lg tracking-wider">
                    {'// RECENT DIRECTORY ENTRIES'}
                  </span>
                  <span className="text-[11px] bg-pink-950 border border-pink-500/40 text-pink-300 px-2 py-0.5 rounded">
                    [{recentRepos.length} MOUNTED]
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-pink-400">&gt;</span>
                  <input
                    value={scan}
                    onChange={(e) => setScan(e.target.value)}
                    className="bg-black/80 border-2 border-pink-500/40 rounded-lg text-xs pl-7 pr-4 py-2 w-full sm:w-72 text-cyan-300 placeholder:text-pink-500/50 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_#00f0ff]"
                    placeholder="DIR SCAN / SEARCH..."
                    type="text"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredRepos.map((repoPath) => {
                  const name = repoDisplayName(repoPath)
                  const host = repoHostLabel(repoPath)
                  return (
                    <button
                      key={repoPath}
                      onClick={() => handleOpenRecent(repoPath)}
                      className="group w-full flex items-center justify-between py-3.5 px-4 bg-[#120420]/80 border border-pink-500/30 rounded-xl hover:border-cyan-400 hover:bg-[#1a062e] transition-all cursor-pointer shadow-[0_0_10px_rgba(255,0,127,0.15)] hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] text-left"
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="p-2.5 bg-black/60 border border-pink-500/40 rounded-lg text-pink-400 group-hover:text-cyan-300 group-hover:border-cyan-400 transition-colors flex items-center justify-center shrink-0">
                          <Save className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-pink-100 group-hover:text-cyan-200 tracking-wider truncate">
                            {name}
                          </h3>
                          <p className="text-xs text-purple-300/70 truncate">
                            {parseRepoLocation(repoPath).path}
                          </p>
                        </div>
                      </div>
                      {host && (
                        <span className="shrink-0 text-[10px] uppercase tracking-widest bg-cyan-500/20 border border-cyan-400 text-cyan-300 px-2 py-0.5 rounded font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                          {host}
                        </span>
                      )}
                    </button>
                  )
                })}
                {filteredRepos.length === 0 && (
                  <p className="text-center text-xs text-pink-400/60 py-4">NO MATCHING ENTRIES</p>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="p-4 border-t-2 border-pink-500/40 bg-[#090114]/95 flex flex-col sm:flex-row justify-between items-center text-xs text-pink-400 gap-2 shadow-[0_-5px_15px_rgba(255,0,127,0.15)]">
        <div className="flex items-center space-x-2">
          <span className="text-cyan-400 font-bold">
            &gt; Got OS v1.4.2 [SYNTHWAVE CRT EMULATION]
          </span>
          <span className="inline-block w-2 h-4 bg-pink-500 animate-pulse" />
        </div>
        <div className="flex items-center space-x-6 text-[11px]">
          <span className="text-yellow-400 tracking-wider font-semibold">BAUD: 28800 BPS</span>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-ping shadow-[0_0_8px_#39ff14]" />
            <span className="text-green-300 font-bold tracking-wider">LOCAL SYNC: LOCKED</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
