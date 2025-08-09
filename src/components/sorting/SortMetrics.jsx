// src/components/sorting/SortMetrics.jsx
import {
    Card, CardContent, CardHeader, Grid, Typography
  } from '@mui/material'
  
  function MetricTile({ value, label, colorClass }) {
    const display = (value === null || value === undefined || value === 0) ? 'N/A' : value
    const isNA = display === 'N/A'
    return (
      <div className="text-center p-4 bg-slate-800 rounded-lg">
        <Typography variant="h4" className={`!font-bold ${isNA ? 'text-slate-400' : colorClass}`}>
          {display}
        </Typography>
        <Typography variant="body2" className="text-slate-400">{label}</Typography>
      </div>
    )
  }
  
  export default function SortMetrics({
    metrics,
    arrayLength,
    fmtMs,
    algoKey,     // kept in signature in case parent passes it
    algoLabel,   // kept in signature in case parent passes it
  }) {
    const m = metrics || {}
  
    const comparisons = (m.comparisons !== undefined) ? m.comparisons : null
    const writes      = (m.writes      !== undefined) ? m.writes      : null
    const timeMs      = (m.timeMs      !== undefined) ? m.timeMs      : 0
  
    return (
      <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
        <CardHeader
          title={<Typography variant="h6" className="!font-semibold">Performance Metrics</Typography>}
          sx={{ pb: 1 }}
        />
        <CardContent>
          {/* Core tiles */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <MetricTile value={comparisons} label="Comparisons" colorClass="text-amber-400" />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricTile value={writes} label="Swaps/Writes" colorClass="text-red-400" />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricTile
                value={fmtMs ? fmtMs(timeMs) : `${timeMs?.toFixed?.(2) ?? timeMs} ms`}
                label="Build Time"
                colorClass="text-sky-400"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricTile value={arrayLength} label="Array Size" colorClass="text-emerald-400" />
            </Grid>
          </Grid>
  
          {/* Help text */}
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
            <Typography variant="body2" className="text-slate-400">
              <strong>How to read:</strong> Each bar represents an array element. The height shows the value, and colors
              highlight the current operation (compare, swap/overwrite, placed). Some metrics don’t apply to
              non-comparison sorts (e.g., Counting/Radix), so they’ll show as <em>N/A</em>.
            </Typography>
          </div>
        </CardContent>
      </Card>
    )
  }
  