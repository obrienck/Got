// src/main/coder.ts
// Talks to the Coder CLI (`coder`) for workspace discovery and lifecycle.
// The CLI owns the deployment URL and session token (from `coder login`), so
// Got never handles Coder credentials itself.

import { spawn } from 'child_process'
import type { CoderWorkspace } from '../shared/coder-workspace'
import { coderBinary, friendlyCoderError, validateWorkspace } from './ssh'

/** Runs the Coder CLI and resolves with its stdout. */
function runCoder(args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(coderBinary(), args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('error', (err) => reject(new Error(`coder: command not found (${err.message})`)))
    child.on('close', (code) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(stderr.trim() || `coder exited with code ${code}`))
    })
  })
}

/** The signed-in user's workspaces, one entry per agent. */
export async function listWorkspaces(): Promise<CoderWorkspace[]> {
  let raw: any[]
  try {
    raw = JSON.parse(await runCoder(['list', '--output', 'json'], 30_000)) ?? []
  } catch (err) {
    throw new Error(friendlyCoderError('', err))
  }

  const result: CoderWorkspace[] = []
  for (const ws of raw) {
    const build = ws.latest_build ?? {}
    const base = {
      name: String(ws.name),
      template: String(ws.template_display_name || ws.template_name || ''),
      status: String(build.status || 'unknown')
    }
    const agents: string[] = (build.resources ?? []).flatMap((r: any) =>
      (r.agents ?? []).map((a: any) => String(a.name))
    )
    if (agents.length > 1) {
      for (const agent of agents) result.push({ ...base, agent, target: `${base.name}.${agent}` })
    } else {
      result.push({ ...base, agent: null, target: base.name })
    }
  }
  return result.sort((a, b) => a.target.localeCompare(b.target))
}

/** Starts a stopped workspace and waits for the build to finish. */
export async function startWorkspace(workspace: string): Promise<void> {
  const name = validateWorkspace(workspace).split('.')[0]
  try {
    await runCoder(['start', '--yes', name], 15 * 60_000)
  } catch (err) {
    throw new Error(friendlyCoderError(name, err))
  }
}
