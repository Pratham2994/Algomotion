// src/components/sorting/SortMetrics.jsx
import { Card, CardContent, CardHeader, Grid, Typography } from '@mui/material'

export default function SortMetrics({ metrics, arrayLength, fmtMs }) {
  return (
    <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
      <CardHeader
        title={<Typography variant="h6" className="!font-semibold">Performance Metrics</Typography>}
        sx={{ pb: 1 }}
      />
      <CardContent>
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <div className="text-center p-4 bg-slate-800 rounded-lg">
              <Typography variant="h4" className="!font-bold text-amber-400">
                {metrics.comparisons}
              </Typography>
              <Typography variant="body2" className="text-slate-400">Comparisons</Typography>
            </div>
          </Grid>
          <Grid item xs={12} md={3}>
            <div className="text-center p-4 bg-slate-800 rounded-lg">
              <Typography variant="h4" className="!font-bold text-red-400">
                {metrics.writes}
              </Typography>
              <Typography variant="body2" className="text-slate-400">Swaps/Writes</Typography>
            </div>
          </Grid>
          <Grid item xs={12} md={3}>
            <div className="text-center p-4 bg-slate-800 rounded-lg">
              <Typography variant="h4" className="!font-bold text-sky-400">
                {fmtMs(metrics.timeMs)}
              </Typography>
              <Typography variant="body2" className="text-slate-400">Build Time</Typography>
            </div>
          </Grid>
          <Grid item xs={12} md={3}>
            <div className="text-center p-4 bg-slate-800 rounded-lg">
              <Typography variant="h4" className="!font-bold text-emerald-400">
                {arrayLength}
              </Typography>
              <Typography variant="body2" className="text-slate-400">Array Size</Typography>
            </div>
          </Grid>
        </Grid>

        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <Typography variant="body2" className="text-slate-400">
            <strong>How to read:</strong> Each bar represents an array element. The height shows the value,
            colors indicate current operations (comparing, swapping, writing, or sorted).
            Watch how the algorithm progresses step by step!
          </Typography>
        </div>
      </CardContent>
    </Card>
  )
}
