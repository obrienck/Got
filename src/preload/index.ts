// src/preload/index.ts
// Exposes a secure gitAPI to the renderer via contextBridge

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

export const gitAPI = {
  // --- Repository selection & persistence ---
  selectRepository: () => ipcRenderer.invoke('git:selectRepository'),
  getRecentRepos: () => ipcRenderer.invoke('git:getRecentRepos'),
  getLastRepoPath: () => ipcRenderer.invoke('git:getLastRepoPath'),

  // --- Git operations ---
  status: (repoPath: string) => ipcRenderer.invoke('git:status', repoPath),
  log: (repoPath: string, options?: any) => ipcRenderer.invoke('git:log', repoPath, options),
  stage: (repoPath: string, files: string[]) => ipcRenderer.invoke('git:stage', repoPath, files),
  unstage: (repoPath: string, files: string[]) =>
    ipcRenderer.invoke('git:unstage', repoPath, files),
  commit: (repoPath: string, message: string, files?: string[]) =>
    ipcRenderer.invoke('git:commit', repoPath, message, files),
  checkout: (repoPath: string, branch: string) =>
    ipcRenderer.invoke('git:checkout', repoPath, branch),
  pull: (repoPath: string) => ipcRenderer.invoke('git:pull', repoPath),
  push: (repoPath: string) => ipcRenderer.invoke('git:push', repoPath),
  onProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('git:progress', (_event, progress) => callback(progress))
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('gitAPI', gitAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.gitAPI = gitAPI
}
