import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import Home from './pages/Home'

const BannerReveal = lazy(() => import('./pages/BannerReveal'))
const CardFlip = lazy(() => import('./pages/CardFlip'))
const FantasyMap = lazy(() => import('./pages/FantasyMap'))
const UnderwaterFooter = lazy(() => import('./pages/UnderwaterFooter'))

const concepts = [
  ['01', 'Ever After', '/ever-after'],
  ['02', 'Card Flip', '/card-flip'],
  ['03', 'World Wander', '/world-wander'],
  ['04', 'Under Water', '/under-water'],
]

function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function ConceptNav() {
  const { pathname } = useLocation()
  if (pathname === '/' || pathname === '/world-wander' || pathname === '/under-water') return null
  return (
    <nav className="concept-nav" aria-label="Concept navigation">
      <Link className="concept-nav__home" to="/">MOTION STUDIES</Link>
      <div className="concept-nav__links">
        {concepts.map(([number, label, path]) => (
          <Link key={path} className={pathname === path ? 'is-active' : ''} to={path} aria-label={label}>{number}</Link>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <>
      <ScrollReset />
      <ConceptNav />
      <Suspense fallback={<div className="route-loader"><span>Loading experience</span></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ever-after" element={<BannerReveal />} />
          <Route path="/card-flip" element={<CardFlip />} />
          <Route path="/world-wander" element={<FantasyMap />} />
          <Route path="/under-water" element={<UnderwaterFooter />} />
          <Route path="/concept-1" element={<Navigate to="/ever-after" replace />} />
          <Route path="/concept-2" element={<Navigate to="/card-flip" replace />} />
          <Route path="/concept-3" element={<Navigate to="/world-wander" replace />} />
          <Route path="/concept-4" element={<Navigate to="/under-water" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
