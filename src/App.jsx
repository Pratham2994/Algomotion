import { lazy, Suspense, useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Home from './pages/Home.jsx'

// Each page is its own file on the wire, loaded when it is opened
const Sorting = lazy(() => import('./pages/Sorting.jsx'))
const Pathfinding = lazy(() => import('./pages/Pathfinding.jsx'))
const Complexity = lazy(() => import('./pages/Complexity.jsx'))
const Library = lazy(() => import('./pages/Library.jsx'))
const AIComplexity = lazy(() => import('./pages/AIComplexity.jsx'))

const LINKS = [
  ['/sorting', 'Sorting'],
  ['/pathfinding', 'Pathfinding'],
  ['/complexity', 'Complexity'],
  ['/library', 'Library'],
  ['/ai-complexity', 'Code check'],
]

function PageChange() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    if (import.meta.env.PROD && window.gtag) {
      window.gtag('config', 'G-G7XR6NHMTX', { page_path: location.pathname + location.search })
    }
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function App() {
  return (
    <>
      <PageChange />
      <header className="top">
        <NavLink to="/" className="brand">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M2 16V9h3v7zM7 16V4h3v12zM12 16v-5h3v5z" />
          </svg>
          Algomotion
        </NavLink>
        <nav>
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
        <Suspense fallback={<p className="hint">Loading</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sorting" element={<Sorting />} />
            <Route path="/pathfinding" element={<Pathfinding />} />
            <Route path="/complexity" element={<Complexity />} />
            <Route path="/library" element={<Library />} />
            <Route path="/ai-complexity" element={<AIComplexity />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="foot">
        <span>
          Built by <b>Pratham Panchal</b>
        </span>
        <a href="https://github.com/Pratham2994/Algomotion" target="_blank" rel="noreferrer">
          Source on GitHub
        </a>
      </footer>
      {import.meta.env.PROD && <Analytics />}
      {import.meta.env.PROD && <SpeedInsights />}
    </>
  )
}
