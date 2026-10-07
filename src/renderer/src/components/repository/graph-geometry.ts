// src/renderer/src/components/repository/graph-geometry.ts
// Shared commit-graph layout math + colors, used by both the normal and
// synthwave repository views so the graph itself is identical — only the
// stroke/fill treatment differs per theme.

export const GRAPH_COLORS = ['#a855f7', '#22d3ee', '#f43f5e', '#22c55e', '#f59e0b']

export const ROW_HEIGHT = 32
export const LANE_WIDTH = 18

export function laneX(col: number): number {
  return col * LANE_WIDTH + LANE_WIDTH / 2
}

export function edgeY(row: number, edge: 'top' | 'center' | 'bottom'): number {
  const top = row * ROW_HEIGHT
  if (edge === 'top') return top
  if (edge === 'bottom') return top + ROW_HEIGHT
  return top + ROW_HEIGHT / 2
}

export function edgePath(x0: number, y0: number, x1: number, y1: number): string {
  if (x0 === x1) return `M ${x0} ${y0} L ${x1} ${y1}`
  const midY = (y0 + y1) / 2
  return `M ${x0} ${y0} C ${x0} ${midY}, ${x1} ${midY}, ${x1} ${y1}`
}
