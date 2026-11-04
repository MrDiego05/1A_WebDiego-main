import onnxWasmUrl from "onnxruntime-web/ort-wasm-simd-threaded.wasm?url";

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
let speechEngine = null;
let speechEngineVoice = null;
let speechEngineLoading = null;
let speechAudioContext = null;
let speechAudioSource = null;
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
    prepareSpeechVoice();
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
const LOCAL_SPEECH_VOICES = {
  "es_ES-carlfm-x_low": {
    file: "es_ES-carlfm-x_low.onnx",
  },
  "es_ES-davefx-medium": {
    file: "es_ES-davefx-medium.onnx",
  },
};

function setSpeechStatus(message) {
  const status = document.getElementById("speech-status");
  if (status) status.textContent = message;
}

function updateSpeechButton(speaking) {
  const btn = document.getElementById("btn-toggle-speech");
  btn?.classList.toggle("speaking", speaking);
  btn?.setAttribute("aria-pressed", String(speaking));

  const icon = document.getElementById("speech-btn-icon");
  const text = document.getElementById("speech-btn-text");
  if (icon) icon.textContent = speaking ? "■" : "▶";
  if (text) text.textContent = speaking ? "Detener lectura" : "Escuchar sección";

  const voiceSelect = document.getElementById("speech-voice");
  if (voiceSelect) voiceSelect.disabled = speaking;
}

function resetSpeechButton() {
  speechGeneration += 1;
  isSpeaking = false;
  speechChunks = [];
  currentSpeechChunk = 0;
  updateSpeechButton(false);
}

function splitSpeechText(text, maxLength = 100) {
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

async function loadLocalSpeechEngine(voiceId, generation) {
  if (speechEngine && speechEngineVoice === voiceId) return speechEngine;

  if (speechEngineLoading) {
    const pending = speechEngineLoading;
    const engine = await pending.promise;
    if (!speechEngine) {
      speechEngine = engine;
      speechEngineVoice = pending.voiceId;
    }

    if (generation !== speechGeneration) return null;
    if (speechEngineVoice === voiceId) return speechEngine;

    speechEngine.dispose();
    speechEngine = null;
    speechEngineVoice = null;
  } else if (speechEngine) {
    speechEngine.dispose();
    speechEngine = null;
    speechEngineVoice = null;
  }

  const voice = LOCAL_SPEECH_VOICES[voiceId];
  if (!voice) throw new Error("Selecciona una voz en español disponible.");

  const pending = {
    voiceId,
    promise: Promise.all([
      import("piper-plus"),
      import("onnxruntime-web/wasm"),
    ]).then(async ([{ PiperPlus }, ort]) => {
      ort.env.wasm.wasmPaths = { wasm: onnxWasmUrl };
      const modelUrl = new URL(
        `/models/tts/${voice.file}`,
        window.location.origin
      ).href;
      const engine = await PiperPlus.initialize({
        model: modelUrl,
        ort,
        onProgress: ({ stage, progress }) => {
          if (generation !== speechGeneration) return;
          if (stage === "phonemizer") {
            setSpeechStatus("Preparando lectura en español…");
          } else if (stage === "model") {
            setSpeechStatus(
              `Cargando voz local (${Math.round(progress * 100)}%)…`
            );
          }
        },
      });
      // The Spanish-only Piper models have no language-ID input. This map
      // restricts G2P to Spanish during setup; remove it before inference.
      delete engine.config.language_id_map;
      return engine;
    }),
  };
  speechEngineLoading = pending;

  try {
    const engine = await pending.promise;
    if (!speechEngine) {
      speechEngine = engine;
      speechEngineVoice = voiceId;
    }
    if (generation !== speechGeneration) return null;
    if (speechEngineVoice !== voiceId) {
      return loadLocalSpeechEngine(voiceId, generation);
    }
    return speechEngine;
  } finally {
    if (speechEngineLoading === pending) speechEngineLoading = null;
  }
}

function prepareSpeechVoice() {
  const voiceId = document.getElementById("speech-voice")?.value;
  if (!voiceId || !LOCAL_SPEECH_VOICES[voiceId]) return;

  const generation = speechGeneration;
  if (speechEngine && speechEngineVoice === voiceId) {
    setSpeechStatus("Voz local lista.");
    return;
  }

  setSpeechStatus("Preparando la voz local para que la lectura empiece antes…");
  loadLocalSpeechEngine(voiceId, generation)
    .then((engine) => {
      if (engine && generation === speechGeneration && !isSpeaking) {
        setSpeechStatus("Voz local lista. Pulsa Escuchar sección.");
      }
    })
    .catch((error) => {
      if (generation !== speechGeneration) return;
      console.error("No se pudo preparar la voz local.", error);
      setSpeechStatus("No se pudo preparar la voz local. Vuelve a intentarlo.");
    });
}

async function playSpeechAudio(audio, generation) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Este navegador no es compatible con la reproducción de audio.");
  }

  if (!speechAudioContext) speechAudioContext = new AudioContextClass();
  if (speechAudioContext.state === "suspended") {
    await speechAudioContext.resume();
  }
  if (generation !== speechGeneration) return;

  const buffer = speechAudioContext.createBuffer(
    1,
    audio.samples.length,
    audio.sampleRate
  );
  buffer.copyToChannel(audio.samples, 0);

  const source = speechAudioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(speechAudioContext.destination);
  speechAudioSource = source;

  await new Promise((resolve, reject) => {
    source.onended = () => {
      if (speechAudioSource === source) speechAudioSource = null;
      resolve();
    };
    try {
      source.start();
    } catch (error) {
      if (speechAudioSource === source) speechAudioSource = null;
      reject(error);
    }
  });
}

async function speakNextChunk(generation = speechGeneration, voiceId) {
  if (generation !== speechGeneration) return;
  if (!isSpeaking || currentSpeechChunk >= speechChunks.length) {
    resetSpeechButton();
    setSpeechStatus("Lectura finalizada.");
    return;
  }

  try {
    const engine = await loadLocalSpeechEngine(voiceId, generation);
    if (generation !== speechGeneration || !engine) return;
    setSpeechStatus(
      `Generando audio: fragmento ${currentSpeechChunk + 1} de ${speechChunks.length}…`
    );
    const audio = await engine.synthesize(speechChunks[currentSpeechChunk], {
      language: "es",
      lengthScale: 1 / speechRate,
    });
    if (generation !== speechGeneration) return;
    setSpeechStatus(
      `Reproduciendo fragmento ${currentSpeechChunk + 1} de ${speechChunks.length}.`
    );
    await playSpeechAudio(audio, generation);
    if (generation !== speechGeneration) return;
    currentSpeechChunk += 1;
    await speakNextChunk(generation, voiceId);
  } catch (error) {
    if (generation !== speechGeneration) return;
    console.error("No se pudo generar la lectura en español.", error);
    resetSpeechButton();
    const detail = error instanceof Error ? ` ${error.message}` : "";
    setSpeechStatus(`No se pudo cargar o reproducir la voz local.${detail}`);
  }
}

window.toggleSpeech = function () {
  if (isSpeaking) {
    try {
      speechAudioSource?.stop();
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "InvalidStateError") {
        console.error("No se pudo detener el audio de lectura.", error);
      }
    }
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

  const voiceId = document.getElementById("speech-voice")?.value;
  if (!voiceId || !LOCAL_SPEECH_VOICES[voiceId]) {
    setSpeechStatus("Selecciona una voz en español para iniciar la lectura.");
    return;
  }

  speechGeneration += 1;
  isSpeaking = true;
  updateSpeechButton(true);
  setSpeechStatus("Cargando la voz local. La primera carga puede tardar.");
  speakNextChunk(speechGeneration, voiceId);
};

window.updateSpeechRate = function (value) {
  speechRate = Math.min(1.8, Math.max(0.5, parseFloat(value) || 1));
  const rateOutput = document.getElementById("speech-rate-value");
  if (rateOutput) rateOutput.textContent = `${speechRate.toFixed(1)}x`;
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
  document
    .getElementById("speech-voice")
    ?.addEventListener("change", () => {
      if (a11yPanelOpen) prepareSpeechVoice();
    });

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
