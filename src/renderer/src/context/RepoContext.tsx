// src/renderer/src/context/RepoContext.tsx
// React Context for current repository path — loads persisted path on mount

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface RepoContextValue {
  currentRepoPath: string | null
  setCurrentRepoPath: (path: string | null) => void
  isLoading: boolean
}

const RepoContext = createContext<RepoContextValue | null>(null)

export function RepoProvider({ children }: { children: ReactNode }) {
  const [currentRepoPath, setCurrentRepoPath] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount, load the last-used repo path from electron-store via IPC
  useEffect(() => {
    window.gitAPI
      .getLastRepoPath()
      .then((path) => {
        if (path) setCurrentRepoPath(path)
      })
      .catch((err) => {
        console.error('Failed to load last repo path:', err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  return (
    <RepoContext.Provider value={{ currentRepoPath, setCurrentRepoPath, isLoading }}>
      {children}
    </RepoContext.Provider>
  )
}

export function useRepoContext(): RepoContextValue {
  const ctx = useContext(RepoContext)
  if (!ctx) {
    throw new Error('useRepoContext must be used within a RepoProvider')
  }
  return ctx
}
