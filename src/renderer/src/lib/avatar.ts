// src/renderer/src/lib/avatar.ts
// Deterministic initials + color for a person's name, used for avatar pills.

const AVATAR_COLORS = [
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-cyan-600',
  'bg-rose-600',
  'bg-amber-600'
]

export function initialsFor(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  )
}

export function avatarColorFor(name: string): string {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}
