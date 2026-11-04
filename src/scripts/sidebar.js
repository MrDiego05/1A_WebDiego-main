/**
 * sidebar.js / a11y.js
 * Controls for accessibility, speech synthesis, font scaling and focus mode.
 */

let a11yPanelOpen = false;
let isSpeaking = false;
let speechChunks = [];
let currentSpeechChunk = 0;
let speechGeneration = 0;
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
function setSpeechStatus(message) {
  const status = document.getElementById("speech-status");
  if (status) status.textContent = message;
}

function resetSpeechButton() {
  speechGeneration += 1;
  isSpeaking = false;
  speechChunks = [];
  currentSpeechChunk = 0;

  const btn = document.getElementById("btn-toggle-speech");
  btn?.classList.remove("speaking");
  btn?.setAttribute("aria-pressed", "false");

  const icon = document.getElementById("speech-btn-icon");
  const text = document.getElementById("speech-btn-text");
  if (icon) icon.textContent = "▶";
  if (text) text.textContent = "Escuchar sección";
}

function splitSpeechText(text, maxLength = 220) {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks = [];
  let chunk = "";

  sentences.forEach((sentence) => {
    const normalized = sentence.trim();
    if (!normalized) return;

    normalized.split(/\s+/).forEach((word) => {
      if (word.length > maxLength) {
        if (chunk) chunks.push(chunk);
        chunk = "";
        for (let start = 0; start < word.length; start += maxLength) {
          chunks.push(word.slice(start, start + maxLength));
        }
        return;
      }

      const nextChunk = chunk ? `${chunk} ${word}` : word;
      if (nextChunk.length > maxLength) {
        chunks.push(chunk);
        chunk = word;
      } else {
        chunk = nextChunk;
      }
    });
  });

  if (chunk) chunks.push(chunk);
  return chunks;
}

function speakNextChunk(generation = speechGeneration) {
  if (generation !== speechGeneration) return;
  if (!isSpeaking || currentSpeechChunk >= speechChunks.length) {
    resetSpeechButton();
    setSpeechStatus("Lectura finalizada.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(
    speechChunks[currentSpeechChunk]
  );
  const voices = window.speechSynthesis.getVoices();
  const spanishVoice = voices.find((voice) =>
    /^es(?:-|$)/i.test(voice.lang)
  );

  utterance.lang = spanishVoice?.lang || "es-ES";
  if (spanishVoice) utterance.voice = spanishVoice;
  utterance.rate = speechRate;
  utterance.pitch = speechPitch;
  utterance.onend = () => {
    if (generation !== speechGeneration) return;
    currentSpeechChunk += 1;
    speakNextChunk(generation);
  };
  utterance.onerror = (event) => {
    if (generation !== speechGeneration) return;
    if (event.error === "canceled" || event.error === "interrupted") {
      resetSpeechButton();
      return;
    }

    resetSpeechButton();
    const message = event.error === "voice-unavailable" ||
        window.speechSynthesis.getVoices().length === 0
      ? "No hay voces instaladas o disponibles en este navegador. Activa una voz en español en la configuración de accesibilidad del sistema y vuelve a intentarlo."
      : event.error === "not-allowed"
        ? "El navegador bloqueó la lectura. Vuelve a pulsar Escuchar sección para permitir el audio."
        : "No se pudo reproducir la voz. Comprueba el audio del dispositivo e inténtalo de nuevo.";
    setSpeechStatus(message);
  };

  window.speechSynthesis.speak(utterance);
}

window.toggleSpeech = function () {
  if (
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    setSpeechStatus("Este navegador no es compatible con la lectura por voz.");
    return;
  }

  if (isSpeaking) {
    window.speechSynthesis.cancel();
    resetSpeechButton();
    setSpeechStatus("Lectura detenida.");
    return;
  }

  const section = getCurrentSection();
  const readableText = section?.innerText || "";
  speechChunks = splitSpeechText(readableText);
  currentSpeechChunk = 0;
  if (!speechChunks.length) {
    setSpeechStatus("No se encontró texto para leer en esta sección.");
    return;
  }

  speechGeneration += 1;
  isSpeaking = true;
  const btn = document.getElementById("btn-toggle-speech");
  const icon = document.getElementById("speech-btn-icon");
  const text = document.getElementById("speech-btn-text");
  if (btn) {
    btn.classList.add("speaking");
    btn.setAttribute("aria-pressed", "true");
  }
  if (icon) icon.textContent = "⏹";
  if (text) text.textContent = "Detener lectura";
  setSpeechStatus(
    window.speechSynthesis.getVoices().length
      ? "Lectura en curso."
      : "Intentando usar la voz predeterminada del dispositivo."
  );
  speakNextChunk(speechGeneration);
};

window.updateSpeechRate = function (value) {
  speechRate = Math.min(1.8, Math.max(0.5, parseFloat(value) || 1));
  const rateOutput = document.getElementById("speech-rate-value");
  if (rateOutput) rateOutput.textContent = `${speechRate.toFixed(1)}x`;
  if (isSpeaking) {
    const section = getCurrentSection();
    speechChunks = splitSpeechText(section?.innerText || "");
    currentSpeechChunk = 0;
    speechGeneration += 1;
    window.speechSynthesis.cancel();
    speakNextChunk(speechGeneration);
  }
};

window.updateSpeechSettings = function () {
  const speedSelect = document.getElementById("a11y-speech-speed");
  const pitchSelect = document.getElementById("a11y-speech-pitch");
  if (speedSelect) speechRate = parseFloat(speedSelect.value) || 1;
  if (pitchSelect) speechPitch = parseFloat(pitchSelect.value) || 1;
  if (isSpeaking) {
    const section = getCurrentSection();
    speechChunks = splitSpeechText(section?.innerText || "");
    currentSpeechChunk = 0;
    speechGeneration += 1;
    window.speechSynthesis.cancel();
    speakNextChunk(speechGeneration);
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
  document
    .getElementById("btn-toggle-speech")
    ?.addEventListener("click", window.toggleSpeech);

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
