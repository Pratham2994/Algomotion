// End to end for the algorithm libraries: every recorded run is replayed the way the pages replay it,
// and the result is checked. Run with `npm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EMITTERS } from '../src/lib/sortEmitters.js'
import { SORTERS, makeArray } from '../src/lib/benchCore.js'
import {
  ALGOS, DIRS4, DIRS8, WALL, buildMaze, buildOpenGrid, buildWeights, mulberry32,
} from '../src/lib/pathCore.js'

// The same replay as frameAt in src/pages/Sorting.jsx
function replay(base, steps) {
  const list = base.slice()
  for (const s of steps) {
    if (s.type === 'swap') [list[s.i], list[s.j]] = [list[s.j], list[s.i]]
    else if (s.type === 'overwrite') list[s.i] = s.value
  }
  return list
}

function lists() {
  const rng = mulberry32(7)
  const out = [[], [5], [2, 1], [3, 1, 2]]
  for (let k = 0; k < 300; k++) {
    const n = 1 + Math.floor(rng() * 100)
    const a = Array.from({ length: n }, () => 5 + Math.floor(rng() * 95))
    const kind = k % 5
    if (kind === 1) a.sort((x, y) => x - y)
    if (kind === 2) a.sort((x, y) => y - x)
    if (kind === 3) a.forEach((_, i) => (a[i] = [20, 45, 70, 95][a[i] % 4]))
    // A long sorted run followed by noise: TimSort must merge runs longer than its RUN size
    if (kind === 4) a.splice(0, Math.floor(n * 0.7), ...a.slice(0, Math.floor(n * 0.7)).sort((x, y) => x - y))
    out.push(a)
  }
  return out
}

test('every sort leaves the list sorted, with the same values', () => {
  for (const [key, { fn }] of Object.entries(EMITTERS)) {
    for (const base of lists()) {
      const result = replay(base, fn(base).steps)
      assert.deepEqual(result, base.slice().sort((x, y) => x - y), `${key} on [${base}]`)
    }
  }
})

test('bubble sort stops after one pass on a sorted list', () => {
  const sorted = Array.from({ length: 50 }, (_, i) => i)
  assert.equal(EMITTERS.bubble.fn(sorted).metrics.comparisons, 49)
  assert.equal(SORTERS.bubble.fn(sorted).comparisons, 49)
})

test('the benchmark sorts run on large worst-case inputs', () => {
  const reversed = makeArray(50000, 'reversed', 1)
  assert.doesNotThrow(() => SORTERS.quick.fn(reversed))
  for (const { fn } of Object.values(SORTERS)) assert.ok(fn(makeArray(500, 'random', 3)).comparisons > 0)
})

test('"nearly sorted" input is close to sorted', () => {
  const a = makeArray(1000, 'nearly', 5)
  let descents = 0
  for (let i = 1; i < a.length; i++) if (a[i] < a[i - 1]) descents++
  assert.ok(descents <= 100, `${descents} descents`)
})

function pathOf(steps, start) {
  const cells = steps.filter((s) => s.type === 'path')
  return cells.length && cells.at(-1).r === start.r && cells.at(-1).c === start.c ? cells.reverse() : null
}

function cost(path, weights) {
  let total = 0
  for (let i = 1; i < path.length; i++) {
    const [a, b] = [path[i - 1], path[i]]
    total += (a.r !== b.r && a.c !== b.c ? Math.SQRT2 : 1) * (weights ? weights[b.r][b.c] : 1)
  }
  return total
}

function assertValid(grid, path, label) {
  for (let i = 1; i < path.length; i++) {
    const [a, b] = [path[i - 1], path[i]]
    const dr = b.r - a.r, dc = b.c - a.c
    assert.ok(Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && (dr || dc), `${label}: not a single step`)
    assert.notEqual(grid[b.r][b.c], WALL, `${label}: path through a wall`)
    if (dr && dc) assert.ok(grid[a.r + dr][a.c] !== WALL && grid[a.r][a.c + dc] !== WALL, `${label}: cuts a corner`)
  }
}

test('every search finds a valid path; A* and Dijkstra find the cheapest', () => {
  const start = { r: 1, c: 1 }, goal = { r: 19, c: 33 }
  for (let seed = 1; seed <= 120; seed++) {
    for (const mode of ['open', 'maze']) {
      const grid = mode === 'open' ? buildOpenGrid(21, 35, seed, 0.25) : buildMaze(21, 35, seed, 0.15)
      grid[start.r][start.c] = grid[goal.r][goal.c] = 0
      for (const dirs of [DIRS4, DIRS8]) {
        for (const weighted of [false, true]) {
          const weights = buildWeights(grid, seed, weighted)
          const opts = { dirs, weights, heuristic: 'manhattan', rng: mulberry32(seed) }
          const best = pathOf(ALGOS.dijkstra.fn(grid, start, goal, opts).steps, start)
          for (const key of Object.keys(ALGOS)) {
            if (key === 'dials' && dirs === DIRS8) continue
            const label = `${key} seed ${seed} ${mode} ${dirs.length}-way${weighted ? ' heavy' : ''}`
            const path = pathOf(ALGOS[key].fn(grid, start, goal, opts).steps, start)
            assert.equal(Boolean(path), Boolean(best), `${label}: found / not found differs from Dijkstra`)
            if (!path) continue
            assertValid(grid, path, label)
            if (key === 'astar') assert.ok(Math.abs(cost(path, weights) - cost(best, weights)) < 1e-9, `${label}: not the cheapest`)
          }
        }
      }
    }
  }
})
