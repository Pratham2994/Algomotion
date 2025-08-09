// src/components/complexity/CompChart.jsx
import { Card, CardHeader, CardContent, Typography, Box } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts'
import { SORTERS, COLORS } from '../../lib/benchCore'

export default function CompChart({ data, algos, overlaySeries, yDomain, metricLabel, logScale }){
  return (
    <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0a1220' }}>
      <CardHeader title={<Typography variant="h6" className="!font-semibold">{metricLabel}</Typography>} sx={{ pb:1 }} />
      <CardContent>
        <Box sx={{ height: 440 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="#1f2937" />
              <XAxis dataKey="n" tick={{ fill:'#94a3b8' }} type="number" domain={['dataMin', 'dataMax']} />
              <YAxis tick={{ fill:'#94a3b8' }} domain={yDomain} scale={logScale ? 'log' : 'linear'} allowDataOverflow />
              <Tooltip contentStyle={{ background:'#0b1220', border:'1px solid #334155', color:'#e2e8f0' }}
                       formatter={(val, name) => [val?.toFixed ? val.toFixed(2) : val, name]} />
              <Legend wrapperStyle={{ color:'#cbd5e1' }} />
              {algos.map(a => (
                <Line key={a} type="monotone" dataKey={a} name={SORTERS[a].label} stroke={COLORS[a]} dot={false} strokeWidth={2} />
              ))}
              {overlaySeries.map(s=>(
                <Line key={s.name} name={`O(${s.name})`} data={s.points} dataKey="y"
                      stroke={s.color} strokeDasharray="4 6" dot={false} strokeWidth={1.5} />
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
