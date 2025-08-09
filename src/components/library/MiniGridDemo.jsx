import { useState } from 'react'
import { Card, CardHeader, CardContent, Typography, Button } from '@mui/material'

export default function MiniGridDemo(){
  const [i, setI] = useState(0)
  const FRAMES = [
    new Set(['3,3']),
    new Set(['3,3','3,2','2,3','4,3','3,4']),
    new Set(['3,3','3,2','2,3','4,3','3,4','2,2','2,4','4,2','4,4']),
    new Set(['3,3','3,2','2,3','4,3','3,4','2,2','2,4','4,2','4,4','1,3','5,3']),
  ]
  const size = 7
  const isOn = (r,c) => FRAMES[i].has(`${r},${c}`)
  return (
    <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0b1322' }}>
      <CardHeader title={<Typography variant="subtitle1" className="!font-semibold">Mini Demo — BFS wave</Typography>} />
      <CardContent>
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${size}, 16px)`}}>
          {Array.from({length:size}).map((_,r)=>
            Array.from({length:size}).map((_,c)=>(<div key={`${r}-${c}`} className={`h-4 w-4 rounded ${isOn(r,c)?'bg-sky-400':'bg-slate-700/60'}`} />))
          )}
        </div>
        <div className="mt-3 flex gap-6">
          <Button size="small" onClick={()=>setI(Math.max(0, i-1))}>Prev</Button>
          <Button size="small" onClick={()=>setI(Math.min(FRAMES.length-1, i+1))}>Next</Button>
        </div>
        <Typography variant="caption" className="text-slate-400 block mt-2">
          Classic breadth-first “ring” expansion from a source cell.
        </Typography>
      </CardContent>
    </Card>
  )
}
