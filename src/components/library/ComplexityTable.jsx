import { Card, CardHeader, CardContent, Typography, Divider, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'

export default function ComplexityTable({ rows }) {
  return (
    <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
      <CardHeader
        avatar={<BoltRoundedIcon sx={{ color: '#67e8f9' }} />}
        title={<Typography variant="h6" className="!font-semibold">Complexity Cheat Sheet</Typography>}
        subheader={<span className="text-slate-400">Quick reference for common time complexities.</span>}
      />
      <CardContent>
        <div className="rounded-lg border border-slate-700 overflow-auto">
          <Table size="small" className="min-w-[560px]">
            <TableHead>
              <TableRow>
                <TableCell className="bg-slate-900 text-slate-300">Big-O</TableCell>
                <TableCell className="bg-slate-900 text-slate-300">Intuition</TableCell>
                <TableCell className="bg-slate-900 text-slate-300">Typical examples</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-slate-200">{r.name}</TableCell>
                  <TableCell className="text-slate-200">{r.desc}</TableCell>
                  <TableCell className="text-slate-200">
                    {r.name === 'O(1)' && 'Hash map lookup, push/pop'}
                    {r.name === 'O(log n)' && 'Binary search, heap push/pop'}
                    {r.name === 'O(n)' && 'Single pass, BFS layer size'}
                    {r.name === 'O(n log n)' && 'Merge/Quick typical, heap sort'}
                    {r.name === 'O(n²)' && 'Double nested loops, naive pairing'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Divider className="my-4 border-slate-700" />
        <Typography variant="body2" className="text-slate-400">
          Tip: asymptotic notation describes <strong>growth</strong>, not constant factors. Your Complexity Explorer page
          measures real runtimes and overlays these shapes to connect theory with practice.
        </Typography>
      </CardContent>
    </Card>
  )
}
