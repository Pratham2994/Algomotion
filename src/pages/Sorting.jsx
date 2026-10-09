import { useEffect, useMemo, useState } from 'react'
import { EMITTERS } from '../lib/sortEmitters'
import { hashSeed, mulberry32 } from '../lib/pathCore'
import { numberParam, param, writeParams } from '../lib/url'
import { usePlayer } from '../hooks/usePlayer'
import { useSEO } from '../hooks/useSEO'
import Transport from '../components/Transport'

const KINDS = {
  random: 'Random',
  nearly: 'Nearly sorted',
  reversed: 'Reversed',
  few: 'Few values',
}

/** The same seed, size and kind always give the same list. */
function makeList(n, seed, kind) {
  const rng = mulberry32(hashSeed('arr', seed, n))
  const list = Array.from({ length: n }, () => Math.floor(rng() * 95) + 5)
  if (kind === 'reversed') return list.sort((a, b) => b - a)
  if (kind === 'few') {
    const values = [20, 45, 70, 95]
    return list.map((v) => values[v % values.length])
  }
  if (kind === 'nearly') {
    list.sort((a, b) => a - b)
    // A few neighbours change places, so it is close to sorted but not there
    for (let k = 0; k < Math.max(1, Math.floor(n / 10)); k++) {
      const i = Math.floor(rng() * (n - 1))
      ;[list[i], list[i + 1]] = [list[i + 1], list[i]]
    }
  }
  return list
}

/** Plays the recording up to `cursor` on a copy of the list, and says what the last step did. */
function frameAt(base, steps, cursor) {
  const list = base.slice()
  const placed = new Set()
  let comparisons = 0
  let writes = 0
  for (let k = 0; k < cursor; k++) {
    const s = steps[k]
    if (s.type === 'compare') comparisons++
    else if (s.type === 'swap') {
      ;[list[s.i], list[s.j]] = [list[s.j], list[s.i]]
      writes++
    } else if (s.type === 'overwrite') {
      list[s.i] = s.value
      writes++
    } else if (s.type === 'placed') placed.add(s.i)
  }
  const last = cursor > 0 ? steps[cursor - 1] : null
  let says = 'Press play, or step through it one move at a time.'
  if (cursor >= steps.length && steps.length) says = 'Sorted.'
  else if (last?.type === 'compare') {
    says = last.j >= 0 ? `Compare ${list[last.i]} and ${list[last.j]}.` : `Look at ${list[last.i]}.`
  } else if (last?.type === 'swap') says = `Swap ${list[last.j]} and ${list[last.i]}.`
  else if (last?.type === 'overwrite') says = `Write ${last.value} into place ${last.i + 1}.`
  else if (last?.type === 'placed') says = `Place ${last.i + 1} is final.`
  return { list, placed, comparisons, writes, last, says }
}

function Stage({ base, steps, speed, setSpeed }) {
  // One run takes about 20 seconds at 1×, for a short list and for a long one
  const player = usePlayer(steps.length, Math.max(6, steps.length / 20) * speed, steps)
  const frame = useMemo(() => frameAt(base, steps, player.cursor), [base, steps, player.cursor])
  const active = player.done ? null : frame.last
  const most = Math.max(...base)

  return (
    <section className="stage">
      <div className="bars" data-many={base.length > 40 || undefined} role="img" aria-label={`The list: ${frame.list.join(', ')}`}>
        {frame.list.map((value, i) => {
          const touched = active && (i === active.i || i === active.j)
          const state = touched ? active.type : frame.placed.has(i) ? 'placed' : undefined
          return (
            <i key={i} data-state={state} style={{ height: `${(value / most) * 100}%` }}>
              {base.length <= 24 && <span>{value}</span>}
            </i>
          )
        })}
      </div>
      <p className="says" data-says aria-live="off">
        {frame.says}
      </p>
      <Transport player={player} speed={speed} setSpeed={setSpeed} />
      <dl className="counters">
        <div>
          <dt>Comparisons</dt>
          <dd data-compares>{frame.comparisons.toLocaleString('en')}</dd>
        </div>
        <div>
          <dt>Writes</dt>
          <dd data-writes>{frame.writes.toLocaleString('en')}</dd>
        </div>
        <div className="legend">
          <span data-state="compare">compare</span>
          <span data-state="swap">swap</span>
          <span data-state="overwrite">write</span>
          <span data-state="placed">final</span>
        </div>
      </dl>
    </section>
  )
}

export default function Sorting() {
  useSEO({
    title: 'Sorting - Algomotion',
    description: 'Eleven sorting algorithms, recorded and played back one move at a time. Step forwards, step back, and compare them on the same list.',
  })

  const [algo, setAlgo] = useState(() => (EMITTERS[param('algo', 'bubble')] ? param('algo', 'bubble') : 'bubble'))
  const [n, setN] = useState(() => numberParam('n', 16, 5, 100))
  const [seed, setSeed] = useState(() => numberParam('seed', 7, 1, 1e9))
  const [kind, setKind] = useState(() => (KINDS[param('kind', 'random')] ? param('kind', 'random') : 'random'))
  const [speed, setSpeed] = useState(() => numberParam('speed', 1, 0.25, 8))

  useEffect(() => writeParams({ algo, n, seed, kind, speed }), [algo, n, seed, kind, speed])

  const base = useMemo(() => makeList(n, seed, kind), [n, seed, kind])
  // The algorithm runs to the end here, at full speed. Everything on screen is the recording.
  const run = useMemo(() => EMITTERS[algo].fn(base), [algo, base])

  // All eleven on this same list. They are fast, so there is no reason not to.
  const board = useMemo(
    () =>
      Object.entries(EMITTERS)
        .map(([key, entry]) => ({ key, ...entry, ...entry.fn(base).metrics }))
        .sort((a, b) => a.comparisons + a.writes - (b.comparisons + b.writes)),
    [base],
  )
  const most = Math.max(1, ...board.map((row) => row.comparisons + row.writes))
  const current = EMITTERS[algo]

  return (
    <div className="arena">
      <div className="lead">
        <p className="eyebrow">Sorting</p>
        <h1>
          {current.label} <small>{current.bigO}</small>
        </h1>
        <p className="lede">{current.description}</p>
      </div>

      <Stage base={base} steps={run.steps} speed={speed} setSpeed={setSpeed} />

      <aside className="panel">
        <h2>The list</h2>
        <label className="field">
          <span>
            Size <b>{n}</b>
          </span>
          <input type="range" min="5" max="100" value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <div className="chips" role="group" aria-label="Kind of list">
          {Object.entries(KINDS).map(([key, label]) => (
            <button key={key} type="button" aria-pressed={kind === key} onClick={() => setKind(key)}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setSeed(Math.floor(Math.random() * 1e9) + 1)}>
          New list
        </button>
        <p className="hint">Space plays. The arrow keys step. The address bar keeps this exact list, so you can share it.</p>
      </aside>

      <section className="board">
        <h2>All eleven, on this list</h2>
        <p className="hint">Each one has already run. Pick a row to watch it.</p>
        <table>
          <thead>
            <tr>
              <th>Algorithm</th>
              <th className="num">Comparisons</th>
              <th className="num">Writes</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {board.map((row) => (
              <tr key={row.key} aria-selected={row.key === algo}>
                <td>
                  <button type="button" className="link" onClick={() => setAlgo(row.key)}>
                    {row.label}
                  </button>
                  <small>{row.bigO}</small>
                </td>
                <td className="num">{row.comparisons.toLocaleString('en')}</td>
                <td className="num">{row.writes.toLocaleString('en')}</td>
                <td className="meter">
                  <i style={{ '--share': (row.comparisons + row.writes) / most }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">Counting and Radix compare nothing. They sort by counting digits, so their work is all writes.</p>
      </section>
    </div>
  )
}
