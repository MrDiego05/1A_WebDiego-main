/**
 * contacto.js — Quick copy cards + Netlify form feedback.
 */

function fallbackCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }
  document.body.removeChild(area);
  return copied;
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      return fallbackCopy(text);
    }
  }
  return fallbackCopy(text);
}

export function initContacto() {
  const status = document.getElementById("contacto-copy-status");

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.getAttribute("data-copy") || "";
      const copied = await copyText(text);

      if (status) {
        status.textContent = copied
          ? `Copiado: ${text}`
          : `No se pudo copiar: ${text}`;
      }

      if (copied) {
        button.classList.add("is-copied");
        button.textContent = "¡Copiado!";
        window.setTimeout(() => {
          button.classList.remove("is-copied");
          button.textContent = "Copiar";
        }, 1800);
      } else {
      }
    });
  });

  // Netlify redirects back with ?enviado=1 after a successful submission.
  const params = new URLSearchParams(window.location.search);
  if (params.get("enviado") === "1") {
    const success = document.getElementById("form-success");
    if (success) success.hidden = false;
  }

  const form = document.getElementById("contacto-form");
  if (form) {
    form.addEventListener("submit", () => {
      const submit = form.querySelector('button[type="submit"]');
      if (submit) {
        submit.disabled = true;
        submit.textContent = "Enviando...";
      }
    });
  }
}
