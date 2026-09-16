// src/renderer/src/lib/commit-graph.ts
// Ancestry-aware commit graph layout. Assigns each commit a lane (column)
// based on parent/child relationships and produces the node + edge list
// needed to render branch/merge lines. Every curve is contained within a
// single commit row's height, gitk/GitKraken-style, so rendering only ever
// needs one row's worth of geometry at a time.

export interface GraphCommit {
  hash: string
  parents: string[]
}

export interface GraphNode {
  row: number
  col: number
  color: string
}

export interface GraphEdge {
  row: number
  fromCol: number
  toCol: number
  color: string
  // 'top'/'bottom' anchor to the row's edges, 'center' anchors to the node
  fromEdge: 'top' | 'center'
  toEdge: 'bottom' | 'center'
}

export interface CommitGraphLayout {
  nodes: GraphNode[]
  edges: GraphEdge[]
  laneCount: number
}

export function buildCommitGraph(commits: GraphCommit[], palette: string[]): CommitGraphLayout {
  // lanes[col] = the hash that column is currently waiting to render, or
  // null if the column is free for reuse.
  const lanes: Array<string | null> = []
  const laneColors: string[] = []
  let colorCursor = 0
  const nextColor = (): string => palette[colorCursor++ % palette.length]

  const allocateColumn = (hash: string, freshColor: boolean): number => {
    const free = lanes.indexOf(null)
    const col = free === -1 ? lanes.length : free
    if (col === lanes.length) lanes.push(hash)
    else lanes[col] = hash
    if (freshColor || laneColors[col] === undefined) laneColors[col] = nextColor()
    return col
  }

  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  commits.forEach((commit, row) => {
    const matchingCols: number[] = []
    lanes.forEach((h, col) => {
      if (h === commit.hash) matchingCols.push(col)
    })

    const isNewTip = matchingCols.length === 0
    const primaryCol = isNewTip ? allocateColumn(commit.hash, true) : matchingCols[0]
    if (isNewTip) matchingCols.push(primaryCol)

    const color = laneColors[primaryCol]
    nodes.push({ row, col: primaryCol, color })

    // The primary lane's own incoming line, from the row's top edge down to
    // its node — every lane except a brand new tip (nothing pointed to it
    // yet) needs this, or the node floats disconnected from the line above.
    if (!isNewTip) {
      edges.push({
        row,
        fromCol: primaryCol,
        toCol: primaryCol,
        color,
        fromEdge: 'top',
        toEdge: 'center'
      })
    }

    // Untouched lanes just pass straight through this row.
    lanes.forEach((h, col) => {
      if (h === null || col === primaryCol || matchingCols.includes(col)) return
      edges.push({
        row,
        fromCol: col,
        toCol: col,
        color: laneColors[col],
        fromEdge: 'top',
        toEdge: 'bottom'
      })
    })

    // Any other lane that was also waiting for this commit merges into it here.
    matchingCols.forEach((col) => {
      if (col === primaryCol) return
      edges.push({
        row,
        fromCol: col,
        toCol: primaryCol,
        color: laneColors[col],
        fromEdge: 'top',
        toEdge: 'center'
      })
      lanes[col] = null
    })

    lanes[primaryCol] = null // free for parent reassignment below

    const parents = commit.parents.filter(Boolean)
    parents.forEach((parentHash, i) => {
      if (i === 0) {
        lanes[primaryCol] = parentHash
        edges.push({
          row,
          fromCol: primaryCol,
          toCol: primaryCol,
          color,
          fromEdge: 'center',
          toEdge: 'bottom'
        })
        return
      }
      const col = allocateColumn(parentHash, true)
      edges.push({
        row,
        fromCol: primaryCol,
        toCol: col,
        color,
        fromEdge: 'center',
        toEdge: 'bottom'
      })
    })
  })

  return { nodes, edges, laneCount: lanes.length }
}
