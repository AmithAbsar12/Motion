import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "../hooks/useGsap";

const locations = [
  {
    numeral: "I",
    name: "The Apothecary",
    eyebrow: "Curiosities & unlikely essentials",
    description:
      "Everyday supplies for extraordinary beings. Curious gifts, improbable remedies and books waiting for their next reader.",
    tags: ["Shop & browse", "All ages"],
    access:
      "Changing Places toilet in the building. Sunflower scheme supported. See the access guide for routes around the shop.",
    cta: "Explore the shop",
    image: "/concept-3/l · Wide — 1920 –– Visit us (1).png",
    photo: "/concept-3/apothecary-video.png",
    pin: [63, 54],
    transform: "translate3d(-9%, -8%, 0) scale(1.26)",
  },
  {
    numeral: "II",
    name: "The Feastery",
    eyebrow: "Something good is brewing",
    description:
      "A pause between adventures. Find a table for proper coffee, something delicious, and a conversation that runs a little longer.",
    tags: ["Café", "Hot food 10am–3pm"],
    access:
      "Breastfeeding friendly venue, with gender-neutral toilets. Please ask the team about dietary needs and step-free access.",
    cta: "Discover the menu",
    image: "/concept-3/l · Wide — 1920 –– Visit us (2).png",
    photo: "/concept-3/feastery-video.png",
    pin: [38, 15],
    transform: "translate3d(17%, 14%, 0) scale(1.25)",
  },
  {
    numeral: "III",
    name: "The Workshop",
    eyebrow: "For stories that haven’t been told",
    description:
      "A place for young people to find their voice. Discover creative workshops and story-making visits for schools and community groups.",
    tags: ["Children & young people", "Booking required"],
    access:
      "Deaf-awareness trained staff and Changing Places facilities. Confirm the room, access route and age range when booking.",
    cta: "Discover workshops",
    image: "/concept-3/l · Wide — 1920 –– Visit us (3).png",
    photo: "/concept-3/workshop-video.png",
    pin: [82, 19],
    transform: "translate3d(-22%, 16%, 0) scale(1.25)",
  },
];
function Arrow({ direction = "right" }) {
  return (
    <span className={`fm-arrow fm-arrow--${direction}`} aria-hidden="true" />
  );
}

export default function FantasyMap() {
  const [selected, setSelected] = useState(0),
    [zoom, setZoom] = useState(100),
    [overview, setOverview] = useState(true);
  const [cameraIndex, setCameraIndex] = useState(0);
 const [hovered, setHovered] = useState(null),
   [fogCleared, setFogCleared] = useState(false);
  const [fogReveal, setFogReveal] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const dragStart = useRef(null),
    card = useRef(null),
    wheelLock = useRef(false);
  const location = locations[selected];
  const cameraLocation = locations[cameraIndex];
  const choose = useCallback((index) => {
    if (index < 0 || index >= locations.length) return;
    setSelected(index);
    setCameraIndex(index);
    setOverview(false);
    setZoom(100);
    setDrag({ x: 0, y: 0 });
    setFogCleared(false);
    setFogReveal({ x: locations[index].pin[0], y: locations[index].pin[1] });
    setHovered(null);
  }, []);
  const step = useCallback(
    (amount) => {
      if (overview) {
        choose(0);
        return;
      }
      choose((selected + amount + locations.length) % locations.length);
    },
    [choose, overview, selected],
  );
  useEffect(() => {
    if (card.current && !overview)
      gsap.fromTo(
        card.current,
        { autoAlpha: 0.25, x: 24 },
        { autoAlpha: 1, x: 0, duration: 0.55, ease: "power2.out" },
      );
  }, [selected, overview]);
  useEffect(() => {
    const key = (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") step(1);
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") step(-1);
      if (event.key === "Escape") setOverview(true);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [step]);
  const onWheel = (event) => {
    if (wheelLock.current || Math.abs(event.deltaY) < 10) return;
    wheelLock.current = true;
    step(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLock.current = false;
    }, 1750);
  };
  const onPointerDown = (event) => {
    event.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY, drag };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setFogReveal({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
    if (dragStart.current) {
      setFogCleared(true);
      const baseAllowance = 0.45;
      const zoomAllowance = Math.max(0, zoom / 100 - 1) / 2;
      const maxX = bounds.width * (baseAllowance + zoomAllowance);
      const maxY = bounds.height * (baseAllowance + zoomAllowance);
      const nextX = dragStart.current.drag.x + event.clientX - dragStart.current.x;
      const nextY = dragStart.current.drag.y + event.clientY - dragStart.current.y;
      setDrag({
        x: Math.max(-maxX, Math.min(maxX, nextX)),
        y: Math.max(-maxY, Math.min(maxY, nextY)),
      });
    }
  };
  const zoomScale = zoom / 100;
  const zoomFocus = overview
    ? { x: 0, y: 0 }
    : {
        x: (1 - zoomScale) * (location.pin[0] - 50),
        y: (1 - zoomScale) * (location.pin[1] - 50),
      };
  const transform = `${overview ? "translate3d(0,0,0) scale(1)" : cameraLocation.transform} translate3d(${drag.x / Math.max(zoomScale, 1)}px,${drag.y / Math.max(zoomScale, 1)}px,0) translate3d(${zoomFocus.x}%,${zoomFocus.y}%,0) scale(${zoomScale})`;
  return (
    <main
      className={`fantasy-map ${overview ? "fantasy-map--overview" : ""} ${!overview && selected === 2 ? "fantasy-map--workshop-active" : ""} ${isDragging ? "fantasy-map--dragging" : ""}`}
      onWheel={onWheel}
    >
      <header className="fm-header">
        <a className="fm-logo" href="#home">
          <strong>
            GRIMM <i>&amp;</i> CO.
          </strong>
          <small>The Emporium of Stories</small>
        </a>
        <nav aria-label="Primary navigation">
          <a className="active" href="#visit">
            Visit us
          </a>
          <a href="#whats-on">What’s on</a>
          <a href="#story">Our story</a>
          <a href="#shop">The shop ↗</a>
        </nav>
        <a className="fm-plan" href="#plan">
          Plan your visit <span>↗</span>
        </a>
      </header>
      <section className="fm-world">
        <div className="fm-title">
          <small>
            <i />A very different kind of visit
          </small>
          <h1>
            A world
            <br />
            to <em>wander.</em>
          </h1>
          <p>
            For magical beings.
            <br />
            Open to curious humans, too.
          </p>
        </div>
        <div className="fm-guide" aria-hidden="true">
          <b>G &amp;</b>
          <span>
            Field Guide
            <br />
            to the extraordinary
          </span>
        </div>
        <div className="fm-coordinates" aria-hidden="true">
          53°25′ N&nbsp;&nbsp; 01°21′ W
        </div>
        <div
          className="fm-map-window"
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => {
            dragStart.current = null;
            setIsDragging(false);
          }}
          onPointerCancel={() => {
            dragStart.current = null;
            setIsDragging(false);
          }}
        >
          <div
            className="fm-map-scene"
            style={{
              transform,
              transformOrigin: "50% 50%",
              "--focus-x": `${overview ? 50 : location.pin[0]}%`,
             "--focus-y": `${overview ? 50 : location.pin[1]}%`,
              "--reveal-x": `${fogReveal.x}%`,
              "--reveal-y": `${fogReveal.y}%`,
            }}
         >
           <div className="fm-map-art" />
            <div className="fm-map-atmosphere" aria-hidden="true" />
           <div className="fm-map-cloud fm-map-cloud--a" />
           <div className="fm-map-cloud fm-map-cloud--b" />
           <div className="fm-map-cloud fm-map-cloud--c" />
            {locations.map((item, index) => (
              <button
                key={`${item.name}-overview`}
                className="fm-overview-dot"
                style={{ left: `${item.pin[0]}%`, top: `${item.pin[1]}%` }}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  choose(index);
                }}
                aria-label={`Explore ${item.name}`}
              />
            ))}
           {locations.map((item, index) => (
              <button
                key={item.name}
                className={`fm-pin ${item.name === "The Workshop" ? "fm-pin--workshop" : ""} ${selected === index && !overview ? "active" : ""}`}
                style={{ left: `${item.pin[0]}%`, top: `${item.pin[1]}%` }}
                onPointerDown={(event) => event.stopPropagation()}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                onClick={(event) => {
                  event.stopPropagation();
                  choose(index);
                }}
                aria-label={`Open ${item.name}`}
              >
                <span>{item.numeral}</span>
                <b>{item.name}</b>
              </button>
            ))}
            {hovered !== null && (
              <div
                className="fm-hover-card"
                style={{
                  left: `${locations[hovered].pin[0]}%`,
                  top: `${locations[hovered].pin[1]}%`,
                }}
              >
                <div
                  style={{
                    backgroundImage: `url("${locations[hovered].photo}")`,
                  }}
                />
                <strong>{locations[hovered].name}</strong>
                <span>
                  Choose to explore <i>↗</i>
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="fm-controls">
          <button onClick={() => setZoom((z) => Math.max(80, z - 20))}>
            −
          </button>
          <output>{zoom}%</output>
          <button onClick={() => setZoom((z) => Math.min(160, z + 20))}>
            +
          </button>
          <button
            onClick={() => {
              setDrag({ x: 0, y: 0 });
              setZoom(100);
            }}
          >
            ⌖
          </button>
        </div>
        <p className="fm-caption">An imagined map. A very real place.</p>
      </section>
      {!overview && (
        <aside className="fm-card" ref={card}>
          <header>
            <span>Your next discovery</span>
            <b>{String(selected + 1).padStart(2, "0")} / 03</b>
          </header>
          <div
            className="fm-photo"
            style={{ backgroundImage: `url("${location.photo}")` }}
          >
            <span>Inside the emporium</span>
            <i>✦</i>
          </div>
          <div className="fm-copy">
            <small>{location.eyebrow}</small>
            <h2>{location.name}</h2>
            <p>{location.description}</p>
            <div className="fm-tags">
              {location.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <hr />
            <h3>
              <i>◎</i>A little useful information
            </h3>
            <p className="fm-access">{location.access}</p>
          </div>
          <a
            className="fm-cta"
            href={`#${location.name.toLowerCase().replaceAll(" ", "-")}`}
          >
            {location.cta}
            <span>↗</span>
          </a>
          <nav className="fm-card-nav" aria-label="Change destination">
            <button onClick={() => step(-1)} aria-label="Previous destination">
              ←
            </button>
            <span>
              {String(selected + 1).padStart(2, "0")} <i /> 03
            </span>
            <button onClick={() => step(1)} aria-label="Next destination">
              →
            </button>
          </nav>
        </aside>
      )}
      {!overview && (
        <button
          className="fm-close"
          onClick={() => setOverview(true)}
          aria-label="Close location"
        >
          <span />
          <span />
        </button>
      )}
      <div className="fm-stepper">
        <button onClick={() => step(-1)}>
          <Arrow direction="up" />
        </button>
        <div>
          {locations.map((item, index) => (
            <button
              key={item.name}
              className={selected === index && !overview ? "active" : ""}
              onClick={() => choose(index)}
              aria-label={item.name}
            />
          ))}
          <span className="fm-stepper__placeholder" aria-hidden="true" />
        </div>
        <button onClick={() => step(1)}>
          <Arrow direction="down" />
        </button>
      </div>
      <button className="fm-scroll-prompt" onClick={() => step(1)}>
        <i />
        <span>
          Scroll to wander<small>or choose a place on the map</small>
        </span>
      </button>
    </main>
  );
}
