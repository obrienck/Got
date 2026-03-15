// src/main/ipc-handlers.ts
// All IPC handlers for Git operations + repository selection/persistence

import { ipcMain, dialog, BrowserWindow } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import StoreModule from 'electron-store'
import { repoManager } from './repo-manager'

// Handle ESM/CJS interop — electron-store v11 is ESM-only
const Store = (StoreModule as any).default || StoreModule

// electron-store for persisting repo paths
const store = new Store({
  defaults: {
    lastRepoPath: null as string | null,
    recentRepos: [] as string[]
  }
})

/**
 * Adds a repo path to recent repos (max 5, most-recent-first, unique).
 * Also sets it as lastRepoPath.
 */
function persistRepoPath(repoPath: string): void {
  store.set('lastRepoPath', repoPath)
  const recent = store.get('recentRepos', [])
  const filtered = recent.filter((p) => p !== repoPath)
  const updated = [repoPath, ...filtered].slice(0, 5)
  store.set('recentRepos', updated)
}

export function setupIpcHandlers(mainWindow: BrowserWindow): void {
  // --- Repository selection & persistence ---

  ipcMain.handle('git:selectRepository', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Git Repository',
      properties: ['openDirectory'],
      buttonLabel: 'Open Repository'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const selectedPath = result.filePaths[0]

    // Validate it's a git repo by checking for .git folder
    const gitDir = join(selectedPath, '.git')
    if (!existsSync(gitDir)) {
      return { error: 'NOT_A_GIT_REPO', path: selectedPath }
    }

    // Persist and return
    persistRepoPath(selectedPath)
    return { path: selectedPath }
  })

  ipcMain.handle('git:getRecentRepos', async () => {
    return store.get('recentRepos', [])
  })

  ipcMain.handle('git:getLastRepoPath', async () => {
    return store.get('lastRepoPath', null)
  })

  // --- Git operations ---
  // JSON round-trip to strip non-serializable properties from simple-git results
  const toPlain = (obj: any) => JSON.parse(JSON.stringify(obj))

  ipcMain.handle('git:status', async (_, repoPath: string) => {
    const result = await repoManager.getRepo(repoPath).status()
    return toPlain(result)
  })

  ipcMain.handle('git:log', async (_, repoPath: string, options) => {
    const result = await repoManager.getRepo(repoPath).log(options || {})
    return toPlain(result)
  })

  ipcMain.handle('git:stage', async (_, repoPath: string, files: string[]) => {
    return repoManager.getRepo(repoPath).stage(files)
  })

  ipcMain.handle('git:unstage', async (_, repoPath: string, files: string[]) => {
    return repoManager.getRepo(repoPath).unstage(files)
  })

  ipcMain.handle('git:commit', async (_, repoPath: string, message: string, files?: string[]) => {
    const result = await repoManager.getRepo(repoPath).commit(message, files)
    return toPlain(result)
  })

  ipcMain.handle('git:checkout', async (_, repoPath: string, branch: string) => {
    return repoManager.getRepo(repoPath).checkout(branch)
  })

  ipcMain.handle('git:pull', async (_, repoPath: string) => {
    const result = await repoManager.getRepo(repoPath).pull()
    return toPlain(result)
  })

  ipcMain.handle('git:push', async (_, repoPath: string) => {
    const result = await repoManager.getRepo(repoPath).push()
    return toPlain(result)
  })

  ipcMain.on('git:progress-start', () => {
    // Placeholder for stream responses
  })
}
