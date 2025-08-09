import { useMemo, useState } from 'react'
import { Card, CardHeader, CardContent, Typography, Button, Chip } from '@mui/material'

export default function MiniGridDemo(){
  const R = 7, C = 7
  const start = { r: 3, c: 3 }

  // Build 4 compact BFS snapshots (levels 0..3)
  const frames = useMemo(() => {
    const dist = Array.from({ length: R }, () => Array(C).fill(Infinity))
    const q = [{ ...start }]
    dist[start.r][start.c] = 0

    const layers = []
    let head = 0
    const inb = (r,c)=> r>=0 && c>=0 && r<R && c<C
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]]

    while (head < q.length && layers.length < 4) {
      // capture current frontier indices
      const curLayer = []
      const dNow = dist[q[head].r][q[head].c]
      // collect all nodes at this distance
      for (let k = head; k < q.length; k++) {
        const { r, c } = q[k]
        if (dist[r][c] === dNow) curLayer.push({ r, c })
      }
      layers.push(curLayer.map(p => `${p.r},${p.c}`))

      // expand exactly one distance level
      const end = q.length
      for (let k = head; k < end; k++) {
        const { r, c } = q[k]
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc
          if (!inb(nr, nc) || dist[nr][nc] !== Infinity) continue
          dist[nr][nc] = dist[r][c] + 1
          q.push({ r: nr, c: nc })
        }
      }
      head = end
    }

    // Build snapshots including distance map & visited set
    const snaps = layers.map((frontier, step) => {
      const fset = new Set(frontier)
      const vset = new Set()
      for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
          if (dist[r][c] !== Infinity && dist[r][c] <= step) vset.add(`${r},${c}`)
        }
      }
      return { step, dist, frontier: fset, visited: vset }
    })
    return snaps
  }, [])

  const [i, setI] = useState(0)
  const f = frames[i]
  const isStart = (r,c) => r===3 && c===3
  const key = (r,c)=>`${r},${c}`

  const cellClass = (r,c) => {
    if (isStart(r,c)) return 'bg-emerald-500 text-black font-bold'
    if (f.frontier.has(key(r,c))) return 'bg-sky-400 text-black'
    if (f.visited.has(key(r,c))) return 'bg-indigo-400 text-black'
    return 'bg-slate-700/60 text-slate-300'
  }

  return (
    <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0b1322' }}>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Typography variant="subtitle1" className="!font-semibold">Mini Demo — BFS Distance Rings</Typography>
            <Chip label="shortest on unweighted" size="small" className="!bg-slate-800 !text-slate-300 !border !border-slate-600" />
          </div>
        }
      />
      <CardContent>
        {/* Grid */}
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${C}, 16px)`}}>
          {Array.from({length:R}).map((_,r)=>
            Array.from({length:C}).map((_,c)=>(
              <div
                key={`${r}-${c}`}
                className={`h-4 w-4 rounded grid place-items-center ${cellClass(r,c)}`}
                title={isFinite(f.dist[r][c]) ? `d=${f.dist[r][c]}` : 'unreached'}
              >
                <span style={{ fontSize: 9, lineHeight: 1 }}>
                  {isFinite(f.dist[r][c]) && f.dist[r][c] <= i ? f.dist[r][c] : ''}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Controls + counters */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-6">
            <Button size="small" onClick={()=>setI((x)=>Math.max(0, x-1))}>Prev</Button>
            <Button size="small" onClick={()=>setI((x)=>Math.min(frames.length-1, x+1))}>Next</Button>
          </div>
          <div className="hidden md:flex gap-3">
            <Chip size="small" className="!bg-slate-800 !text-sky-300" label={`frontier ${f.frontier.size}`} />
            <Chip size="small" className="!bg-slate-800 !text-indigo-300" label={`visited ${f.visited.size}`} />
            <Chip size="small" className="!bg-slate-800 !text-slate-300" label={`step d = ${i}`} />
          </div>
        </div>

        {/* Legend + hint */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <Legend color="bg-emerald-500" label="start" />
          <Legend color="bg-sky-400" label="frontier (distance d)" />
          <Legend color="bg-indigo-400" label="visited (≤ d)" />
        </div>
        <Typography variant="caption" className="text-slate-400 block mt-2">
          BFS explores by distance: it visits all nodes at <em>d</em> before moving to <em>d+1</em>. That’s why it finds shortest paths on unweighted grids.
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
