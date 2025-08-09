// src/components/complexity/CompHeader.jsx
import { Chip, Typography } from '@mui/material'

export default function CompHeader(){
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Typography variant="h4" className="!font-bold text-slate-100">Complexity Explorer</Typography>
          <Chip label="Sorting" className="bg-slate-800 text-slate-300 border border-slate-600" />
        </div>
        <Typography variant="body1" className="text-slate-400 max-w-2xl">
          Benchmark sorting algorithms across input sizes. See measured growth vs Big-O curves.
        </Typography>
      </div>
    </div>
  )
}
