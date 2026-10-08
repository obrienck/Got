import { Repository } from './git-service'
import { parseRepoLocation } from '../shared/repo-location'

export class RepoManager {
  private repos = new Map<string, Repository>()

  /** `location` is a local path or a `coder://workspace/path` string (see repo-location). */
  getRepo(location: string): Repository {
    if (!this.repos.has(location)) {
      this.repos.set(location, new Repository(parseRepoLocation(location)))
    }
    return this.repos.get(location)!
  }
}

export const repoManager = new RepoManager()
