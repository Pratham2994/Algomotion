import { useState } from 'react'
import { Card, CardHeader, CardContent, Typography, Button } from '@mui/material'

export default function MiniArrayDemo(){
  const [i, setI] = useState(0)
  const frames = [
    [7, 3, 5, 2, 9],
    [3, 7, 5, 2, 9],
    [3, 5, 7, 2, 9],
    [3, 5, 2, 7, 9],
    [2, 3, 5, 7, 9],
  ]
  const arr = frames[i]
  return (
    <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0b1322' }}>
      <CardHeader title={<Typography variant="subtitle1" className="!font-semibold">Mini Demo — Sorting passes</Typography>} />
      <CardContent>
        <div className="flex items-end gap-2 h-28">
          {arr.map((v, idx) => (
            <div key={idx} className="bg-cyan-400 rounded-t w-8" style={{ height: `${v * 6}px` }} />
          ))}
        </div>
        <div className="mt-3 flex gap-6">
          <Button size="small" onClick={()=>setI(Math.max(0, i-1))}>Prev</Button>
          <Button size="small" onClick={()=>setI(Math.min(frames.length-1, i+1))}>Next</Button>
        </div>
        <Typography variant="caption" className="text-slate-400 block mt-2">
          Step through a few passes to see values drift toward the correct order.
        </Typography>
      </CardContent>
    </Card>
  )
}
