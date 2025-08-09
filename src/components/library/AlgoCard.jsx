import { Card, CardHeader, CardContent, Typography, Chip, Box, Table, TableHead, TableRow, TableCell, TableBody, Stack, Button } from '@mui/material'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { Link } from 'react-router-dom'

export default function AlgoCard({ algo, category }){
  return (
    <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0a1220' }}>
      <CardHeader
        title={
          <div className="flex items-center gap-3">
            <Typography variant="h6" className="!font-semibold">{algo.name}</Typography>
            <Chip label={category === 'sorting' ? 'Sorting' : 'Pathfinding'} size="small"
              className="bg-slate-800 text-slate-300 border border-slate-600" />
          </div>
        }
        subheader={<span className="text-slate-400">{algo.blurb}</span>}
      />
      <CardContent>
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Box>
            <div className="text-slate-300 font-medium mb-2">Pseudocode</div>
            <pre className="text-slate-300 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm overflow-auto">
{algo.pseudo.join('\n')}
            </pre>
          </Box>

          <Box>
            <div className="text-slate-300 font-medium mb-2">Complexity</div>
            <Table size="small" className="border border-slate-700 rounded-lg overflow-hidden">
              <TableHead>
                <TableRow>
                  <TableCell className="text-slate-300 bg-slate-900">Best</TableCell>
                  <TableCell className="text-slate-300 bg-slate-900">Average</TableCell>
                  <TableCell className="text-slate-300 bg-slate-900">Worst</TableCell>
                  <TableCell className="text-slate-300 bg-slate-900">Space</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell className="text-slate-200">{algo.best}</TableCell>
                  <TableCell className="text-slate-200">{algo.avg}</TableCell>
                  <TableCell className="text-slate-200">{algo.worst}</TableCell>
                  <TableCell className="text-slate-200">{algo.space}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="text-slate-300 font-medium mt-4 mb-1">Real-World Uses</div>
            <ul className="list-disc list-inside text-slate-300">
              {algo.uses.map((u,i)=><li key={i}>{u}</li>)}
            </ul>

            <Stack direction="row" spacing={1.5} className="mt-4">
              <Button
                component={Link}
                to={algo.openLink}
                size="small"
                endIcon={<OpenInNewRoundedIcon />}
                sx={{ borderColor:'#67e8f9', color:'#67e8f9', textTransform:'none' }}
                variant="outlined"
              >
                Open in Visualizer
              </Button>
            </Stack>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
