import { Card, CardHeader, CardContent, Typography, Box, IconButton, Tooltip as MTooltip, useMediaQuery, useTheme } from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import { SORTERS, COLORS } from '../../lib/benchCore'

const orderMap = { 'O(n²)': 1, 'O(n log n)': 2, 'O(n)': 3 }
const formatCompact = (n) => {
    if (n == null) return ''
    const abs = Math.abs(n)
    if (abs < 1000) return `${n}`
    const units = ['k', 'M', 'B', 'T']
    let u = -1
    let num = n
    while (Math.abs(num) >= 1000 && u < units.length - 1) {
      num /= 1000
      u++
    }
    const dec = Math.abs(num) < 10 ? 1 : 0 
    return `${parseFloat(num.toFixed(dec))}${units[u]}`
  }
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
          <span> : {typeof entry.value === 'number' ? formatCompact(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function CompChart({
  data, algos, overlaySeries, yDomain, metricLabel, logScale,
  onRun, onReset
}) {

  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))

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

        {isXs && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mb: 1 }}>
            {algos.map(a => (
              <Box key={a} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, bgcolor: COLORS[a], borderRadius: '2px' }} />
                <Typography variant="caption" sx={{ color: '#cbd5e1' }}>{SORTERS[a].label}</Typography>
              </Box>
            ))}
            {overlaySeries.map(s => (
              <Typography key={s.name} variant="caption" sx={{ color: '#cbd5e1' }}>
                O({s.name})
              </Typography>
            ))}
          </Box>
        )}

        <Box sx={{ height: { xs: 440, sm: 380, md: 440 }, pb: isXs ? 4 : 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: isXs ? 8 : 12,
                right: 20,
                left: isXs ? 12 : 18,         
                bottom: isXs ? 0 : 28          
              }}
            >
              <CartesianGrid stroke="#1f2937" />

              {!isXs && (
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={28}
                  wrapperStyle={{ color: '#cbd5e1' }}
                />
              )}

              <XAxis
                dataKey="n"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={{ fill: '#94a3b8', fontSize: isXs ? 11 : 12 }}
                tickMargin={8}
                minTickGap={10}
                height={isXs ? 40 : 48}

                label={
                  isXs
                    ? undefined
                    : {
                      value: 'Input size (n)',
                      position: 'inside',
                      dy: 22,    
                      dx: 8,     
                      fill: '#94a3b8'
                    }
                }
                interval="preserveStartEnd"
              />

              <YAxis
                tick={{ fill: '#94a3b8', fontSize: isXs ? 11 : 12 }}
                domain={yDomain}
                scale={logScale ? 'log' : 'linear'}
                allowDataOverflow
                width={isXs ? 42 : 56}     
                tickMargin={8}
                tickFormatter={formatCompact}
              />
              <RTooltip content={<CustomTooltip />} />

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

        {isXs && (
          <Typography variant="body2" align="center" sx={{ mt: 1, mb: 2, color: '#94a3b8' }}>
            Input size (n)
          </Typography>
        )}

        <Typography variant="body2" className="text-slate-400 mt-3">
          Overlays are scaled to the first measured point to compare <em>shape</em>, not raw value.
        </Typography>
      </CardContent>
    </Card>
  )
}
