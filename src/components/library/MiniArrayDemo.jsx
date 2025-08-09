import { useMemo, useState } from 'react'
import { Card, CardHeader, CardContent, Typography, Button, Chip } from '@mui/material'

export default function MiniArrayDemo(){
  // Small fixed array keeps the widget compact
  const base = [7, 3, 5, 2, 9]

  // Build a compact step trace for Bubble Sort (outer pass + each compare)
  const frames = useMemo(() => {
    const a = base.slice()
    const out = []
    let comps = 0, swaps = 0
    const n = a.length

    for (let pass = 0; pass < n - 1; pass++) {
      for (let j = 0; j < n - 1 - pass; j++) {
        const swapping = a[j] > a[j + 1]
        comps++
        if (swapping) {
          ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
          swaps++
        }
        // capture a snapshot
        out.push({
          arr: a.slice(),
          j,
          j2: j + 1,
          swapping,
          comps,
          swaps,
          // everything at index >= n - 1 - pass is guaranteed sorted now
          sortedFrom: n - 1 - pass
        })
      }
    }
    // Add a final "done" frame
    out.push({
      arr: a.slice(),
      j: -1, j2: -1, swapping: false,
      comps, swaps, sortedFrom: 0
    })
    return out
  }, [])

  const [i, setI] = useState(0)
  const f = frames[i]
  const max = Math.max(...base)

  const barColor = (idx) => {
    if (idx >= f.sortedFrom) return 'bg-emerald-500'       // invariant: suffix sorted
    if (idx === f.j || idx === f.j2) return f.swapping ? 'bg-red-500' : 'bg-amber-400'
    return 'bg-cyan-400'
  }

  return (
    <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0b1322' }}>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Typography variant="subtitle1" className="!font-semibold">Mini Demo — Bubble Sort</Typography>
            <Chip label="stable • in-place" size="small" className="!bg-slate-800 !text-slate-300 !border !border-slate-600" />
          </div>
        }
      />
      <CardContent>
        {/* Bars */}
        <div className="flex items-end justify-center gap-2 h-28">
          {f.arr.map((v, idx) => (
            <div
              key={idx}
              className={`rounded-t w-7 ${barColor(idx)}`}
              style={{ height: `${(v / max) * 100}%`, minHeight: 6 }}
              title={`a[${idx}] = ${v}`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-6">
            <Button size="small" onClick={()=>setI((x)=>Math.max(0, x-1))}>Prev</Button>
            <Button size="small" onClick={()=>setI((x)=>Math.min(frames.length-1, x+1))}>Next</Button>
          </div>
          <div className="hidden md:flex gap-3">
            <Chip size="small" className="!bg-slate-800 !text-amber-300" label={`comparisons ${f.comps}`} />
            <Chip size="small" className="!bg-slate-800 !text-red-300" label={`swaps ${f.swaps}`} />
            <Chip size="small" className="!bg-slate-800 !text-emerald-300" label={`sorted suffix [${f.sortedFrom}..]`} />
          </div>
        </div>

        {/* Legend + teaching hint */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <Legend color="bg-amber-400" label="comparing pair" />
          <Legend color="bg-red-500" label="swap happened" />
          <Legend color="bg-emerald-500" label="invariant: suffix sorted" />
        </div>
        <Typography variant="caption" className="text-slate-400 block mt-2">
          Bubble Sort compares adjacent items; after each pass, the largest element “bubbles” to the end. That suffix stays sorted.
        </Typography>
      </CardContent>
    </Card>
  )
}

function Legend({ color, label }){
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block w-3.5 h-3.5 rounded ${color}`} />
      <span className="text-slate-300">{label}</span>
    </span>
  )
}
