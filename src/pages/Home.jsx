import { Link } from 'react-router-dom'

const studies = [
  { number: '01', title: 'Ever After', type: 'Banner reveal', path: '/ever-after', image: '/concept-1/Ever-after__frame 2.png', color: '#cf493f' },
  { number: '02', title: 'Area of Expertise', type: 'Card flip', path: '/card-flip', image: '/concept-2/parallax__frame 2.png', color: '#1d36ff' },
  { number: '03', title: 'A World to Wander', type: 'Interactive fantasy map', path: '/world-wander', image: '/concept-3/l · Wide — 1920 –– Visit us.png', color: '#c8432e' },
  { number: '04', title: 'Below the Surface', type: 'Immersive underwater footer', path: '/under-water', image: '/concept-4/Footer__Frame 1.png', color: '#6d23ff' },
]

export default function Home() {
  return (
    <main className="home">
      <header className="home__intro">
        <p className="eyebrow">Interactive development assessment</p>
        <h1>Four stories.<br /><em>One motion study.</em></h1>
        <p className="home__lede">A collection of scroll-led and interactive experiences built from the supplied artboards and motion references.</p>
      </header>
      <section className="study-grid" aria-label="Choose a concept">
        {studies.map((study) => (
          <Link className="study-card" to={study.path} key={study.path} style={{ '--accent': study.color }}>
            <div className="study-card__image"><img src={study.image} alt="" /></div>
            <div className="study-card__meta"><span>{study.number}</span><span>{study.type}</span></div>
            <h2>{study.title}</h2>
            <span className="study-card__cta">Explore concept ↗</span>
          </Link>
        ))}
      </section>
    </main>
  )
}
