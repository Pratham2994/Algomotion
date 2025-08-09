// src/components/sorting/BarViz.jsx
import { Card, CardContent, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'

export default function BarViz({ array, highlights, placedSet }) {
  const n = array.length
  const max = Math.max(...array, 1)
  const MAX_LABELS = 28
  const labelStride = Math.max(1, Math.ceil(n / MAX_LABELS))
  const SHOW_TEXT_MIN_PX = 26

  const wrapRef = useRef(null)
  const [wrapW, setWrapW] = useState(0)
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWrapW(e.contentRect.width)
    })
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const gap = n > 80 ? 2 : n > 50 ? 4 : n > 30 ? 6 : 8
  const maxBarW = 40
  const minBarW = 4
  const barWidth = Math.max(
    minBarW,
    Math.min(maxBarW, Math.floor((wrapW - Math.max(0, (n - 1) * gap)) / Math.max(1, n)))
  )

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
    const base = {
      width: `${barWidth}px`,
      height: `${hPct}%`,
      minHeight: '6px',
      transition: 'all 0.25s ease-in-out',
    }
    if (highlights.compare.has(idx) || highlights.swap.has(idx)) {
      base.transform = 'scale(1.1)'
      base.boxShadow = '0 0 15px rgba(255,255,255,0.5)'
      base.zIndex = 10
    }
    return base
  }

  const labelStyle = {
    width: `${barWidth}px`,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    height: 28,
    fontSize: n > 80 ? '10px' : n > 60 ? '11px' : '12px'
  }

  return (
    <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
      <CardContent sx={{ p: 3 }}>
        <div className="mb-4">
          <Typography variant="h6" className="!font-semibold mb-2">Array Visualization</Typography>
          <Typography variant="body2" className="text-slate-400">
            Watch the sorting algorithm in action. Bar height represents the value, colors show current operations.
          </Typography>
        </div>

        <div ref={wrapRef} className="relative bg-slate-900 rounded-lg border border-slate-700 p-6">
          <div className="h-[500px] flex items-end justify-center overflow-hidden">
            <div className="flex items-end h-full w-full" style={{ gap: `${gap}px` }}>
              {array.map((val, idx) => (
                <div key={idx} className="relative flex flex-col items-center h-full justify-end">
                  <div
                    className={`rounded-t-lg ${getBarColor(idx)} transition-all duration-300`}
                    style={getBarStyle(idx, val)}
                    title={`Index ${idx}: ${val}`}
                  />
                  <div className="mt-3 text-center" style={labelStyle}>
                    {idx % labelStride === 0 && barWidth >= SHOW_TEXT_MIN_PX ? (
                      <span className="font-bold text-slate-200 bg-slate-800 px-2 py-1 rounded-lg border border-slate-600 shadow-lg inline-block w-full">
                        {val}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-amber-400"></div><span className="text-slate-300 font-medium">Comparing</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-red-500"></div><span className="text-slate-300 font-medium">Swapping</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-sky-400"></div><span className="text-slate-300 font-medium">Writing</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-emerald-500"></div><span className="text-slate-300 font-medium">Sorted</span></div>
        </div>
      </CardContent>
    </Card>
  )
}
