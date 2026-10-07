// src/renderer/src/App.tsx
// Root app component — renders the RepositoryScreen orchestrator

import RepositoryScreen from '../screens/RepositoryScreen'
import { ThemeProvider } from './context/ThemeContext'

export default function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <RepositoryScreen />
    </ThemeProvider>
  )
}
