import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Card, CardContent, CardHeader, IconButton, Tooltip as MTooltip, Typography, Alert
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

  const wrapRef = useRef(null)
  const [wrapW, setWrapW] = useState(0)

  useLayoutEffect(() => {
    if (wrapRef.current) setWrapW(wrapRef.current.clientWidth || 0)
  }, [])

  useEffect(() => {
    const onWinResize = () => { if (wrapRef.current) setWrapW(wrapRef.current.clientWidth || 0) }
    window.addEventListener('resize', onWinResize, { passive: true })

    let ro
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(entries => {
        for (const e of entries) setWrapW(e.contentRect.width || 0)
      })
      if (wrapRef.current) ro.observe(wrapRef.current)
    }
    return () => { window.removeEventListener('resize', onWinResize); if (ro) ro.disconnect() }
  }, [])

  const gap = 2

  const targetHeight = typeof window !== 'undefined'
    ? (window.innerWidth < 768 ? Math.max(320, Math.min(560, Math.floor(window.innerHeight * 0.6))) : 560)
    : 560

  const byW = Math.floor((Math.max(0, wrapW) - (cols - 1) * gap) / cols)
  const byH = Math.floor((targetHeight - (rows - 1) * gap) / rows)
  const fallbackByW = typeof window !== 'undefined'
    ? Math.floor((Math.max(240, window.innerWidth - 48) - (cols - 1) * gap) / cols)
    : 16

  let cellSize = Math.min(
    Math.max(6, byW || fallbackByW),
    Math.max(6, byH || 9999),
    40
  )

  const contentW = Math.max(0, cols * cellSize + (cols - 1) * gap)
  const contentH = Math.max(0, rows * cellSize + (rows - 1) * gap)

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

  const dragKindRef = useRef(null)
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
              <MTooltip title="Pause">
                <IconButton
                  size="small"
                  onClick={pause}
                  sx={{ color: '#f87171', '&:hover': { color: '#ef4444', background: 'rgba(248,113,113,.08)' } }}
                >
                  <PauseRoundedIcon fontSize="small" />
                </IconButton>
              </MTooltip>
            ) : (
              <MTooltip title="Play">
                <IconButton
                  size="small"
                  onClick={run}
                  sx={{ color: '#10b981', '&:hover': { color: '#059669', background: 'rgba(16,185,129,.08)' } }}
                >
                  <PlayArrowRoundedIcon fontSize="small" />
                </IconButton>
              </MTooltip>
            )}
            <MTooltip title="Step">
              <IconButton
                size="small"
                onClick={applyOneStep}
                sx={{ color: '#8b5cf6', '&:hover': { color: '#7c3aed', background: 'rgba(139,92,246,.08)' } }}
              >
                <SkipNextRoundedIcon fontSize="small" />
              </IconButton>
            </MTooltip>
            <MTooltip title="Reset">
              <IconButton
                size="small"
                onClick={reset}
                sx={{ color: '#94a3b8', '&:hover': { color: '#e5e7eb', background: 'rgba(148,163,184,.08)' } }}
              >
                <RestartAltRoundedIcon fontSize="small" />
              </IconButton>
            </MTooltip>
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
          ref={wrapRef}
          className="rounded-lg border border-slate-700 bg-slate-900 w-full"
          style={{
            overflow: 'auto',                   
            padding: 12,
            maxHeight: targetHeight + 24,      
          }}
        >
          <div
            className="grid"
            style={{
              width: contentW,
              height: contentH,
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
              gap: `${gap}px`,
            }}
          >
            {grid.map((row, r) => row.map((_, c) => {
              const isHandle = (r === start.r && c === start.c) || (r === goal.r && c === goal.c)
              return (
                <div
                  key={`${r}-${c}`}
                  className={`rounded ${colorFor(r, c)} transition-colors duration-300 ease-in-out transform hover:scale-105`}
                  title={`(${r}, ${c})`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    cursor: isHandle ? 'grab' : 'default',
                    transition: 'transform 300ms ease-in-out, box-shadow 300ms ease-in-out',
                    boxShadow: highlights.path.has(`${r},${c}`) ? '0 0 10px rgba(255, 255, 0, 0.8)' : 'none',
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

        <div className="mt-4 sm:mt-5 flex flex-wrap gap-3 sm:gap-4 text-sm">
          <Legend swatch="bg-slate-900" label="Wall" />
          <Legend swatch="bg-slate-500/35" label="Empty (tinted by weight)" />
          <Legend swatch="bg-emerald-500" label="Start" />
          <Legend swatch="bg-cyan-400" label="Goal" />
          <Legend swatch="bg-sky-400" label="Frontier" />
          <Legend swatch="bg-indigo-400" label="Visited" />
          <Legend swatch="bg-yellow-400" label="Path" />
        </div>

        <Typography variant="caption" className="text-slate-400 block mt-2">
          Tip: drag the <span className="text-emerald-400 font-semibold">Start</span> and <span className="text-cyan-300 font-semibold">Goal</span> tiles to reposition.
        </Typography>
      </CardContent>
    </Card>
  )
}
