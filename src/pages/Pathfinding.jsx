import { useEffect, useMemo, useRef, useState } from 'react'
import {
    Box, Card, CardContent, CardHeader, Typography,
    Slider, Select, MenuItem, FormControl, InputLabel,
    Button, ButtonGroup, Chip, Grid
} from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded'

/* ---------- tiny utils ---------- */
function mulberry32(seed) { let t = seed >>> 0; return function () { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296 } }
function hashSeed(...vals) { let h = 2166136261; for (const ch of vals.join('|')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }

/* ---------- Grid helpers ---------- */
const EMPTY = 0, WALL = 1
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const DIRS8 = [...DIRS4, [1, 1], [1, -1], [-1, 1], [-1, -1]]
const manhattan = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c)
const euclid = (a, b) => Math.hypot(a.r - b.r, a.c - b.c)
const octile = (a, b) => {
    const dx = Math.abs(a.c - b.c), dy = Math.abs(a.r - b.r)
    const D = 1, D2 = Math.SQRT2
    return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy)
}
function makeRng(seed) { return mulberry32(hashSeed('algo', seed)) }
function shuffled(arr, rng) {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]] }
    return a
}
/* Fully open grid with optional random obstacles */
function buildOpenGrid(rows, cols, seed, density = 0) {
    rows = rows | 1; cols = cols | 1
    const rng = mulberry32(hashSeed('open', seed, rows, cols, density))
    const g = Array.from({ length: rows }, _ => Array(cols).fill(EMPTY))
    if (density <= 0) return g
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if ((r === 1 && c === 1) || (r === rows - 2 && c === cols - 2)) continue // keep start/goal clear
            if (rng() < density) g[r][c] = WALL
        }
    }
    return g
}

/* Build perfect maze with recursive backtracker on odd grid; then carve extra openings by "braid" ratio */
function buildMaze(rows, cols, seed, braid = 0.15) {
    rows = rows | 1; cols = cols | 1
    const rng = mulberry32(hashSeed('maze', seed, rows, cols, braid))
    const g = Array.from({ length: rows }, _ => Array(cols).fill(WALL))
    const inb = (r, c) => r > 0 && c > 0 && r < rows - 1 && c < cols - 1
    function carve(r, c) {
        g[r][c] = EMPTY
        const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]].sort(() => rng() - .5)
        for (const [dr, dc] of dirs) {
            const r2 = r + dr, c2 = c + dc, r1 = r + dr / 2, c1 = c + dc / 2
            if (inb(r2, c2) && g[r2][c2] === WALL) {
                g[r1 | 0][c1 | 0] = EMPTY
                carve(r2, c2)
            }
        }
    }
    carve(1, 1)
    // braid: remove some dead-ends
    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            if (g[r][c] !== EMPTY) continue
            let exits = 0; for (const [dr, dc] of DIRS4) exits += g[r + dr][c + dc] === EMPTY ? 1 : 0
            if (exits === 1 && rng() < braid) {
                const walls = []; for (const [dr, dc] of DIRS4) if (g[r + dr][c + dc] === WALL) walls.push([dr, dc])
                if (walls.length) { const [dr, dc] = walls[(walls.length * rng()) | 0]; g[r + dr][c + dc] = EMPTY }
            }
        }
    }
    return g
}

/* Optional weights 1..3 on empty cells (deterministic by seed) */
function buildWeights(grid, seed, enabled = false) {
    if (!enabled) return null
    const rng = mulberry32(hashSeed('weights', seed))
    return grid.map(row => row.map(cell => {
        if (cell === WALL) return Infinity
        const r = rng()
        return r < 0.15 ? 3 : r < 0.45 ? 2 : 1
    }))
}

/* ---------- Step emitters for BFS / Dijkstra / A* ---------- */
/* Steps: {type:'frontier'| 'visit' | 'path' | 'done', r,c} */
function bfsSteps(grid, start, goal, { dirs = DIRS4, rng = null, randomTies = false, weights = null } = {}) {
    // If weights or diagonals, fall back to Dijkstra to remain optimal
    if (weights || (dirs.length === 8)) {
        return dijkstraSteps(grid, start, goal, { dirs, rng, randomTies, weights })
    }
    const rows = grid.length, cols = grid[0].length
    const inb = (r, c) => r >= 0 && c >= 0 && r < rows && c < cols
    const steps = [], q = [start], seen = new Set([start.r + ',' + start.c]), parent = {}
    let visited = 0
    while (q.length) {
        const cur = q.shift(); steps.push({ type: 'visit', ...cur }); visited++
        if (cur.r === goal.r && cur.c === goal.c) break
        const nbrs = randomTies && rng ? shuffled(dirs, rng) : dirs
        for (const [dr, dc] of nbrs) {
            const nr = cur.r + dr, nc = cur.c + dc, key = nr + ',' + nc
            if (inb(nr, nc) && grid[nr][nc] !== WALL && !seen.has(key)) {
                seen.add(key); parent[key] = cur; q.push({ r: nr, c: nc })
                steps.push({ type: 'frontier', r: nr, c: nc })
            }
        }
    }
    // reconstruct
    let key = goal.r + ',' + goal.c, pathLen = 0
    if (parent[key] || (start.r === goal.r && start.c === goal.c)) {
        let cur = { r: goal.r, c: goal.c }
        while (!(cur.r === start.r && cur.c === start.c)) {
            steps.push({ type: 'path', ...cur }); pathLen++; cur = parent[cur.r + ',' + cur.c]
            if (!cur) break
        }
        steps.push({ type: 'path', ...start })
    }
    steps.push({ type: 'done' })
    return { steps, metrics: { visited, pathLen } }
}

function dijkstraSteps(grid, start, goal, { dirs = DIRS4, rng = null, randomTies = false, weights = null } = {}) {
    const rows = grid.length, cols = grid[0].length
    const inb = (r, c) => r >= 0 && c >= 0 && r < rows && c < cols
    const w = (r, c, pr, pc) => {
        const moveBase = (r !== pr && c !== pc) ? Math.SQRT2 : 1  // diagonal if both changed
        const cellWeight = weights ? weights[r][c] : 1
        return moveBase * cellWeight
    }

    const dist = Array.from({ length: rows }, _ => Array(cols).fill(Infinity))
    const parent = {}
    const steps = []
    let visited = 0
    dist[start.r][start.c] = 0
    const pq = [{ r: start.r, c: start.c, d: 0 }]
    while (pq.length) {
        // extract-min
        let idx = 0
        for (let i = 1; i < pq.length; i++) {
            if (pq[i].d < pq[idx].d) idx = i
            else if (pq[i].d === pq[idx].d && randomTies && rng && rng() < 0.5) idx = i
        }
        const cur = pq.splice(idx, 1)[0]; steps.push({ type: 'visit', r: cur.r, c: cur.c }); visited++
        if (cur.r === goal.r && cur.c === goal.c) break
        const nbrs = randomTies && rng ? shuffled(dirs, rng) : dirs
        for (const [dr, dc] of nbrs) {
            const nr = cur.r + dr, nc = cur.c + dc
            if (!inb(nr, nc) || grid[nr][nc] === WALL) continue
            const nd = cur.d + w(nr, nc, cur.r, cur.c)
            if (nd < dist[nr][nc]) {
                dist[nr][nc] = nd; parent[nr + ',' + nc] = { r: cur.r, c: cur.c }
                pq.push({ r: nr, c: nc, d: nd }); steps.push({ type: 'frontier', r: nr, c: nc })
            }
        }
    }
    // path
    let pathLen = 0, cur = { r: goal.r, c: goal.c }
    while (parent[cur.r + ',' + cur.c]) {
        steps.push({ type: 'path', ...cur }); pathLen++; cur = parent[cur.r + ',' + cur.c]
    }
    if (cur.r === start.r && cur.c === start.c) steps.push({ type: 'path', ...start })
    steps.push({ type: 'done' })
    return { steps, metrics: { visited, pathLen } }
}
/* Depth-First Search (stack-based). Not optimal; ignores weights. */
function dfsSteps(grid, start, goal, { dirs = DIRS4, rng = null, randomTies = false } = {}) {
    const rows = grid.length, cols = grid[0].length
    const inb = (r,c)=> r>=0 && c>=0 && r<rows && c<cols
  
    const steps = []
    const stack = [start]
    const seen = new Set([start.r+','+start.c])
    const parent = {}
    let visited = 0
  
    while (stack.length) {
      const cur = stack.pop()
      steps.push({ type:'visit', r: cur.r, c: cur.c }); visited++
      if (cur.r === goal.r && cur.c === goal.c) break
  
      const nbrs = randomTies && rng ? shuffled(dirs, rng) : dirs
      for (const [dr,dc] of nbrs) {
        const nr = cur.r + dr, nc = cur.c + dc
        const key = nr + ',' + nc
        if (!inb(nr,nc) || grid[nr][nc] === WALL || seen.has(key)) continue
        seen.add(key)
        parent[key] = cur
        stack.push({ r:nr, c:nc })
        steps.push({ type:'frontier', r:nr, c:nc })
      }
    }
  
    // reconstruct (whatever path DFS happened to find)
    let pathLen = 0
    let cur = { r: goal.r, c: goal.c }
    while (parent[cur.r+','+cur.c]) {
      steps.push({ type:'path', r: cur.r, c: cur.c })
      pathLen++
      cur = parent[cur.r+','+cur.c]
    }
    if (cur.r === start.r && cur.c === start.c) steps.push({ type:'path', ...start })
  
    steps.push({ type:'done' })
    return { steps, metrics: { visited, pathLen } }
  }
  
function aStarSteps(grid, start, goal, {
    dirs = DIRS4, rng = null, randomTies = false, weights = null, heuristic = 'manhattan'
} = {}) {
    const rows = grid.length, cols = grid[0].length, inb = (r, c) => r >= 0 && c >= 0 && r < rows && c < cols
    const h = heuristic === 'euclid' ? euclid : heuristic === 'octile' ? octile : manhattan
    const w = (r, c, pr, pc) => {
        const moveBase = (r !== pr && c !== pc) ? Math.SQRT2 : 1
        const cellWeight = weights ? weights[r][c] : 1
        return moveBase * cellWeight
    }

    const g = Array.from({ length: rows }, _ => Array(cols).fill(Infinity))
    const f = Array.from({ length: rows }, _ => Array(cols).fill(Infinity))
    const parent = {}
    const steps = []
    let visited = 0
    g[start.r][start.c] = 0; f[start.r][start.c] = h(start, goal)
    const open = [{ r: start.r, c: start.c, f: f[start.r][start.c], g: 0 }]
    const inOpen = new Set([start.r + ',' + start.c])

    while (open.length) {
        // pop best f (tie-break by larger g; randomized if asked)
        let idx = 0
        for (let i = 1; i < open.length; i++) {
            if (open[i].f < open[idx].f) idx = i
            else if (open[i].f === open[idx].f) {
                if (open[i].g > open[idx].g) idx = i
                else if (open[i].g === open[idx].g && randomTies && rng && rng() < 0.5) idx = i
            }
        }
        const cur = open.splice(idx, 1)[0]; inOpen.delete(cur.r + ',' + cur.c)
        steps.push({ type: 'visit', r: cur.r, c: cur.c }); visited++
        if (cur.r === goal.r && cur.c === goal.c) break

        const nbrs = randomTies && rng ? shuffled(dirs, rng) : dirs
        for (const [dr, dc] of nbrs) {
            const nr = cur.r + dr, nc = cur.c + dc
            if (!inb(nr, nc) || grid[nr][nc] === WALL) continue
            const tentative = g[cur.r][cur.c] + w(nr, nc, cur.r, cur.c)
            if (tentative < g[nr][nc]) {
                parent[nr + ',' + nc] = { r: cur.r, c: cur.c }
                g[nr][nc] = tentative
                f[nr][nc] = tentative + h({ r: nr, c: nc }, goal)
                if (!inOpen.has(nr + ',' + nc)) {
                    open.push({ r: nr, c: nc, f: f[nr][nc], g: g[nr][nc] })
                    inOpen.add(nr + ',' + nc)
                    steps.push({ type: 'frontier', r: nr, c: nc })
                }
            }
        }
    }
    // path
    let pathLen = 0, cur = { r: goal.r, c: goal.c }
    while (parent[cur.r + ',' + cur.c]) {
        steps.push({ type: 'path', ...cur }); pathLen++; cur = parent[cur.r + ',' + cur.c]
    }
    if (cur.r === start.r && cur.c === start.c) steps.push({ type: 'path', ...start })
    steps.push({ type: 'done' })
    return { steps, metrics: { visited, pathLen } }
}

const ALGOS = {
    bfs:      { label:'BFS',       fn:bfsSteps,      desc:'Breadth-first search on uniform/4-way grid.' },
    dijkstra: { label:'Dijkstra',  fn:dijkstraSteps, desc:'Non-negative weights; optimal with 4/8-way + costs.' },
    astar:    { label:'A*',        fn:aStarSteps,    desc:'Best-first guided by a heuristic (Manhattan/Euclid/Octile).' },
    dfs:      { label:'DFS',       fn:dfsSteps,      desc:'Depth-first (not shortest); good for exploring shapes.' }, // ← NEW
  }
  

/* ---------- Visualization ---------- */
function GridViz({ grid, start, goal, highlights, weights }) {
    const rows = grid.length, cols = grid[0].length
    const cellSize = Math.floor(Math.max(12, 560 / Math.max(rows, cols)))

    const colorFor = (r, c) => {
        const k = r + ',' + c

        // dynamic overlays come first
        if (start.r === r && start.c === c) return 'bg-emerald-500'
        if (goal.r === r && goal.c === c) return 'bg-cyan-400'
        if (highlights.path.has(k)) return 'bg-yellow-400'
        if (highlights.visit.has(k)) return 'bg-indigo-400'
        if (highlights.frontier.has(k)) return 'bg-sky-400'

        // static base: walls vs empty
        if (grid[r][c] === WALL) return 'bg-slate-900'  // darker, clearly distinct

        // subtle weight tint for empty cells (heavier => darker)
        if (weights) {
            const w = weights[r][c]
            if (w === 1) return 'bg-slate-500/30'
            if (w === 2) return 'bg-slate-500/50'
            if (w === 3) return 'bg-slate-500/70'
        }
        return 'bg-slate-500/35'
    }

    return (
        <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
            <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" className="!font-semibold mb-2">Grid</Typography>
                <div className="rounded-lg border border-slate-700 p-4 bg-slate-900" style={{ overflow: 'hidden' }}>
                    <div
                        className="grid"
                        style={{
                            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
                            gap: '2px', justifyContent: 'center'
                        }}
                    >
                        {grid.map((row, r) =>
                            row.map((_, c) => (
                                <div
                                    key={`${r}-${c}`}
                                    className={`rounded ${colorFor(r, c)} transition-colors duration-150`}
                                    title={`(${r}, ${c})`}
                                    style={{ width: cellSize, height: cellSize }}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <Legend swatch="bg-slate-900" label="Wall" />
                    <Legend swatch="bg-slate-500/35" label="Empty (tinted by weight)" />
                    <Legend swatch="bg-emerald-500" label="Start" />
                    <Legend swatch="bg-cyan-400" label="Goal" />
                    <Legend swatch="bg-sky-400" label="Frontier" />
                    <Legend swatch="bg-indigo-400" label="Visited" />
                    <Legend swatch="bg-yellow-400" label="Path" />
                </div>
            </CardContent>
        </Card>
    )
}

function Legend({ swatch, label }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${swatch}`} />
            <span className="text-slate-300">{label}</span>
        </div>
    )
}

/* ---------- Page ---------- */
export default function Pathfinding() {
    const [mode, setMode] = useState('maze') // 'maze' | 'open'
    const [obst, setObst] = useState(0.0)    // 0..0.5 obstacle density (open mode only)

    const [algo, setAlgo] = useState('bfs')
    const [rows, setRows] = useState(21)
    const [cols, setCols] = useState(35)
    const [braid, setBraid] = useState(0.15) // extra openings
    const [seed, setSeed] = useState(7)
    const [speed, setSpeed] = useState(1)

    // NEW toggles to diversify paths
    const [diagonals, setDiagonals] = useState(false)
    const [weighted, setWeighted] = useState(false)
    const [randomTies, setRandomTies] = useState(true)
    const [astarHeur, setAstarHeur] = useState('manhattan') // 'manhattan' | 'euclid' | 'octile'

    const maze = useMemo(() => buildMaze(rows, cols, seed, braid), [rows, cols, seed, braid])
    const open = useMemo(() => buildOpenGrid(rows, cols, seed, obst), [rows, cols, seed, obst])

    const gridBase = mode === 'maze' ? maze : open
    const weights = useMemo(() => buildWeights(gridBase, seed, weighted), [gridBase, seed, weighted])


    const [grid, setGrid] = useState(maze)
    const [start, setStart] = useState({ r: 1, c: 1 })
    const [goal, setGoal] = useState({ r: rows - 2, c: cols - 2 })

    const [running, setRunning] = useState(false)
    const stepsRef = useRef({ list: [], cursor: 0, metrics: { visited: 0, pathLen: 0, timeMs: 0 } })
    const [high, setHigh] = useState({ frontier: new Set(), visit: new Set(), path: new Set() })
    const [metrics, setMetrics] = useState({ visited: 0, pathLen: 0, timeMs: 0 })

    // rebuild when grid dims/maze change
    // rebuild when grid base or dims change
    useEffect(() => {
        setGrid(gridBase) // ← use the active mode's base grid
        setStart({ r: 1, c: 1 });
        setGoal({ r: rows - 2, c: cols - 2 })
        stepsRef.current = { list: [], cursor: 0, metrics: { visited: 0, pathLen: 0, timeMs: 0 } }
        setHigh({ frontier: new Set(), visit: new Set(), path: new Set() })
        setMetrics({ visited: 0, pathLen: 0, timeMs: 0 })
        setRunning(false)
    }, [gridBase, rows, cols, mode]) // ← depend on gridBase & mode too


    // reset when algorithm changes so metrics rebuild properly
    useEffect(() => {
        stepsRef.current = { list: [], cursor: 0, metrics: { visited: 0, pathLen: 0, timeMs: 0 } }
        setHigh({ frontier: new Set(), visit: new Set(), path: new Set() })
        setMetrics({ visited: 0, pathLen: 0, timeMs: 0 })
        setRunning(false)
    }, [algo, diagonals, weighted, randomTies, astarHeur])

    function buildSteps() {
        const rng = makeRng(seed)
        const dirs = diagonals ? DIRS8 : DIRS4
        const opts = {
            dirs,
            rng: randomTies ? rng : null,
            randomTies,
            weights: weights,
            heuristic: astarHeur
        }
        const t0 = performance.now()
        const algoFn = ALGOS[algo].fn
        const { steps, metrics: m } = algoFn(grid, start, goal, opts)
        const timeMs = performance.now() - t0
        stepsRef.current = { list: steps, cursor: 0, metrics: { ...m, timeMs } }
        setMetrics({ ...m, timeMs })
    }

    function run() { if (!stepsRef.current.list.length) buildSteps(); setRunning(true) }
    const pause = () => setRunning(false)
    function reset() {
        setRunning(false)
        setGrid(gridBase) // ← was maze
        stepsRef.current = { list: [], cursor: 0, metrics: { visited: 0, pathLen: 0, timeMs: 0 } }
        setHigh({ frontier: new Set(), visit: new Set(), path: new Set() })
        setMetrics({ visited: 0, pathLen: 0, timeMs: 0 })
    }

    function randomize() { setSeed((s) => (s * 9301 + 49297) % 233280 | 0) }

    function applyOneStep() {
        const data = stepsRef.current
        if (!data.list.length) buildSteps()
        const step = data.list[data.cursor]
        if (!step) { setRunning(false); return }
        const key = step.r + ',' + step.c
        setHigh(prev => {
            const next = {
                frontier: new Set(prev.frontier),
                visit: new Set(prev.visit),
                path: new Set(prev.path),
            }
            if (step.type === 'frontier') {
                next.frontier.add(key)
            } else if (step.type === 'visit') {
                next.frontier.delete(key)
                next.visit.add(key)
            } else if (step.type === 'path') {
                next.path.add(key)
            }
            return next
        })
        stepsRef.current.cursor++
    }

    // paced RAF loop: visible steps even at slow speeds; scale up to very fast
    useEffect(() => {
        if (!running) return
        let id
        const stepInterval = 120 / Math.max(0.25, speed)   // ~120ms/step at 1x
        let last = performance.now()
        let acc = 0
        const tick = (now) => {
            acc += now - last
            last = now
            while (acc >= stepInterval) {
                applyOneStep()
                acc -= stepInterval
                if (stepsRef.current.cursor >= stepsRef.current.list.length) { setRunning(false); return }
            }
            id = requestAnimationFrame(tick)
        }
        id = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(id)
    }, [running, speed])

    const current = ALGOS[algo]
    const fmtMs = (ms) => ms < 1 ? `${(ms * 1000 | 0)} µs` : ms < 10 ? `${ms.toFixed(2)} ms` : `${Math.round(ms)} ms`

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Typography variant="h4" className="!font-bold text-slate-100">Pathfinding Arena</Typography>
                        <Chip label={current.label} className="bg-slate-800 text-slate-300 border border-slate-600" />
                    </div>
                    <Typography variant="body1" className="text-slate-400 max-w-2xl">
                        {current.desc}
                    </Typography>
                </div>
                <Button href="/" variant="outlined" sx={{ borderColor: '#67e8f9', color: '#67e8f9', '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' } }}>← Back to Home</Button>
            </div>

            {/* Controls */}
            <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
                <CardHeader title={<Typography variant="h6" className="!font-semibold">Controls</Typography>} sx={{ pb: 1 }} />
                <CardContent>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="medium">
                                <InputLabel id="algo">Algorithm</InputLabel>
                                <Select labelId="algo" label="Algorithm" value={algo} onChange={e => setAlgo(e.target.value)}
                                    sx={{ '& .MuiSelect-select': { color: '#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' } }}>
                                    <MenuItem value="bfs">BFS</MenuItem>
                                    <MenuItem value="dfs">DFS</MenuItem>
                                    <MenuItem value="dijkstra">Dijkstra</MenuItem>
                                    <MenuItem value="astar">A*</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        {/* Mode: Maze | Open Field */}
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="medium">
                                <InputLabel id="mode">Mode</InputLabel>
                                <Select
                                    labelId="mode"
                                    label="Mode"
                                    value={mode}
                                    onChange={e => setMode(e.target.value)}
                                    sx={{ '& .MuiSelect-select': { color: '#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' } }}
                                >
                                    <MenuItem value="maze">Maze</MenuItem>
                                    <MenuItem value="open">Open Field</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Obstacles (Open only) */}
                        <Grid item xs={12} md={3}>
                            <Box>
                                <Typography variant="subtitle2" className="text-slate-300 mb-2">
                                    Obstacles: {(obst * 100) | 0}% {mode === 'open' ? '' : '(open mode only)'}
                                </Typography>
                                <Slider
                                    value={obst}
                                    min={0}
                                    max={0.5}
                                    step={0.01}
                                    onChange={(_, v) => setObst(v)}
                                    disabled={mode !== 'open'}
                                    sx={{
                                        '& .MuiSlider-track': { backgroundColor: mode === 'open' ? '#67e8f9' : '#374151' },
                                        '& .MuiSlider-thumb': { backgroundColor: mode === 'open' ? '#67e8f9' : '#374151' },
                                        '& .MuiSlider-rail': { backgroundColor: '#374151' }
                                    }}
                                />
                            </Box>
                        </Grid>

                        {/* Braid (Maze only) – make it clear when disabled */}
                        <Grid item xs={12} md={3}>
                            <Box>
                                <Typography variant="subtitle2" className="text-slate-300 mb-2">
                                    Braid: {(braid * 100) | 0}% {mode === 'maze' ? '' : '(maze mode only)'}
                                </Typography>
                                <Slider
                                    value={braid}
                                    min={0}
                                    max={0.5}
                                    step={0.01}
                                    onChange={(_, v) => setBraid(v)}
                                    disabled={mode !== 'maze'}
                                    sx={{
                                        '& .MuiSlider-track': { backgroundColor: mode === 'maze' ? '#67e8f9' : '#374151' },
                                        '& .MuiSlider-thumb': { backgroundColor: mode === 'maze' ? '#67e8f9' : '#374151' },
                                        '& .MuiSlider-rail': { backgroundColor: '#374151' }
                                    }}
                                />
                            </Box>
                        </Grid>


                        <Grid item xs={12} md={3}>
                            <Box>
                                <Typography variant="subtitle2" className="text-slate-300 mb-2">Rows: {rows}</Typography>
                                <Slider value={rows} min={9} max={51} step={2} onChange={(_, v) => setRows(v)}
                                    sx={{ '& .MuiSlider-track': { backgroundColor: '#67e8f9' }, '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' }, '& .MuiSlider-rail': { backgroundColor: '#374151' } }} />
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Box>
                                <Typography variant="subtitle2" className="text-slate-300 mb-2">Cols: {cols}</Typography>
                                <Slider value={cols} min={9} max={73} step={2} onChange={(_, v) => setCols(v)}
                                    sx={{ '& .MuiSlider-track': { backgroundColor: '#67e8f9' }, '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' }, '& .MuiSlider-rail': { backgroundColor: '#374151' } }} />
                            </Box>
                        </Grid>

 

                        <Grid item xs={12} md={3}>
                            <Box>
                                <Typography variant="subtitle2" className="text-slate-300 mb-2">Speed: {speed}x</Typography>
                                <Slider value={speed} min={0.25} max={100} step={1} onChange={(_, v) => setSpeed(v)}
                                    sx={{ '& .MuiSlider-track': { backgroundColor: '#67e8f9' }, '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' }, '& .MuiSlider-rail': { backgroundColor: '#374151' } }} />
                            </Box>
                        </Grid>

                        {/* NEW: Divergence controls */}
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="medium">
                                <InputLabel id="heur" disabled={algo !== 'astar'}>A* Heuristic</InputLabel>
                                <Select
                                    labelId="heur"
                                    label="A* Heuristic"
                                    value={astarHeur}
                                    onChange={e => setAstarHeur(e.target.value)}
                                    disabled={algo !== 'astar'}
                                    sx={{ '& .MuiSelect-select': { color: '#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' } }}
                                >
                                    <MenuItem value="manhattan">Manhattan</MenuItem>
                                    <MenuItem value="euclid">Euclidean</MenuItem>
                                    <MenuItem value="octile">Octile (8-way)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Box className="flex flex-col gap-2">
                                <Button variant="outlined" onClick={() => setDiagonals(v => !v)}
                                    sx={{ borderColor: '#67e8f9', color: '#67e8f9', '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' } }}>
                                    {diagonals ? 'Diagonals: ON' : 'Diagonals: OFF'}
                                </Button>
                                <Button variant="outlined" onClick={() => setWeighted(v => !v)}
                                    sx={{ borderColor: '#67e8f9', color: '#67e8f9', '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' } }}>
                                    {weighted ? 'Weighted Cells: ON' : 'Weighted Cells: OFF'}
                                </Button>
                                <Button variant="outlined" onClick={() => setRandomTies(v => !v)}
                                    sx={{ borderColor: '#67e8f9', color: '#67e8f9', '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' } }}>
                                    {randomTies ? 'Random Tie-Breaks: ON' : 'Random Tie-Breaks: OFF'}
                                </Button>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="outlined"
                                    startIcon={<ShuffleRoundedIcon />}
                                    onClick={randomize}
                                    fullWidth
                                    sx={{ borderColor: '#67e8f9', color: '#67e8f9', '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' } }}
                                >
                                    New Grid
                                </Button>

                                <ButtonGroup variant="contained" fullWidth>
                                    {!running ? (
                                        <Button onClick={run} startIcon={<PlayArrowRoundedIcon />} sx={{ backgroundColor: '#059669', '&:hover': { backgroundColor: '#047857' } }}>Run</Button>
                                    ) : (
                                        <Button onClick={pause} startIcon={<PauseRoundedIcon />} sx={{ backgroundColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c' } }}>Pause</Button>
                                    )}
                                    <Button onClick={() => applyOneStep()} startIcon={<SkipNextRoundedIcon />} sx={{ backgroundColor: '#7c3aed', '&:hover': { backgroundColor: '#6d28d9' } }}>Step</Button>
                                    <Button onClick={reset} startIcon={<RestartAltRoundedIcon />} sx={{ backgroundColor: '#374151', '&:hover': { backgroundColor: '#1f2937' } }}>Reset</Button>
                                </ButtonGroup>
                            </div>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Viz */}
            <GridViz grid={grid} start={start} goal={goal} highlights={high} weights={weights} />

            {/* Metrics */}
            <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
                <CardHeader title={<Typography variant="h6" className="!font-semibold">Performance Metrics</Typography>} sx={{ pb: 1 }} />
                <CardContent>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={3}>
                            <div className="text-center p-4 bg-slate-800 rounded-lg">
                                <Typography variant="h4" className="!font-bold text-amber-400">{metrics.visited}</Typography>
                                <Typography variant="body2" className="text-slate-400">Visited Nodes</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <div className="text-center p-4 bg-slate-800 rounded-lg">
                                <Typography variant="h4" className="!font-bold text-red-400">{metrics.pathLen}</Typography>
                                <Typography variant="body2" className="text-slate-400">Path Length</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <div className="text-center p-4 bg-slate-800 rounded-lg">
                                <Typography variant="h4" className="!font-bold text-sky-400">{fmtMs(metrics.timeMs)}</Typography>
                                <Typography variant="body2" className="text-slate-400">Build Time</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} md={3}>
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
        </div>
    )
}
