import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    gitAPI: {
      status: (repoPath: string) => Promise<any>
      log: (repoPath: string, options?: any) => Promise<any>
      commit: (repoPath: string, message: string, files?: string[]) => Promise<any>
      onProgress: (callback: (progress: any) => void) => void
    }
  }
}
