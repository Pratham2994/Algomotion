import { Card, CardHeader, CardContent, Typography, Box, IconButton, Tooltip as MTooltip } from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import { useEffect, useRef, useState, useMemo } from 'react'


export default function BarViz({
  array, highlights, placedSet,
  running, onRun, onPause, onStep, onReset
}) {
  const n = array.length
  const max = Math.max(...array, 1)

  const wrapRef = useRef(null)
  const [wrapW, setWrapW] = useState(0)

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      setWrapW(wrapRef.current?.clientWidth ?? 0)
      return
    }
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWrapW(e.contentRect.width)
    })
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const gap = useMemo(() => (n >= 90 ? 2 : n >= 70 ? 3 : n >= 50 ? 4 : n >= 30 ? 6 : 8), [n])
  const maxBarW = 42
  const minBarW = 4

  const barWidth = useMemo(() => {
    const safeW = Math.max(0, wrapW)
    const totalGap = Math.max(0, (n - 1) * gap)
    const raw = Math.floor((safeW - totalGap) / Math.max(1, n))
    return Math.max(minBarW, Math.min(maxBarW, raw || minBarW))
  }, [wrapW, n, gap])

  const MAX_LABELS = 28
  const labelStride = useMemo(() => Math.max(1, Math.ceil(n / MAX_LABELS)), [n])
  const SHOW_TEXT_MIN_PX = 26

  const chartHeight = useMemo(() => {
    if (typeof window === 'undefined') return 500
    const w = window.innerWidth
    if (w < 768) return Math.max(300, Math.min(520, Math.floor(window.innerHeight * 0.6)))
    return 500
  }, [])

  const getBarColor = (idx) => {
    const isCompare = highlights.compare.has(idx)
    const isSwap = highlights.swap.has(idx)
    const isOverwrite = highlights.overwrite.has(idx)
    const isPlaced = placedSet.has(idx)
    if (isSwap) return 'bg-red-500'
    if (isCompare) return 'bg-amber-400'
    if (isOverwrite) return 'bg-sky-400'
    if (isPlaced) return 'bg-emerald-500'
    return 'bg-cyan-400'
  }

  const getBarStyle = (idx, val) => {
    const hPct = 5 + (val / max) * 90
    const emphasized = (highlights.compare.has(idx) || highlights.swap.has(idx))
    return {
      width: `${barWidth}px`,
      height: `${hPct}%`,
      minHeight: '6px',
      transform: emphasized ? 'translateZ(0) scale(1.15)' : 'translateZ(0)',
      boxShadow: emphasized ? '0 0 20px rgba(255,255,255,0.5)' : 'none',
      zIndex: emphasized ? 10 : 'auto',
      transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      willChange: 'height, transform',
    }
  }

  const labelStyle = useMemo(() => ({
    width: `${barWidth}px`,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    height: 32,
    lineHeight: '32px', 
    fontSize: n >= 90 ? '10px' : n >= 70 ? '11px' : '12px'
  }), [barWidth, n])

  return (
    <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
      <CardHeader
        title={<Typography variant="h6" className="!font-semibold">Array Visualization</Typography>}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {running ? (
              <MTooltip title="Pause">
                <IconButton
                  onClick={onPause}
                  size="small"
                  sx={{ color: '#f87171', '&:hover': { color: '#ef4444', background: 'rgba(248,113,113,.08)' } }}
                >
                  <PauseRoundedIcon fontSize="small" />
                </IconButton>
              </MTooltip>
            ) : (
              <MTooltip title="Play">
                <IconButton
                  onClick={onRun}
                  size="small"
                  sx={{ color: '#10b981', '&:hover': { color: '#059669', background: 'rgba(16,185,129,.08)' } }}
                >
                  <PlayArrowRoundedIcon fontSize="small" />
                </IconButton>
              </MTooltip>
            )}
            <MTooltip title="Step">
              <IconButton
                onClick={onStep}
                size="small"
                sx={{ color: '#8b5cf6', '&:hover': { color: '#7c3aed', background: 'rgba(139,92,246,.08)' } }}
              >
                <SkipNextRoundedIcon fontSize="small" />
              </IconButton>
            </MTooltip>
            <MTooltip title="Reset">
              <IconButton
                onClick={onReset}
                size="small"
                sx={{ color: '#94a3b8', '&:hover': { color: '#e5e7eb', background: 'rgba(148,163,184,.08)' } }}
              >
                <RestartAltRoundedIcon fontSize="small" />
              </IconButton>
            </MTooltip>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ p: 3, pt: 0 }}>
        <Typography variant="body2" className="text-slate-400 mb-4">
          Watch the sorting algorithm in action. Bar height represents the value, colors show current operations.
        </Typography>

        <div
          ref={wrapRef}
          className="relative rounded-lg border border-slate-700"
          style={{
            backgroundColor: '#0f172a',
            padding: 16,
            backgroundImage:
              'linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px),' +
              'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '100% 40px, 40px 100%',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
          role="img"
          aria-label="Bar chart showing array values during sorting"
        >
          <div className="flex items-end justify-center overflow-hidden" style={{ height: chartHeight }}>
            <div className="flex items-end h-full w-full" style={{ gap: `${gap}px` }}>
              {array.map((val, idx) => (
                <div key={idx} className="relative flex flex-col items-center h-full justify-end">
                  <div
                    className={`rounded-t-md ${getBarColor(idx)} transition-[height,transform,box-shadow]`}
                    style={getBarStyle(idx, val)}
                    title={`Index ${idx}: ${val}`}
                    aria-label={`Index ${idx}, value ${val}`}
                  />
                  <div className="mt-2 text-center" style={labelStyle}>
                    {barWidth >= SHOW_TEXT_MIN_PX && (idx % labelStride === 0) ? (
                      <span className="font-semibold text-slate-200 bg-slate-800/90 px-2 rounded border border-slate-600 shadow-sm inline-block w-full">
                        {val}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 sm:mt-6 flex flex-wrap gap-4 sm:gap-6 text-sm">
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-amber-400"></div><span className="text-slate-300 font-medium">Comparing</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-red-500"></div><span className="text-slate-300 font-medium">Swapping</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-sky-400"></div><span className="text-slate-300 font-medium">Writing</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-emerald-500"></div><span className="text-slate-300 font-medium">Sorted</span></div>
        </div>
      </CardContent>
    </Card>
  )
}
