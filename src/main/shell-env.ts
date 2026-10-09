// GUI apps on macOS (and most Linux desktops) are launched by launchd/the
// session manager, not by a shell — so they get a bare-bones environment and
// miss anything only exported by ~/.zshrc, ~/.bash_profile, etc. (homebrew/
// nvm PATH entries, SSH_AUTH_SOCK for ssh-agent, GPG_TTY, ...). That's why
// Got previously only worked when launched from a terminal: a terminal-
// launched process inherits the shell's environment directly.
//
// This runs the user's login shell once at startup and merges what it
// reports into process.env, so git/ssh subprocesses see the same
// environment regardless of how Got was launched.

import { spawnSync } from 'child_process'

const MARKER = '__GOT_SHELL_ENV__'

export function resolveShellEnv(): void {
  if (process.platform === 'win32') return

  const shell = process.env.SHELL || '/bin/zsh'

  let result
  try {
    // -l (login) + -i (interactive) mirrors how Terminal.app/most terminal
    // emulators start a shell, since PATH exports often live in rc files
    // that only get sourced for interactive shells.
    result = spawnSync(shell, ['-ilc', `echo "${MARKER}"; env; echo "${MARKER}"`], {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore']
    })
  } catch {
    return
  }

  if (!result || result.error || result.status !== 0 || !result.stdout) return

  const parts = result.stdout.split(MARKER)
  if (parts.length < 3) return

  const env: Record<string, string> = {}
  for (const line of parts[1].split('\n')) {
    const i = line.indexOf('=')
    if (i === -1) continue
    env[line.slice(0, i)] = line.slice(i + 1)
  }

  // Sanity check: a shell that failed to report a real environment (odd rc
  // file output, unexpected shell, etc.) shouldn't blow away a working PATH.
  if (!env.PATH) return

  Object.assign(process.env, env)
}
