import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EMITTERS } from '../lib/sortEmitters'
import { hashSeed, mulberry32 } from '../lib/pathCore'
import { useSEO } from '../hooks/useSEO'

const ROOMS = [
  ['/sorting', 'Sorting', '11 algorithms', 'Play one, step back through it, and see all eleven counted on the same list.'],
  ['/pathfinding', 'Pathfinding', '6 algorithms', 'A maze you can draw on. Watch each search spread, and see which one looks at the least.'],
  ['/complexity', 'Complexity', 'the curve', 'Count the work on bigger and bigger lists. The Big-O line turns up by itself.'],
  ['/library', 'Library', '17 entries', 'Pseudocode, costs and when to use it, for every algorithm here.'],
  ['/ai-complexity', 'Code check', 'paste code', 'Paste a function. A model estimates its Big-O and says where the time goes.'],
]

const ORDER = ['quick', 'heap', 'merge', 'insertion']

/** A sort that plays by itself, then another one. The same recordings the Sorting page plays. */
function Reel() {
  const [turn, setTurn] = useState(0)
  const [cursor, setCursor] = useState(0)
  const key = ORDER[turn % ORDER.length]
  const base = useMemo(() => {
    const rng = mulberry32(hashSeed('home', turn))
    return Array.from({ length: 36 }, () => Math.floor(rng() * 95) + 5)
  }, [turn])
  const steps = useMemo(() => EMITTERS[key].fn(base).steps, [key, base])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setCursor((c) => {
        if (c < steps.length + 40) return c + 2
        setTurn((t) => t + 1)
        return 0
      })
    }, 30)
    return () => clearInterval(id)
  }, [steps.length])

  const list = base.slice()
  const upTo = Math.min(cursor, steps.length)
  for (let k = 0; k < upTo; k++) {
    const s = steps[k]
    if (s.type === 'swap') [list[s.i], list[s.j]] = [list[s.j], list[s.i]]
    else if (s.type === 'overwrite') list[s.i] = s.value
  }
  const last = upTo > 0 && upTo < steps.length ? steps[upTo - 1] : null

  return (
    <figure className="reel">
      <div className="bars" data-many aria-hidden="true">
        {list.map((value, i) => (
          <i
            key={i}
            data-state={last && (i === last.i || i === last.j) ? last.type : upTo >= steps.length ? 'placed' : undefined}
            style={{ height: `${value}%` }}
          />
        ))}
      </div>
      <figcaption>
        {EMITTERS[key].label}, {EMITTERS[key].bigO}
      </figcaption>
    </figure>
  )
}

export default function Home() {
  useSEO({
    title: 'Algomotion - sorting and pathfinding, one step at a time',
    description: 'Sorting and pathfinding algorithms, recorded and played back one step at a time. Step forwards, step back, compare them, and see where Big-O comes from.',
  })
  return (
    <div className="home">
      <div className="lead">
        <p className="eyebrow">Algorithms, one step at a time</p>
        <h1>Watch it work. Then drag it backwards.</h1>
        <p className="lede">
          Every algorithm here runs to the end first and writes down each thing it did. What you watch is that
          recording. So you can pause it, step through it, and go back to the move you missed.
        </p>
        <div className="chips">
          <Link className="button solid" to="/sorting">
            Open sorting
          </Link>
          <Link className="button" to="/pathfinding">
            Open pathfinding
          </Link>
        </div>
      </div>
      <Reel />
      <ul className="rooms">
        {ROOMS.map(([to, name, tag, text]) => (
          <li key={to}>
            <Link to={to}>
              <b>{name}</b>
              <small>{tag}</small>
              <span>{text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
