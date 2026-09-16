// src/renderer/src/lib/blame-parser.ts
// Parses `git blame --line-porcelain` output into one record per line.
// --line-porcelain repeats full metadata for every line (unlike plain
// --porcelain, which abbreviates repeats), so no state needs to carry
// forward between lines beyond the current line's own header block.

export interface BlameLine {
  hash: string
  author: string
  date: string
  summary: string
  line: number
  content: string
}

const HEADER_RE = /^([0-9a-f]{40}) \d+ (\d+)/

export function parseBlame(raw: string): BlameLine[] {
  const result: BlameLine[] = []
  let current: Partial<BlameLine> & { authorTime?: number } = {}

  for (const line of raw.split('\n')) {
    const headerMatch = line.match(HEADER_RE)
    if (headerMatch) {
      current = { hash: headerMatch[1], line: parseInt(headerMatch[2], 10) }
      continue
    }
    if (line.startsWith('author ')) current.author = line.slice(7)
    else if (line.startsWith('author-time ')) current.authorTime = parseInt(line.slice(12), 10)
    else if (line.startsWith('summary ')) current.summary = line.slice(8)
    else if (line.startsWith('\t')) {
      result.push({
        hash: current.hash || '',
        author: current.author || '',
        date: current.authorTime ? new Date(current.authorTime * 1000).toISOString() : '',
        summary: current.summary || '',
        line: current.line || 0,
        content: line.slice(1)
      })
    }
  }

  return result
}
