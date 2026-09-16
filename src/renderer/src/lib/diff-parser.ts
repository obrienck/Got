// src/renderer/src/lib/diff-parser.ts
// Parses `git diff`'s unified diff text into structured files/hunks/lines,
// and pairs up del/add lines for a side-by-side (split) view.

export type DiffLineType = 'context' | 'add' | 'del'

export interface DiffLine {
  type: DiffLineType
  oldLine: number | null
  newLine: number | null
  content: string
}

export interface DiffHunk {
  header: string
  lines: DiffLine[]
}

export interface DiffFile {
  path: string
  oldPath: string | null
  isNew: boolean
  isDeleted: boolean
  isBinary: boolean
  additions: number
  deletions: number
  hunks: DiffHunk[]
}

const FILE_HEADER_RE = /^diff --git a\/(.+) b\/(.+)$/
const HUNK_HEADER_RE = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/

export function parseDiff(raw: string): DiffFile[] {
  if (!raw.trim()) return []

  const files: DiffFile[] = []
  let current: DiffFile | null = null
  let hunk: DiffHunk | null = null
  let oldLine = 0
  let newLine = 0

  const lines = raw.split('\n')

  for (const line of lines) {
    const fileMatch = line.match(FILE_HEADER_RE)
    if (fileMatch) {
      current = {
        path: fileMatch[2],
        oldPath: fileMatch[1] !== fileMatch[2] ? fileMatch[1] : null,
        isNew: false,
        isDeleted: false,
        isBinary: false,
        additions: 0,
        deletions: 0,
        hunks: []
      }
      files.push(current)
      hunk = null
      continue
    }
    if (!current) continue

    if (line.startsWith('new file mode')) {
      current.isNew = true
      continue
    }
    if (line.startsWith('deleted file mode')) {
      current.isDeleted = true
      continue
    }
    if (line.startsWith('Binary files ')) {
      current.isBinary = true
      continue
    }
    if (line.startsWith('--- ') || line.startsWith('+++ ')) continue

    const hunkMatch = line.match(HUNK_HEADER_RE)
    if (hunkMatch) {
      oldLine = parseInt(hunkMatch[1], 10)
      newLine = parseInt(hunkMatch[2], 10)
      hunk = { header: line, lines: [] }
      current.hunks.push(hunk)
      continue
    }
    if (!hunk) continue

    if (line.startsWith('+')) {
      hunk.lines.push({ type: 'add', oldLine: null, newLine, content: line.slice(1) })
      newLine++
      current.additions++
    } else if (line.startsWith('-')) {
      hunk.lines.push({ type: 'del', oldLine, newLine: null, content: line.slice(1) })
      oldLine++
      current.deletions++
    } else if (line.startsWith('\\')) {
      // "\ No newline at end of file" — not a content line
      continue
    } else {
      hunk.lines.push({ type: 'context', oldLine, newLine, content: line.slice(1) })
      oldLine++
      newLine++
    }
  }

  return files
}

export interface SplitRow {
  left: DiffLine | null
  right: DiffLine | null
}

/** Pairs up consecutive del/add runs within a hunk for a side-by-side view. */
export function toSplitRows(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.type === 'context') {
      rows.push({ left: line, right: line })
      i++
      continue
    }
    const dels: DiffLine[] = []
    while (i < lines.length && lines[i].type === 'del') {
      dels.push(lines[i])
      i++
    }
    const adds: DiffLine[] = []
    while (i < lines.length && lines[i].type === 'add') {
      adds.push(lines[i])
      i++
    }
    const max = Math.max(dels.length, adds.length)
    for (let j = 0; j < max; j++) {
      rows.push({ left: dels[j] || null, right: adds[j] || null })
    }
  }
  return rows
}
