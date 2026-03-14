# Got — AI AGENT GUIDELINES (v1.0)
# Copy-paste the entire content of this file at the VERY TOP of every prompt you give to any AI (Claude, Cursor, GPT-4o, Grok, etc.)

You are now working exclusively on "Got" — a modern Electron Git client that looks and feels exactly like GitKraken.

## PROJECT RULES — NEVER BREAK THESE

### 1. Project Name & Branding
- App name: **Got**
- Logo text: `</> Got` (use the exact font weight and indigo accent #6366f1)
- Theme: Dark mode only (#0f0f12 background, #1a1a1f panels, accent indigo #6366f1)

### 2. Tech Stack (MANDATORY — use exactly these versions where possible)
- Electron + Vite (electron-vite scaffold)
- React 18 + TypeScript (strict)
- Tailwind CSS + shadcn/ui (all components must come from shadcn)
- TanStack Query v5 (React Query) for all Git data
- Lucide React for icons
- Git backend: `simple-git` via `window.gitAPI` (never use child_process directly in renderer)
- State: React Context for current repo + TanStack Query for everything else
- Styling: Tailwind classes only (no inline styles except for dynamic graph colors)

### 3. Architecture Rules (enforce every time)
- All Git operations MUST go through `window.gitAPI` (exposed via contextBridge)
- Main process = Git + IPC only
- Renderer = pure UI + TanStack Query
- Never import `simple-git` or `child_process` in any renderer file
- Use `useRepoContext()` to get `currentRepoPath`
- Every screen that needs Git data must use:
  ```tsx
  const { data: status } = useQuery({ queryKey: ['status', currentRepoPath], queryFn: () => window.gitAPI.status(currentRepoPath) })
  const { data: log } = useQuery({ queryKey: ['log', currentRepoPath], queryFn: () => window.gitAPI.log(currentRepoPath, { '--all': true }) })
  ```

### 4. UI & Design Rules (match the mockups 100%)

Colors:
Background: #0f0f12
Panels: #1a1a1f
Accent: #6366f1 (indigo)
Graph lines: main = #a855f7 (purple), feature = #22d3ee (cyan), fix = #f43f5e (rose)

Commit graph must use SVG or @gitgraph/react and match the exact curvature/style from the provided mockup
Right panel width ≈ 320px, left sidebar ≈ 280px
All buttons, inputs, checkboxes must use shadcn/ui components
File status letters: M = modified (#a855f7), A = added (#22c55e), D = deleted (#ef4444)

### 5. File & Folder Structure (respect this)
```text
src/renderer/
├── screens/
│   └── RepositoryView.tsx          ← main screen we are building
├── components/
│   ├── CommitGraph.tsx
│   ├── FileTree.tsx
│   ├── StagedChanges.tsx
│   └── ...
├── hooks/
│   ├── useGitStatus.ts
│   └── useCommitGraph.ts
├── context/
│   └── RepoContext.tsx
└── lib/
    └── git-api.ts                  ← type definitions for window.gitAPI
```

### 6. Git API Contract (always use these exact method names)
```typescript
window.gitAPI.status(repoPath)
window.gitAPI.log(repoPath, options?)
window.gitAPI.stage(files)
window.gitAPI.unstage(files)
window.gitAPI.commit(summary, description)
window.gitAPI.checkout(branch)
window.gitAPI.pull()
window.gitAPI.push()
```

### 7. Workflow Rules

After any mutation (commit, stage, checkout, etc.) → ALWAYS invalidate and refetch both ['status'] and ['log'] queries
Show loading skeletons + error toasts (use sonner)
Add keyboard shortcuts when logical (Cmd/Ctrl+Enter = commit, etc.)
Never hallucinate new API methods — if something is missing, say "Please add this method to gitAPI first"

### 8. Output Format

Always return complete, ready-to-paste files with proper imports
Include file path in comment at the top
Never wrap in markdown code blocks unless asked
Add helpful comments where the connection to window.gitAPI happens
