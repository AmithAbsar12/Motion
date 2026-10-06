import { useRef } from "react";
import { gsap, useGsap } from "../hooks/useGsap";

const services = [
  [
    "STRATEGY",
    "S",
    [
      "Digital Experience Strategy",
      "Technology Strategy",
      "Creative Direction",
      "Discovery",
      "Research",
    ],
  ],
  [
    "CREATIVE",
    "C",
    [
      "Art Direction",
      "UX/UI Design",
      "Motion Design",
      "Interactive Design",
      "Illustration",
    ],
  ],
  [
    "TECH",
    "T",
    [
      "WebGL Development",
      "Front End Development",
      "Unity/Unreal",
      "Interactive Installations",
      "AR and VR Experiences",
    ],
  ],
  [
    "PRODUCTION",
    "P",
    [
      "Procedural Modeling",
      "3D Asset Creation",
      "3D Optimization",
      "Animation",
      "3D Pipeline Development",
    ],
  ],
];

const markPaths = {
  S: "M3 3h18v5H8v3h13v10H3v-5h13v-3H3z",
  C: "M3 3h18v5H8v8h13v5H3z",
  T: "M2 3h20v5h-7v13H9V8H2z",
  P: "M3 3h14l4 4v7l-4 4H9v3H3zm6 5v5h7V8z",
};

function ServiceMark({ letter }) {
  return (
    <svg
      className={`service-mark service-mark--${letter.toLowerCase()}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={markPaths[letter]} />
    </svg>
  );
}

export default function CardFlip() {
  const root = useRef(null);
  const stage = useRef(null);
  const ripples = useRef(null);
  const rippleIndex = useRef(0);
  const lastRipple = useRef(0);

  useGsap(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = gsap.utils.toArray(".service-card");
    const title = root.current.querySelector(".expertise-title");
    gsap.set(cards, { xPercent: -50, yPercent: 118, rotation: -3 });
    gsap.set(cards.slice(1), { yPercent: 118 });
    gsap.set(".swoop--first path", {
      attr: { "stroke-dasharray": "1 3", "stroke-dashoffset": 1 },
      x: 0,
      y: 0,
      autoAlpha: 1,
    });

    gsap
      .timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          pin: ".cards-stage",
          scrub: 0.65,
          invalidateOnRefresh: true,
        },
      })
      .to(".studio-word", { yPercent: -115, duration: 0.78, ease: "none" }, 0)
      .to(".expertise-title", { y: "-46vh", duration: 0.86, ease: "none" }, 0)
      .to(".expertise-copy", { y: "-46vh", duration: 0.86, ease: "none" }, 0)
      .to(
        ".cards-stage",
        { backgroundColor: "#1424d2", duration: 0.72, ease: "none" },
        0.18,
      )
      .to(
        ".cards-stage",
        { backgroundColor: "#1829f9", duration: 0.45, ease: "none" },
        0.72,
      )
      .to(cards, { yPercent: -50, duration: 1.12, ease: "power2.inOut" }, 0.58)
      .to(
        cards,
        {
          xPercent: (i) => [-145, -48, 49, 125][i],
          rotation: (i) => [-12, -4, 5, 14][i],
          duration: 0.68,
          stagger: 0.045,
          ease: "power2.inOut",
        },
        1.08,
      )
      .set(
        ".swoop--first path",
        {
          attr: {
            d: "M1980 -150 C1400 305 535 305 200 -520",
            "stroke-dasharray": "1 3",
            "stroke-dashoffset": 1,
          },
          x: 0,
          y: 0,
          autoAlpha: 1,
        },
        1.3,
      )
      .to(
        ".swoop--first path",
        {
          attr: { "stroke-dashoffset": 0 },
          duration: 0.55,
          ease: "none",
        },
        1.3,
      )
      .to(
        ".swoop--first path",
        {
          x: 0,
          y: -300,
          duration: 0.2,
          ease: "none",
        },
        1.85,
      )
      .to(
        title,
        {
          y: () => -title.offsetTop - title.offsetHeight - 48,
          duration: 0.66,
          ease: "none",
        },
        0.86,
      )
      .to(".expertise-copy", { y: "-90vh", duration: 0.66, ease: "none" }, 0.86)
      .set(".expertise-title, .expertise-copy", { autoAlpha: 0 }, 1.52)
      .to(
        ".service-card__inner",
        { rotateY: -180, duration: 0.68, stagger: 0.15, ease: "power2.inOut" },
        1.86,
      )
      .to(
        cards,
        {
          left: (i) => `${[15.5, 38.5, 61.5, 83][i]}%`,
          xPercent: -50,
          yPercent: -50,
          rotation: 0,
          duration: 0.72,
          stagger: 0.12,
          ease: "power2.inOut",
        },
        1.86,
      )
      .set(
        ".swoop--first path",
        {
          attr: {
            d: "M1080 -240 C1065 -40 1015 115 875 185 C735 255 625 255 500 220 C370 185 285 145 180 162 C45 184 -65 285 -260 390",
            "stroke-dasharray": "1 3",
            "stroke-dashoffset": 1,
          },
          x: 0,
          y: 0,
          autoAlpha: 1,
        },
        2.05,
      )
      .to(
        ".swoop--first path",
        {
          attr: { "stroke-dashoffset": 0.12 },
          duration: 1.5,
          ease: "none",
        },
        2.05,
      )
      .to(
        ".swoop--first path",
        {
          x: -1450,
          y: -180,
          duration: 0.65,
          ease: "none",
        },
        3.4,
      )
      .set(".swoop--first path", { autoAlpha: 0 }, 4.1);
  }, root);

  const splash = (event) => {
    const bounds = stage.current.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    stage.current.style.setProperty("--pointer-x", `${x}px`);
    stage.current.style.setProperty("--pointer-y", `${y}px`);

    const now = performance.now();
    if (now - lastRipple.current < 65) return;
    lastRipple.current = now;
    const pool = ripples.current.children;
    const ripple = pool[rippleIndex.current++ % pool.length];
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.remove("is-splashing");
    void ripple.offsetWidth;
    ripple.classList.add("is-splashing");
  };

  const tilt = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    const target = event.currentTarget.querySelector(".service-card__tilt");
    target.style.setProperty("--tilt-x", `${-y * 10}deg`);
    target.style.setProperty("--tilt-y", `${x * 13}deg`);
  };

  const resetTilt = (event) => {
    const target = event.currentTarget.querySelector(".service-card__tilt");
    target.style.setProperty("--tilt-x", "0deg");
    target.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <main ref={root} className="cards-page">
      <section ref={stage} className="cards-stage" onPointerMove={splash}>
        <header className="lusion-header">
          <span className="lusion-logo">LUSION</span>
          <nav aria-label="Page actions">
            <button className="header-orb" aria-label="Previous">
              −
            </button>
            <a href="mailto:hello@lusion.co">LET'S TALK ↗</a>
            <button>MENU ↗</button>
          </nav>
        </header>

        <div className="studio-word" aria-hidden="true">
          STUDIO
        </div>
        <h1 className="expertise-title">
          AREA OF <span>EXPERTISE</span>
        </h1>
        <aside className="expertise-copy">
          <p>
            MULTIDISCIPLINARY EXPERTISE ACROSS
            <br />
            STRATEGY, CREATIVE, TECHNOLOGY, AND
            <br />
            PRODUCTION
          </p>
          <div>
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
          </div>
        </aside>

        <svg
          className="swoop swoop--first"
          viewBox="0 0 1600 600"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            pathLength="1"
            strokeDasharray="1 3"
            strokeDashoffset="1"
            d="M1980 -150 C1400 305 535 305 200 -520"
          />
        </svg>
        <div className="service-deck">
          {services.map(([title, letter, items], index) => (
            <article
              className="service-card"
              key={title}
              style={{
                zIndex: services.length - index,
                "--float-delay": `${index * -0.7}s`,
              }}
              onPointerMove={tilt}
              onPointerLeave={resetTilt}
            >
              <div className="service-card__tilt">
                <div className="service-card__float">
                  <div className="service-card__inner">
                    <div className="service-card__face service-card__back">
                      <img src="/concept-2/Pattern.png" alt="" />
                    </div>
                    <div className="service-card__face service-card__front">
                      <header>
                        <h2>{title}</h2>
                        <ServiceMark letter={letter} />
                      </header>
                      <ul>
                        {items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <footer>
                        <span>{title}</span>
                        <ServiceMark letter={letter} />
                      </footer>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div ref={ripples} className="water-ripples" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
