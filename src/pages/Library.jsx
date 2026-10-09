import { useState } from 'react'
import { Link } from 'react-router-dom'
import { COMPLEXITY } from '../lib/libraryData'
import { useSEO } from '../hooks/useSEO'

const SHELVES = { sorting: 'Sorting', path: 'Pathfinding' }

function Entry({ item }) {
  return (
    <details className="entry" id={item.key}>
      <summary>
        <b>{item.name}</b>
        <span>{item.blurb}</span>
        <code>{item.avg}</code>
      </summary>
      <div className="entry-body">
        <div>
          <dl className="costs">
            {[
              ['Best', item.best],
              ['Average', item.avg],
              ['Worst', item.worst],
              ['Space', item.space],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
          {item.props?.length > 0 && (
            <ul className="tags">
              {item.props.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {item.uses?.length > 0 && (
            <>
              <h3>Use it for</h3>
              <ul className="plain">
                {item.uses.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </>
          )}
          {item.openLink && (
            <Link className="button" to={item.openLink}>
              Watch it run
            </Link>
          )}
        </div>
        {item.pseudo?.length > 0 && <pre className="code">{item.pseudo.join('\n')}</pre>}
      </div>
    </details>
  )
}

export default function Library() {
  useSEO({
    title: 'Library - Algomotion',
    description: 'Pseudocode, costs and uses for eleven sorting algorithms and six pathfinding algorithms.',
  })
  const [shelf, setShelf] = useState('sorting')
  const [query, setQuery] = useState('')
  const words = query.trim().toLowerCase()
  const items = COMPLEXITY[shelf].filter((item) => !words || `${item.name} ${item.blurb} ${(item.props || []).join(' ')}`.toLowerCase().includes(words))

  return (
    <div className="page">
      <div className="lead">
        <p className="eyebrow">Library</p>
        <h1>What each one does, and what it costs</h1>
        <p className="lede">Open an entry for the pseudocode. Then go and watch it run.</p>
      </div>
      <div className="toolbar">
        <div className="chips" role="group" aria-label="Shelf">
          {Object.entries(SHELVES).map(([key, label]) => (
            <button key={key} type="button" aria-pressed={shelf === key} onClick={() => setShelf(key)}>
              {label} <small>{COMPLEXITY[key].length}</small>
            </button>
          ))}
        </div>
        <input type="search" placeholder="Search. Try stable, or heuristic" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the library" />
      </div>
      <div className="entries">
        {items.map((item) => (
          <Entry key={item.key} item={item} />
        ))}
        {items.length === 0 && <p className="hint">Nothing matches that.</p>}
      </div>
    </div>
  )
}
