import { fileURLToPath, URL } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "generateSW",
      registerType: "prompt",
      injectRegister: false,
      includeManifestIcons: false,
      manifest: {
        id: "/",
        name: "Thiqa Pocket",
        short_name: "Thiqa",
        description: "A bilingual wallet for clear everyday money management.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#0b2942",
        background_color: "#f5f8fa",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,woff,woff2,png,svg,webp}"],
        globIgnores: ["**/mock_data.json", "**/api/**"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [
          /^\/api(?:\/|$)/,
          /^\/mock_data\.json$/,
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === "/mock_data.json",
            handler: "NetworkOnly",
            method: "GET",
          },
          {
            urlPattern: ({ url }) =>
              url.pathname === "/api" || url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
            method: "GET",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
})
