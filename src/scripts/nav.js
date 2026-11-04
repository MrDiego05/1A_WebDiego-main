/**
 * nav.js
 * Navigation, page-switching, dark-mode, and scroll-spy for the floating capsule nav
 */

export function initNav() {
  // ── Page switching ──────────────────────────────────────
  const mainSite = document.getElementById("main-site");
  const galeriaPage = document.getElementById("galeria-page");

  window.showGaleria = function (e) {
    if (e) e.preventDefault();
    mainSite?.classList.add("hidden");
    galeriaPage?.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.showMain = function () {
    mainSite?.classList.remove("hidden");
    galeriaPage?.classList.remove("active");
  };

  // ── Dark mode ───────────────────────────────────────────
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  window.toggleDark = function () {
    const root = document.documentElement;
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  // ── Gallery filter buttons ───────────────────────────────
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // ── Scroll-spy nav pill active highlight ────────────────
  const sections = document.querySelectorAll("section[id]");
  const navPills = document.querySelectorAll("a.nav-pill[href^='#']");

  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navPills.forEach((link) => {
            const href = link.getAttribute("href");
            const isActive = href === `#${id}`;
            link.classList.toggle("scroll-active", isActive);
            if (isActive) {
              link.setAttribute("aria-current", "page");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        }
      });
    },
    { threshold: 0.35 }
  );

  sections.forEach((s) => spyObserver.observe(s));
}
