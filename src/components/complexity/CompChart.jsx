// src/components/complexity/CompChart.jsx
import { Card, CardHeader, CardContent, Typography, Box, IconButton, Tooltip as MTooltip } from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, Legend,
  CartesianGrid, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { SORTERS, COLORS } from '../../lib/benchCore'

const orderMap = { 'O(n²)': 1, 'O(n log n)': 2, 'O(n)': 3 }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const withIndex = payload.map((p, idx) => ({ ...p, _idx: idx }))
  const sorted = withIndex.sort((a, b) => {
    const ar = orderMap[a.name] ?? 99
    const br = orderMap[b.name] ?? 99
    if (ar !== br) return ar - br
    return a._idx - b._idx
  })
  return (
    <div
      style={{
        background: '#0b1220', border: '1px solid #334155', color: '#e2e8f0',
        padding: '10px 12px', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,.35)', minWidth: 160
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {sorted.map((entry, i) => (
        <div key={i} style={{ margin: '2px 0' }}>
          <span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}</span>
          <span> : {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function CompChart({
  data, algos, overlaySeries, yDomain, metricLabel, logScale,
  onRun, onReset
}) {
  return (
    <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
      <CardHeader
        title={<Typography variant="h6" className="!font-semibold">{metricLabel}</Typography>}
        sx={{ pb: 1 }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MTooltip title="Run sweep">
              <IconButton onClick={onRun} size="small"
                sx={{ color: '#10b981', '&:hover': { color: '#059669', background: 'rgba(16,185,129,.08)' } }}>
                <PlayArrowRoundedIcon fontSize="small" />
              </IconButton>
            </MTooltip>
            <MTooltip title="Reset chart">
              <IconButton onClick={onReset} size="small"
                sx={{ color: '#94a3b8', '&:hover': { color: '#e5e7eb', background: 'rgba(148,163,184,.08)' } }}>
                <RestartAltRoundedIcon fontSize="small" />
              </IconButton>
            </MTooltip>
          </Box>
        }
      />
      <CardContent>
        <Box sx={{ height: { xs: 320, sm: 380, md: 440 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 24 }}>
              <CartesianGrid stroke="#1f2937" />
              <XAxis
                dataKey="n"
                tick={{ fill: '#94a3b8' }}
                type="number"
                domain={['dataMin', 'dataMax']}
                label={{ value: 'Input size (n)', position: 'insideLeft', dy: 27, dx: 10, fill: '#94a3b8' }}
              />
              <YAxis
                tick={{ fill: '#94a3b8' }}
                domain={yDomain}
                scale={logScale ? 'log' : 'linear'}
                allowDataOverflow
              />
              <RTooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              {algos.map(a => (
                <Line
                  key={a}
                  type="monotone"
                  dataKey={a}
                  name={SORTERS[a].label}
                  stroke={COLORS[a]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
              {overlaySeries.map(s => (
                <Line
                  key={s.name}
                  name={`O(${s.name})`}
                  data={s.points}
                  dataKey="y"
                  stroke={s.color}
                  strokeDasharray="4 6"
                  dot={false}
                  strokeWidth={1.5}
                />
              ))}
              <ReferenceLine y={0} stroke="#1f2937" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
        <Typography variant="body2" className="text-slate-400 mt-3">
          Overlays are scaled to the first measured point to compare <em>shape</em>, not raw value.
        </Typography>
      </CardContent>
    </Card>
  )
}
