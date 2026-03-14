import { useEffect, useRef } from 'react'

interface Commit {
  hash: string
  message: string
  author_name: string
  date: string
}

interface CommitGraphProps {
  commits: Commit[]
}

export default function CommitGraph({ commits }: CommitGraphProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const draw = (): void => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = 150
      canvas.height = container.scrollHeight

      const rowHeight = 48
      const centerY = rowHeight / 2
      const startY = 32 // Approximate header height offset

      const colors = {
        main: '#bb9af7',
        feature: '#7dcfff',
        hotfix: '#f7768e'
      }

      ctx.lineWidth = 2.5
      const col1 = 30
      const col2 = 60
      const col3 = 90

      // Simplified graph rendering for demonstration
      // In a real app, this would be based on the actual commit ancestry
      ctx.beginPath()
      ctx.strokeStyle = colors.main
      ctx.moveTo(col1, startY + centerY)
      ctx.lineTo(col1, startY + rowHeight * commits.length)
      ctx.stroke()

      commits.forEach((_commit, i) => {
        const y = startY + centerY + i * rowHeight
        const color = i === 1 ? colors.feature : i === 2 ? colors.hotfix : colors.main

        // Fork/Merge visual simulation
        if (i === 1) {
          ctx.beginPath()
          ctx.strokeStyle = colors.feature
          ctx.moveTo(col1, y + rowHeight)
          ctx.bezierCurveTo(col1, y + rowHeight / 2, col2, y + rowHeight / 2, col2, y)
          ctx.stroke()
        }

        if (i === 2) {
          ctx.beginPath()
          ctx.strokeStyle = colors.hotfix
          ctx.moveTo(col1, y + rowHeight)
          ctx.bezierCurveTo(col1, y + rowHeight / 2, col3, y + rowHeight / 2, col3, y)
          ctx.stroke()
        }

        // Draw node
        ctx.beginPath()
        ctx.arc(i === 1 ? col2 : i === 2 ? col3 : col1, y, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#1a1b26'
        ctx.fill()
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(i === 1 ? col2 : i === 2 ? col3 : col1, y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      })
    }

    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [commits])

  return (
    <section
      className="flex-1 bg-git-dark relative overflow-hidden flex flex-col"
      data-purpose="commit-graph-view"
    >
      <div className="h-10 bg-git-panel border-b border-git-border flex items-center px-4 text-xs">
        <div className="flex space-x-6">
          <span className="text-white border-b-2 border-git-accent h-10 flex items-center cursor-pointer transition-colors">
            Graph
          </span>
          <span className="opacity-50 hover:opacity-100 h-10 flex items-center cursor-pointer transition-colors">
            Files
          </span>
          <span className="opacity-50 hover:opacity-100 h-10 flex items-center cursor-pointer transition-colors">
            Blame
          </span>
        </div>
      </div>

      <div className="flex-1 relative overflow-y-auto" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: '150px', zIndex: 10 }}
        />
        <div className="relative z-20">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-git-dark text-left text-xs text-slate-500 uppercase border-b border-git-border">
              <tr>
                <th className="w-[150px] p-2 font-normal">Graph</th>
                <th className="p-2 font-normal">Message</th>
                <th className="p-2 font-normal">Author</th>
                <th className="p-2 font-normal">Date</th>
                <th className="p-2 font-normal">SHA</th>
              </tr>
            </thead>
            <tbody className="mono text-[11px]">
              {commits.map((commit) => (
                <tr
                  key={commit.hash}
                  className="hover:bg-white/5 border-b border-git-border/50 group cursor-pointer transition-colors"
                >
                  <td className="h-12 w-[150px]"></td>
                  <td className="p-2">
                    <span className="text-white font-medium truncate block max-w-md">
                      {commit.message}
                    </span>
                  </td>
                  <td className="p-2 text-git-accent">{commit.author_name}</td>
                  <td className="p-2 whitespace-nowrap opacity-60">
                    {new Date(commit.date).toLocaleDateString()}
                  </td>
                  <td className="p-2 opacity-60">{commit.hash.substring(0, 7)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
