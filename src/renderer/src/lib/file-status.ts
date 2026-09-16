// src/renderer/src/lib/file-status.ts
// Maps simple-git's StatusResult working_dir/index codes to a display
// letter + color, shared between the Staged/Unstaged panels and the file tree.

export interface FileStatusInfo {
  letter: string
  bg: string
  text: string
}

export function getStatusInfo(workingDir: string, index: string): FileStatusInfo {
  const code = workingDir !== ' ' ? workingDir : index
  switch (code) {
    case 'M':
      return { letter: 'M', bg: 'bg-purple-500/10', text: 'text-purple-400' }
    case 'A':
    case '?':
      return { letter: 'A', bg: 'bg-green-500/10', text: 'text-green-400' }
    case 'D':
      return { letter: 'D', bg: 'bg-rose-500/10', text: 'text-rose-400' }
    case 'R':
      return { letter: 'R', bg: 'bg-cyan-500/10', text: 'text-cyan-400' }
    default:
      return { letter: code || 'M', bg: 'bg-purple-500/10', text: 'text-purple-400' }
  }
}
