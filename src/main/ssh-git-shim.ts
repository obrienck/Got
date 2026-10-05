// src/main/ssh-git-shim.ts
// Stand-in "git binary" for remote repos. simple-git spawns this script (via
// Electron running as plain Node) instead of git; it forwards git's argv over
// ssh to the remote repo and passes stdout/stderr/exit code straight back, so
// simple-git's own output parsers keep working untouched.

import { spawn } from 'child_process'
import { sshCommandArgs, remoteGitCommand } from './ssh'

const host = process.env.GOT_SSH_HOST
const cwd = process.env.GOT_SSH_CWD

if (!host || !cwd) {
  process.stderr.write('ssh-git-shim: GOT_SSH_HOST and GOT_SSH_CWD must be set\n')
  process.exit(2)
}

const child = spawn('ssh', sshCommandArgs(host, remoteGitCommand(cwd, process.argv.slice(2))), {
  stdio: ['ignore', 'inherit', 'inherit']
})

child.on('error', (err) => {
  process.stderr.write(`Could not run ssh — is OpenSSH installed? (${err.message})\n`)
  process.exit(127)
})
child.on('close', (code) => process.exit(code ?? 1))
