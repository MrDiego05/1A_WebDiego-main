import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // Static output — perfect for Netlify
  output: "static",
  // The toolbar is useful during Astro development, but must not overlap
  // the portfolio's bottom controls.
  devToolbar: { enabled: false },
  // Base URL (update this to your actual Netlify subdomain or custom domain)
  // site: "https://diegovizueta.netlify.app",
});
