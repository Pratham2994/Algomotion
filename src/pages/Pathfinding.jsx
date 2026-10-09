import { useEffect, useMemo, useRef, useState } from 'react'
import { ALGOS, DIRS4, DIRS8, EMPTY, WALL, buildMaze, buildOpenGrid, buildWeights, makeRng } from '../lib/pathCore'
import { numberParam, param, writeParams } from '../lib/url'
import { usePlayer } from '../hooks/usePlayer'
import { useSEO } from '../hooks/useSEO'
import Transport from '../components/Transport'

const HEURISTICS = { manhattan: 'Manhattan', euclid: 'Euclidean', octile: 'Octile' }
// A cell during the search: untouched, waiting to be looked at, looked at, or on the way out
const FRONTIER = 1
const VISITED = 2
const PATH = 3

/** Plays the recording up to `cursor` and gives the state of every cell. */
function frameAt(steps, cursor, rows, cols) {
  const cells = new Uint8Array(rows * cols)
  let visited = 0
  let path = 0
  for (let k = 0; k < cursor; k++) {
    const s = steps[k]
    if (s.type === 'frontier') {
      if (!cells[s.r * cols + s.c]) cells[s.r * cols + s.c] = FRONTIER
    } else if (s.type === 'visit') {
      cells[s.r * cols + s.c] = VISITED
      visited++
    } else if (s.type === 'path') {
      cells[s.r * cols + s.c] = PATH
      path++
    }
  }
  return { cells, visited, path }
}

function Stage({ grid, weights, start, goal, steps, pathLen, speed, setSpeed, onPaint, onMove }) {
  const rows = grid.length
  const cols = grid[0].length
  const player = usePlayer(steps.length, Math.max(20, steps.length / 12) * speed, steps)
  const frame = useMemo(() => frameAt(steps, player.cursor, rows, cols), [steps, player.cursor, rows, cols])
  const drag = useRef(null)

  const cellAt = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el?.dataset.r) return null
    return { r: Number(el.dataset.r), c: Number(el.dataset.c) }
  }
  const down = (e) => {
    const cell = cellAt(e)
    if (!cell) return
    e.preventDefault()
    if (cell.r === start.r && cell.c === start.c) drag.current = 'start'
    else if (cell.r === goal.r && cell.c === goal.c) drag.current = 'goal'
    else {
      // The first cell decides: on a wall you erase, on a free cell you draw
      drag.current = grid[cell.r][cell.c] === WALL ? EMPTY : WALL
      onPaint(cell, drag.current)
    }
  }
  const move = (e) => {
    if (drag.current === null) return
    const cell = cellAt(e)
    if (!cell) return
    if (drag.current === 'start' || drag.current === 'goal') onMove(drag.current, cell)
    else onPaint(cell, drag.current)
  }
  const up = () => {
    drag.current = null
  }

  return (
    <section className="stage">
      <div
        className="grid"
        style={{ '--cols': cols }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        role="img"
        aria-label={`A ${rows} by ${cols} grid. ${frame.visited} cells looked at.`}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const state =
              r === start.r && c === start.c
                ? 'start'
                : r === goal.r && c === goal.c
                  ? 'goal'
                  : cell === WALL
                    ? 'wall'
                    : ['', 'frontier', 'visited', 'path'][frame.cells[r * cols + c]] || undefined
            return <i key={r * cols + c} data-r={r} data-c={c} data-state={state} data-weight={weights && cell !== WALL ? weights[r][c] : undefined} />
          }),
        )}
      </div>
      <p className="says" data-says>
        {player.cursor === 0
          ? 'Press play. Drag on the grid to draw walls, and drag the two ends to move them.'
          : player.done
            ? pathLen > 0
              ? `Found a way out in ${pathLen} moves, after looking at ${frame.visited} cells.`
              : `No way out. It looked at ${frame.visited} cells to be sure.`
            : `Looked at ${frame.visited} cells so far.`}
      </p>
      <Transport player={player} speed={speed} setSpeed={setSpeed} />
      <dl className="counters">
        <div>
          <dt>Cells looked at</dt>
          <dd data-visited>{frame.visited.toLocaleString('en')}</dd>
        </div>
        <div>
          <dt>Path length</dt>
          <dd data-path>{frame.path ? Math.min(frame.path, pathLen) : '-'}</dd>
        </div>
        <div className="legend">
          <span data-state="start">start</span>
          <span data-state="goal">goal</span>
          <span data-state="frontier">waiting</span>
          <span data-state="visited">looked at</span>
          <span data-state="path">path</span>
        </div>
      </dl>
    </section>
  )
}

export default function Pathfinding() {
  useSEO({
    title: 'Pathfinding - Algomotion',
    description: 'Six pathfinding algorithms on a maze you can draw on. Step forwards, step back, and compare them on the same grid.',
  })

  const [algo, setAlgo] = useState(() => (ALGOS[param('algo', 'astar')] ? param('algo', 'astar') : 'astar'))
  const [mode, setMode] = useState(() => (param('mode', 'maze') === 'open' ? 'open' : 'maze'))
  const [rows, setRows] = useState(() => numberParam('rows', 21, 5, 41) | 1)
  const [cols, setCols] = useState(() => numberParam('cols', 35, 5, 61) | 1)
  const [braid, setBraid] = useState(() => numberParam('braid', 0.15, 0, 1))
  const [obst, setObst] = useState(() => numberParam('obst', 0.25, 0, 0.6))
  const [seed, setSeed] = useState(() => numberParam('seed', 7, 1, 1e9))
  const [speed, setSpeed] = useState(() => numberParam('speed', 1, 0.25, 8))
  const [diagonals, setDiagonals] = useState(() => param('diag', '0') === '1')
  const [weighted, setWeighted] = useState(() => param('w', '0') === '1')
  const [randomTies, setRandomTies] = useState(() => param('rt', '0') === '1')
  const [heuristic, setHeuristic] = useState(() => (HEURISTICS[param('heur', 'manhattan')] ? param('heur', 'manhattan') : 'manhattan'))
  const [ends, setEnds] = useState(() => ({
    start: { r: numberParam('sr', 1, 0, 60), c: numberParam('sc', 1, 0, 60) },
    goal: { r: numberParam('gr', 99, 0, 60), c: numberParam('gc', 99, 0, 60) },
  }))

  const base = useMemo(
    () => (mode === 'maze' ? buildMaze(rows, cols, seed, braid) : buildOpenGrid(rows, cols, seed, obst)),
    [mode, rows, cols, seed, braid, obst],
  )
  // The walls you drew, kept only while the grid under them is the same one
  const [drawn, setDrawn] = useState({ base: null, cells: {} })
  const cells = drawn.base === base ? drawn.cells : null
  const grid = useMemo(() => {
    if (!cells) return base
    const copy = base.map((row) => row.slice())
    for (const [key, value] of Object.entries(cells)) {
      const [r, c] = key.split(',').map(Number)
      copy[r][c] = value
    }
    return copy
  }, [base, cells])
  const weights = useMemo(() => buildWeights(grid, seed, weighted), [grid, seed, weighted])

  // The two ends stay inside the walls of the grid, whatever size it is now
  const clamp = (p) => ({ r: Math.min(Math.max(1, p.r), rows - 2), c: Math.min(Math.max(1, p.c), cols - 2) })
  const start = clamp(ends.start)
  const goal = clamp(ends.goal)

  useEffect(
    () =>
      writeParams({
        algo, mode, rows, cols, braid, obst, seed, speed, heur: heuristic,
        diag: diagonals ? 1 : 0, w: weighted ? 1 : 0, rt: randomTies ? 1 : 0,
        sr: start.r, sc: start.c, gr: goal.r, gc: goal.c,
      }),
    [algo, mode, rows, cols, braid, obst, seed, speed, heuristic, diagonals, weighted, randomTies, start.r, start.c, goal.r, goal.c],
  )

  const search = (key) =>
    ALGOS[key].fn(grid, start, goal, {
      dirs: diagonals ? DIRS8 : DIRS4,
      rng: randomTies ? makeRng(seed) : null,
      randomTies,
      weights,
      heuristic,
    })
  // The search runs to the end here. The grid then plays the recording.
  const run = useMemo(() => search(algo), [algo, grid, start.r, start.c, goal.r, goal.c, diagonals, randomTies, weights, heuristic, seed]) // eslint-disable-line react-hooks/exhaustive-deps
  const board = useMemo(
    () => Object.keys(ALGOS).map((key) => ({ key, ...ALGOS[key], ...search(key).metrics })),
    [grid, start.r, start.c, goal.r, goal.c, diagonals, randomTies, weights, heuristic, seed], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const shortest = Math.min(...board.filter((row) => row.pathLen > 0).map((row) => row.pathLen))
  const most = Math.max(1, ...board.map((row) => row.visited))

  const paint = (cell, value) => {
    if ((cell.r === start.r && cell.c === start.c) || (cell.r === goal.r && cell.c === goal.c)) return
    if (grid[cell.r][cell.c] === value) return
    setDrawn((d) => ({ base, cells: { ...(d.base === base ? d.cells : {}), [`${cell.r},${cell.c}`]: value } }))
  }
  const moveEnd = (which, cell) => {
    const inside = cell.r >= 1 && cell.c >= 1 && cell.r <= rows - 2 && cell.c <= cols - 2
    const other = which === 'start' ? goal : start
    if (!inside || grid[cell.r][cell.c] === WALL || (cell.r === other.r && cell.c === other.c)) return
    setEnds({ start, goal, [which]: cell })
  }

  const current = ALGOS[algo]

  return (
    <div className="arena">
      <div className="lead">
        <p className="eyebrow">Pathfinding</p>
        <h1>{current.label}</h1>
        <p className="lede">{current.desc}</p>
      </div>

      <Stage
        grid={grid}
        weights={weights}
        start={start}
        goal={goal}
        steps={run.steps}
        pathLen={run.metrics.pathLen}
        speed={speed}
        setSpeed={setSpeed}
        onPaint={paint}
        onMove={moveEnd}
      />

      <aside className="panel">
        <h2>The grid</h2>
        <div className="chips" role="group" aria-label="Kind of grid">
          <button type="button" aria-pressed={mode === 'maze'} onClick={() => setMode('maze')}>
            Maze
          </button>
          <button type="button" aria-pressed={mode === 'open'} onClick={() => setMode('open')}>
            Open field
          </button>
        </div>
        <label className="field">
          <span>
            Rows <b>{rows}</b>
          </span>
          <input type="range" min="5" max="41" step="2" value={rows} onChange={(e) => setRows(Number(e.target.value))} />
        </label>
        <label className="field">
          <span>
            Columns <b>{cols}</b>
          </span>
          <input type="range" min="5" max="61" step="2" value={cols} onChange={(e) => setCols(Number(e.target.value))} />
        </label>
        {mode === 'maze' ? (
          <label className="field">
            <span>
              Extra openings <b>{Math.round(braid * 100)}%</b>
            </span>
            <input type="range" min="0" max="1" step="0.05" value={braid} onChange={(e) => setBraid(Number(e.target.value))} />
          </label>
        ) : (
          <label className="field">
            <span>
              Walls <b>{Math.round(obst * 100)}%</b>
            </span>
            <input type="range" min="0" max="0.6" step="0.05" value={obst} onChange={(e) => setObst(Number(e.target.value))} />
          </label>
        )}
        <label className="check">
          <input type="checkbox" checked={diagonals} onChange={(e) => setDiagonals(e.target.checked)} />
          Diagonal moves
        </label>
        <label className="check">
          <input type="checkbox" checked={weighted} onChange={(e) => setWeighted(e.target.checked)} />
          Heavy cells. Some cost 2 or 3 to cross
        </label>
        <label className="check">
          <input type="checkbox" checked={randomTies} onChange={(e) => setRandomTies(e.target.checked)} />
          Break ties at random
        </label>
        <label className="field">
          <span>Distance guess, for A* and Greedy</span>
          <select value={heuristic} onChange={(e) => setHeuristic(e.target.value)}>
            {Object.entries(HEURISTICS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="chips">
          <button type="button" onClick={() => setSeed((s) => ((s * 9301 + 49297) % 233280) + 1)}>
            New grid
          </button>
          <button type="button" disabled={!cells} onClick={() => setDrawn({ base: null, cells: {} })}>
            Clear my walls
          </button>
        </div>
      </aside>

      <section className="board">
        <h2>All six, on this grid</h2>
        <p className="hint">Each one has already run. Pick a row to watch it.</p>
        <table>
          <thead>
            <tr>
              <th>Algorithm</th>
              <th className="num">Looked at</th>
              <th className="num">Path</th>
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
                </td>
                <td className="num">{row.visited.toLocaleString('en')}</td>
                <td className="num">
                  {row.pathLen || 'none'}
                  {row.pathLen > 0 && row.pathLen === shortest && <small> shortest</small>}
                </td>
                <td className="meter">
                  <i style={{ '--share': row.visited / most }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">
          Path counts cells, so with heavy cells on, the cheapest path is not always the one with the fewest cells.
        </p>
      </section>
    </div>
  )
}
