// src/pages/Library.jsx
import { useMemo, useState } from 'react'
import {
  Box, Card, CardContent, CardHeader, Typography, Chip, TextField,
  Tabs, Tab, Divider, Button, Table, TableBody, TableCell, TableHead, TableRow,
  Stack, Tooltip
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import RouteRoundedIcon from '@mui/icons-material/RouteRounded'
import DataArrayRoundedIcon from '@mui/icons-material/DataArrayRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { Link } from 'react-router-dom'

/* -------------------------- tiny helpers & data -------------------------- */

const COMPLEXITY = {
    sorting: [
      {
        name: 'Bubble Sort', key: 'bubble', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
        blurb: 'Swap adjacent out-of-order pairs repeatedly until sorted.',
        pseudo: [
          'bubbleSort(a):',
          '  n = length(a)',
          '  repeat:',
          '    swapped = false',
          '    for i = 0 .. n-2:',
          '      if a[i] > a[i+1]:',
          '        swap(a[i], a[i+1])',
          '        swapped = true',
          '    n = n - 1           // last item is in place',
          '  until swapped == false'
        ],
        uses: ['Teaching stability/adjacent swaps', 'Tiny nearly-sorted inputs'],
        openLink: '/sorting?algo=bubble'
      },
      {
        name: 'Insertion Sort', key: 'insertion', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
        blurb: 'Builds a sorted prefix by inserting each next element into place.',
        pseudo: [
          'insertionSort(a):',
          '  for i = 1 .. n-1:',
          '    key = a[i]',
          '    j = i - 1',
          '    while j >= 0 and a[j] > key:',
          '      a[j+1] = a[j]      // shift right',
          '      j = j - 1',
          '    a[j+1] = key         // stable insert'
        ],
        uses: ['Small arrays', 'Nearly sorted data', 'As last mile in TimSort'],
        openLink: '/sorting?algo=insertion'
      },
      {
        name: 'Selection Sort', key: 'selection', best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
        blurb: 'Select the min from the unsorted suffix and place it at the front.',
        pseudo: [
          'selectionSort(a):',
          '  for i = 0 .. n-2:',
          '    minIdx = i',
          '    for j = i+1 .. n-1:',
          '      if a[j] < a[minIdx]:',
          '        minIdx = j',
          '    if minIdx != i:',
          '      swap(a[i], a[minIdx])'
        ],
        uses: ['When swaps are expensive but comparisons are cheap'],
        openLink: '/sorting?algo=selection'
      },
      {
        name: 'Merge Sort', key: 'merge', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)',
        blurb: 'Divide and conquer; merge two sorted halves.',
        pseudo: [
          'mergeSort(a, lo, hi):',
          '  if lo >= hi: return',
          '  mid = (lo + hi) // 2',
          '  mergeSort(a, lo, mid)',
          '  mergeSort(a, mid+1, hi)',
          '  merge(a, lo, mid, hi)',
          '',
          'merge(a, lo, mid, hi):',
          '  L = a[lo..mid], R = a[mid+1..hi]',
          '  i = 0; j = 0; k = lo',
          '  while i < len(L) and j < len(R):',
          '    if L[i] <= R[j]: a[k] = L[i]; i++',
          '    else:             a[k] = R[j]; j++',
          '    k++',
          '  copy remaining of L then R into a'
        ],
        uses: ['Linked lists', 'External sorting', 'Stable sort needs'],
        openLink: '/sorting?algo=merge'
      },
      {
        name: 'Quick Sort', key: 'quick', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)',
        blurb: 'Partition around a pivot; sort partitions recursively.',
        pseudo: [
          'quickSort(a, lo, hi):',
          '  if lo >= hi: return',
          '  p = partition(a, lo, hi)   // Lomuto',
          '  quickSort(a, lo, p-1)',
          '  quickSort(a, p+1, hi)',
          '',
          'partition(a, lo, hi):',
          '  pivot = a[hi]',
          '  i = lo',
          '  for j = lo .. hi-1:',
          '    if a[j] <= pivot:',
          '      swap(a[i], a[j])',
          '      i++',
          '  swap(a[i], a[hi])',
          '  return i'
        ],
        uses: ['In-place fast sort; great cache behavior', 'Databases / std::sort core'],
        openLink: '/sorting?algo=quick'
      },
      {
        name: 'Heap Sort', key: 'heap', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)',
        blurb: 'Build a max-heap; repeatedly pop the max to the end.',
        pseudo: [
          'heapSort(a):',
          '  buildMaxHeap(a)',
          '  for end = n-1 down to 1:',
          '    swap(a[0], a[end])',
          '    siftDown(a, 0, end)   // heap size shrinks',
          '',
          'buildMaxHeap(a):',
          '  for i = floor(n/2)-1 down to 0:',
          '    siftDown(a, i, n)',
          '',
          'siftDown(a, i, size):',
          '  while true:',
          '    l = 2*i + 1; r = 2*i + 2',
          '    if l >= size: break',
          '    largest = (r < size and a[r] > a[l]) ? r : l',
          '    if a[i] >= a[largest]: break',
          '    swap(a[i], a[largest])',
          '    i = largest'
        ],
        uses: ['Worst-case O(n log n) with O(1) extra space'],
        openLink: '/sorting?algo=heap'
      }
    ],
    path: [
      {
        name: 'BFS', key: 'bfs', best: 'O(V+E)', avg: 'O(V+E)', worst: 'O(V+E)', space: 'O(V)',
        blurb: 'Layer-by-layer expansion; shortest path on unweighted graphs.',
        pseudo: [
          'bfs(G, s, t):',
          '  Q = queue(); Q.push(s)',
          '  seen = {s}; parent = {}',
          '  while Q not empty:',
          '    v = Q.pop()',
          '    if v == t: break',
          '    for u in neighbors(v):',
          '      if u not in seen:',
          '        seen.add(u); parent[u] = v; Q.push(u)',
          '  // reconstruct path from parent if t reached'
        ],
        uses: ['Unweighted shortest path', 'Social graphs / hops'],
        openLink: '/pathfinding?algo=bfs'
      },
      {
        name: 'DFS', key: 'dfs', best: 'O(V+E)', avg: 'O(V+E)', worst: 'O(V+E)', space: 'O(V)',
        blurb: 'Depth-first exploration; not optimal for shortest path.',
        pseudo: [
          'dfs_iter(G, s):           // iterative (avoids deep recursion)',
          '  S = stack([s]); seen = {s}',
          '  while S not empty:',
          '    v = S.pop()',
          '    // process v (preorder)',
          '    for u in neighbors(v):',
          '      if u not in seen:',
          '        seen.add(u); S.push(u)',
          '',
          '// Recursive variant:',
          'dfs_rec(G, v):',
          '  seen.add(v)',
          '  for u in neighbors(v):',
          '    if u not in seen: dfs_rec(G, u)'
        ],
        uses: ['Cycle detection', 'Topological sort', 'Connected components'],
        openLink: '/pathfinding?algo=bfs'
      },
      {
        name: 'Dijkstra', key: 'dijkstra', best: 'O(E log V)', avg: 'O(E log V)', worst: 'O(E log V)', space: 'O(V)',
        blurb: 'Non-negative edge weights; optimal shortest path.',
        pseudo: [
          'dijkstra(G, s):',
          '  dist[v] = +inf for all v; dist[s] = 0',
          '  parent = {}',
          '  PQ = min-heap of (dist, v); push (0, s)',
          '  while PQ not empty:',
          '    (d, v) = pop_min(PQ)',
          '    if d > dist[v]: continue   // stale',
          '    for (v -> u, w) in edges:',
          '      if dist[v] + w < dist[u]:',
          '        dist[u] = dist[v] + w',
          '        parent[u] = v',
          '        push (dist[u], u) into PQ',
          '  // path from parent if needed'
        ],
        uses: ['Maps / routing', 'Weighted grids'],
        openLink: '/pathfinding?algo=dijkstra'
      },
      {
        name: 'A*', key: 'astar', best: 'O(E)', avg: 'O(E)', worst: 'O(E)', space: 'O(V)',
        blurb: 'Best-first using heuristic; fast on well-heuristic’d graphs.',
        pseudo: [
          'a_star(G, s, t, h):       // h is admissible heuristic',
          '  g[v] = +inf; g[s] = 0',
          '  f[v] = +inf; f[s] = h(s, t)',
          '  open = min-heap by f; push (f[s], s)',
          '  parent = {}',
          '  while open not empty:',
          '    (fv, v) = pop_min(open)',
          '    if v == t: break',
          '    for (v -> u, w) in edges:',
          '      tentative = g[v] + w',
          '      if tentative < g[u]:',
          '        g[u] = tentative',
          '        f[u] = g[u] + h(u, t)',
          '        parent[u] = v',
          '        push (f[u], u) into open',
          '  // reconstruct path from parent'
        ],
        uses: ['Game AI', 'Path planners (octile/Euclid/Manhattan)'],
        openLink: '/pathfinding?algo=astar'
      }
    ]
  }
  
const COMPLEXITY_ROWS = [
  { name: 'O(1)',        desc: 'Constant time' },
  { name: 'O(log n)',    desc: 'Logarithmic (binary search tree height)' },
  { name: 'O(n)',        desc: 'Linear (single pass)' },
  { name: 'O(n log n)',  desc: 'Divide & conquer (merge/quick typical)' },
  { name: 'O(n²)',       desc: 'Quadratic (double loop)' },
]

/* ----------------------------- Mini Demos ----------------------------- */

// super-light “mini” demos: not full engines, just tiny visuals for intuition

function MiniArrayDemo() {
  const [i, setI] = useState(0)
  const frames = [
    [7, 3, 5, 2, 9],
    [3, 7, 5, 2, 9],      // one bubble swap
    [3, 5, 7, 2, 9],
    [3, 5, 2, 7, 9],
    [2, 3, 5, 7, 9],      // sorted
  ]
  const arr = frames[i]
  return (
    <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0b1322' }}>
      <CardHeader title={<Typography variant="subtitle1" className="!font-semibold">Mini Demo — Sorting passes</Typography>} />
      <CardContent>
        <div className="flex items-end gap-2 h-28">
          {arr.map((v, idx) => (
            <div key={idx} className="bg-cyan-400 rounded-t w-8" style={{ height: `${v * 6}px` }} />
          ))}
        </div>
        <div className="mt-3 flex gap-6">
          <Button size="small" onClick={()=>setI(Math.max(0, i-1))}>Prev</Button>
          <Button size="small" onClick={()=>setI(Math.min(frames.length-1, i+1))}>Next</Button>
        </div>
        <Typography variant="caption" className="text-slate-400 block mt-2">
          Step through a few passes to see values drift toward the correct order.
        </Typography>
      </CardContent>
    </Card>
  )
}

function MiniGridDemo() {
  const [i, setI] = useState(0)
  // 7x7 tiny grid with a few frames of BFS “wave” growth
  const FRAMES = [
    new Set(['3,3']),
    new Set(['3,3','3,2','2,3','4,3','3,4']),
    new Set(['3,3','3,2','2,3','4,3','3,4','2,2','2,4','4,2','4,4']),
    new Set(['3,3','3,2','2,3','4,3','3,4','2,2','2,4','4,2','4,4','1,3','5,3']),
  ]
  const size = 7
  const isOn = (r,c) => FRAMES[i].has(`${r},${c}`)
  return (
    <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0b1322' }}>
      <CardHeader title={<Typography variant="subtitle1" className="!font-semibold">Mini Demo — BFS wave</Typography>} />
      <CardContent>
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${size}, 16px)`}}>
          {Array.from({length:size}).map((_,r)=>
            Array.from({length:size}).map((_,c)=>(
              <div key={`${r}-${c}`} className={`h-4 w-4 rounded ${isOn(r,c)?'bg-sky-400':'bg-slate-700/60'}`} />
            ))
          )}
        </div>
        <div className="mt-3 flex gap-6">
          <Button size="small" onClick={()=>setI(Math.max(0, i-1))}>Prev</Button>
          <Button size="small" onClick={()=>setI(Math.min(FRAMES.length-1, i+1))}>Next</Button>
        </div>
        <Typography variant="caption" className="text-slate-400 block mt-2">
          Classic breadth-first “ring” expansion from a source cell.
        </Typography>
      </CardContent>
    </Card>
  )
}

/* ------------------------------ Components ------------------------------ */

function AlgoCard({ algo, category }) {
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
          {/* Pseudocode */}
          <Box>
            <div className="text-slate-300 font-medium mb-2">Pseudocode</div>
            <pre className="text-slate-300 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm overflow-auto">
{algo.pseudo.join('\n')}
            </pre>
          </Box>

          {/* Complexity & uses */}
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

            <div className="text-slate-300 font-medium mt-4 mb-1">Real‑World Uses</div>
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

export default function Library() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState(0) // 0: All, 1: Sorting, 2: Pathfinding

  const algorithms = useMemo(()=>[
    ...COMPLEXITY.sorting.map(a => ({...a, _cat: 'sorting'})),
    ...COMPLEXITY.path.map(a => ({...a, _cat: 'path'})),
  ], [])

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
    <div className="max-w-7xl mx-auto space-y-10 p-6">
      {/* Header */}
      <Box className="rounded-2xl border border-slate-800 bg-[#0d1422]/60 p-6 md:p-8">
        <Stack direction="row" spacing={2} alignItems="center" className="mb-2">
          <ScienceRoundedIcon sx={{ color:'#67e8f9' }} />
          <Typography variant="h4" className="!font-bold">Algorithm Library</Typography>
        </Stack>
        <Typography className="text-slate-400">
          The theory companion to your visualizers: concise notes, pseudocode, complexities, mini‑demos,
          and real‑world context for sorting and pathfinding.
        </Typography>
      </Box>

      {/* Top controls */}
      <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0a1220' }}>
        <CardContent>
          <Stack direction={{ xs:'column', md:'row' }} spacing={2} alignItems={{ md:'center' }} justifyContent="space-between">
            <Tabs value={tab} onChange={(_,v)=>setTab(v)} textColor="inherit"
              sx={{
                '& .MuiTab-root': { color:'#94a3b8', textTransform:'none', fontWeight:600 },
                '& .Mui-selected': { color:'#e2e8f0' },
                '& .MuiTabs-indicator': { backgroundColor:'#67e8f9' }
              }}>
              <Tab label="All" />
              <Tab icon={<DataArrayRoundedIcon sx={{ mr:1 }} />} iconPosition="start" label="Sorting" />
              <Tab icon={<RouteRoundedIcon sx={{ mr:1 }} />} iconPosition="start" label="Pathfinding" />
            </Tabs>

            <TextField
              size="small"
              placeholder="Search algorithms, uses…"
              value={search}
              onChange={e=>setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchRoundedIcon className="mr-2 text-slate-400" /> }}
              sx={{
                minWidth: 280,
                '& .MuiOutlinedInput-root': { color:'#e2e8f0' },
                '& fieldset': { borderColor:'#334155' }
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Mini demos row */}
      <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MiniArrayDemo />
        <MiniGridDemo />
      </Box>

      {/* Algorithm cards */}
      <Box className="space-y-6">
        {filtered.map(a => (
          <AlgoCard key={`${a._cat}-${a.key}`} algo={a} category={a._cat} />
        ))}
        {filtered.length === 0 && (
          <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0a1220' }}>
            <CardContent>
              <Typography className="text-slate-400">No matches. Try a different search.</Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Complexity cheat sheet */}
      <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0a1220' }}>
        <CardHeader
          avatar={<BoltRoundedIcon sx={{ color:'#67e8f9' }} />}
          title={<Typography variant="h6" className="!font-semibold">Complexity Cheat Sheet</Typography>}
          subheader={<span className="text-slate-400">Quick reference for common time complexities.</span>}
        />
        <CardContent>
          <Table className="border border-slate-700 rounded-lg overflow-hidden" size="small">
            <TableHead>
              <TableRow>
                <TableCell className="bg-slate-900 text-slate-300">Big‑O</TableCell>
                <TableCell className="bg-slate-900 text-slate-300">Intuition</TableCell>
                <TableCell className="bg-slate-900 text-slate-300">Typical examples</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {COMPLEXITY_ROWS.map((r,i)=>(
                <TableRow key={i}>
                  <TableCell className="text-slate-200">{r.name}</TableCell>
                  <TableCell className="text-slate-200">{r.desc}</TableCell>
                  <TableCell className="text-slate-200">
                    {r.name === 'O(1)'        && 'Hash map lookup, push/pop'}
                    {r.name === 'O(log n)'    && 'Binary search, heap push/pop'}
                    {r.name === 'O(n)'        && 'Single pass, BFS layer size'}
                    {r.name === 'O(n log n)'  && 'Merge/Quick typical, heap sort'}
                    {r.name === 'O(n²)'       && 'Double nested loops, naive pairing'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Divider className="my-4 border-slate-700" />
          <Typography variant="body2" className="text-slate-400">
            Tip: asymptotic notation describes **growth**, not constant factors. Your Complexity Explorer page
            measures *real runtimes* and overlays these shapes to connect theory with practice.
          </Typography>
        </CardContent>
      </Card>

      {/* Footer CTA */}
      <Box className="flex flex-wrap gap-3">
        <Tooltip title="Open Sorting Arena">
          <Button component={Link} to="/sorting" variant="outlined"
            sx={{ borderColor:'#67e8f9', color:'#67e8f9', textTransform:'none' }}>
            Go to Sorting
          </Button>
        </Tooltip>
        <Tooltip title="Open Pathfinding Arena">
          <Button component={Link} to="/pathfinding" variant="outlined"
            sx={{ borderColor:'#67e8f9', color:'#67e8f9', textTransform:'none' }}>
            Go to Pathfinding
          </Button>
        </Tooltip>
      </Box>
    </div>
  )
}
