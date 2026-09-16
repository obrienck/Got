// src/main/ipc-handlers.ts
// All IPC handlers for Git operations + repository selection/persistence

import { ipcMain, dialog, BrowserWindow, type OpenDialogOptions } from 'electron'
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

/** Derives a folder name from a clone URL, e.g. "https://host/user/repo.git" -> "repo". */
function repoNameFromUrl(url: string): string {
  const cleaned = url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\.git$/, '')
  const lastSegment = cleaned.split(/[/:]/).pop()
  return lastSegment || 'repository'
}

/** Looked up fresh on every call (never captured), since the app's window can be
 *  closed and recreated (e.g. macOS 'activate') independently of when these
 *  handlers were registered. */
function openDirectoryDialog(options: OpenDialogOptions): ReturnType<typeof dialog.showOpenDialog> {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
  return win ? dialog.showOpenDialog(win, options) : dialog.showOpenDialog(options)
}

export function setupIpcHandlers(): void {
  // --- Repository selection & persistence ---

  ipcMain.handle('git:selectRepository', async () => {
    const result = await openDirectoryDialog({
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

  ipcMain.handle('git:cloneRepository', async (_, url: string) => {
    const result = await openDirectoryDialog({
      title: 'Choose where to clone this repository',
      properties: ['openDirectory'],
      buttonLabel: 'Select Folder'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const targetPath = join(result.filePaths[0], repoNameFromUrl(url))
    if (existsSync(targetPath)) {
      return { error: 'DIR_EXISTS', path: targetPath }
    }

    try {
      await repoManager.getRepo(targetPath).clone(url, targetPath)
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }

    persistRepoPath(targetPath)
    return { path: targetPath }
  })

  ipcMain.handle('git:initRepository', async () => {
    const result = await openDirectoryDialog({
      title: 'Choose or create a folder for the new repository',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Init Repository'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const targetPath = result.filePaths[0]
    if (existsSync(join(targetPath, '.git'))) {
      return { error: 'ALREADY_A_REPO', path: targetPath }
    }

    try {
      await repoManager.getRepo(targetPath).init()
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }

    persistRepoPath(targetPath)
    return { path: targetPath }
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

  ipcMain.handle('git:branchesLocal', async (_, repoPath: string) => {
    const result = await repoManager.getRepo(repoPath).branchesLocal()
    return toPlain(result)
  })

  ipcMain.handle('git:branchesRemote', async (_, repoPath: string) => {
    const result = await repoManager.getRepo(repoPath).branchesRemote()
    return toPlain(result)
  })

  ipcMain.handle('git:tags', async (_, repoPath: string) => {
    const result = await repoManager.getRepo(repoPath).tags()
    return toPlain(result)
  })

  ipcMain.handle('git:stashes', async (_, repoPath: string) => {
    const result = await repoManager.getRepo(repoPath).stashes()
    return toPlain(result)
  })

  ipcMain.handle('git:createBranch', async (_, repoPath: string, name: string) => {
    return repoManager.getRepo(repoPath).createBranch(name)
  })

  ipcMain.handle('git:getUserConfig', async (_, repoPath: string) => {
    return repoManager.getRepo(repoPath).getUserConfig()
  })

  ipcMain.handle('git:getCommitDiff', async (_, repoPath: string, hash: string) => {
    return repoManager.getRepo(repoPath).getCommitDiff(hash)
  })

  ipcMain.handle('git:listDirectory', async (_, repoPath: string, relativePath?: string) => {
    return repoManager.getRepo(repoPath).listDirectory(relativePath)
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
