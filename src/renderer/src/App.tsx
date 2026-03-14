import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import WelcomeScreen from './components/WelcomeScreen'
import Toolbar from './components/Layout/Toolbar'
import SidebarLeft from './components/Layout/SidebarLeft'
import SidebarRight from './components/Layout/SidebarRight'
import CommitGraph from './components/CommitGraph/CommitGraph'

const { gitAPI } = window as any

export default function App(): React.JSX.Element {
  const [repoPath, setRepoPath] = useState<string | null>(null)

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['status', repoPath],
    queryFn: () => gitAPI.status(repoPath),
    enabled: !!repoPath
  })

  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ['log', repoPath],
    queryFn: () => gitAPI.log(repoPath),
    enabled: !!repoPath
  })

  const handleCommit = async (message: string, description: string): Promise<void> => {
    if (!repoPath) return
    const fullMessage = description ? `${message}\n\n${description}` : message
    try {
      await gitAPI.commit(repoPath, fullMessage)
      refetchStatus()
      refetchHistory()
    } catch (error) {
      console.error('Commit failed:', error)
    }
  }

  const handlePull = async (): Promise<void> => {
    if (!repoPath) return
    try {
      await gitAPI.pull(repoPath)
      refetchStatus()
      refetchHistory()
    } catch (error) {
      console.error('Pull failed:', error)
    }
  }

  const handlePush = async (): Promise<void> => {
    if (!repoPath) return
    try {
      await gitAPI.push(repoPath)
      refetchStatus()
      refetchHistory()
    } catch (error) {
      console.error('Push failed:', error)
    }
  }

  if (repoPath === null) {
    return (
      <WelcomeScreen
        onOpenRepo={(path) => {
          setRepoPath(path)
        }}
      />
    )
  }

  const unstagedFiles =
    status?.files?.map((f: any) => ({
      path: f.path,
      status: f.index === ' ' ? f.working_dir : f.index
    })) || []

  return (
    <div className="h-screen w-screen flex flex-col bg-git-dark overflow-hidden">
      <Toolbar
        branch={status?.current || 'main'}
        onPull={handlePull}
        onPush={handlePush}
        onNewBranch={() => console.log('New branch')}
      />

      <main className="flex flex-1 overflow-hidden" data-purpose="main-layout-container">
        <SidebarLeft
          currentBranch={status?.current || 'main'}
          branches={status?.branches ? Object.keys(status.branches) : ['main']}
        />

        <CommitGraph commits={history?.all || []} />

        <SidebarRight
          unstaged={unstagedFiles}
          stagedCount={status?.staged?.length || 0}
          onCommit={handleCommit}
        />
      </main>
    </div>
  )
}
