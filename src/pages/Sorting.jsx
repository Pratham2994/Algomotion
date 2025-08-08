import { useEffect, useMemo, useRef, useState } from 'react'
import {
    Box, Card, CardContent, CardHeader, Typography,
    Slider, Select, MenuItem, FormControl, InputLabel, Button, ButtonGroup, Chip, Grid
} from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded'

/* ---------- tiny utils ---------- */
function mulberry32(seed) {
    let t = seed >>> 0
    return function () {
        t += 0x6D2B79F5
        let r = Math.imul(t ^ (t >>> 15), 1 | t)
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    }
}
function hashSeed(...vals) {
    let h = 2166136261
    for (const ch of vals.join('|')) {
        h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619)
    }
    return h >>> 0
}
const getParam = (k, f) => new URLSearchParams(location.search).get(k) ?? f
function setParams(obj) {
    const sp = new URLSearchParams(location.search)
    Object.entries(obj).forEach(([k, v]) => sp.set(k, String(v)))
    history.replaceState(null, '', `?${sp.toString()}`)
}

/* ---------- step emitters (simple & accurate) ---------- */
/* Steps: {type:'compare', i,j} | {type:'swap', i,j} | {type:'overwrite', i, value} | {type:'placed', i} */

function bubbleSteps(a0) {
    const a = a0.slice(), steps = []
    let comparisons = 0, writes = 0
    const n = a.length

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - 1 - i; j++) {
            comparisons++; steps.push({ type: 'compare', i: j, j: j + 1 })
            if (a[j] > a[j + 1]) {
                ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
                writes++;  // swap counts as a write/mutation
                steps.push({ type: 'swap', i: j, j: j + 1 })
            }
        }
    }
    for (let i = 0; i < n; i++) steps.push({ type: 'placed', i })  // only at the end
    return { steps, metrics: { comparisons, writes } }
}

function insertionSteps(a0) {
    const a = a0.slice(), steps = []
    let comparisons = 0, writes = 0

    for (let i = 1; i < a.length; i++) {
        const key = a[i]
        let j = i - 1
        while (j >= 0) {
            comparisons++; steps.push({ type: 'compare', i: j, j: j + 1 })
            if (a[j] > key) {
                a[j + 1] = a[j]; writes++
                steps.push({ type: 'overwrite', i: j + 1, value: a[j] })
                j--
            } else break
        }
        a[j + 1] = key; writes++
        steps.push({ type: 'overwrite', i: j + 1, value: key })
    }
    for (let i = 0; i < a.length; i++) steps.push({ type: 'placed', i })
    return { steps, metrics: { comparisons, writes } }
}

function selectionSteps(a0) {
    const a = a0.slice(), steps = []
    let comparisons = 0, writes = 0
    const n = a.length

    for (let i = 0; i < n - 1; i++) {
        let min = i
        for (let j = i + 1; j < n; j++) {
            comparisons++; steps.push({ type: 'compare', i: min, j })
            if (a[j] < a[min]) min = j
        }
        if (min !== i) {
            ;[a[i], a[min]] = [a[min], a[i]]
            writes++
            steps.push({ type: 'swap', i, j: min })
        }
    }
    for (let i = 0; i < n; i++) steps.push({ type: 'placed', i })
    return { steps, metrics: { comparisons, writes } }
}
/* ---------- NEW: Quick Sort (Lomuto partition) ---------- */
function quickSteps(a0) {
    const a = a0.slice(), steps = []
    let comparisons = 0, writes = 0
  
    function partition(lo, hi) {
      const pivot = a[hi]
      let i = lo
      for (let j = lo; j < hi; j++) {
        comparisons++; steps.push({ type: 'compare', i: j, j: hi }) // a[j] vs pivot
        if (a[j] <= pivot) {
          if (i !== j) {
            ;[a[i], a[j]] = [a[j], a[i]]
            writes++; steps.push({ type: 'swap', i, j })
          }
          i++
        }
      }
      if (i !== hi) {
        ;[a[i], a[hi]] = [a[hi], a[i]]
        writes++; steps.push({ type: 'swap', i, j: hi })
      }
      return i
    }
  
    function qs(lo, hi) {
      if (lo >= hi) return
      const p = partition(lo, hi)
      qs(lo, p - 1)
      qs(p + 1, hi)
    }
  
    qs(0, a.length - 1)
    for (let i = 0; i < a.length; i++) steps.push({ type: 'placed', i }) // green only at end
    return { steps, metrics: { comparisons, writes } }
  }
  
  /* ---------- NEW: Heap Sort (max-heap, sift-down) ---------- */
  function heapSteps(a0) {
    const a = a0.slice(), steps = []
    let comparisons = 0, writes = 0
    const n = a.length
  
    function siftDown(i, size) {
      while (true) {
        const l = 2 * i + 1
        const r = 2 * i + 2
        if (l >= size) break
  
        let largest = l
        if (r < size) {
          comparisons++; steps.push({ type: 'compare', i: l, j: r }) // left vs right
          if (a[r] > a[l]) largest = r
        }
        comparisons++; steps.push({ type: 'compare', i, j: largest }) // parent vs larger child
        if (a[i] >= a[largest]) break
  
        ;[a[i], a[largest]] = [a[largest], a[i]]
        writes++; steps.push({ type: 'swap', i, j: largest })
        i = largest
      }
    }
  
    // Build max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) siftDown(i, n)
    // Extract elements
    for (let end = n - 1; end > 0; end--) {
      ;[a[0], a[end]] = [a[end], a[0]]
      writes++; steps.push({ type: 'swap', i: 0, j: end })
      siftDown(0, end)
    }
  
    for (let i = 0; i < n; i++) steps.push({ type: 'placed', i }) // green only at end
    return { steps, metrics: { comparisons, writes } }
  }
  
function mergeSteps(a0) {
    const a = a0.slice(), n = a.length, steps = []
    let comparisons = 0, writes = 0
    const aux = new Array(n)

    for (let sz = 1; sz < n; sz <<= 1) {
        for (let lo = 0; lo < n - sz; lo += sz << 1) {
            const mid = lo + sz - 1
            const hi = Math.min(lo + (sz << 1) - 1, n - 1)
            for (let k = lo; k <= hi; k++) aux[k] = a[k]

            let i = lo, j = mid + 1
            for (let k = lo; k <= hi; k++) {
                if (i > mid) {
                    a[k] = aux[j++]; writes++
                    steps.push({ type: 'overwrite', i: k, value: a[k] })
                } else if (j > hi) {
                    a[k] = aux[i++]; writes++
                    steps.push({ type: 'overwrite', i: k, value: a[k] })
                } else {
                    comparisons++; steps.push({ type: 'compare', i, j })
                    if (aux[j] < aux[i]) {
                        a[k] = aux[j++]; writes++
                        steps.push({ type: 'overwrite', i: k, value: a[k] })
                    } else {
                        a[k] = aux[i++]; writes++
                        steps.push({ type: 'overwrite', i: k, value: a[k] })
                    }
                }
            }
        }
    }
    for (let i = 0; i < n; i++) steps.push({ type: 'placed', i })
    return { steps, metrics: { comparisons, writes } }
}

/* Map name -> emitter */
const EMITTERS = {
    bubble:   { label: 'Bubble Sort',   fn: bubbleSteps, bigO: 'O(n²)',        description: 'Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.' },
    insertion:{ label: 'Insertion Sort',fn: insertionSteps, bigO: 'O(n²)',     description: 'Builds the final sorted array one item at a time by inserting into the sorted portion.' },
    selection:{ label: 'Selection Sort',fn: selectionSteps, bigO: 'O(n²)',     description: 'Finds the minimum and moves it to the front repeatedly.' },
    merge:    { label: 'Merge Sort',    fn: mergeSteps,   bigO: 'O(n log n)',  description: 'Divide and conquer; merge sorted halves.' },
  
    // NEW:
    quick:    { label: 'Quick Sort',    fn: quickSteps,   bigO: 'O(n log n)',  description: 'Partition around a pivot; recursively sort subarrays.' },
    heap:     { label: 'Heap Sort',     fn: heapSteps,    bigO: 'O(n log n)',  description: 'Build a max-heap, then repeatedly extract the max.' },
  }
  
/* ---------- Visualization ---------- */
function BarViz({ array, highlights, placedSet }) {
    const n = array.length
    const max = Math.max(...array, 1)
    const MAX_LABELS = 28
    const labelStride = Math.max(1, Math.ceil(n / MAX_LABELS))
    const SHOW_TEXT_MIN_PX = 26 // need ~26px for two-digit values comfortably


    // responsive width
    const wrapRef = useRef(null)
    const [wrapW, setWrapW] = useState(0)
    useEffect(() => {
        if (typeof ResizeObserver === 'undefined') return
        const ro = new ResizeObserver(entries => {
            for (const e of entries) setWrapW(e.contentRect.width)
        })
        if (wrapRef.current) ro.observe(wrapRef.current)
        return () => ro.disconnect()
    }, [])

    // adaptive spacing so nothing overflows (works up to n=100)
    const gap = n > 80 ? 2 : n > 50 ? 4 : n > 30 ? 6 : 8
    const maxBarW = 40
    const minBarW = 4
    const barWidth = Math.max(
        minBarW,
        Math.min(maxBarW, Math.floor((wrapW - Math.max(0, (n - 1) * gap)) / Math.max(1, n)))
    )

    const getBarColor = (idx) => {
        const isCompare = highlights.compare.has(idx)
        const isSwap = highlights.swap.has(idx)
        const isOverwrite = highlights.overwrite.has(idx)
        const isPlaced = placedSet.has(idx)
        if (isSwap) return 'bg-red-500'
        if (isCompare) return 'bg-amber-400'
        if (isOverwrite) return 'bg-sky-400'
        if (isPlaced) return 'bg-emerald-500'
        return 'bg-cyan-400'
    }

    const getBarStyle = (idx, val) => {
        const hPct = 5 + (val / max) * 90
        const base = {
            width: `${barWidth}px`,
            height: `${hPct}%`,
            minHeight: '6px',
            transition: 'all 0.25s ease-in-out',
        }
        if (highlights.compare.has(idx) || highlights.swap.has(idx)) {
            base.transform = 'scale(1.1)'
            base.boxShadow = '0 0 15px rgba(255,255,255,0.5)'
            base.zIndex = 10
        }
        return base
    }

    // label font shrinks a bit for big n; label width == bar width so it never overflows
    const labelStyle = {
        width: `${barWidth}px`,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        height: 28,
        fontSize: n > 80 ? '10px' : n > 60 ? '11px' : '12px'
    }


    return (
        <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
            <CardContent sx={{ p: 3 }}>
                <div className="mb-4">
                    <Typography variant="h6" className="!font-semibold mb-2">Array Visualization</Typography>
                    <Typography variant="body2" className="text-slate-400">
                        Watch the sorting algorithm in action. Bar height represents the value, colors show current operations.
                    </Typography>
                </div>

                <div ref={wrapRef} className="relative bg-slate-900 rounded-lg border border-slate-700 p-6">
                    <div className="h-[500px] flex items-end justify-center overflow-hidden">
                        <div className="flex items-end h-full w-full" style={{ gap: `${gap}px` }}>
                            {array.map((val, idx) => (
                                <div key={idx} className="relative flex flex-col items-center h-full justify-end">
                                    <div
                                        className={`rounded-t-lg ${getBarColor(idx)} transition-all duration-300`}
                                        style={getBarStyle(idx, val)}
                                        title={`Index ${idx}: ${val}`}
                                    />
                                    <div className="mt-3 text-center" style={labelStyle}>
                                        {idx % labelStride === 0 && barWidth >= SHOW_TEXT_MIN_PX ? (
                                            <span className="font-bold text-slate-200 bg-slate-800 px-2 py-1 rounded-lg border border-slate-600 shadow-lg inline-block w-full">
                                                {val}
                                            </span>
                                        ) : null}
                                    </div>


                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Legend unchanged */}
                <div className="mt-6 flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-amber-400"></div><span className="text-slate-300 font-medium">Comparing</span></div>
                    <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-red-500"></div><span className="text-slate-300 font-medium">Swapping</span></div>
                    <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-sky-400"></div><span className="text-slate-300 font-medium">Writing</span></div>
                    <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-emerald-500"></div><span className="text-slate-300 font-medium">Sorted</span></div>
                </div>
            </CardContent>
        </Card>
    )
}

/* ---------- Page ---------- */
export default function Sorting() {
    const [algo, setAlgo] = useState(getParam('algo', 'bubble'))
    const [n, setN] = useState(Number(getParam('n', 8)))
    const [speed, setSpeed] = useState(Number(getParam('speed', 1)))
    const [seed, setSeed] = useState(Number(getParam('seed', 7)))

    // array
    const baseArray = useMemo(() => {
        const rng = mulberry32(hashSeed('arr', seed, n))
        return Array.from({ length: n }, () => Math.floor(rng() * 95) + 5)
    }, [n, seed])

    // live state
    // live state
    const [array, setArray] = useState(baseArray)
    const [running, setRunning] = useState(false)
    const stepsRef = useRef({ list: [], cursor: 0, metrics: { comparisons: 0, writes: 0, timeMs: 0 } })
    const [high, setHigh] = useState({ compare: new Set(), swap: new Set(), overwrite: new Set() })
    const [placed, setPlaced] = useState(new Set())
    const [metrics, setMetrics] = useState({ comparisons: 0, writes: 0, timeMs: 0 })



    // sync URL on changes
    useEffect(() => { setParams({ algo, n, speed, seed }) }, [algo, n, speed, seed])

    // reset when config changes
    useEffect(() => {
        setArray(baseArray)
        setHigh({ compare: new Set(), swap: new Set(), overwrite: new Set() })
        setPlaced(new Set())
        stepsRef.current = { list: [], cursor: 0, metrics: { comparisons: 0, writes: 0, timeMs: 0 } }
        setMetrics({ comparisons: 0, writes: 0, timeMs: 0 })   // ← zero out
        setRunning(false)
    }, [baseArray, algo])

    // build steps on Run
    function buildSteps() {
        const emitter = EMITTERS[algo]?.fn || EMITTERS.bubble.fn
        const t0 = performance.now()
        const { steps, metrics: m } = emitter(baseArray)
        const timeMs = performance.now() - t0
        stepsRef.current = { list: steps, cursor: 0, metrics: { ...m, timeMs } }
        setMetrics({ ...m, timeMs })   // ← reflects the built plan immediately
    }

    function run() {
        if (stepsRef.current.list.length === 0) buildSteps()
        setRunning(true)
    }
    function pause() { setRunning(false) }
    function reset() {
        setRunning(false)
        setArray(baseArray)
        setHigh({ compare: new Set(), swap: new Set(), overwrite: new Set() })
        setPlaced(new Set())
        stepsRef.current = { list: [], cursor: 0, metrics: { comparisons: 0, writes: 0, timeMs: 0 } }
        setMetrics({ comparisons: 0, writes: 0, timeMs: 0 })   // ← zero out
    }

    function randomize() {
        setSeed(Math.floor(Math.random() * 1e9))
        setMetrics({ comparisons: 0, writes: 0, timeMs: 0 })   // ← zero out until next Run
    }

    function applyOneStep() {
        const data = stepsRef.current
        if (!data.list.length) buildSteps()
        const step = data.list[data.cursor]
        if (!step) { setRunning(false); return }

        // highlights from this step only
        const nextHigh = { compare: new Set(), swap: new Set(), overwrite: new Set() }
        if (step.type === 'compare') {
            nextHigh.compare.add(step.i); nextHigh.compare.add(step.j)
        } else if (step.type === 'swap') {
            nextHigh.swap.add(step.i); nextHigh.swap.add(step.j)
        } else if (step.type === 'overwrite') {
            nextHigh.overwrite.add(step.i)
        }
        setHigh(nextHigh)

        // functional updates avoid stale closures
        setArray(prev => {
            const a = prev.slice()
            if (step.type === 'swap') {
                ;[a[step.i], a[step.j]] = [a[step.j], a[step.i]]
            } else if (step.type === 'overwrite') {
                a[step.i] = step.value
            }
            return a
        })

        setPlaced(prev => {
            if (step.type !== 'placed') return prev
            const ns = new Set(prev); ns.add(step.i)
            return ns
        })

        stepsRef.current.cursor++
    }

    // raf loop
    useEffect(() => {
        if (!running) return
        let id
        const tick = () => {
            const perFrame = Math.max(1, Math.floor(3 * speed))
            for (let k = 0; k < perFrame; k++) applyOneStep()
            id = requestAnimationFrame(tick)
        }
        id = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(id)
    }, [running, speed])


    const currentAlgo = EMITTERS[algo] || EMITTERS.bubble
    const fmtMs = (ms) => {
        if (ms === 0) return '0 ms'
        if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`
        if (ms < 10) return `${ms.toFixed(2)} ms`
        return `${Math.round(ms)} ms`
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Typography variant="h4" className="!font-bold text-slate-100">
                            {currentAlgo.label}
                        </Typography>
                        <Chip
                            label={currentAlgo.bigO}
                            size="medium"
                            className="bg-slate-800 text-slate-300 border border-slate-600"
                        />
                    </div>
                    <Typography variant="body1" className="text-slate-400 max-w-2xl">
                        {currentAlgo.description}
                    </Typography>
                </div>
                <Button
                    href="/"
                    variant="outlined"
                    sx={{
                        borderColor: '#67e8f9',
                        color: '#67e8f9',
                        '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' }
                    }}
                >
                    ← Back to Home
                </Button>
            </div>

            {/* Controls */}
            <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
                <CardHeader
                    title={<Typography variant="h6" className="!font-semibold">Controls</Typography>}
                    sx={{ pb: 1 }}
                />
                <CardContent>
                    <Grid container spacing={4}>
                        {/* Algorithm Selection */}
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="medium">
                                <InputLabel id="algo-label">Algorithm</InputLabel>
                                <Select
                                    labelId="algo-label"
                                    label="Algorithm"
                                    value={algo}
                                    onChange={e => setAlgo(e.target.value)}
                                    sx={{
                                        '& .MuiSelect-select': { color: '#e2e8f0' },
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' }
                                    }}
                                >
                                    <MenuItem value="bubble">Bubble Sort</MenuItem>
                                    <MenuItem value="insertion">Insertion Sort</MenuItem>
                                    <MenuItem value="selection">Selection Sort</MenuItem>
                                    <MenuItem value="merge">Merge Sort</MenuItem>
                                    <MenuItem value="quick">Quick Sort</MenuItem>
                                    <MenuItem value="heap">Heap Sort</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Array Size */}
                        <Grid item xs={12} md={3}>
                            <Box>
                                <Typography variant="subtitle2" className="text-slate-300 mb-2">
                                    Array Size: {n}
                                </Typography>
                                <Slider
                                    value={n}
                                    min={5}
                                    max={100}
                                    step={2}
                                    onChange={(_, v) => setN(v)}
                                    size="medium"
                                    sx={{
                                        '& .MuiSlider-track': { backgroundColor: '#67e8f9' },
                                        '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' },
                                        '& .MuiSlider-rail': { backgroundColor: '#374151' }
                                    }}
                                />
                            </Box>
                        </Grid>

                        {/* Speed */}
                        <Grid item xs={12} md={3}>
                            <Box>
                                <Typography variant="subtitle2" className="text-slate-300 mb-2">
                                    Speed: {speed}x
                                </Typography>
                                <Slider
                                    value={speed}
                                    min={0.25}
                                    max={3}
                                    step={0.25}
                                    onChange={(_, v) => setSpeed(v)}
                                    size="medium"
                                    sx={{
                                        '& .MuiSlider-track': { backgroundColor: '#67e8f9' },
                                        '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' },
                                        '& .MuiSlider-rail': { backgroundColor: '#374151' }
                                    }}
                                />
                            </Box>
                        </Grid>

                        {/* Action Buttons */}
                        <Grid item xs={12} md={3}>
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="outlined"
                                    startIcon={<ShuffleRoundedIcon />}
                                    onClick={randomize}
                                    fullWidth
                                    sx={{
                                        borderColor: '#67e8f9',
                                        color: '#67e8f9',
                                        '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' }
                                    }}
                                >
                                    New Array
                                </Button>

                                <ButtonGroup variant="contained" fullWidth>
                                    {!running ? (
                                        <Button
                                            onClick={run}
                                            startIcon={<PlayArrowRoundedIcon />}
                                            sx={{
                                                backgroundColor: '#059669',
                                                '&:hover': { backgroundColor: '#047857' }
                                            }}
                                        >
                                            Run
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={pause}
                                            startIcon={<PauseRoundedIcon />}
                                            sx={{
                                                backgroundColor: '#dc2626',
                                                '&:hover': { backgroundColor: '#b91c1c' }
                                            }}
                                        >
                                            Pause
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => applyOneStep()}
                                        startIcon={<SkipNextRoundedIcon />}
                                        sx={{
                                            backgroundColor: '#7c3aed',
                                            '&:hover': { backgroundColor: '#6d28d9' }
                                        }}
                                    >
                                        Step
                                    </Button>
                                    <Button
                                        onClick={reset}
                                        startIcon={<RestartAltRoundedIcon />}
                                        sx={{
                                            backgroundColor: '#374151',
                                            '&:hover': { backgroundColor: '#1f2937' }
                                        }}
                                    >
                                        Reset
                                    </Button>
                                </ButtonGroup>
                            </div>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Visualizer */}
            <BarViz array={array} highlights={high} placedSet={placed} />

            {/* Metrics */}
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
                                <Typography variant="body2" className="text-slate-400">
                                    Comparisons
                                </Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <div className="text-center p-4 bg-slate-800 rounded-lg">
                                <Typography variant="h4" className="!font-bold text-red-400">
                                    {metrics.writes}
                                </Typography>
                                <Typography variant="body2" className="text-slate-400">
                                    Swaps/Writes
                                </Typography>

                            </div>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <div className="text-center p-4 bg-slate-800 rounded-lg">
                                <Typography variant="h4" className="!font-bold text-sky-400">
                                    {fmtMs(metrics.timeMs)}
                                </Typography>
                                <Typography variant="body2" className="text-slate-400">
                                    Build Time
                                </Typography>
                            </div>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <div className="text-center p-4 bg-slate-800 rounded-lg">
                                <Typography variant="h4" className="!font-bold text-emerald-400">
                                    {array.length}
                                </Typography>
                                <Typography variant="body2" className="text-slate-400">
                                    Array Size
                                </Typography>
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
        </div>
    )
}
