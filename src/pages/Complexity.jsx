import { useMemo, useRef, useState } from 'react'
import { COLORS, O_CURVES, SORTERS, makeArray, median } from '../lib/benchCore'
import { useSEO } from '../hooks/useSEO'

const METRICS = { comparisons: 'Comparisons', writes: 'Writes', runtime: 'Time in ms' }
const KINDS = { random: 'Random', nearly: 'Nearly sorted', reversed: 'Reversed', fewunique: 'Few values' }
const W = 720
const H = 380
const PAD = { left: 64, right: 16, top: 16, bottom: 40 }

const short = (n) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}k` : `${+n.toFixed(n < 10 ? 2 : 0)}`)

/** A line chart drawn by hand: sizes across, work up, on plain or log axes. */
function Chart({ rows, algos, overlays, log }) {
  const all = [...rows.flatMap((row) => algos.map((a) => row[a])), ...overlays.flatMap((o) => o.points.map((p) => p.y))].filter((v) => v > 0)
  if (!rows.length || !all.length) return <p className="hint chart-empty">Press run. The algorithms sort bigger and bigger lists, and each dot is the work one of them did.</p>

  const scale = (v) => (log ? Math.log10(Math.max(v, 1e-6)) : v)
  const x0 = scale(rows[0].n)
  const x1 = scale(rows[rows.length - 1].n)
  const y0 = log ? scale(Math.min(...all)) : 0
  const y1 = scale(Math.max(...all))
  const x = (n) => PAD.left + ((scale(n) - x0) / (x1 - x0 || 1)) * (W - PAD.left - PAD.right)
  const y = (v) => H - PAD.bottom - ((scale(Math.max(v, 1e-6)) - y0) / (y1 - y0 || 1)) * (H - PAD.top - PAD.bottom)
  const line = (points) => points.map((p, i) => `${i ? 'L' : 'M'}${x(p.n).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ')
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => (log ? Math.pow(10, y0 + t * (y1 - y0)) : t * Math.max(...all)))

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Work against list size">
      {ticks.map((t) => (
        <g key={t}>
          <line className="rule" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
          <text className="tick" x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">
            {short(t)}
          </text>
        </g>
      ))}
      {rows.map((row) => (
        <text key={row.n} className="tick" x={x(row.n)} y={H - PAD.bottom + 18} textAnchor="middle">
          {short(row.n)}
        </text>
      ))}
      {overlays.map((o) => (
        <path key={o.name} className="theory" d={line(o.points)} />
      ))}
      {overlays.map((o) => {
        const end = o.points[o.points.length - 1]
        return (
          <text key={o.name} className="tick" x={x(end.n) - 6} y={y(end.y) - 6} textAnchor="end">
            {o.name}
          </text>
        )
      })}
      {algos.map((a) => {
        const points = rows.filter((row) => row[a] > 0).map((row) => ({ n: row.n, y: row[a] }))
        return (
          <g key={a} style={{ color: COLORS[a] }}>
            <path className="measured" d={line(points)} />
            {points.map((p) => (
              <circle key={p.n} cx={x(p.n)} cy={y(p.y)} r="3.5">
                <title>{`${SORTERS[a].label}, n = ${p.n}: ${short(p.y)}`}</title>
              </circle>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

export default function Complexity() {
  useSEO({
    title: 'Complexity - Algomotion',
    description: 'Count the comparisons and writes of six sorting algorithms on bigger and bigger lists, and set the result against the Big-O curves.',
  })

  const [algos, setAlgos] = useState(['merge', 'quick', 'heap'])
  const [metric, setMetric] = useState('comparisons')
  const [generator, setGenerator] = useState('random')
  const [minN, setMinN] = useState(16)
  const [maxN, setMaxN] = useState(2048)
  const [points, setPoints] = useState(8)
  const [trials, setTrials] = useState(3)
  const [seed, setSeed] = useState(7)
  const [overlays, setOverlays] = useState(['n log n', 'n²'])
  const [log, setLog] = useState(true)
  const [running, setRunning] = useState(false)
  const [data, setData] = useState([])
  const stop = useRef(false)

  // Sizes spread evenly on a log scale between the smallest and the biggest
  const sizes = useMemo(() => {
    const lo = Math.max(2, Math.min(minN, maxN))
    const hi = Math.max(lo, maxN)
    const ratio = Math.pow(hi / lo, 1 / Math.max(1, points - 1))
    return [...new Set(Array.from({ length: points }, (_, i) => Math.round(lo * Math.pow(ratio, i))))].sort((a, b) => a - b)
  }, [minN, maxN, points])

  async function run() {
    stop.current = false
    setRunning(true)
    setData([])
    for (const n of sizes) {
      if (stop.current) break
      const row = { n }
      for (const key of algos) {
        const times = []
        const compares = []
        const writes = []
        // Fewer tries on very long lists, so the page stays alive
        const tries = n > 10000 ? Math.min(2, trials) : Math.max(1, Math.round(trials * Math.min(1, 20000 / n)))
        for (let t = 0; t < tries && !stop.current; t++) {
          const list = makeArray(n, generator, seed + t * 101 + n * 17)
          const t0 = performance.now()
          const result = SORTERS[key].fn(list)
          times.push(performance.now() - t0)
          compares.push(result.comparisons)
          writes.push(result.writes)
          // Let the browser draw between tries
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
        row[key] = median(metric === 'runtime' ? times : metric === 'comparisons' ? compares : writes)
      }
      if (!stop.current) setData((rows) => [...rows, row])
    }
    setRunning(false)
  }

  // Each theory curve is pinned to the first measured dot, so only its shape is compared
  const curves = useMemo(() => {
    const first = data[0]
    const anchor = first && algos.map((a) => first[a]).find((v) => v > 0)
    if (!anchor) return []
    return overlays.map((name) => {
      const f = O_CURVES[name]
      return { name, points: data.map((row) => ({ n: row.n, y: (anchor / f(first.n)) * f(row.n) })) }
    })
  }, [data, algos, overlays])

  const exportCsv = () => {
    const lines = [['n', ...algos.map((a) => `${SORTERS[a].label} (${metric})`)].join(',')]
    for (const row of data) lines.push([row.n, ...algos.map((a) => row[a] ?? '')].join(','))
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `complexity_${metric}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const flip = (list, set, value) => set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  const number = (set, min, max) => (e) => set(Math.min(max, Math.max(min, Number(e.target.value) || min)))

  return (
    <div className="arena">
      <div className="lead">
        <p className="eyebrow">Complexity</p>
        <h1>Where Big-O comes from</h1>
        <p className="lede">
          Nobody has to take O(n log n) on trust. Count the work on a list of 16, then 32, then 64, and draw the dots.
          The curve from the textbook is the dashed line under them.
        </p>
      </div>

      <section className="stage">
        <Chart rows={data} algos={algos} overlays={curves} log={log} />
        <div className="transport">
          <div className="keys">
            {running ? (
              <button type="button" className="solid" onClick={() => (stop.current = true)}>
                <span>Stop</span>
              </button>
            ) : (
              <button type="button" className="solid" onClick={run} disabled={!algos.length}>
                <span>Run</span>
              </button>
            )}
            <button type="button" onClick={exportCsv} disabled={!data.length || running}>
              <span>Save as CSV</span>
            </button>
          </div>
          <span className="where">
            {data.length} of {sizes.length} sizes
          </span>
          <label className="check">
            <input type="checkbox" checked={log} onChange={(e) => setLog(e.target.checked)} />
            Log axes
          </label>
        </div>
        <div className="legend lines">
          {algos.map((a) => (
            <span key={a} style={{ '--swatch': COLORS[a] }}>
              {SORTERS[a].label} <small>{SORTERS[a].bigO}</small>
            </span>
          ))}
        </div>
        <p className="hint">
          On log axes a straight line means a power of n, and its slope is the power. n² climbs twice as steeply as n.
        </p>
      </section>

      <aside className="panel">
        <h2>What to measure</h2>
        <div className="chips" role="group" aria-label="Algorithms">
          {Object.entries(SORTERS).map(([key, s]) => (
            <button key={key} type="button" aria-pressed={algos.includes(key)} onClick={() => flip(algos, setAlgos, key)} disabled={running}>
              {s.label}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Count</span>
          <select value={metric} onChange={(e) => setMetric(e.target.value)} disabled={running}>
            {Object.entries(METRICS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Kind of list</span>
          <select value={generator} onChange={(e) => setGenerator(e.target.value)} disabled={running}>
            {Object.entries(KINDS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="pair">
          <label className="field">
            <span>Smallest list</span>
            <input type="number" value={minN} onChange={number(setMinN, 2, 100000)} disabled={running} />
          </label>
          <label className="field">
            <span>Biggest list</span>
            <input type="number" value={maxN} onChange={number(setMaxN, 2, 200000)} disabled={running} />
          </label>
          <label className="field">
            <span>Sizes</span>
            <input type="number" value={points} onChange={number(setPoints, 2, 20)} disabled={running} />
          </label>
          <label className="field">
            <span>Tries each</span>
            <input type="number" value={trials} onChange={number(setTrials, 1, 15)} disabled={running} />
          </label>
          <label className="field">
            <span>Seed</span>
            <input type="number" value={seed} onChange={number(setSeed, 1, 1e9)} disabled={running} />
          </label>
        </div>
        <h2>Textbook curves</h2>
        <div className="chips" role="group" aria-label="Textbook curves">
          {Object.keys(O_CURVES).map((name) => (
            <button key={name} type="button" aria-pressed={overlays.includes(name)} onClick={() => flip(overlays, setOverlays, name)}>
              {name}
            </button>
          ))}
        </div>
        <p className="hint">
          The middle value of the tries is kept. Counts are exact and the same on every machine. Time is not, so count
          comparisons if you want a clean curve.
        </p>
      </aside>
    </div>
  )
}
