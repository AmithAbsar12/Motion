import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import Home from './pages/Home'

const BannerReveal = lazy(() => import('./pages/BannerReveal'))
const CardFlip = lazy(() => import('./pages/CardFlip'))
const FantasyMap = lazy(() => import('./pages/FantasyMap'))
const UnderwaterFooter = lazy(() => import('./pages/UnderwaterFooter'))

const concepts = [
  ['01', 'Banner reveal', '/concept-1'],
  ['02', 'Card flip', '/concept-2'],
  ['03', 'Fantasy map', '/concept-3'],
  ['04', 'Underwater footer', '/concept-4'],
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
  if (pathname === '/' || pathname === '/concept-3' || pathname === '/concept-4') return null
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
          <Route path="/concept-1" element={<BannerReveal />} />
          <Route path="/concept-2" element={<CardFlip />} />
          <Route path="/concept-3" element={<FantasyMap />} />
          <Route path="/concept-4" element={<UnderwaterFooter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
