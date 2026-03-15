import React, { createContext, useContext, useState, useEffect } from 'react'

interface RepoContextState {
  currentRepoPath: string | null
  setCurrentRepoPath: (path: string | null) => void
  isLoading: boolean
}

const RepoContext = createContext<RepoContextState | undefined>(undefined)

export function RepoProvider({ children }: { children: React.ReactNode }) {
  const [currentRepoPath, setCurrentRepoPath] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSavedRepo = async () => {
      try {
        const lastRepoPath = await window.gitAPI.getLastRepoPath()
        if (lastRepoPath) {
          setCurrentRepoPath(lastRepoPath)
        }
      } catch (error) {
        console.error('Failed to load last repo path', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSavedRepo()
  }, [])

  return (
    <RepoContext.Provider value={{ currentRepoPath, setCurrentRepoPath, isLoading }}>
      {children}
    </RepoContext.Provider>
  )
}

export function useRepoContext() {
  const context = useContext(RepoContext)
  if (context === undefined) {
    throw new Error('useRepoContext must be used within a RepoProvider')
  }
  return context
}
