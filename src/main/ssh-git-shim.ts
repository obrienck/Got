// src/main/ssh-git-shim.ts
// Stand-in "git binary" for repos in Coder workspaces. simple-git spawns this
// script (via Electron running as plain Node) instead of git; it forwards git's
// argv over ssh (tunnelled through `coder ssh --stdio`) to the workspace repo
// and passes stdout/stderr/exit code straight back, so simple-git's own output
// parsers keep working untouched.

import { spawn } from 'child_process'
import { diagnoseConnectionFailure, sshCommandArgs, remoteGitCommand } from './ssh'

const workspace = process.env.GOT_CODER_WORKSPACE
const cwd = process.env.GOT_REMOTE_CWD

if (!workspace || !cwd) {
  process.stderr.write('ssh-git-shim: GOT_CODER_WORKSPACE and GOT_REMOTE_CWD must be set\n')
  process.exit(2)
}

const child = spawn(
  'ssh',
  sshCommandArgs(workspace, remoteGitCommand(cwd, process.argv.slice(2))),
  {
    stdio: ['ignore', 'inherit', 'inherit']
  }
)

child.on('error', (err) => {
  process.stderr.write(`Could not run ssh — is OpenSSH installed? (${err.message})\n`)
  process.exit(127)
})
child.on('close', async (code) => {
  // 255 = ssh couldn't connect; surface coder's reason (see diagnoseConnectionFailure)
  const diagnosis = code === 255 && (await diagnoseConnectionFailure(workspace))
  if (diagnosis) process.stderr.write(`${diagnosis}\n`)
  process.exit(code ?? 1)
})
