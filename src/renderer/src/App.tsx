import React from 'react'
import { RepoProvider } from './context/RepoContext'
import RepositoryScreen from '../screens/RepositoryScreen'

export default function App(): React.JSX.Element {
  return (
    <RepoProvider>
      <RepositoryScreen />
    </RepoProvider>
  )
}

