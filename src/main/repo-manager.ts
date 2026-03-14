import { Repository } from './git-service'

export class RepoManager {
  private repos = new Map<string, Repository>()

  getRepo(path: string): Repository {
    if (!this.repos.has(path)) {
      this.repos.set(path, new Repository(path))
    }
    return this.repos.get(path)!
  }
}

export const repoManager = new RepoManager()
