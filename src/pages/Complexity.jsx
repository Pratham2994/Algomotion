import { useEffect, useMemo, useRef, useState, startTransition } from 'react'
import CompHeader from '../components/complexity/CompHeader'
import CompControls from '../components/complexity/CompControls'
import CompChart from '../components/complexity/CompChart'
import {
  makeArray, median, SORTERS, O_CURVES, COLORS
} from '../lib/benchCore'

export default function Complexity() {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  // Controls
  const [algos, setAlgos] = useState(['merge', 'quick', 'heap'])
  const [metric, setMetric] = useState('comparisons')
  const [generator, setGenerator] = useState('random')
  const [minN, setMinN] = useState(16)
  const [maxN, setMaxN] = useState(2048)
  const [points, setPoints] = useState(3)
  const [trials, setTrials] = useState(3)
  const [seed, setSeed] = useState(7)
  const [overlays, setOverlays] = useState(['n', 'n log n', 'n²'])
  const [logScale, setLogScale] = useState(true)

  // Run state
  const [running, setRunning] = useState(false)
  const [data, setData] = useState([])
  const abortRef = useRef({ abort: false })

  const sizeList = useMemo(() => {
    const xs = []
    const ratio = Math.pow(maxN / minN, 1 / Math.max(1, (points - 1)))
    let v = minN
    for (let i = 0; i < points; i++) { xs.push(Math.round(v)); v *= ratio }
    return Array.from(new Set(xs)).sort((a, b) => a - b)
  }, [minN, maxN, points])

  function toCSV(rows) {
    const headers = ['n', ...algos.map(k => `${SORTERS[k].label} (${metric})`)]
    const lines = [headers.join(',')]
    for (const row of rows) { lines.push([row.n, ...algos.map(k => row[k] ?? '')].join(',')) }
    return lines.join('\n')
  }

  async function runSweep() {
    setRunning(true); abortRef.current.abort = false
    const rows = []
    let buffer = []



    for (const n of sizeList) {
      if (abortRef.current.abort) break
      const BATCH = n > 2000 ? 5 : 1;

      const row = { n }
      

      for (const key of algos) {
        if (abortRef.current.abort) break
        const fn = SORTERS[key].fn
        const ts = [], cs = [], ws = []

        // dynamic trials: auto-throttle + hard fast-mode when n > 15k
        const trialsAuto = Math.max(1, Math.round(trials * Math.min(1, 20000 / n)));
        const trialsForN = n > 10000 ? 2 : trialsAuto;

        const sliceStart = performance.now()
        for (let t = 0; t < trialsForN; t++) {
          const arr = makeArray(n, generator, seed + t * 101 + n * 17)
          const t0 = performance.now()
          const { comparisons, writes } = fn(arr)
          const dt = performance.now() - t0
          ts.push(dt); cs.push(comparisons); ws.push(writes)

          if (performance.now() - sliceStart > 12) {
            await new Promise(r => setTimeout(r, 0))
          }
        }

        row[key] = metric === 'runtime' ? median(ts)
          : metric === 'comparisons' ? median(cs)
            : median(ws)
      }


      rows.push(row)
      buffer.push(row)

      // flush in batches to reduce renders
      if (buffer.length >= BATCH) {
        const toAppend = buffer; buffer = []
        startTransition(() => {
          setData(prev => [...prev, ...toAppend])
        })
        await new Promise(r => setTimeout(r, 0)) // let UI breathe
      }
    }

    // final flush
    if (buffer.length) {
      const toAppend = buffer
      startTransition(() => {
        setData(prev => [...prev, ...toAppend])
      })
    }

    setRunning(false)
  }


  const onRun = () => { setData([]); runSweep().catch(() => setRunning(false)) }
  const onPause = () => { abortRef.current.abort = true; setRunning(false) }
  const onReset = () => { abortRef.current.abort = true; setRunning(false); setData([]) }
  const onExport = () => {
    const blob = new Blob([toCSV(data)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `complexity_${metric}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const overlaySeries = useMemo(() => {
    if (!data.length) return []
    const n0 = data[0].n
    const y0 = data[0][algos[0]] || 1
    return overlays.map(name => {
      const f = O_CURVES[name]; const k = y0 / f(n0)
      return { name, color: COLORS[name], points: data.map(d => ({ n: d.n, y: k * f(d.n) })) }
    })
  }, [data, algos, overlays])

  const yDomain = useMemo(() => {
    if (!data.length) return ['auto', 'auto']
    let min = Infinity, max = -Infinity
    for (const row of data) {
      for (const a of algos) {
        const y = row[a]; if (y == null) continue
        if (y < min) min = y; if (y > max) max = y
      }
    }
    for (const s of overlaySeries) {
      for (const p of s.points) { if (p.y < min) min = p.y; if (p.y > max) max = p.y }
    }
    if (!isFinite(min) || !isFinite(max)) return ['auto', 'auto']
    if (min === max) { max = min + 1 }
    return [logScale ? Math.max(0.1, min * 0.8) : 0, max * 1.2]
  }, [data, algos, overlaySeries, logScale])

  const metricLabel = metric === 'runtime' ? 'Runtime (ms)'
    : metric === 'comparisons' ? 'Comparisons'
      : 'Writes'

  // NEW: sweep progress + “try log scale” hint + compact winner summary
  const totalSizes = sizeList.length
  const progress = useMemo(
    () => (totalSizes ? (data.length / totalSizes) * 100 : 0),
    [data.length, totalSizes]
  )

  const needLogHint = useMemo(() => {
    if (!data.length || logScale) return false
    let min = Infinity, max = -Infinity
    for (const row of data) {
      for (const a of algos) {
        const y = row[a]; if (typeof y !== 'number') continue
        if (y < min) min = y; if (y > max) max = y
      }
    }
    return isFinite(min) && isFinite(max) && max / Math.max(min, 0.0001) > 50
  }, [data, algos, logScale])

  const summaryAtMax = useMemo(() => {
    if (!data.length) return ''
    const last = data[data.length - 1]
    const pairs = algos
      .map(a => ({ k: a, v: last[a] }))
      .filter(p => typeof p.v === 'number')
      .sort((x, y) => x.v - y.v)
    if (!pairs.length) return ''
    const best = pairs[0].v
    return `Best at n=${last.n}: ` + pairs
      .map(p => `${SORTERS[p.k].label} (${(p.v / best).toFixed(1)}×)`)
      .join(' • ')
  }, [data, algos])

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      <CompHeader />

      <CompControls
        algos={algos} setAlgos={setAlgos}
        metric={metric} setMetric={setMetric}
        generator={generator} setGenerator={setGenerator}
        minN={minN} setMinN={setMinN}
        maxN={maxN} setMaxN={setMaxN}
        points={points} setPoints={setPoints}
        trials={trials} setTrials={setTrials}
        seed={seed} setSeed={setSeed}
        overlays={overlays} setOverlays={setOverlays}
        logScale={logScale} setLogScale={setLogScale}
        running={running}
        onRun={onRun} onPause={onPause} onReset={onReset} onExport={onExport}
      />

      {/* sweep progress + gentle hint */}
      {running && totalSizes > 0 && (
        <div className="mt-2">
          <div className="h-1 rounded bg-slate-800 overflow-hidden">
            <div
              className="h-1 bg-cyan-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sweeping sizes: {data.length} / {totalSizes}
          </p>
        </div>
      )}
      {!running && needLogHint && (
        <p className="text-xs text-slate-400 -mt-1">
          Tip: lines diverge a lot — try <strong>Log scale</strong> for clearer growth comparison.
        </p>
      )}

      <CompChart
        data={data}
        algos={algos}
        overlaySeries={overlaySeries}
        yDomain={yDomain}
        metricLabel={metricLabel}
        logScale={logScale}
        onRun={onRun}
        onReset={onReset}
      />

    </div>
  )
}
