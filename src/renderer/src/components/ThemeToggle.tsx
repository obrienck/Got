// src/renderer/src/components/ThemeToggle.tsx
// Normal/1980s switcher for the welcome screen — same idea as a light/dark
// toggle, but swapping the whole welcome screen's skin instead of a palette.

import { Gamepad2 } from 'lucide-react'
import type { WelcomeTheme } from '../lib/welcome-theme'

interface ThemeToggleProps {
  theme: WelcomeTheme
  onChange: (theme: WelcomeTheme) => void
}

export default function ThemeToggle({ theme, onChange }: ThemeToggleProps): React.JSX.Element {
  if (theme === 'synth') {
    return (
      <div className="flex items-center bg-black/70 p-1 rounded-lg border border-pink-500/40 shadow-[0_0_10px_rgba(255,0,127,0.3)]">
        <button
          type="button"
          onClick={() => onChange('normal')}
          className="px-3 py-1 rounded text-[11px] font-bold tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          NORMAL
        </button>
        <button
          type="button"
          onClick={() => onChange('synth')}
          className="px-3 py-1 rounded text-[11px] font-bold tracking-widest bg-gradient-to-r from-pink-600 via-fuchsia-600 to-cyan-500 text-black shadow-[0_0_12px_#ff007f] flex items-center gap-1.5 cursor-pointer"
        >
          <Gamepad2 size={14} /> 1980s SYNTH
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onChange('synth')}
      title="Switch to the 1980s synthwave theme"
      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-400 transition-colors hover:border-indigo-500/50 hover:text-white"
    >
      <Gamepad2 size={14} /> 1980s MODE
    </button>
  )
}
