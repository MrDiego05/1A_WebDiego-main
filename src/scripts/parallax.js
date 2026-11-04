/**
 * parallax.js
 * Advanced Multi-layer Parallax for Horizontal Scroll:
 * 1. Horizontal scroll-depth parallax: sketch moves at a slower rate than foreground text
 * 2. 3D cursor tracking with inertial lerp smoothing
 */

export function initParallax() {
  const sketchLayer = document.getElementById("hero-sketch-layer");
  const sketchImg = document.getElementById("hero-sketch-image");
  const heroSection = document.getElementById("inicio");
  const container = document.getElementById("main-horizontal-container");

  if (!sketchLayer || !heroSection) return;

  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId = null;

  // ── Mouse tracking with lerp smoothing ──────────────────
  function onMouseMove(e) {
    const rect = heroSection.getBoundingClientRect();
    // Only track when hero is in view
    if (rect.right < 0 || rect.left > window.innerWidth) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const nx = (e.clientX - centerX) / centerX;
    const ny = (e.clientY - centerY) / centerY;

    mouseX = nx * 24; // max 24px travel
    mouseY = ny * 18; // max 18px travel
  }

  // ── Animation Loop combining Mouse + Horizontal Scroll Parallax ─────
  function tick() {
    // Lerp smoothing (factor 0.08)
    currentX += (mouseX - currentX) * 0.08;
    currentY += (mouseY - currentY) * 0.08;

    // Horizontal depth parallax
    const scrollX = container ? container.scrollLeft : 0;
    const scrollOffset = scrollX * 0.22;

    if (sketchLayer) {
      sketchLayer.style.transform = `translate(calc(-50% + ${(currentX - scrollOffset).toFixed(2)}px), calc(-50% + ${currentY.toFixed(2)}px))`;
    }

    if (sketchImg) {
      // Subtle 3D tilt
      const rotY = (currentX * 0.22).toFixed(2);
      const rotX = (-currentY * 0.22).toFixed(2);
      sketchImg.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    }

    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener("mousemove", onMouseMove, { passive: true });
  tick();
}
