// src/main/ssh.ts
// Thin wrapper around the system `ssh` binary. Using OpenSSH (rather than a JS
// SSH client) means ~/.ssh/config, keys, ssh-agent, ProxyJump etc. all just
// work. On macOS/Linux one multiplexed master connection per host is reused by
// every git call; Windows OpenSSH has no ControlMaster support.

import { spawn, spawnSync } from 'child_process'
import { mkdirSync, readFileSync } from 'fs'
import { homedir, tmpdir, userInfo } from 'os'
import { join } from 'path'

const SUPPORTS_MULTIPLEXING = process.platform !== 'win32'

// Kept short: unix socket paths are limited to ~104 chars, and %C adds 40.
const CONTROL_DIR = join(tmpdir(), `got-ssh-${userInfo().uid}`)

const usedHosts = new Set<string>()

/** POSIX single-quote escaping, safe for any byte sequence except NUL. */
export function shellQuote(arg: string): string {
  return `'${arg.replace(/'/g, `'\\''`)}'`
}

/** Rejects anything ssh could interpret as an option, or that isn't one token. */
export function validateHost(host: string): string {
  const trimmed = host.trim()
  if (!trimmed || trimmed.startsWith('-') || /\s/.test(trimmed)) {
    throw new Error(`Invalid SSH host: "${host}"`)
  }
  return trimmed
}

/** Options common to every ssh invocation. Non-interactive (keys/agent only). */
export function sshBaseArgs(): string[] {
  const args = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10']
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

/** Remembers a host so its master connection is closed on quit. Needed for
 *  hosts only reached via the git shim, which runs in its own process. */
export function trackHost(host: string): void {
  usedHosts.add(validateHost(host))
}

/** Full argv (minus the `ssh` binary) to run a shell command on `host`. */
export function sshCommandArgs(host: string, remoteCommand: string): string[] {
  const safeHost = validateHost(host)
  usedHosts.add(safeHost)
  return [...sshBaseArgs(), '--', safeHost, remoteCommand]
}

/** Remote command that runs git in `cwd` without ever prompting. `env` keeps
 *  it working under non-POSIX login shells that lack `VAR=x cmd` syntax. */
export function remoteGitCommand(cwd: string, gitArgs: string[]): string {
  return `cd ${shellQuote(cwd)} && env GIT_TERMINAL_PROMPT=0 git ${gitArgs.map(shellQuote).join(' ')}`
}

/** Runs a shell command on the remote host and resolves with its stdout. */
export function runRemote(host: string, remoteCommand: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('ssh', sshCommandArgs(host, remoteCommand), {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('error', (err) =>
      reject(new Error(`Could not run ssh — is OpenSSH installed? (${err.message})`))
    )
    child.on('close', (code) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(stderr.trim() || `ssh exited with code ${code}`))
    })
  })
}

/** Turns raw ssh/shell stderr into something a user can act on. */
export function friendlySshError(host: string, err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (/permission denied/i.test(msg)) {
    return `Authentication to ${host} failed. Got only supports key-based auth — add your key to ssh-agent or ~/.ssh/config.`
  }
  if (/host key verification failed/i.test(msg)) {
    return `Host key for ${host} is not trusted yet. Connect once with \`ssh ${host}\` in a terminal to accept it.`
  }
  if (/could not resolve hostname/i.test(msg)) {
    return `Unknown host "${host}".`
  }
  if (/connection refused|timed out|no route to host|network is unreachable/i.test(msg)) {
    return `Can't reach ${host}: ${msg}`
  }
  if (/git: (command )?not found/i.test(msg)) {
    return `Git is not installed on ${host}.`
  }
  return msg
}

/** Opens (or reuses) the connection and verifies git exists remotely. */
export async function checkConnection(host: string): Promise<void> {
  try {
    await runRemote(host, 'git --version')
  } catch (err) {
    throw new Error(friendlySshError(host, err))
  }
}

/** Concrete `Host` aliases from ~/.ssh/config (wildcard patterns skipped). */
export function listSshConfigHosts(): string[] {
  let config: string
  try {
    config = readFileSync(join(homedir(), '.ssh', 'config'), 'utf8')
  } catch {
    return []
  }
  const hosts = new Set<string>()
  for (const line of config.split(/\r?\n/)) {
    const match = line.match(/^\s*Host\s+(.+)$/i)
    if (!match) continue
    for (const name of match[1].split(/\s+/)) {
      if (name && !/[*?!]/.test(name)) hosts.add(name)
    }
  }
  return [...hosts]
}

/** Tears down any master connections we started, so nothing lingers after quit. */
export function closeAllMasters(): void {
  if (!SUPPORTS_MULTIPLEXING) return
  for (const host of usedHosts) {
    spawnSync('ssh', [...sshBaseArgs(), '-O', 'exit', '--', host], {
      stdio: 'ignore',
      timeout: 2000
    })
  }
}
