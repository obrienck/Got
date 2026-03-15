import { ipcMain, dialog } from 'electron'
import { repoManager } from './repo-manager'
import fs from 'fs'
import path from 'path'

let storeInstance: any

async function getStore() {
  if (!storeInstance) {
    const StoreModule = await import('electron-store')
    // Handle both default and named export depending on ESM resolution
    const Store = (StoreModule as any).default || StoreModule
    storeInstance = new Store({
      defaults: {
        lastRepoPath: null as string | null,
        recentRepos: [] as string[]
      }
    })
  }
  return storeInstance
}

export function setupIpcHandlers(): void {
  ipcMain.handle('git:status', async (_, repoPath: string) => {
    const result = await repoManager.getRepo(repoPath).status()
    return JSON.parse(JSON.stringify(result))
  })

  ipcMain.handle('git:log', async (_, repoPath: string, options) => {
    const result = await repoManager.getRepo(repoPath).log(options || {})
    return JSON.parse(JSON.stringify(result))
  })

  ipcMain.handle('git:commit', async (_, repoPath: string, message: string, files?: string[]) => {
    const result = await repoManager.getRepo(repoPath).commit(message, files)
    return JSON.parse(JSON.stringify(result))
  })

  ipcMain.handle('git:pull', async (_, repoPath: string) => {
    const result = await repoManager.getRepo(repoPath).pull()
    return JSON.parse(JSON.stringify(result))
  })

  ipcMain.handle('git:push', async (_, repoPath: string) => {
    const result = await repoManager.getRepo(repoPath).push()
    return JSON.parse(JSON.stringify(result))
  })

  ipcMain.on('git:progress-start', () => {
    // Placeholder for stream responses
  })

  ipcMain.handle('git:selectRepository', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    
    if (canceled || filePaths.length === 0) return null
    
    const selectedPath = filePaths[0]
    
    const gitDir = path.join(selectedPath, '.git')
    if (!fs.existsSync(gitDir)) {
      throw new Error('Not a valid Git repository')
    }
    
    const store = await getStore()
    store.set('lastRepoPath', selectedPath)
    
    let recentRepos = store.get('recentRepos') as string[] || []
    recentRepos = [selectedPath, ...recentRepos.filter((p: string) => p !== selectedPath)].slice(0, 5)
    store.set('recentRepos', recentRepos)
    
    return selectedPath
  })

  ipcMain.handle('git:getRecentRepos', async () => {
    const store = await getStore()
    const repos = store.get('recentRepos') as string[] || []
    const validRepos = repos.filter((repoPath: string) => {
      try {
        return fs.existsSync(path.join(repoPath, '.git'))
      } catch {
        return false
      }
    })
    
    if (validRepos.length !== repos.length) {
      store.set('recentRepos', validRepos)
    }
    
    return validRepos
  })

  ipcMain.handle('git:getLastRepoPath', async () => {
    const store = await getStore()
    const lastRepoPath = store.get('lastRepoPath') as string | null
    if (lastRepoPath && fs.existsSync(path.join(lastRepoPath, '.git'))) {
      return lastRepoPath
    }
    store.set('lastRepoPath', null)
    return null
  })
}
