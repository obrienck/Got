// src/shared/repo-location.ts
// A repo is identified everywhere (IPC, query keys, recent list) by a single
// string. Local repos are plain filesystem paths; remote repos are encoded as
// `ssh://<urlencoded host>/<absolute remote path>`. Shared by main + renderer.

export type RepoLocation =
  | { kind: 'local'; path: string }
  | { kind: 'ssh'; host: string; path: string }

const SSH_PREFIX = 'ssh://'

export function parseRepoLocation(location: string): RepoLocation {
  if (location.startsWith(SSH_PREFIX)) {
    const rest = location.slice(SSH_PREFIX.length)
    const slash = rest.indexOf('/')
    if (slash > 0) {
      return {
        kind: 'ssh',
        host: decodeURIComponent(rest.slice(0, slash)),
        path: rest.slice(slash)
      }
    }
  }
  return { kind: 'local', path: location }
}

export function formatSshLocation(host: string, path: string): string {
  return `${SSH_PREFIX}${encodeURIComponent(host)}${path.startsWith('/') ? path : `/${path}`}`
}

/** Last path segment — the repo's folder name. */
export function repoDisplayName(location: string): string {
  const { path } = parseRepoLocation(location)
  return path.split(/[\\/]/).filter(Boolean).pop() || path
}

/** The SSH host for a remote repo, or null for a local one. */
export function repoHostLabel(location: string): string | null {
  const loc = parseRepoLocation(location)
  return loc.kind === 'ssh' ? loc.host : null
}
