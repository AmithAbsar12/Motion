import { Canvas, useFrame } from "@react-three/fiber";
import { Preload, useAnimations, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { gsap, useGsap } from "../hooks/useGsap";

const services = [
  ["Branding ↗", "https://funkyvibes.co.uk/branding/"],
  ["Websites", "https://funkyvibes.co.uk/websites/"],
  ["Social Media", "https://funkyvibes.co.uk/social-media/"],
  ["Film & Photo", "https://funkyvibes.co.uk/film-photography/"],
  ["Strategy", "https://funkyvibes.co.uk/marketing-strategies/"],
];

const company = [
  ["How We Work", "https://funkyvibes.co.uk/our-tribe/"],
  ["Resource Hub", "https://funkyvibes.co.uk/"],
  ["About Us", "https://funkyvibes.co.uk/our-tribe/"],
  ["Contact Us", "https://funkyvibes.co.uk/contact/"],
];

const koiModelUrl = new URL(
  "../../assets/models/concept-4/koi-animated.glb",
  import.meta.url,
).href;

function LoopingUnderwaterVideo() {
  return (
    <video
      className="ocean-backdrop ocean-backdrop-video"
      src="/concept-4/underwater-2%20-%20merge%20-%20final.mp4"
      poster="/concept-4/underwater-recording-clean.png"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
    />
  );
}

function KoiFish({ scrollProgress, revealProgress, reduced }) {
  const fish = useRef();
  const model = useRef();

  const { scene, animations } = useGLTF(koiModelUrl);
  const { actions } = useAnimations(animations, scene);

  const visualCentre = useMemo(() => {
    const bounds = new THREE.Box3().setFromObject(scene);
    const centre = bounds.getCenter(new THREE.Vector3());

    return [-centre.x, -centre.y, -centre.z];
  }, [scene]);

  useEffect(() => {
    const swim = actions.MorphBake;

    if (!swim || reduced) return;

    swim.reset();
    swim.setLoop(THREE.LoopRepeat, Infinity);
    swim.fadeIn(0.25).play();

    // Slightly calmer than the original animation.
    swim.timeScale = 0.82;

    return () => {
      swim.fadeOut(0.2);
    };
  }, [actions, reduced]);

  useFrame(({ clock }, delta) => {
    if (!fish.current) return;

    const rawProgress = THREE.MathUtils.clamp(scrollProgress.current, 0, 1);
    const reveal = THREE.MathUtils.clamp(revealProgress.current, 0, 1);
    // `scrollProgress` starts exactly when the panel reaches full-screen.
    const p = rawProgress;
    const time = clock.elapsedTime;
    const hasSettled = rawProgress > 0.01;
    const swim = actions.MorphBake;

    // Keep the exact same morph animation, but hold its first pose while the
    // card is resizing so its body motion cannot be mistaken for a position jump.
    if (swim && !reduced) swim.paused = !hasSettled;

    const smoother = (v) => {
      const val = THREE.MathUtils.clamp(v, 0, 1);
      return val * val * val * (val * (val * 6 - 15) + 10);
    };

    const LEFT = -2.78;
    const RIGHT = 2.78;
    const START_X = 0.32;
    const point = new THREE.Vector3();

    let yaw = Math.PI;
    let pitch = 0;
    let roll = 0;

    // REVEAL
    if (p <= 0.025) {
      point.set(START_X, 0.08, 0);
      yaw = Math.PI;
    } else if (p < 0.22) {
      // PASS 1 — left
      const local = smoother((p - 0.025) / 0.195);
      point.x = THREE.MathUtils.lerp(START_X, LEFT, local);
      point.y = 0.08 + Math.sin(local * Math.PI) * 0.08;
      point.z = -Math.sin(local * Math.PI) * 0.05;
      yaw = Math.PI;
      pitch = Math.sin(local * Math.PI) * -0.02;
      roll = Math.sin(local * Math.PI) * 0.02;
    } else if (p < 0.36) {
      // LEFT U-TURN — swooping forward toward camera with bank roll
      const raw = THREE.MathUtils.clamp((p - 0.22) / 0.14, 0, 1);
      const local = smoother(raw);

      yaw = Math.PI + local * Math.PI;
      point.x = THREE.MathUtils.lerp(LEFT, LEFT + 0.5, local);

      const cameraArc = Math.sin(local * Math.PI);
      point.z = cameraArc * 0;
      point.y = 0.08 - cameraArc * 0.15;

      // Enhanced pitch and banking roll for turning effect
      pitch = Math.sin(local * Math.PI) * 0.15;
      roll = -Math.sin(local * Math.PI) * 0.35;
    } else if (p < 0.67) {
      // PASS 2 — right
      const local = smoother((p - 0.36) / 0.31);
      point.x = THREE.MathUtils.lerp(LEFT + 0.5, RIGHT, local);
      point.y = 0.08 - Math.sin(local * Math.PI) * 0.08;
      point.z = Math.sin(local * Math.PI) * 0.05;
      yaw = Math.PI * 2;
      pitch = Math.sin(local * Math.PI * 2) * 0.018;
      roll = -Math.sin(local * Math.PI * 2) * 0.025;
    } else if (p < 0.81) {
      // RIGHT U-TURN — mirrored swoop with bank roll
      const raw = THREE.MathUtils.clamp((p - 0.67) / 0.14, 0, 1);
      const local = smoother(raw);

      yaw = Math.PI * 2 + local * Math.PI;
      point.x = THREE.MathUtils.lerp(RIGHT, RIGHT - 0.5, local);

      const cameraArc = Math.sin(local * Math.PI);
      point.z = cameraArc * 0.28;
      point.y = 0.08 - cameraArc * 0.15;

      // Enhanced pitch and banking roll for turning effect
      pitch = -Math.sin(local * Math.PI) * 0.15;
      roll = Math.sin(local * Math.PI) * 0.35;
    } else {
      // PASS 3 — back left
      const local = smoother((p - 0.81) / 0.19);
      point.x = THREE.MathUtils.lerp(RIGHT - 0.5, -1.45, local);
      point.y = 0.08 + Math.sin(local * Math.PI) * 0.08;
      point.z = -Math.sin(local * Math.PI) * 0.05;
      yaw = Math.PI * 3;
      pitch = Math.sin(local * Math.PI) * -0.018;
      roll = Math.sin(local * Math.PI) * 0.02;
    }

    // Secondary ambient floating
    if (!reduced && hasSettled) {
      point.y += Math.sin(time * 0.85) * 0.03;
      point.z += Math.sin(time * 0.48) * 0.015;
      roll += Math.sin(time * 1.05) * 0.01;
      pitch += Math.sin(time * 0.72) * 0.01;
    }

    // Apply Position & Rotation Damping
    const positionDamping = 1 - Math.pow(0.008, delta);
    fish.current.position.lerp(point, positionDamping);

    fish.current.rotation.y = THREE.MathUtils.damp(
      fish.current.rotation.y,
      yaw,
      9.5,
      delta,
    );

    fish.current.rotation.x = THREE.MathUtils.damp(
      fish.current.rotation.x,
      reduced ? 0 : pitch,
      6,
      delta,
    );

    fish.current.rotation.z = THREE.MathUtils.damp(
      fish.current.rotation.z,
      reduced ? 0 : roll,
      6,
      delta,
    );

    if (model.current) {
      const scaleEase = reveal * reveal * (3 - 2 * reveal);
      model.current.scale.setScalar(
        THREE.MathUtils.lerp(0.15, 0.58, scaleEase),
      );
      model.current.rotation.z = reduced ? 0 : Math.sin(time * 0.9) * 0.012;
    }
  });

  return (
    <group ref={fish} rotation={[0, Math.PI, 0]}>
      <group ref={model}>
        <primitive object={scene} position={visualCentre} />
      </group>
    </group>
  );
}

function OceanCanvas({ scrollProgress, revealProgress, reduced }) {
  return (
    <Canvas
      className="ocean-canvas"
      camera={{
        position: [0, 0, 9],
        fov: 38,
      }}
      dpr={[1, 1.5]}
      gl={{
        alpha: true,
        antialias: true,
      }}
    >
      <ambientLight intensity={0.78} color="#9c79d1" />

      <directionalLight
        position={[-5, 7, 7]}
        intensity={1.85}
        color="#e7a5d0"
      />

      <pointLight
        position={[1, 2, 4]}
        intensity={3.25}
        distance={14}
        color="#d84f9c"
      />

      <Suspense fallback={null}>
        <KoiFish
          scrollProgress={scrollProgress}
          revealProgress={revealProgress}
          reduced={reduced}
        />
      </Suspense>

      <Preload all />
    </Canvas>
  );
}

export default function UnderwaterFooter() {
  const root = useRef(null);
  const scrollProgress = useRef(0);
  const revealProgress = useRef(0);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useGsap(() => {
    if (reduced) {
      scrollProgress.current = 0.55;
      revealProgress.current = 1;

      gsap.set(".cta-stage", {
        display: "none",
      });

      gsap.set(".ocean-stage", {
        autoAlpha: 1,
        inset: 0,
        borderRadius: 0,
      });

      gsap.set(".footer-content", {
        autoAlpha: 1,
        y: 0,
      });

      return;
    }

    gsap
      .timeline({
        scrollTrigger: {
          trigger: ".underwater-journey",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.35,
          invalidateOnRefresh: true,
        },
      })

      .to(
        ".cta-stage",
        {
          yPercent: -112,
          duration: 0.36,
          ease: "none",
        },
        0,
      )

      .set(
        ".ocean-stage",
        {
          top: "108%",
          right: "44%",
          bottom: "-28%",
          left: "44%",
          autoAlpha: 1,
          borderRadius: 22,
        },
        0.26,
      )

      .to(
        ".ocean-stage",
        {
          top: "80%",
          right: "44%",
          bottom: 0,
          left: "44%",
          duration: 0.1,
          ease: "none",
        },
        0.26,
      )

      .to(
        ".ocean-stage",
        {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          borderRadius: 0,
          duration: 0.28,
          ease: "none",
        },
        0.36,
      )

      .to(
        revealProgress,
        {
          current: 1,
          duration: 0.38,
          ease: "none",
        },
        0.26,
      )

      .to(
        ".cta-stage",
        {
          autoAlpha: 0,
          duration: 0.12,
          ease: "none",
        },
        0.47,
      )

      .to(
        scrollProgress,
        {
          current: 1,
          duration: 2.3,
          ease: "none",
        },
        0.64,
      )

      .fromTo(
        ".footer-content",
        {
          y: 110,
          autoAlpha: 0,
        },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.18,
          ease: "power2.out",
        },
        2.96,
      )

      .to(
        ".ocean-backdrop",
        {
          scale: 1,
          yPercent: 0,
          duration: 1,
          ease: "none",
        },
        0,
      );
  }, root);

  return (
    <main ref={root} className="ocean-page">
      <div className="underwater-journey">
        <div className="underwater-sticky">
          <div className="transition-void" aria-hidden="true" />

          <section className="cta-stage" aria-labelledby="cta-title">
            <div className="cta-copy">
              <p>DON’T BE A</p>

              <h1 id="cta-title">STRANGER!</h1>

              <span>
                Ready to start your project? Let’s build
                <br />
                something legendary together!
              </span>
            </div>

            <div className="contact-pill">
              <a
                href="https://funkyvibes.co.uk/contact/"
                target="_blank"
                rel="noreferrer"
              >
                <small>BOOK</small>
                <b>CALL</b>
                <span aria-hidden="true">●</span>
              </a>

              <a
                href="mailto:findmytribe@funkyvibes.co.uk"
                aria-label="Email Funky Vibes"
              >
                <span aria-hidden="true">✉</span>
              </a>
            </div>

            <span className="cta-loop" aria-hidden="true" />
          </section>

          <footer className="ocean-stage">
            <div className="ocean-backdrop-motion" aria-hidden="true">
              {reduced ? (
                <img
                  className="ocean-backdrop"
                  src="/concept-4/underwater-recording-clean.png"
                  alt=""
                />
              ) : (
                <LoopingUnderwaterVideo />
              )}
            </div>

            <div className="ocean-light" aria-hidden="true" />

            <div className="distant-fish-school" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>

            <OceanCanvas
              scrollProgress={scrollProgress}
              revealProgress={revealProgress}
              reduced={reduced}
            />

            <div className="footer-content">
              <div className="footer-links">
                <nav aria-label="Services">
                  {services.map(([l, h]) => (
                    <a key={l} href={h} target="_blank" rel="noreferrer">
                      {l}
                    </a>
                  ))}
                </nav>

                <nav aria-label="Company">
                  {company.map(([l, h]) => (
                    <a key={l} href={h} target="_blank" rel="noreferrer">
                      {l}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="footer-legal">
                <div className="socials">
                  <a
                    href="https://www.instagram.com/funkyvibesmarketing/"
                    aria-label="Instagram"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle
                        cx="17.35"
                        cy="6.65"
                        r="1"
                        className="instagram-dot"
                      />
                    </svg>
                  </a>

                  <a
                    className="social-icon"
                    href="#facebook"
                    aria-label="Facebook"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M13.7 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5H17V3.7c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V9.9H8v3.1h2.8v8h2.9Z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>

                  <a
                    href="https://www.linkedin.com/company/funkyvibesmarketing/"
                    aria-label="LinkedIn"
                    target="_blank"
                    rel="noreferrer"
                  >
                    in
                  </a>
                </div>

                <a
                  href="https://funkyvibes.co.uk/terms-and-conditions/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Terms &amp; Conditions
                </a>

                <span>
                  Copyright © 2026 Funky Vibes Marketing | All Rights Reserved
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

useGLTF.preload(koiModelUrl);
