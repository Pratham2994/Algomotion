import { useRef } from 'react'
import {
  Card, CardContent, CardHeader, IconButton, Tooltip, Typography, Alert
} from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import { WALL } from '../../lib/pathCore'

function Legend({ swatch, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded ${swatch}`} />
      <span className="text-slate-300">{label}</span>
    </div>
  )
}

export default function GridViz({
  grid, start, goal, setStart, setGoal,
  highlights, weights, noPath,
  running, run, pause, applyOneStep, reset
}) {
  const rows = grid.length, cols = grid[0].length
  const cellSize = Math.floor(Math.max(12, 560 / Math.max(rows, cols)))

  const colorFor = (r, c) => {
    const k = r + ',' + c
    if (start.r === r && start.c === c) return 'bg-emerald-500'
    if (goal.r === r && goal.c === c) return 'bg-cyan-400'
    if (highlights.path.has(k)) return 'bg-yellow-400'
    if (highlights.visit.has(k)) return 'bg-indigo-400'
    if (highlights.frontier.has(k)) return 'bg-sky-400'
    if (grid[r][c] === WALL) return 'bg-slate-900'
    if (weights) {
      const w = weights[r][c]
      if (w === 1) return 'bg-slate-500/30'
      if (w === 2) return 'bg-slate-500/50'
      if (w === 3) return 'bg-slate-500/70'
    }
    return 'bg-slate-500/35'
  }

  // ----- drag to move start/goal (pointer events, works for mouse & touch) -----
  const dragKindRef = useRef(null) // 'start' | 'goal' | null

  const inb = (r, c) => r >= 1 && c >= 1 && r < rows - 1 && c < cols - 1
  const canPlace = (r, c) =>
    inb(r, c) && grid[r][c] !== WALL &&
    !(r === start.r && c === start.c) &&
    !(r === goal.r && c === goal.c)

  const beginDrag = (kind, ev) => {
    dragKindRef.current = kind
    ev.preventDefault()

    const onMove = (e) => {
      if (!dragKindRef.current) return
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const id = el?.getAttribute?.('data-rc')
      if (!id) return
      const [r, c] = id.split(',').map(Number)
      if (!canPlace(r, c)) return
      if (dragKindRef.current === 'start') setStart({ r, c })
      else setGoal({ r, c })
    }

    const endDrag = () => {
      dragKindRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', endDrag, { passive: true })
    window.addEventListener('pointercancel', endDrag, { passive: true })
  }

  return (
    <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
      <CardHeader
        title={<Typography variant="h6" className="!font-semibold">Grid</Typography>}
        action={
          <div className="flex items-center gap-1">
            {running ? (
              <Tooltip title="Pause">
                <IconButton size="small" onClick={pause} sx={{ color: '#e2e8f0' }}>
                  <PauseRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Run">
                <IconButton size="small" onClick={run} sx={{ color: '#e2e8f0' }}>
                  <PlayArrowRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Step">
              <IconButton size="small" onClick={applyOneStep} sx={{ color: '#e2e8f0' }}>
                <SkipNextRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset">
              <IconButton size="small" onClick={reset} sx={{ color: '#e2e8f0' }}>
                <RestartAltRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ p: 3 }}>
        {noPath && (
          <Alert
            severity="warning"
            variant="outlined"
            sx={{ mb: 2, borderColor: '#b45309', color: '#fbbf24', background: 'transparent' }}
          >
            No path found. Try fewer obstacles or enable diagonals.
          </Alert>
        )}

        <div
          className="rounded-lg border border-slate-700 p-4 bg-slate-900"
          style={{ overflow: 'hidden', userSelect: 'none' }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
              gap: '2px', justifyContent: 'center'
            }}
          >
            {grid.map((row, r) => row.map((_, c) => {
              const isHandle = (r === start.r && c === start.c) || (r === goal.r && c === goal.c)
              return (
                <div
                  key={`${r}-${c}`}
                  className={`rounded ${colorFor(r, c)} transition-colors duration-150`}
                  title={`(${r}, ${c})`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    cursor: isHandle ? 'grab' : 'default'
                  }}
                  data-rc={`${r},${c}`}
                  onPointerDown={(e) => {
                    if (r === start.r && c === start.c) beginDrag('start', e)
                    else if (r === goal.r && c === goal.c) beginDrag('goal', e)
                  }}
                />
              )
            }))}
          </div>
        </div>

        {/* tiny discoverability hint */}
        <Typography variant="caption" className="text-slate-400 block mt-2">
          Tip: drag the <span className="text-emerald-400 font-semibold">Start</span> and <span className="text-cyan-300 font-semibold">Goal</span> tiles to reposition.
        </Typography>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Legend swatch="bg-slate-900" label="Wall" />
          <Legend swatch="bg-slate-500/35" label="Empty (tinted by weight)" />
          <Legend swatch="bg-emerald-500" label="Start" />
          <Legend swatch="bg-cyan-400" label="Goal" />
          <Legend swatch="bg-sky-400" label="Frontier" />
          <Legend swatch="bg-indigo-400" label="Visited" />
          <Legend swatch="bg-yellow-400" label="Path" />
        </div>
      </CardContent>
    </Card>
  )
}
