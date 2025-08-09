// src/pages/Sorting.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { EMITTERS } from '../lib/sortEmitters'
import SortHeader from '../components/sorting/SortHeader'
import SortControls from '../components/sorting/SortControls'
import BarViz from '../components/sorting/BarViz'
import SortMetrics from '../components/sorting/SortMetrics'

/* tiny utils kept local to preserve URL behavior */
function mulberry32(seed) { let t = seed >>> 0; return function () { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296 } }
function hashSeed(...vals) { let h = 2166136261; for (const ch of vals.join('|')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
const getParam = (k, f) => new URLSearchParams(location.search).get(k) ?? f
function setParams(obj) { const sp = new URLSearchParams(location.search); Object.entries(obj).forEach(([k, v]) => sp.set(k, String(v))); history.replaceState(null, '', `?${sp.toString()}`) }

export default function Sorting() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    const [algo, setAlgo] = useState(getParam('algo', 'bubble'))
    const [n, setN] = useState(Number(getParam('n', 8)))
    const [speed, setSpeed] = useState(Number(getParam('speed', 1)))
    const [seed, setSeed] = useState(Number(getParam('seed', 7)))

    const baseArray = useMemo(() => {
        const rng = mulberry32(hashSeed('arr', seed, n))
        return Array.from({ length: n }, () => Math.floor(rng() * 95) + 5)
    }, [n, seed])

    const [array, setArray] = useState(baseArray)
    const [running, setRunning] = useState(false)
    const stepsRef = useRef({ list: [], cursor: 0, metrics: { comparisons: 0, writes: 0, timeMs: 0 } })
    const [high, setHigh] = useState({ compare: new Set(), swap: new Set(), overwrite: new Set() })
    const [placed, setPlaced] = useState(new Set())
    const [metrics, setMetrics] = useState({ comparisons: 0, writes: 0, timeMs: 0 })

    useEffect(() => { setParams({ algo, n, speed, seed }) }, [algo, n, speed, seed])

    useEffect(() => {
        setArray(baseArray)
        setHigh({ compare: new Set(), swap: new Set(), overwrite: new Set() })
        setPlaced(new Set())
        stepsRef.current = { list: [], cursor: 0, metrics: { comparisons: 0, writes: 0, timeMs: 0 } }
        setMetrics({ comparisons: 0, writes: 0, timeMs: 0 })
        setRunning(false)
    }, [baseArray, algo])

    function buildSteps() {
        const emitter = EMITTERS[algo]?.fn || EMITTERS.bubble.fn
        const t0 = performance.now()
        const { steps, metrics: m } = emitter(baseArray)
        const timeMs = performance.now() - t0
        stepsRef.current = { list: steps, cursor: 0, metrics: { ...m, timeMs } }
        setMetrics({ ...m, timeMs })
    }

    function run() { if (stepsRef.current.list.length === 0) buildSteps(); setRunning(true) }
    function pause() { setRunning(false) }
    function reset() {
        setRunning(false)
        setArray(baseArray)
        setHigh({ compare: new Set(), swap: new Set(), overwrite: new Set() })
        setPlaced(new Set())
        stepsRef.current = { list: [], cursor: 0, metrics: { comparisons: 0, writes: 0, timeMs: 0 } }
        setMetrics({ comparisons: 0, writes: 0, timeMs: 0 })
    }
    function randomize() { setSeed(Math.floor(Math.random() * 1e9)); setMetrics({ comparisons: 0, writes: 0, timeMs: 0 }) }

    function applyOneStep() {
        const data = stepsRef.current
        if (!data.list.length) buildSteps()
        const step = data.list[data.cursor]
        if (!step) { setRunning(false); return }
        const nextHigh = { compare: new Set(), swap: new Set(), overwrite: new Set() }
        if (step.type === 'compare') { nextHigh.compare.add(step.i); nextHigh.compare.add(step.j) }
        else if (step.type === 'swap') { nextHigh.swap.add(step.i); nextHigh.swap.add(step.j) }
        else if (step.type === 'overwrite') { nextHigh.overwrite.add(step.i) }
        setHigh(nextHigh)

        setArray(prev => {
            const a = prev.slice()
            if (step.type === 'swap') { ;[a[step.i], a[step.j]] = [a[step.j], a[step.i]] }
            else if (step.type === 'overwrite') { a[step.i] = step.value }
            return a
        })
        setPlaced(prev => {
            if (step.type !== 'placed') return prev
            const ns = new Set(prev); ns.add(step.i); return ns
        })
        stepsRef.current.cursor++
    }

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
            <SortHeader currentAlgo={currentAlgo} />
            <SortControls
                algo={algo} setAlgo={setAlgo}
                n={n} setN={setN}
                speed={speed} setSpeed={setSpeed}
                running={running}
                run={run} pause={pause}
                applyOneStep={applyOneStep}
                reset={reset} randomize={randomize}
            />
            <BarViz
                array={array}
                highlights={high}
                placedSet={placed}
                running={running}
                onRun={run}
                onPause={pause}
                onStep={applyOneStep}
                onReset={reset}
            />

            <SortMetrics metrics={metrics} arrayLength={array.length} fmtMs={fmtMs} algoKey={currentAlgo} />
        </div>
    )
}
