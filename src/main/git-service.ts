import { simpleGit, SimpleGit, StatusResult, LogResult } from 'simple-git'
import { readdir } from 'fs/promises'
import { join } from 'path'

export interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  isIgnored: boolean
}

export class Repository {
  private git: SimpleGit

  constructor(
    public path: string,
    bundledGitPath?: string
  ) {
    this.git = simpleGit({
      baseDir: path,
      binary: bundledGitPath || 'git',
      maxConcurrentProcesses: 6,
      config: []
    })

    // Use the system credential helper (e.g. macOS Keychain) instead of
    // prompting for credentials on the terminal.  GIT_TERMINAL_PROMPT=0
    // prevents git from blocking on stdin, and an empty GIT_ASKPASS forces
    // it to fall through to the credential.helper configured in gitconfig.
    this.git.env({
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      GIT_ASKPASS: ''
    })
  }

  async status(): Promise<StatusResult> {
    return this.git.status()
  }

  async log(options = {}): Promise<LogResult> {
    return this.git.log({
      ...options,
      format: {
        hash: '%H',
        date: '%aI',
        message: '%s',
        refs: '%D',
        body: '%b',
        author_name: '%aN',
        author_email: '%aE',
        // Space-separated parent hashes — needed to lay out the ancestry graph.
        parents: '%P'
      }
    })
  }

  async commit(message: string, files?: string[]): Promise<any> {
    if (files && files.length > 0) {
      await this.git.add(files)
    }
    return this.git.commit(message)
  }

  async pull(): Promise<any> {
    return this.git.pull()
  }

  async push(): Promise<any> {
    return this.git.push()
  }

  async stage(files: string[]): Promise<any> {
    return this.git.add(files)
  }

  async unstage(files: string[]): Promise<any> {
    return this.git.reset(['HEAD', '--', ...files])
  }

  async checkout(branch: string): Promise<any> {
    return this.git.checkout(branch)
  }

  async branchesLocal(): Promise<any> {
    return this.git.branchLocal()
  }

  async branchesRemote(): Promise<any> {
    return this.git.branch(['-r'])
  }

  async tags(): Promise<any> {
    return this.git.tags()
  }

  async stashes(): Promise<any> {
    return this.git.stashList()
  }

  async createBranch(name: string): Promise<any> {
    return this.git.checkoutLocalBranch(name)
  }

  async getUserConfig(): Promise<{ name: string; email: string }> {
    const [name, email] = await Promise.all([
      this.git.raw(['config', 'user.name']).catch(() => ''),
      this.git.raw(['config', 'user.email']).catch(() => '')
    ])
    return { name: name.trim(), email: email.trim() }
  }

  async clone(url: string, targetPath: string): Promise<any> {
    const cloneGit = simpleGit()
    cloneGit.env({
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      GIT_ASKPASS: ''
    })
    return cloneGit.clone(url, targetPath, ['--progress'])
  }

  async init(): Promise<any> {
    return this.git.init()
  }

  // The well-known empty-tree SHA — same in every git repo, used so a root
  // commit (no parent) can be diffed like any other.
  private static readonly EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

  /** Lists one directory's immediate children (lazy — callers fetch deeper
   *  levels on demand as folders are expanded), sorted directories-first. */
  async listDirectory(relativePath = ''): Promise<DirEntry[]> {
    const dirPath = join(this.path, relativePath)
    const entries = await readdir(dirPath, { withFileTypes: true })
    const visible = entries.filter((e) => e.name !== '.git')
    if (visible.length === 0) return []

    const relPaths = visible.map((e) => (relativePath ? `${relativePath}/${e.name}` : e.name))
    const ignored = new Set(await this.git.checkIgnore(relPaths).catch(() => []))

    return visible
      .map((e, i) => ({
        name: e.name,
        path: relPaths[i],
        isDirectory: e.isDirectory(),
        isIgnored: ignored.has(relPaths[i])
      }))
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }

  async getCommitDiff(hash: string): Promise<string> {
    const parentLine = await this.git.raw(['rev-list', '--parents', '-n', '1', hash])
    const [, firstParent] = parentLine.trim().split(' ')
    // For a merge commit this diffs against the first (mainline) parent only,
    // matching how GitHub/GitLab show a merge commit's changes.
    return this.git.diff([firstParent || Repository.EMPTY_TREE, hash, '--no-color'])
  }
}
