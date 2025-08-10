import { Card, CardContent, CardHeader, Grid, Typography } from '@mui/material'

export default function PathMetrics({ metrics, rows, cols, fmtMs }) {
  return (
    <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0a1220' }}>
      <CardHeader title={<Typography variant="h6" className="!font-semibold">Performance Metrics</Typography>} sx={{ pb:1 }} />
      <CardContent>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <div className="text-center p-4 bg-slate-800 rounded-lg">
              <Typography variant="h4" className="!font-bold text-amber-400">{metrics.visited}</Typography>
              <Typography variant="body2" className="text-slate-400">Visited Nodes</Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <div className="text-center p-4 bg-slate-800 rounded-lg">
              <Typography variant="h4" className="!font-bold text-red-400">{metrics.pathLen}</Typography>
              <Typography variant="body2" className="text-slate-400">Path Length</Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <div className="text-center p-4 bg-slate-800 rounded-lg">
              <Typography variant="h4" className="!font-bold text-sky-400">{fmtMs(metrics.timeMs)}</Typography>
              <Typography variant="body2" className="text-slate-400">Build Time</Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <div className="text-center p-4 bg-slate-800 rounded-lg">
              <Typography variant="h4" className="!font-bold text-emerald-400">{rows}×{cols}</Typography>
              <Typography variant="body2" className="text-slate-400">Grid Size</Typography>
            </div>
          </Grid>
        </Grid>
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <Typography variant="body2" className="text-slate-400">
            <strong>Tip:</strong> Turn on <em>Diagonals</em>, <em>Weighted Cells</em>, and <em>Random Tie-Breaks</em> to see different routes. A* with <em>Octile</em> or <em>Euclidean</em> behaves very differently from Manhattan.
          </Typography>
        </div>
      </CardContent>
    </Card>
  )
}
