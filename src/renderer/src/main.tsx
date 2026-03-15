// src/renderer/src/main.tsx
// Entry point: wraps app with QueryClientProvider + RepoProvider

import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RepoProvider } from './context/RepoContext'
import App from './App'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RepoProvider>
        <App />
      </RepoProvider>
    </QueryClientProvider>
  </StrictMode>
)
