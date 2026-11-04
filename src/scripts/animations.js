/**
 * animations.js
 * Cinematic Intro Sequence & Movement Animations:
 * 1. Sketch portrait progressive reveal (fade-in + zoom 0.94 -> 1.0 + blur clearance)
 * 2. Staggered typography reveal (Hey Soy, Diego Vizueta, bio, CTA)
 * 3. Top nav & bottom bar sliding in from edges
 * 4. Horizontal scroll inertia & micro-movements
 */

import { gsap } from "gsap";

export function initIntroAnimation() {
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("a11y-reduce-motion")
  ) {
    return;
  }

  const sketchLayer = document.getElementById("hero-sketch-layer");
  const navContainer = document.getElementById("nav-container");
  const bottomBar = document.getElementById("floating-bottom-bar");
  const eyebrow = document.querySelector(".hero-eyebrow");
  const name = document.querySelector(".hero-name");
  const desc = document.querySelector(".hero-desc");
  const cta = document.getElementById("hero-btn-disponible");
  const cornerArrow = document.querySelector(".hero-corner-arrow");

  // Initial states
  if (sketchLayer) gsap.set(sketchLayer, { opacity: 0, scale: 0.94, filter: "blur(18px)" });
  if (navContainer) gsap.set(navContainer, { opacity: 0, y: -70 });
  if (bottomBar) gsap.set(bottomBar, { opacity: 0, y: 70 });
  if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 25 });
  if (name) gsap.set(name, { opacity: 0, y: 35, skewX: -4 });
  if (desc) gsap.set(desc, { opacity: 0, y: 25 });
  if (cta) gsap.set(cta, { opacity: 0, scale: 0.85, y: 20 });
  if (cornerArrow) gsap.set(cornerArrow, { opacity: 0, scale: 0.5, rotate: -45 });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  // 1. Central sketch portrait reveal with zoom 0.94 -> 1.0 and unblur
  if (sketchLayer) {
    tl.to(sketchLayer, {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: 1.3,
      ease: "power2.out",
    });
  }

  // 2. Top Nav slides down & Bottom bar slides up
  if (navContainer) {
    tl.to(navContainer, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: "back.out(1.2)",
    }, "-=0.6");
  }

  if (bottomBar) {
    tl.to(bottomBar, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: "back.out(1.2)",
    }, "-=0.6");
  }

  // 3. Staggered typography and CTA button reveal
  const introTargets = [eyebrow, name, desc, cta, cornerArrow].filter(Boolean);
  if (introTargets.length) {
    tl.to(introTargets, {
      opacity: 1,
      y: 0,
      scale: 1,
      skewX: 0,
      rotate: 0,
      stagger: 0.12,
      duration: 0.65,
      ease: "power3.out",
    }, "-=0.3");
  }

  return tl;
}

// ─────────────────────────────────────────────
//  HORIZONTAL SCROLL INERTIA ANIMATION
// ─────────────────────────────────────────────
export function initScrollAnimations() {
  const container = document.getElementById("main-horizontal-container");
  if (!container) return;

  let lastScrollLeft = container.scrollLeft;
  let scrollSpeed = 1;
  let ticking = false;

  container.addEventListener("scroll", () => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("a11y-reduce-motion")
    ) {
      return;
    }

    const currentScrollLeft = container.scrollLeft;
    scrollSpeed = currentScrollLeft - lastScrollLeft;
    lastScrollLeft = currentScrollLeft;

    if (!ticking) {
      window.requestAnimationFrame(() => {
        // Clamp skew angle between -2.5 and 2.5 deg
        const skewAngle = Math.max(-2.0, Math.min(2.5, scrollSpeed * 0.05));

        document.querySelectorAll(".mockup-window").forEach((el) => {
          gsap.to(el, {
            skewX: -skewAngle,
            duration: 0.25,
            ease: "power1.out",
            overwrite: "auto",
          });
        });

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}
