import { useEffect, useMemo, useRef, useState } from 'react'
import GridViz from '../components/pathfinding/GridViz'
import PathHeader from '../components/pathfinding/PathHeader'
import PathControls from '../components/pathfinding/PathControls'
import PathMetrics from '../components/pathfinding/PathMetrics'
import {
  ALGOS, buildMaze, buildOpenGrid, buildWeights,
  DIRS4, DIRS8, makeRng
} from '../lib/pathCore'

const getParamRaw = (k) => new URLSearchParams(location.search).get(k)
const getParam = (k, fallback) => getParamRaw(k) ?? fallback
const setParams = (obj) => {
  const sp = new URLSearchParams(location.search)
  Object.entries(obj).forEach(([k, v]) => sp.set(k, String(v)))
  const next = `?${sp.toString()}`
  if (next !== location.search) history.replaceState(null, '', next) 
}

export default function Pathfinding() {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const [mode, setMode] = useState(getParam('mode', 'maze'))
  const [obst, setObst] = useState(Math.min(Math.max(parseFloat(getParamRaw('obst')) || 0.0, 0), 1))
  const [algo, setAlgo] = useState(getParam('algo', 'bfs'))
  const [rows, setRows] = useState(Math.min(Math.max(parseInt(getParamRaw('rows') || '21', 10), 5), 50))
  const [cols, setCols] = useState(Math.min(Math.max(parseInt(getParamRaw('cols') || '35', 10), 5), 50))
  const [braid, setBraid] = useState(Math.min(Math.max(parseFloat(getParamRaw('braid')) || 0.15, 0), 1))
  const [seed, setSeed] = useState(parseInt(getParamRaw('seed') || '7', 10))
  const [speed, setSpeed] = useState(Math.min(Math.max(parseFloat(getParamRaw('speed') || '1'), 0.1), 5))

  const [diagonals, setDiagonals] = useState((getParamRaw('diag') ?? '0') === '1')
  const [weighted, setWeighted] = useState((getParamRaw('w') ?? '0') === '1')
  const [randomTies, setRandomTies] = useState((getParamRaw('rt') ?? '1') === '1')
  const [astarHeur, setAstarHeur] = useState(getParam('heur', 'manhattan'))

  const maze = useMemo(() => buildMaze(rows, cols, seed, braid), [rows, cols, seed, braid])
  const open = useMemo(() => buildOpenGrid(rows, cols, seed, obst), [rows, cols, seed, obst])
  const gridBase = mode === 'maze' ? maze : open
  const weights = useMemo(() => buildWeights(gridBase, seed, weighted), [gridBase, seed, weighted])

  const [grid, setGrid] = useState(maze)
  const [start, setStart] = useState({
    r: Math.min(Math.max(parseInt(getParamRaw('sr') ?? '1', 10), 1), rows - 2),
    c: Math.min(Math.max(parseInt(getParamRaw('sc') ?? '1', 10), 1), cols - 2)
  })
  const [goal, setGoal] = useState({
    r: Math.min(Math.max(parseInt(getParamRaw('gr') ?? String(rows - 2), 10), 1), rows - 2),
    c: Math.min(Math.max(parseInt(getParamRaw('gc') ?? String(cols - 2), 10), 1), cols - 2)
  })

  const [running, setRunning] = useState(false)
  const stepsRef = useRef({ list: [], cursor: 0, metrics: { visited: 0, pathLen: 0, timeMs: 0 } })
  const [high, setHigh] = useState({ frontier: new Set(), visit: new Set(), path: new Set() })
  const [metrics, setMetrics] = useState({ visited: 0, pathLen: 0, timeMs: 0 })
  const [noPath, setNoPath] = useState(false)

  useEffect(() => {
    setGrid(gridBase)
    setStart(prev => ({ r: Math.min(Math.max(1, prev.r), rows - 2), c: Math.min(Math.max(1, prev.c), cols - 2) }))
    setGoal(prev => ({ r: Math.min(Math.max(1, prev.r), rows - 2), c: Math.min(Math.max(1, prev.c), cols - 2) }))
    stepsRef.current = { list: [], cursor: 0, metrics: { visited: 0, pathLen: 0, timeMs: 0 } }
    setHigh({ frontier: new Set(), visit: new Set(), path: new Set() })
    setMetrics({ visited: 0, pathLen: 0, timeMs: 0 })
    setNoPath(false)
    setRunning(false)
  }, [gridBase, rows, cols, mode])

  useEffect(() => {
    stepsRef.current = { list: [], cursor: 0, metrics: { visited: 0, pathLen: 0, timeMs: 0 } }
    setHigh({ frontier: new Set(), visit: new Set(), path: new Set() })
    setMetrics({ visited: 0, pathLen: 0, timeMs: 0 })
    setNoPath(false)
    setRunning(false)
  }, [algo, diagonals, weighted, randomTies, astarHeur])

  useEffect(() => {
    setParams({
      algo, mode,
      rows, cols, braid, obst,
      speed, seed,
      heur: astarHeur,
      diag: diagonals ? 1 : 0,
      w: weighted ? 1 : 0,
      rt: randomTies ? 1 : 0,
      sr: start.r, sc: start.c,
      gr: goal.r, gc: goal.c
    })
  }, [algo, mode, rows, cols, braid, obst, speed, seed, astarHeur, diagonals, weighted, randomTies, start, goal])

  useEffect(() => {
    stepsRef.current = { list: [], cursor: 0, metrics: { visited: 0, pathLen: 0, timeMs: 0 } }
    setHigh({ frontier: new Set(), visit: new Set(), path: new Set() })
    setMetrics({ visited: 0, pathLen: 0, timeMs: 0 })
    setNoPath(false)
    setRunning(false)
  }, [start, goal])

  function buildSteps() {
    const rng = makeRng(seed)
    const dirs = diagonals ? DIRS8 : DIRS4
    const opts = { dirs, rng: randomTies ? rng : null, randomTies, weights, heuristic: astarHeur }
    const t0 = performance.now()
    const { steps, metrics: m } = ALGOS[algo].fn(grid, start, goal, opts)
    const timeMs = performance.now() - t0
    stepsRef.current = { list: steps, cursor: 0, metrics: { ...m, timeMs } }
    setMetrics({ ...m, timeMs })
    const same = (start.r === goal.r && start.c === goal.c)
    setNoPath(!same && (m.pathLen === 0))
  }

  function run() { if (!stepsRef.current.list.length) buildSteps(); setRunning(true) }
  const pause = () => setRunning(false)
  function reset() {
    setRunning(false)
    setGrid(gridBase)
    stepsRef.current = { list: [], cursor: 0, metrics: { visited: 0, pathLen: 0, timeMs: 0 } }
    setHigh({ frontier: new Set(), visit: new Set(), path: new Set() })
    setMetrics({ visited: 0, pathLen: 0, timeMs: 0 })
    setNoPath(false)
  }
  function randomize() { setSeed((s) => (s * 9301 + 49297) % 233280 | 0) }

  function applyOneStep() {
    const data = stepsRef.current
    if (!data.list.length) { buildSteps(); return }
    const step = data.list[data.cursor]
    if (!step) { setRunning(false); return }
    const key = step.r + ',' + step.c
    setHigh(prev => {
      const next = { frontier: new Set(prev.frontier), visit: new Set(prev.visit), path: new Set(prev.path) }
      if (step.type === 'frontier') next.frontier.add(key)
      else if (step.type === 'visit') { next.frontier.delete(key); next.visit.add(key) }
      else if (step.type === 'path') next.path.add(key)
      return next
    })
    stepsRef.current.cursor++
  }

  useEffect(() => {
    if (!running) return
    let id
    const stepInterval = 120 / Math.max(0.25, speed)
    let last = performance.now(), acc = 0
    const tick = (now) => {
      acc += now - last; last = now
      while (acc >= stepInterval) {
        applyOneStep(); acc -= stepInterval
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
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <PathHeader current={current} />
      <PathControls
        algo={algo} setAlgo={setAlgo}
        mode={mode} setMode={setMode}
        obst={obst} setObst={setObst}
        braid={braid} setBraid={setBraid}
        rows={rows} setRows={setRows}
        cols={cols} setCols={setCols}
        speed={speed} setSpeed={setSpeed}
        astarHeur={astarHeur} setAstarHeur={setAstarHeur}
        diagonals={diagonals} setDiagonals={setDiagonals}
        weighted={weighted} setWeighted={setWeighted}
        randomTies={randomTies} setRandomTies={setRandomTies}
        running={running} run={run} pause={pause}
        applyOneStep={applyOneStep} reset={reset} randomize={randomize}
      />
      <GridViz
        grid={grid}
        start={start}
        goal={goal}
        setStart={setStart}
        setGoal={setGoal}
        highlights={high}
        weights={weights}
        noPath={noPath}
        running={running}
        run={run}
        pause={pause}
        applyOneStep={applyOneStep}
        reset={reset}
      />
      <PathMetrics metrics={metrics} rows={rows} cols={cols} fmtMs={fmtMs} />
    </div>
  )
}
