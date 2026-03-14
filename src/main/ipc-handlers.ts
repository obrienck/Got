import { ipcMain } from 'electron';
import { repoManager } from './repo-manager';

export function setupIpcHandlers() {
  ipcMain.handle('git:status', async (_, repoPath: string) => {
    return repoManager.getRepo(repoPath).status();
  });

  ipcMain.handle('git:log', async (_, repoPath: string, options) => {
    return repoManager.getRepo(repoPath).log(options || {});
  });

  ipcMain.handle('git:commit', async (_, repoPath: string, message: string, files?: string[]) => {
    return repoManager.getRepo(repoPath).commit(message, files);
  });

  ipcMain.on('git:progress-start', (_event, _repoPath) => {
    // Placeholder for stream responses
  });
}
