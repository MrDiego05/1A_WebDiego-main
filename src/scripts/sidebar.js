/**
 * sidebar.js / a11y.js
 * Controls for accessibility, speech synthesis, font scaling and focus mode.
 */

let a11yPanelOpen = false;
let isSpeaking = false;
let currentUtterance = null;
let speechRate = 1;
let speechPitch = 1;
let readingGuideActive = false;

const FONT_SCALES = [100, 115, 130];
const DEFAULT_FONT_SCALE = 100;

function announce(message) {
  const region = document.getElementById("section-announcer");
  if (!region) return;
  region.textContent = "";
  window.setTimeout(() => {
    region.textContent = message;
  }, 30);
}

function getCurrentSection() {
  const container = document.getElementById("main-horizontal-container");
  if (!container) return null;

  const sections = Array.from(document.querySelectorAll(".snap-section"));
  if (!sections.length) return null;

  const center = container.scrollLeft + container.clientWidth / 2;
  let current = sections[0];
  let minDistance = Infinity;

  sections.forEach((section) => {
    const sectionCenter = section.offsetLeft + section.offsetWidth / 2;
    const distance = Math.abs(sectionCenter - center);
    if (distance < minDistance) {
      minDistance = distance;
      current = section;
    }
  });

  return current;
}

function getStored(key, fallback = null) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    /* Storage may be unavailable in private mode. */
  }
}

// ── Immediate global definitions ─────────────────────────
window.toggleDark = function () {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  setStored("theme", next);
};

window.toggleA11yPanel = function () {
  const panel = document.getElementById("a11y-advanced-panel");
  const topBtn = document.getElementById("sidebar-a11y-toggle");
  const bottomBtn = document.getElementById("bottom-a11y-toggle");
  if (!panel) return;

  a11yPanelOpen = !a11yPanelOpen;
  panel.hidden = !a11yPanelOpen;

  topBtn?.setAttribute("aria-expanded", String(a11yPanelOpen));
  bottomBtn?.setAttribute("aria-expanded", String(a11yPanelOpen));


  if (a11yPanelOpen) {
    panel.querySelector(".a11y-panel-close")?.focus();
  } else {
    topBtn?.focus();
  }
};

function applyFontScale(scale, announceChange = true) {
  const nextScale = FONT_SCALES.includes(Number(scale))
    ? Number(scale)
    : DEFAULT_FONT_SCALE;

  document.documentElement.setAttribute("data-font-scale", String(nextScale));
  document.documentElement.style.fontSize = `${(16 * nextScale) / 100}px`;
  setStored("a11y-font-scale", String(nextScale));

  document.querySelectorAll("button[data-font-scale]").forEach((button) => {
    const isActive = Number(button.getAttribute("data-font-scale")) === nextScale;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  const display = document.getElementById("font-size-display");
  if (display) display.textContent = `${nextScale}%`;

  if (announceChange) {
    announce(`Tamaño de fuente al ${nextScale}%`);
  }
}

window.setFontScale = function (scale) {
  applyFontScale(scale, true);
};

window.resetFontSize = function () {
  applyFontScale(DEFAULT_FONT_SCALE, true);
};

window.adjustFontSize = function (direction) {
  const current = Number(
    document.documentElement.getAttribute("data-font-scale") || DEFAULT_FONT_SCALE
  );
  const index = FONT_SCALES.indexOf(current);
  const nextIndex = Math.max(
    0,
    Math.min(FONT_SCALES.length - 1, index + (direction > 0 ? 1 : -1))
  );
  applyFontScale(FONT_SCALES[nextIndex], true);
};

window.toggleHighContrast = function () {
  const isActive = document.documentElement.classList.toggle("a11y-high-contrast");
  setStored("a11y-high-contrast", isActive ? "on" : "off");

  document.querySelectorAll("[data-contrast-toggle]").forEach((button) => {
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    const label = button.querySelector("[data-contrast-label]");
    if (label) {
      label.textContent = isActive
        ? "Alto Contraste Activado"
        : "Activar Alto Contraste";
    }
  });

  const legacyLabel = document.getElementById("contrast-label");
  if (legacyLabel) {
    legacyLabel.textContent = isActive
      ? "Alto Contraste Activado"
      : "Activar Alto Contraste";
  }

  announce(isActive ? "Alto contraste activado" : "Alto contraste desactivado");
};

window.toggleReducedMotion = function () {
  const isActive = document.documentElement.classList.toggle("a11y-reduce-motion");
  setStored("a11y-reduce-motion", isActive ? "on" : "off");

  document.querySelectorAll("[data-motion-toggle]").forEach((button) => {
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    const label = button.querySelector("[data-motion-label]");
    if (label) {
      label.textContent = isActive
        ? "Animaciones Reducidas"
        : "Reducir Movimiento";
    }
  });

  announce(
    isActive ? "Animaciones reducidas activadas" : "Animaciones reducidas desactivadas"
  );
};

window.toggleDyslexiaFont = function () {
  const isActive = document.documentElement.classList.toggle("a11y-dyslexia");
  setStored("a11y-dyslexia", isActive ? "on" : "off");

  document.querySelectorAll("[data-dyslexia-toggle]").forEach((button) => {
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    const label = button.querySelector("[data-dyslexia-label]");
    if (label) {
      label.textContent = isActive
        ? "Fuente Dislexia Activada"
        : "Activar OpenDyslexic";
    }
  });

  const legacyLabel = document.getElementById("dyslexia-label");
  if (legacyLabel) {
    legacyLabel.textContent = isActive
      ? "Fuente Dislexia Activada"
      : "Activar OpenDyslexic";
  }

};

window.toggleFocusMode = function () {
  const isActive = document.body.classList.toggle("focus-mode-active");
  const btn = document.getElementById("btn-focus-mode");
  const label = document.getElementById("focus-mode-label");
  if (btn) {
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  }
  if (label) {
    label.textContent = isActive
      ? "Modo Enfoque Activado"
      : "Activar Modo Enfoque";
  }
};

window.toggleGrayscale = function () {
  const isActive = document.documentElement.classList.toggle("a11y-grayscale");
  setStored("a11y-grayscale", isActive ? "on" : "off");
  const btn = document.getElementById("btn-grayscale");
  if (btn) {
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  }
};

window.toggleReadingGuide = function () {
  const guide = document.getElementById("a11y-reading-guide");
  if (!guide) return;

  readingGuideActive = !readingGuideActive;
  guide.hidden = !readingGuideActive;
  guide.setAttribute("aria-hidden", String(!readingGuideActive));

  const btn = document.getElementById("btn-reading-guide");
  if (btn) {
    btn.classList.toggle("active", readingGuideActive);
    btn.setAttribute("aria-pressed", String(readingGuideActive));
  }
};

window.resetAllA11y = function () {
  document.documentElement.classList.remove(
    "a11y-high-contrast",
    "a11y-reduce-motion",
    "a11y-dyslexia",
    "a11y-grayscale"
  );
  document.body.classList.remove("focus-mode-active");
  setStored("a11y-high-contrast", "off");
  setStored("a11y-reduce-motion", "off");
  setStored("a11y-dyslexia", "off");
  setStored("a11y-grayscale", "off");
  applyFontScale(DEFAULT_FONT_SCALE, false);

  document
    .querySelectorAll("[data-contrast-toggle], [data-motion-toggle], [data-dyslexia-toggle]")
    .forEach((button) => {
      button.classList.remove("active");
      button.setAttribute("aria-pressed", "false");
      const contrastLabel = button.querySelector("[data-contrast-label]");
      if (contrastLabel) contrastLabel.textContent = "Activar Alto Contraste";
      const motionLabel = button.querySelector("[data-motion-label]");
      if (motionLabel) motionLabel.textContent = "Reducir Movimiento";
      const dyslexiaLabel = button.querySelector("[data-dyslexia-label]");
      if (dyslexiaLabel) dyslexiaLabel.textContent = "Activar OpenDyslexic";
    });

  const grayscaleBtn = document.getElementById("btn-grayscale");
  grayscaleBtn?.classList.remove("active");
  grayscaleBtn?.setAttribute("aria-pressed", "false");

  const focusBtn = document.getElementById("btn-focus-mode");
  focusBtn?.classList.remove("active");
  focusBtn?.setAttribute("aria-pressed", "false");
  const focusLabel = document.getElementById("focus-mode-label");
  if (focusLabel) focusLabel.textContent = "Activar Modo Enfoque";

  const readingGuide = document.getElementById("a11y-reading-guide");
  if (readingGuide) readingGuide.hidden = true;
  readingGuideActive = false;
  const readingGuideBtn = document.getElementById("btn-reading-guide");
  readingGuideBtn?.classList.remove("active");
  readingGuideBtn?.setAttribute("aria-pressed", "false");

  announce("Preferencias de accesibilidad restablecidas");
};

// ── Speech Synthesis ────────────────────────────────────
window.toggleSpeech = function () {
  if (!("speechSynthesis" in window)) {
    alert("Tu navegador no soporta el sintetizador de voz (Speech Synthesis).");
    return;
  }

  const btn = document.getElementById("btn-toggle-speech");
  const icon = document.getElementById("speech-btn-icon");
  const text = document.getElementById("speech-btn-text");

  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    if (btn) {
      btn.classList.remove("speaking");
      btn.setAttribute("aria-pressed", "false");
    }
    if (icon) icon.textContent = "▶";
    if (text) text.textContent = "Escuchar sección";
    return;
  }

  const section = getCurrentSection();
  const container = document.getElementById("main-horizontal-container");
  const readableText = section?.innerText || container?.innerText || "";
  if (!readableText.trim()) return;

  currentUtterance = new SpeechSynthesisUtterance(readableText);
  currentUtterance.lang = "es-ES";
  currentUtterance.rate = speechRate;
  currentUtterance.pitch = speechPitch;

  currentUtterance.onend = () => {
    isSpeaking = false;
    if (btn) {
      btn.classList.remove("speaking");
      btn.setAttribute("aria-pressed", "false");
    }
    if (icon) icon.textContent = "▶";
    if (text) text.textContent = "Escuchar sección";
  };

  currentUtterance.onerror = () => {
    isSpeaking = false;
    if (btn) {
      btn.classList.remove("speaking");
      btn.setAttribute("aria-pressed", "false");
    }
    if (icon) icon.textContent = "▶";
    if (text) text.textContent = "Escuchar sección";
  };

  window.speechSynthesis.speak(currentUtterance);
  isSpeaking = true;
  if (btn) {
    btn.classList.add("speaking");
    btn.setAttribute("aria-pressed", "true");
  }
  if (icon) icon.textContent = "⏹";
  if (text) text.textContent = "Detener lectura";
};

window.updateSpeechRate = function (value) {
  speechRate = Math.min(1.8, Math.max(0.5, parseFloat(value) || 1));
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    window.toggleSpeech();
  }
};

window.updateSpeechSettings = function () {
  const speedSelect = document.getElementById("a11y-speech-speed");
  const pitchSelect = document.getElementById("a11y-speech-pitch");
  if (speedSelect) speechRate = parseFloat(speedSelect.value) || 1;
  if (pitchSelect) speechPitch = parseFloat(pitchSelect.value) || 1;
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    window.toggleSpeech();
  }
};

function initReadingGuide() {
  const guide = document.getElementById("a11y-reading-guide");
  if (!guide) return;

  document.addEventListener(
    "pointermove",
    (event) => {
      if (!readingGuideActive) return;
      guide.style.top = `${event.clientY}px`;
    },
    { passive: true }
  );
}

export function initSidebar() {
  // ── Restore persisted preferences ───────────────────────
  const savedTheme = getStored("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  const savedScale = getStored("a11y-font-scale", String(DEFAULT_FONT_SCALE));
  applyFontScale(savedScale, false);

  if (getStored("a11y-high-contrast") === "on") {
    document.documentElement.classList.add("a11y-high-contrast");
    document
      .querySelectorAll("[data-contrast-toggle]")
      .forEach((button) => {
        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");
      });
  }

  if (getStored("a11y-reduce-motion") === "on") {
    document.documentElement.classList.add("a11y-reduce-motion");
    document
      .querySelectorAll("[data-motion-toggle]")
      .forEach((button) => {
        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");
      });
  }

  if (getStored("a11y-dyslexia") === "on") {
    document.documentElement.classList.add("a11y-dyslexia");
    document
      .querySelectorAll("[data-dyslexia-toggle]")
      .forEach((button) => {
        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");
      });
  }

  if (getStored("a11y-grayscale") === "on") {
    document.documentElement.classList.add("a11y-grayscale");
    const grayscaleBtn = document.getElementById("btn-grayscale");
    grayscaleBtn?.classList.add("active");
    grayscaleBtn?.setAttribute("aria-pressed", "true");
  }

  // Bind controls from JavaScript instead of relying on inline handlers. This
  // is reliable for Astro's module scripts and avoids a missing global handler
  // disabling the navigation controls.
  document
    .getElementById("sidebar-dark-toggle")
    ?.addEventListener("click", window.toggleDark);
  document
    .getElementById("sidebar-a11y-toggle")
    ?.addEventListener("click", window.toggleA11yPanel);

  // ── Font scale buttons ──────────────────────────────────
  document.querySelectorAll("button[data-font-scale]").forEach((button) => {
    button.addEventListener("click", () => {
      window.setFontScale(button.getAttribute("data-font-scale"));
    });
  });

  // ── Close A11y Panel on Escape / click outside ──────────
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && a11yPanelOpen) {
      window.toggleA11yPanel();
    }
  });

  document.addEventListener("click", (event) => {
    if (!a11yPanelOpen) return;
    const panel = document.getElementById("a11y-advanced-panel");
    const toggle = document.getElementById("sidebar-a11y-toggle");
    if (
      panel &&
      !panel.contains(event.target) &&
      toggle &&
      !toggle.contains(event.target)
    ) {
      window.toggleA11yPanel();
    }
  });

  initReadingGuide();
}
