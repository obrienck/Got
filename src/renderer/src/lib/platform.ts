// src/renderer/src/lib/platform.ts
// Electron's platform never changes during the app's lifetime, so this is
// safe to compute once at module load rather than re-checking per render.
export const IS_MAC = window.electron?.process?.platform === 'darwin'

// Tailwind arbitrary-property classes for Electron's custom title bar drag
// regions — the whole top bar is draggable so the window can still be moved
// with titleBarStyle: 'hidden', except the actual interactive controls in it.
export const DRAG_REGION = '[-webkit-app-region:drag]'
export const NO_DRAG = '[-webkit-app-region:no-drag]'
