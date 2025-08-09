// src/components/pathfinding/GridViz.jsx
import { Card, CardContent, Typography } from '@mui/material'
import { WALL } from '../../lib/pathCore'

function Legend({swatch,label}){
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded ${swatch}`} />
      <span className="text-slate-300">{label}</span>
    </div>
  )
}

export default function GridViz({ grid, start, goal, highlights, weights }) {
  const rows=grid.length, cols=grid[0].length
  const cellSize = Math.floor(Math.max(12, 560 / Math.max(rows, cols)))

  const colorFor = (r,c)=>{
    const k=r+','+c
    if(start.r===r&&start.c===c) return 'bg-emerald-500'
    if(goal.r===r&&goal.c===c)   return 'bg-cyan-400'
    if(highlights.path.has(k))   return 'bg-yellow-400'
    if(highlights.visit.has(k))  return 'bg-indigo-400'
    if(highlights.frontier.has(k)) return 'bg-sky-400'
    if(grid[r][c]===WALL) return 'bg-slate-900'
    if(weights){
      const w=weights[r][c]
      if(w===1) return 'bg-slate-500/30'
      if(w===2) return 'bg-slate-500/50'
      if(w===3) return 'bg-slate-500/70'
    }
    return 'bg-slate-500/35'
  }

  return (
    <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0a1220' }}>
      <CardContent sx={{ p:3 }}>
        <Typography variant="h6" className="!font-semibold mb-2">Grid</Typography>
        <div className="rounded-lg border border-slate-700 p-4 bg-slate-900" style={{ overflow:'hidden' }}>
          <div
            className="grid"
            style={{
              gridTemplateColumns:`repeat(${cols}, ${cellSize}px)`,
              gridTemplateRows:`repeat(${rows}, ${cellSize}px)`,
              gap:'2px', justifyContent:'center'
            }}
          >
            {grid.map((row,r)=> row.map((_,c)=>(
              <div key={`${r}-${c}`} className={`rounded ${colorFor(r,c)} transition-colors duration-150`} title={`(${r}, ${c})`} style={{ width:cellSize, height:cellSize }} />
            )))}
          </div>
        </div>

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
