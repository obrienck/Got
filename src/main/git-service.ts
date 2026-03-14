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

  async commit(message: string, files?: string[]) {
    if (files && files.length > 0) {
      await this.git.add(files)
    }
    return this.git.commit(message)
  }

  async clone(url: string, targetPath: string, onProgress: (progress: any) => void) {
    return simpleGit().clone(url, targetPath, ['--progress'], onProgress)
  }
}
