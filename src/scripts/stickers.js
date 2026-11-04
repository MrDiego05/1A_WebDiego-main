/**
 * stickers.js
 * Enables smooth pointer dragging for stickers anchored inside sections (absolute coordinates)
 */

export function initDraggableStickers() {
  const stickers = document.querySelectorAll("[data-sticker]");

  stickers.forEach((sticker) => {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    function onPointerDown(e) {
      isDragging = true;
      sticker.classList.add("is-dragging");

      const parent = sticker.parentElement;
      const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };
      const rect = sticker.getBoundingClientRect();

      initialLeft = rect.left - parentRect.left;
      initialTop = rect.top - parentRect.top;

      startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      const dx = currentX - startX;
      const dy = currentY - startY;

      sticker.style.left = `${initialLeft + dx}px`;
      sticker.style.top = `${initialTop + dy}px`;
      sticker.style.right = "auto";
      sticker.style.bottom = "auto";
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      sticker.classList.remove("is-dragging");

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    }

    sticker.addEventListener("pointerdown", onPointerDown);
  });
}
