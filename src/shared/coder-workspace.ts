// src/shared/coder-workspace.ts
// A connectable Coder workspace as reported by `coder list`. Shared by main + renderer.

export interface CoderWorkspace {
  /** What to connect to: `<workspace>`, or `<workspace>.<agent>` when the
   *  workspace has more than one agent. */
  target: string
  name: string
  agent: string | null
  template: string
  /** Latest build status: running, stopped, starting, stopping, failed, ... */
  status: string
}
