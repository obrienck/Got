import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    gitAPI: {
      // Repository selection & persistence
      selectRepository: () => Promise<{ path: string } | { error: string; path: string } | null>
      getRecentRepos: () => Promise<string[]>
      getLastRepoPath: () => Promise<string | null>

      // Git operations
      status: (repoPath: string) => Promise<any>
      log: (repoPath: string, options?: any) => Promise<any>
      stage: (repoPath: string, files: string[]) => Promise<any>
      unstage: (repoPath: string, files: string[]) => Promise<any>
      commit: (repoPath: string, message: string, files?: string[]) => Promise<any>
      checkout: (repoPath: string, branch: string) => Promise<any>
      pull: (repoPath: string) => Promise<any>
      push: (repoPath: string) => Promise<any>
      onProgress: (callback: (progress: any) => void) => void
    }
  }
}
