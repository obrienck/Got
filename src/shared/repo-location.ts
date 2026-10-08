// src/shared/repo-location.ts
// A repo is identified everywhere (IPC, query keys, recent list) by a single
// string. Local repos are plain filesystem paths; repos inside a Coder
// workspace are encoded as `coder://<workspace>/<absolute path in workspace>`.
// Shared by main + renderer.

export type RepoLocation =
  | { kind: 'local'; path: string }
  | { kind: 'coder'; workspace: string; path: string }

const CODER_PREFIX = 'coder://'

/** Generic `ssh://host/path` locations saved by older versions of Got. */
export function isLegacySshLocation(location: string): boolean {
  return location.startsWith('ssh://')
}

export function parseRepoLocation(location: string): RepoLocation {
  if (location.startsWith(CODER_PREFIX)) {
    const rest = location.slice(CODER_PREFIX.length)
    const slash = rest.indexOf('/')
    if (slash > 0) {
      return {
        kind: 'coder',
        workspace: decodeURIComponent(rest.slice(0, slash)),
        path: rest.slice(slash)
      }
    }
  }
  return { kind: 'local', path: location }
}

export function formatCoderLocation(workspace: string, path: string): string {
  return `${CODER_PREFIX}${encodeURIComponent(workspace)}${path.startsWith('/') ? path : `/${path}`}`
}

/** Last path segment — the repo's folder name. */
export function repoDisplayName(location: string): string {
  const { path } = parseRepoLocation(location)
  return path.split(/[\\/]/).filter(Boolean).pop() || path
}

/** The Coder workspace for a remote repo, or null for a local one. */
export function repoHostLabel(location: string): string | null {
  const loc = parseRepoLocation(location)
  return loc.kind === 'coder' ? loc.workspace : null
}
