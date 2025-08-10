import { useMemo, useState, useEffect } from 'react'
import { Box, Button, Card, CardContent, Typography, Tooltip } from '@mui/material'
import { Link } from 'react-router-dom'

import { COMPLEXITY, COMPLEXITY_ROWS } from '../lib/libraryData'
import LibraryHeader from '../components/library/LibraryHeader'
import LibraryTopControls from '../components/library/LibraryTopControls'
import MiniArrayDemo from '../components/library/MiniArrayDemo'
import MiniGridDemo from '../components/library/MiniGridDemo'
import AlgoCard from '../components/library/AlgoCard'
import ComplexityTable from '../components/library/ComplexityTable'

export default function Library() {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const [search, setSearch] = useState('')
  const [tab, setTab] = useState(0) 

  const algorithms = useMemo(() => ([
    ...COMPLEXITY.sorting.map(a => ({ ...a, _cat: 'sorting' })),
    ...COMPLEXITY.path.map(a => ({ ...a, _cat: 'path' })),
  ]), [])

  const filtered = algorithms.filter(a => {
    if (tab === 1 && a._cat !== 'sorting') return false
    if (tab === 2 && a._cat !== 'path') return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      a.name.toLowerCase().includes(q) ||
      a.blurb.toLowerCase().includes(q) ||
      a.uses.some(u => u.toLowerCase().includes(q))
    )
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <LibraryHeader />
      <LibraryTopControls tab={tab} setTab={setTab} search={search} setSearch={setSearch} />

      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MiniArrayDemo />
        <MiniGridDemo />
      </Box>

      <Box className="space-y-6">
        {filtered.map(a => (
          <AlgoCard key={`${a._cat}-${a.key}`} algo={a} category={a._cat} />
        ))}
        {filtered.length === 0 && (
          <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
            <CardContent>
              <Typography className="text-slate-400">No matches. Try a different search.</Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <ComplexityTable rows={COMPLEXITY_ROWS} />

      <Box className="flex flex-wrap gap-3">
        <Tooltip title="Open Sorting Arena">
          <Button
            component={Link}
            to="/sorting"
            variant="outlined"
            sx={{ borderColor: '#67e8f9', color: '#67e8f9', textTransform: 'none' }}
          >
            Go to Sorting
          </Button>
        </Tooltip>
        <Tooltip title="Open Pathfinding Arena">
          <Button
            component={Link}
            to="/pathfinding"
            variant="outlined"
            sx={{ borderColor: '#67e8f9', color: '#67e8f9', textTransform: 'none' }}
          >
            Go to Pathfinding
          </Button>
        </Tooltip>
      </Box>
    </div>
  )
}
