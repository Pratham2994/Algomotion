// src/components/pathfinding/PathHeader.jsx
import { Button, Chip, Typography } from '@mui/material'

export default function PathHeader({ current }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Typography variant="h4" className="!font-bold text-slate-100">Pathfinding Arena</Typography>
          <Chip label={current.label} className="bg-slate-800 text-slate-300 border border-slate-600" />
        </div>
        <Typography variant="body1" className="text-slate-400 max-w-2xl">
          {current.desc}
        </Typography>
      </div>
      <Button href="/" variant="outlined" sx={{ borderColor:'#67e8f9', color:'#67e8f9', '&:hover':{ borderColor:'#22d3ee', color:'#22d3ee' } }}>
        ← Back to Home
      </Button>
    </div>
  )
}
