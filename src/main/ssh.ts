// src/main/ssh.ts
// Thin wrapper around the system `ssh` binary for reaching Coder workspaces.
// Each connection tunnels through `coder ssh --stdio <workspace>` (the same
// ProxyCommand `coder config-ssh` writes), so it works whether or not the user
// ran config-ssh, and auth comes from the Coder CLI's session — no SSH keys.
// On macOS/Linux one multiplexed master connection per workspace is reused by
// every git call; Windows OpenSSH has no ControlMaster support.

import { spawn, spawnSync } from 'child_process'
import { mkdirSync } from 'fs'
import { tmpdir, userInfo } from 'os'
import { join } from 'path'

const SUPPORTS_MULTIPLEXING = process.platform !== 'win32'

// Kept short: unix socket paths are limited to ~104 chars, and %C adds 40.
const CONTROL_DIR = join(tmpdir(), `got-ssh-${userInfo().uid}`)

const usedWorkspaces = new Set<string>()

/** The Coder CLI. GOT_CODER_BIN overrides it, e.g. when a GUI launch doesn't
 *  inherit the shell PATH that `coder` was installed on. */
export function coderBinary(): string {
  return process.env.GOT_CODER_BIN || 'coder'
}

/** POSIX single-quote escaping, safe for any byte sequence except NUL. */
export function shellQuote(arg: string): string {
  return `'${arg.replace(/'/g, `'\\''`)}'`
}

/** Coder workspace names, optionally suffixed with `.<agent>`. The strict
 *  charset also keeps them safe inside ProxyCommand and as an ssh host. */
export function validateWorkspace(workspace: string): string {
  const trimmed = workspace.trim()
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*(\.[A-Za-z0-9][A-Za-z0-9_-]*)?$/.test(trimmed)) {
    throw new Error(`Invalid Coder workspace: "${workspace}"`)
  }
  return trimmed
}

/** Host alias ssh sees; matches the naming `coder config-ssh` uses. */
function sshAlias(workspace: string): string {
  return `coder.${workspace}`
}

function proxyCommand(workspace: string): string {
  const bin = coderBinary().replace(/%/g, '%%') // ssh expands %-tokens
  const quotedBin = /\s/.test(bin) ? `"${bin}"` : bin
  return `${quotedBin} ssh --stdio ${workspace}`
}

/** Options for every ssh invocation to `workspace`. Non-interactive. The
 *  Coder tunnel is already authenticated, so workspace host keys (which
 *  change on every rebuild) aren't pinned — the same as `coder config-ssh`. */
function sshBaseArgs(workspace: string): string[] {
  const args = [
    '-o',
    'BatchMode=yes',
    '-o',
    'ConnectTimeout=30',
    '-o',
    `ProxyCommand=${proxyCommand(workspace)}`,
    '-o',
    'StrictHostKeyChecking=no',
    '-o',
    'UserKnownHostsFile=/dev/null',
    '-o',
    'LogLevel=ERROR'
  ]
  if (SUPPORTS_MULTIPLEXING) {
    mkdirSync(CONTROL_DIR, { recursive: true, mode: 0o700 })
    args.push(
      '-o',
      'ControlMaster=auto',
      '-o',
      `ControlPath=${join(CONTROL_DIR, '%C')}`,
      '-o',
      'ControlPersist=10m'
    )
  }
  return args
}

/** Remembers a workspace so its master connection is closed on quit. Needed
 *  for workspaces only reached via the git shim, which runs in its own process. */
export function trackWorkspace(workspace: string): void {
  usedWorkspaces.add(validateWorkspace(workspace))
}

/** Full argv (minus the `ssh` binary) to run a shell command in `workspace`. */
export function sshCommandArgs(workspace: string, remoteCommand: string): string[] {
  const safe = validateWorkspace(workspace)
  usedWorkspaces.add(safe)
  return [...sshBaseArgs(safe), '--', sshAlias(safe), remoteCommand]
}

/** Remote command that runs git in `cwd` without ever prompting. `env` keeps
 *  it working under non-POSIX login shells that lack `VAR=x cmd` syntax. */
export function remoteGitCommand(cwd: string, gitArgs: string[]): string {
  return `cd ${shellQuote(cwd)} && env GIT_TERMINAL_PROMPT=0 git ${gitArgs.map(shellQuote).join(' ')}`
}

/** ssh exits 255 on connection failures, but once ControlPersist backgrounds
 *  the master the ProxyCommand's stderr — where `coder` explains what's wrong
 *  (not logged in, workspace stopped, ...) — is lost. Re-run the proxy on its
 *  own to recover that message; resolves null if it has nothing to say. */
export function diagnoseConnectionFailure(workspace: string): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn(coderBinary(), ['ssh', '--stdio', validateWorkspace(workspace)], {
      stdio: ['ignore', 'ignore', 'pipe'],
      timeout: 15_000
    })
    let stderr = ''
    child.stderr.on('data', (d) => (stderr += d))
    child.on('error', (err) => resolve(`coder: command not found (${err.message})`))
    child.on('close', (code) => resolve(code !== 0 && stderr.trim() ? stderr.trim() : null))
  })
}

/** Runs a shell command in the workspace and resolves with its stdout. */
export function runRemote(workspace: string, remoteCommand: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('ssh', sshCommandArgs(workspace, remoteCommand), {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('error', (err) =>
      reject(new Error(`Could not run ssh — is OpenSSH installed? (${err.message})`))
    )
    child.on('close', async (code) => {
      if (code === 0) return resolve(stdout)
      const diagnosis =
        code === 255 && !stderr.trim() && (await diagnoseConnectionFailure(workspace))
      reject(new Error(diagnosis || stderr.trim() || `ssh exited with code ${code}`))
    })
  })
}

/** Turns raw coder/ssh/shell stderr into something a user can act on. */
export function friendlyCoderError(workspace: string, err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (
    /(coder|exec): (command )?not found|command not found: coder|no such file.*coder/i.test(msg)
  ) {
    return 'The Coder CLI was not found. Install `coder` and make sure it is on your PATH (or set GOT_CODER_BIN).'
  }
  if (/not logged in|coder login|session token|unauthorized|401/i.test(msg)) {
    return 'You are not logged in to Coder. Run `coder login <your Coder URL>` in a terminal, then try again.'
  }
  if (
    /not running|is stopped|must be started|workspace is (stopped|starting|stopping)/i.test(msg)
  ) {
    return `Workspace "${workspace}" is not running. Start it and try again.`
  }
  if (/multiple agents/i.test(msg)) {
    return `Workspace "${workspace}" has several agents — pick a specific one from the list.`
  }
  if (/git: (command )?not found/i.test(msg)) {
    return `Git is not installed in workspace "${workspace}".`
  }
  if (/workspace.*not found|404/i.test(msg)) {
    return `Coder workspace "${workspace}" was not found.`
  }
  if (/connection (closed|refused|reset)|timed out|kex_exchange_identification/i.test(msg)) {
    return `Can't reach workspace "${workspace}": ${msg}`
  }
  return msg
}

/** Opens (or reuses) the connection and verifies git exists in the workspace. */
export async function checkConnection(workspace: string): Promise<void> {
  try {
    await runRemote(workspace, 'git --version')
  } catch (err) {
    throw new Error(friendlyCoderError(workspace, err))
  }
}

/** Tears down any master connections we started, so nothing lingers after quit. */
export function closeAllMasters(): void {
  if (!SUPPORTS_MULTIPLEXING) return
  for (const workspace of usedWorkspaces) {
    spawnSync('ssh', [...sshBaseArgs(workspace), '-O', 'exit', '--', sshAlias(workspace)], {
      stdio: 'ignore',
      timeout: 2000
    })
  }
}
