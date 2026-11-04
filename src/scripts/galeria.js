/**
 * galeria.js — Dynamic project filtering by category.
 * Keeps the UI, aria-pressed state and live count in sync.
 */

export function initGaleria() {
  const grid = document.getElementById("galeria-proyectos-grid");
  const filters = Array.from(document.querySelectorAll(".filter-btn"));
  const count = document.getElementById("galeria-count");
  const empty = document.getElementById("galeria-empty");
  if (!grid || !filters.length) return;

  const cards = Array.from(grid.querySelectorAll(".proyecto-card"));

  function applyFilter(filter, announceChange = true) {
    let visible = 0;

    cards.forEach((card) => {
      const categories = (card.getAttribute("data-categories") || "")
        .split(/\s+/)
        .filter(Boolean);
      const matches = filter === "todos" || categories.includes(filter);
      card.hidden = !matches;
      card.classList.toggle("is-hidden", !matches);
      if (matches) visible += 1;
    });

    filters.forEach((button) => {
      const isActive = button.getAttribute("data-filter") === filter;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (count) {
      count.textContent = `Mostrando ${visible} de ${cards.length} proyectos`;
    }
    if (empty) {
      empty.hidden = visible !== 0;
    }

    if (announceChange) {
      const activeButton = filters.find(
        (button) => button.getAttribute("data-filter") === filter
      );
    }
  }

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.getAttribute("data-filter") || "todos");
    });
  });

  applyFilter("todos", false);
}
