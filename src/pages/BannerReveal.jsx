import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { gsap, useGsap } from "../hooks/useGsap";

const banners = [
  {
    file: "Pull up Banner copy_Op 1 2.png",
    className: "outer left",
    height: "90vh",
  },
  {
    file: "Pull up Banner copy-06 2.png",
    className: "inner left",
    height: "81vh",
  },
  {
    file: "Pull up Banner copy-04 2.png",
    className: "center",
    height: "77vh",
  },
  {
    file: "Pull up Banner copy-02 2.png",
    className: "inner right",
    height: "83vh",
  },
  {
    file: "Pull up Banner copy-05 2.png",
    className: "outer right",
    height: "91vh",
  },
];

const experiences = [
  {
    name: "Potions",
    detail:
      "Mix curious ingredients and create a potion with a story of its own.",
    className: "potions",
  },
  {
    name: "Puzzles",
    detail:
      "Unlock riddles, discover hidden clues and find your way through the tale.",
    className: "puzzles",
  },
  {
    name: "Dressing-up",
    detail: "Choose a character, dress the part and step inside the adventure.",
    className: "dressing",
  },
];

const clamp = (value) => Math.max(0, Math.min(1, value));

function smooth(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

/*
 * Bend the actual banner surface instead of rotating one flat image.
 * All motion depends on scroll progress, so reverse scrolling works.
 */
function deformCloth(geometry, width, height, progress, phase) {
  const p = clamp(progress);
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const colors = geometry.attributes.color;

  // Cloth animation settings.
  const bend = 3.65 * smooth(p / 0.65);
  const bentLength = 0.75 * smooth(p / 0.75);
  const bendStart = 1 - bentLength;

  const lift = height * 1.55 * smooth(p);
  const retreat = height * 0.24 * smooth(p);
  const flutter = Math.sin(Math.PI * p);

  for (let i = 0; i < positions.count; i++) {
    const u = uv.getX(i);
    const s = 1 - uv.getY(i);

    const local = Math.max(0, s - bendStart);

    const angle =
      bentLength > 0.00001 ? (bend * local) / bentLength : 0;

    let y = -s * height;
    let z = 0;

    if (local > 0 && bend > 0.00001) {
      const radius = (height * bentLength) / bend;

      y = -bendStart * height - Math.sin(angle) * radius;

      // Negative Z curls the fabric backward, away from the viewer.
      z = -(1 - Math.cos(angle)) * radius;
    }

    // A small ripple near the loose edge makes the cloth less rigid.
    const wave = Math.sin(
      u * Math.PI * 2 + s * 3.5 - p * 5 + phase,
    );

    const amplitude = height * 0.012 * flutter * s * s;

    y += amplitude * wave * 0.35;
    z += amplitude * wave;

    positions.setXYZ(
      i,
      (u - 0.5) * width,
      y + lift,
      z - retreat,
    );

    // Subtle shading on the curved underside.
    const shade = 1 - (0.26 * (1 - Math.cos(angle))) / 2;
    colors.setXYZ(i, shade, shade, shade);
  }

  positions.needsUpdate = true;
  colors.needsUpdate = true;
}

/*
 * Kept inside this same file.
 * The original DOM banners handle the entrance and zoom.
 * A transparent canvas handles only the cloth exit.
 */
function useClothExit(root) {
  const state = useRef(
    banners.map(() => ({
      progress: 0,
    })),
  );

  const draw = useRef(() => {});

  useLayoutEffect(() => {
    const field = root.current?.querySelector(".banner-field");

    if (
      !field ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const shells = Array.from(
      field.querySelectorAll(".banner-shell"),
    );

    let disposed = false;
    let renderer;

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
    } catch {
      // Fallback when WebGL is unavailable.
      draw.current = () => {
        shells.forEach((shell, index) => {
          shell.style.transform = `translateY(${
            -135 * state.current[index].progress
          }%)`;
        });
      };

      draw.current();

      return () => {
        draw.current = () => {};

        shells.forEach((shell) => {
          shell.style.removeProperty("transform");
        });
      };
    }

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 2),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.className = "banner-cloth-canvas";
    canvas.setAttribute("aria-hidden", "true");
    field.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 1, 10000);
    const loader = new THREE.TextureLoader();

    const entries = shells.map((shell) => {
      // Enough subdivisions for a smooth curved surface.
      const geometry = new THREE.PlaneGeometry(1, 1, 16, 100);

      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(
          new Float32Array(
            geometry.attributes.position.count * 3,
          ).fill(1),
          3,
        ),
      );

      const material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        alphaTest: 0.02,
        vertexColors: true,
        toneMapped: false,
      });

      const mesh = new THREE.Mesh(geometry, material);

      mesh.frustumCulled = false;
      mesh.visible = false;
      scene.add(mesh);

      const entry = {
        shell,
        geometry,
        material,
        mesh,
        texture: null,
        ready: false,
      };

      const image = shell.querySelector(".banner-fabric");

      entry.texture = loader.load(
        image.src,
        (texture) => {
          if (disposed) {
            texture.dispose();
            return;
          }

          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(
            4,
            renderer.capabilities.getMaxAnisotropy(),
          );

          material.map = texture;
          material.needsUpdate = true;

          entry.ready = true;
          draw.current();
        },
        undefined,
        () => {
          if (!disposed) {
            draw.current();
          }
        },
      );

      return entry;
    });

    let oldWidth = 0;
    let oldHeight = 0;

    const render = () => {
      if (disposed) return;

      const width = field.clientWidth;
      const height = field.clientHeight;

      if (!width || !height) return;

      if (width !== oldWidth || height !== oldHeight) {
        renderer.setSize(width, height, false);

        camera.aspect = width / height;
        camera.position.z =
          height / (2 * Math.tan(THREE.MathUtils.degToRad(20)));
        camera.far = camera.position.z + 10000;
        camera.updateProjectionMatrix();

        oldWidth = width;
        oldHeight = height;
      }

      entries.forEach((entry, index) => {
        const { shell, mesh, geometry, ready } = entry;
        const p = clamp(state.current[index].progress);

        shell.classList.toggle(
          "is-cloth-exiting",
          ready && p > 0,
        );

        // Keep the original image if its texture has not loaded.
        shell.style.transform =
          !ready && p > 0 ? `translateY(${-135 * p}%)` : "";

        mesh.visible = ready && p > 0 && p < 1;

        if (!mesh.visible) return;

        const bannerWidth = shell.offsetWidth;
        const bannerHeight = shell.offsetHeight;

        mesh.position.set(
          shell.offsetLeft + bannerWidth / 2 - width / 2,
          height / 2 - shell.offsetTop,
          0,
        );

        deformCloth(
          geometry,
          bannerWidth,
          bannerHeight,
          p,
          index * 0.65,
        );
      });

      renderer.render(scene, camera);
    };

    draw.current = render;

    const observer = new ResizeObserver(render);

    observer.observe(field);

    shells.forEach((shell) => {
      observer.observe(shell);
    });

    render();

    return () => {
      disposed = true;
      draw.current = () => {};
      observer.disconnect();

      entries.forEach(
        ({ shell, geometry, material, texture }) => {
          shell.classList.remove("is-cloth-exiting");
          shell.style.removeProperty("transform");

          geometry.dispose();
          material.dispose();
          texture?.dispose();
        },
      );

      renderer.dispose();
      canvas.remove();
    };
  }, [root]);

  return { state, draw };
}

function ParticleTitle({ drawRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const image = new Image();

    image.src = "/concept-1/opening-title.png";

    image.onload = () => {
      const width = Math.max(1, Math.round(canvas.clientWidth));
      const height = Math.max(1, Math.round(canvas.clientHeight));
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);

      const sample = document.createElement("canvas");
      sample.width = canvas.width;
      sample.height = canvas.height;

      const sampleContext = sample.getContext("2d", {
        willReadFrequently: true,
      });

      const compactLayout = window.innerWidth <= 560;

      const titleWidth = Math.min(
        sample.width * (compactLayout ? 0.78 : 0.54),
        920 * ratio,
      );

      const titleHeight =
        titleWidth * (image.height / image.width);

      const titleX = (sample.width - titleWidth) / 2;
      const titleY =
        sample.height * (compactLayout ? 0.19 : 0.16);

      sampleContext.drawImage(
        image,
        titleX,
        titleY,
        titleWidth,
        titleHeight,
      );

      const pixels = sampleContext.getImageData(
        0,
        0,
        sample.width,
        sample.height,
      ).data;

      const cleanPixels = sampleContext.createImageData(
        sample.width,
        sample.height,
      );

      const particles = [];
      const step = Math.max(5, Math.round(6 * ratio));

      for (let offset = 0; offset < pixels.length; offset += 4) {
        const brightness =
          (pixels[offset] +
            pixels[offset + 1] +
            pixels[offset + 2]) /
          3;

        if (brightness > 40) {
          cleanPixels.data[offset] = Math.min(
            246,
            pixels[offset] * 1.32,
          );

          cleanPixels.data[offset + 1] = Math.min(
            243,
            pixels[offset + 1] * 1.32,
          );

          cleanPixels.data[offset + 2] = Math.min(
            226,
            pixels[offset + 2] * 1.28,
          );

          cleanPixels.data[offset + 3] = Math.min(
            255,
            (brightness - 28) * 4.2,
          );
        }
      }

      for (let y = 0; y < sample.height; y += step) {
        for (let x = 0; x < sample.width; x += step) {
          const offset = (y * sample.width + x) * 4;

          const brightness =
            (pixels[offset] +
              pixels[offset + 1] +
              pixels[offset + 2]) /
            3;

          if (brightness > 40) {
            particles.push({
              x,
              y,
              fromX: x + (Math.random() - 0.5) * 90 * ratio,
              fromY: -(20 + Math.random() * sample.height * 0.38),
              delay: Math.random() * 0.42,
              size: (0.65 + Math.random() * 1.25) * ratio,
              alpha: 0.45 + Math.random() * 0.55,
            });
          }
        }
      }

      const cleanTitle = document.createElement("canvas");
      cleanTitle.width = sample.width;
      cleanTitle.height = sample.height;

      cleanTitle
        .getContext("2d")
        .putImageData(cleanPixels, 0, 0);

      const draw = (progress) => {
        context.clearRect(0, 0, canvas.width, canvas.height);

        for (const particle of particles) {
          const localProgress = Math.min(
            1,
            Math.max(0, (progress - particle.delay) / 0.58),
          );

          const eased = 1 - Math.pow(1 - localProgress, 3);

          const x =
            particle.fromX +
            (particle.x - particle.fromX) * eased;

          const y =
            particle.fromY +
            (particle.y - particle.fromY) * eased;

          const particleFade =
            progress > 0.78
              ? Math.max(0, (1 - progress) / 0.22)
              : 1;

          context.globalAlpha =
            particle.alpha *
            Math.min(1, progress * 6) *
            particleFade;

          context.fillStyle = "#fff9dd";
          context.beginPath();
          context.arc(x, y, particle.size, 0, Math.PI * 2);
          context.fill();
        }

        if (progress > 0.48) {
          const blend = Math.min(
            1,
            (progress - 0.48) / 0.42,
          );

          const smoothBlend = blend * blend * (3 - 2 * blend);

          context.globalAlpha = smoothBlend;
          context.drawImage(cleanTitle, -1, 0);
          context.drawImage(cleanTitle, 1, 0);
          context.drawImage(cleanTitle, 0, -1);
          context.drawImage(cleanTitle, 0, 1);
          context.drawImage(cleanTitle, 0, 0);
        }

        context.globalAlpha = 1;
      };

      drawRef.current = draw;
      draw(0);
    };

    return () => {
      image.onload = null;
      drawRef.current = () => {};
    };
  }, [drawRef]);

  return (
    <div className="ever-title">
      <canvas
        ref={canvasRef}
        className="ever-title-particles"
        role="img"
        aria-label="Ever After — A new fairy tale role-play experience"
      />
    </div>
  );
}

export default function BannerReveal() {
  const root = useRef(null);
  const timeline = useRef(null);
  const drawTitle = useRef(() => {});

  const cloth = useClothExit(root);

  useGsap(() => {
    const shells = gsap.utils.toArray(".banner-shell");

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      gsap.set(shells, { yPercent: -125 });

      gsap.set(
        ".ever-final, .ever-ui, .experience-hotspot, .final-headline",
        { autoAlpha: 1 },
      );

      gsap.set(".ever-opening", { autoAlpha: 0 });
      return;
    }

    gsap.set(shells, { "--fold": "100%" });
    gsap.set(".banner-roller", { autoAlpha: 0 });

    const titleProgress = { value: 0 };

    cloth.state.current.forEach((item) => {
      item.progress = 0;
    });

    cloth.draw.current();

    timeline.current = gsap
      .timeline({
        defaults: { ease: "none" },

        onUpdate: () => {
          cloth.draw.current();
        },

        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=520%",
          pin: ".ever-stage",
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      .fromTo(
        ".ever-stars",
        { opacity: 0.05 },
        { opacity: 0.72, duration: 0.12 },
        0,
      )

      .to(
        titleProgress,
        {
          value: 1,
          duration: 0.23,
          ease: "none",
          onUpdate: () => {
            drawTitle.current(titleProgress.value);
          },
        },
        0,
      )

      .fromTo(
        ".ever-spark",
        {
          scale: 0,
          opacity: 0,
          y: "-28vh",
        },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          stagger: 0.004,
          duration: 0.12,
          ease: "power1.out",
        },
        0.01,
      )

      .fromTo(
        ".ever-tree-art",
        {
          clipPath: "inset(0 0 100% 0)",
          opacity: 0,
        },
        {
          clipPath: "inset(0 0 0% 0)",
          opacity: 1,
          duration: 0.18,
          ease: "power1.inOut",
        },
        0.015,
      )

      .to(
        ".ever-scroll",
        {
          autoAlpha: 0,
          duration: 0.025,
          ease: "power1.out",
        },
        0.005,
      )

      .to(
        ".banner-roller",
        {
          autoAlpha: 1,
          duration: 0.02,
        },
        0.23,
      )

      .to(
        shells,
        {
          "--fold": "0%",
          duration: 0.3,
          ease: "power1.inOut",
        },
        0.23,
      )

      .to(
        ".ever-tree-art, .ever-title, .ever-stars, .ever-sparks",
        {
          opacity: 0,
          duration: 0.3,
          ease: "power1.inOut",
        },
        0.23,
      )

      .to(
        ".banner-roller",
        {
          autoAlpha: 0,
          duration: 0.015,
        },
        0.515,
      )

      .to(
        ".banner-field",
        {
          scale: 1.68,
          columnGap: 0,
          duration: 0.32,
          ease: "power1.inOut",
        },
        0.56,
      )

      .fromTo(
        ".ever-final",
        {
          autoAlpha: 0,
          scale: 1.025,
        },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.24,
          ease: "power1.inOut",
        },
        0.87,
      )

      // Cloth exit replaces the old rigid rotationX / z tween.
      .to(
        cloth.state.current,
        {
          progress: 1,
          stagger: {
            each: 0.032,
            from: "start",
          },
          duration: 0.22,
          ease: "none",
        },
        0.88,
      )

      // Ease the zoom back to the banners' original scale while the cloth
      // folds away. This keeps the retreat from feeling oversized.
      .to(
        ".banner-field",
        {
          scale: 1,
          columnGap: "1.7vw",
          duration: 0.25,
          ease: "power2.inOut",
        },
        0.88,
      )

      .to(
        ".skip-button",
        {
          autoAlpha: 0,
          duration: 0.015,
        },
        1.2,
      )

      .fromTo(
        ".final-headline",
        { autoAlpha: 0, y: 36, filter: "blur(3px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.12, ease: "power2.out" },
        1.08,
      )

      .fromTo(
        ".experience-hotspot",
        {
          autoAlpha: 0,
          scale: 0.8,
        },
        {
          autoAlpha: 1,
          scale: 1,
          stagger: 0.025,
          duration: 0.09,
        },
        1.2,
      )

      .fromTo(
        ".ever-ui",
        {
          autoAlpha: 0,
          y: -24,
          scaleX: 0.97,
        },
        {
          autoAlpha: 1,
          y: 0,
          scaleX: 1,
          duration: 0.16,
          ease: "power2.out",
        },
        1.2,
      );
  }, root);

  const skip = () => {
    const trigger = timeline.current?.scrollTrigger;

    if (trigger) {
      window.scrollTo({
        top: trigger.end,
        behavior: "smooth",
      });
    }
  };

  return (
    <main ref={root} className="ever-page">
      {/* Additional styles stay inside this same component file. */}
      <style>{`
        .ever-page .banner-cloth-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          pointer-events: none;
          z-index: 3;
        }

        .ever-page .banner-shell.is-cloth-exiting > .banner-fabric,
        .ever-page .banner-shell.is-cloth-exiting > .banner-roller {
          visibility: hidden !important;
        }
      `}</style>

      <section className="ever-stage">
        <div className="ever-opening" aria-hidden="true">
          <div className="ever-stars" />

          <div className="ever-sparks">
            {Array.from({ length: 28 }, (_, index) => (
              <i
                className="ever-spark"
                key={index}
                style={{
                  "--x": `${8 + ((index * 37) % 78)}%`,
                  "--y": `${8 + ((index * 53) % 58)}%`,
                  "--delay": `${(index % 7) * -0.32}s`,
                }}
              />
            ))}
          </div>

          <img
            className="ever-tree-art"
            src="/concept-1/opening-tree.png"
            alt=""
          />

          <ParticleTitle drawRef={drawTitle} />

          <div className="ever-scroll">
            SCROLL
            <i />
          </div>
        </div>

        <div className="ever-final">
          <img
            src="/concept-1/final-scene-clean-v3.jpg"
            alt="Ever After immersive role-play experience at Grimm and Co"
          />

          <h1 className="final-headline">Explore our magical world</h1>

          <div className="experience-signs" aria-hidden="true">
            <img className="potions" src="/concept-1/sign-potions.png" alt="" />
            <img className="puzzles" src="/concept-1/sign-puzzles.png" alt="" />
            <img className="dressing" src="/concept-1/sign-dressing.png" alt="" />
          </div>

          <div className="experience-spots">
            {experiences.map((experience) => (
              <button
                className={`experience-hotspot ${experience.className}`}
                key={experience.name}
              >
                <span>
                  <b>{experience.name}</b>
                  {experience.detail}
                </span>
              </button>
            ))}
          </div>

        </div>

        <div className="banner-field" aria-hidden="true">
          {banners.map(({ file, className, height }) => (
            <div
              key={file}
              className={`banner-shell ${className}`}
              style={{
                "--banner-height": height,
              }}
            >
              <img
                className="banner-fabric"
                src={`/concept-1/optimized/${file}`}
                alt=""
              />

              <i className="banner-roller">
                <img
                  src={`/concept-1/optimized/${file}`}
                  alt=""
                />
              </i>
            </div>
          ))}
        </div>

        <header className="ever-ui">
          <strong>
            <span>&amp;</span> GRIMM &amp; CO
          </strong>

          <nav aria-label="Grimm and Co">
            <a href="#home">Home</a>

            <a className="active" href="#visit">
              Visit Us
            </a>

            <a href="#support">Support Us</a>
            <a href="#shop">Apothecary</a>
            <a href="#about">About Us</a>

            <button>Book Event</button>
          </nav>
        </header>

        <button className="skip-button" onClick={skip}>
          SKIP THE ENTRANCE
        </button>
      </section>
    </main>
  );
}
