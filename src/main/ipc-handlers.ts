import { ipcMain } from 'electron'
import { repoManager } from './repo-manager'

export function setupIpcHandlers(): void {
  ipcMain.handle('git:status', async (_, repoPath: string) => {
    return repoManager.getRepo(repoPath).status()
  })

  ipcMain.handle('git:log', async (_, repoPath: string, options) => {
    return repoManager.getRepo(repoPath).log(options || {})
  })

  ipcMain.handle('git:commit', async (_, repoPath: string, message: string, files?: string[]) => {
    return repoManager.getRepo(repoPath).commit(message, files)
  })

  ipcMain.handle('git:pull', async (_, repoPath: string) => {
    return repoManager.getRepo(repoPath).pull()
  })

  ipcMain.handle('git:push', async (_, repoPath: string) => {
    return repoManager.getRepo(repoPath).push()
  })

  ipcMain.on('git:progress-start', () => {
    // Placeholder for stream responses
  })
}
