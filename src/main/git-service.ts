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
      maxConcurrentProcesses: 6
    })
  }

  async status(): Promise<StatusResult> {
    return this.git.status()
  }

  async log(options = {}): Promise<LogResult> {
    return this.git.log({
      ...options,
      '--graph': null,
      '--oneline': null,
      '--all': null,
      '--decorate': null
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

  async clone(url: string, targetPath: string, onProgress: (progress: any) => void): Promise<any> {
    return simpleGit().clone(url, targetPath, ['--progress'], onProgress)
  }
}
