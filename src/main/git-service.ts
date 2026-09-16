import { simpleGit, SimpleGit, StatusResult, LogResult } from 'simple-git'

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
}
